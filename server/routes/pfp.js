const chromodb = require('../models/chroma.js');
const s3 = require('../models/s3.js');
var db = require('../models/database.js');
var path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const helper = require('./route_helper.js');
const chromadb = require('../models/chroma.js');


// GET /return a list of actor names and corresponding image urls 
const getTop5Actors = async function (req, res) {
    try {
        const username = req.params.username;
        if (!helper.isOK(username)) {
            return res.status(400).json({ error: 'Illegal input.' });
        }
        const image = await s3.getImageFromS3(`profile_pictures/${username}`);

        const collection = chromadb.getCollection();
        console.log('Collection retrived.');

        const matches = await chromodb.findTopKMatches(collection, image, 5);
        console.log('Found top 5 matches:', matches);

        let actors = [];

        // Process matches to get actor details
        if (matches.length > 0) {
            const match = matches[0];
            const documentIds = match.documents[0]; // Assuming first set of documents

            for (let actorDocument of documentIds) {
                let actorNconst = actorDocument.replace('.jpg', '');
                console.log('Processing actor:', actorNconst); // Verify the actor constant

                const info = await getInfoHelper(actorNconst);
                if (info) {
                    actors.push({
                        nconst: actorNconst,
                        name: info.name,
                        imageUrl: info.imageUrl
                    });
                } else {
                    console.log('No info found for:', actorNconst);
                }
            }
        }
        res.status(200).json({ actors });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error querying database.' });
    }
};


// POST 
const associateActor = async function (req, res) {
    const { actorNconst } = req.body;
    console.log(actorNconst);

    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    if (!helper.isOK(actorNconst)) {
        return res.status(400).send({ error: 'Invalid input.' });
    }

    try {
        const query = `UPDATE users SET actor_nconst = "${actorNconst}" WHERE username = "${username}";`;
        await db.send_sql(query);
        res.status(200).json({ message: 'Actor associated successfully.' })
    } catch (error) {
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// GET /get actor name and image url 
const getActorInfo = async function (req, res) {
    const nconst = req.query.nconst;
    try {
        const actorInfo = await getInfoHelper(nconst);
        if (actorInfo) {
            res.status(200).json({ actorInfo });
        } else {
            res.status(404).json({ error: 'Actor not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving actor information.' });
    }
}


async function getInfoHelper(nconst) {
    return new Promise((resolve, reject) => {
        const csvFilePath = path.join(__dirname, '..', 'desired.csv');
        console.log('File path:', csvFilePath);
        let found = null;

        fs.createReadStream(csvFilePath)
            .pipe(csv(['id', 'nconst', 'name', 'image', 'url']))
            .on('data', (data) => {
                if (data.nconst === nconst) {
                    found = {
                        nconst: data.nconst,
                        name: data.name.replace(/_/g, ' '), // Replace underscores in names
                        imageUrl: data.url
                    };
                }
            })
            .on('end', () => {
                // Only resolve the promise after finishing reading the CSV
                if (found) {
                    resolve(found);
                } else {
                    resolve(null); // Resolve with null if no actor found
                }
            })
            .on('error', (err) => {
                reject(err);
            });
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
        const url = await s3.getUrlFromS3(`profile_pictures/${username}`);
        res.status(200).json({ pfp_url: url });
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
};


var pfp_routes = {
    get_top_5_actors: getTop5Actors,
    get_actor_info: getActorInfo,
    associate_actor: associateActor,
    get_pfp: getPfp
}

module.exports = pfp_routes 