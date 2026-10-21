-- Run as a MySQL administrator after creating the database.
-- Replace the password with a strong unique password.
CREATE USER IF NOT EXISTS 'store_manager'@'localhost' IDENTIFIED BY 'REPLACE_WITH_STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE ON small_retail_store.* TO 'store_manager'@'localhost';

-- Requirement 15: revoke UPDATE.
REVOKE UPDATE ON small_retail_store.* FROM 'store_manager'@'localhost';

-- Requirement 16: grant DELETE on Sales.
GRANT DELETE ON small_retail_store.Sales TO 'store_manager'@'localhost';

SHOW GRANTS FOR 'store_manager'@'localhost';
