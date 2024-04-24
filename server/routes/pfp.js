const chromodb = require('../models/chroma.js');
const s3 = require('../models/s3.js');

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const collection = await client.getOrCreateCollection({
    name: "face-api",
    embeddingFunction: null,
    // L2 here is squared L2, not Euclidean distance
    metadata: { "hnsw:space": "l2" },
});


// return a list of actor names and corresponding image urls 
const getTop5Actors = async function (req, res) {
    try {
        const username = req.params.username;
        if (!helper.isOK(username)) {
            return res.status(400).json({ error: 'Illegal input.' });
        }
        const image = await s3.getImageFromS3(username);

        const matches = await chromodb.findTopKMatches(collection, image, 5);

        // Return top-5 similar actors and nconst!!

        // store the url? (in desired.csv?)





    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
};

const associateActor = async function (req, res) {

}


// POST /get pfp  from s3
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
    get_pfp: getPfp
}

module.exports = pfp_routes 