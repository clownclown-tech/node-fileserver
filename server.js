const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
  if (req.file) {
    res.send('Datei erfolgreich hochgeladen');
  } else {
    res.status(400).send('Es wurde keine Datei ausgewählt');
  }
});

app.get('/download', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', 'example.txt');
  res.download(filePath, 'example.txt');
});






app.listen(3000, () => {
  console.log('Server gestartet auf Port 3000');
});
