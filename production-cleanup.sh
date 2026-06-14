#!/bin/bash

# Production Database Cleanup Script
# This will wipe all user data to prepare for production deployment

echo "🚨 PRODUCTION DATABASE CLEANUP"
echo "==============================="
echo "This will PERMANENTLY DELETE all:"
echo "  • User accounts and profiles"
echo "  • Steam accounts and credentials" 
echo "  • Boost sessions and game data"
echo "  • Subscriptions and payments"
echo "  • Chat messages and logs"
echo "  • Security devices and tokens"
echo "  • Admin settings and configurations"
echo ""
echo "⚠️  THIS ACTION CANNOT BE UNDONE!"
echo ""

read -p "Are you absolutely sure? Type 'WIPE PRODUCTION' to continue: " confirmation

if [ "$confirmation" != "WIPE PRODUCTION" ]; then
    echo "❌ Aborted. Database unchanged."
    exit 1
fi

echo "🗑️  Starting database cleanup..."

# Create the cleanup SQL script
cat > /tmp/production_cleanup.sql << 'EOF'
-- Disable foreign key checks to avoid constraint issues
SET FOREIGN_KEY_CHECKS = 0;

-- Clear all user data
DELETE FROM ChatMessage;
DELETE FROM BoostSessionGame;
DELETE FROM BoostSession;
DELETE FROM SteamAccount;
DELETE FROM Subscription;
DELETE FROM FreePlanBalance;
DELETE FROM SecurityDevice;
DELETE FROM UserEvent;
DELETE FROM User;

-- Clear games (but keep the table structure for Steam game cache)
DELETE FROM Game;

-- Clear news posts (start fresh)
DELETE FROM NewsPost;

-- Reset auto-increment counters
ALTER TABLE User AUTO_INCREMENT = 1;
ALTER TABLE SteamAccount AUTO_INCREMENT = 1;
ALTER TABLE BoostSession AUTO_INCREMENT = 1;
ALTER TABLE Game AUTO_INCREMENT = 1;
ALTER TABLE NewsPost AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify cleanup
SELECT 'Users' as table_name, COUNT(*) as count FROM User
UNION ALL
SELECT 'SteamAccount' as table_name, COUNT(*) as count FROM SteamAccount  
UNION ALL
SELECT 'BoostSession' as table_name, COUNT(*) as count FROM BoostSession
UNION ALL
SELECT 'Subscription' as table_name, COUNT(*) as count FROM Subscription
UNION ALL
SELECT 'Game' as table_name, COUNT(*) as count FROM Game
UNION ALL
SELECT 'NewsPost' as table_name, COUNT(*) as count FROM NewsPost;
EOF

# Execute the cleanup
echo "📊 Executing database cleanup..."
mysql -u root -p -e "USE idlemates; source /tmp/production_cleanup.sql"

# Clean up temp file
rm /tmp/production_cleanup.sql

echo ""
echo "✅ Database cleanup complete!"
echo "📋 Summary:"
echo "  • All user accounts removed"
echo "  • All Steam credentials wiped"  
echo "  • All session data cleared"
echo "  • All subscription data removed"
echo "  • Database ready for production"
echo ""
echo "🚀 Your application is now ready for production deployment!"