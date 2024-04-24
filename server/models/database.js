const mysql = require('mysql');
const config = require('../config.json'); // Load database configuration

// Implementation of a singleton pattern for database connections
var the_db = null;

module.exports = {
    get_db_connection,
    create_tables,
    insert_items,
    send_sql,
    close_db
};

/**
 * Establishes a database connection using environment variables and configuration.
 * If a connection already exists, it returns the existing connection.
 *
 * @returns A Promise that resolves to the database connection object.
 */
function get_db_connection() {
    if (the_db) {
        return Promise.resolve(the_db);
    }

    // Override config credentials with environment variables
    var dbconfig = {
        ...config.database,
        user: process.env.RDS_USER,
        password: process.env.RDS_PWD,
    };

    // Create a MySQL connection
    the_db = mysql.createConnection(dbconfig);

    return new Promise((resolve, reject) => {
        the_db.connect(err => {
            if (err) {
                console.error('Database connection failed:', err);
                reject(err);
            } else {
                console.log('Connected to the MySQL server.');
                resolve(the_db);
            }
        });
    });
}

/**
 * Closes the database connection.
 */
async function close_db() {
    if (the_db) {
        the_db.end(err => {
            if (err) console.error('Error closing the database connection:', err);
        });
        the_db = null;
    }
}

/**
 * Sends an SQL query to the database.
 *
 * @param {string} sql The SQL query string.
 * @param {Array} params Parameters for the SQL query.
 * @returns A Promise that resolves with the query results.
 */
async function send_sql(sql, params = []) {
    return get_db_connection().then(dbo => {
        return new Promise((resolve, reject) => {
            dbo.query(sql, params, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    });
}

/**
 * Executes an SQL query to create tables in the database.
 *
 * @param {string} query The CREATE TABLE SQL query string.
 * @param {Array} params Parameters for the query.
 * @returns A Promise that resolves with the results of the query.
 */
async function create_tables(query, params = []) {
    return send_sql(query, params);
}

/**
 * Executes an SQL INSERT query.
 *
 * @param {string} query The INSERT SQL query string.
 * @param {Array} params Parameters for the query.
 * @returns the number of affected rows.
 */
async function insert_items(query, params = []) {
    result = await send_sql(query, params);
    return result.affectedRows;
}