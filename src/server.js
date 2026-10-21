require("dotenv").config();
const express = require("express");
const pool = require("./db");

const app = express();
app.use(express.json());

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const validId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const required = (obj, fields) => fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === "");

app.get("/", (req, res) => res.json({
  message: "Assignment 4 Retail Store REST API",
  endpoints: ["/api/products", "/api/suppliers", "/api/sales", "/api/reports"]
}));
app.get("/api/health", asyncHandler(async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok", database: "connected" });
}));

// PRODUCTS: create, list, get by ID, update, delete.
app.post("/api/products", asyncHandler(async (req, res) => {
  const missing = required(req.body, ["ProductName", "Price", "StockQuantity", "SupplierID"]);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
  const { ProductName, Price, StockQuantity, SupplierID } = req.body;
  if (Number(Price) < 0 || Number(StockQuantity) < 0) return res.status(400).json({ error: "Price and StockQuantity must be non-negative." });
  const [result] = await pool.execute(
    "INSERT INTO Products (ProductName, Price, StockQuantity, SupplierID) VALUES (?, ?, ?, ?)",
    [ProductName, Price, StockQuantity, SupplierID]
  );
  const [rows] = await pool.execute("SELECT * FROM Products WHERE ProductID = ?", [result.insertId]);
  res.status(201).json(rows[0]);
}));

app.get("/api/products", asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.ProductID, p.ProductName, p.Price, p.StockQuantity, p.SupplierID,
            s.SupplierName, p.Category
     FROM Products p JOIN Suppliers s ON s.SupplierID = p.SupplierID
     ORDER BY p.ProductID`
  ).catch(async () => pool.query(
    `SELECT p.ProductID, p.ProductName, p.Price, p.StockQuantity, p.SupplierID, s.SupplierName
     FROM Products p JOIN Suppliers s ON s.SupplierID = p.SupplierID ORDER BY p.ProductID`
  ));
  res.json(rows);
}));

app.get("/api/products/:id", asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid product ID." });
  const [rows] = await pool.execute("SELECT * FROM Products WHERE ProductID = ?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: "Product not found." });
  res.json(rows[0]);
}));

app.put("/api/products/:id", asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid product ID." });
  const missing = required(req.body, ["ProductName", "Price", "StockQuantity", "SupplierID"]);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
  const { ProductName, Price, StockQuantity, SupplierID } = req.body;
  const [result] = await pool.execute(
    "UPDATE Products SET ProductName=?, Price=?, StockQuantity=?, SupplierID=? WHERE ProductID=?",
    [ProductName, Price, StockQuantity, SupplierID, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: "Product not found." });
  const [rows] = await pool.execute("SELECT * FROM Products WHERE ProductID=?", [req.params.id]);
  res.json(rows[0]);
}));

app.delete("/api/products/:id", asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid product ID." });
  const [result] = await pool.execute("DELETE FROM Products WHERE ProductID=?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: "Product not found." });
  res.json({ message: "Product deleted." });
}));

// SUPPLIERS: create, list, get, delete.
app.post("/api/suppliers", asyncHandler(async (req, res) => {
  const missing = required(req.body, ["SupplierName", "ContactNumber"]);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
  const [result] = await pool.execute(
    "INSERT INTO Suppliers (SupplierName, ContactNumber) VALUES (?, ?)",
    [req.body.SupplierName, req.body.ContactNumber]
  );
  const [rows] = await pool.execute("SELECT * FROM Suppliers WHERE SupplierID=?", [result.insertId]);
  res.status(201).json(rows[0]);
}));

app.get("/api/suppliers", asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM Suppliers ORDER BY SupplierID");
  res.json(rows);
}));

app.get("/api/suppliers/:id", asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid supplier ID." });
  const [rows] = await pool.execute("SELECT * FROM Suppliers WHERE SupplierID=?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: "Supplier not found." });
  res.json(rows[0]);
}));

app.delete("/api/suppliers/:id", asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid supplier ID." });
  const [result] = await pool.execute("DELETE FROM Suppliers WHERE SupplierID=?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: "Supplier not found." });
  res.json({ message: "Supplier deleted." });
}));

// SALES: record a sale (reduces stock), list sales, list sales for a product.
app.post("/api/sales", asyncHandler(async (req, res) => {
  const missing = required(req.body, ["ProductID", "QuantitySold", "SaleDate"]);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
  const quantity = Number(req.body.QuantitySold);
  if (!Number.isInteger(quantity) || quantity <= 0) return res.status(400).json({ error: "QuantitySold must be a positive integer." });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [products] = await conn.execute("SELECT * FROM Products WHERE ProductID=? FOR UPDATE", [req.body.ProductID]);
    if (!products.length) {
      await conn.rollback();
      return res.status(404).json({ error: "Product not found." });
    }
    if (products[0].StockQuantity < quantity) {
      await conn.rollback();
      return res.status(409).json({ error: "Not enough stock." });
    }
    const [result] = await conn.execute(
      "INSERT INTO Sales (ProductID, QuantitySold, SaleDate) VALUES (?, ?, ?)",
      [req.body.ProductID, quantity, req.body.SaleDate]
    );
    await conn.execute("UPDATE Products SET StockQuantity=StockQuantity-? WHERE ProductID=?", [quantity, req.body.ProductID]);
    await conn.commit();
    const [rows] = await conn.execute("SELECT * FROM Sales WHERE SaleID=?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}));

app.get("/api/sales", asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT sa.SaleID, p.ProductName, sa.ProductID, sa.QuantitySold, sa.SaleDate
     FROM Sales sa JOIN Products p ON p.ProductID=sa.ProductID ORDER BY sa.SaleDate DESC, sa.SaleID DESC`
  );
  res.json(rows);
}));

app.get("/api/sales/product/:productId", asyncHandler(async (req, res) => {
  if (!validId(req.params.productId)) return res.status(400).json({ error: "Invalid product ID." });
  const [rows] = await pool.execute(
    "SELECT * FROM Sales WHERE ProductID=? ORDER BY SaleDate DESC, SaleID DESC",
    [req.params.productId]
  );
  res.json(rows);
}));

// Database modifications required by the assignment.
app.post("/api/database/products/add-category", asyncHandler(async (req, res) => {
  await pool.query("ALTER TABLE Products ADD COLUMN Category VARCHAR(100) NULL");
  res.json({ message: "Category column added to Products." });
}));
app.delete("/api/database/products/remove-category", asyncHandler(async (req, res) => {
  await pool.query("ALTER TABLE Products DROP COLUMN Category");
  res.json({ message: "Category column removed from Products." });
}));
app.post("/api/database/suppliers/contact-number-varchar15", asyncHandler(async (req, res) => {
  await pool.query("ALTER TABLE Suppliers MODIFY ContactNumber VARCHAR(15)");
  res.json({ message: "ContactNumber changed to VARCHAR(15)." });
}));
app.post("/api/database/products/product-name-not-null", asyncHandler(async (req, res) => {
  await pool.query("ALTER TABLE Products MODIFY ProductName VARCHAR(150) NOT NULL");
  res.json({ message: "ProductName is now NOT NULL." });
}));

// Specific task endpoints requested in the assignment.
app.patch("/api/tasks/update-bread-price", asyncHandler(async (req, res) => {
  const [result] = await pool.execute("UPDATE Products SET Price=25.00 WHERE ProductName='Bread'");
  if (!result.affectedRows) return res.status(404).json({ error: "Bread product not found." });
  res.json({ message: "Bread price updated to 25.00.", affectedRows: result.affectedRows });
}));

app.delete("/api/tasks/delete-eggs", asyncHandler(async (req, res) => {
  const [result] = await pool.execute("DELETE FROM Products WHERE ProductName='Eggs'");
  if (!result.affectedRows) return res.status(404).json({ error: "Eggs product not found, or it has sales referencing it." });
  res.json({ message: "Eggs product deleted.", affectedRows: result.affectedRows });
}));

// Reporting queries.
app.get("/api/reports/total-sold", asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.ProductID, p.ProductName, COALESCE(SUM(s.QuantitySold),0) AS TotalQuantitySold
     FROM Products p LEFT JOIN Sales s ON s.ProductID=p.ProductID
     GROUP BY p.ProductID, p.ProductName ORDER BY p.ProductID`
  );
  res.json(rows);
}));

app.get("/api/reports/highest-stock", asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM Products WHERE StockQuantity=(SELECT MAX(StockQuantity) FROM Products)");
  res.json(rows);
}));

app.get("/api/reports/suppliers-starting-with-f", asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM Suppliers WHERE SupplierName LIKE 'F%' ORDER BY SupplierName");
  res.json(rows);
}));

app.get("/api/reports/never-sold", asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.* FROM Products p LEFT JOIN Sales s ON s.ProductID=p.ProductID
     WHERE s.SaleID IS NULL ORDER BY p.ProductID`
  );
  res.json(rows);
}));

app.get("/api/reports/all-sales", asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.ProductName, s.QuantitySold, s.SaleDate
     FROM Sales s JOIN Products p ON p.ProductID=s.ProductID
     ORDER BY s.SaleDate, s.SaleID`
  );
  res.json(rows);
}));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_CANT_DROP_FIELD_OR_KEY") {
    return res.status(409).json({ error: "That schema change may already have been applied.", details: err.message });
  }
  if (err.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ error: "The referenced supplier/product does not exist." });
  if (err.code === "ER_ROW_IS_REFERENCED_2") return res.status(409).json({ error: "Cannot delete this record because another table references it." });
  res.status(500).json({ error: "Server error", details: err.message });
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
process.on("SIGINT", async () => { server.close(); await pool.end(); process.exit(0); });
