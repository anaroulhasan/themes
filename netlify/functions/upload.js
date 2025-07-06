// Import the necessary library to interact with the GitHub API.
const { Octokit } = require("@octokit/rest");

// The main handler for the Netlify function. All requests are processed here.
exports.handler = async function(event) {
    // Only accept POST requests.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed.' })
        };
    }

    try {
        const { filePath, fileContent } = JSON.parse(event.body);

        if (!filePath || !fileContent) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'File path or content is missing.' })
            };
        }

        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });

        const owner = 'anaroulhasan';
        const repo = 'themes';
        const branch = 'main';
        
        let existingFileSha = undefined;

        // --- NEW: Check if the file already exists ---
        try {
            const { data } = await octokit.repos.getContent({
                owner,
                repo,
                path: filePath,
                ref: branch,
            });
            // If the file exists, get its sha
            if (data && data.sha) {
                existingFileSha = data.sha;
            }
        } catch (error) {
            // A 404 error means the file does not exist, which is fine.
            // We can ignore it and proceed to create the file.
            if (error.status !== 404) {
                throw error; // Re-throw other errors
            }
        }
        // --- END OF NEW LOGIC ---

        // Send a request to the GitHub API to create or update the file.
        const { data: { content } } = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: `feat: ${existingFileSha ? 'Update' : 'Add'} ${filePath}`, // Dynamic commit message
            content: fileContent,
            branch: branch,
            sha: existingFileSha, // Pass the sha if updating an existing file
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "File uploaded successfully!",
                download_url: content.download_url // The GitHub raw URL
            }),
        };

    } catch (error) {
        console.error('GitHub API Error:', error);
        return {
            statusCode: error.status || 500,
            body: JSON.stringify({ message: `Error uploading to GitHub: ${error.message}` }),
        };
    }
};
