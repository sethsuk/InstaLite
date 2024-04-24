const dbaccess = require('./db_access');
const config = require('../../config.json'); // Load configuration

async function create_tables(db) {

    // create users table
    var q2 = db.create_tables('CREATE TABLE IF NOT EXISTS users ( \
        user_id INT NOT NULL AUTO_INCREMENT, \
        username VARCHAR(255) NOT NULL, \
        hashed_password VARCHAR(255) NOT NULL, \
        first_name VARCHAR(255) NOT NULL, \
        last_name VARCHAR(255) NOT NULL, \
        email VARCHAR(255) NOT NULL, \
        affiliation VARCHAR(255) NOT NULL, \
        birthday DATE NOT NULL, \
        pfp VARCHAR(255), \
        actor_id VARCHAR(255), \
        PRIMARY KEY (user_id) \
    ); ');

    // create friends table
    var q1 = db.create_tables('CREATE TABLE IF NOT EXISTS friends ( \
        followed INT, \
        follower INT, \
        FOREIGN KEY (follower) REFERENCES users(user_id), \
        FOREIGN KEY (followed) REFERENCES users(user_id) \
    );');

    // create hashtags table
    var q3 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS hashtags
    (
        hashtag_id INT NOT NULL AUTO_INCREMENT,
        hashtag_name VARCHAR(255) NOT NULL,
        PRIMARY KEY (hashtag_id)
    );`);

    // create post table
    var q4 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS posts
    (
        post_id INT NOT NULL AUTO_INCREMENT,
        title VARCHAR(255),
        media VARCHAR(255),
        user_id INT NOT NULL,
        PRIMARY KEY (post_id)
    );`);

    // create hashtags_to_posts table
    var q5 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS hashtags_to_posts
    (
        hashtag_id INT NOT NULL,
        post_id INT NOT NULL,
        FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id),
        FOREIGN KEY (post_id) REFERENCES posts(post_id)
    );`);

    // create pfp table
    var q6 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS pfp
    (
        user_id INT NOT NULL,
        media VARCHAR(255) NOT NULL,
        PRIMARY KEY (user_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );`);

    // create recommendations table
    var q7 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS recommendations
    (
        recommend_to INT NOT NULL,
        recommendation INT NOT NULL,
        weight INT NOT NULL,
        FOREIGN KEY (recommend_to) REFERENCES users(user_id),
        FOREIGN KEY (recommendation) REFERENCES users(user_id)
    );`);

    // create comments table
    var q8 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS comments
    (
        comment_id INT NOT NULL AUTO_INCREMENT,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        content VARCHAR(255) NOT NULL,
        PRIMARY KEY (comment_id),
        FOREIGN KEY (post_id) REFERENCES posts(post_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );`);

    // create social rank users table
    var q9 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS users_rank
    (
        user_id INT NOT NULL,
        user_rank INT NOT NULL,
        PRIMARY KEY (user_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );`);

    // create social rank posts table
    var q10 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS posts_rank
    (
        post_id INT NOT NULL,
        post_rank INT NOT NULL,
        PRIMARY KEY (post_id),
        FOREIGN KEY (post_id) REFERENCES posts(post_id)
    );`);

    // create social rank hashtags table
    var q11 = db.create_tables(`
    CREATE TABLE IF NOT EXISTS hashtags_rank
    (
        hashtag_id INT NOT NULL,
        hashtag_rank INT NOT NULL,
        PRIMARY KEY (hashtag_id),
        FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id)
    );`);


    await Promise.all([q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11]);

    dbaccess.close_db()

    return;
}

// Database connection setup
const db = dbaccess.get_db_connection();

var result = create_tables(dbaccess);
console.log('Tables created');

// 
