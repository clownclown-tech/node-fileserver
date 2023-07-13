const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


let uploadedFiles = [];


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (req.file) {
    uploadedFiles.push(req.file);
    res.redirect('/');
  } else {
    res.status(400).send('Es wurde keine Datei ausgewählt');
  }
});

app.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);
  res.download(filePath);
});

app.get('/uploaded', (req, res) => {
  res.send(uploadedFiles);
});

app.listen(3000, () => {
  console.log('Server gestartet auf Port 3000');
});

console.log(uploadedFiles);
