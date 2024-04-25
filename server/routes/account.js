var db = require('../models/database.js');
const config = require('../config.json'); // Load configuration
const helper = require('../routes/route_helper.js');
const { hash } = require('bcrypt');

// POST /change email 
var changeEmail = async function (req, res) {
    const { newEmail } = req.body;
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    if (!helper.isOK(email)) {
        return res.status(400).json({ error: 'Invalid input.' });
    }
    try {
        const query = `UPDATE users SET email = "${newEmail}" WHERE username = "${username}"`;
        await db.send_sql(query);
        res.status(200).send({ message: 'Email updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
}


// POST /change password 
var changePassword = async function (req, res) {
    const { currentPassword, newPassword } = req.body;
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    if (!helper.isOK(newPassword)) {
        return res.status(400).send({ error: 'Invalid password format.' });
    }

    try {
        // Verify the current password 
        const userQuery = `SELECT hashed_password FROM users WHERE username = "${username}"`;
        const [user] = await db.send_sql(userQuery);
        const match = await bcrypt.compare(currentPassword, user.hashed_password);
        if (!match) {
            return res.status(401).send({ error: 'Current password is incorrect.' });
        }

        // Update the password
        helper.encryptPassword(password, async (err, hash) => {
            if (err) {
                return res.status(500).json({ error: 'Error hashing password.' });
            }
            const updateQuery = `UPDATE users SET hashed_password = "${hash}" WHERE username = "${username}"`;
            await db.send_sql(updateQuery);
            res.status(200).json({ message: 'Password updated successfully.' });
        })
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
};


// POST /change affiliation
var changeAffiliation = async function (req, res) {
    const { newAffiliation } = req.body;
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    if (!helper.isOK(newAffiliation)) {
        return res.status(400).send({ error: 'Invalid input.' });
    }

    try {
        const query = `UPDATE users SET affiliation = "${newAffiliation}" WHERE username = "${username}"`;
        await db.send_sql(query);
        res.status(200).json({ message: 'Affiliation updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
};


// GET /suggest additional hashtags 
var suggestHashtag = async function (req, res) {
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        const userId = req.session.user_id;
        const query = `SELECT tag FROM hashtags 
        WHERE hashtag_id NOT IN (SELECT hashtag_id FROM user_hashtags WHERE user_id = ${userId}) 
        ORDER BY count DESC LIMIT 10`;
        const results = await db.send_sql(query);
        res.json(results.map(row => row.tag));
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
}


// POST /add hashtag
var addHashtag = async function (req, res) {
    const { hashtag } = req.body;
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    if (!helper.isOK(hashtag)) {
        return res.status(400).send({ error: 'Invalid input.' });
    }
    try {
        const query1 = `INSERT INTO hashtags (tag) VALUES ("${hashtag}") ON DUPLICATE KEY UPDATE count = count + 1`;
        await db.insert_items(query1);
        const query2 = `SELECT hashtag_id FROM hashtags WHERE tag = "${hashtag}"`;
        const results = await db.send_sql(query2);
        const hashtagId = results[0].hashtag_id;
        const query3 = `INSERT INTO user_hashtags (user_id, hashtag_id) VALUES ("${req.session.user_id}", "${hashtagId}")`;
        await db.insert_items(query3);
        return res.status(200).json({ message: 'Hashtag added sucessfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }

}


// POST /remove hashtag 
var removeHashtag = async function (req, res) {
    const { hashtag } = req.body;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    if (!helper.isOK(hashtag)) {
        return res.status(400).send({ error: 'Invalid input.' });
    }
    try {
        const query1 = `SELECT hashtag_id FROM hashtags WHERE tag = "${hashtag}"`;
        const hashtags = await db.send_sql(query1);
        const hashtagId = hashtags[0].hashtag_id;

        const query2 = `DELETE FROM user_hashtags WHERE user_id = ${req.session.user_id} AND hashtag_id = ${hashtagId}`;
        const results = await db.send_sql(query2);
        if (results.affectedRows === 0) {
            res.status(404).send('Hashtag not found for user');
            return;
        }

        // Decrement the count in the hashtags table
        const query3 = `UPDATE hashtags SET count = count - 1 WHERE hashtag_id = ${hashtagId}`;
        await db.send_sql(query3);
        
        return res.status(200).json('Hashtag removed successfully');
    } catch (error) {
        return res.status(500).json({ error: 'Error querying database.' });
    }

}


// POST /change associated actor
var changeActor = async function (req, res) {



}


var account_routes = {
    change_email: changeEmail,
    change_password: changePassword,
    change_affiliation: changeAffiliation,
    add_hashtag: addHashtag,
    remove_hashtag: removeHashtag,
    change_actor: changeActor
}

module.exports = account_routes 