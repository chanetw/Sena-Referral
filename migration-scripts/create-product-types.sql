CREATE TABLE IF NOT EXISTS product_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_product_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    product_type_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_customer_product_type (customer_id, product_type_id),
    CONSTRAINT fk_cpt_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_cpt_product_type FOREIGN KEY (product_type_id) REFERENCES product_types(id) ON DELETE CASCADE
);

INSERT INTO product_types (code, name, sort_order, is_active)
VALUES
    ('condo', 'Condo', 10, true),
    ('house', 'House', 20, true),
    ('livnex', 'Livnex', 30, true),
    ('rentnex', 'Rentnex', 40, true),
    ('pre-livnex', 'Pre-Livnex', 50, true)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    sort_order = VALUES(sort_order),
    is_active = VALUES(is_active);
