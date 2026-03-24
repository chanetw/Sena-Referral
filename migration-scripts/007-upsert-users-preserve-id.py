#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import mysql.connector
import pandas as pd

from config import DB_CONFIG, EXCEL_FILES


ALLOWED_ROLES = {'admin', 'agent', 'manager'}


def parse_args() -> argparse.Namespace:
    default_excel = Path(EXCEL_FILES.get('users', 'docs/ag_user_final.xlsx'))
    if not default_excel.exists():
        default_excel = Path('docs/ag_user_final.xlsx')

    parser = argparse.ArgumentParser(
        description='Upsert users from Excel while preserving original IDs'
    )
    parser.add_argument(
        '--excel',
        default=str(default_excel),
        help='Path to users Excel file (default: docs/ag_user_final.xlsx)'
    )
    parser.add_argument(
        '--apply',
        action='store_true',
        help='Apply changes to database (default is dry-run)'
    )
    return parser.parse_args()


def normalize_role(value: Any) -> str:
    role = str(value).strip().lower()
    if role not in ALLOWED_ROLES:
        return 'agent'
    return role


def to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return False

    text = str(value).strip().lower()
    if text in {'1', 'true', 'yes', 'y', 'active'}:
        return True
    if text in {'0', 'false', 'no', 'n', 'inactive'}:
        return False

    try:
        return bool(int(float(text)))
    except Exception:
        return False


def hash_password(raw_password: Any) -> str:
    import bcrypt

    password = str(raw_password or '').strip()
    if not password:
        raise ValueError('password ว่าง')
    if password.startswith('$2a$') or password.startswith('$2b$') or password.startswith('$2y$'):
        return password
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')


def normalize_datetime(value: Any):
    if value is None or pd.isna(value):
        return None
    return pd.to_datetime(value).to_pydatetime()


def validate_columns(df: pd.DataFrame) -> None:
    required_cols = {'email', 'password'}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"ไฟล์ Excel ขาดคอลัมน์ที่จำเป็น: {', '.join(sorted(missing))}")


def transform_rows(df: pd.DataFrame) -> list[dict[str, Any]]:
    rows_by_email: dict[str, dict[str, Any]] = {}
    seen_ids: set[int] = set()
    duplicate_emails = 0

    for index, row in df.iterrows():
        row_no = index + 2

        user_id = None
        if 'id' in row and pd.notna(row.get('id')):
            user_id = int(row['id'])
            if user_id <= 0:
                raise ValueError(f'Row {row_no}: id ต้องมากกว่า 0')
            if user_id in seen_ids:
                raise ValueError(f'Row {row_no}: พบ id ซ้ำในไฟล์ ({user_id})')
            seen_ids.add(user_id)

        email = str(row.get('email', '')).strip().lower()
        if not email:
            raise ValueError(f'Row {row_no}: email ว่าง')

        if email in rows_by_email:
            duplicate_emails += 1

        rows_by_email[email] = {
            'id': user_id,
            'email': email,
            'password_raw': row.get('password'),
            'role': normalize_role(row.get('role')),
            'is_active': to_bool(row.get('is_active')),
            'bud': str(row['bud']).strip() if 'bud' in row and pd.notna(row['bud']) else None,
            'name': str(row['name']).strip() if 'name' in row and pd.notna(row['name']) else None,
            'created_at': normalize_datetime(row.get('created_at')),
            'updated_at': normalize_datetime(row.get('updated_at')),
        }

    if duplicate_emails:
        print(f'⚠️  พบ email ซ้ำในไฟล์ {duplicate_emails} แถว และจะใช้ข้อมูลแถวล่าสุด')

    return list(rows_by_email.values())


def dry_run_preview(rows: list[dict[str, Any]]) -> None:
    print('\n' + '=' * 80)
    print('DRY RUN: Preserve User IDs')
    print('=' * 80)
    print(f'Total rows to process: {len(rows)}')
    print('Sample rows (first 5):')
    for item in rows[:5]:
        print(
            f"  id={item['id']} | email={item['email']} | role={item['role']} | "
            f"active={item['is_active']} | bud={item['bud']}"
        )


def validate_existing_conflicts(cursor, rows: list[dict[str, Any]]) -> None:
    cursor.execute('SELECT id, email FROM users')
    existing = cursor.fetchall()
    email_to_id = {str(email).strip().lower(): user_id for user_id, email in existing if email}

    for item in rows:
        existing_id = email_to_id.get(item['email'])
        if item['id'] is not None and existing_id is not None and int(existing_id) != item['id']:
            raise ValueError(
                f"พบ email ชนกับ id เดิมในฐานข้อมูล: {item['email']} (db id={existing_id}, excel id={item['id']})"
            )


def apply_upsert(rows: list[dict[str, Any]]) -> None:
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        validate_existing_conflicts(cursor, rows)

        cursor.execute('SELECT id, email FROM users')
        existing_rows = cursor.fetchall()
        existing_ids = {row[0] for row in existing_rows}
        existing_emails = {str(email).strip().lower() for _, email in existing_rows if email}

        sql_with_id = """
            INSERT INTO users (
                id,
                email,
                password,
                role,
                is_active,
                bud,
                name,
                created_at,
                updated_at
            )
            VALUES (
                %(id)s,
                %(email)s,
                %(password)s,
                %(role)s,
                %(is_active)s,
                %(bud)s,
                %(name)s,
                COALESCE(%(created_at)s, NOW()),
                COALESCE(%(updated_at)s, NOW())
            )
            ON DUPLICATE KEY UPDATE
                email = VALUES(email),
                password = VALUES(password),
                role = VALUES(role),
                is_active = VALUES(is_active),
                bud = VALUES(bud),
                name = VALUES(name),
                updated_at = COALESCE(VALUES(updated_at), NOW())
        """

        sql_without_id = """
            INSERT INTO users (
                email,
                password,
                role,
                is_active,
                bud,
                name,
                created_at,
                updated_at
            )
            VALUES (
                %(email)s,
                %(password)s,
                %(role)s,
                %(is_active)s,
                %(bud)s,
                %(name)s,
                COALESCE(%(created_at)s, NOW()),
                COALESCE(%(updated_at)s, NOW())
            )
            ON DUPLICATE KEY UPDATE
                password = VALUES(password),
                role = VALUES(role),
                is_active = VALUES(is_active),
                bud = VALUES(bud),
                name = VALUES(name),
                updated_at = COALESCE(VALUES(updated_at), NOW())
        """

        inserts = 0
        updates = 0

        for item in rows:
            payload = {
                **item,
                'password': hash_password(item['password_raw'])
            }

            if item['email'] in existing_emails:
                updates += 1
            else:
                inserts += 1
            if item['id'] is not None:
                cursor.execute(sql_with_id, payload)
            else:
                cursor.execute(sql_without_id, payload)

        cursor.execute('SELECT COALESCE(MAX(id), 0) + 1 FROM users')
        next_id = cursor.fetchone()[0]
        cursor.execute(f'ALTER TABLE users AUTO_INCREMENT = {int(next_id)}')

        conn.commit()

        print('\n' + '=' * 80)
        print('APPLY COMPLETE: Preserve User IDs')
        print('=' * 80)
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
        print('\n✅ Dry-run เสร็จแล้ว (ยังไม่เขียนฐานข้อมูล)')
        print('   หากต้องการเขียนจริง ให้รันเพิ่ม --apply')
        return 0

    apply_upsert(rows)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())