require('dotenv').config();
const express = require('express');
const mysql2  = require('mysql2/promise');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const pool = mysql2.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10
});

async function initDB() {
  const conn = await pool.getConnection();
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email  VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );
  conn.release();
  console.log('Base de datos lista');
}

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de autenticación funcionando!', version: '1.0' });
});

app.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    const hash = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hash]
    );
    res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'El email ya está registrado' });
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ?', [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    const ok = await bcrypt.compare(password, rows[0].password);
    if (!ok)
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ mensaje: 'Login exitoso', token, nombre: rows[0].nombre });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

function verificarToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'Token requerido' });
  const token = auth.split(' ')[1];
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

app.get('/perfil', verificarToken, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, nombre, email, creado_en FROM usuarios WHERE id = ?',
    [req.usuario.id]
  );
  res.json({ perfil: rows[0] });
});

initDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('Servidor corriendo en puerto ' + PORT);
  });
});
