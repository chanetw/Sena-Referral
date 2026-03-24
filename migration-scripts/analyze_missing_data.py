#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analyze Missing and Failed Records from Migration
"""

import pandas as pd
import mysql.connector
from config import DB_CONFIG, EXCEL_FILES

def analyze_users():
    """Find missing users"""
    print("\n" + "="*80)
    print("👥 USERS ANALYSIS")
    print("="*80)

    # Read Excel
    df_excel = pd.read_excel(EXCEL_FILES['users'])
    print(f"\n📊 Excel: {len(df_excel)} users")

    # Read Database
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT email FROM users")
    db_emails = set([row['email'] for row in cursor.fetchall()])
    print(f"📊 Database: {len(db_emails)} users")

    # Find missing
    excel_emails = set(df_excel['email'].tolist())
    missing_emails = excel_emails - db_emails

    print(f"\n⚠️  Missing: {len(missing_emails)} users")

    if missing_emails:
        print("\n📋 Missing Users List:")
        missing_df = df_excel[df_excel['email'].isin(missing_emails)]

        print(f"\n{'#':<5} {'Email':<40} {'Role':<10} {'Active':<8} {'BUD':<5}")
        print("-" * 80)

        for idx, row in missing_df.iterrows():
            bud = int(row['bud']) if pd.notna(row['bud']) else 'N/A'
            print(f"{idx+1:<5} {row['email']:<40} {row['role']:<10} {row['is_active']:<8} {bud:<5}")

    cursor.close()
    conn.close()

    return missing_df if missing_emails else None

def analyze_agents():
    """Find missing agents"""
    print("\n" + "="*80)
    print("👨‍💼 AGENTS ANALYSIS")
    print("="*80)

    # Read Excel
    df_excel = pd.read_excel(EXCEL_FILES['agents'])
    print(f"\n📊 Excel: {len(df_excel)} agents")

    # Read Database
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_card, email FROM agents")
    db_id_cards = set([row['id_card'] for row in cursor.fetchall()])
    db_emails = set([row['email'] for row in cursor.fetchall() if row['email']])
    print(f"📊 Database: {len(db_id_cards)} agents")

    # Find missing
    excel_id_cards = set(df_excel['id_card'].astype(str).tolist())
    missing_id_cards = excel_id_cards - db_id_cards

    print(f"\n⚠️  Missing: {len(missing_id_cards)} agents")

    if missing_id_cards:
        print("\n📋 Missing Agents List:")
        missing_df = df_excel[df_excel['id_card'].astype(str).isin(missing_id_cards)]

        print(f"\n{'#':<5} {'ID Card':<15} {'Name':<40} {'Email':<40} {'Phone':<12}")
        print("-" * 120)

        for idx, row in missing_df.iterrows():
            id_card = str(row['id_card'])
            name = f"{row['first_name']} {row['last_name']}"
            email = row['email'] if pd.notna(row['email']) else 'N/A'
            phone = str(row['phone']) if pd.notna(row['phone']) else 'N/A'

            print(f"{idx+1:<5} {id_card:<15} {name:<40} {email:<40} {phone:<12}")

        # Check for duplicate emails
        print("\n🔍 Checking for duplicate emails...")
        if 'email' in missing_df.columns:
            duplicate_emails = []
            for idx, row in missing_df.iterrows():
                email = row['email']
                if pd.notna(email) and email in db_emails:
                    duplicate_emails.append((idx+1, email, f"{row['first_name']} {row['last_name']}"))

            if duplicate_emails:
                print(f"\n⚠️  Found {len(duplicate_emails)} agents with duplicate emails:")
                print(f"\n{'Row':<5} {'Email':<40} {'Name':<40}")
                print("-" * 90)
                for row_num, email, name in duplicate_emails:
                    print(f"{row_num:<5} {email:<40} {name:<40}")

    cursor.close()
    conn.close()

    return missing_df if missing_id_cards else None

def analyze_customers():
    """Find skipped and error customers"""
    print("\n" + "="*80)
    print("👥 CUSTOMERS ANALYSIS")
    print("="*80)

    # Read Excel
    df_excel = pd.read_excel(EXCEL_FILES['customers'])
    print(f"\n📊 Excel: {len(df_excel)} customers")

    # Read Database
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT COUNT(*) as count FROM customers")
    db_count = cursor.fetchone()['count']
    print(f"📊 Database: {db_count} customers")

    # Get agent id_cards from database
    cursor.execute("SELECT id_card FROM agents")
    valid_agent_id_cards = set([row['id_card'] for row in cursor.fetchall()])

    missing_count = len(df_excel) - db_count
    print(f"\n⚠️  Missing: {missing_count} customers")

    # Find skipped (agent not found)
    skipped = []
    errors = []

    for idx, row in df_excel.iterrows():
        agent_id_card = str(row['agent_id_card'])

        if agent_id_card not in valid_agent_id_cards:
            skipped.append({
                'row': idx + 1,
                'agent_id_card': agent_id_card,
                'name': f"{row['first_name']} {row['last_name']}",
                'phone': str(row['phone']) if pd.notna(row['phone']) else 'N/A',
                'project_id': row['project_id'],
                'reason': 'Agent not found'
            })

    # Find errors (id_card too long)
    for idx, row in df_excel.iterrows():
        id_card = str(row['id_card']) if pd.notna(row['id_card']) else ''
        if len(id_card) > 13:
            errors.append({
                'row': idx + 1,
                'id_card': id_card,
                'name': f"{row['first_name']} {row['last_name']}",
                'phone': str(row['phone']) if pd.notna(row['phone']) else 'N/A',
                'agent_id_card': str(row['agent_id_card']),
                'reason': f'ID Card too long ({len(id_card)} chars)'
            })

    # Display Skipped
    if skipped:
        print(f"\n⚠️  SKIPPED CUSTOMERS: {len(skipped)}")
        print("\nReason: Agent ID Card not found in agents table")
        print(f"\n{'#':<5} {'Agent ID Card':<15} {'Customer Name':<40} {'Phone':<15} {'Project':<10}")
        print("-" * 90)

        for item in skipped[:20]:  # Show first 20
            print(f"{item['row']:<5} {item['agent_id_card']:<15} {item['name']:<40} {item['phone']:<15} {item['project_id']:<10}")

        if len(skipped) > 20:
            print(f"\n... and {len(skipped) - 20} more skipped customers")

        # Group by agent_id_card
        print("\n📊 Skipped Customers by Agent ID Card:")
        from collections import Counter
        agent_counts = Counter([s['agent_id_card'] for s in skipped])

        print(f"\n{'Agent ID Card':<15} {'Count':<10}")
        print("-" * 30)
        for agent_id_card, count in agent_counts.most_common(10):
            print(f"{agent_id_card:<15} {count:<10}")

    # Display Errors
    if errors:
        print(f"\n❌ ERROR CUSTOMERS: {len(errors)}")
        print("\nReason: ID Card length > 13 characters")
        print(f"\n{'#':<5} {'ID Card':<20} {'Customer Name':<40} {'Phone':<15}")
        print("-" * 85)

        for item in errors:
            print(f"{item['row']:<5} {item['id_card']:<20} {item['name']:<40} {item['phone']:<15}")

    cursor.close()
    conn.close()

    return {
        'skipped': skipped,
        'errors': errors
    }

def main():
    """Main function"""
    print("\n" + "🔍" * 40)
    print("MIGRATION DATA ANALYSIS")
    print("🔍" * 40)

    # Analyze Users
    missing_users = analyze_users()

    # Analyze Agents
    missing_agents = analyze_agents()

    # Analyze Customers
    customer_issues = analyze_customers()

    # Summary
    print("\n" + "="*80)
    print("📊 SUMMARY")
    print("="*80)

    print(f"\n⚠️  Missing Users: {len(missing_users) if missing_users is not None else 0}")
    print(f"⚠️  Missing Agents: {len(missing_agents) if missing_agents is not None else 0}")
    print(f"⚠️  Skipped Customers: {len(customer_issues['skipped'])}")
    print(f"❌ Error Customers: {len(customer_issues['errors'])}")

    print("\n" + "="*80)

if __name__ == '__main__':
    main()
