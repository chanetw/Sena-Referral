#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script 0: Backup Current Database
Backup database ก่อนทำ migration เพื่อความปลอดภัย
"""

import mysql.connector
import subprocess
from datetime import datetime
from config import DB_CONFIG, BACKUP_DIR
import os

def backup_database():
    """Backup database using mysqldump"""

    print("\n" + "="*80)
    print("💾 STEP 0: BACKUP DATABASE")
    print("="*80)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(BACKUP_DIR, f"backup_before_migration_{timestamp}.sql")

    print(f"\n📁 Backup file: {backup_file}")

    # Build mysqldump command
    # For Docker: docker exec sena_mysql mysqldump ...
    cmd = [
        'docker', 'exec', 'sena_mysql',
        'mysqldump',
        f'-u{DB_CONFIG["user"]}',
        f'-p{DB_CONFIG["password"]}',
        '--single-transaction',
        '--routines',
        '--triggers',
        '--databases',
        DB_CONFIG['database']
    ]

    try:
        print("\n🔄 Running mysqldump...")

        # Run mysqldump and save to file
        with open(backup_file, 'w') as f:
            result = subprocess.run(
                cmd,
                stdout=f,
                stderr=subprocess.PIPE,
                text=True,
                check=True
            )

        # Check file size
        file_size = os.path.getsize(backup_file)
        file_size_mb = file_size / (1024 * 1024)

        print(f"\n✅ Backup successful!")
        print(f"   File: {backup_file}")
        print(f"   Size: {file_size_mb:.2f} MB")

        # Show current data counts
        print("\n📊 Current Database Records:")
        show_current_counts()

        return True

    except subprocess.CalledProcessError as e:
        print(f"\n❌ Backup failed!")
        print(f"   Error: {e.stderr}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

def show_current_counts():
    """Show current record counts in database"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        tables = ['users', 'agents', 'customers', 'projects']

        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   {table}: {count:,} records")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"   Error counting records: {e}")

def main():
    """Main function"""
    print("\n🚀 Starting database backup...")

    success = backup_database()

    if success:
        print("\n" + "="*80)
        print("✅ BACKUP COMPLETED")
        print("="*80)
        return 0
    else:
        print("\n" + "="*80)
        print("❌ BACKUP FAILED")
        print("="*80)
        return 1

if __name__ == '__main__':
    exit(main())
