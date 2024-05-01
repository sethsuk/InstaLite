const dbaccess = require('./database.js');
const config = require('../../config.json'); // Load configuration


async function create_tables(db) {

    // create users table
    // foreign key of actor_nconst
    var q1 = db.create_tables('CREATE TABLE IF NOT EXISTS users ( \
        user_id INT NOT NULL AUTO_INCREMENT, \
        username VARCHAR(255) NOT NULL, \
        hashed_password VARCHAR(255) NOT NULL, \
        first_name VARCHAR(255) NOT NULL, \
        last_name VARCHAR(255) NOT NULL, \
        email VARCHAR(255) NOT NULL, \
        affiliation VARCHAR(255) NOT NULL, \
        birthday DATE NOT NULL, \
        pfp_url VARCHAR(255), \
        actor_nconst VARCHAR(10), \
        PRIMARY KEY(user_id) \
    );');

    // create friends table
    var q2 = db.create_tables('CREATE TABLE IF NOT EXISTS friends ( \
        followed INT, \
        follower INT, \
        FOREIGN KEY (follower) REFERENCES users(user_id), \
        FOREIGN KEY (followed) REFERENCES users(user_id) \
    );');

    // create friend requests table 
    var q3 = db.create_tables('CREATE TABLE IF NOT EXISTS friend_requests ( \
        request_id INT AUTO_INCREMENT PRIMARY KEY, \
        sender_id INT NOT NULL, \
        receiver_id INT NOT NULL, \
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \
        status ENUM("pending", "accepted", "rejected") DEFAULT "pending", \
        FOREIGN KEY (sender_id) REFERENCES users(user_id), \
        FOREIGN KEY (receiver_id) REFERENCES users(user_id) \
    );');

    // create online table 
    var q4 = db.create_tables('CREATE TABLE IF NOT EXISTS online ( \
        session_id INT AUTO_INCREMENT PRIMARY KEY, \
        user_id INT, \
        FOREIGN KEY (user_id) REFERENCES users(user_id) \
    );');

    // create hashtags table
    var q5 = db.create_tables('CREATE TABLE IF NOT EXISTS hashtags ( \
        hashtag_id INT AUTO_INCREMENT PRIMARY KEY, \
        tag VARCHAR(255) NOT NULL UNIQUE, \
        count INT DEFAULT 0 \
    );');

    // initial hashtags 
    var q6 = db.send_sql(`INSERT IGNORE INTO hashtags (tag) VALUES 
        ('sports'), 
        ('fashion'), 
        ('sci-fi'), 
        ('comedy'), 
        ('food'), 
        ('outdoor'), 
        ('family'), 
        ('penn'), 
        ('queer'), 
        ('romance');
    `);

    // create user to hashtags table 
    var q7 = db.create_tables('CREATE TABLE IF NOT EXISTS user_hashtags ( \
        user_id INT, \
        hashtag_id INT, \
        FOREIGN KEY (user_id) REFERENCES users(user_id), \
        FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id) \
    );');

    // create posts table
    var q8 = db.create_tables('CREATE TABLE IF NOT EXISTS posts ( \
        post_id INT NOT NULL AUTO_INCREMENT, \
        title VARCHAR(255), \
        media VARCHAR(255), \
        content VARCHAR(255), \
        user_id INT NOT NULL, \
        likes INT DEFAULT 0, \
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \
        PRIMARY KEY(post_id) \
    );');

    // create post_likes table
    var q9 = db.create_tables('CREATE TABLE IF NOT EXISTS post_likes ( \
        post_id INT NOT NULL, \
        user_id INT NOT NULL, \
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \
        FOREIGN KEY (post_id) REFERENCES posts(post_id), \
        FOREIGN KEY (user_id) REFERENCES users(user_id) \
    );');

    // create hashtag to posts table 
    var q10 = db.create_tables('CREATE TABLE IF NOT EXISTS hashtags_to_posts( \
        hashtag_id INT NOT NULL, \
        post_id INT NOT NULL, \
        FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id), \
        FOREIGN KEY (post_id) REFERENCES posts(post_id) \
    );');

    // create recommendations table
    var q11 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS recommendations
    (
        recommend_to INT NOT NULL,
        recommendation INT NOT NULL,
        weight INT NOT NULL,
        FOREIGN KEY (recommend_to) REFERENCES users(user_id),
        FOREIGN KEY (recommendation) REFERENCES users(user_id)
    );`);

    // create comments table
    var q12 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS comments
    (
        comment_id INT NOT NULL AUTO_INCREMENT,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        content VARCHAR(255) NOT NULL,
        parent_id INT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (comment_id),
        FOREIGN KEY (post_id) REFERENCES posts(post_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (parent_id) REFERENCES comments(comment_id)
    );`);

    // create hashtag to comments table 
    var q13 = db.create_tables('CREATE TABLE IF NOT EXISTS hashtags_to_comments( \
        hashtag_id INT NOT NULL, \
        comment_id INT NOT NULL, \
        FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id), \
        FOREIGN KEY (comment_id) REFERENCES comments(comment_id) \
    );');

    // create social rank users table
    var q14 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS users_rank
    (
        user_id INT NOT NULL,
        user_rank INT NOT NULL,
        PRIMARY KEY (user_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );`);

    // create social rank posts table
    var q15 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS posts_rank
    (
        post_id INT NOT NULL,
        post_rank INT NOT NULL,
        PRIMARY KEY (post_id),
        FOREIGN KEY (post_id) REFERENCES posts(post_id)
    );`);

    // create social rank hashtags table
    var q16 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS hashtags_rank
    (
        hashtag_id INT NOT NULL,
        hashtag_rank INT NOT NULL,
        PRIMARY KEY (hashtag_id),
        FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id)
    );`);

    // create chat_rooms table
    var q17 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS chat_rooms
    (
        chat_id INT NOT NULL AUTO_INCREMENT,
        member_count INT NOT NULL,
        PRIMARY KEY (chat_id)
    );`);

    // create users_to_chat table
    var q18 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS users_to_chat
    (
        chat_id INT NOT NULL,
        user_id INT NOT NULL,
        FOREIGN KEY (chat_id) REFERENCES chat_rooms(chat_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        PRIMARY KEY (chat_id, user_id)
    );`);

    // create chat_messages table
    var q19 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS chat_messages
    (
        message_id INT NOT NULL AUTO_INCREMENT,
        chat_id INT NOT NULL,
        user_id INT NOT NULL,
        content VARCHAR(255) NOT NULL,
        client_offset VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chat_rooms(chat_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        PRIMARY KEY (message_id)
    );`);

    // create chat_invites table
    var q20 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS chat_invites
    (
        sender_id INT NOT NULL,
        reciever_id INT NOT NULL,
        chat_id INT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(user_id),
        FOREIGN KEY (reciever_id) REFERENCES users(user_id),
        FOREIGN KEY (chat_id) REFERENCES chat_rooms(chat_id),
        PRIMARY KEY (sender_id, reciever_id)
    );`);

    await Promise.all([q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16, q17, q18, q19, q20]);
 
    dbaccess.close_db()

    return;
}

// Database connection setup
const db = dbaccess.get_db_connection();

var result = create_tables(dbaccess);
console.log('Tables created');

// 
