var db = require('../models/database.js');
const bcrypt = require('bcrypt');
const config = require('../../config.json'); // Load configuration
const helper = require('./route_helper.js');

// POST /createComments
var createComment = async function (req, res) {
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    const post_id = parseInt(req.body["post_id"]);
    var content = req.body["content"];
    
    if (!post_id || !content) {
        return res.status(400).json({ error: "One or more of the fields you entered was empty, please try again." });
    }

    const parent_id = parseInt(req.body["parent_id"]);

    if (!Number.isInteger(post_id)) {
        return res.status(400).json({ error: "One or more of the fields you entered was empty, please try again." });
    }

    if (!helper.isOK(content)) {
        return res.status(400).json({ error: "Invalid Input" });
    }

    try {
        var hashtags = [];
        const hashtagRegex = /#(\w+)/g;

        let match;

        while ((match = hashtagRegex.exec(content)) !== null) {
            hashtags.push(match[1]); // Capture group 1 contains the alphanumeric characters following the "#"
        }

        var postResults = await db.send_sql(`
            SELECT COUNT(*) FROM posts WHERE post_id = ${post_id}
        `);

        if (postResults[0]["COUNT(*)"] == 0) {
            return res.status(400).json({ error: "Post does not exist." })
        }

        var results;

        if (!parent_id) {
            results = await db.send_sql(`
                INSERT INTO comments (post_id, user_id, content)
                VALUES (${post_id}, ${req.session.user_id}, "${content}");
            `);
        } else {
            results = await db.send_sql(`
                INSERT INTO comments (post_id, user_id, content, parent_id)
                VALUES (${post_id}, ${req.session.user_id}, "${content}", ${parent_id});
            `);
        }

        comment_id = results.insertId;

        // link hashtags to comment
        for (const tag of hashtags) {
            let existingHashtag = await db.send_sql(`SELECT COUNT(*) FROM hashtags WHERE tag = "${tag}"`);

            if (existingHashtag[0]["COUNT(*)"] == 0) {
                await db.send_sql(`INSERT INTO hashtags(tag) VALUE ("${tag}")`);
            }

            await db.send_sql(`
                UPDATE hashtags SET count = count + 1 WHERE tag = "${tag}"
            `);

            let hashtag = await db.send_sql(`SELECT hashtag_id FROM hashtags WHERE tag = "${tag}";`);

            await db.insert_items(`INSERT INTO hashtags_to_comments (comment_id, hashtag_id) VALUES (${comment_id}, ${hashtag[0].hashtag_id});`);
        }

        return res.status(201).json({ message: "Comment created." });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

var getComments = async function (req, res) {
    const post_id = parseInt(req.body["post_id"]);

    if (!Number.isInteger(post_id)) {
        return res.status(400).json({ error: "Invalid post_id" });
    }

    try {
        var postResults = await db.send_sql(`
            SELECT COUNT(*) FROM posts WHERE post_id = ${post_id}
        `);

        if (postResults[0]["COUNT(*)"] == 0) {
            return res.status(400).json({ error: "Post does not exist." })
        }

        // Fetch top-level comments (comments without a parent)
        const topLevelComments = await fetchComments(post_id, null);

        // Iterate through top-level comments and fetch their replies recursively
        const threadedComments = await Promise.all(
            topLevelComments.map(async (comment) => {
                const replies = await fetchReplies(comment.comment_id);
                return { ...comment, replies };
            })
        );

        return res.status(200).json(threadedComments.slice(0, 10));
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

// Function to fetch top-level comments
const fetchComments = async (post_id, parent_id) => {
    const sql = `
        SELECT * FROM comments
        WHERE post_id = ${post_id} AND parent_id ${parent_id ? `= ${parent_id}` : 'IS NULL'}
        ORDER BY timestamp DESC
        LIMIT 10;
    `;
    const comments = await db.send_sql(sql);
    return comments;
};

// Recursive function to fetch replies for a comment
const fetchReplies = async (parent_id) => {
    const sql = `
        SELECT * FROM comments
        WHERE parent_id = ${parent_id}
        ORDER BY timestamp DESC;
    `;
    const replies = await db.send_sql(sql);

    const nestedReplies = await Promise.all(
        replies.map(async (reply) => {
            const childReplies = await fetchReplies(reply.comment_id);
            return { ...reply, replies: childReplies };
        })
    );

    return nestedReplies;
};

const routes = {
    create_comment: createComment,
    get_comments: getComments
};

module.exports = routes;