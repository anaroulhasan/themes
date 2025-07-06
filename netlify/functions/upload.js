// Import the necessary library to interact with the GitHub API.
const { Octokit } = require("@octokit/rest");

// The main handler for the Netlify function. All requests are processed here.
exports.handler = async function(event) {
    // Only accept POST requests. Return an error for any other method.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // 405 Method Not Allowed
            body: JSON.stringify({ message: 'Method Not Allowed.' })
        };
    }

    try {
        // Parse the data (filePath and fileContent) sent from the frontend.
        const { filePath, fileContent } = JSON.parse(event.body);

        // If filePath or fileContent is missing, return an error.
        if (!filePath || !fileContent) {
            return {
                statusCode: 400, // 400 Bad Request
                body: JSON.stringify({ message: 'File path or content is missing.' })
            };
        }

        // Initialize Octokit using the GitHub token stored as an environment variable in Netlify.
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });

        // Your GitHub repository information.
        const owner = 'anaroulhasan'; // Your GitHub username
        const repo = 'themes';        // Your repository name

        // Send a request to the GitHub API to create or update the file.
        const response = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath, // e.g., "Assets/Image/my-image.png"
            message: `feat: Add new file at ${filePath}`, // Commit message
            content: fileContent, // The file content, in base64 format
            branch: 'main',       // Your default branch name (could be 'main' or 'master')
        });
        
        // If the file is uploaded successfully, get its download URL.
        const download_url = response.data.content.download_url;

        // After a successful upload, send a confirmation message and the download URL to the frontend.
        return {
            statusCode: 200, // 200 OK
            body: JSON.stringify({
                message: "File uploaded successfully!",
                download_url: download_url
            }),
        };

    } catch (error) {
        // If an error occurs (e.g., bad token, no permission), log it and return a detailed error message.
        console.error('GitHub API Error:', error);
        return {
            statusCode: error.status || 500, // 500 Internal Server Error
            body: JSON.stringify({ message: `Error uploading to GitHub: ${error.message}` }),
        };
    }
};
