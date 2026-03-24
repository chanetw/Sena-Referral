#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script 3: Migrate Agents
Migrate 969 agents จาก Excel ไป MySQL พร้อม generate agent codes
"""

import pandas as pd
import mysql.connector
from datetime import datetime
from config import DB_CONFIG, EXCEL_FILES, MIGRATION_CONFIG, EXPECTED_COUNTS
import os

def migrate_agents():
    """Migrate agents from Excel to MySQL"""

    print("\n" + "="*80)
    print("👨‍💼 STEP 3: MIGRATE AGENTS")
    print("="*80)

    try:
        # Read Excel file
        print(f"\n📖 Reading Excel: {EXCEL_FILES['agents']}")
        df = pd.read_excel(EXCEL_FILES['agents'])

        print(f"   Total rows: {len(df)}")
        print(f"   Columns: {', '.join(df.columns.tolist())}")

        # Load user mapping (from step 2)
        mapping_file = os.path.join(os.path.dirname(__file__), 'user_mapping.csv')

        email_to_user_id = {}
        if os.path.exists(mapping_file):
            print(f"\n📥 Loading user mapping: {mapping_file}")
            mapping_df = pd.read_csv(mapping_file)
            email_to_user_id = dict(zip(mapping_df['email'], mapping_df['user_id']))
            print(f"   Loaded {len(email_to_user_id)} user mappings")
        else:
            print(f"\n⚠️  Warning: user_mapping.csv not found")
            print(f"   Agents will have NULL user_id")

        # Connect to database
        print(f"\n🔌 Connecting to database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Clear existing agents if configured
        if MIGRATION_CONFIG['clear_tables']:
            print(f"\n🗑️  Clearing existing agents...")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            cursor.execute("TRUNCATE TABLE agents")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            print(f"   ✅ Agents table cleared")

        # Counters
        success_count = 0
        error_count = 0
        skipped_count = 0
        errors = []

        # For storing agent mapping
        agent_mapping = {}  # {id_card: agent_id}
        agent_counter = 1

        print(f"\n🔄 Migrating agents...")

        for index, row in df.iterrows():
            try:
                # Generate agent_code (AG001, AG002, ...)
                agent_code = f"AG{str(agent_counter).zfill(3)}"

                # Map email → user_id
                email = row.get('email', None)
                user_id = email_to_user_id.get(email, None) if email and pd.notna(email) else None

                # Handle phone (may be int or str)
                phone = str(row['phone']) if pd.notna(row['phone']) else None

                # Handle last_name (1 NULL ใน Excel)
                last_name = row['last_name'] if pd.notna(row['last_name']) else ''

                # Prepare data
                data = {
                    'user_id': user_id,
                    'agent_code': agent_code,
                    'id_card': str(row['id_card']),
                    'first_name': row['first_name'],
                    'last_name': last_name,
                    'phone': phone,
                    'email': email,  # Add email field (requirement from PowerPoint)
                    'address': None,  # NULL in Excel
                    'registration_date': row['registration_date'],
                    'status': row['status'],  # active
                    'created_at': datetime.now(),
                    'updated_at': datetime.now()
                }

                # Skip if dry run
                if MIGRATION_CONFIG['dry_run']:
                    print(f"   [DRY RUN] Would insert: {agent_code} - {data['first_name']} {data['last_name']}")
                    success_count += 1
                    agent_counter += 1
                    continue

                # Insert into database
                sql = """
                INSERT INTO agents
                (user_id, agent_code, id_card, first_name, last_name, phone, email,
                 address, registration_date, status, created_at, updated_at)
                VALUES (%(user_id)s, %(agent_code)s, %(id_card)s, %(first_name)s,
                        %(last_name)s, %(phone)s, %(email)s, %(address)s,
                        %(registration_date)s, %(status)s, %(created_at)s, %(updated_at)s)
                """

                cursor.execute(sql, data)

                # Get inserted agent_id
                agent_id = cursor.lastrowid
                agent_mapping[data['id_card']] = agent_id

                success_count += 1
                agent_counter += 1

                # Progress indicator
                if (index + 1) % 100 == 0:
                    print(f"   Progress: {index + 1}/{len(df)} agents...")

            except Exception as e:
                error_count += 1
                error_msg = f"Row {index + 1} ({row.get('id_card', 'N/A')}): {str(e)}"
                errors.append(error_msg)
                print(f"   ❌ {error_msg}")

        # Commit if not dry run
        if not MIGRATION_CONFIG['dry_run']:
            conn.commit()

            # Save agent mapping to CSV for customers migration
            mapping_file = os.path.join(os.path.dirname(__file__), 'agent_mapping.csv')
            mapping_df = pd.DataFrame(
                list(agent_mapping.items()),
                columns=['id_card', 'agent_id']
            )
            mapping_df.to_csv(mapping_file, index=False)
            print(f"\n💾 Agent mapping saved: {mapping_file}")

        cursor.close()
        conn.close()

        # Summary
        print(f"\n📊 Migration Summary:")
        print(f"   ✅ Success: {success_count}")
        print(f"   ❌ Errors: {error_count}")
        print(f"   ⏭️  Skipped: {skipped_count}")
        print(f"   📈 Total: {len(df)}")
        print(f"   🔢 Agent codes: AG001 - AG{str(success_count).zfill(3)}")

        # Validate count
        expected = EXPECTED_COUNTS['agents']
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
    print("\n🚀 Starting agents migration...")

    success, errors = migrate_agents()

    if errors == 0 and success > 0:
        print("\n" + "="*80)
        print("✅ AGENTS MIGRATION COMPLETED")
        print("="*80)
        return 0
    else:
        print("\n" + "="*80)
        print("⚠️  AGENTS MIGRATION COMPLETED WITH ERRORS")
        print("="*80)
        return 1

if __name__ == '__main__':
    exit(main())
