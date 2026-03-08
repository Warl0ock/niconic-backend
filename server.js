import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Inisialisasi App & Konfigurasi Dasar
const app = express();
const PORT = process.env.PORT || 5000;

// Definisikan Password Admin di sini
const ADMIN_PASSWORD = 'Admin123'; // Ini yang akan digunakan

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// 2. KONFIGURASI DATABASE
const pool = mysql.createPool({
  host: 'localhost',
  user: 'user', // Username MySQL Anda
  password: 'password', // Password MySQL Anda
  database: 'database', // Database MySQL Anda
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(() => console.log('✅ Terhubung ke database MySQL (niconic_portfolio)'))
  .catch((err) => console.error('❌ Gagal koneksi database:', err));

// 3. KONFIGURASI UPLOAD GAMBAR (MULTER)
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, 'project-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Berikan akses publik ke folder uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. REST API ENDPOINTS

// --- Endpoint: Login ---
app.post(['/api/login', '/login'], (req, res) => {
  const { password } = req.body;
  // Gunakan variabel ADMIN_PASSWORD yang sudah kita buat di atas
  if (password === ADMIN_PASSWORD) { 
    res.json({ success: true, token: 'niconic-auth-token-2026' });
  } else {
    res.status(401).json({ success: false, message: 'Password salah!' });
  }
});

// --- Endpoint: Ambil Semua Proyek ---
app.get(['/api/projects', '/projects'], async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM projects ORDER BY id DESC');
    const formattedProjects = rows.map(project => ({
      ...project,
      tags: typeof project.tags === 'string' ? JSON.parse(project.tags) : project.tags
    }));
    res.json(formattedProjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// --- Endpoint: Tambah Proyek Baru ---
app.post(['/api/projects', '/projects'], async (req, res) => {
  try {
    const { title, category, tags, spanClasses, image } = req.body;
    const tagsJson = JSON.stringify(tags || []);
    const query = 'INSERT INTO projects (title, category, tags, spanClasses, image) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(query, [title, category, tagsJson, spanClasses, image]);
    res.status(201).json({ message: 'Proyek berhasil ditambahkan!', id: result.insertId });
  } catch (error) {
    console.error('Error insert:', error);
    res.status(500).json({ message: 'Gagal menambah proyek' });
  }
});

// --- Endpoint: Upload File ---
app.post(['/api/upload', '/upload'], upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Tidak ada file' });
  const imageUrl = `/api/uploads/${req.file.filename}`;
  res.json({ imageUrl: imageUrl });
});

// --- Endpoint: Ambil Satu Proyek ---
app.get(['/api/projects/:id', '/projects/:id'], async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (rows.length > 0) {
      const project = rows[0];
      project.tags = typeof project.tags === 'string' ? JSON.parse(project.tags) : project.tags;
      res.json(project);
    } else {
      res.status(404).json({ message: 'Proyek tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.send('niconic.dev API is running with MySQL & Upload Support!');
});

// Jalankan server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
