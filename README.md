# FixAndEarn

**FixAndEarn** is a mobile-first, on-demand skilled worker marketplace for Nigeria.

It connects verified **Clients** (people who need services) with verified **Fixers** (skilled workers).

FixAndEarn uses an internal currency system (FEC) for platform accounting and wallet balances. Client payments are processed through **Monnify**, while FixAndEarn does not operate as a custodian or escrow holder of client funds.

The platform uses full identity verification and maintains immutable financial records through wallet and ledger systems.

---

## 🚀 Key Features

### User Platform

- **Role-based accounts** – one verified identity can operate as both Client and Fixer.
- **Identity verification** – NIN, BVN, live selfie, utility bill, address, and skills verification.
- **Job marketplace** – clients can post jobs, receive applications, negotiate, and agree on a final price.
- **Standard job payments** – clients complete the required initial payment through Monnify before a job becomes active.
- **Urgent hiring** – clients can hire available Fixers directly and complete the required payment through Monnify.
- **Negotiation & final payment** – once a job price is agreed, the client completes the final payment through Monnify before work begins.
- **Non-custodial payment architecture** – FixAndEarn does not hold client funds in escrow before work is completed. Payments are processed by Monnify and settled to the platform according to the payment provider's settlement process.
- **Completion payment release** – when a client approves a Fixer's completion request, 90% of the agreed job amount is credited to the Fixer's available earnings and 10% is recorded as the platform commission.
- **Wallet & earnings** – Fixers can view their available earnings and transaction history.
- **Withdrawals** – Fixers submit withdrawal requests when they want to transfer available earnings to their bank account.
- **Payment notifications** – Fixers receive a clear notification when a completion payment is released to their available earnings, including the payment amount, 90% earnings allocation, and 10% platform fee.
- **Messaging & negotiation** – in-app chat with monitoring and AI-assisted flagging for phone numbers, WhatsApp references, and potential off-platform transactions.
- **Ratings & reviews** – clients can rate and review Fixers after completed jobs.
- **Dispute resolution** – admin-mediated dispute handling for jobs where completion or payment-related issues arise.

---

## 💳 Payment Architecture

FixAndEarn uses a non-custodial payment model.

### Payment Provider

**Monnify** is the external payment provider responsible for processing client payments.

FixAndEarn does not collect client funds into an internal escrow account or hold client money while work is being performed.

### Standard Job Payment

The standard job flow is:

1. Client creates a job draft.
2. Client completes the required payment through Monnify.
3. Monnify confirms the payment through its webhook.
4. Backend verifies and records the successful payment.
5. The job becomes available according to the applicable job flow.

### Urgent Hire

The urgent hire flow is:

1. Client creates a job draft.
2. Client browses available Fixers.
3. Client selects **Hire Now**.
4. Client completes the required payment through Monnify.
5. Monnify confirms the payment through its webhook.
6. Backend verifies the payment.
7. The selected Fixer is assigned to the job.

### Negotiated Job Payment

For jobs where the client and Fixer negotiate a final price:

1. Client and Fixer agree on the final amount.
2. Backend creates the required payment record.
3. Client completes the final payment through Monnify.
4. Monnify confirms successful payment through its webhook.
5. Backend verifies and records the payment.
6. The job transitions to **IN_PROGRESS**.
7. The Fixer can begin work.

### Completion & Earnings Release

When the Fixer completes the work:

1. Fixer submits a completion request.
2. Client reviews the completed work.
3. Client approves the completion request.
4. Backend processes the payment release.
5. **90%** of the agreed amount is credited to the Fixer's available earnings.
6. **10%** is recorded as the platform commission.
7. No bank transfer is initiated at this stage.
8. Fixer receives a payment-release notification showing the complete breakdown.
9. Fixer can later submit a withdrawal request for available earnings.

### Withdrawal

Bank payout occurs only through the withdrawal flow.

1. Fixer submits a withdrawal request.
2. Backend validates the withdrawal request and available balance.
3. The withdrawal is recorded through the wallet and ledger system.
4. The payout process is initiated.
5. The withdrawal status is updated according to the result of the payout process.

This separation ensures that **completion approval and bank payout are two separate operations**.

---

## 💰 Internal Currency & Ledger

FixAndEarn uses **FEC** as its internal accounting currency.

- **1 FEC = 1,000 milliFEC**
- **1 milliFEC = ₦1**

Financial amounts are represented internally using milliFEC to avoid floating-point inaccuracies.

The wallet system uses immutable ledger entries to maintain a complete financial history.

The ledger records relevant financial events including:

- Job payment records
- Fixer earnings
- Platform commissions
- Wallet credits
- Wallet debits
- Withdrawal requests
- Withdrawal processing
- Payment reversals or adjustments where applicable

Wallet balances and ledger entries must remain consistent throughout the payment lifecycle.

---

## 🛡️ Payment Integrity & Idempotency

Financial operations are designed to be idempotent.

Payment webhooks, completion approvals, earnings credits, commission records, and withdrawal processing must not create duplicate financial transactions when the same request or provider event is received more than once.

The backend remains the source of truth for:

- Payment status
- Job status
- Completion status
- Wallet balances
- Ledger entries
- Platform commissions
- Withdrawal status
- Ratings and reviews

The frontend does not calculate or assume financial outcomes. It displays the values returned by the backend.

---

## 👨‍💼 Admin Panel

- **Role hierarchy** – Super Admin, Verification Officer, Finance Officer, Support Officer, Security Officer.
- **Verification queue** – approve, reject, or request reupload.
- **User management** – search, filter, suspend, force re-verify, and manage user information.
- **Finance oversight** – monitor payments, commissions, Fixer earnings, withdrawal requests, and financial records.
- **Payment monitoring** – view payment records and payment status without treating FixAndEarn as an escrow custodian.
- **Withdrawal management** – review and process Fixer withdrawal requests.
- **Dispute management** – investigate and resolve disputes while maintaining consistent job, payment, wallet, and ledger states.
- **Messaging oversight** – view flagged conversations, warn users, and restrict chats where necessary.
- **Analytics** – platform KPIs, registration metrics, client/Fixer activity, financial metrics, and charts.
- **Content management** – manage Terms of Service, Privacy Policy, FAQ, Support content, skills, banks, and other configurable platform content.
- **Audit logs** – maintain an exportable security and operational audit trail.

---

## 🔐 Security & Compliance

- **NDPR-focused privacy architecture** – consent, data minimisation, and appropriate handling of personal information.
- **Encryption** – sensitive identity and financial information is protected using appropriate encryption mechanisms.
- **Argon2 password hashing** – passwords are securely hashed using Argon2.
- **Two-factor authentication** – mandatory for administrator accounts.
- **Withdrawal PIN** – required for Fixers to request withdrawals.
- **Email verification** – required before account access.
- **Phone verification** – available as an additional verification mechanism.
- **Role-based access control** – platform functionality is restricted according to user and administrator roles.
- **Audit logging** – security-sensitive and administrative activities are recorded for accountability.

---

## 🧰 Tech Stack

### Backend (`apps/api`)

- **NestJS** – modular backend framework
- **Prisma** – ORM for PostgreSQL
- **PostgreSQL** – relational database
- **JWT** – authentication
- **Argon2** – password hashing
- **Nodemailer** – transactional email
- **Monnify** – client payment processing and bank payout infrastructure
- **Socket.io** – real-time communication
- **Jest** – backend unit and end-to-end testing

### Frontend (`apps/web`)

- **Next.js** – App Router and Turbopack
- **TypeScript**
- **Tailwind CSS** – styling and dark mode
- **React Hook Form** + **Zod** – forms and validation
- **TanStack Query** – server state management
- **Socket.io** – real-time chat and communication
- **Tiptap** – rich text editing for administrator-managed content
- **DOMPurify** – HTML sanitisation for rendered rich text

### DevOps & Tooling

- **pnpm** – monorepo package manager
- **Docker** – optional PostgreSQL container
- **Prisma Migrations** – database schema management
- **Jest** – automated backend testing

---

## 📦 Project Structure

```text
fixandearn/
├── apps/
│   ├── api/                  # NestJS backend
│   └── web/                  # Next.js frontend
├── package.json              # Root package configuration
├── pnpm-workspace.yaml       # pnpm workspace configuration
└── README.md