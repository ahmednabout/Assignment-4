CREATE DATABASE IF NOT EXISTS small_retail_store
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE small_retail_store;

CREATE TABLE IF NOT EXISTS Suppliers (
  SupplierID INT AUTO_INCREMENT PRIMARY KEY,
  SupplierName VARCHAR(150) NOT NULL,
  ContactNumber VARCHAR(15)
);

CREATE TABLE IF NOT EXISTS Products (
  ProductID INT AUTO_INCREMENT PRIMARY KEY,
  ProductName VARCHAR(150) NOT NULL,
  Price DECIMAL(10,2) NOT NULL,
  StockQuantity INT NOT NULL DEFAULT 0,
  SupplierID INT NOT NULL,
  CONSTRAINT fk_products_supplier
    FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_products_price CHECK (Price >= 0),
  CONSTRAINT chk_products_stock CHECK (StockQuantity >= 0)
);

CREATE TABLE IF NOT EXISTS Sales (
  SaleID INT AUTO_INCREMENT PRIMARY KEY,
  ProductID INT NOT NULL,
  QuantitySold INT NOT NULL,
  SaleDate DATE NOT NULL,
  CONSTRAINT fk_sales_product
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_sales_quantity CHECK (QuantitySold > 0)
);

-- Optional category column is added/removed by the API migration endpoints.
