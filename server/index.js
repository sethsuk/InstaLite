
const express = require('express');
const app = express();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

var path = require('path');
const { ChromaClient } = require("chromadb");
const fs = require('fs');
const chromadb = require('../models/chroma.js');


const client = new ChromaClient();

chromadb.initializeFaceModels()
    .then(async () => {

        const collection = await client.getOrCreateCollection({
            name: "face-api",
            embeddingFunction: null,
            metadata: { "hnsw:space": "l2" },
        });

        console.info("Looking for files");
        const promises = [];
        // Loop through all the files in the images directory
        fs.readdir("images", function (err, files) {
            if (err) {
                console.error("Could not list the directory.", err);
                process.exit(1);
            }

            files.forEach(function (file, index) {
                console.info("Adding task for " + file + " to index.");
                promises.push(chromadb.indexAllFaces(path.join(__dirname, "..", "images", file), file, collection));
            });
            console.info("Done adding promises, waiting for completion.");
            Promise.all(promises)
                .then(async (results) => {
                    console.info("All images indexed.");
                })
                .catch((err) => {
                    console.error("Error indexing images:", err);
                });
        });

    }); 
