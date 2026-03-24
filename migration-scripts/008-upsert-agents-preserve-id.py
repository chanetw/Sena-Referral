#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import mysql.connector
import pandas as pd

from config import DB_CONFIG, EXCEL_FILES


LEGACY_AGENT_TYPE_CODE = 'legacy_unknown'
LEGACY_AGENT_TYPE_NAME = 'ไม่ระบุ (Agent เก่า)'
LEGACY_AGENT_TYPE_SORT = 99
ALLOWED_AGENT_STATUSES = {'active', 'inactive', 'suspended'}


def parse_args() -> argparse.Namespace:
    default_excel = Path(EXCEL_FILES.get('agents', 'docs/tbl_agent_clean_final.xlsx'))
    if not default_excel.exists():
        default_excel = Path('docs/tbl_agent_clean_final.xlsx')

    parser = argparse.ArgumentParser(
        description='Upsert agents from Excel while preserving original IDs'
    )
    parser.add_argument(
        '--excel',
        default=str(default_excel),
        help='Path to agents Excel file (default: docs/tbl_agent_clean_final.xlsx)'
    )
    parser.add_argument(
        '--apply',
        action='store_true',
        help='Apply changes to database (default is dry-run)'
    )
    return parser.parse_args()


def normalize_text(value: Any) -> str | None:
    if value is None or pd.isna(value):
        return None
    text = str(value).strip()
    return text or None


def normalize_datetime(value: Any):
    if value is None or pd.isna(value):
        return None
    return pd.to_datetime(value).to_pydatetime()


def normalize_status(value: Any) -> str:
    text = str(value or '').strip().lower()
    if text in ALLOWED_AGENT_STATUSES:
        return text
    return 'active'


def validate_columns(df: pd.DataFrame) -> None:
    required_cols = {'id_card', 'first_name', 'registration_date'}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"ไฟล์ Excel ขาดคอลัมน์ที่จำเป็น: {', '.join(sorted(missing))}")


def transform_rows(df: pd.DataFrame) -> list[dict[str, Any]]:
    rows_by_id_card: dict[str, dict[str, Any]] = {}
    seen_ids: set[int] = set()
    agent_code_to_id_card: dict[str, str] = {}
    duplicate_id_cards = 0

    for index, row in df.iterrows():
        row_no = index + 2

        agent_id = None
        if 'id' in row and pd.notna(row.get('id')):
            agent_id = int(row['id'])
            if agent_id <= 0:
                raise ValueError(f'Row {row_no}: id ต้องมากกว่า 0')
            if agent_id in seen_ids:
                raise ValueError(f'Row {row_no}: พบ id ซ้ำในไฟล์ ({agent_id})')
            seen_ids.add(agent_id)

        id_card = normalize_text(row.get('id_card'))
        if not id_card:
            raise ValueError(f'Row {row_no}: id_card ว่าง')

        agent_code = normalize_text(row.get('agent_code'))
        if agent_code:
            existing_card = agent_code_to_id_card.get(agent_code)
            if existing_card and existing_card != id_card:
                raise ValueError(f'Row {row_no}: พบ agent_code ซ้ำในไฟล์ ({agent_code})')
            agent_code_to_id_card[agent_code] = id_card

        first_name = normalize_text(row.get('first_name'))
        if not first_name:
            raise ValueError(f'Row {row_no}: first_name ว่าง')

        if id_card in rows_by_id_card:
            duplicate_id_cards += 1

        rows_by_id_card[id_card] = {
            'id': agent_id,
            'user_id': int(row['user_id']) if 'user_id' in row and pd.notna(row['user_id']) else None,
            'agent_code': agent_code,
            'agent_id_card': id_card,
            'id_card': id_card,
            'first_name': first_name,
            'last_name': normalize_text(row.get('last_name')) or '',
            'phone': normalize_text(row.get('phone')),
            'email': normalize_text(row.get('email')),
            'address': normalize_text(row.get('address')),
            'registration_date': normalize_datetime(row.get('registration_date')),
            'status': normalize_status(row.get('status')),
            'created_at': normalize_datetime(row.get('created_at')),
            'updated_at': normalize_datetime(row.get('updated_at')),
        }

    if duplicate_id_cards:
        print(f'⚠️  พบ id_card ซ้ำในไฟล์ {duplicate_id_cards} แถว และจะใช้ข้อมูลแถวล่าสุด')

    return list(rows_by_id_card.values())


def dry_run_preview(rows: list[dict[str, Any]]) -> None:
    print('\n' + '=' * 80)
    print('DRY RUN: Preserve Agent IDs')
    print('=' * 80)
    print(f'Total rows to process: {len(rows)}')
    print('Sample rows (first 5):')
    for item in rows[:5]:
        print(
            f"  id={item['id']} | user_id={item['user_id']} | code={item['agent_code']} | "
            f"name={item['first_name']} {item['last_name']} | status={item['status']}"
        )


def ensure_legacy_agent_type(cursor) -> int:
    cursor.execute(
        """
        INSERT INTO agent_types (code, name_th, is_active, sort_order, created_at, updated_at)
        VALUES (%s, %s, 1, %s, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            name_th = VALUES(name_th),
            is_active = VALUES(is_active),
            sort_order = VALUES(sort_order),
            updated_at = NOW()
        """,
        (LEGACY_AGENT_TYPE_CODE, LEGACY_AGENT_TYPE_NAME, LEGACY_AGENT_TYPE_SORT)
    )
    cursor.execute('SELECT id FROM agent_types WHERE code = %s LIMIT 1', (LEGACY_AGENT_TYPE_CODE,))
    result = cursor.fetchone()
    if not result:
        raise ValueError('ไม่สามารถสร้าง agent type กลางสำหรับ agent เก่าได้')
    return int(result[0])


def build_user_lookup(cursor) -> dict[str, int]:
    cursor.execute('SELECT id, email FROM users')
    rows = cursor.fetchall()
    return {
        str(email).strip().lower(): int(user_id)
        for user_id, email in rows
        if email
    }


def validate_existing_conflicts(cursor, rows: list[dict[str, Any]]) -> None:
    cursor.execute('SELECT id, agent_code, id_card FROM agents')
    existing = cursor.fetchall()
    code_to_id = {str(agent_code).strip(): agent_id for agent_id, agent_code, _ in existing if agent_code}
    id_card_to_id = {str(id_card).strip(): agent_id for agent_id, _, id_card in existing if id_card}

    for item in rows:
        existing_id = code_to_id.get(item['agent_code']) if item['agent_code'] else None
        if item['id'] is not None and existing_id is not None and int(existing_id) != item['id']:
            raise ValueError(
                f"พบ agent_code ชนกับ id เดิมในฐานข้อมูล: {item['agent_code']} (db id={existing_id}, excel id={item['id']})"
            )

        existing_id = id_card_to_id.get(item['id_card'])
        if item['id'] is not None and existing_id is not None and int(existing_id) != item['id']:
            raise ValueError(
                f"พบ id_card ชนกับ id เดิมในฐานข้อมูล: {item['id_card']} (db id={existing_id}, excel id={item['id']})"
            )


def get_next_agent_code(cursor) -> str:
    cursor.execute("SELECT agent_code FROM agents WHERE agent_code REGEXP '^AG[0-9]+$' ORDER BY CAST(SUBSTRING(agent_code, 3) AS UNSIGNED) DESC LIMIT 1")
    row = cursor.fetchone()
    next_number = 1
    if row and row[0]:
      next_number = int(str(row[0])[2:]) + 1
    return f"AG{str(next_number).zfill(3)}"


def apply_upsert(rows: list[dict[str, Any]]) -> None:
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        legacy_agent_type_id = ensure_legacy_agent_type(cursor)
        user_lookup = build_user_lookup(cursor)
        validate_existing_conflicts(cursor, rows)

        cursor.execute('SELECT id, id_card, agent_code FROM agents')
        existing_rows = cursor.fetchall()
        existing_ids = {row[0] for row in existing_rows}
        existing_id_cards = {str(id_card).strip(): {'id': agent_id, 'agent_code': agent_code} for agent_id, id_card, agent_code in existing_rows if id_card}

        insert_sql_with_id = """
            INSERT INTO agents (
                id,
                user_id,
                agent_type_id,
                agent_code,
                agent_id_card,
                id_card,
                first_name,
                last_name,
                phone,
                address,
                registration_date,
                status,
                created_at,
                updated_at,
                email
            )
            VALUES (
                %(id)s,
                %(user_id)s,
                %(agent_type_id)s,
                %(agent_code)s,
                %(agent_id_card)s,
                %(id_card)s,
                %(first_name)s,
                %(last_name)s,
                %(phone)s,
                %(address)s,
                %(registration_date)s,
                %(status)s,
                COALESCE(%(created_at)s, NOW()),
                COALESCE(%(updated_at)s, NOW()),
                %(email)s
            )
            ON DUPLICATE KEY UPDATE
                user_id = VALUES(user_id),
                agent_type_id = VALUES(agent_type_id),
                agent_code = VALUES(agent_code),
                agent_id_card = VALUES(agent_id_card),
                id_card = VALUES(id_card),
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                phone = VALUES(phone),
                address = VALUES(address),
                registration_date = VALUES(registration_date),
                status = VALUES(status),
                email = VALUES(email),
                updated_at = COALESCE(VALUES(updated_at), NOW())
        """

        insert_sql_without_id = """
            INSERT INTO agents (
                user_id,
                agent_type_id,
                agent_code,
                agent_id_card,
                id_card,
                first_name,
                last_name,
                phone,
                address,
                registration_date,
                status,
                created_at,
                updated_at,
                email
            )
            VALUES (
                %(user_id)s,
                %(agent_type_id)s,
                %(agent_code)s,
                %(agent_id_card)s,
                %(id_card)s,
                %(first_name)s,
                %(last_name)s,
                %(phone)s,
                %(address)s,
                %(registration_date)s,
                %(status)s,
                COALESCE(%(created_at)s, NOW()),
                COALESCE(%(updated_at)s, NOW()),
                %(email)s
            )
        """

        update_sql = """
            UPDATE agents
            SET user_id = %(user_id)s,
                agent_type_id = %(agent_type_id)s,
                agent_code = %(agent_code)s,
                agent_id_card = %(agent_id_card)s,
                id_card = %(id_card)s,
                first_name = %(first_name)s,
                last_name = %(last_name)s,
                phone = %(phone)s,
                address = %(address)s,
                registration_date = %(registration_date)s,
                status = %(status)s,
                email = %(email)s,
                updated_at = COALESCE(%(updated_at)s, NOW())
            WHERE id = %(resolved_id)s
        """

        inserts = 0
        updates = 0

        for item in rows:
            resolved_user_id = item['user_id']
            if resolved_user_id is None and item['email']:
                resolved_user_id = user_lookup.get(item['email'].lower())

            existing_agent = existing_id_cards.get(item['id_card'])
            resolved_id = item['id'] if item['id'] is not None else (existing_agent['id'] if existing_agent else None)
            resolved_code = item['agent_code'] or (existing_agent['agent_code'] if existing_agent and existing_agent['agent_code'] else get_next_agent_code(cursor))

            payload = {
                **item,
                'resolved_id': resolved_id,
                'user_id': resolved_user_id,
                'agent_type_id': legacy_agent_type_id,
                'agent_code': resolved_code,
            }

            if resolved_id is not None and resolved_id in existing_ids:
                updates += 1
                cursor.execute(update_sql, payload)
            else:
                inserts += 1
                if item['id'] is not None:
                    cursor.execute(insert_sql_with_id, payload)
                else:
                    cursor.execute(insert_sql_without_id, payload)

        cursor.execute('SELECT COALESCE(MAX(id), 0) + 1 FROM agents')
        next_id = cursor.fetchone()[0]
        cursor.execute(f'ALTER TABLE agents AUTO_INCREMENT = {int(next_id)}')

        conn.commit()

        print('\n' + '=' * 80)
        print('APPLY COMPLETE: Preserve Agent IDs')
        print('=' * 80)
        print(f'Fallback agent_type_id: {legacy_agent_type_id} ({LEGACY_AGENT_TYPE_CODE})')
        print(f'Inserted: {inserts}')
        print(f'Updated: {updates}')
        print(f'Total processed: {len(rows)}')
        print(f'AUTO_INCREMENT set to: {next_id}')

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
        print(f'❌ ไม่พบไฟล์ Excel: {excel_path}')
        return 1

    print(f'📖 Reading Excel: {excel_path}')
    df = pd.read_excel(excel_path)
    validate_columns(df)
    rows = transform_rows(df)

    if not args.apply:
        dry_run_preview(rows)
        print(f'\nℹ️  Agent เก่าจะถูกผูกกับ agent type กลาง: {LEGACY_AGENT_TYPE_NAME}')
        print('✅ Dry-run เสร็จแล้ว (ยังไม่เขียนฐานข้อมูล)')
        print('   หากต้องการเขียนจริง ให้รันเพิ่ม --apply')
        return 0

    apply_upsert(rows)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())