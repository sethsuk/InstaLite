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

var get_chats = async function (req, res) {
    const username = req.params.username;

    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        const userId = req.session.user_id;
        const query = `SELECT GROUP_CONCAT(username) as name, chat_id FROM users_to_chat uc LEFT JOIN users u on uc.user_id=u.user_id WHERE chat_id IN (SELECT chat_id FROM users_to_chat WHERE user_id=${userId}) GROUP BY chat_id;`;
        let result = await db.send_sql(query);
        return res.status(200).json({chats: result});
       
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

var get_chat_invitations = async function (req, res) {
    const username = req.params.username;

    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        const userId = req.session.user_id;
        const query = `SELECT invite_id, username FROM chat_invites LEFT JOIN users ON sender_id=user_id WHERE reciever_id=${userId} AND status='pending'`;
        let result = await db.send_sql(query);
        return res.status(200).json({requests: result});
       
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

var accept_invite = async function (req, res) {
    const username = req.params.username;
    const inviteId = req.body.inviteId;

    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        const userId = req.session.user_id;
        const getRequest = `SELECT * FROM chat_invites WHERE invite_id=${inviteId} AND reciever_id=${userId} LIMIT 1`;
        const request = await db.send_sql(getRequest);
        if (request.length == 1) {
            const query = `UPDATE chat_invites SET status='accepted' WHERE invite_id=${inviteId}`;
            const result = await db.send_sql(query);
            console.log(request);
            const insert = `INSERT IGNORE INTO users_to_chat(chat_id, user_id) VALUES(${request[0].chat_id}, ${userId})`;
            await db.send_sql(insert);
            return res.status(200).json({chat_id: request.chat_id});
        }
       
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

var reject_invite = async function (req, res) {
    const username = req.params.username;
    const inviteId = req.body.inviteId;
    console.log(req.body);

    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        const userId = req.session.user_id;
        const getRequest = await db.send_sql(`UPDATE chat_invites SET status='rejected' WHERE invite_id=${inviteId} AND reciever_id=${userId}`);
        return res.status(200).json({result: "rejected request succesfully"});
       
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}



var chat_routes = {
    authenticate_chat: authenticate_chat,
    get_online_friends: get_online_friends,
    invite_to_chat: invite_to_chat,
    get_chats: get_chats,
    get_chat_invitations: get_chat_invitations,
    accept_invite: accept_invite,
    reject_invite: reject_invite,

}

module.exports = chat_routes 