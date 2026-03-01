# ShieldX Backend — Policy Management System API

REST API built with **Node.js + Express + PostgreSQL**

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in yo   ur values
cp .env.example .env

# 3. Create PostgreSQL database
createdb shieldx

# 4. Run migrations + seed data
npm run migrate

# 5. Start dev server
npm run dev
# → Server running at http://localhost:5000
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login → JWT token |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/products` | ❌ | List all products |
| POST | `/api/calculator/premium` | ❌ | Calculate premium |
| GET | `/api/policies/my` | ✅ | My policies |
| POST | `/api/policies` | ✅ | Purchase policy |
| GET | `/api/policies/:id/certificate` | ✅ | Download PDF cert |
| PUT | `/api/policies/:id/approve` | 🔐 Underwriter | Approve/reject |
| GET | `/api/claims/my` | ✅ | My claims |
| POST | `/api/claims` | ✅ | File a claim |
| PUT | `/api/claims/:id/status` | 🔐 Adjuster | Update claim status |
| POST | `/api/kyc/upload` | ✅ | Upload KYC document |
| GET | `/api/admin/analytics` | 🔐 Staff | Dashboard stats |
| GET | `/api/admin/audit` | 🔐 Admin | Audit trail |

## Default Test Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shieldx.in | Admin@123 |
| Underwriter | underwriter@shieldx.in | Admin@123 |
| Adjuster | adjuster@shieldx.in | Admin@123 |

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL + `pg` driver
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: express-validator
- **File uploads**: Multer
- **PDF generation**: PDFKit + QRCode
- **Email**: Nodemailer
- **Dev**: Nodemon
