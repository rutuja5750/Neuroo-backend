require("dotenv").config();
const { BlobServiceClient } = require("@azure/storage-blob");

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME; // Read from .env

if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is missing! Check your .env file.");
}

if (!AZURE_CONTAINER_NAME) {
    throw new Error("AZURE_CONTAINER_NAME is missing! Check your .env file.");
}

// Initialize BlobServiceClient
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);

const uploadToAzure = async (buffer, fileName, mimeType) => {
    try {
        // Ensure the container exists
        await containerClient.createIfNotExists({ access: "container" });

        // Generate a unique blob name (timestamp + filename)
        const blobName = `${Date.now()}-${fileName}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Upload file buffer to Azure Blob Storage
        await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: mimeType }
        });

        console.log("File uploaded successfully:", blobName);

        // Return the public file URL
        return blockBlobClient.url;
    } catch (error) {
        console.error("Error uploading file to Azure:", error.message);
        throw new Error("Azure Blob Upload Failed");
    }
};

module.exports = { uploadToAzure };
