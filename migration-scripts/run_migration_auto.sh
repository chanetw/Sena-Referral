#!/bin/bash
# Auto-run migration without confirmation
# Usage: ./run_migration_auto.sh

cd "$(dirname "$0")"

echo "🚀 Starting automatic migration..."
echo "⚠️  This will run WITHOUT confirmation!"
echo ""

# Run migration and automatically answer 'yes'
echo "yes" | python3 migrate_all.py

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
else
    echo ""
    echo "❌ Migration failed with exit code: $exit_code"
fi

exit $exit_code
