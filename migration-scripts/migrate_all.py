#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Master Migration Script
รัน migration scripts ทั้งหมดตามลำดับ
"""

import sys
import os
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import print_config, MIGRATION_CONFIG
import importlib

def run_script(script_name, step_number):
    """Run a migration script"""
    try:
        print("\n" + "🚀" * 40)
        print(f"Running: {script_name}")
        print("🚀" * 40)

        # Import and run the script
        module_name = script_name.replace('.py', '')
        module = importlib.import_module(module_name)

        # Run main function
        result = module.main()

        if result == 0:
            print(f"\n✅ {script_name} completed successfully")
            return True
        else:
            print(f"\n⚠️  {script_name} completed with warnings")
            return True  # Continue anyway

    except Exception as e:
        print(f"\n❌ {script_name} failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main migration flow"""

    start_time = datetime.now()

    print("\n" + "="*80)
    print("🎯 SENA AGENT - DATA MIGRATION")
    print("="*80)

    # Print configuration
    print_config()

    # Ask for confirmation
    if not MIGRATION_CONFIG['dry_run']:
        print("\n" + "⚠️ " * 40)
        print("⚠️  WARNING: This will DELETE existing data and import new data!")
        print("⚠️  Make sure you have backed up your database!")
        print("⚠️ " * 40)

        response = input("\n❓ Continue with migration? (yes/no): ")
        if response.lower() != 'yes':
            print("\n❌ Migration cancelled by user")
            return 1
    else:
        print("\n" + "ℹ️ " * 40)
        print("ℹ️  DRY RUN MODE: No data will be modified")
        print("ℹ️ " * 40)

    # Migration scripts in order
    scripts = [
        ('0_backup_database.py', 0),
        ('1_migrate_projects.py', 1),
        ('2_migrate_users.py', 2),
        ('3_migrate_agents.py', 3),
        ('4_migrate_customers.py', 4),
        ('5_validate.py', 5)
    ]

    # Track results
    results = {}

    # Run each script
    for script_name, step_number in scripts:
        success = run_script(script_name, step_number)
        results[script_name] = success

        if not success:
            print(f"\n❌ Migration stopped due to error in {script_name}")
            break

    # Calculate duration
    end_time = datetime.now()
    duration = end_time - start_time

    # Final summary
    print("\n" + "="*80)
    print("📊 MIGRATION SUMMARY")
    print("="*80)

    print(f"\n⏱️  Duration: {duration}")

    print(f"\n📋 Scripts Results:")
    for script_name, success in results.items():
        status = "✅" if success else "❌"
        print(f"   {status} {script_name}")

    # Overall result
    all_success = all(results.values())

    print("\n" + "="*80)
    if all_success:
        print("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*80)
        print("\n✅ Next Steps:")
        print("   1. Check validation results above")
        print("   2. Test login: http://localhost:3000")
        print("   3. Try logging in with migrated user credentials")
        print("   4. Check phpMyAdmin: http://localhost:8080")
        print("   5. If everything looks good, you can deploy to production")
    else:
        print("⚠️  MIGRATION COMPLETED WITH ERRORS")
        print("="*80)
        print("\n❌ Please review the errors above and:")
        print("   1. Check migration logs")
        print("   2. Fix any issues")
        print("   3. Restore from backup if needed")
        print("   4. Re-run the migration")

    print("\n" + "="*80)

    return 0 if all_success else 1

if __name__ == '__main__':
    try:
        exit(main())
    except KeyboardInterrupt:
        print("\n\n❌ Migration interrupted by user (Ctrl+C)")
        print("⚠️  Database may be in inconsistent state!")
        print("   Please restore from backup if needed")
        exit(1)
