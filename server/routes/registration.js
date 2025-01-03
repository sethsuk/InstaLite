var db = require('../models/database.js');
const bcrypt = require('bcrypt');
const helper = require('./route_helper.js');
const s3 = require('../models/s3.js');
const fs = require('fs');


//POST /dummyS3Upload to S3 bucket
var dummyS3Upload = async function (req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    console.log(req.file);

    const image = fs.readFileSync(req.file.path);

    console.log(image);

    try {
        // upload to s3
        const url = await s3.uploadFileToS3(image, "test/dummy.jpeg");

        var location = await s3.getUrlFromS3("test/dummy.jpeg")

        return res.status(200).json({ message: location });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


//POST /add new hashtags to table 
var addHashtags = async function (req, res) {
    const { interests } = req.body;
    if (!interests) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    if (!interests.every(helper.isOK)) {
        return res.status(400).json({ error: 'Illegal input.' });
    }

    try {
        for (const interest of interests) {
            const response = await db.send_sql(`SELECT tag FROM hashtags WHERE tag = "${interest}"`);
            if (response.length === 0) {
                await db.send_sql(`INSERT INTO hashtags (tag) VALUES ("${interest}")`);
            }
        }
        return res.status(200).json({ message: "Hashtags added successfully." });
    } catch (error) {
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// POST /signup
var signup = async function (req, res) {
    console.log("calling signup");
    console.log(JSON.parse(req.body.json_data));

    const { username, password, first_name, last_name, email, affiliation, birthday, interests } = JSON.parse(req.body.json_data);

    if (!req.file) {
        console.log("file error");

        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const image = fs.readFileSync(req.file.path);

    if (!username || !password || !first_name || !last_name || !email || !affiliation || !birthday || !interests) {
        console.log("input error");

        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    if (!helper.isOK(username) || !helper.isOK(first_name) || !helper.isOK(last_name) ||
        !helper.isOK(email) || !helper.isOK(affiliation) || !interests.every(helper.isOK)) {
        console.log("illegal input error");

        return res.status(401).json({ error: 'Illegal input.' });
    }

    // birthday validation 
    var regex = /^\d{4}-\d{2}-\d{2}$/;

    if (!regex.test(birthday)) {
        return res.status(401).json({ error: "Invalid date format." });
    }

    var dateParts = birthday.split("-");

    var day = parseInt(dateParts[2], 10);
    var month = parseInt(dateParts[1], 10) - 1;
    var year = parseInt(dateParts[0], 10);

    if (month < 0 || month > 11) {
        return res.status(401).json({ error: "Invalid date format." });
    }

    var lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    if (day < 1 || day > lastDayOfMonth) {
        return res.status(401).json({ error: "Invalid date format." });
    }

    var inputDate = new Date(year, month, day);
    var currentDate = new Date();


    if (currentDate < inputDate) {
        return res.status(400).json({ error: "Birthday cannot be in the future." });
    }

    try {
        const query1 = `SELECT COUNT(*) FROM users WHERE username = '${username}'`;
        const users = await db.send_sql(query1);
        if (users[0]["COUNT(*)"] != 0) {
            return res.status(409).json({ error: "An account with this username already exists, please try again." });
        }

        helper.encryptPassword(password, async (err, hash) => {
            if (err) {
                return res.status(500).json({ error: 'Error hashing password.' });
            }

            // upload to s3 
            await s3.uploadFileToS3(image, `profile_pictures/${username}`);

            var url = await s3.getUrlFromS3(`profile_pictures/${username}`);

            const query2 = `INSERT INTO users (username, hashed_password, first_name, last_name, email, affiliation, birthday, pfp_url, actor_nconst) 
                VALUES ("${username}", "${hash}", "${first_name}", "${last_name}", "${email}", "${affiliation}", "${birthday}", "${url}", null);`;
            await db.insert_items(query2);

            const results = await db.send_sql(`SELECT user_id FROM users WHERE username = "${username}";`);
            const userId = results[0].user_id;

            // link user to hashtags
            for (const tag of interests) {
                let [hashtag] = await db.send_sql(`SELECT hashtag_id FROM hashtags WHERE tag = "${tag}";`);
                await db.insert_items(`INSERT INTO user_hashtags (user_id, hashtag_id) VALUES (${userId}, ${hashtag.hashtag_id});`);

                // Increment hashtag count
                await db.send_sql(`
                    UPDATE hashtags SET count = count + 1 WHERE hashtag_id = ${hashtag.hashtag_id}
                `);
            }

            req.session.username = username;
            req.session.user_id = userId;

            return res.status(200).json({ username: username });
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};


// GET / get top-10 popular hashtags / for new users, existing users use suggestHashtags
var getTop10Hashtags = async function (req, res) {
    try {
        const query = `
        SELECT tag FROM hashtags
        LEFT JOIN hashtags_rank ON hashtags.hashtag_id = hashtags_rank.hashtag_id
        ORDER BY hashtags_rank.hashtag_rank DESC LIMIT 10`;
        const results = await db.send_sql(query);

        return res.status(200).json({ hashtags: results.map(row => row.tag) });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
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

            await db.insert_items(`INSERT INTO online (user_id) VALUES (${user.user_id})`);

            return res.status(200).json({ username: username });
        } else {
            return res.status(401).json({ error: 'Username and/or password are invalid.' });
        }

    } catch (error) {
        console.log(error);

        return res.status(500).json({ error: 'Error querying database.' });
    }
};


// POST /logout
var logout = async function (req, res) {
    if (req.session.user_id) {
        const userId = req.session.user_id;
        req.session.user_id = null;
        req.session.username = null;

        await db.send_sql(`DELETE FROM online WHERE user_id = ${userId};`);

        return res.status(200).json({ message: "You were successfully logged out." });
    }
};


var registration_routes = {
    add_hashtags: addHashtags,
    signup: signup,
    get_top_10_hashtags: getTop10Hashtags,
    login: login,
    logout: logout,
    dummy_s3_upload: dummyS3Upload
}

module.exports = registration_routes;