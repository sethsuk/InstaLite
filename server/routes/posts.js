var db = require('../models/database.js');
const bcrypt = require('bcrypt');
const config = require('../../config.json'); // Load configuration
const helper = require('./route_helper.js');
const s3 = require('../models/s3.js');
const fs = require('fs');
const { timeStamp } = require('console');

// POST /createPost
var createPost = async function (req, res) {
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    var { title, content } = JSON.parse(req.body.json_data)

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const image = fs.readFileSync(req.file.path);

    if (!title) {
        return res.status(400).json({ error: "One or more of the fields you entered was empty, please try again." });
    }

    if (!helper.isOK(title) || !helper.isOK(content)) {
        return res.status(400).json({ error: "Invalid Input" });
    }

    try {
        var hashtags = [];
        const hashtagRegex = /#(\w+)/g;

        let match;

        while ((match = hashtagRegex.exec(content)) !== null) {
            hashtags.push(match[1]); // Capture group 1 contains the alphanumeric characters following the "#"
        }

        var results;

        if (!content) {
            results = await db.send_sql(`
                INSERT INTO posts (title, user_id)
                VALUES ('${title}', ${req.session.user_id});
            `);
        } else {
            results = await db.send_sql(`
                INSERT INTO posts (title, content, user_id)
                VALUES ('${title}', '${content}', ${req.session.user_id});
            `);
        }

        var post_id = results.insertId;

        // upload to s3 (keyed on post_id)
        await s3.uploadFileToS3(image, `posts/${post_id}`);

        await db.send_sql(`UPDATE posts SET media = '${await s3.getUrlFromS3(`posts/${post_id}`)}' WHERE post_id = ${post_id}`);

        // link hashtags to posts
        for (const tag of hashtags) {
            let existingHashtag = await db.send_sql(`SELECT COUNT(*) FROM hashtags WHERE tag = "${tag}"`);

            if (existingHashtag[0]["COUNT(*)"] == 0) {
                await db.send_sql(`INSERT INTO hashtags(tag) VALUE ("${tag}")`);
            }

            await db.send_sql(`
                UPDATE hashtags SET count = count + 1 WHERE tag = ${tag}
            `);

            let hashtag = await db.send_sql(`SELECT hashtag_id FROM hashtags WHERE tag = "${tag}";`);

            await db.insert_items(`INSERT INTO hashtags_to_posts (post_id, hashtag_id) VALUES (${post_id}, ${hashtag[0].hashtag_id});`);
        }

        return res.status(201).json({ message: "Post created." });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};


// POST
var likePost = async function (req, res) {
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    const post_id = parseInt(req.body["post_id"]);

    if (!Number.isInteger(post_id)) {
        return res.status(400).json({ error: "One or more of the fields you entered was empty, please try again." });
    }

    try {
        var existingLikeQuery = await db.send_sql(`SELECT user_id FROM post_likes WHERE post_id = ${post_id} AND user_id = ${req.session.user_id}`);

        if (existingLikeQuery.length != 0) {
            return res.status(400).json({ error: "Already liked post." });
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


// POST
var getPostMedia = async function (req, res) {
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    const post_id = parseInt(req.body["post_id"]);

    if (!Number.isInteger(post_id)) {
        return res.status(400).json({ error: "One or more of the fields you entered was empty, please try again." });
    }

    try {
        var existingPostQuery = await db.send_sql(`SELECT COUNT(*) FROM posts WHERE post_id = ${post_id}`);

        if (existingPostQuery[0]["COUNT(*)"] == 0) {
            return res.status(400).json({ error: "Post does not exist." });
        }

        var results = await db.send_sql(`SELECT media FROM posts WHERE post_id = ${post_id};`);

        return res.status(201).json({ media: results[0]["media"] });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};


// POST
var getSinglePost = async function (req, res) {
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    const post_id = parseInt(req.body["post_id"]);

    if (!Number.isInteger(post_id)) {
        return res.status(400).json({ error: "One or more of the fields you entered was empty, please try again." });
    }

    try {
        var existingPostQuery = await db.send_sql(`SELECT COUNT(*) FROM posts WHERE post_id = ${post_id}`);

        if (existingPostQuery[0]["COUNT(*)"] == 0) {
            return res.status(400).json({ error: "Post does not exist." });
        }

        var results = await db.send_sql(`
            SELECT p.post_id, p.title, p.media, p.content, p.likes, p.timestamp,
                u.user_id, u.username, u.pfp_url, 
                GROUP_CONCAT(DISTINCT CONCAT('#', h.tag) ORDER BY h.tag ASC SEPARATOR ', ') AS hashtags
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.user_id
            LEFT JOIN hashtags_to_posts ON hashtags_to_posts.post_id = p.post_id
            LEFT JOIN hashtags h ON hashtags_to_posts.hashtag_id = h.hashtag_id
            WHERE p.post_id = ${post_id}
        `);

        console.log(results);

        return res.status(201).json(results.map((result) => ({
            user_id: result.user_id,
            user: result.username,
            userProfileImage: result.pfp_url,
            postImage: result.media,
            hashtags: result.hashtags,
            caption: result.content,
            timeStamp: result.timestamp
        })));
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};


const routes = {
    create_post: createPost,
    like_post: likePost,
    get_post_media: getPostMedia,
    get_single_post: getSinglePost
};

module.exports = routes;