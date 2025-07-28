const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

exports.extractTextFromFile = async (filePath) => {
  try {
    console.log('Extract service called with file:', filePath);
    const ext = path.extname(filePath).toLowerCase();
    console.log('File extension:', ext);
    
    if (ext === ".pdf") {
      console.log('Processing PDF file...');
      const buffer = fs.readFileSync(filePath);
      console.log('PDF buffer size:', buffer.length);
      const data = await pdf(buffer);
      console.log('PDF text extracted, length:', data.text?.length || 0);
      return data.text;
    } else if (ext === ".docx") {
      console.log('Processing DOCX file...');
      const result = await mammoth.extractRawText({ path: filePath });
      console.log('DOCX text extracted, length:', result.value?.length || 0);
      return result.value;
    }
    console.log('Unsupported file type:', ext);
    throw new Error("Unsupported file type");
  } catch (error) {
    console.error('Extract service error:', error);
    throw error;
  }
};

exports.callOllama = async (prompt) => {
  try {
    console.log('Calling Ollama API...');
    const res = await axios.post("http://localhost:11434/api/generate", {
      model: "mistral",
      prompt,
      stream: false,
    });
    console.log('Ollama API response status:', res.status);
    return res.data.response;
  } catch (error) {
    console.error('Ollama API error:', error.message);
    if (error.response) {
      console.error('Ollama API response status:', error.response.status);
      console.error('Ollama API response data:', error.response.data);
    }
    throw error;
  }
};
