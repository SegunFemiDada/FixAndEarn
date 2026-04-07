# FixAndEarn

**FixAndEarn** is a mobile‑first, on‑demand skilled worker marketplace for Nigeria.  
It connects verified **Clients** (people who need services) with verified **Fixers** (skilled workers).  
All transactions use an internal currency (FEC), backed by an escrow system and full identity verification (NIN, BVN, selfie, address).

---

## 🚀 Key Features

### User Platform
- **Role‑based accounts** – one verified identity can be both Client and Fixer.
- **Identity verification** – NIN, BVN, live selfie, utility bill, address, skills.
- **Job marketplace** – post jobs (1 FEC fee), apply, negotiate, lock price.
- **Escrow payments** – funds are held in escrow until job completion.
- **Messaging & negotiation** – in‑app chat with AI flagging (phone, WhatsApp, off‑platform).
- **Wallet** – deposit via Paystack, withdraw to bank, withdrawal pin security.
- **Ratings & reviews** – 5‑star rating after job completion.
- **Dispute resolution** – admin‑mediated disputes after rejected completion.

### Admin Panel
- **Role hierarchy** – Super Admin, Verification Officer, Finance Officer, Support Officer, Security Officer.
- **Verification queue** – approve/reject/request reupload.
- **User management** – search, filter, suspend, force re‑verify, edit user data.
- **Finance oversight** – approve withdrawals, mark paid, view earnings trace.
- **Dispute management** – resolve disputes, release funds, refund, amicable resolution.
- **Messaging oversight** – view flagged conversations, warn users, restrict chats.
- **Analytics** – real‑time KPIs, registration metrics, client/fixer activity, charts.
- **Content management** – manage policies, FAQ, support content, skills, banks.
- **Audit logs** – exportable CSV, full security audit trail.

### Security & Compliance
- **NDPR compliant** – consent, data minimisation, right to erasure.
- **Encryption** – AES‑256 for BVN, NIN, bank details; Argon2 for passwords.
- **Two‑factor authentication** – mandatory for all admin accounts.
- **Withdrawal pin** – required for fixers to request payouts.
- **Email verification** – required before login.
- **Phone verification** – optional but available.

---

## 🧰 Tech Stack

### Backend (`apps/api`)
- [NestJS](https://nestjs.com/) – modular, type‑safe framework
- [Prisma](https://www.prisma.io/) – ORM with PostgreSQL
- [PostgreSQL](https://www.postgresql.org/) – relational database
- [JWT](https://jwt.io/) – authentication
- [Argon2](https://github.com/ranisalt/node-argon2) – password hashing
- [Nodemailer](https://nodemailer.com/) – email (Mailtrap for dev)
- [Paystack](https://paystack.com/) – deposits & payouts (sandbox ready)

### Frontend (`apps/web`)
- [Next.js](https://nextjs.org/) (App Router, Turbopack)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) – styling, dark mode
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) – forms & validation
- [TanStack Query](https://tanstack.com/query) – server state
- [Socket.io](https://socket.io/) – real‑time chat

### DevOps & Tooling
- **pnpm** – fast, disk‑efficient monorepo manager
- **Docker** – optional Postgres container
- **Jest** – unit & e2e tests (backend)

---

## 📦 Project Structure
fixandearn/
├── apps/
│ ├── api/ # NestJS backend
│ └── web/ # Next.js frontend
├── package.json # root (pnpm workspace)
├── pnpm-workspace.yaml
└── README.md

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 20+
- pnpm 8+
- PostgreSQL (or use Docker)

### 1. Clone & install

```bash
git clone https://github.com/your-org/fixandearn.git
cd fixandearn
pnpm install

2. Environment variables
Copy the example files and fill in your values:


cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
Required for full functionality:

DATABASE_URL – PostgreSQL connection string

JWT_ACCESS_SECRET – long random string

SMTP_* – for email (use Mailtrap for development)

PAYSTACK_SECRET_KEY – Paystack test key

3. Database

cd apps/api
npx prisma migrate dev
npx prisma db seed   # if you have a seed script
4. Run the apps
From the root:


# Backend (port 3000)
pnpm --filter api run start:dev

# Frontend (port 3001)
pnpm --filter web run dev
Visit http://localhost:3001 – you are ready to go.

🧪 Testing

# Backend unit + e2e tests
pnpm --filter api test

# Frontend (lint only)
pnpm --filter web lint
📄 License
This project is proprietary and confidential.
© FixAndEarn – all rights reserved.

🤝 Support
For issues or questions, please open a GitHub issue or contact the development team.