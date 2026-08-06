CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50),
    contact_name VARCHAR(100),
    contact_email VARCHAR(150),
    contact_phone VARCHAR(30),
    assigned_analyst_id INT REFERENCES users(user_id),
    notes TEXT,
    stage VARCHAR(50) DEFAULT 'created',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS client_files (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id),
    filename VARCHAR(255),
    original_name VARCHAR(255),
    mimetype VARCHAR(100),
    size_bytes INT,
    uploaded_by INT REFERENCES users(user_id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);
