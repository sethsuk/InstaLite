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
        console.log(userId);
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

var chat_routes = {
    authenticate_chat: authenticate_chat
}

module.exports = chat_routes 