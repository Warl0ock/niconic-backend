// ... kode bagian atas tetap sama ...

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

// ... kode bagian bawah tetap sama ...
