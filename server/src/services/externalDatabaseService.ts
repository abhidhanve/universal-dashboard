import axios from 'axios';

// Go Services Configuration
const DB_ACCESS_SERVICE = 'http://localhost:9081';
const MOCKDATA_SERVICE = 'http://localhost:9083';

// Type definitions for the service
interface SchemaAnalysisRequest {
  mongoUri: string;
  databaseName: string;
  collectionName: string;
}

interface SchemaAnalysisResponse {
  fields: SchemaField[];
  totalDocuments: number;
  collectionName: string;
}

interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  examples?: any[];
}

interface DataInsertRequest {
  mongoUri: string;
  databaseName: string;
  collectionName: string;
  data: Record<string, any>;
}

interface DataInsertResponse {
  success: boolean;
  documentId: string;
  message: string;
}

interface DataRetrievalRequest {
  mongoUri: string;
  databaseName: string;
  collectionName: string;
  query?: Record<string, any>;
  limit?: number;
  skip?: number;
}

interface DataRetrievalResponse {
  success: boolean;
  data: any[];
  total: number;
  message: string;
}

interface DataDeleteRequest {
  mongoUri: string;
  databaseName: string;
  collectionName: string;
  documentId: string;
}

interface DataDeleteResponse {
  success: boolean;
  deletedCount: number;
  message: string;
}

export class ExternalDatabaseService {
  private static instance: ExternalDatabaseService;

  private constructor() {}

  public static getInstance(): ExternalDatabaseService {
    if (!ExternalDatabaseService.instance) {
      ExternalDatabaseService.instance = new ExternalDatabaseService();
    }
    return ExternalDatabaseService.instance;
  }

  /**
   * Test connection to MongoDB via Go service
   */
  async testConnection(mongoUri: string, databaseName: string): Promise<boolean> {
    try {
      const response = await axios.post(`${DB_ACCESS_SERVICE}/allocate`, {
        mongo_uri: mongoUri,
        database_name: databaseName
      }, {
        timeout: 15000
      });

      return response.status === 200 && response.data.code === 0;
    } catch (error) {
      console.error('MongoDB connection test failed:', error);
      return false;
    }
  }

  /**
   * Analyze MongoDB collection schema via Go service
   */
  async analyzeSchema(request: SchemaAnalysisRequest): Promise<SchemaAnalysisResponse> {
    try {
      const response = await axios.post(`${DB_ACCESS_SERVICE}/method3/schema-analysis`, {
        mongo_uri: request.mongoUri,
        database_name: request.databaseName,
        collection_name: request.collectionName
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout for schema analysis
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Schema analysis failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Insert data into MongoDB collection via Go service
   */
  async insertData(request: DataInsertRequest): Promise<DataInsertResponse> {
    try {
      const response = await axios.post(`${DB_ACCESS_SERVICE}/method3/data-insert`, {
        mongo_uri: request.mongoUri,
        database_name: request.databaseName,
        collection_name: request.collectionName,
        data: request.data
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout for data insertion
      });

      // Map Go service response to TypeScript interface
      const result = response.data;
      return {
        success: true,
        documentId: result.document_id || result.inserted_id || 'unknown',
        message: result.message || 'Data inserted successfully'
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Data insertion failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Retrieve data from MongoDB collection via Go service
   */
  async retrieveData(request: DataRetrievalRequest): Promise<DataRetrievalResponse> {
    try {
      const response = await axios.post(`${DB_ACCESS_SERVICE}/method3/data-get`, {
        mongo_uri: request.mongoUri,
        database_name: request.databaseName,
        collection_name: request.collectionName,
        query: request.query || {},
        limit: request.limit || 100,
        skip: request.skip || 0
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 20000 // 20 second timeout for data retrieval
      });

      const result = response.data;
      return {
        success: true,
        data: result.data || [],
        total: result.total || 0,
        message: result.message || 'Data retrieved successfully'
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Data retrieval failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Delete data from MongoDB collection via Go service
   */
  async deleteData(request: DataDeleteRequest): Promise<DataDeleteResponse> {
    try {
      const response = await axios.post(`${DB_ACCESS_SERVICE}/method3/data-delete`, {
        mongo_uri: request.mongoUri,
        database_name: request.databaseName,
        collection_name: request.collectionName,
        document_id: request.documentId
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout for data deletion
      });

      const result = response.data;
      return {
        success: true,
        deletedCount: result.deleted_count || 0,
        message: result.message || 'Data deleted successfully'
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Data deletion failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}

export default ExternalDatabaseService.getInstance();
