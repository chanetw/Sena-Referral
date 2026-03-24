#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Migration 006: Upsert projects while preserving original project IDs.

Key points:
- Never TRUNCATE projects table
- Keep incoming project id as-is
- INSERT new rows / UPDATE existing rows by primary key id
- Reset AUTO_INCREMENT to MAX(id)+1 after apply
"""

from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
import mysql.connector

from config import DB_CONFIG, EXCEL_FILES


ALLOWED_PROJECT_TYPES = {"condo", "house", "townhome", "commercial"}
PROJECT_TYPE_ALIASES = {
    "home": "house",
    "shophouse": "commercial"
}


def parse_args() -> argparse.Namespace:
    default_excel = Path(EXCEL_FILES.get("projects", "docs/tbl_project_final.xlsx"))
    if not default_excel.exists():
        default_excel = Path("docs/tbl_project_final.xlsx")

    parser = argparse.ArgumentParser(
        description="Upsert projects from Excel while preserving project IDs"
    )
    parser.add_argument(
        "--excel",
        default=str(default_excel),
        help="Path to project Excel file (default: docs/tbl_project_final.xlsx)"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply changes to database (default is dry-run)"
    )
    return parser.parse_args()


def to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return False

    text = str(value).strip().lower()
    if text in {"1", "true", "yes", "y", "active", "ใช้งาน"}:
        return True
    if text in {"0", "false", "no", "n", "inactive", "ปิดใช้งาน"}:
        return False

    try:
        return bool(int(float(text)))
    except Exception:
        return False


def normalize_project_type(raw_value: Any) -> str:
    value = str(raw_value).strip().lower()
    if value in PROJECT_TYPE_ALIASES:
        value = PROJECT_TYPE_ALIASES[value]
    if value not in ALLOWED_PROJECT_TYPES:
        raise ValueError(
            f"project_type '{raw_value}' ไม่ถูกต้อง (allowed: {sorted(ALLOWED_PROJECT_TYPES)})"
        )
    return value


def validate_columns(df: pd.DataFrame) -> None:
    required_cols = {"id", "project_name", "project_type", "is_active"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"ไฟล์ Excel ขาดคอลัมน์ที่จำเป็น: {', '.join(sorted(missing))}")


def transform_rows(df: pd.DataFrame) -> list[dict[str, Any]]:
    transformed: list[dict[str, Any]] = []

    seen_ids: set[int] = set()
    for index, row in df.iterrows():
        row_no = index + 2  # header is row 1

        if pd.isna(row.get("id")):
            raise ValueError(f"Row {row_no}: id ว่าง")

        project_id = int(row["id"])
        if project_id <= 0:
            raise ValueError(f"Row {row_no}: id ต้องมากกว่า 0")
        if project_id in seen_ids:
            raise ValueError(f"Row {row_no}: พบ id ซ้ำในไฟล์ ({project_id})")
        seen_ids.add(project_id)

        project_name = str(row.get("project_name", "")).strip()
        if not project_name:
            raise ValueError(f"Row {row_no}: project_name ว่าง")

        project_type = normalize_project_type(row.get("project_type"))
        is_active = to_bool(row.get("is_active"))

        raw_project_code = row.get("project_code")
        if pd.isna(raw_project_code) or str(raw_project_code).strip() == "":
            project_code = f"PROJ{str(project_id).zfill(3)}"
        else:
            project_code = str(raw_project_code).strip()

        transformed.append({
            "id": project_id,
            "project_code": project_code,
            "project_name": project_name,
            "project_type": project_type,
            "is_active": is_active,
            "location": str(row["location"]).strip() if "location" in row and pd.notna(row["location"]) else None,
            "price_range_min": int(row["price_range_min"]) if "price_range_min" in row and pd.notna(row["price_range_min"]) else None,
            "price_range_max": int(row["price_range_max"]) if "price_range_max" in row and pd.notna(row["price_range_max"]) else None,
            "sales_team": str(row["sales_team"]).strip() if "sales_team" in row and pd.notna(row["sales_team"]) else None,
            "project_sale": str(row["project_sale"]).strip() if "project_sale" in row and pd.notna(row["project_sale"]) else None,
            "bud": int(row["bud"]) if "bud" in row and pd.notna(row["bud"]) else None,
        })

    return transformed


def dry_run_preview(rows: list[dict[str, Any]]) -> None:
    print("\n" + "=" * 80)
    print("DRY RUN: Preserve Project IDs")
    print("=" * 80)
    print(f"Total rows to process: {len(rows)}")
    print("Sample rows (first 5):")
    for item in rows[:5]:
        print(
            f"  id={item['id']} | code={item['project_code']} | "
            f"name={item['project_name']} | type={item['project_type']} | active={item['is_active']}"
        )


def apply_upsert(rows: list[dict[str, Any]]) -> None:
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM projects")
        existing_ids = {row[0] for row in cursor.fetchall()}

        sql = """
            INSERT INTO projects (
                id,
                project_code,
                project_name,
                project_type,
                location,
                price_range_min,
                price_range_max,
                sales_team,
                project_sale,
                bud,
                is_active,
                created_at,
                updated_at
            )
            VALUES (
                %(id)s,
                %(project_code)s,
                %(project_name)s,
                %(project_type)s,
                %(location)s,
                %(price_range_min)s,
                %(price_range_max)s,
                %(sales_team)s,
                %(project_sale)s,
                %(bud)s,
                %(is_active)s,
                NOW(),
                NOW()
            )
            ON DUPLICATE KEY UPDATE
                project_code = VALUES(project_code),
                project_name = VALUES(project_name),
                project_type = VALUES(project_type),
                location = VALUES(location),
                price_range_min = VALUES(price_range_min),
                price_range_max = VALUES(price_range_max),
                sales_team = VALUES(sales_team),
                project_sale = VALUES(project_sale),
                bud = VALUES(bud),
                is_active = VALUES(is_active),
                updated_at = NOW()
        """

        inserts = 0
        updates = 0

        for item in rows:
            if item["id"] in existing_ids:
                updates += 1
            else:
                inserts += 1
            cursor.execute(sql, item)

        cursor.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM projects")
        next_id = cursor.fetchone()[0]
        cursor.execute(f"ALTER TABLE projects AUTO_INCREMENT = {int(next_id)}")

        conn.commit()

        print("\n" + "=" * 80)
        print("APPLY COMPLETE: Preserve Project IDs")
        print("=" * 80)
        print(f"Inserted: {inserts}")
        print(f"Updated: {updates}")
        print(f"Total processed: {len(rows)}")
        print(f"AUTO_INCREMENT set to: {next_id}")

    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


def main() -> int:
    args = parse_args()
    excel_path = Path(args.excel)

    if not excel_path.exists():
        print(f"❌ ไม่พบไฟล์ Excel: {excel_path}")
        return 1

    print(f"📖 Reading Excel: {excel_path}")
    df = pd.read_excel(excel_path)
    validate_columns(df)
    rows = transform_rows(df)

    if not args.apply:
        dry_run_preview(rows)
        print("\n✅ Dry-run เสร็จแล้ว (ยังไม่เขียนฐานข้อมูล)")
        print("   หากต้องการเขียนจริง ให้รันเพิ่ม --apply")
        return 0

    apply_upsert(rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
