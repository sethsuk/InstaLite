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
        var results;
        
        if (!content) {
            results = await db.send_sql(`
                INSERT INTO posts (title, media, user_id)
                VALUES ('${title}', '${media}', ${req.session.user_id});
            `);
        } else {
            results = await db.send_sql(`
                INSERT INTO posts (title, media, content, user_id)
                VALUES ('${title}', '${media}', '${content}', ${req.session.user_id});
            `);
        }

        var post_id = results.insertId;

        // link hashtags to posts
        for (const tag of hashtags) {
            let hashtag = await db.send_sql(`SELECT hashtag_id FROM hashtags WHERE tag = "${tag}";`);

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
        var existingLikeQuery = await db.send_sql(`SELECT user_id FROM post_likes WHERE post_id = ${post_id} AND user_id = ${req.session.user_id}`);

        if (existingLikeQuery.length != 0) {
            return res.status(400).json({error: "Already liked post."});
        }


        var likesQuery = await db.send_sql(`SELECT likes FROM posts WHERE post_id = ${post_id}`);
        var numOfLikes = likesQuery[0].likes + 1;

        await db.send_sql(`UPDATE posts SET likes = ${numOfLikes} WHERE post_id = ${post_id};`);
        await db.send_sql(`INSERT INTO post_likes (post_id, user_id) VALUES (${post_id}, ${req.session.user_id});`);
    
        return res.status(201).json({ message: "Post liked." });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

const routes = {
    create_post: createPost,
    like_post: likePost
};

module.exports = routes;