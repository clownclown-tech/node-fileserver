const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));




const filePath = 'uploads/uploadedFiles.json';
let uploadedFiles = [];

// Load the uploaded files from the file on server start
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);

      saveUploadedFiles(); // Create a new file if it doesn't exist

  } else {
    try {
      uploadedFiles = JSON.parse(data);
      console.log('Uploaded files loaded successfully!');
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }
 });

// Save the uploaded files to the file
function saveUploadedFiles() {
  const jsonString = JSON.stringify(uploadedFiles);
  fs.writeFile(filePath, jsonString, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('Uploaded files saved successfully!');
    }
  });
}







app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (req.file) {
    uploadedFiles.push(req.file);
    saveUploadedFiles();
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
