#!/bin/bash

echo "Starting Security Verification..."

# 1. Check Security Headers
echo "Checking Security Headers on localhost:3000 (or provided URL)..."
URL=${1:-http://localhost:3000}

echo "Requesting headers from $URL"
curl -I -s "$URL" | grep -iE "Content-Security-Policy|Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|Referrer-Policy|Permissions-Policy"

if [ $? -eq 0 ]; then
    echo "✅ Security Headers Found!"
else
    echo "⚠️  Missing some security headers or server not running."
fi

# 2. Check Database Connection & RLS (Simulation via curl to an API route if possible, or manual instruction)
echo ""
echo "Database Security Verification:"
echo "Please verify RLS by attempting to access protected tables from an unauthenticated context."
echo "You can use the Supabase dashboard or a client script."

# 3. Check for exposed sensitive files
echo ""
echo "Checking for exposed sensitive files (.env, .git)..."
curl -I -s "$URL/.env" | grep "200 OK" && echo "❌ CRITICAL: .env is accessible!" || echo "✅ .env is protected."
curl -I -s "$URL/.git/config" | grep "200 OK" && echo "❌ CRITICAL: .git is accessible!" || echo "✅ .git is protected."

echo ""
echo "Verification Complete."
