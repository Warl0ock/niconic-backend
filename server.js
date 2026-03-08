import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Tambahkan di bagian atas server.js
const ADMIN_PASSWORD = 'Admin123'; // Ganti dengan password pilihan Anda

// Endpoint Login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: 'niconic-auth-token-2026' });
  } else {
    res.status(401).json({ success: false, message: 'Password salah!' });
  }
});

const app = express();
const PORT = process.env.PORT || 5000;

// Karena menggunakan ES Modules (import), kita definisikan __dirname secara manual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// 1. KONFIGURASI DATABASE
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', 
  password: 'wfvZcYRG2LVD33M', // Password server Anda
  database: 'niconic_portfolio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(() => console.log('✅ Terhubung ke database MySQL (niconic_portfolio)'))
  .catch((err) => console.error('❌ Gagal koneksi database:', err));

// 2. KONFIGURASI UPLOAD GAMBAR (MULTER)
const storage = multer.diskStorage({
  destination: './uploads/', // Pastikan folder ini ada di ~/niconic-backend/uploads
  filename: function (req, file, cb) {
    cb(null, 'project-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Berikan akses publik ke folder uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. REST API ENDPOINTS

app.get('/', (req, res) => {
  res.send('niconic.dev API is running with MySQL & Upload Support!');
});

// Endpoint: Ambil semua proyek
app.get('/api/projects', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM projects ORDER BY id DESC');
    const formattedProjects = rows.map(project => ({
      ...project,
      tags: typeof project.tags === 'string' ? JSON.parse(project.tags) : project.tags
    }));
    res.json(formattedProjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Endpoint: Tambah proyek baru
// Kita buat agar menerima '/api/projects' DAN '/projects' untuk jaga-jaga proxy Nginx
app.post(['/api/projects', '/projects'], async (req, res) => {
  try {
    const { title, category, tags, spanClasses, image } = req.body;
    const tagsJson = JSON.stringify(tags || []);
    const query = 'INSERT INTO projects (title, category, tags, spanClasses, image) VALUES (?, ?, ?, ?, ?)';
    const values = [title, category, tagsJson, spanClasses, image];
    const [result] = await pool.query(query, values);
    res.status(201).json({ message: 'Proyek berhasil ditambahkan!', id: result.insertId });
  } catch (error) {
    console.error('Error insert:', error);
    res.status(500).json({ message: 'Gagal menambah proyek' });
  }
});

// Endpoint: Upload File
// Gunakan array untuk menghandle perbedaan mapping Nginx
app.post(['/api/upload', '/upload'], upload.single('image'), (req, res) => {
  console.log('--- Permintaan upload masuk ---');
  if (!req.file) return res.status(400).json({ message: 'Tidak ada file diunggah' });
  
  console.log('✅ File disimpan sebagai:', req.file.filename);
  const imageUrl = `/api/uploads/${req.file.filename}`;
  res.json({ imageUrl: imageUrl });
});

// Endpoint: Upload File
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Tidak ada file diunggah' });
  
  // URL yang akan disimpan di database (sesuaikan dengan routing Nginx)
  const imageUrl = `/api/uploads/${req.file.filename}`;
  res.json({ imageUrl: imageUrl });
});

// Endpoint: Ambil satu proyek
app.get('/api/projects/:id', async (req, res) => {
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

// Jalankan server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
