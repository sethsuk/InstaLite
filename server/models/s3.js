const AWS = require('aws-sdk');
const fs = require('fs');
var path = require('path');

// Configure the AWS SDK with the region and credentials
AWS.config.update({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AUTH_TOKEN
    }
});

const s3 = new AWS.S3();

const bucketName = 'project-java-swingers-upenn-nets2120-2024sp';

// Function to upload a file to S3
const uploadFileToS3 = async (file, key) => {

    const params = {
        Bucket: bucketName,
        Key: key, // file name you want to save as in S3
        Body: file,
        ContentType: 'image/jpeg',
        ACL: 'public-read', // or another ACL depending on your needs
    };

    try {
        const data = await s3.upload(params).promise();
        console.log(`File uploaded successfully at ${data.Location}`);
        return data.Location; // the URL of the uploaded file
    } catch (err) {
        console.error(err);
        throw err;
    }
};


const getUrlFromS3 = async (key) => {
    const url = `https://${bucketName}.s3.us-east-1.amazonaws.com/${key}`;
    return url;
};

const getImageFromS3 = async (key) => {
    const params = {
        Bucket: bucketName,
        Key: key,
    };

    try {
        // To get the file as a buffer
        const data = await s3.getObject(params).promise();
        console.log("File retrieved successfully.");
        return data.Body;
    } catch (err) {
        console.error("Error retrieving file:", err);
        throw err;
    }
};


module.exports = {
    uploadFileToS3,
    getUrlFromS3,
    getImageFromS3
};