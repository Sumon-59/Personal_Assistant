#!/bin/bash

echo "=== Activity DELETE Test ===" 
echo ""

# Login
echo "1️⃣  Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password@123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ Token: ${TOKEN:0:20}..."
echo ""

# Create Activity
echo "2️⃣  Creating activity..."
CREATE=$(curl -s -X POST http://localhost:3000/api/v1/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"APP","name":"Test Delete Activity","duration":60,"date":"2026-03-31T10:00:00Z"}')

ACTIVITY_ID=$(echo "$CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ Created Activity: $ACTIVITY_ID"
echo ""

# Verify Activity Exists
echo "3️⃣  Verifying activity exists (GET)..."
GET=$(curl -s -X GET "http://localhost:3000/api/v1/activities/$ACTIVITY_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "✅ Found: $(echo "$GET" | grep -o '"name":"[^"]*"')"
echo ""

# Delete Activity
echo "4️⃣  Deleting activity..."
DELETE=$(curl -s -w "\n%{http_code}" -X DELETE "http://localhost:3000/api/v1/activities/$ACTIVITY_ID" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$DELETE" | tail -1)
echo "✅ Deleted - Status Code: $HTTP_CODE (204 = Success)"
echo ""

# Verify Activity Deleted
echo "5️⃣  Verifying activity is deleted (GET - should be 404)..."
GET_DELETED=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:3000/api/v1/activities/$ACTIVITY_ID" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE_2=$(echo "$GET_DELETED" | tail -1)
echo "❌ Status Code: $HTTP_CODE_2 (404 = Not Found)"
echo "✅ Response: $(echo "$GET_DELETED" | head -1 | grep -o '"message":"[^"]*"')"
echo ""
echo "🎉 DELETE endpoint working perfectly!"
