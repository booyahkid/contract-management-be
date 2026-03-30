#!/usr/bin/env node

/**
 * Bulk Sync Script for Contract RAG Integration
 * Syncs all existing contracts from PostgreSQL to ChromaDB
 */

const RAGService = require('../contracts/rag.service');
const Contract = require('../contracts/contract.model');

async function main() {
  console.log('🚀 Starting bulk sync of contracts to RAG system...');
  console.log('=' .repeat(60));
  
  try {
    // Test RAG service connection first
    console.log('🔗 Testing RAG service connection...');
    const isConnected = await RAGService.testConnection();
    
    if (!isConnected) {
      console.error('❌ RAG service is not available. Please ensure AI service is running on http://127.0.0.1:8001');
      process.exit(1);
    }
    
    console.log('✅ RAG service connection successful');
    console.log('');
    
    // Get all contracts from database
    console.log('📊 Fetching contracts from database...');
    const contracts = await Contract.getAllContracts();
    console.log(`📄 Found ${contracts.length} contracts to sync`);
    console.log('');
    
    if (contracts.length === 0) {
      console.log('⚠️  No contracts found in database. Nothing to sync.');
      process.exit(0);
    }
    
    // Show contract summary
    console.log('📋 Contract Summary:');
    contracts.forEach((contract, index) => {
      console.log(`   ${index + 1}. ${contract.contract_number} - ${contract.contract_name} (${contract.vendor || 'No vendor'})`);
    });
    console.log('');
    
    // Perform bulk sync
    console.log('🔄 Starting bulk sync...');
    const startTime = Date.now();
    
    const result = await RAGService.bulkSyncToRAG(contracts);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Display results
    console.log('');
    console.log('🎉 Bulk sync completed!');
    console.log('=' .repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Total contracts: ${result.total}`);
    console.log(`   ✅ Successfully synced: ${result.synced}`);
    console.log(`   ❌ Failed: ${result.failed}`);
    console.log(`   ⏱️  Duration: ${duration} seconds`);
    console.log('');
    
    // Show failed contracts if any
    if (result.failed > 0) {
      console.log('❌ Failed contracts:');
      result.results.filter(r => r.status === 'failed').forEach(failure => {
        console.log(`   - ${failure.contract_number}: ${failure.reason}`);
      });
      console.log('');
    }
    
    // Show successful contracts
    if (result.synced > 0) {
      console.log('✅ Successfully synced contracts:');
      result.results.filter(r => r.status === 'success').forEach(success => {
        console.log(`   - ${success.contract_number}`);
      });
      console.log('');
    }
    
    console.log('🎯 RAG system is now ready for semantic search and chat queries!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test semantic search: curl "http://localhost:8001/api/chroma/search" -d \'{"query": "IT services"}\'');
    console.log('2. Try contract chat: curl "http://localhost:8001/api/ask" -d \'{"query": "What IT contracts do we have?"}\'');
    console.log('3. New contracts will automatically sync to RAG when created/updated via API');
    
  } catch (error) {
    console.error('💥 Bulk sync failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Ensure AI service is running: cd ../AI && ./venv/bin/python -m uvicorn app.main:app --port 8001');
    console.error('2. Check database connection');
    console.error('3. Verify environment variables (AI_SERVICE_URL)');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Bulk sync interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Bulk sync terminated');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { main };
