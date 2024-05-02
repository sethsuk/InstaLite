var path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const tf = require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');
const { ChromaClient } = require("chromadb");

let optionsSSDMobileNet;
const modelsDir = path.join(__dirname, '..', 'model');

const client = new ChromaClient({ host: 'localhost', port: 8000 });
let collection;


async function initializeFaceModels() {
    console.log("Initializing FaceAPI...");

    await tf.ready();
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsDir);
    optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5, maxResults: 1 });
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsDir);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsDir);

    return;
}


/**
 * Helper function, converts "descriptor" Int32Array to JavaScript array
 * @param {Int32Array} array 
 * @returns JavaScript array
 */
const getArray = (array) => {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
        ret.push(array[i]);
    }
    return ret;
}


/**
 * Compute the face embeddings within an image file
 * 
 * @param {*} imageFile 
 * @param {bool} isBuffer
 * @returns List of detected faces' embeddings
 */
async function getEmbeddings(imageFile, isBuffer) {
    let image;
    if (!isBuffer) {
        image = fs.readFileSync(imageFile);
    } else {
        console.log('Is a buffer');
        image = imageFile; // In case it's already a buffer, use it directly
    }
    const tensor = tf.node.decodeImage(image, 3);

    const faces = await faceapi.detectAllFaces(tensor, optionsSSDMobileNet)
        .withFaceLandmarks()
        .withFaceDescriptors();
    tf.dispose(tensor);

    // For each face, get the descriptor and convert to a standard array
    return faces.map((face) => getArray(face.descriptor));
};


// Schema: 
// ids: A list of unique identifiers for each face embedding.
// embeddings: High-dimensional vectors representing the face embeddings.
// metadatas: A JSON object containing additional data about each embedding. In your case, this includes a source field.
// documents: A list of filename 
async function indexAllFaces(pathName, image, collection) {
    const embeddings = await getEmbeddings(pathName, false);

    var success = true;
    var inx = 1;
    for (var embedding of embeddings) {
        const data = {
            ids: [image + '-' + inx++],
            embeddings: [
                embedding,
            ],
            metadatas: [{ source: "imdb" }],
            documents: [image],
        };
        var res = await collection.add(data);

        if (res === true) {
            console.info("Added image embedding for " + image + " to collection.");
        } else {
            console.error(res.error);
            success = false;
        }
    }
    return success;
}


async function findTopKMatches(collection, image, k) {
    var ret = [];

    var queryEmbeddings = await getEmbeddings(image, true);
    for (var queryEmbedding of queryEmbeddings) {
        var results = await collection.query({
            queryEmbeddings: queryEmbedding,
            // By default embeddings aren't returned -- if you want
            // them you need to uncomment this line
            // include: ['embeddings', 'documents', 'metadatas'],
            nResults: k
        });

        ret.push(results);
    }
    return ret;
}


async function initializeCollection() {
    await initializeFaceModels();

    collection = await client.getOrCreateCollection({
        name: "face-api",
        embeddingFunction: null,
        metadata: { "hnsw:space": "l2" },
    });

    console.info("Looking for files");
    const directoryPath = path.join(__dirname, '..', "images"); // Adjust directory path as necessary

    try {
        const files = await fsp.readdir(directoryPath);
        const indexPromises = files.map(file => {
            console.info("Adding task for " + file + " to index.");
            return indexAllFaces(path.join(directoryPath, file), file, collection);
        });

        await Promise.all(indexPromises);
        console.info("All images indexed.");
    } catch (err) {
        console.error("Error listing directory or indexing images:", err);
    }
}


function getCollection() {
    if (!collection) {
        throw new Error("Collection has not been initialized.");
    }
    return collection;
}


module.exports = {
    getEmbeddings,
    indexAllFaces,
    findTopKMatches,
    initializeCollection,
    getCollection
}