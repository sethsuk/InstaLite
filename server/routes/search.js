const { OpenAI, ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { formatDocumentsAsString } = require("langchain/util/document");
const {
  RunnableSequence,
  RunnablePassthrough,
} = require("@langchain/core/runnables");
const { Chroma } = require("@langchain/community/vectorstores/chroma");

var db = require('../models/database.js');

var query = async function (req, res) {
  let results = await db.send_sql(` SELECT post_id, content from posts;`);
  let captions = results.map(result => `Post ${result.post_id}: ${result.content}`);
  let ids = results.map(function (item) {
    return { id: item.post_id };
  });
  const vectorStore = await Chroma.fromTexts(
    captions,
    ids,
    new OpenAIEmbeddings({ model: "text-embedding-3-large", apiKey: process.env.OPENAI_API_KEY }),
    {
      collectionName: `${Date.now()}`,
    }
  );

  // const retriever = vectorStore.asRetriever();
  let question = req.query.prompt;
  console.log(question);
  const response = await vectorStore.similaritySearch(question, 3);

  let context = '';

  for (let i = 0; i < 3; i++) {
    context += `Post ${response[i].metadata.id}: ${response[i].pageContent}`;
  }

  let system = 'You are a helpful recommendation chatbot. Explain why one of these posts is relevant to answering the question. You must include an explanation in your response.Respond in the JSON format with the parameters explanation and selected_post_id';
  const prompt = PromptTemplate.fromTemplate(`${system}
    
    {context}

    Question: {question}
    
    Helpful Answer:`);
  const llm = new ChatOpenAI({ model: "gpt-3.5-turbo-16k", temperature: 0, apiKey: process.env.OPENAI_API_KEY });

  const ragChain = RunnableSequence.from([
    {
      context: vectorStore.asRetriever().pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  result = await ragChain.invoke(question);
  let result_ids = response.map(item => item.metadata.id);
  res.status(200).json({ recs: response, llm: result, id: result_ids });

}

var search_routes = {
  query: query
}
module.exports = search_routes 