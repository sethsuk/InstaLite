const dbaccess = require('./db_access');
const config = require('../config.json'); // Load configuration

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
        actor_id INT, \
        PRIMARY KEY(user_id) \
    ); ');

    // create friends table
    var q1 = db.create_tables('CREATE TABLE IF NOT EXISTS friends ( \
        followed INT, \
        follower INT, \
        FOREIGN KEY (follower) REFERENCES users(user_id), \
        FOREIGN KEY (followed) REFERENCES users(user_id) \
    );');

    // TODO: create hashtags table


    // TODO: create posts table



    return await Promise.all([q1, q2, q3]);
}

// Database connection setup
const db = dbaccess.get_db_connection();

var result = create_tables(dbaccess);
console.log('Tables created');
