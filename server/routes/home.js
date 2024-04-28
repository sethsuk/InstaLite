var db = require('../models/database.js');
const bcrypt = require('bcrypt');
const config = require('../../config.json'); // Load configuration
const helper = require('./route_helper.js');

// POST /getPosts
var getPosts = async function (req, res) {
    if (!helper.isLoggedIn(req, req.session.user_id)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    try {
        var results = await db.send_sql(`
            SELECT p.* 
            FROM posts_rank pr
            JOIN posts p ON pr.post_id = p.post_id
            LEFT JOIN friends f ON p.user_id = f.followed
            WHERE f.follower = ${req.session.user_id} OR p.user_id = ${req.session.user_id}
            ORDER BY pr.post_rank ASC
            LIMIT 10;
        `);

        console.log(results);

        return res.status(200).json(results);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

const routes = {
    get_posts: getPosts,
};

module.exports = routes;