const fs = require('fs');
const path = require('path');

const METADATA_FILE = path.join(__dirname, "../uploads/file_metadata.json");

function loadFileMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading file metadata:', error);
  }
  return {};
}

function saveFileMetadata(metadata) {
  try {
    const uploadsDir = path.dirname(METADATA_FILE);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Error saving file metadata:', error);
  }
}

async function fixContractIdTypes() {
  console.log('Loading file metadata...');
  const metadata = loadFileMetadata();
  
  let updatedCount = 0;
  
  for (const [fileId, fileData] of Object.entries(metadata)) {
    if (typeof fileData.contract_id === 'string' && !isNaN(parseInt(fileData.contract_id))) {
      console.log(`Converting contract_id for ${fileId}: "${fileData.contract_id}" -> ${parseInt(fileData.contract_id)}`);
      fileData.contract_id = parseInt(fileData.contract_id);
      updatedCount++;
    }
  }
  
  if (updatedCount > 0) {
    console.log(`Saving updated metadata with ${updatedCount} contract ID fixes...`);
    saveFileMetadata(metadata);
    console.log('✅ Contract ID types fixed successfully!');
  } else {
    console.log('✅ No contract ID type fixes needed - all are already integers.');
  }
  
  console.log(`\n📊 Final metadata summary:`);
  const contractCounts = {};
  for (const [fileId, fileData] of Object.entries(metadata)) {
    const contractId = fileData.contract_id;
    contractCounts[contractId] = (contractCounts[contractId] || 0) + 1;
  }
  
  console.log('Files per contract:');
  for (const [contractId, count] of Object.entries(contractCounts)) {
    console.log(`  Contract ${contractId}: ${count} files`);
  }
}

if (require.main === module) {
  fixContractIdTypes()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { fixContractIdTypes };
