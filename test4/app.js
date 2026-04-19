const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();


const db = new sqlite3.Database(':memory:');


db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, is_admin INTEGER)");
  db.run("INSERT INTO users (username, password, is_admin) VALUES ('admin', 'secret123', 1)");
  db.run("INSERT INTO users (username, password, is_admin) VALUES ('user1', 'qwerty', 0)");
});

app.use((req, res, next) => {
  const url = req.originalUrl;

  const sqliPattern = /(\%27)|(\')|(\-\-)|(\%23)|(#)|(UNION)/i;
  
  if (sqliPattern.test(url)) {
    console.warn(`[ALARM] Потенциальная SQL-инъекция обнаружена! URL: ${url}, IP: ${req.ip}, Время: ${new Date().toISOString()}`);
  } else {
    console.log(`[INFO] Нормальный запрос: ${url}`);
  }
  next();
});


app.get('/search', (req, res) => {
  const username = req.query.username || '';
  

  const query = `SELECT * FROM users WHERE username = '${username}'`;
  console.log(`[DEBUG - Уязвимый] Выполнение SQL: ${query}`);

  db.all(query, (err, rows) => {
    if (err) return res.status(500).send('Ошибка БД');
    res.json(rows);
  });
});


app.get('/search-secure', (req, res) => {
  const username = req.query.username || '';
  
 
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    console.warn(`[WARN] Заблокирован недопустимый ввод: ${username}`);
    return res.status(400).send('Недопустимые символы в имени');
  }
  
 
  const query = "SELECT * FROM users WHERE username = ?";
  console.log(`[DEBUG - Безопасный] Выполнение параметризованного SQL: ${query} с параметром ${username}`);
  
  db.all(query, [username], (err, rows) => {
    if (err) return res.status(500).send('Ошибка БД');
    res.json(rows);
  });
});

app.listen(3000, () => console.log('Сервер запущен на http://localhost:3000'));
