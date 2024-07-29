#!/usr/bin/env node

const fs = require('fs');

// Check if the correct number of arguments are provided
if (process.argv.length !== 3) {
  console.error('Usage: node ./download-all-remixes.js <project_id>');
  process.exit(1);
}

// Get the project ID from the command line arguments
const projectId = process.argv[2];

// Function to fetch the token for a given project ID
async function fetchProjectToken(projectId) {
  const response = await fetch(`https://api.scratch.mit.edu/projects/${projectId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch project metadata: ${response.statusText}`);
  }
  const data = await response.json();
  return data.project_token;
}

// Function to fetch all remixes of a project
async function fetchAllRemixes(projectId) {
  try {
    // Fetch the project metadata to get the remix count
    const metadataResponse = await fetch(`https://api.scratch.mit.edu/projects/${projectId}`);
    if (!metadataResponse.ok) {
      throw new Error(`Failed to fetch project metadata: ${metadataResponse.statusText}`);
    }
    const metadata = await metadataResponse.json();
    const remixCount = metadata.stats.remixes;

    console.log(`Total remixes: ${remixCount}`);

    // Create ./projects/:projectid/ if it doesn't already exist
    if (!fs.existsSync(`./projects/${projectId}/`)){
      fs.mkdirSync(`./projects/${projectId}/`);
    }

    // Download the original project
    const token = await fetchProjectToken(projectId);
    const projectJsonResponse = await fetch(`https://projects.scratch.mit.edu/${projectId}?token=${token}`);
    const projectJson = await projectJsonResponse.json();
    const filename = `./projects/${projectId}/original.json`;
    fs.writeFileSync(filename, JSON.stringify(projectJson, null, 2));
    console.log(`Original JSON saved to ${filename}`);

    // Function to fetch remixes with pagination
    const fetchRemixes = async (offset) => {
      const remixesResponse = await fetch(`https://api.scratch.mit.edu/projects/${projectId}/remixes?limit=20&offset=${offset}`);
      if (!remixesResponse.ok) {
        throw new Error(`Failed to fetch remixes: ${remixesResponse.statusText}`);
      }
      return await remixesResponse.json();
    };

    // Fetch all remixes
    for (let offset = 0; offset < remixCount; offset += 20) {
      const remixes = await fetchRemixes(offset);
      for (const remix of remixes) {
        const remixId = remix.id;

        try {
          // Fetch the token for the remix project
          const token = await fetchProjectToken(remixId);

          // Fetch the remix JSON using the token
          const remixJsonResponse = await fetch(`https://projects.scratch.mit.edu/${remixId}?token=${token}`);
          if (!remixJsonResponse.ok) {
            console.error(`Failed to fetch remix JSON for project ID ${remixId}: ${remixJsonResponse.statusText}`);
            continue;
          }
          const remixJson = await remixJsonResponse.json();

          // Save the remix JSON to a file
          const filename = `./projects/${projectId}/${remixId}.json`;
          fs.writeFileSync(filename, JSON.stringify(remixJson, null, 2));
          console.log(`Remix JSON saved to ${filename}`);
        } catch (error) {
          console.error(`Error fetching token or remix JSON for project ID ${remixId}: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Fetch and save all remixes
fetchAllRemixes(projectId);
