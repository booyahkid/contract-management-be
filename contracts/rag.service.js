const axios = require('axios');

// RAG Service Configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
const RAG_TIMEOUT = 15000; // 15 seconds for bulk operations

class RAGService {
  /**
   * Add contract to RAG system using enhanced CRUD endpoint
   * @param {Object} contractData - Contract data from database
   * @returns {Promise<Object|null>} - RAG response or null if failed
   */
  static async addToRAG(contractData) {
    try {
      console.log(`📊 Adding contract ${contractData.contract_number} to RAG system...`);
      
      // Use enhanced CRUD endpoint
      const response = await axios.post(`${AI_SERVICE_URL}/api/chroma/contracts`, contractData, {
        timeout: RAG_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Contract ${contractData.contract_number} successfully added to RAG system`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Failed to add contract ${contractData.contract_number} to RAG system:`, error.message);
      
      // Fallback to legacy endpoint if enhanced endpoint fails
      return await this.addToRAGLegacy(contractData);
    }
  }

  /**
   * Legacy add method (fallback)
   * @param {Object} contractData - Contract data from database
   * @returns {Promise<Object|null>} - RAG response or null if failed
   */
  static async addToRAGLegacy(contractData) {
    try {
      console.log(`🔄 Using legacy endpoint for contract ${contractData.contract_number}...`);
      
      const ragData = {
        text: this.formatContractText(contractData),
        metadata: this.formatContractMetadata(contractData)
      };

      const response = await axios.post(`${AI_SERVICE_URL}/api/chroma/ingest-chroma`, ragData, {
        timeout: RAG_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Contract ${contractData.contract_number} added via legacy endpoint`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Legacy endpoint also failed for ${contractData.contract_number}:`, error.message);
      return null;
    }
  }

  /**
   * Update contract in RAG system using enhanced CRUD endpoint
   * @param {Object} contractData - Updated contract data
   * @returns {Promise<Object|null>} - RAG response or null if failed
   */
  static async updateRAG(contractData) {
    try {
      console.log(`🔄 Updating contract ${contractData.contract_number} in RAG system...`);
      
      // Use enhanced UPDATE endpoint
      const response = await axios.put(`${AI_SERVICE_URL}/api/chroma/contracts/${contractData.id}`, contractData, {
        timeout: RAG_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        console.log(`✅ Contract ${contractData.contract_number} updated in RAG system`);
        return response.data;
      } else {
        // Fallback to add if update fails
        return await this.addToRAG(contractData);
      }
      
    } catch (error) {
      console.error(`❌ Failed to update contract ${contractData.contract_number} in RAG system:`, error.message);
      
      // Fallback to add operation
      console.log(`🔄 Falling back to add operation for ${contractData.contract_number}...`);
      return await this.addToRAG(contractData);
    }
  }

  /**
   * Remove contract from RAG system using enhanced CRUD endpoint
   * @param {number} contractId - Contract ID to remove
   * @param {string} contractNumber - Contract number for logging
   * @returns {Promise<Object|null>} - RAG response or null if failed
   */
  static async deleteFromRAG(contractId, contractNumber = 'unknown') {
    try {
      console.log(`🗑️ Removing contract ${contractNumber} (ID: ${contractId}) from RAG system...`);
      
      // Use enhanced DELETE endpoint
      const response = await axios.delete(`${AI_SERVICE_URL}/api/chroma/contracts/${contractId}`, {
        timeout: 10000
      });
      
      if (response.data.success) {
        console.log(`✅ Contract ${contractNumber} removed from RAG system`);
        return response.data;
      } else {
        console.log(`⚠️ Contract ${contractNumber} was not found in RAG system`);
        return { success: true, message: 'Contract not found in RAG (already removed)' };
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`ℹ️ Contract ${contractNumber} was not found in RAG system (already removed)`);
        return { success: true, message: 'Contract not found in RAG (already removed)' };
      }
      
      console.error(`❌ Failed to remove contract ${contractNumber} from RAG system:`, error.message);
      return null;
    }
  }

  /**
   * Bulk sync all contracts to RAG system using enhanced endpoint
   * @param {Array} contracts - Array of contract data
   * @param {boolean} forceUpdate - Force update existing contracts
   * @returns {Promise<Object>} - Sync results
   */
  static async bulkSyncToRAG(contracts, forceUpdate = false) {
    console.log(`🔄 Starting enhanced bulk sync of ${contracts.length} contracts to RAG...`);
    
    try {
      // Use enhanced bulk sync endpoint
      const response = await axios.post(`${AI_SERVICE_URL}/api/chroma/contracts/bulk-sync`, {
        contracts: contracts,
        force_update: forceUpdate
      }, {
        timeout: 60000, // 60 seconds for large bulk operations
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const results = response.data;
      console.log(`🎉 Enhanced bulk sync completed: ${results.successful} synced, ${results.failed} failed, ${results.skipped} skipped`);
      
      return {
        success: true,
        total: results.total_contracts,
        synced: results.successful,
        failed: results.failed,
        skipped: results.skipped,
        details: results.details,
        final_document_count: results.final_document_count,
        operation: 'enhanced_bulk_sync'
      };
      
    } catch (error) {
      console.error(`❌ Enhanced bulk sync failed, falling back to individual operations:`, error.message);
      
      // Fallback to individual operations
      return await this.bulkSyncToRAGFallback(contracts);
    }
  }

  /**
   * Fallback bulk sync using individual operations
   * @param {Array} contracts - Array of contract data
   * @returns {Promise<Object>} - Sync results
   */
  static async bulkSyncToRAGFallback(contracts) {
    console.log(`🔄 Starting fallback bulk sync of ${contracts.length} contracts...`);
    
    let synced = 0;
    let failed = 0;
    const results = [];
    
    for (const contract of contracts) {
      try {
        const result = await this.addToRAG(contract);
        if (result && result.success) {
          synced++;
          results.push({ contract_number: contract.contract_number, status: 'success' });
        } else {
          failed++;
          results.push({ contract_number: contract.contract_number, status: 'failed', reason: 'No response' });
        }
        
        // Small delay to prevent overwhelming the AI service
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failed++;
        results.push({ 
          contract_number: contract.contract_number, 
          status: 'failed', 
          reason: error.message 
        });
      }
    }
    
    console.log(`🎉 Fallback bulk sync completed: ${synced} synced, ${failed} failed`);
    
    return {
      success: true,
      total: contracts.length,
      synced,
      failed,
      skipped: 0,
      results,
      operation: 'fallback_bulk_sync'
    };
  }

  /**
   * Get contract from RAG system
   * @param {number} contractId - Contract ID to retrieve
   * @returns {Promise<Object|null>} - Contract data or null if not found
   */
  static async getFromRAG(contractId) {
    try {
      console.log(`🔍 Getting contract ${contractId} from RAG system...`);
      
      const response = await axios.get(`${AI_SERVICE_URL}/api/chroma/contracts/${contractId}`, {
        timeout: 5000
      });
      
      if (response.data.success) {
        console.log(`✅ Contract ${contractId} found in RAG system`);
        return response.data;
      } else {
        console.log(`ℹ️ Contract ${contractId} not found in RAG system`);
        return null;
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`ℹ️ Contract ${contractId} not found in RAG system`);
        return null;
      }
      
      console.error(`❌ Failed to get contract ${contractId} from RAG system:`, error.message);
      return null;
    }
  }

  /**
   * Get synchronization status
   * @returns {Promise<Object|null>} - Sync status or null if failed
   */
  static async getSyncStatus() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/api/chroma/sync/status`, {
        timeout: 10000
      });
      
      return response.data;
      
    } catch (error) {
      console.error('Failed to get sync status:', error.message);
      return null;
    }
  }

  /**
   * Verify sync integrity
   * @returns {Promise<Object|null>} - Integrity report or null if failed
   */
  static async verifySyncIntegrity() {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/chroma/sync/verify`, {}, {
        timeout: 15000
      });
      
      return response.data;
      
    } catch (error) {
      console.error('Failed to verify sync integrity:', error.message);
      return null;
    }
  }

  /**
   * Format contract data as text for RAG (kept for legacy compatibility)
   * @param {Object} contractData - Contract data
   * @returns {string} - Formatted text
   */
  static formatContractText(contractData) {
    const totalValue = (contractData.ats_amount || 0) + (contractData.jsl_amount || 0) + (contractData.subscription_amount || 0);
    
    return `Contract: ${contractData.contract_name}

Contract Number: ${contractData.contract_number}
Contract Type: ${contractData.contract_type}
Vendor: ${contractData.vendor || 'N/A'}
Category: ${contractData.category || 'N/A'}
Sub Category: ${contractData.sub_category || 'N/A'}
Item: ${contractData.item || 'N/A'}
Department: ${contractData.department || 'N/A'}

Contract Details:
- Start Date: ${contractData.start_date || 'N/A'}
- End Date: ${contractData.end_date || 'N/A'}
- Contract Date: ${contractData.contract_date || 'N/A'}
- ATS Amount: Rp ${contractData.ats_amount || 0}
- JSL Amount: Rp ${contractData.jsl_amount || 0}
- Subscription Amount: Rp ${contractData.subscription_amount || 0}
- Total Value: Rp ${totalValue}

Person in Charge:
- User: ${contractData.pic_user_name || 'N/A'}
- IPM: ${contractData.pic_ipm_name || 'N/A'}

Notes: ${contractData.notes || 'No additional notes'}`;
  }

  /**
   * Format contract metadata for RAG (kept for legacy compatibility)
   * @param {Object} contractData - Contract data
   * @returns {Object} - Formatted metadata
   */
  static formatContractMetadata(contractData) {
    const totalValue = (contractData.ats_amount || 0) + (contractData.jsl_amount || 0) + (contractData.subscription_amount || 0);
    
    return {
      contract_id: contractData.id,
      contract_number: contractData.contract_number,
      contract_type: contractData.contract_type,
      vendor: contractData.vendor,
      category: contractData.category,
      sub_category: contractData.sub_category,
      department: contractData.department,
      start_date: contractData.start_date,
      end_date: contractData.end_date,
      contract_date: contractData.contract_date,
      total_value: totalValue,
      source: "contract_management",
      ingestion_date: new Date().toISOString(),
      created_at: contractData.created_at,
      updated_at: contractData.updated_at
    };
  }

  /**
   * Test RAG service connection with enhanced endpoints
   * @returns {Promise<boolean>} - True if connected
   */
  static async testConnection() {
    try {
      // Test main health endpoint
      const healthResponse = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000
      });
      
      if (healthResponse.status !== 200) {
        return false;
      }

      // Test enhanced ChromaDB health endpoint
      const chromaResponse = await axios.get(`${AI_SERVICE_URL}/api/chroma/sync/status`, {
        timeout: 5000
      });
      
      return chromaResponse.status === 200 && chromaResponse.data?.sync_status === 'healthy';
      
    } catch (error) {
      console.error('RAG service connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = RAGService;
