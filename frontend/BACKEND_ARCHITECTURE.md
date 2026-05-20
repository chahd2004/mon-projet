# Backend Architecture & API Structure Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Angular Frontend (localhost:4200)              │
│                                                                   │
│  - pages/facture, pages/bon-commandes, pages/commandes, etc.     │
│  - services/...service.ts (HTTP calls to backend)                │
│  - models/ (TypeScript interfaces)                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   HTTP/CORS Requests
                  (JWT Bearer Token)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          Java Spring Boot Backend (localhost:8080)               │
│                                                                   │
│  ┌─ 16 REST Controllers ──────────────────────────────────────┐ │
│  │                                                             │ │
│  │  • AuthController (/api/auth)                             │ │
│  │  • BonCommandeController (/api/bon-commandes)             │ │
│  │  • CommandeController (/api/commandes)                    │ │
│  │  • FactureController (/api/factures)                      │ │
│  │  • DevisController (/api/devis)                           │ │
│  │  • ClientController (/api/clients)                        │ │
│  │  • EmetteurController (/api/emetteurs)                    │ │
│  │  • ProduitController (/api/produits)                      │ │
│  │  • BonLivraisonController (/api/bon-livraisons)           │ │
│  │  • AvoirController (/api/avoirs)                          │ │
│  │  • ConversionController (/api/conversions)                │ │
│  │  • SuperAdminController (/api/super-admin)                │ │
│  │  • EntrepriseAdminController (/api/entreprise-admin)      │ │
│  │  • ViewController (/api/viewer)                           │ │
│  │  • PublicDemandeController (/api/public/demandes)         │ │
│  │  • SuperAdminDemandeController (/api/super-admin/demandes)│ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─ Security Layer ───────────────────────────────────────────┐  │
│  │  • JWT Authentication (AuthController)                    │  │
│  │  • @PreAuthorize annotations (role checks)                │  │
│  │  • CORS filter (allows localhost:4200)                    │  │
│  │  • JwtInterceptor (adds token validation)                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ Business Logic ───────────────────────────────────────────┐  │
│  │  • Services (BonCommandeService, CommandeService, etc.)   │  │
│  │  • ConversionService (document workflow)                  │  │
│  │  • DemandeEmetteurService (company requests)              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ Data Layer ───────────────────────────────────────────────┐  │
│  │  • JPA Repositories for each Entity                       │  │
│  │  • Database (likely MySQL/MariaDB)                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Structure by Domain

### 1. Authentication & User Management
```
POST   /api/auth/register              → Create new account
POST   /api/auth/login                 → Get JWT token
GET    /api/auth/me                    → Get current user info
POST   /api/auth/change-password       → Update password
```

### 2. Document Workflow Lifecycle

```
                    Devis (Quote)
                    POST /api/devis
                         │
                         ├─────────────────────────┐
                         ▼                         ▼
                    Invoice (Direct)        Bon de Commande
                    POST /conversions/    POST /conversions/
                    devis → facture        devis → bon-commande
                         │                         │
                         │                   Send & Sign
                         │                   PUT /envoyer
                         │                   PUT /signer-client
                         │                   PUT /confirmer
                         │                         │
                         │                    Commande
                         │              POST /conversions/
                         │              bon-commande → commande
                         │                         │
                         │              ┌──────────┴──────────┐
                         │              ▼                     ▼
                         │         Bon de Livraison      Invoice (Direct)
                         │         POST /conversions/    POST /conversions/
                         │         commande →           commande → facture
                         │         bon-livraison
                         │              │
                         │              ▼
                         │         Invoice (from BL)
                         │         POST /conversions/
                         │         bon-livraison → facture
                         │              │
                         └──────────────┴───────────────┘
                                      │
                                      ▼
                              Credit Notes (Avoirs)
                         PUT /api/avoirs/{id}/...
```

### 3. Purchase Order Processing (Bon-Commandes)

```
Create → [ List ] ──┬──→ Send (envoyer)
                    │
                    ├──→ Client Signature (signer-client) [PUBLIC - no auth]
                    │
                    ├──→ Confirm (confirmer)
                    │
                    ├──→ Update (PUT)
                    │
                    └──→ Delete
```

### 4. Order Processing (Commandes)

```
Create (from Bon-Commande) → [ List ] ──┬──→ Confirm (confirmer)
                                         │
                                         ├──→ Start (demarrer)
                                         │
                                         ├──→ Deliver (livrer)
                                         │
                                         ├──→ Update (PUT)
                                         │
                                         └──→ Delete
```

---

## HTTP Methods Used

```
GET     - Retrieve data (9 endpoints per resource typically)
    ├─ Get all
    ├─ Get by ID
    ├─ Get user-specific list
    └─ Get by related ID

POST    - Create new resources (8 controllers support creation)
    ├─ Create entity
    └─ Create via conversion (6 special endpoints)

PUT     - Update or state changes (25+ endpoints)
    ├─ Update entity
    ├─ State transitions (envoyer, confirmer, etc.)
    ├─ Sign documents
    └─ Mark as delivered

DELETE  - Remove resources (10 endpoints)
    └─ Delete entity

PATCH   - Partial updates (3 special endpoints)
    └─ Change account status
    └─ Deactivate users
```

---

## Role-Based Access Control

```
┌────────────────────────────────────────────────────────────┐
│ SUPER_ADMIN (System Administrator)                          │
├────────────────────────────────────────────────────────────┤
│ • Full system access                                        │
│ • Manage all entities across all companies                 │
│ • Approve/Reject company requests                          │
│ • User & system management                                 │
│ • Statistical views                                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ENTREPRISE_ADMIN (Company Manager)                          │
├────────────────────────────────────────────────────────────┤
│ • Manage company data & resources                          │
│ • Create & manage team members                             │
│ • Create/manage products, clients, documents               │
│ • Read-only: can't create users                           │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ EMETTEUR (Seller/Company Employee)                          │
├────────────────────────────────────────────────────────────┤
│ • Create & manage own documents                            │
│ • View/manage company clients & products                   │
│ • Can't manage other users                                 │
│ • Can't change products/clients owned by others            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ENTREPRISE_VIEWER (Company Reader)                          │
├────────────────────────────────────────────────────────────┤
│ • Read-only access to company data                         │
│ • View documents, clients, products                        │
│ • Can't create or modify anything                          │
│ • Monitoring/reporting role                                │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ CLIENT (Buyer/External Customer)                            │
├────────────────────────────────────────────────────────────┤
│ • Limited access                                           │
│ • View/manage own profile                                  │
│ • View invoices & quotes                                   │
│ • Sign documents (public links)                            │
│ • Can't create documents                                   │
└────────────────────────────────────────────────────────────┘
```

---

## Data Models & Relationships

```
┌──────────────────────┐
│      User            │
├──────────────────────┤
│ id, email, password  │───┬─────→ Emetteur (Company)
│ nom, prenom          │   │       ├─ name, siret
│ role, status         │   │       ├─ address, contact
└──────────────────────┘   │       └─ products[]
        │                  │
        │                  └─────→ Client
        │                          ├─ name, address
        └─────→ (links to)         └─ contact info
```

### Key Entities

```
Devis (Quote)
├─ id, number, date
├─ vendeurId (Emetteur)
├─ acheteurId (Client)
└─ items[], montant, statut

↓ Conversion

Bon de Commande (Purchase Order)
├─ id, number, date
├─ vendeurId, acheteurId
├─ devisAssocieId
├─ items[], montant, statut
└─ requires client signature

↓ Conversion

Commande (Order)
├─ id, number, date
├─ vendeurId, acheteurId
├─ bonCommandeAssocieId
├─ items[], montant, statut
└─ workflow: pending → confirmed → in_progress → delivered

↓ Conversion (2 options)

Option A:              Option B:
Bon de Livraison       Facture (Invoice)
├─ (Delivery Note)     ├─ id, number, date
└─ signature           ├─ vendeurId, acheteurId
   ↓                   ├─ items[], montant
   Facture             ├─ statut

Avoir (Credit Note)
├─ Linked to Facture
├─ Partial/full credit
└─ Can be applied to other invoices
```

---

## Data Flow Example: Complete Purchase

```
1. SELLER ACTION
   └─→ Create Devis (Quote)
       POST /api/devis
       Response: Devis { id: 1, statut: "DRAFT" }

2. SELLER ACTION
   └─→ Send to Client
       PUT /api/devis/1/envoyer
       Response: Devis { statut: "SENT" }

3. CLIENT ACTION (via link)
   └─→ Accept Quote
       PUT /api/devis/1/accepter
       Response: Devis { statut: "ACCEPTED" }

4. SELLER ACTION
   └─→ Convert Quote to PO
       POST /api/conversions/devis/1/vers-bon-commande
       Response: BonCommande { id: 10, devisAssocieId: 1, statut: "PENDING" }

5. SELLER ACTION
   └─→ Send PO
       PUT /api/bon-commandes/10/envoyer
       Response: BonCommande { statut: "SENT" }

6. CLIENT ACTION (public link - NO AUTH)
   └─→ Sign PO
       PUT /api/bon-commandes/10/signer-client
       Response: BonCommande { statut: "SIGNED", signedBy: "client", signedDate: "..." }

7. SELLER ACTION
   └─→ Confirm PO
       PUT /api/bon-commandes/10/confirmer
       Response: BonCommande { statut: "CONFIRMED" }

8. SELLER ACTION
   └─→ Create Order from PO
       POST /api/conversions/bon-commande/10/vers-commande
       Response: Commande { id: 20, bonCommandeAssocieId: 10, statut: "PENDING" }

9. SELLER ACTION
   └─→ Confirm Order
       PUT /api/commandes/20/confirmer
       Response: Commande { statut: "CONFIRMED" }

10. SELLER ACTION
    └─→ Start Processing
        PUT /api/commandes/20/demarrer
        Response: Commande { statut: "IN_PROGRESS" }

11. SELLER ACTION
    └─→ Mark as Delivered
        PUT /api/commandes/20/livrer
        Response: Commande { statut: "DELIVERED" }

12. SELLER ACTION
    └─→ Create Invoice from Order
        POST /api/conversions/commande/20/vers-facture
        Response: Facture { id: 30, commandeAssocieId: 20, statut: "DRAFT", montant: ... }

13. SELLER ACTION
    └─→ Send Invoice
        PUT /api/factures/30/envoyer
        Response: Facture { statut: "SENT", sentDate: "..." }

14. SELLER ACTION
    └─→ Mark as Signed
        PUT /api/factures/30/signer
        Response: Facture { statut: "SIGNED" }

END: Invoice ready for payment tracking
```

---

## Security Features

```
┌─ Authentication ────────────────────────────────────────┐
│                                                          │
│  1. User registers/logs in                             │
│  2. Backend validates credentials                      │
│  3. Returns JWT token (e.g., 12+ hour expiration)      │
│  4. Client stores JWT in localStorage/sessionStorage   │
│  5. Every request includes: Authorization: Bearer JWT  │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌─ Authorization ─────────────────────────────────────────┐
│                                                          │
│  1. @PreAuthorize checks user role before action       │
│  2. Resource ownership verified (vendeurId, etc.)      │
│  3. Wrong role → 403 Forbidden                         │
│  4. Different company → 403 Forbidden                  │
│  5. SUPER_ADMIN bypasses most checks                   │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌─ Special Cases ─────────────────────────────────────────┐
│                                                          │
│  • Public Endpoints (no auth):                         │
│    - /api/auth/register                               │
│    - /api/auth/login                                  │
│    - /api/bon-commandes/{id}/signer-client           │
│    - /api/bon-livraisons/{id}/signer-client          │
│    - /api/public/demandes/* (company requests)       │
│                                                          │
│  • CORS: Only localhost:4200 allowed                   │
│    - Prevents cross-domain attacks                     │
│    - Enforces same-origin policy                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## HTTP Status Codes Returned

```
200 OK
  ✓ GET request successful
  ✓ PUT/DELETE successful (sometimes 204 instead)

201 Created
  ✓ POST request created new resource
  ✓ Returns new entity in response body

204 No Content
  ✓ DELETE successful
  ✓ No response body

400 Bad Request
  ✗ Missing required fields
  ✗ Invalid data format
  ✗ Validation errors

401 Unauthorized
  ✗ No JWT token provided
  ✗ JWT token expired
  ✗ Invalid token

403 Forbidden
  ✗ User lacks permission (wrong role)
  ✗ Resource doesn't belong to user
  ✗ Not the document owner

404 Not Found
  ✗ Resource doesn't exist
  ✗ Wrong endpoint URL

409 Conflict
  ✗ Invalid state transition
  ✗ Can't delete document in that status

500 Internal Server Error
  ✗ Backend error
  ✗ Database error
  ✗ Uncaught exception
```

---

## Summary Statistics

```
CONTROLLERS              16
TOTAL ENDPOINTS          ~114
HTTP METHODS
  ├─ GET                 40+
  ├─ POST                15+
  ├─ PUT                 25+
  ├─ DELETE              10+
  └─ PATCH               3+

ROLES                    5 (SUPER_ADMIN, ENTREPRISE_ADMIN, EMETTEUR, VIEWER, CLIENT)

PUBLIC ENDPOINTS         7
PROTECTED ENDPOINTS      ~107

DOCUMENT TYPES
  ├─ Devis (Quote)       9 endpoints
  ├─ Bon de Commande     9 endpoints
  ├─ Commande (Order)    10 endpoints
  ├─ Facture (Invoice)   9 endpoints
  ├─ Bon de Livraison    9 endpoints
  └─ Avoir (Credit)      7 endpoints

SPECIAL CONVERSIONS      6 document transformation endpoints

ADMIN FUNCTIONS
  ├─ Super Admin         9+ endpoints
  ├─ Enterprise Admin    5+ endpoints
  └─ Request Management  5 endpoints
```

---

## Integration Checklist for Frontend

✓ **Phase 1: Authentication**
- [ ] Register endpoint works
- [ ] Login returns JWT
- [ ] JWT stored securely
- [ ] Token included in headers
- [ ] Change password works

✓ **Phase 2: Core Documents**
- [ ] Devis CRUD works
- [ ] Bon de Commande CRUD works
- [ ] Commande CRUD works
- [ ] Facture CRUD works

✓ **Phase 3: Workflows**
- [ ] Conversions work (all 6 types)
- [ ] Document state transitions work
- [ ] Client signing works (public endpoints)

✓ **Phase 4: Administration**
- [ ] Client/Emetteur management
- [ ] Product management
- [ ] User role management
- [ ] Request approvals

✓ **Phase 5: Advanced**
- [ ] Credit notes
- [ ] Dispute handling
- [ ] Analytics/statistics
- [ ] Batch operations

---

## Common Development Patterns

```typescript
// Pattern 1: Get and display list
service.getAll().subscribe(
  (items: T[]) => this.items = items,
  (error) => this.handleError(error)
)

// Pattern 2: Create and redirect
service.create(newItem).subscribe(
  (created: T) => router.navigate(['/view', created.id]),
  (error) => this.showError(error)
)

// Pattern 3: State transition
service.updateState(id, newStatus).subscribe(
  (updated: T) => this.refresh(),
  (error) => this.showError(error)
)

// Pattern 4: Document conversion
conversionService.convert(sourceId, targetType).subscribe(
  (created: T) => router.navigate([`/view`, created.id]),
  (error) => this.showError(error)
)

// Pattern 5: Handle permissions
if (user.role !== 'SUPER_ADMIN') {
  // Hide/disable certain actions
  this.canDelete = false
}
```

