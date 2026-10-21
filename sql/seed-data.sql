USE small_retail_store;

INSERT INTO Suppliers (SupplierName, ContactNumber)
SELECT 'FreshFields Supplies', '01001234567'
WHERE NOT EXISTS (SELECT 1 FROM Suppliers WHERE SupplierName='FreshFields Supplies');

INSERT INTO Suppliers (SupplierName, ContactNumber)
SELECT 'Bread House', '01022223333'
WHERE NOT EXISTS (SELECT 1 FROM Suppliers WHERE SupplierName='Bread House');

INSERT INTO Suppliers (SupplierName, ContactNumber)
SELECT 'Green Farms', '01044445555'
WHERE NOT EXISTS (SELECT 1 FROM Suppliers WHERE SupplierName='Green Farms');

INSERT INTO Products (ProductName, Price, StockQuantity, SupplierID)
SELECT 'Milk', 15.00, 50, SupplierID FROM Suppliers WHERE SupplierName='FreshFields Supplies'
AND NOT EXISTS (SELECT 1 FROM Products WHERE ProductName='Milk');

INSERT INTO Products (ProductName, Price, StockQuantity, SupplierID)
SELECT 'Bread', 10.00, 30, SupplierID FROM Suppliers WHERE SupplierName='Bread House'
AND NOT EXISTS (SELECT 1 FROM Products WHERE ProductName='Bread');

INSERT INTO Products (ProductName, Price, StockQuantity, SupplierID)
SELECT 'Eggs', 20.00, 40, SupplierID FROM Suppliers WHERE SupplierName='Green Farms'
AND NOT EXISTS (SELECT 1 FROM Products WHERE ProductName='Eggs');

INSERT INTO Sales (ProductID, QuantitySold, SaleDate)
SELECT ProductID, 2, '2025-05-20' FROM Products
WHERE ProductName='Milk'
AND NOT EXISTS (SELECT 1 FROM Sales WHERE ProductID=Products.ProductID AND SaleDate='2025-05-20');
