const express = require('express');
const app = express();
const port = 8080;

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

var path = require('path');
const fs = require('fs');
const chromadb = require('./models/chroma.js');


const session = require('express-session');
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:4567',
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'nets2120_insecure', saveUninitialized: true, cookie: { httpOnly: false }, resave: true
}));


chromadb.initializeCollection().then(() => {
    console.log('Collection initialized and ready to use.');
});


app.listen(port, () => {
    console.log(`Main app listening on port ${port}`);
})
