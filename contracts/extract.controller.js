const { extractTextFromFile, callOllama } = require("./extract.service");
const axios = require("axios");

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

exports.extractAndPreviewContract = async (req, res) => {
  try {
    console.log('Extract request received');
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Forward the file to the AI service
    try {
      console.log('Forwarding file to AI service...');
      
      const FormData = require('form-data');
      const fs = require('fs');
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/extract`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('AI service response received');
      
      const fileMeta = {
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size: req.file.size,
        file_path: req.file.path
      };

      // Return the AI service response with file metadata
      return res.json({
        extracted: aiResponse.data.extracted,
        fileMeta: fileMeta
      });

    } catch (aiError) {
      console.error('AI service error:', aiError.message);
      
      // Fallback to local extraction if AI service fails
      console.log('Falling back to local extraction...');
      
      const filePath = req.file.path;
      console.log('File path:', filePath);
      
      const fileMeta = {
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size: req.file.size,
        file_path: filePath
      };

      console.log('Extracting text from file...');
      const text = await extractTextFromFile(filePath);
      console.log('Text extracted, length:', text?.length || 0);
      
      const prompt = `Contract content:\n\n${text}\n\nExtract the following data from this contract and respond in JSON format only, no additional text:\n\n{
  "contract_number": "extracted contract number",
  "contract_type": "Kontrak or PO", 
  "contract_name": "extracted contract name/title", 
  "category": "main category (IT, Finance, HR, etc)",
  "sub_category": "sub category if available",
  "item": "description of items/services (one word or short phrase)",
  "contract_date": "contract date in YYYY-MM-DD format",
  "start_date": "start date in YYYY-MM-DD format", 
  "end_date": "end date in YYYY-MM-DD format",
  "vendor": "vendor/supplier name",
  "department": "department responsible",
  "pic_user_name": "person in charge from user side",
  "pic_ipm_name": "person in charge from IPM side",
  "ats_amount": "ATS amount as number (extract from currency/amount)",
  "jsl_amount": "JSL amount as number", 
  "subscription_amount": "subscription amount as number",
  "notes": "any additional notes or important details"
}

If any field is not found, use null or empty string. For amounts, extract only numbers without currency symbols.`;
      
      console.log('Calling Ollama...');
      const llmResult = await callOllama(prompt);
      console.log('Ollama response received, length:', llmResult?.length || 0);

      let extracted;
      try {
        console.log('Parsing JSON response...');
        extracted = JSON.parse(llmResult);
        console.log('JSON parsed successfully');
      } catch (parseError) {
        console.log('JSON parse error:', parseError.message);
        console.log('Raw LLM response:', llmResult);
        return res.status(400).json({ message: "LLM did not return valid JSON", raw: llmResult });
      }

      // Send extraction result and file metadata to FE
      console.log('Sending success response');
      return res.status(200).json({ extracted, fileMeta });
    }
  } catch (err) {
    console.error('Extract controller error:', err);
    res.status(500).json({ message: "Extraction failed", error: err.message });
  }
};
