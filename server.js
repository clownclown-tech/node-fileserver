const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const os = require('os');

// Get the IP address of the current machine
const networkInterfaces = os.networkInterfaces();
let clientIp
Object.keys(networkInterfaces).forEach((interfaceName) => {
  networkInterfaces[interfaceName].forEach((interfaceData) => {
    if (!interfaceData.internal && interfaceData.family === 'IPv4') {
      clientIp = interfaceData.address;
    }
  });
});

console.log('IP Address:', clientIp);


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

//database for IPs
// Connect to the database (creates a file named "my_database.db" if it doesn't exist)
const db = new sqlite3.Database('my_database.db');

// Create a table called "users" with two columns: "ip" and "credits"
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      ip TEXT UNIQUE,
      credits INTEGER
    )
  `);




  // Insert a row with the client's IP and initial credits
  const initialCredits = 0
  db.run('INSERT INTO users (ip, credits) VALUES (?, ?)', [clientIp, initialCredits], (err) => {
    if (err) {
      console.error('Error inserting data:', err.message);
    } else {
      console.log(`Client IP (${clientIp}) registered. Initial credits: ${initialCredits}`);
    }
  });
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database connection closed.');
  }
});

function increaseCreditsForIp(clientIp) {

  const dbb = new sqlite3.Database('my_database.db');

  const sql = 'UPDATE users SET credits = CASE WHEN credits < 5 THEN credits + 1 ELSE 5 END WHERE ip = ?';

  // Ensure the database connection is open before executing the query
  dbb.serialize(() => {
    dbb.run(sql, [clientIp], function (err) {
      if (err) {
        console.error('Error updating credits:', err.message);
      } else {
        console.log(`Credits updated for IP (${clientIp}).`);
      }

      // Close the database connection after the operation is completed
      dbb.close((closeErr) => {
        if (closeErr) {
          console.error('Error closing database:', closeErr.message);
        } else {
          console.log('Database connection closed.');
        }
      });
    });
  });
}

function decreaseCreditsForIp(clientIp) {

  const dbb = new sqlite3.Database('my_database.db');

  const sql = 'UPDATE users SET credits = CASE WHEN credits > 0 THEN credits - 1 ELSE 0 END WHERE ip = ?';

  // Ensure the database connection is open before executing the query
  dbb.serialize(() => {
    dbb.run(sql, [clientIp], function (err) {
      if (err) {
        console.error('Error updating credits:', err.message);
      } else {
        console.log(`Credits updated for IP (${clientIp}).`);
      }

      // Close the database connection after the operation is completed
      dbb.close((closeErr) => {
        if (closeErr) {
          console.error('Error closing database:', closeErr.message);
        } else {
          console.log('Database connection closed.');
        }
      });
    });
  });
}


// routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (req.file) {
    uploadedFiles.push(req.file);
    saveUploadedFiles();
    increaseCreditsForIp(clientIp)
    res.redirect('/');
  } else {
    res.status(400).send('Es wurde keine Datei ausgewählt');
  }
});

app.get('/download/:filename', (req, res) => {
  decreaseCreditsForIp(clientIp)
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
