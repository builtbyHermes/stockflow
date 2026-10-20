# StockFlow API documentation

This document reflects the current StockFlow Express API as implemented in the repository.

Base URL:

- Local development: http://localhost:4000

Authentication:

- The API uses a cookie-based session named `stockflow_session`.
- Cookies are set on login and cleared on logout.
- Authenticated routes require the `stockflow_session` cookie in the request headers.
- Authentication is enforced by `requireAuth` middleware.
- Certain routes also enforce `ADMIN` authorization using `requireRole("ADMIN")`.

Common headers:

- `Content-Type: application/json` for JSON requests
- `Cookie: stockflow_session=<token>` for authenticated requests

Common status codes:

- `200` Success
- `201` Created
- `400` Validation or malformed request
- `401` Authentication required or invalid/expired session
- `403` Forbidden for insufficient role permissions
- `404` Resource not found
- `409` Conflict, invalid state, or duplicate business rule
- `500` Internal server error

---

## 1) Health and app metadata

### GET /

Purpose: Basic service check.
Authentication: Not required.
Roles: Public.
Response: `200`
Example:

```json
{
  "message": "Welcome to StockFlow API",
  "status": "running"
}
```

### GET /api/health

Purpose: App health check.
Authentication: Not required.
Roles: Public.
Response: `200`
Example:

```json
{
  "status": "healthy",
  "timestamp": "2026-10-21T00:00:00.000Z"
}
```

---

## 2) Authentication

### POST /api/auth/login

Purpose: Authenticate a user and issue a session cookie.
Authentication: Not required.
Roles: Public.
Request body:

```json
{
  "email": "admin@example.com",
  "password": "YourPassword123!"
}
```

Validation:

- `email` must be a valid email address and is normalized to lowercase.
- `password` must be a non-empty string up to 128 characters.

Success response: `200`
Example:

```json
{
  "message": "Login successful.",
  "user": {
    "id": "<uuid>",
    "name": "StockFlow Admin",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "expiresAt": "2026-10-27T00:00:00.000Z"
}
```

Set-Cookie:

- `stockflow_session=<token>; HttpOnly; SameSite=Lax; Path=/`
- In production, the cookie is also sent with `Secure`.

Error responses:

- `400` invalid login payload
- `401` invalid email / password

### GET /api/auth/session

Purpose: Check the current authenticated session.
Authentication: Requires valid `stockflow_session` cookie.
Roles: Any authenticated user.
Success response: `200`
Example:

```json
{
  "authenticated": true,
  "user": {
    "id": "<uuid>",
    "name": "StockFlow Admin",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "expiresAt": "2026-10-27T00:00:00.000Z"
}
```

Error responses:

- `401` if no cookie is present or the session is invalid/expired

### POST /api/auth/logout

Purpose: Invalidates the current session and clears the cookie.
Authentication: Uses the current request cookie if present.
Roles: Public, but session is removed only if the cookie matches an active session.
Success response: `200`
Example:

```json
{
  "message": "Logout successful."
}
```

---

## 3) Products

Base path: `/api/products`
Authentication: Required.
Roles: Any authenticated user, except delete is restricted to `ADMIN`.

### GET /api/products

Purpose: List active products.
Response: `200`
Example:

```json
{
  "products": [
    {
      "id": "<uuid>",
      "sku": "SKU-001",
      "name": "Laptop",
      "description": "Business laptop",
      "price": "45000.00",
      "costPrice": "38000.00",
      "stockQuantity": 10,
      "reorderLevel": 5,
      "isActive": true,
      "createdAt": "2026-10-18T12:00:00.000Z",
      "updatedAt": "2026-10-18T12:00:00.000Z"
    }
  ]
}
```

### GET /api/products/:id

Purpose: Fetch a single active product by UUID.
Path param:

- `id`: UUID string

Response: `200`
Error: `400` invalid UUID, `404` product not found

### POST /api/products

Purpose: Create product.
Request body:

```json
{
  "sku": "SKU-001",
  "name": "Laptop",
  "description": "Business laptop",
  "price": 45000,
  "costPrice": 38000,
  "stockQuantity": 10,
  "reorderLevel": 5,
  "isActive": true
}
```

Validation:

- `sku`: non-empty string, max 100 chars
- `name`: non-empty string, max 200 chars
- `description`: optional nullable string up to 1000 chars
- `price` and `costPrice`: non-negative finite numbers with at most two decimal places
- `stockQuantity`: integer `>= 0`, default `0`
- `reorderLevel`: integer `>= 0`, default `10`
- `isActive`: boolean, default `true`

Success: `201`
Error: `400` invalid data, `409` duplicate SKU

### PATCH /api/products/:id

Purpose: Update a product.
Path param:

- `id`: UUID

Request body: any subset of allowed fields.
Example:

```json
{
  "name": "Updated Laptop",
  "reorderLevel": 8
}
```

Validation:

- At least one field must be provided.
- Same field validation rules as create product.

Success: `200`
Error: `400` invalid payload, `404` product not found

### DELETE /api/products/:id

Purpose: Soft-delete a product by marking it inactive.
Authentication: Requires valid session and `ADMIN` role.
Response: `200`
Example:

```json
{
  "product": {
    "id": "<uuid>",
    "isActive": false
  },
  "deleted": true
}
```

Error: `401` auth required, `403` insufficient permissions, `404` product not found

---

## 4) Suppliers

Base path: `/api/suppliers`
Authentication: Required.
Roles: Any authenticated user, except delete is restricted to `ADMIN`.

### GET /api/suppliers

Purpose: List active suppliers.
Response: `200`

### GET /api/suppliers/:id

Purpose: Fetch one active supplier.
Path param:

- `id`: UUID

### POST /api/suppliers

Purpose: Create supplier.
Request body:

```json
{
  "name": "Tech Supplies",
  "email": "sales@example.com",
  "phone": "+251911000000",
  "address": "Addis Ababa, Ethiopia"
}
```

Validation:

- `name`: required string up to 200 chars
- `email`: optional valid email up to 254 chars
- `phone`: optional string up to 30 chars
- `address`: optional string up to 500 chars

Success: `201`
Error: `400` invalid data, `409` conflict if unique data is duplicated

### PATCH /api/suppliers/:id

Purpose: Update supplier.
Path param: `id` as UUID

### DELETE /api/suppliers/:id

Purpose: Soft-delete supplier by setting `isActive` to `false`.
Role: `ADMIN`
Response: `200`

---

## 5) Purchase orders

Base path: `/api/purchase-orders`
Authentication: Required.
Roles: Any authenticated user.

### GET /api/purchase-orders

Purpose: List purchase orders.
Response: `200`
Example:

```json
{
  "purchaseOrders": [
    {
      "id": "<uuid>",
      "orderNumber": "PO-1700000000000-ABCDEF12",
      "supplierId": "<uuid>",
      "createdById": "<uuid>",
      "status": "DRAFT",
      "notes": "Optional notes",
      "orderedAt": null,
      "receivedAt": null,
      "items": []
    }
  ]
}
```

### GET /api/purchase-orders/:id

Purpose: Get one purchase order with related supplier, creator, and items.
Response: `200`
Error: `404` if not found

### POST /api/purchase-orders

Purpose: Create a draft purchase order.
Request body:

```json
{
  "supplierId": "<uuid>",
  "notes": "Incoming shipment for Q4",
  "items": [
    {
      "productId": "<uuid>",
      "orderedQuantity": 5,
      "unitCost": 120
    }
  ]
}
```

Validation:

- `supplierId` must be a valid UUID and active
- `items` must contain at least one item
- each item must have unique `productId`
- each `orderedQuantity` is an integer > 0
- each `unitCost` is a non-negative number with at most two decimal places
- products must exist and be active

Success: `201`
Error: `400` invalid or inactive supplier/product, `401` auth required

### PATCH /api/purchase-orders/:id/order

Purpose: Mark a draft order as `ORDERED`.
Status transition: `DRAFT -> ORDERED`
Success: `200`
Error:

- `404` if not found
- `409` if not in `DRAFT` state

### POST /api/purchase-orders/:id/receive

Purpose: Receive goods against an order.
Authentication: Required.
Request body:

```json
{
  "items": [
    {
      "productId": "<uuid>",
      "receivedQuantity": 2
    }
  ]
}
```

Validation:

- Product IDs must be valid UUIDs
- At least one item must be supplied
- `receivedQuantity` must be an integer > 0
- Each product can appear only once in a receive call
- Requested receive quantity cannot exceed remaining open quantity for that item

Status rules:

- Allowed only when order status is `ORDERED` or `PARTIALLY_RECEIVED`
- On successful receipt, relevant product stock increases and a `PURCHASE` stock movement is recorded
- A fully received order transitions to `RECEIVED`
- After a PO is `RECEIVED`, no further receiving is allowed

Success response: `200`
Example:

```json
{
  "message": "Purchase order items received successfully",
  "purchaseOrder": {
    "id": "<uuid>",
    "status": "PARTIALLY_RECEIVED",
    "items": [
      {
        "productId": "<uuid>",
        "orderedQuantity": 5,
        "receivedQuantity": 2,
        "unitCost": "120.00"
      }
    ]
  }
}
```

Error responses:

- `400` invalid receive payload or product not in order
- `404` purchase order not found
- `409` invalid status, over-receive, or not allowed for a closed/canceled order

### PATCH /api/purchase-orders/:id/cancel

Purpose: Cancel a draft or ordered purchase order.
Authentication: Requires `ADMIN` role.
Status transition: `DRAFT|ORDERED -> CANCELED`
Success: `200`
Error: `404` not found, `409` if already not cancellable

### PATCH /api/purchase-orders/:id

Purpose: Update a draft purchase order.
Authentication: Required.
Validation:

- only draft orders can be updated
- `supplierId`, `notes`, and `items` are allowed per validation schema

---

## 6) Stock adjustments

Base path: `/api/stock-adjustments`
Authentication: Required.
Roles: Any authenticated user.

### GET /api/stock-adjustments

Purpose: List stock adjustments with optional `productId`, `limit`, and `offset` filters.
Query params:

- `productId`: UUID
- `limit`: integer 1..100
- `offset`: non-negative integer

Response: `200`
Example:

```json
{
  "adjustments": [
    {
      "id": "<uuid>",
      "productId": "<uuid>",
      "type": "ADJUSTMENT",
      "quantityChange": 3,
      "quantityAfter": 12,
      "reason": "Inventory correction",
      "createdBy": {
        "id": "<uuid>",
        "name": "StockFlow User",
        "email": "user@example.com",
        "role": "STAFF"
      }
    }
  ],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "returned": 1,
    "total": 1
  }
}
```

### GET /api/stock-adjustments/:id

Purpose: Get one adjustment record.
Response: `200` or `404`

### POST /api/stock-adjustments

Purpose: Create an inventory adjustment.
Request body:

```json
{
  "productId": "<uuid>",
  "quantityChange": 3,
  "reason": "Inventory correction"
}
```

Validation:

- `productId` must be a valid UUID and active
- `quantityChange` must be a non-zero integer
- `reason` must be 1..500 chars
- The resulting stock quantity cannot become negative

Side effects:

- Increments or decrements the target product stock quantity
- Creates a `StockMovement` row with `type: "ADJUSTMENT"`
- Stores `createdById` associated with the acting user

Success: `201`
Example:

```json
{
  "product": {
    "id": "<uuid>",
    "sku": "SKU-001",
    "name": "Laptop",
    "stockQuantity": 14,
    "isActive": true
  },
  "adjustment": {
    "id": "<uuid>",
    "productId": "<uuid>",
    "createdById": "<uuid>",
    "purchaseOrderId": null,
    "type": "ADJUSTMENT",
    "quantityChange": 3,
    "quantityAfter": 14,
    "reason": "Inventory correction"
  }
}
```

Error responses:

- `400` invalid payload
- `401` auth required
- `404` product not found
- `409` inactive product or negative resulting stock

---

## 7) Stock movement history

Base path: `/api/stock-movements`
Authentication: Required.
Roles: Any authenticated user.

### GET /api/stock-movements

Purpose: List stock movement history.
Query params:

- `productId`: filter by product UUID
- `type`: one of `PURCHASE`, `SALE`, `ADJUSTMENT`, `RETURN`
- `startDate`, `endDate`: ISO 8601 date or datetime values
- `limit`: integer 1..100
- `offset`: integer >= 0

Example query:

```http
GET /api/stock-movements?productId=uuid&limit=20&offset=0
```

Response: `200`
Example:

```json
{
  "stockMovements": [
    {
      "id": "<uuid>",
      "productId": "<uuid>",
      "createdById": "<uuid>",
      "purchaseOrderId": "<uuid>",
      "type": "PURCHASE",
      "quantityChange": 5,
      "quantityAfter": 20,
      "unitCost": "120.00",
      "reason": "Received against PO-...",
      "createdAt": "2026-10-20T00:00:00.000Z",
      "product": {
        "id": "<uuid>",
        "sku": "SKU-001",
        "name": "Laptop"
      },
      "createdBy": {
        "id": "<uuid>",
        "name": "StockFlow Admin",
        "email": "admin@example.com"
      },
      "purchaseOrder": {
        "id": "<uuid>",
        "orderNumber": "PO-...",
        "status": "PARTIALLY_RECEIVED"
      }
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "returned": 1,
    "total": 1
  }
}
```

### GET /api/stock-movements/:id

Purpose: Fetch one stock movement record.
Response: `200` or `404`

---

## 8) Important business constraints

The current implementation explicitly enforces the following:

- Products and suppliers are soft-deleted via `isActive = false`, not hard-deleted.
- Purchase orders cannot be received unless their status is `ORDERED` or `PARTIALLY_RECEIVED`.
- The receive endpoint validates remaining open quantity before applying inventory changes.
- Stock adjustments cannot reduce quantity below zero.
- Stock movement records capture the actor (`createdById`) and, when relevant, the related purchase order.
- Product and supplier changes are persisted in PostgreSQL through Prisma.

---

## 9) Local testing notes

Recommended local workflow:

1. Create a PostgreSQL database for the app and set `DATABASE_URL`.
2. Install dependencies: `npm install`
3. Run migrations or schema sync: `npx prisma migrate dev` or `npx prisma db push`
4. Start dev server: `npm run dev`
5. Log in via `/api/auth/login` and keep the session cookie for subsequent requests.

Example login request:

```bash
curl -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourPassword123!"
  }'
```

Example protected request:

```bash
curl -b cookies.txt http://localhost:4000/api/products
```

Example purchase-order receive:

```bash
curl -b cookies.txt -X POST http://localhost:4000/api/purchase-orders/<po-id>/receive \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{ "productId": "<uuid>", "receivedQuantity": 2 }]
  }'
```
