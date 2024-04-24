const dbaccess = require('./database.js');

async function create_tables(db) {

    // create users table
    // foreign key of actor_nconst
    var q2 = db.create_tables('CREATE TABLE IF NOT EXISTS users ( \
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
    var q1 = db.create_tables('CREATE TABLE IF NOT EXISTS friends ( \
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
        status ENUM("pending", "accepted", "rejected") DEFAULT "pending", \
        FOREIGN KEY (sender_id) REFERENCES users(user_id), \
        FOREIGN KEY (receiver_id) REFERENCES users(user_id) \
    );');

    // create online table 
    var q4 = db.create_tables('CREATE TABLE IF NOT EXISTS online ( \
        session_id INT PRIMARY KEY, \
        user_id INT, \
        FOREIGN KEY (user) REFERENCES users(user_id) \
    );');

    // create hashtags table
    var q5 = db.create_tables('CREATE TABLE IF NOT EXISTS hashtags ( \
        hashtag_id INT AUTO_INCREMENT PRIMARY KEY, \
        tag VARCHAR(255) NOT NULL UNIQUE, \
        count INT DEFAULT 0 \
    );');

    // initial hashtags 
    var q6 = db.send_sql(`INSERT INTO hashtags (tag) VALUES 
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


    // TODO: create posts table



    return await Promise.all([q1, q2, q3, q4, q5, q6, q7]);
}

// Database connection setup
const db = dbaccess.get_db_connection();

var result = create_tables(dbaccess);
console.log('Tables created');
