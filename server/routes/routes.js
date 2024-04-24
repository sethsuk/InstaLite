// const { OpenAI, ChatOpenAI } = require("@langchain/openai");
// const { PromptTemplate } = require("@langchain/core/prompts");
// const { ChatPromptTemplate } = require("@langchain/core/prompts");
// const { StringOutputParser } = require("@langchain/core/output_parsers");
// const { CheerioWebBaseLoader } = require("langchain/document_loaders/web/cheerio");

const dbsingleton = require('../models/db_access.js');
const config = require('../../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('./route_helper.js');

// Database connection setup
const db = dbsingleton;

var vectorStore = null;

const PORT = config.serverPort;

var getHelloWorld = async function(req, res) {
    return res.status(200).send({message: "Hello, world!"});
};

/**
 * POST /register
 * 
 * takes in
 * username, password, firstName, lastName, email, affiliation, bday (yyyy-mm-dd string)
 * 
 */
var postRegister = async function(req, res) {
    const username = req.body["username"];
    const password = req.body["password"];
    const firstName = req.body["first_name"];
    const lastName = req.body["last_name"];
    const email = req.body["email"];
    const affiliation = req.body["affiliation"];
    var bday = req.body["birthday"];

    if (!username || !password || !firstName || !lastName || !email || !affiliation || !bday) {
        return res.status(400).json({error: 'One or more of the fields you entered was empty, please try again.'});
    }

    try {
        // SQL injection validation
        if(!helper.isOK(username) || !helper.isOK(firstName) || !helper.isOK(lastName)  || !helper.isOK(email) ||
            !helper.isOK(affiliation) || !helper.isOK(bday)) {
            return res.status(400).json({error: "Illegal input"});
        }


        // Date validation
        var regex = /^\d{4}-\d{2}-\d{2}$/;

        if (!regex.test(bday)) {
            return res.status(400).json({error: "Invalid date format."});
        }

        var dateParts = bday.split("-");

        var day = parseInt(dateParts[2], 10);
        var month = parseInt(dateParts[1], 10) - 1; // Months are 0-based in JavaScript
        var year = parseInt(dateParts[0], 10);

        var inputDate = new Date(year, month, day);
        var currentDate = new Date();

        if (currentDate < inputDate) {  // Compare input date with current date
            return res.status(400).json({error: "Birthday cannot be in the future."});
        }

        // Unique username validation        
        let existingUser = await db.send_sql(`SELECT COUNT(*) FROM users WHERE username = '${username}'`);

        if (existingUser[0]["COUNT(*)"] != 0) {
            return res.status(409).json({error: "An account with this username already exists, please try again."});
        }


        // Salt and hash password + send to DB
        helper.encryptPassword(password, function(err, hash) {
            if (err) {
                throw err;
            } else {
                db.send_sql(`
                    INSERT INTO users (username, hashed_password, first_name, last_name, email, affiliation, birthday)
                    VALUES ('${username}', '${hash}', '${firstName}', '${lastName}', '${email}', '${affiliation}', '${bday}')`); // still need to add pfp S3 link and actor_id
                return res.status(200).json({username: username});
            }
        });
    } catch (err) {
        console.log(err);

        return res.status(500).json({error: 'Error querying database.'});
    }
};


/**
 * POST /login
 * 
 * takes in
 * username, password
 */
var postLogin = async function(req, res) {
    // check username and password and login
    const username = req.body["username"];
    const password = req.body["password"];

    if (!username || !password) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    try {
        const existingUser = await db.send_sql("SELECT * FROM users WHERE username = '" + username + "'");

        if (existingUser.length == 0) {
            return res.status(409).json({error: "Username and/or password are invalid."});
        }
        
        bcrypt.compare(password, existingUser[0]["hashed_password"], function(err, same) {
            if (err) {
                throw err;
            } else {
                if (same) {
                    req.session.user_id = existingUser[0]["user_id"];
        
                    return res.status(200).json({"username": username});
                } else {
                    return res.status(401).json({error: 'Username and/or password are invalid.'});
                }
            }
        });

    } catch (err) {
        return res.status(500).json({error: 'Error querying database.'});
    }
};


/* Here we construct an object that contains a field for each route
   we've defined, so we can call the routes from app.js. */

var routes = { 
    get_helloworld: getHelloWorld,
    post_register: postRegister,
    post_login: postLogin
};


module.exports = routes;
