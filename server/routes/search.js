const { OpenAI, ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
// const { CheerioWebBaseLoader } = require("langchain/document_loaders/web/cheerio");

// const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/openai");
// const { MemoryVectorStore } = require("langchain/vectorstores/memory");
// const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
// const { Document } = require("@langchain/core/documents");
// const { createRetrievalChain } = require("langchain/chains/retrieval");
// const { formatDocumentsAsString } = require("langchain/util/document");
// const {
//     RunnableSequence,
//     RunnablePassthrough,
//   } = require("@langchain/core/runnables");
const { Chroma } = require("@langchain/community/vectorstores/chroma");

var db = require('../models/database.js');
const config = require('../../config.json'); // Load configuration
const helper = require('./route_helper.js');

// [
//     `Tortoise: Labyrinth? Labyrinth? Could it Are we in the notorious Little
//         Harmonic Labyrinth of the dreaded Majotaur?`,
//     "Achilles: Yiikes! What is that?",
//     `Tortoise: They say-although I person never believed it myself-that an I
//         Majotaur has created a tiny labyrinth sits in a pit in the middle of
//         it, waiting innocent victims to get lost in its fears complexity.
//         Then, when they wander and dazed into the center, he laughs and
//         laughs at them-so hard, that he laughs them to death!`,
//     "Achilles: Oh, no!",
//     "Tortoise: But it's only a myth. Courage, Achilles.",
//   ],
//   [{ id: 2 }, { id: 1 }, { id: 3 }],


var query = async function (req, res) {
    // const {prompt} = req.query;
    let results = await db.send_sql(` SELECT post_id, content from posts;`);
    console.log(results);
    let captions = results.map(result => result.content);
    ids = results.map(function (item) {
        return {id: item.post_id}; 
    });
    console.log(captions);
    console.log(ids);
    const vectorStore = await Chroma.fromTexts(
        captions,
        ids,
        new OpenAIEmbeddings(),
        {
          collectionName: "post-content",
        }
      );

      
      const response = await vectorStore.similaritySearch("happy", 2);
      
      console.log(response);
      return res.status(200).json({response: response});
    
}

var search_routes = {
    query: query
}
module.exports = search_routes