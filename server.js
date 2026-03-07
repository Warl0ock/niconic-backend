import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise'; // Gunakan versi promise untuk async/await

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Konfigurasi Koneksi Database MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Ganti dengan user MySQL Anda
  password: 'wfvZcYRG2LVD33M', // Ganti dengan password MySQL Anda
  database: 'niconic_portfolio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Tes koneksi database saat server menyala
pool.getConnection()
  .then(() => console.log('✅ Terhubung ke database MySQL (niconic_portfolio)'))
  .catch((err) => console.error('❌ Gagal koneksi database:', err));

// 2. Endpoint REST API

app.get('/', (req, res) => {
  res.send('niconic.dev API is running with MySQL!');
});

// Endpoint: Ambil semua proyek
app.get('/api/projects', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM projects');
    
    // PERBAIKAN: Ubah string JSON kembali menjadi Array
    const formattedProjects = rows.map(project => ({
      ...project,
      // Jika tags berupa string, kita parse menggunakan JSON.parse()
      tags: typeof project.tags === 'string' ? JSON.parse(project.tags) : project.tags
    }));

    res.json(formattedProjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Endpoint: Ambil SATU proyek berdasarkan ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    
    if (rows.length > 0) {
      const project = rows[0];
      
      // PERBAIKAN: Lakukan hal yang sama untuk satu proyek
      project.tags = typeof project.tags === 'string' ? JSON.parse(project.tags) : project.tags;
      
      res.json(project);
    } else {
      res.status(404).json({ message: 'Proyek tidak ditemukan' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Jalankan server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
