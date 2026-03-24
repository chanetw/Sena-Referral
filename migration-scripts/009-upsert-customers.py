#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Any

import mysql.connector
import pandas as pd

from config import DB_CONFIG, EXCEL_FILES


STATUS_MAP = {
    'active': 'approved',
    'inactive': 'duplicate',
    'pending': 'pending',
}

DEFAULT_AGENT_MAP_PATH = Path(__file__).with_name('customer-agent-id-card-overrides.csv')
DEFAULT_PLACEHOLDER_AGENT_IDS_PATH = Path(__file__).with_name('customer-placeholder-agent-id-cards.csv')


def parse_args() -> argparse.Namespace:
    default_excel = Path(EXCEL_FILES.get('customers', 'docs/ag_customer_final.xlsx'))
    if not default_excel.exists():
        default_excel = Path('docs/ag_customer_final.xlsx')

    parser = argparse.ArgumentParser(
        description='Upsert customers from Excel using current schema mapping'
    )
    parser.add_argument(
        '--excel',
        default=str(default_excel),
        help='Path to customers Excel file (default: docs/ag_customer_final.xlsx)'
    )
    parser.add_argument(
        '--apply',
        action='store_true',
        help='Apply changes to database (default is dry-run)'
    )
    parser.add_argument(
        '--agent-map',
        default=str(DEFAULT_AGENT_MAP_PATH) if DEFAULT_AGENT_MAP_PATH.exists() else None,
        help='CSV file for source_agent_id_card -> target_agent_id_card overrides'
    )
    parser.add_argument(
        '--placeholder-agent-ids',
        default=str(DEFAULT_PLACEHOLDER_AGENT_IDS_PATH) if DEFAULT_PLACEHOLDER_AGENT_IDS_PATH.exists() else None,
        help='CSV file containing placeholder/test agent_id_card values to skip'
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


def normalize_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None or pd.isna(value):
        return False
    text = str(value).strip().lower()
    if text in {'1', 'true', 'yes', 'y'}:
        return True
    if text in {'0', 'false', 'no', 'n'}:
        return False
    try:
        return bool(int(float(text)))
    except Exception:
        return False


def normalize_decimal(value: Any):
    if value is None or pd.isna(value):
        return None
    return float(value)


def normalize_id_card(value: Any) -> str | None:
    text = normalize_text(value)
    if not text:
        return None

    digits_only = re.sub(r'\D', '', text)
    if len(digits_only) != 13:
        return None
    return digits_only


def normalize_status(value: Any) -> str:
    raw = str(value or '').strip().lower()
    return STATUS_MAP.get(raw, 'pending')


def load_agent_id_card_overrides(path_str: str | None) -> dict[str, str]:
    if not path_str:
        return {}

    path = Path(path_str)
    if not path.exists():
        raise ValueError(f'ไม่พบไฟล์ agent map: {path}')

    df = pd.read_csv(path)
    required_cols = {'source_agent_id_card', 'target_agent_id_card'}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"ไฟล์ agent map ขาดคอลัมน์: {', '.join(sorted(missing))}")

    overrides: dict[str, str] = {}
    for _, row in df.iterrows():
        source = normalize_text(row.get('source_agent_id_card'))
        target = normalize_text(row.get('target_agent_id_card'))
        if not source or not target:
            continue
        overrides[source] = target
    return overrides


def load_placeholder_agent_id_cards(path_str: str | None) -> set[str]:
    if not path_str:
        return set()

    path = Path(path_str)
    if not path.exists():
        raise ValueError(f'ไม่พบไฟล์ placeholder agent ids: {path}')

    df = pd.read_csv(path)
    if 'agent_id_card' not in df.columns:
        raise ValueError('ไฟล์ placeholder agent ids ต้องมีคอลัมน์ agent_id_card')

    return {
        value
        for value in (normalize_text(item) for item in df['agent_id_card'].tolist())
        if value
    }


def get_agent_id_card_column(df: pd.DataFrame) -> str:
    matches = [column for column in df.columns if 'agent_id_card' in str(column)]
    if not matches:
        raise ValueError('ไม่พบคอลัมน์ agent_id_card ในไฟล์ Excel')
    return matches[0]


def validate_columns(df: pd.DataFrame) -> str:
    required_cols = {'first_name', 'last_name', 'project_id', 'status'}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"ไฟล์ Excel ขาดคอลัมน์ที่จำเป็น: {', '.join(sorted(missing))}")
    return get_agent_id_card_column(df)


def build_dedupe_key(row: dict[str, Any]) -> str:
    if row['id_card']:
        return f"id_card::{row['id_card']}::{row['project_id']}::{row['agent_id_card']}"
    if row['email']:
        return f"email::{row['email'].lower()}::{row['project_id']}::{row['agent_id_card']}"
    if row['phone']:
        return f"phone::{row['phone']}::{row['project_id']}::{row['agent_id_card']}::{row['first_name']}::{row['last_name']}"
    return f"name::{row['first_name']}::{row['last_name']}::{row['project_id']}::{row['agent_id_card']}"


def transform_rows(
    df: pd.DataFrame,
    agent_id_card_column: str,
    agent_id_overrides: dict[str, str],
    placeholder_agent_ids: set[str],
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    rows_by_key: dict[str, dict[str, Any]] = {}
    duplicate_rows = 0
    mapped_agent_ids = 0
    skipped_placeholder_rows = 0
    sanitized_invalid_id_cards = 0

    for index, raw_row in df.iterrows():
        row_no = index + 2

        first_name = normalize_text(raw_row.get('first_name'))
        last_name = normalize_text(raw_row.get('last_name'))
        if not first_name or not last_name:
            raise ValueError(f'Row {row_no}: first_name/last_name ว่าง')

        project_id = raw_row.get('project_id')
        if pd.isna(project_id):
            raise ValueError(f'Row {row_no}: project_id ว่าง')

        source_agent_id_card = normalize_text(raw_row.get(agent_id_card_column))
        if not source_agent_id_card:
            raise ValueError(f'Row {row_no}: agent_id_card ว่าง')

        if source_agent_id_card in placeholder_agent_ids:
            skipped_placeholder_rows += 1
            continue

        agent_id_card = agent_id_overrides.get(source_agent_id_card, source_agent_id_card)
        if agent_id_card != source_agent_id_card:
            mapped_agent_ids += 1

        customer = {
            'legacy_id': int(raw_row['id']) if 'id' in raw_row and pd.notna(raw_row.get('id')) else None,
            'customer_code': normalize_text(raw_row.get('customer_code')),
            'first_name': first_name,
            'last_name': last_name,
            'phone': normalize_text(raw_row.get('phone')),
            'id_card': normalize_id_card(raw_row.get('id_card')),
            'email': normalize_text(raw_row.get('email')),
            'project_id': int(project_id),
            'budget_min': normalize_decimal(raw_row.get('budget_min')),
            'budget_max': normalize_decimal(raw_row.get('budget_max')),
            'status': normalize_status(raw_row.get('status')),
            'source': normalize_text(raw_row.get('source')) or 'referral',
            'notes': normalize_text(raw_row.get('notes')),
            'address': normalize_text(raw_row.get('address')),
            'registration_date': normalize_datetime(raw_row.get('registration_date')),
            'is_duplicate': normalize_bool(raw_row.get('is_duplicate')),
            'duplicate_lead_id': normalize_text(raw_row.get('duplicate_lead_id')),
            'source_agent_id_card': source_agent_id_card,
            'agent_id_card': agent_id_card,
            'created_at': normalize_datetime(raw_row.get('created_at')),
            'updated_at': normalize_datetime(raw_row.get('updated_at')),
        }

        raw_id_card = normalize_text(raw_row.get('id_card'))
        if raw_id_card and customer['id_card'] is None:
            sanitized_invalid_id_cards += 1

        dedupe_key = build_dedupe_key(customer)
        if dedupe_key in rows_by_key:
            duplicate_rows += 1
        rows_by_key[dedupe_key] = customer

    if duplicate_rows:
        print(f'⚠️  พบลูกค้าซ้ำในไฟล์ {duplicate_rows} แถว และจะใช้ข้อมูลแถวล่าสุด')

    return list(rows_by_key.values()), {
        'duplicate_rows': duplicate_rows,
        'mapped_agent_ids': mapped_agent_ids,
        'skipped_placeholder_rows': skipped_placeholder_rows,
        'sanitized_invalid_id_cards': sanitized_invalid_id_cards,
    }


def dry_run_preview(rows: list[dict[str, Any]], stats: dict[str, int]) -> None:
    print('\n' + '=' * 80)
    print('DRY RUN: Customer Import Preview')
    print('=' * 80)
    print(f'Total rows to process: {len(rows)}')
    print(f"Mapped agent_id_card overrides: {stats['mapped_agent_ids']}")
    print(f"Skipped placeholder/test rows: {stats['skipped_placeholder_rows']}")
    print(f"Sanitized invalid customer id_card values: {stats['sanitized_invalid_id_cards']}")
    print('Sample rows (first 5):')
    for item in rows[:5]:
        print(
            f"  name={item['first_name']} {item['last_name']} | project_id={item['project_id']} | "
            f"status={item['status']} | agent_id_card={item['agent_id_card']}"
        )


def build_agent_lookup(cursor) -> dict[str, dict[str, Any]]:
    cursor.execute('SELECT id, id_card, agent_code FROM agents')
    rows = cursor.fetchall()
    return {
        str(id_card).strip(): {'id': int(agent_id), 'agent_code': agent_code}
        for agent_id, id_card, agent_code in rows
        if id_card
    }


def build_project_lookup(cursor) -> set[int]:
    cursor.execute('SELECT id FROM projects')
    return {int(row[0]) for row in cursor.fetchall()}


def build_existing_customer_lookup(cursor) -> dict[str, dict[str, Any]]:
    cursor.execute(
        '''
        SELECT id, first_name, last_name, phone, id_card, email, project_id, agent_id
        FROM customers
        '''
    )
    existing = {}
    for row in cursor.fetchall():
        customer_id, first_name, last_name, phone, id_card, email, project_id, agent_id = row
        key = build_dedupe_key({
            'id_card': str(id_card).strip() if id_card else None,
            'email': str(email).strip().lower() if email else None,
            'phone': str(phone).strip() if phone else None,
            'first_name': str(first_name).strip(),
            'last_name': str(last_name).strip(),
            'project_id': int(project_id) if project_id is not None else None,
            'agent_id_card': str(agent_id),
        })
        existing[key] = {'id': int(customer_id)}
    return existing


def apply_upsert(rows: list[dict[str, Any]]) -> None:
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        agent_lookup = build_agent_lookup(cursor)
        project_ids = build_project_lookup(cursor)

        resolved_rows: list[dict[str, Any]] = []
        skipped_missing_agent = 0
        skipped_missing_project = 0

        for item in rows:
            agent = agent_lookup.get(item['agent_id_card'])
            if not agent:
                skipped_missing_agent += 1
                continue
            if item['project_id'] not in project_ids:
                skipped_missing_project += 1
                continue

            resolved_rows.append({
                **item,
                'agent_id': agent['id'],
            })

        existing_lookup = build_existing_customer_lookup(cursor)

        insert_sql = """
            INSERT INTO customers (
                customer_code,
                agent_id,
                first_name,
                last_name,
                phone,
                id_card,
                email,
                project_id,
                budget_min,
                budget_max,
                status,
                source,
                notes,
                address,
                registration_date,
                is_duplicate,
                created_at,
                updated_at
            )
            VALUES (
                %(customer_code)s,
                %(agent_id)s,
                %(first_name)s,
                %(last_name)s,
                %(phone)s,
                %(id_card)s,
                %(email)s,
                %(project_id)s,
                %(budget_min)s,
                %(budget_max)s,
                %(status)s,
                %(source)s,
                %(notes)s,
                %(address)s,
                %(registration_date)s,
                %(is_duplicate)s,
                COALESCE(%(created_at)s, NOW()),
                COALESCE(%(updated_at)s, NOW())
            )
        """

        update_sql = """
            UPDATE customers
            SET customer_code = %(customer_code)s,
                agent_id = %(agent_id)s,
                first_name = %(first_name)s,
                last_name = %(last_name)s,
                phone = %(phone)s,
                id_card = %(id_card)s,
                email = %(email)s,
                project_id = %(project_id)s,
                budget_min = %(budget_min)s,
                budget_max = %(budget_max)s,
                status = %(status)s,
                source = %(source)s,
                notes = %(notes)s,
                address = %(address)s,
                registration_date = %(registration_date)s,
                is_duplicate = %(is_duplicate)s,
                updated_at = COALESCE(%(updated_at)s, NOW())
            WHERE id = %(resolved_id)s
        """

        inserts = 0
        updates = 0

        for item in resolved_rows:
            existing_key = build_dedupe_key({
                'id_card': item['id_card'],
                'email': item['email'].lower() if item['email'] else None,
                'phone': item['phone'],
                'first_name': item['first_name'],
                'last_name': item['last_name'],
                'project_id': item['project_id'],
                'agent_id_card': str(item['agent_id']),
            })
            existing_customer = existing_lookup.get(existing_key)

            payload = {
                **item,
                'resolved_id': existing_customer['id'] if existing_customer else None,
            }

            if existing_customer:
                updates += 1
                cursor.execute(update_sql, payload)
            else:
                inserts += 1
                cursor.execute(insert_sql, payload)

        conn.commit()

        print('\n' + '=' * 80)
        print('APPLY COMPLETE: Customer Import')
        print('=' * 80)
        print(f'Inserted: {inserts}')
        print(f'Updated: {updates}')
        print(f'Skipped missing agent: {skipped_missing_agent}')
        print(f'Skipped missing project: {skipped_missing_project}')
        print(f'Total resolved rows: {len(resolved_rows)}')

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
    agent_id_card_column = validate_columns(df)
    agent_id_overrides = load_agent_id_card_overrides(args.agent_map)
    placeholder_agent_ids = load_placeholder_agent_id_cards(args.placeholder_agent_ids)
    rows, stats = transform_rows(df, agent_id_card_column, agent_id_overrides, placeholder_agent_ids)

    if not args.apply:
        dry_run_preview(rows, stats)
        print('\nℹ️  Status mapping: active -> approved, inactive -> duplicate, pending -> pending')
        if args.agent_map:
            print(f'ℹ️  ใช้ agent map: {args.agent_map}')
        if args.placeholder_agent_ids:
            print(f'ℹ️  ใช้ placeholder agent ids: {args.placeholder_agent_ids}')
        print('✅ Dry-run เสร็จแล้ว (ยังไม่เขียนฐานข้อมูล)')
        print('   หากต้องการเขียนจริง ให้รันเพิ่ม --apply')
        return 0

    apply_upsert(rows)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())