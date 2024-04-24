// const { OpenAI, ChatOpenAI } = require("@langchain/openai");
// const { PromptTemplate } = require("@langchain/core/prompts");
// const { ChatPromptTemplate } = require("@langchain/core/prompts");
// const { StringOutputParser } = require("@langchain/core/output_parsers");
// const { CheerioWebBaseLoader } = require("langchain/document_loaders/web/cheerio");

// const dbsingleton = require('../models/db_access.js');
const config = require('../../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('./route_helper.js');

// Database connection setup
// const db = dbsingleton;

var vectorStore = null;

const PORT = config.serverPort;

var getHelloWorld = async function(req, res) {
    return res.status(200).send({message: "Hello, world!"});
}


/* Here we construct an object that contains a field for each route
   we've defined, so we can call the routes from app.js. */

var routes = { 
    get_helloworld: getHelloWorld
};


module.exports = routes;
