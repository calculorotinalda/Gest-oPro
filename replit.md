# GestãoPro - Software de Gestão Comercial

## Overview
Sales management software inspired by Cegid Business, designed for Portuguese legislation compliance. Features modules for sales, inventory, purchases, current accounts (customers/suppliers), banking, exploration maps, and SAF-T export.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack React Query

## Structure
```
client/src/
  pages/
    dashboard.tsx     - Main dashboard with KPIs and charts
    vendas.tsx        - Sales documents (invoices, credit/debit notes)
    compras.tsx       - Purchase documents
    inventario.tsx    - Product inventory management
    clientes.tsx      - Customer current accounts
    fornecedores.tsx  - Supplier current accounts
    bancos.tsx        - Bank account management
    mapas.tsx         - Exploration maps (analytics/reports)
    saft.tsx          - SAF-T export for Portuguese legislation
  components/
    app-sidebar.tsx   - Navigation sidebar
    invoice-form.tsx  - Invoice creation form
    invoice-detail.tsx - Invoice detail view
  lib/
    format.ts         - Currency/date/number formatting (pt-PT)
    queryClient.ts    - TanStack Query client config

server/
  db.ts              - Database connection (Drizzle + pg)
  storage.ts         - Storage layer with CRUD operations
  routes.ts          - API routes + SAF-T XML generation
  seed.ts            - Database seed data

shared/
  schema.ts          - Drizzle schema + Zod validation + TypeScript types
```

## Database Tables
- companies, customers, suppliers, products
- invoices, invoice_items
- purchases, purchase_items
- bank_accounts, bank_transactions
- receipts

## Key Features
- Dashboard with revenue/expenses/profit charts
- Sales documents (FT, FS, FR, NC, ND)
- Purchase management with stock updates
- Customer & supplier current accounts
- Bank account management with transactions
- Exploration maps (analytics)
- SAF-T export (sales + inventory) per Portuguese law

## API Endpoints
All prefixed with `/api/`:
- GET/POST customers, suppliers, products
- GET/POST invoices (with items)
- GET/POST purchases (with items)
- GET/POST bank-accounts, bank-transactions
- GET/POST receipts
- GET dashboard (stats)
- GET saft/sales, saft/inventory (XML download)
