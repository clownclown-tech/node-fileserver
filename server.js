const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const os = require('os');

// Get the IP address of the current machine
const networkInterfaces = os.networkInterfaces();
let ipAddress;
Object.keys(networkInterfaces).forEach((interfaceName) => {
  networkInterfaces[interfaceName].forEach((interfaceData) => {
    if (!interfaceData.internal && interfaceData.family === 'IPv4') {
      ipAddress = interfaceData.address;
    }
  });
});


console.log('IP Address:', ipAddress);


// multer config
const storage = multer.diskStorage({
destination: function (req, file, cb) {
  cb(null, 'uploads/');
},
filename: function (req, file, cb) {
  cb(null, file.originalname); // Keep the original filename
}
});

const upload = multer({ storage: storage });



const app = express();
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

//database for storing user IP and Credits
function updateDatabase(ipAddress, fileName) {
  const databaseFile = 'mydatabase.db';

// Check if the database file exists
if (!fs.existsSync(databaseFile)) {
  const db = new sqlite3.Database(databaseFile);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS user_data (
      ip_address TEXT PRIMARY KEY,
      file_name TEXT,
      credits INTEGER
    )`);
  });


    // Check if the IP address already exists in the database
    db.get('SELECT credits FROM user_data WHERE ip_address = ?', [ipAddress], (err, row) => {
      if (err) {
        console.error('Error checking database for existing IP:', err);
        return;
      }

      if (row) {
        // IP address exists, update the credits count without resetting to 0
        const newCredits = Math.min(row.credits + 1, 5);
        db.run('UPDATE user_data SET credits = ? WHERE ip_address = ?', [newCredits, ipAddress], (err) => {
          if (err) {
            console.error('Error updating database:', err);
          } else {
            console.log('Database updated successfully');
          }
        });
      } else {
        // IP address doesn't exist, insert new record
        const stmt = db.prepare('INSERT INTO user_data (ip_address, file_name, credits) VALUES (?, ?, ?)');
        stmt.run(ipAddress, fileName, Math.min(credits, 5), (err) => {
          if (err) {
            console.error('Error inserting into database:', err);
          } else {
            console.log('New record inserted into database');
          }
          stmt.finalize();
        });
      }
    });
  }}
//getting clients info
//const ipAddress = '192.168.1.100';
const fileName = 'fake';







// routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (req.file) {
    uploadedFiles.push(req.file);
    saveUploadedFiles();
    updateDatabase(ipAddress, fileName, credits);
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

app.get('/get-ip', (req, res) => {
  const ipAddress = req.ip; // IP-Adresse des Clients abrufen
  res.send(ipAddress); // IP-Adresse an den Client zurücksenden
});

app.listen(3000, () => {
  console.log('Server gestartet auf Port 3000');
});
