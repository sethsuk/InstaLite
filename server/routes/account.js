var db = require('../models/database.js');
const config = require('../../config.json'); // Load configuration
const helper = require('./route_helper.js');
const bcrypt = require('bcrypt');
const s3 = require('../models/s3.js');
const fs = require('fs');

// GET /test hello world.
var getHelloWorld = function (req, res) {
    res.status(200).send({ message: "Hello, world!" });
}


// POST /change email 
var changeEmail = async function (req, res) {
    const { newEmail } = req.body;
    const user_id = req.session.user_id;

    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    if (!helper.isOK(newEmail)) {
        return res.status(400).json({ error: 'Invalid input.' });
    }


    try {
        const query = `UPDATE users SET email = "${newEmail}" WHERE user_id = ${user_id}`;
        await db.send_sql(query);

        res.status(200).send({ message: 'Email updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
}


// POST /change password 
var changePassword = async function (req, res) {
    const { currentPassword, newPassword } = req.body;
    const user_id = req.session.user_id;

    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    if (!helper.isOK(newPassword)) {
        return res.status(400).send({ error: 'Invalid password format.' });
    }

    try {
        // Verify the current password 
        const userQuery = `SELECT hashed_password FROM users WHERE user_id = ${user_id}`;
        const [user] = await db.send_sql(userQuery);
        const match = await bcrypt.compare(currentPassword, user.hashed_password);

        if (!match) {
            return res.status(401).send({ error: 'Current password is incorrect.' });
        }

        // Update the password
        helper.encryptPassword(newPassword, async (err, hash) => {
            if (err) {
                return res.status(500).json({ error: 'Error hashing password.' });
            }

            const updateQuery = `UPDATE users SET hashed_password = "${hash}" WHERE user_id = ${user_id}`;
            await db.send_sql(updateQuery);

            return res.status(200).json({ message: 'Password updated successfully.' });
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};


// POST /change affiliation
var changeAffiliation = async function (req, res) {
    const { newAffiliation } = req.body;
    const user_id = req.session.user_id;

    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    if (!helper.isOK(newAffiliation)) {
        return res.status(400).send({ error: 'Invalid input.' });
    }

    try {
        const query = `UPDATE users SET affiliation = "${newAffiliation}" WHERE user_id = ${user_id}`;
        await db.send_sql(query);

        return res.status(200).json({ message: 'Affiliation updated successfully.' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};


// GET /suggest additional hashtags 
var suggestHashtags = async function (req, res) {
    const user_id = req.session.user_id;
    console.log(user_id);

    const username = req.params.username;
    console.log(username);
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    try {
        const query = `
            SELECT hashtags.tag FROM hashtags 
            LEFT JOIN hashtags_rank ON hashtags_rank.hashtag_id = hashtags.hashtag_id
            WHERE hashtags.hashtag_id NOT IN (SELECT hashtag_id FROM user_hashtags WHERE user_id = ${user_id}) 
            ORDER BY hashtags_rank.hashtag_rank DESC LIMIT 10
        `;
        const results = await db.send_sql(query);

        const toOutput = {
            tags: results.map((hashtag) => hashtag.tag)
        };

        return res.status(200).json(toOutput);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// GET /get current hashtags 
var getHashtags = async function (req, res) {
    const user_id = req.session.user_id;

    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    try {
        const query = `
            SELECT tag FROM user_hashtags 
            
        `;
        const results = await db.send_sql(query);

        const toOutput = {
            tags: results.map((hashtag) => hashtag.tag)
        };

        return res.status(200).json(toOutput);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// add hashtag (use the one in registration.js) 


// POST /update hashtags (multiple)
var updateHashtags = async function (req, res) {
    const { hashtags } = req.body;
    const user_id = req.session.user_id;

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
            // check if the hashtags are already associated with them 
            const query1 = `SELECT COUNT(*) FROM hashtags WHERE tag = "${hashtag}"`;
            var query1Results = await db.send_sql(query1);

            if (query1Results[0]["COUNT(*)"] == 0) {
                return res.status(400).send({ error: 'Tag (' + hashtag + ') does not exist' });
            }

            const query2 = `SELECT hashtag_id FROM hashtags WHERE tag = "${hashtag}"`;
            var query2Results = await db.send_sql(query2);

            const hashtagId = query2Results[0].hashtag_id;

            const query3 = `SELECT COUNT(*) FROM user_hashtags WHERE user_id = ${user_id} AND hashtag_id = ${hashtagId};`;
            const userHashtag = await db.send_sql(query3);

            // TODO DEPENDING ON INTENDED FUNCTIONALITY

            if (userHashtag[0]["COUNT(*)"] == 0) {
                const query4 = `INSERT INTO user_hashtags (user_id, hashtag_id) VALUES (${user_id}, ${hashtagId});`;
                await db.insert_items(query4);

                // Increment hashtag count
                await db.send_sql(`
                    UPDATE hashtags SET count = count + 1 WHERE hashtag_id = ${hashtag.hashtag_id}
                `);
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
    const user_id = req.session.user_id;

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
                return res.status(400).send({ error: 'Hashtag does not exist.' });
            }

            const hashtagId = hashtagRow.hashtag_id;

            const checkHashtagResults = await db.send_sql(`
                SELECT COUNT(*) FROM user_hashtags
                WHERE user_id = ${user_id} AND hashtag_id = ${hashtagId}
            `);

            if (checkHashtagResults[0]["COUNT(*)"] == 0) {
                return res.status(404).json({ error: 'Hashtag not found for user' });
            }

            const query = `DELETE FROM user_hashtags WHERE user_id = ${user_id} AND hashtag_id = ${hashtagId}`;
            await db.send_sql(query);

            // Decrement the count in the hashtags table 
            const query2 = `UPDATE hashtags SET count = count - 1 WHERE hashtag_id = ${hashtagId}`;
            await db.send_sql(query2);
        }

        return res.status(200).json({ message: 'Hashtags removed successfully.' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// change associated actor 
// use getTop5Actors and associateActor in pfp.js


// POST /updatePfp
var updatePfp = async function (req, res) {
    console.log("calling updatePfp");

    const user_id = req.session.user_id;

    const username = req.params.username;

    if (!helper.isLoggedIn(req, username)) {
        console.log("not logged in");
        return res.status(403).send({ error: 'Not logged in.' });
    }

    if (!req.file) {
        console.log("no image");
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const image = fs.readFileSync(req.file.path);
        const url = await s3.uploadFileToS3(image, `profile_pictures/${username}`);

        console.log(url);

        await db.send_sql(`UPDATE users SET pfp_url = "${url}" WHERE user_id = ${user_id}`);
        return res.status(200).json({ message: 'Pfp updated successfully.' });
    } catch (error) {
        console.log(error);
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