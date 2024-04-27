var db = require('../models/database.js');
const bcrypt = require('bcrypt');
const config = require('../../config.json'); // Load configuration
const helper = require('./route_helper.js');

// POST /createPost
var createPost = async function (req, res) {
    if (!helper.isLoggedIn(req, req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const title = req.body["title"];
    var content = req.body["content"];
    const media = req.body["media"];
    var hashtags = req.body["hashtags"]

    if (!title || !media) {
        return res.status(400).json({ error: "One or more of the fields you entered was empty, please try again." });
    }

    if (!helper.isOK(title) || !helper.isOK(content)) {
        return res.status(400).json({ error: "Invalid Input" });
    }

    try {
        if (!content) {
            await db.send_sql(`
                INSERT INTO posts (title, media, user_id)
                VALUES ('${title}', '${media}', ${req.session.user_id});
            `);
        } else {
            await db.send_sql(`
                INSERT INTO posts (title, media, content, user_id)
                VALUES ('${title}', '${media}', '${content}', ${req.session.user_id});
            `);
        }

        var postInfo = await db.send_sql(`
            SELECT post_id from posts WHERE title = '${title}' AND media = '${media}'
        `);

        var post_id = postInfo[0]["post_id"];

        console.log(hashtags);

        // link hashtags to posts
        for (const tag of hashtags) {
            console.log(tag);

            let hashtag = await db.send_sql(`SELECT hashtag_id FROM hashtags WHERE tag = "${tag}";`);

            console.log(hashtag);
            console.log(hashtag[0].hashtag_id)

            await db.insert_items(`INSERT INTO hashtags_to_posts (post_id, hashtag_id) VALUES (${post_id}, ${hashtag[0].hashtag_id});`);
        }

        return res.status(201).json({ message: "Post created." });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};


var likePost = async function (req, res) {
    if (!helper.isLoggedIn(req, req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const post_id = parseInt(req.body["post_id"]);

    if (!Number.isInteger(post_id)) {
        return res.status(400).json({ error: "One or more of the fields you entered was empty, please try again." });
    }

    try {

    
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

const routes = {
    create_post: createPost
};

module.exports = routes;