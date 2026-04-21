const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Set up the database
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, is_admin INTEGER)");
  db.run("INSERT INTO users (username, password, is_admin) VALUES ('admin', 'secret123', 1)");
  db.run("INSERT INTO users (username, password, is_admin) VALUES ('user1', 'qwerty', 0)");
  db.run("INSERT INTO users (username, password, is_admin) VALUES ('testuser', '12345', 0)");
  db.run("INSERT INTO users (username, password, is_admin) VALUES ('superadmin', 'superpass', 1)");
});

// Basic logging middleware for SQL injection attempts
const injectionLogger = (req, res, next) => {
  const username = req.query.username || '';
  const suspiciousPatterns = [/OR\s+1=1/i, /UNION\s+SELECT/i, /--/i, /;/i];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(username));
  if (isSuspicious) {
    console.warn(`\n[WARNING] Potential SQL Injection attempt detected from IP ${req.ip}. Query: ${username}`);
  }
  next();
};

// 1. Vulnerable endpoint
app.get('/api/search/vulnerable', injectionLogger, (req, res) => {
  const username = req.query.username || '';
  
  // Vulnerability: String concatenation in SQL
  const query = `SELECT * FROM users WHERE username = '${username}'`;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database Error: ' + err.message });
    }
    res.json(rows);
  });
});

// 2. Secure endpoint
app.get('/api/search/secure', injectionLogger, (req, res) => {
  const username = req.query.username || '';
  
  // Protection 1: Input Validation
  if (!/^[a-zA-Z0-9]*$/.test(username)) {
    console.warn(`[WARNING] Blocked invalid characters in secure mode. Query: ${username}`);
    return res.status(400).json({ error: 'Invalid characters in username' });
  }
  
  // Protection 2: Parameterized Queries
  const query = "SELECT * FROM users WHERE username = ?";
  
  db.all(query, [username], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database Error' });
    }
    res.json(rows);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
