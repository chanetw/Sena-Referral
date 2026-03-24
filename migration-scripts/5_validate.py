#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script 5: Validate Migration Results
ตรวจสอบความถูกต้องของข้อมูลหลัง migration
"""

import mysql.connector
from config import DB_CONFIG, EXPECTED_COUNTS

def validate_migration():
    """Validate migration results"""

    print("\n" + "="*80)
    print("✅ STEP 5: VALIDATE MIGRATION")
    print("="*80)

    try:
        # Connect to database
        print(f"\n🔌 Connecting to database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        all_passed = True

        # 1. Record Counts
        print(f"\n📊 1. RECORD COUNTS")
        print("-" * 80)

        tables = ['projects', 'users', 'agents', 'customers']

        for table in tables:
            cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
            result = cursor.fetchone()
            actual_count = result['count']
            expected_count = EXPECTED_COUNTS.get(table, 0)

            # Check tolerance (customers may have skipped records)
            tolerance = 0.95 if table == 'customers' else 1.0
            min_expected = int(expected_count * tolerance)

            status = "✅" if actual_count >= min_expected else "❌"
            if actual_count < min_expected:
                all_passed = False

            print(f"   {status} {table:12} : {actual_count:6,} / {expected_count:6,}")

        # 2. Foreign Key Validation
        print(f"\n🔗 2. FOREIGN KEY VALIDATION")
        print("-" * 80)

        # Check customers with invalid agent_id
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM customers c
            LEFT JOIN agents a ON c.agent_id = a.id
            WHERE a.id IS NULL
        """)
        result = cursor.fetchone()
        invalid_agents = result['count']

        status = "✅" if invalid_agents == 0 else "❌"
        if invalid_agents > 0:
            all_passed = False

        print(f"   {status} Customers with invalid agent_id: {invalid_agents}")

        # Check customers with invalid project_id
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM customers c
            LEFT JOIN projects p ON c.project_id = p.id
            WHERE p.id IS NULL
        """)
        result = cursor.fetchone()
        invalid_projects = result['count']

        status = "✅" if invalid_projects == 0 else "❌"
        if invalid_projects > 0:
            all_passed = False

        print(f"   {status} Customers with invalid project_id: {invalid_projects}")

        # 3. Data Quality Checks
        print(f"\n📝 3. DATA QUALITY CHECKS")
        print("-" * 80)

        # Check users with passwords
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM users
            WHERE password IS NULL OR LENGTH(password) < 50
        """)
        result = cursor.fetchone()
        invalid_passwords = result['count']

        status = "✅" if invalid_passwords == 0 else "❌"
        if invalid_passwords > 0:
            all_passed = False

        print(f"   {status} Users with invalid passwords: {invalid_passwords}")

        # Check agents with agent_code
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM agents
            WHERE agent_code IS NULL OR agent_code = ''
        """)
        result = cursor.fetchone()
        missing_agent_codes = result['count']

        status = "✅" if missing_agent_codes == 0 else "❌"
        if missing_agent_codes > 0:
            all_passed = False

        print(f"   {status} Agents without agent_code: {missing_agent_codes}")

        # Check projects with project_code
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM projects
            WHERE project_code IS NULL OR project_code = ''
        """)
        result = cursor.fetchone()
        missing_project_codes = result['count']

        status = "✅" if missing_project_codes == 0 else "❌"
        if missing_project_codes > 0:
            all_passed = False

        print(f"   {status} Projects without project_code: {missing_project_codes}")

        # 4. Sample Data Display
        print(f"\n📋 4. SAMPLE DATA")
        print("-" * 80)

        # Show first 3 agents
        print("\n   Agents (first 3):")
        cursor.execute("""
            SELECT agent_code, first_name, last_name, email, phone
            FROM agents
            ORDER BY agent_code
            LIMIT 3
        """)
        for row in cursor.fetchall():
            print(f"      {row['agent_code']}: {row['first_name']} {row['last_name']} ({row['email']})")

        # Show first 3 customers with agent info
        print("\n   Customers (first 3):")
        cursor.execute("""
            SELECT c.first_name, c.last_name, c.phone, c.project_id,
                   a.agent_code, a.first_name as agent_first_name
            FROM customers c
            JOIN agents a ON c.agent_id = a.id
            LIMIT 3
        """)
        for row in cursor.fetchall():
            print(f"      {row['first_name']} {row['last_name']} → Agent: {row['agent_code']} ({row['agent_first_name']})")

        # 5. Statistics
        print(f"\n📈 5. STATISTICS")
        print("-" * 80)

        # Customers per project
        print("\n   Top 5 Projects (by customer count):")
        cursor.execute("""
            SELECT p.project_code, p.project_name, COUNT(c.id) as customer_count
            FROM projects p
            LEFT JOIN customers c ON p.id = c.project_id
            GROUP BY p.id
            ORDER BY customer_count DESC
            LIMIT 5
        """)
        for row in cursor.fetchall():
            print(f"      {row['project_code']}: {row['project_name']} ({row['customer_count']} customers)")

        # Customers per agent
        print("\n   Top 5 Agents (by customer count):")
        cursor.execute("""
            SELECT a.agent_code, a.first_name, a.last_name, COUNT(c.id) as customer_count
            FROM agents a
            LEFT JOIN customers c ON a.id = c.agent_id
            GROUP BY a.id
            ORDER BY customer_count DESC
            LIMIT 5
        """)
        for row in cursor.fetchall():
            print(f"      {row['agent_code']}: {row['first_name']} {row['last_name']} ({row['customer_count']} customers)")

        # Customer status distribution
        print("\n   Customer Status Distribution:")
        cursor.execute("""
            SELECT status, COUNT(*) as count
            FROM customers
            GROUP BY status
            ORDER BY count DESC
        """)
        for row in cursor.fetchall():
            print(f"      {row['status']}: {row['count']} customers")

        cursor.close()
        conn.close()

        # Final Result
        print("\n" + "="*80)
        if all_passed:
            print("✅ ALL VALIDATION CHECKS PASSED!")
        else:
            print("⚠️  SOME VALIDATION CHECKS FAILED")
            print("   Please review the issues above")
        print("="*80)

        return all_passed

    except Exception as e:
        print(f"\n❌ Validation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("\n🚀 Starting validation...")

    passed = validate_migration()

    if passed:
        print("\n✅ Validation completed successfully")
        return 0
    else:
        print("\n⚠️  Validation completed with warnings")
        return 1

if __name__ == '__main__':
    exit(main())
