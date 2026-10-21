# Assignment 4 — MySQL + Node.js REST API

This project includes the three assignment parts: Musicana ERD, mapping of the supplied User/Product ERD, and a working Express + MySQL REST API for products, suppliers, and sales.

## Requirements
- Node.js 18+
- MySQL 8+ (XAMPP MySQL is fine)
- Postman (optional, for testing)

## 1. Configure
1. Extract the ZIP.
2. Open the project folder in WebStorm or VS Code.
3. Copy `.env.example` to `.env`.
4. Set `DB_USER`, `DB_PASSWORD`, and other database settings to match your local MySQL.
5. Open a terminal in this folder and run:

```bash
npm install
npm run init-db
```

The database `small_retail_store` and required tables will be created. If you use a MySQL account that cannot create databases, create the database manually and grant that account privileges first.

## 2. Add the sample records
Open phpMyAdmin or a MySQL client, select `small_retail_store`, and run the contents of `sql/seed-data.sql`. It inserts the required suppliers/products and a sample Milk sale dated `2025-05-20`. The script is written to avoid duplicating those sample records on repeated runs.

## 3. Start the API

```bash
npm start
```

Base URL: `http://localhost:3000`

Health check: `GET http://localhost:3000/api/health`

## 4. REST endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/products` | Create product |
| GET | `/api/products` | Retrieve all products |
| GET | `/api/products/:id` | Retrieve product by ID |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/suppliers` | Create supplier |
| GET | `/api/suppliers` | Retrieve all suppliers |
| GET | `/api/suppliers/:id` | Retrieve supplier details |
| DELETE | `/api/suppliers/:id` | Delete supplier |
| POST | `/api/sales` | Record a sale and reduce stock in a transaction |
| GET | `/api/sales` | Retrieve all sales |
| GET | `/api/sales/product/:productId` | Sales for a specific product |
| POST | `/api/database/products/add-category` | Add Category column |
| DELETE | `/api/database/products/remove-category` | Remove Category column |
| POST | `/api/database/suppliers/contact-number-varchar15` | Change ContactNumber to VARCHAR(15) |
| POST | `/api/database/products/product-name-not-null` | Set ProductName NOT NULL |
| PATCH | `/api/tasks/update-bread-price` | Set Bread price to 25.00 |
| DELETE | `/api/tasks/delete-eggs` | Delete Eggs product |
| GET | `/api/reports/total-sold` | Total quantity sold per product (SUM) |
| GET | `/api/reports/highest-stock` | Product(s) with highest stock |
| GET | `/api/reports/suppliers-starting-with-f` | Suppliers whose name starts with F |
| GET | `/api/reports/never-sold` | Products with no sales |
| GET | `/api/reports/all-sales` | Product name, quantity sold, sale date using JOIN |

### Example JSON bodies

Create supplier:
```json
{
  "SupplierName": "FreshFields Supplies",
  "ContactNumber": "01001234567"
}
```

Create product (replace `SupplierID` with an existing ID):
```json
{
  "ProductName": "Milk",
  "Price": 15.00,
  "StockQuantity": 50,
  "SupplierID": 1
}
```

Record sale:
```json
{
  "ProductID": 1,
  "QuantitySold": 2,
  "SaleDate": "2025-05-20"
}
```

## 5. MySQL user and permissions (requirements 14–16)
Set `STORE_MANAGER_PASSWORD` in `.env` to a strong unique password, then run:

```bash
npm run create-manager
```

This creates `store_manager`, grants SELECT/INSERT/UPDATE initially, revokes UPDATE, then grants DELETE only on the Sales table. Therefore the final grants are SELECT and INSERT across the database plus DELETE on Sales. The assignment explicitly asks for the revoke/grant sequence. Alternatively review `sql/permissions.sql` and execute it as a MySQL administrator after replacing its placeholder password.

**Security note:** do not commit `.env` or a real database password to GitHub. These schema-modification routes are for a local coursework demo; do not expose them on a public server.

## 6. Test in Postman
1. Start MySQL and confirm `GET /api/health` returns `{ "status": "ok", "database": "connected" }`.
2. Run the seed SQL.
3. Test `GET /api/suppliers`, then use an existing SupplierID to create a product.
4. Record a sale, then check `GET /api/reports/total-sold` and `GET /api/reports/all-sales`.
5. Test invalid IDs and insufficient stock to see validation responses.

## Assignment coverage
- Part 1: `docs/ERD-Musicana.md`
- Part 2: `docs/Database-Mapping.md`
- Part 3: `src/server.js`, `src/db.js`, `sql/`, and `scripts/`

**Important:** The provided screenshot is the assignment brief, not a starter code repository. Before submitting, run the project on your own computer, verify the database credentials, and capture your own successful Postman/ERD screenshots if your instructor requires them.
