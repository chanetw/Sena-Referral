#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script 1: Migrate Projects
Migrate 83 projects จาก Excel ไป MySQL
"""

import pandas as pd
import mysql.connector
from datetime import datetime
from config import DB_CONFIG, EXCEL_FILES, MIGRATION_CONFIG, EXPECTED_COUNTS

def migrate_projects():
    """Migrate projects from Excel to MySQL"""

    print("\n" + "="*80)
    print("📁 STEP 1: MIGRATE PROJECTS")
    print("="*80)

    try:
        # Read Excel file
        print(f"\n📖 Reading Excel: {EXCEL_FILES['projects']}")
        df = pd.read_excel(EXCEL_FILES['projects'])

        print(f"   Total rows: {len(df)}")
        print(f"   Columns: {', '.join(df.columns.tolist())}")

        # Connect to database
        print(f"\n🔌 Connecting to database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Clear existing projects if configured
        if MIGRATION_CONFIG['clear_tables']:
            print(f"\n🗑️  Clearing existing projects...")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            cursor.execute("TRUNCATE TABLE projects")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            print(f"   ✅ Projects table cleared")

        # Counters
        success_count = 0
        error_count = 0
        errors = []

        print(f"\n🔄 Migrating projects...")

        for index, row in df.iterrows():
            try:
                # Generate project_code (PROJ001, PROJ002, ...)
                project_code = f"PROJ{str(row['id']).zfill(3)}"

                # Prepare data
                data = {
                    'id': int(row['id']),
                    'project_code': project_code,
                    'project_name': row['project_name'],
                    'project_type': row['project_type'],
                    'location': None,  # NULL in Excel
                    'price_range_min': None,  # NULL in Excel
                    'price_range_max': None,  # NULL in Excel
                    'sales_team': None,  # NULL in Excel
                    'project_sale': row.get('project_sale', None),  # From PowerPoint requirement
                    'bud': int(row.get('bud', 0)) if pd.notna(row.get('bud')) else None,  # From PowerPoint
                    'is_active': bool(row['is_active']),
                    'created_at': datetime.now(),
                    'updated_at': datetime.now()
                }

                # Skip if dry run
                if MIGRATION_CONFIG['dry_run']:
                    print(f"   [DRY RUN] Would insert: {project_code} - {data['project_name']}")
                    success_count += 1
                    continue

                # Insert into database
                sql = """
                INSERT INTO projects
                (id, project_code, project_name, project_type, location,
                 price_range_min, price_range_max, sales_team, project_sale, bud, is_active,
                 created_at, updated_at)
                VALUES (%(id)s, %(project_code)s, %(project_name)s, %(project_type)s,
                        %(location)s, %(price_range_min)s, %(price_range_max)s,
                    %(sales_team)s, %(project_sale)s, %(bud)s, %(is_active)s,
                    %(created_at)s, %(updated_at)s)
                """

                cursor.execute(sql, data)
                success_count += 1

                # Progress indicator
                if (index + 1) % 10 == 0:
                    print(f"   Progress: {index + 1}/{len(df)} projects...")

            except Exception as e:
                error_count += 1
                error_msg = f"Row {index + 1}: {str(e)}"
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
        print(f"   ❌ Errors: {error_count}")
        print(f"   📈 Total: {len(df)}")

        # Validate count
        expected = EXPECTED_COUNTS['projects']
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
    print("\n🚀 Starting projects migration...")

    success, errors = migrate_projects()

    if errors == 0 and success > 0:
        print("\n" + "="*80)
        print("✅ PROJECTS MIGRATION COMPLETED")
        print("="*80)
        return 0
    else:
        print("\n" + "="*80)
        print("⚠️  PROJECTS MIGRATION COMPLETED WITH ERRORS")
        print("="*80)
        return 1

if __name__ == '__main__':
    exit(main())
