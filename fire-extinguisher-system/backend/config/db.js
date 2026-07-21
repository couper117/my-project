const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fire_extinguisher_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const initDatabase = async () => {
  try {
    const conn = await pool.getConnection();

    // Users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(191) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'Inspector', 'User') NOT NULL DEFAULT 'User',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Extinguishers table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS extinguishers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        serial_number VARCHAR(100) UNIQUE NOT NULL,
        type ENUM('Water', 'CO2', 'Foam', 'Dry Chemical') NOT NULL,
        size ENUM('2.5 lbs', '5 lbs', '9 lbs', '12 lbs') NOT NULL,
        location VARCHAR(255) NOT NULL,
        installation_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        status ENUM('Active', 'Expired', 'Under Maintenance', 'Decommissioned') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Inspections table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS inspections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        extinguisher_id INT NOT NULL,
        inspector_id INT NOT NULL,
        inspection_date DATETIME NOT NULL,
        status ENUM('Pass', 'Fail', 'Pending') NOT NULL DEFAULT 'Pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (extinguisher_id) REFERENCES extinguishers(id) ON DELETE CASCADE,
        FOREIGN KEY (inspector_id) REFERENCES users(id)
      )
    `);

    // Maintenance table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS maintenance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        extinguisher_id INT NOT NULL,
        inspector_id INT NOT NULL,
        maintenance_date DATETIME NOT NULL,
        action_taken TEXT NOT NULL,
        notes TEXT,
        next_maintenance_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (extinguisher_id) REFERENCES extinguishers(id) ON DELETE CASCADE,
        FOREIGN KEY (inspector_id) REFERENCES users(id)
      )
    `);

    conn.release();
    console.log('✅ Database tables initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, initDatabase };
