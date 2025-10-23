# Fliptrade Admin Panel - API Collections

## Supabase Configuration
- **Project URL**: `https://uwooqqjtwnorpiszpeah.supabase.co`
- **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk`

## Base URL
```
https://uwooqqjtwnorpiszpeah.supabase.co/rest/v1
```

## Headers
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk
Content-Type: application/json
```

---

## 1. STAFF MANAGEMENT

### 1.1 Get All Staff
```http
GET /staff?select=*,staff_permissions(*)
```

### 1.2 Get Staff by ID
```http
GET /staff?select=*,staff_permissions(*)&id=eq.{staff_id}
```

### 1.3 Create New Staff
```http
POST /staff
Content-Type: application/json

{
  "id": "uuid",
  "name": "Staff Name",
  "email": "staff@example.com",
  "password_hash": "temporary_password",
  "role": "Manager",
  "status": "active",
  "avatar": null
}
```

### 1.4 Update Staff
```http
PATCH /staff?id=eq.{staff_id}
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "Admin",
  "status": "active"
}
```

### 1.5 Delete Staff
```http
DELETE /staff?id=eq.{staff_id}
```

### 1.6 Get Staff Permissions
```http
GET /staff_permissions?staff_id=eq.{staff_id}
```

### 1.7 Create Staff Permissions
```http
POST /staff_permissions
Content-Type: application/json

{
  "staff_id": "uuid",
  "module": "dashboard",
  "can_view": true,
  "can_add": false,
  "can_edit": false,
  "can_delete": false
}
```

---

## 2. DEPOSITS MANAGEMENT

### 2.1 Get All Deposits
```http
GET /deposits?select=*,client_incentives(*),expenses(*)&order=date.desc
```

### 2.2 Get Deposits by User
```http
GET /deposits?select=*,client_incentives(*),expenses(*)&submitted_by=eq.{user_id}&order=date.desc
```

### 2.3 Create New Deposit
```http
POST /deposits
Content-Type: application/json

{
  "id": "uuid",
  "date": "2024-01-20",
  "local_deposit": 50000,
  "usdt_deposit": 30000,
  "cash_deposit": 20000,
  "local_withdraw": 0,
  "usdt_withdraw": 0,
  "cash_withdraw": 0,
  "submitted_by": "user_id",
  "submitted_by_name": "User Name"
}
```

### 2.4 Update Deposit
```http
PATCH /deposits?id=eq.{deposit_id}
Content-Type: application/json

{
  "local_deposit": 60000,
  "usdt_deposit": 35000,
  "cash_deposit": 25000
}
```

### 2.5 Delete Deposit
```http
DELETE /deposits?id=eq.{deposit_id}
```

---

## 3. CLIENT INCENTIVES

### 3.1 Get Client Incentives by Deposit
```http
GET /client_incentives?deposit_id=eq.{deposit_id}
```

### 3.2 Create Client Incentive
```http
POST /client_incentives
Content-Type: application/json

{
  "id": "uuid",
  "deposit_id": "deposit_uuid",
  "client_name": "Client Name",
  "amount": 5000
}
```

### 3.3 Update Client Incentive
```http
PATCH /client_incentives?id=eq.{incentive_id}
Content-Type: application/json

{
  "client_name": "Updated Client Name",
  "amount": 6000
}
```

### 3.4 Delete Client Incentive
```http
DELETE /client_incentives?id=eq.{incentive_id}
```

---

## 4. EXPENSES MANAGEMENT

### 4.1 Get Expenses by Deposit
```http
GET /expenses?deposit_id=eq.{deposit_id}
```

### 4.2 Create Expense
```http
POST /expenses
Content-Type: application/json

{
  "id": "uuid",
  "deposit_id": "deposit_uuid",
  "type": "Promotion",
  "amount": 10000,
  "description": "Marketing campaign"
}
```

### 4.3 Update Expense
```http
PATCH /expenses?id=eq.{expense_id}
Content-Type: application/json

{
  "type": "Salary",
  "amount": 12000,
  "description": "Monthly salary"
}
```

### 4.4 Delete Expense
```http
DELETE /expenses?id=eq.{expense_id}
```

---

## 5. BANKS MANAGEMENT

### 5.1 Get All Banks
```http
GET /banks?is_active=eq.true
```

### 5.2 Create New Bank
```http
POST /banks
Content-Type: application/json

{
  "id": "uuid",
  "name": "Bank Name",
  "is_active": true
}
```

### 5.3 Update Bank
```http
PATCH /banks?id=eq.{bank_id}
Content-Type: application/json

{
  "name": "Updated Bank Name",
  "is_active": true
}
```

### 5.4 Delete Bank
```http
DELETE /banks?id=eq.{bank_id}
```

---

## 6. BANK TRANSACTIONS

### 6.1 Get All Bank Transactions
```http
GET /bank_transactions?select=*,banks(name)&order=date.desc
```

### 6.2 Get Bank Transactions by User
```http
GET /bank_transactions?select=*,banks(name)&submitted_by=eq.{user_id}&order=date.desc
```

### 6.3 Get Bank Transactions by Bank
```http
GET /bank_transactions?select=*,banks(name)&bank_id=eq.{bank_id}&order=date.desc
```

### 6.4 Create Bank Transaction
```http
POST /bank_transactions
Content-Type: application/json

{
  "id": "uuid",
  "date": "2024-01-20",
  "bank_id": "bank_uuid",
  "deposit": 100000,
  "withdraw": 25000,
  "remaining": 750000,
  "submitted_by": "user_id",
  "submitted_by_name": "User Name"
}
```

### 6.5 Update Bank Transaction
```http
PATCH /bank_transactions?id=eq.{transaction_id}
Content-Type: application/json

{
  "deposit": 120000,
  "withdraw": 30000,
  "remaining": 800000
}
```

### 6.6 Delete Bank Transaction
```http
DELETE /bank_transactions?id=eq.{transaction_id}
```

---

## 7. AUTHENTICATION

### 7.1 Login (Supabase Auth)
```http
POST https://uwooqqjtwnorpiszpeah.supabase.co/auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "admin@gmail.com",
  "password": "Admin@1234"
}
```

### 7.2 Get User Profile
```http
GET https://uwooqqjtwnorpiszpeah.supabase.co/auth/v1/user
Authorization: Bearer {access_token}
```

### 7.3 Refresh Token
```http
POST https://uwooqqjtwnorpiszpeah.supabase.co/auth/v1/token?grant_type=refresh_token
Content-Type: application/json

{
  "refresh_token": "refresh_token_here"
}
```

---

## 8. QUERY EXAMPLES

### 8.1 Get Deposits with Filters
```http
GET /deposits?select=*,client_incentives(*),expenses(*)&date=gte.2024-01-01&date=lte.2024-01-31&order=date.desc
```

### 8.2 Get Bank Transactions by Date Range
```http
GET /bank_transactions?select=*,banks(name)&date=gte.2024-01-01&date=lte.2024-01-31&order=date.desc
```

### 8.3 Get Staff with Specific Role
```http
GET /staff?select=*,staff_permissions(*)&role=eq.Manager&status=eq.active
```

### 8.4 Get Total Deposits by User
```http
GET /deposits?select=local_deposit,usdt_deposit,cash_deposit&submitted_by=eq.{user_id}
```

---

## 9. ERROR CODES

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

---

## 10. POSTMAN COLLECTION

### Import this JSON into Postman:

```json
{
  "info": {
    "name": "Fliptrade Admin Panel API",
    "description": "Complete API collection for Fliptrade Admin Panel",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://uwooqqjtwnorpiszpeah.supabase.co/rest/v1"
    },
    {
      "key": "authUrl",
      "value": "https://uwooqqjtwnorpiszpeah.supabase.co/auth/v1"
    },
    {
      "key": "apikey",
      "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk"
    }
  ],
  "auth": {
    "type": "apikey",
    "apikey": [
      {
        "key": "key",
        "value": "apikey",
        "type": "string"
      },
      {
        "key": "value",
        "value": "{{apikey}}",
        "type": "string"
      }
    ]
  },
  "header": [
    {
      "key": "Content-Type",
      "value": "application/json"
    }
  ],
  "item": [
    {
      "name": "Staff Management",
      "item": [
        {
          "name": "Get All Staff",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/staff?select=*,staff_permissions(*)",
              "host": ["{{baseUrl}}"],
              "path": ["staff"],
              "query": [
                {
                  "key": "select",
                  "value": "*,staff_permissions(*)"
                }
              ]
            }
          }
        },
        {
          "name": "Create Staff",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"id\": \"{{$randomUUID}}\",\n  \"name\": \"Test Staff\",\n  \"email\": \"test@example.com\",\n  \"password_hash\": \"temp123\",\n  \"role\": \"Manager\",\n  \"status\": \"active\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/staff",
              "host": ["{{baseUrl}}"],
              "path": ["staff"]
            }
          }
        }
      ]
    },
    {
      "name": "Deposits",
      "item": [
        {
          "name": "Get All Deposits",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/deposits?select=*,client_incentives(*),expenses(*)&order=date.desc",
              "host": ["{{baseUrl}}"],
              "path": ["deposits"],
              "query": [
                {
                  "key": "select",
                  "value": "*,client_incentives(*),expenses(*)"
                },
                {
                  "key": "order",
                  "value": "date.desc"
                }
              ]
            }
          }
        },
        {
          "name": "Create Deposit",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"id\": \"{{$randomUUID}}\",\n  \"date\": \"2024-01-20\",\n  \"local_deposit\": 50000,\n  \"usdt_deposit\": 30000,\n  \"cash_deposit\": 20000,\n  \"local_withdraw\": 0,\n  \"usdt_withdraw\": 0,\n  \"cash_withdraw\": 0,\n  \"submitted_by\": \"user_id\",\n  \"submitted_by_name\": \"User Name\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/deposits",
              "host": ["{{baseUrl}}"],
              "path": ["deposits"]
            }
          }
        }
      ]
    },
    {
      "name": "Banks",
      "item": [
        {
          "name": "Get All Banks",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/banks?is_active=eq.true",
              "host": ["{{baseUrl}}"],
              "path": ["banks"],
              "query": [
                {
                  "key": "is_active",
                  "value": "eq.true"
                }
              ]
            }
          }
        },
        {
          "name": "Create Bank",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"id\": \"{{$randomUUID}}\",\n  \"name\": \"Test Bank\",\n  \"is_active\": true\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/banks",
              "host": ["{{baseUrl}}"],
              "path": ["banks"]
            }
          }
        }
      ]
    },
    {
      "name": "Bank Transactions",
      "item": [
        {
          "name": "Get All Bank Transactions",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/bank_transactions?select=*,banks(name)&order=date.desc",
              "host": ["{{baseUrl}}"],
              "path": ["bank_transactions"],
              "query": [
                {
                  "key": "select",
                  "value": "*,banks(name)"
                },
                {
                  "key": "order",
                  "value": "date.desc"
                }
              ]
            }
          }
        },
        {
          "name": "Create Bank Transaction",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"id\": \"{{$randomUUID}}\",\n  \"date\": \"2024-01-20\",\n  \"bank_id\": \"bank_uuid\",\n  \"deposit\": 100000,\n  \"withdraw\": 25000,\n  \"remaining\": 750000,\n  \"submitted_by\": \"user_id\",\n  \"submitted_by_name\": \"User Name\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/bank_transactions",
              "host": ["{{baseUrl}}"],
              "path": ["bank_transactions"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 11. CURL EXAMPLES

### Get All Staff
```bash
curl -X GET "https://uwooqqjtwnorpiszpeah.supabase.co/rest/v1/staff?select=*,staff_permissions(*)" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk"
```

### Create New Bank
```bash
curl -X POST "https://uwooqqjtwnorpiszpeah.supabase.co/rest/v1/banks" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Test Bank",
    "is_active": true
  }'
```

### Create Bank Transaction
```bash
curl -X POST "https://uwooqqjtwnorpiszpeah.supabase.co/rest/v1/bank_transactions" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "date": "2024-01-20",
    "bank_id": "123e4567-e89b-12d3-a456-426614174000",
    "deposit": 100000,
    "withdraw": 25000,
    "remaining": 750000,
    "submitted_by": "78220c5c-7d65-43b0-b434-ce58a3124306",
    "submitted_by_name": "Admin"
  }'
```

---

## 12. JAVASCRIPT/REACT EXAMPLES

### Using Supabase Client
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uwooqqjtwnorpiszpeah.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk'

const supabase = createClient(supabaseUrl, supabaseKey)

// Get all staff
const { data: staff, error } = await supabase
  .from('staff')
  .select('*, staff_permissions(*)')

// Create new bank
const { data: bank, error } = await supabase
  .from('banks')
  .insert({
    id: crypto.randomUUID(),
    name: 'New Bank',
    is_active: true
  })

// Create bank transaction
const { data: transaction, error } = await supabase
  .from('bank_transactions')
  .insert({
    id: crypto.randomUUID(),
    date: '2024-01-20',
    bank_id: 'bank_uuid',
    deposit: 100000,
    withdraw: 25000,
    remaining: 750000,
    submitted_by: 'user_id',
    submitted_by_name: 'User Name'
  })
```

---

This comprehensive API collection covers all the endpoints used in the Fliptrade Admin Panel. You can use these APIs to:

1. **Test the application** using Postman or curl
2. **Integrate with other systems**
3. **Build mobile apps** or other frontends
4. **Debug issues** by testing individual endpoints
5. **Monitor data** directly from the database

All APIs are now properly configured to work with your Supabase database! 🚀
