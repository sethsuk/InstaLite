var db = require('../models/database.js');
const bcrypt = require('bcrypt');
const helper = require('../routes/route_helper.js');

// POST /createPost
var createPost = async function (req, res) {
    if (!helper.isLoggedIn(req, user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const title = req.body["title"];
    const content = req.body["content"];
    const media = req.body["media"];

    if (!title || !media) {
        return res.status(400).json({error: "One or more of the fields you entered was empty, please try again."});
    }

    if (!media) {
        media = "null";
    }

    if (!helper.isOK(title) || !helper.isOK(content)) {
        return res.status(400).json({ error: "Invalid Input" });
    }

    try {
        await db.send_sql(`
            INSERT INTO posts (title, media, content, user_id)
            VALUES (${title}, '${media}', '${content}', ${req.session.user_id});
        `);

        return res.status(201).json({ message: "Post created." });
    } catch (err) {
        return res.status(500).json({ error: 'Error querying database.' });
    }
};


// POST /createPost
var createPost = async function (req, res) {
    if (!helper.isLoggedIn(req, user_id)) {
        return res.status(403).json({error: 'Not logged in.'});
    }

    const title = req.body["title"];
    const content = req.body["content"];
    const media = req.body["media"];

    if (!title || !media) {
        return res.status(400).json({error: "One or more of the fields you entered was empty, please try again."});
    }

    if (!media) {
        media = "null";
    }

    if(!helper.isOK(title) || !helper.isOK(content)) {
        return res.status(400).json({error: "Invalid Input"});
    }

    try {
        await db.send_sql(`
            INSERT INTO posts (title, media, content, user_id)
            VALUES (${title}, '${media}', '${content}', ${req.session.user_id});
        `);

        return res.status(201).json({message: "Post created."});
    } catch (err) {
        return res.status(500).json({error: 'Error querying database.'});
    }
};

var thisIsANewFeature = null;

const routes = {
    create_post: createPost
};

module.exports = routes;