var db = require('../models/database.js');
const bcrypt = require('bcrypt');
const config = require('../../config.json'); // Load configuration
const helper = require('./route_helper.js');

// POST /creaeComments
var createComment = async function (req, res) {
    if (!helper.isLoggedIn(req, req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const post_id = parseInt(req.body["post_id"]);
    var content = req.body["content"];
    var hashtags = req.body["hashtags"];

    if (!post_id || !content) {
        return res.status(400).json({ error: "One or more of the fields you entered was empty, please try again." });
    }

    const parent_id = parseInt(req.body["parent_id"]);

    if (!Number.isInteger(post_id)) {
        return res.status(400).json({ error: "One or more of the fields you entered was empty, please try again." });
    }

    if (!helper.isOK(content) || !helper.isOK(content)) {
        return res.status(400).json({ error: "Invalid Input" });
    }

    try {
        var postResults = await db.send_sql(`
            SELECT COUNT(*) FROM posts WHERE post_id = ${post_id}
        `);

        if (postResults[0]["COUNT(*)"] == 0) {
            return res.status(400).json({error: "Post does not exist."})
        }

        var results;

        if (!parent_id) {
            results = await db.send_sql(`
                INSERT INTO comments (post_id, user_id, content)
                VALUES (${post_id}, ${req.session.user_id}, '${content}');
            `);
        } else {
            results = await db.send_sql(`
                INSERT INTO comments (post_id, user_id, content, parent_id)
                VALUES (${post_id}, ${req.session.user_id}, '${content}', ${parent_id});
            `);
        }

        comment_id = results.insertId;

        // link hashtags to comment
        for (const tag of hashtags) {
            let hashtag = await db.send_sql(`SELECT hashtag_id FROM hashtags WHERE tag = "${tag}";`);

            await db.insert_items(`INSERT INTO hashtags_to_comments (comment_id, hashtag_id) VALUES (${comment_id}, ${hashtag[0].hashtag_id});`);
        }

        return res.status(201).json({ message: "Comment created." });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

const routes = {
    create_comment: createComment,
};

module.exports = routes;