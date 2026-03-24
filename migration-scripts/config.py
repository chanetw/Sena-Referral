#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database Configuration for Migration
Target: Local MySQL (Docker)
"""

import os
from datetime import datetime

# Database Configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'sena_user',
    'password': 'sena_password',
    'database': 'sena_referral',
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

# Excel Files Path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_EXCEL_DIR = os.path.join(BASE_DIR, 'excel-DB-Clean')
FALLBACK_EXCEL_DIR = os.path.join(BASE_DIR, 'docs')
EXCEL_DIR = DEFAULT_EXCEL_DIR if os.path.exists(DEFAULT_EXCEL_DIR) else FALLBACK_EXCEL_DIR

EXCEL_FILES = {
    'agents': os.path.join(EXCEL_DIR, 'tbl_agent_clean_final.xlsx'),
    'customers': os.path.join(EXCEL_DIR, 'ag_customer_final.xlsx'),
    'users': os.path.join(EXCEL_DIR, 'ag_user_final.xlsx'),
    'projects': os.path.join(EXCEL_DIR, 'tbl_project_final.xlsx')
}

# Migration Settings
MIGRATION_CONFIG = {
    'batch_size': 500,  # Insert batch size
    'dry_run': False,   # Set True to test without inserting
    'clear_tables': True,  # Clear existing data before migration
    'backup_before_migration': True,
    'log_file': f'migration_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'
}

# Backup Directory
BACKUP_DIR = os.path.join(BASE_DIR, 'backups')
os.makedirs(BACKUP_DIR, exist_ok=True)

# Logging Directory
LOGS_DIR = os.path.join(BASE_DIR, 'migration-logs')
os.makedirs(LOGS_DIR, exist_ok=True)

# Full log path
LOG_FILE = os.path.join(LOGS_DIR, MIGRATION_CONFIG['log_file'])

# Expected Record Counts (for validation)
EXPECTED_COUNTS = {
    'projects': 83,
    'users': 1038,
    'agents': 969,
    'customers': 1181  # May be less due to agent_id mapping failures
}

# Status Mapping
STATUS_MAPPING = {
    'customers': {
        'active': 'active',
        'inactive': 'inactive',
        # Default for unknown status
        'default': 'pending'
    }
}

# Print configuration
def print_config():
    print("="*80)
    print("📋 MIGRATION CONFIGURATION")
    print("="*80)
    print(f"\n🎯 Target Database:")
    print(f"   Host: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print(f"   Database: {DB_CONFIG['database']}")
    print(f"   User: {DB_CONFIG['user']}")

    print(f"\n📁 Excel Files:")
    for name, path in EXCEL_FILES.items():
        exists = "✅" if os.path.exists(path) else "❌"
        print(f"   {exists} {name}: {os.path.basename(path)}")

    print(f"\n⚙️  Settings:")
    print(f"   Dry Run: {MIGRATION_CONFIG['dry_run']}")
    print(f"   Clear Tables: {MIGRATION_CONFIG['clear_tables']}")
    print(f"   Backup First: {MIGRATION_CONFIG['backup_before_migration']}")
    print(f"   Batch Size: {MIGRATION_CONFIG['batch_size']}")

    print(f"\n📊 Expected Records:")
    for table, count in EXPECTED_COUNTS.items():
        print(f"   {table}: {count:,}")

    print(f"\n📝 Logs:")
    print(f"   Log File: {LOG_FILE}")
    print(f"   Backup Dir: {BACKUP_DIR}")
    print("="*80)

if __name__ == '__main__':
    print_config()
