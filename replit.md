# Sales-Rotina - Software de Gestão Comercial

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
    dashboard.tsx          - Main dashboard with KPIs and charts
    vendas.tsx             - Sales documents (FT, FS, FR, NC, ND)
    compras.tsx            - Purchase documents (VFT, VFR, VNC, VND)
    inventario.tsx         - Product inventory management
    clientes.tsx           - Customer management
    fornecedores.tsx       - Supplier management
    contas-correntes.tsx   - Current accounts (RC, NP, RG)
    bancos.tsx             - Bank account management
    mapas.tsx              - Exploration maps (analytics/reports)
    saft.tsx               - SAF-T export for Portuguese legislation
  components/
    app-sidebar.tsx        - Navigation sidebar
    invoice-form.tsx       - Invoice creation form
    invoice-detail.tsx     - Invoice detail view
  lib/
    format.ts              - Currency/date/number formatting (pt-PT)
    queryClient.ts         - TanStack Query client config

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
- purchases (with type: VFT, VFR, VNC, VND), purchase_items
- bank_accounts, bank_transactions
- receipts (with type: RC, NP, RG; supports customer and supplier links)

## Document Types
### Sales (Vendas)
- FT: Fatura
- FS: Fatura Simplificada
- FR: Fatura-Recibo (auto-paid, no pending)
- NC: Nota de Crédito (reverses balance, increases stock)
- ND: Nota de Débito

### Purchases (Compras)
- VFT: V/Fatura (increases stock, creates supplier debt)
- VFR: V/Fatura-Recibo (increases stock, auto-paid, no supplier debt)
- VNC: V/Nota de Crédito (decreases stock, reduces supplier balance)
- VND: V/Nota de Débito

### Current Accounts (Contas Correntes)
- RC: Recibo (customer receipt, reduces customer balance)
- NP: Nota de Pagamento (supplier payment, reduces supplier balance)
- RG: Regularização (can be for customer or supplier, user selects entity)

## Key Features
- Dashboard with revenue/expenses/profit charts
- Sales documents with document type selection and payment status tracking
- Purchase management with document type selection, stock updates, and payment detail panel
- Customer & supplier management
- Current accounts with receipts, payment notes, and regularizations
  - Join between vendas/compras and contas correntes (receipts linked to invoices/purchases)
  - Partial payment support with amount validation (frontend + server-side)
  - Document info panel showing total/paid/pending with progress bar
  - Quick-fill buttons (Total, 50%) for payment amounts
  - "Doc. Origem" column showing linked invoice/purchase number
  - "Parcial" status badge for partially paid documents
- Bank account management with transactions
- Exploration maps (analytics with Vendas, Clientes, Artigos, Inventário tabs)
- SAF-T export (sales + inventory) per Portuguese law

## API Endpoints
All prefixed with `/api/`:
- GET/POST/PATCH/DELETE customers, suppliers, products
- GET/POST invoices (with items, type-based numbering)
- GET/POST purchases (with items, type-based numbering: VFT, VFR, VNC, VND)
- GET/POST bank-accounts, bank-transactions
- GET/POST receipts (type-based: RC, NP, RG)
- GET dashboard (stats)
- GET saft/sales, saft/inventory (XML download)
