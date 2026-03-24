#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script 2: Migrate Users
Migrate 1,038 users จาก Excel ไป MySQL พร้อม hash passwords
"""

import pandas as pd
import mysql.connector
import bcrypt
from datetime import datetime
from config import DB_CONFIG, EXCEL_FILES, MIGRATION_CONFIG, EXPECTED_COUNTS
import os

def hash_password(plain_password):
    """Hash password using bcrypt"""
    try:
        salt = bcrypt.gensalt(rounds=10)
        hashed = bcrypt.hashpw(plain_password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        print(f"      ⚠️  Hash error: {e}")
        return None

def migrate_users():
    """Migrate users from Excel to MySQL"""

    print("\n" + "="*80)
    print("👥 STEP 2: MIGRATE USERS")
    print("="*80)

    try:
        # Read Excel file
        print(f"\n📖 Reading Excel: {EXCEL_FILES['users']}")
        df = pd.read_excel(EXCEL_FILES['users'])

        print(f"   Total rows: {len(df)}")
        print(f"   Columns: {', '.join(df.columns.tolist())}")

        # Connect to database
        print(f"\n🔌 Connecting to database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Clear existing users if configured
        if MIGRATION_CONFIG['clear_tables']:
            print(f"\n🗑️  Clearing existing users...")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            cursor.execute("TRUNCATE TABLE users")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            print(f"   ✅ Users table cleared")

        # Counters
        success_count = 0
        error_count = 0
        errors = []

        # For storing mapping
        user_mapping = {}  # {email: user_id}

        print(f"\n🔄 Migrating users (with password hashing)...")
        print(f"   ⏳ This may take a few minutes...")

        for index, row in df.iterrows():
            try:
                # Hash password (plain text from Excel)
                plain_password = str(row['password'])
                hashed_password = hash_password(plain_password)

                if not hashed_password:
                    raise Exception("Password hashing failed")

                # Prepare data
                data = {
                    'email': row['email'],
                    'password': hashed_password,
                    'role': row['role'],
                    'is_active': bool(row['is_active']),
                    'created_at': datetime.now(),
                    'updated_at': datetime.now()
                }

                # Skip if dry run
                if MIGRATION_CONFIG['dry_run']:
                    print(f"   [DRY RUN] Would insert: {data['email']} (role: {data['role']})")
                    success_count += 1
                    continue

                # Insert into database
                sql = """
                INSERT INTO users
                (email, password, role, is_active, created_at, updated_at)
                VALUES (%(email)s, %(password)s, %(role)s, %(is_active)s,
                        %(created_at)s, %(updated_at)s)
                """

                cursor.execute(sql, data)

                # Get inserted user_id
                user_id = cursor.lastrowid
                user_mapping[row['email']] = user_id

                success_count += 1

                # Progress indicator
                if (index + 1) % 100 == 0:
                    print(f"   Progress: {index + 1}/{len(df)} users... ({success_count} hashed)")

            except Exception as e:
                error_count += 1
                error_msg = f"Row {index + 1} ({row.get('email', 'N/A')}): {str(e)}"
                errors.append(error_msg)
                print(f"   ❌ {error_msg}")

        # Commit if not dry run
        if not MIGRATION_CONFIG['dry_run']:
            conn.commit()

            # Save user mapping to CSV for agents migration
            mapping_file = os.path.join(os.path.dirname(__file__), 'user_mapping.csv')
            mapping_df = pd.DataFrame(
                list(user_mapping.items()),
                columns=['email', 'user_id']
            )
            mapping_df.to_csv(mapping_file, index=False)
            print(f"\n💾 User mapping saved: {mapping_file}")

        cursor.close()
        conn.close()

        # Summary
        print(f"\n📊 Migration Summary:")
        print(f"   ✅ Success: {success_count}")
        print(f"   ❌ Errors: {error_count}")
        print(f"   📈 Total: {len(df)}")
        print(f"   🔐 Passwords hashed: {success_count}")

        # Validate count
        expected = EXPECTED_COUNTS['users']
        if success_count == expected:
            print(f"\n✅ Count validation passed: {success_count} = {expected}")
        else:
            print(f"\n⚠️  Count mismatch: {success_count} != {expected}")

        # Show errors
        if errors:
            print(f"\n⚠️  Errors encountered:")
            for err in errors[:10]:  # Show first 10
                print(f"   - {err}")
            if len(errors) > 10:
                print(f"   ... and {len(errors) - 10} more errors")

        return success_count, error_count

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return 0, 0

def main():
    """Main function"""
    print("\n🚀 Starting users migration...")

    success, errors = migrate_users()

    if errors == 0 and success > 0:
        print("\n" + "="*80)
        print("✅ USERS MIGRATION COMPLETED")
        print("="*80)
        return 0
    else:
        print("\n" + "="*80)
        print("⚠️  USERS MIGRATION COMPLETED WITH ERRORS")
        print("="*80)
        return 1

if __name__ == '__main__':
    exit(main())
