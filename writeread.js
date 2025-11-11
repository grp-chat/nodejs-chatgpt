// writeread.js
require('dotenv').config();
const axios = require('axios');
const { Buffer } = require('buffer');

const DEFAULT_TEXT = "abcde";

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const PATH = process.env.GITHUB_PATH;
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOKEN = process.env.GITHUB_TOKEN;

const CONTENTS_API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

// Helper: Detect if string is JSON
function tryParseJSON(text) {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object') {
        console.log(typeof parsed)
        return parsed;
    }
  } catch {
    // Not JSON
    console.log(typeof text);
  }
  return text;
}

// Load game (string, array, or object)
async function loadGame() {
  try {
    const resp = await axios.get(CONTENTS_API, {
      params: { ref: BRANCH },
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    const data = resp.data;
    let content = "";
    if (data && data.content) {
      const buff = Buffer.from(data.content, data.encoding);
      content = buff.toString('utf8');
    }

    if (!content.trim()) return DEFAULT_TEXT;

    // Attempt to parse as JSON
    return tryParseJSON(content);

  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log("File not found. Creating default file on GitHub...");
      await saveGame(DEFAULT_TEXT); // Create file
      return DEFAULT_TEXT;
    }
    console.error("Error loading GitHub file:", err.response?.data || err.message);
    return DEFAULT_TEXT;
  }
}

// Save game (string, array, or object)
async function saveGame(newData) {
  try {
    // Convert array/object to string
    let dataToSave = newData;
    if (typeof newData === 'object') {
      dataToSave = JSON.stringify(newData);
    }

    // Check if file exists
    let sha = null;
    try {
      const getResp = await axios.get(CONTENTS_API, {
        params: { ref: BRANCH },
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${TOKEN}`,
          "X-GitHub-Api-Version": "2022-11-28"
        }
      });
      sha = getResp.data.sha;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log("File does not exist. Will create new file.");
        sha = null; // File will be created
      } else {
        throw err;
      }
    }

    const encoded = Buffer.from(dataToSave, 'utf8').toString('base64');

    const putBody = {
      message: `Save game data`,
      content: encoded,
      branch: BRANCH,
    };
    if (sha) putBody.sha = sha;

    const putResp = await axios.put(CONTENTS_API, putBody, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    console.log("GitHub file saved:", putResp.data.content?.sha);
    return true;

  } catch (err) {
    console.error("Error saving GitHub file:", err.response?.data || err.message);
    return false;
  }
}

module.exports = { loadGame, saveGame };
