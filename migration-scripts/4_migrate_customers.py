#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script 4: Migrate Customers
Migrate 1,181 customers จาก Excel ไป MySQL พร้อม map agent_id
"""

import pandas as pd
import mysql.connector
from datetime import datetime
from config import DB_CONFIG, EXCEL_FILES, MIGRATION_CONFIG, EXPECTED_COUNTS, STATUS_MAPPING
import os

def migrate_customers():
    """Migrate customers from Excel to MySQL"""

    print("\n" + "="*80)
    print("👥 STEP 4: MIGRATE CUSTOMERS")
    print("="*80)

    try:
        # Read Excel file
        print(f"\n📖 Reading Excel: {EXCEL_FILES['customers']}")
        df = pd.read_excel(EXCEL_FILES['customers'])

        print(f"   Total rows: {len(df)}")
        print(f"   Columns: {', '.join(df.columns.tolist())}")

        # Load agent mapping (from step 3)
        mapping_file = os.path.join(os.path.dirname(__file__), 'agent_mapping.csv')

        id_card_to_agent_id = {}
        if os.path.exists(mapping_file):
            print(f"\n📥 Loading agent mapping: {mapping_file}")
            mapping_df = pd.read_csv(mapping_file)
            # Convert id_card to string for matching
            mapping_df['id_card'] = mapping_df['id_card'].astype(str)
            id_card_to_agent_id = dict(zip(mapping_df['id_card'], mapping_df['agent_id']))
            print(f"   Loaded {len(id_card_to_agent_id)} agent mappings")
        else:
            print(f"\n❌ ERROR: agent_mapping.csv not found!")
            print(f"   Please run 3_migrate_agents.py first")
            return 0, 0

        # Connect to database
        print(f"\n🔌 Connecting to database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Clear existing customers if configured
        if MIGRATION_CONFIG['clear_tables']:
            print(f"\n🗑️  Clearing existing customers...")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            cursor.execute("TRUNCATE TABLE customers")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            print(f"   ✅ Customers table cleared")

        # Counters
        success_count = 0
        error_count = 0
        skipped_count = 0  # Agent not found
        errors = []

        print(f"\n🔄 Migrating customers...")

        for index, row in df.iterrows():
            try:
                # Map agent_id_card → agent_id
                agent_id_card = str(row['agent_id_card'])
                agent_id = id_card_to_agent_id.get(agent_id_card, None)

                if not agent_id:
                    skipped_count += 1
                    error_msg = f"Row {index + 1}: Agent ID Card {agent_id_card} not found in agents table"
                    errors.append(error_msg)
                    if skipped_count <= 5:  # Show first 5
                        print(f"   ⚠️  {error_msg}")
                    continue

                # Map status (active/inactive → schema values)
                status_value = row['status']
                status = STATUS_MAPPING['customers'].get(
                    status_value,
                    STATUS_MAPPING['customers']['default']
                )

                # Handle phone (may be NULL)
                phone = str(row['phone']) if pd.notna(row['phone']) else None

                # Handle id_card (may be NULL)
                id_card = str(row['id_card']) if pd.notna(row['id_card']) else None

                # Handle duplicate_lead_id (JSON field)
                duplicate_lead_id = row.get('duplicate_lead_id', None)
                if pd.notna(duplicate_lead_id):
                    duplicate_lead_id = str(duplicate_lead_id)
                else:
                    duplicate_lead_id = None

                # Prepare data
                data = {
                    'agent_id': int(agent_id),
                    'first_name': row['first_name'],
                    'last_name': row['last_name'],
                    'phone': phone,
                    'id_card': id_card,
                    'email': None,  # NULL in Excel
                    'project_id': int(row['project_id']),
                    'budget_min': float(row['budget_min']),
                    'budget_max': float(row['budget_max']),
                    'status': status,
                    'source': 'referral',  # Default
                    'notes': None,  # NULL in Excel
                    'is_duplicate': bool(row['is_duplicate']),
                    'duplicate_lead_id': duplicate_lead_id,  # From PowerPoint requirement
                    'agent_id_card': agent_id_card,  # From PowerPoint requirement
                    'created_at': datetime.now(),
                    'updated_at': datetime.now()
                }

                # Skip if dry run
                if MIGRATION_CONFIG['dry_run']:
                    print(f"   [DRY RUN] Would insert: {data['first_name']} {data['last_name']} (Agent: {agent_id})")
                    success_count += 1
                    continue

                # Insert into database
                sql = """
                INSERT INTO customers
                (agent_id, first_name, last_name, phone, id_card, email, project_id,
                 budget_min, budget_max, status, source, notes, is_duplicate,
                 created_at, updated_at)
                VALUES (%(agent_id)s, %(first_name)s, %(last_name)s, %(phone)s,
                        %(id_card)s, %(email)s, %(project_id)s, %(budget_min)s,
                        %(budget_max)s, %(status)s, %(source)s, %(notes)s,
                        %(is_duplicate)s, %(created_at)s, %(updated_at)s)
                """

                cursor.execute(sql, data)
                success_count += 1

                # Progress indicator
                if (index + 1) % 100 == 0:
                    print(f"   Progress: {index + 1}/{len(df)} customers... ({success_count} success, {skipped_count} skipped)")

            except Exception as e:
                error_count += 1
                error_msg = f"Row {index + 1} ({row.get('first_name', 'N/A')} {row.get('last_name', 'N/A')}): {str(e)}"
                errors.append(error_msg)
                print(f"   ❌ {error_msg}")

        # Commit if not dry run
        if not MIGRATION_CONFIG['dry_run']:
            conn.commit()

        cursor.close()
        conn.close()

        # Summary
        print(f"\n📊 Migration Summary:")
        print(f"   ✅ Success: {success_count}")
        print(f"   ⚠️  Skipped (agent not found): {skipped_count}")
        print(f"   ❌ Errors: {error_count}")
        print(f"   📈 Total: {len(df)}")

        # Validate count
        expected = EXPECTED_COUNTS['customers']
        actual = success_count + skipped_count + error_count
        if actual >= expected * 0.95:  # Allow 5% tolerance
            print(f"\n✅ Count validation passed: {actual} ≈ {expected}")
        else:
            print(f"\n⚠️  Count mismatch: {actual} != {expected}")

        # Show errors
        if errors:
            print(f"\n⚠️  Issues encountered:")
            for err in errors[:10]:  # Show first 10
                print(f"   - {err}")
            if len(errors) > 10:
                print(f"   ... and {len(errors) - 10} more issues")

        return success_count, error_count + skipped_count

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return 0, 0

def main():
    """Main function"""
    print("\n🚀 Starting customers migration...")

    success, errors = migrate_customers()

    if success > 0:
        print("\n" + "="*80)
        if errors == 0:
            print("✅ CUSTOMERS MIGRATION COMPLETED")
        else:
            print("⚠️  CUSTOMERS MIGRATION COMPLETED WITH WARNINGS")
        print("="*80)
        return 0
    else:
        print("\n" + "="*80)
        print("❌ CUSTOMERS MIGRATION FAILED")
        print("="*80)
        return 1

if __name__ == '__main__':
    exit(main())
