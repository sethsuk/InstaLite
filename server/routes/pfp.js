const chromodb = require('../models/chroma.js');
const s3 = require('../models/s3.js');
var db = require('../models/database.js');
var path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const config = require('../../config.json'); // Load configuration
const helper = require('./route_helper.js');
const chromadb = require('../models/chroma.js');

const multer = require("multer");
const upload = multer({ dest: "uploads/" });


// return a list of actor names and corresponding image urls 
const getTop5Actors = async function (req, res) {
    try {
        const username = req.params.username;
        if (!helper.isOK(username)) {
            return res.status(400).json({ error: 'Illegal input.' });
        }
        const image = await s3.getImageFromS3(username);

        const collection = chromadb.getCollection;
        const matches = await chromodb.findTopKMatches(collection, image, 5);


        let actors = [];

        // Process matches to get actor details
        for (var item of matches) {
            for (var i = 0; i < item.ids[0].length; i++) {
                let actorNconst = item.documents[0][i].replace('.jpg', '');
                actors.push({
                    nconst: actorNconst,
                    distance: Math.sqrt(item.distances[0][i])
                });
            }
        }

        // Return top-5 similar actors nconst    !!!!! change to return name and url !!!!
        res.status(200).json({ actors: actors });

    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
};


// POST 
const associateActor = async function (req, res) {
    const { actorNconst } = req.body;
    const username = req.session.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    if (!helper.isOK(actorNconst)) {
        return res.status(400).send({ error: 'Invalid input.' });
    }
    try {
        const query = `UPDATE users SET actor_nconst = "${actorNconst}" WHERE username = "${username}";`;
        await db.send_sql(query);
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
}


// GET /get actor name and image url 
const getActorInfo = async function (req, res) {
    const nconst = req.qeury.nconst;

    // Define the path to the CSV file
    const csvFilePath = path.join(__dirname, '..', 'desired.csv');

    const results = [];

    fs.createReadStream(csvFilePath)
        .pipe(csv(['nconst', 'name', 'image', 'url']))
        .on('data', (data) => {
            if (data.nconst === nconst) {
                results.push({
                    nconst: data.nconst,
                    name: data.name.replace('_', ' '),
                    imageUrl: data.url
                });
            }
        })
        .on('end', () => {
            if (results.length > 0) {
                res.json(results[0]);
            } else {
                res.status(404).json({ error: 'Actor not found.' });
            }
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).json({ error: 'Error reading CSV file.' });
        });

}


// GET /get pfp from s3
const getPfp = async function (req, res) {
    // Logic to upload photo and return URL/path
    try {
        const username = req.params.username;
        if (!helper.isOK(username)) {
            return res.status(400).json({ error: 'Illegal input.' });
        }
        const url = await s3.getFileFromS3(username);
        res.status(200).json({ pfp_url: url });
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
};


var pfp_routes = {
    get_top_5_actors: getTop5Actors,
    get_actor_infp: getActorInfo,
    associate_actor: associateActor,
    get_pfp: getPfp
}

module.exports = pfp_routes 