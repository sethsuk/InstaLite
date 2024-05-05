var db = require('../models/database.js');
const config = require('../../config.json'); // Load configuration
const helper = require('./route_helper.js');

var authenticate_chat = async function (req, res) {
    const chatId = req.query.chatId;
    const username = req.params.username;

    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        const userId = req.session.user_id;
        console.log(`SELECT * FROM users_to_chat WHERE user_id = ${userId} AND chat_id = ${chatId}`);
        let result = await db.send_sql(`SELECT * FROM users_to_chat WHERE user_id = ${userId} AND chat_id = ${chatId}`);
        if (result.length >= 1) {
            return res.status(200).json({ message: "Authenticated to chat" });
        } else {
            return res.status(403).json({ message: "Not in this chat" });
        }
       
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

var get_online_friends = async function (req, res) {
    const username = req.params.username;

    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        const userId = req.session.user_id;
        const query = `SELECT DISTINCT username, o.user_id FROM online o LEFT JOIN friends f ON user_id=f.followed LEFT JOIN users u ON o.user_id=u.user_id WHERE f.follower = ${userId};`;
        let result = await db.send_sql(query);
        return res.status(200).json({friends: result});
       
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

var invite_to_chat = async function (req, res) {
    const username = req.params.username;
    const chatId = req.query.chatId;
    const toInvite = req.query.inviteUsername;
    let invite_user_id;
    const userId = req.session.user_id;

    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    try {
        let result = await db.send_sql(`SELECT user_id FROM users WHERE username = '${toInvite}' LIMIT 1`);
        console.log(result);
        invite_user_id = result[0].user_id;
    } catch(e) {
        return res.status(404).json({error: "requested friend does not exist"});
    }

    try {
        
        const query = `INSERT IGNORE INTO chat_invites(sender_id, reciever_id, chat_id, status) values(${userId}, ${invite_user_id}, ${chatId}, 'pending');`;
        console.log(query);
        result = await db.send_sql(query);
        return res.status(200).json({result: `sent an invite to ${toInvite} succesfully`});
       
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}



var chat_routes = {
    authenticate_chat: authenticate_chat,
    get_online_friends: get_online_friends,
    invite_to_chat: invite_to_chat,
}

module.exports = chat_routes 