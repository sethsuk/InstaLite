var db = require('../models/database.js');
const bcrypt = require('bcrypt');
const helper = require('../routes/route_helper.js');
const s3 = require('../models/s3.js');


// POST /signup
// hashtags are array of interests 
var signup = async function (req, res) {
    const { username, password, first_name, last_name, email, affiliation, birthday, interests } = req.body
    const file = req.file;

    if (!helper.isOK(username) || !helper.isOK(linked_id) || !helper.isOK(first_name)
        || !helper.isOK(last_name) || !helper.isOK(email) || !interests.every(helper.isOK)) {
        return res.status(400).json({ error: 'Illegal input.' });
    }

    try {
        const query1 = `SELECT username FROM users WHERE username = "${username}";`;
        const users = await db.send_sql(query1);
        if (users.length > 0) {
            return res.status(409).json({ error: "An account with this username already exists, please try again." });
        }

        helper.encryptPassword(password, async (err, hash) => {
            if (err) {
                return res.status(500).json({ error: 'Error hashing password.' });
            }

            // upload to s3 (keyed on username)
            const url = await s3.uploadFileToS3(file, username);

            // insert to users table 
            const query2 = `INSERT INTO users (username, hashed_password, first_name, last_name, email, affiliation, birthday, pfp_url) 
                VALUES ("${username}", "${hash}", "${first_name}", "${last_name}", "${email}", "${affiliation}", "${birthday}", "${url}");`;
            await db.insert_items(query2);

            const results = await db.send_sql(`SELECT user_id FROM users WHERE username = "${username}";`);
            const userId = results[0].user_id;

            // link user to hashtags
            for (const tag of interests) {
                // Check if the hashtag already exists, if not, add it 
                let [hashtag] = await db.send_sql(`SELECT hashtag_id FROM hashtags WHERE tag = "${tag}";`);
                if (!hashtag) {
                    const insertResult = await db.send_sql(`INSERT INTO hashtags (tag) VALUES ("${tag}")`);
                    hashtag = { hashtag_id: insertResult.insertId };
                }
                // Link user to hashtag
                await db.query(`INSERT INTO user_hashtags (user_id, hashtag_id) VALUES (${userId}, ${hashtag.hashtag_id});`);
            }

            res.status(200).json({ username: username });
        })
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
};


// GET / get top-10 popular hashtags 
var getTop10Hashtags = async function (req, res) {
    try {
        const query = 'SELECT tag FROM hashtags ORDER BY count DESC LIMIT 10';
        const results = await db.send_sql(query);
        res.status(200).json(results.map(row => row.tag));
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
}


// POST /login
var login = async function (req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }
    if (!helper.isOK(username)) {
        return res.status(400).json({ error: 'Illegal input.' });
    }

    try {
        const query = `SELECT user_id, username, hashed_password FROM users WHERE username = "${username}";`;
        const users = await db.send_sql(query);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Username and/or password are invalid.' });
        }

        const user = users[0];

        const match = await bcrypt.compare(password, user.hashed_password);
        if (match) {
            req.session.user_id = user.user_id;
            req.session.username = user.username;

            await db.insert_items(`INSERT INTO online (session_id, user) 
                VALUES (${req.sessionID}, ${user.user_id});`);

            await db.insert_items(`INSERT INTO online (session_id, user_id) VALUES (${req.sessionID}, ${user.user_id})`);

            return res.status(200).json({ username: username });
        } else {
            return res.status(401).json({ error: 'Username and/or password are invalid.' });
        }

    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
};


// POST /logout
var logout = async function (req, res) {
    if (req.session.user_id) {
        const userId = req.session.user_id;
        req.session.user_id = null;
        req.session.username = null;
        await db.query(`DELETE FROM online WHERE user = ${userId};`);
        res.status(200).json({ message: "You were successfully logged out." });
    }
};


var registration_routes = {
    login: login,
    get_top_10_hashtags: getTop10Hashtags,
    signup: signup,
    logout: logout,
}

module.exports = registration_routes 