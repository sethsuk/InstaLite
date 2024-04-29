var db = require('../models/database.js');
const config = require('../../config.json'); // Load configuration
const helper = require('./route_helper.js');

// GET /test hello world.
var getHelloWorld = function (req, res) {
    res.status(200).send({ message: "Hello, world!" });
}


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
var suggestHashtags = async function (req, res) {
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        const userId = req.session.user_id;
        const query = `SELECT tag FROM hashtags 
        WHERE hashtag_id NOT IN (SELECT hashtag_id FROM user_hashtags WHERE user_id = ${userId}) 
        ORDER BY count DESC LIMIT 15`;
        const results = await db.send_sql(query);
        res.json(results.map(row => row.tag));
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
}


// add hashtag (use the one in registration.js) 


// POST /update hashtags (multiple)
var updateHashtags = async function (req, res) {
    const { hashtags } = req.body;
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    const userId = req.session.user_id;
    for (var hashtag of hashtags) {
        if (!helper.isOK(hashtag)) {
            return res.status(400).send({ error: 'Invalid input.' });
        }
    }

    try {
        for (var hashtag of hashtags) {
            // check if the hashtags are already associated with them 
            const query1 = `SELECT hashtag_id FROM hashtags WHERE tag = "${hashtag}"`;
            const results = await db.send_sql(query1);
            const hashtagId = results[0].hashtag_id;
            const query2 = `SELECT * FROM user_hashtags WHERE user_id = ${userId} AND hashtag_id = ${hashtagId};`;
            const userHashtag = await db.send_sql(query2);
            if (!userHashtag.length) {
                const query3 = `INSERT INTO user_hashtags (user_id, hashtag_id) VALUES (${userId}, ${hashtagId});`;
                await db.insert_items(query3);
            }
        }
        return res.status(200).json({ message: 'Hashtags updated sucessfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
}


// POST /remove hashtag 
var removeHashtags = async function (req, res) {
    const { hashtags } = req.body;
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    for (var hashtag of hashtags) {
        if (!helper.isOK(hashtag)) {
            return res.status(400).send({ error: 'Invalid input.' });
        }
    }
    try {
        for (var hashtag of hashtags) {
            let [hashtagRow] = await db.send_sql(`SELECT hashtag_id FROM hashtags WHERE tag = "${hashtag}"`);
            if (!hashtagRow) {
                return res.status(400).send({ error: 'Invalid input' });
            }
            const hashtagId = hashtagRow.hashtag_id;

            const query = `DELETE FROM user_hashtags WHERE user_id = ${req.session.user_id} AND hashtag_id = ${hashtagId}`;
            const results = await db.send_sql(query);
            if (results.affectedRows === 0) {
                return res.status(404).send('Hashtag not found for user');
            }
            // Decrement the count in the hashtags table 
            const query2 = `UPDATE hashtags SET count = count - 1 WHERE hashtag_id = ${hashtagId}`;
            await db.send_sql(query2);
        }
        return res.status(200).json({ message: 'Hashtags removed successfully.' });
    } catch (error) {
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// change associated actor 
// use getTop5Actors and associateActor in pfp.js


// POST /
var updatePfp = async function (req, res) {
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    try {
        const image = fs.readFileSync(req.file.path);
        const url = await s3.uploadFileToS3(image, username);
        await db.send_sql(`UPDATE users SET pfp_url = "${url}" WHERE username = "${username}";`);
    } catch (error) {
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


var account_routes = {
    get_helloworld: getHelloWorld,
    change_email: changeEmail,
    change_password: changePassword,
    change_affiliation: changeAffiliation,
    suggest_hashtags: suggestHashtags,
    update_hashtags: updateHashtags,
    remove_hashtags: removeHashtags,
    update_pfp: updatePfp
}

module.exports = account_routes 