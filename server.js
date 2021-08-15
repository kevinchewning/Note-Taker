const express = require('express');
const path = require('path');
const db = require('./db/db.json')
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const util = require('util');

const PORT = process.env.PORT || 3001;

const app = express();

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// GET Route for homepage
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '/public/index.html'))
);

// GET Route for feedback page
app.get('/notes', (req, res) =>
  res.sendFile(path.join(__dirname, '/public/notes.html'))
);

app.get('/api/notes', (req, res) => readFromFile('./db/db.json').then((data) => res.json(JSON.parse(data))));

// Promise version of fs.readFile
const readFromFile = util.promisify(fs.readFile);

const writeToFile = (destination, content) =>
  fs.writeFile(destination, JSON.stringify(content, null, 4), (err) =>
    err ? console.error(err) : console.info(`\nData written to ${destination}`)
  );

const readAndAppend = (content, file) => {
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
    } else {
      const parsedData = JSON.parse(data);
      parsedData.push(content);
      writeToFile(file, parsedData);
    }
  });
};

app.post('/api/notes', (req, res) => {
  // Log that a POST request was received
  console.info(`${req.method} request received`);

  // Destructuring assignment for the items in req.body
  const { title, text } = req.body;

  // If all the required properties are present
  if (title && text) {
    // Variable for the object we will save
    const newNote = {
      title,
      text,
      id: uuidv4(),
    };

    readAndAppend(newNote, './db/db.json');
    res.json('Note added successfully');
  } else {
    res.json('Error in posting note');
  }
})

const readAndDelete = (id, file) => {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
        } else {
            const parsedData = JSON.parse(data);
            const index = parsedData.findIndex(function(o){
                return o.id === id;
            })
            if (index !== -1) {parsedData.splice(index, 1)}
            writeToFile(file, parsedData);
        }
    });
}

app.delete('/api/notes/:id', (req, res) => {
    const requestedId = req.params.id;

    readAndDelete(requestedId, './db/db.json');
})

app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '/public/index.html'))
);

app.listen(PORT, () =>
  console.log(`App listening at http://localhost:${PORT} 🚀`)
);
