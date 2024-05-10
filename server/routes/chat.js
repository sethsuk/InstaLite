var db = require('../models/database.js');
const helper = require('./route_helper.js');

var authenticate_chat = async function (req, res) {
    const chatId = req.query.chatId;
    const username = req.params.username;

    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        const userId = req.session.user_id;
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
        return res.status(200).json({ friends: result });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

var invite_to_chat = async function (req, res) {
    console.log("SENDING INVITE TO CHAT");

    const username = req.params.username;
    const chatId = req.query.chatId;
    let invite_user_id = req.query.friend_id;
    const userId = req.session.user_id;

    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    try {
        var currMemberQuery = await db.send_sql(`
            SELECT GROUP_CONCAT(user_id), chat_id from users_to_chat WHERE chat_id = ${chatId} GROUP BY (chat_id);
        `);

        var currentMember = currMemberQuery[0]["GROUP_CONCAT(user_id)"];
        var idCount = currentMember.split(",").length;

        console.log("Current Member:");
        console.log(currentMember);

        console.log("ID Count:");
        console.log(idCount);


        var existingRoomCheck = await db.send_sql(`
            SELECT COUNT(*) AS room_count
            FROM (
                SELECT chat_id
                FROM users_to_chat
                WHERE user_id IN (${currentMember})
                GROUP BY chat_id
                HAVING COUNT(DISTINCT user_id) = ${idCount}
            ) AS chat_rooms;
        `);

        console.log("\nRESPONSE:");
        console.log(existingRoomCheck);

        if (existingRoomCheck[0]["COUNT(*)"] != 0) {
            return res.status(205).json({error: "Chat room already exists with new user."});
        }


        const query = `INSERT IGNORE INTO chat_invites(sender_id, reciever_id, chat_id, status) values(${userId}, ${invite_user_id}, ${chatId}, 'pending');`;
        console.log(query);
        result = await db.send_sql(query);
        return res.status(200).json({ result: `sent an invite to ${invite_user_id} succesfully` });

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
        console.log(query);
        let result = await db.send_sql(query);
        return res.status(200).json({ chats: result });

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
        const query = `SELECT invite_id, username, chat_id FROM chat_invites LEFT JOIN users ON sender_id=user_id WHERE reciever_id=${userId} AND status='pending'`;
        let result = await db.send_sql(query);
        return res.status(200).json({ requests: result });

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
            return res.status(200).json({ chat_id: request.chat_id });
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
        return res.status(200).json({ result: "rejected request succesfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

var getInvitableFriends = async function (req, res) {
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        const userId = req.session.user_id;
        const query = `SELECT DISTINCT username, o.user_id, MAX(CASE WHEN i.status = 'pending' THEN 1 ELSE 0 END) as status FROM online o LEFT JOIN friends f ON user_id=f.followed LEFT JOIN users u ON o.user_id=u.user_id LEFT JOIN chat_invites i ON o.user_id=i.reciever_id AND f.follower=i.sender_id WHERE f.follower=${userId} GROUP BY user_id;`;
        const result = await db.send_sql(query);
        res.status(200).json({ friends: result });
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
}

var sendInvite = async function (req, res) {
    const username = req.params.username;
    const { friendId } = req.body;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        await db.send_sql('INSERT INTO chat_rooms VALUES();');
        const result1 = await db.send_sql('SELECT LAST_INSERT_ID() as id;');
        const chat_id = result1[0].id;

        const userId = req.session.user_id;
        

        await db.send_sql(`INSERT INTO users_to_chat (user_id, chat_id) VALUES(${userId}, ${chat_id})`);
        await db.send_sql(`INSERT INTO chat_invites (sender_id, reciever_id, chat_id, status) VALUES(${userId}, ${friendId}, ${chat_id}, 'pending')`);

        res.status(200).json({ result: `Created chat ${chat_id} succesfully` });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database.' });
    }
}

var invitable_to_chat = async function (req, res) {
    const username = req.params.username;
    const { chatId } = req.query;

    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    try {
        const userId = req.session.user_id;
        let result = await db.send_sql(`
            SELECT DISTINCT f.followed AS user_id, u.username 
            FROM friends f
            LEFT JOIN users u ON f.followed = u.user_id
            WHERE f.followed NOT IN (
                SELECT user_id FROM users_to_chat WHERE chat_id = ${chatId}
            ) 
            AND f.followed NOT IN (
                SELECT reciever_id FROM chat_invites WHERE chat_id = ${chatId} AND sender_id = ${userId}
            ) 
            AND f.follower = ${userId}
        `);
        
        res.status(200).json({ friends: result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database.' });
    }
}

var leave_chat = async function (req, res) {
    const username = req.params.username;
    const { chatId } = req.query;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        const userId = req.session.user_id;
        let result = await db.send_sql(`DELETE FROM users_to_chat WHERE user_id = ${userId} AND chat_id = ${chatId}`);
        res.status(200).json({ result: `Left chat {chatId} succesfully` });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database.' });
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
    get_invitable_friends: getInvitableFriends,
    send_invite: sendInvite,
    invitable_to_chat: invitable_to_chat,
    leave_chat: leave_chat
}

module.exports = chat_routes 