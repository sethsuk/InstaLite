var db = require('../models/database.js');
const bcrypt = require('bcrypt');
const helper = require('../routes/route_helper.js');

// POST /createPost
var createPost = async function (req, res) {
    if (!helper.isLoggedIn(req, user_id)) {
        return res.status(403).json({error: 'Not logged in.'});
    }

    const title = req.body["title"];
    const content = req.body["content"];
    let parent_id = req.body["parent_id"];

    if (!title || !content) {
        return res.status(400).json({error: "One or more of the fields you entered was empty, please try again."});
    }

    if (!parent_id) {
        parent_id = "null";
    }

    if(!helper.isOK(title) || !helper.isOK(content) || !helper.isOK(parent_id)) {
        return res.status(400).json({error: "Invalid Input"});
    }

    try {
        await db.send_sql(`
            INSERT INTO posts (parent_post, title, content, author_id)
            VALUES (${parent_id}, '${title}', '${content}', ${req.session.user_id})`);

        return res.status(201).json({message: "Post created."});
    } catch (err) {
        return res.status(500).json({error: 'Error querying database.'});
    }
};