const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");

module.exports = genAI;
