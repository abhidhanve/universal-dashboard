import axios from 'axios';

// Go Services Configuration
const DB_ACCESS_SERVICE = 'http://localhost:9081';

// Helper function to properly encode MongoDB URI
function encodeMongoUri(uri: string): string {
  // For URIs with passwords containing @, we need a different approach
  // Find the last @ which separates credentials from host
  const protocolMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)/);
  if (!protocolMatch) {
    return uri;
  }
  
  const protocol = protocolMatch[1];
  const remaining = uri.substring(protocol.length);
  
  // Find the last @ symbol (this separates credentials from host)
  const lastAtIndex = remaining.lastIndexOf('@');
  if (lastAtIndex === -1) {
    return uri; // No credentials
  }
  
  const credentials = remaining.substring(0, lastAtIndex);
  const hostAndParams = remaining.substring(lastAtIndex + 1);
  
  // Split credentials into username:password
  const colonIndex = credentials.indexOf(':');
  if (colonIndex === -1) {
    return uri; // No password
  }
  
  const username = credentials.substring(0, colonIndex);
  const password = credentials.substring(colonIndex + 1);
  
  // URL encode the password only
  const encodedPassword = encodeURIComponent(password);
  
  return `${protocol}${username}:${encodedPassword}@${hostAndParams}`;
}

// Type definitions for the service
interface SchemaAnalysisRequest {
  mongoUri: string;
  databaseName: string;
  collectionName: string;
}

interface SchemaAnalysisResponse {
  message: string;
  database: string;
  collection: string;
  schema: Record<string, SchemaField>;
  sample_count: number;
  total_fields: number;
  code: number;
}

interface SchemaField {
  type: string;
  occurrences: number;
  total_docs: number;
  frequency: number;
  all_types: Record<string, number>;
  stats: {
    is_required: boolean;
    form_type: string;
    examples?: string[];
    pattern?: string;
    min_length?: number;
    max_length?: number;
    avg_length?: number;
    min_value?: number;
    max_value?: number;
    avg_value?: number;
    unique_values?: string[];
    array_items?: string;
  };
}

interface DataInsertRequest {
  mongoUri: string;
  databaseName: string;
  collectionName: string;
  data: Record<string, any>;
}

interface DataInsertResponse {
  message: string;
  database: string;
  collection: string;
  document_id: string;
  code: number;
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
      const encodedUri = encodeMongoUri(request.mongoUri);
      console.log('📋 Schema Analysis Request:');
      console.log('  Original URI:', request.mongoUri);
      console.log('  Encoded URI: ', encodedUri);
      console.log('  Database:    ', request.databaseName);
      console.log('  Collection:  ', request.collectionName);
      
      const response = await axios.post(`${DB_ACCESS_SERVICE}/method3/schema-analysis`, {
        mongo_uri: encodedUri,
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
      console.error('📛 Schema Analysis Error Details:');
      if (axios.isAxiosError(error)) {
        console.error('  Status:', error.response?.status);
        console.error('  StatusText:', error.response?.statusText);
        console.error('  Data:', error.response?.data);
        console.error('  Headers:', error.response?.headers);
        console.error('  Request URL:', error.config?.url);
        console.error('  Request Data:', error.config?.data);
        
        // Parse MongoDB errors and provide user-friendly messages
        const errorData = error.response?.data;
        let userFriendlyMessage = 'Schema analysis failed';
        
        if (errorData?.error) {
          const errorMsg = errorData.error.toLowerCase();
          
          if (errorMsg.includes('auth error') || errorMsg.includes('authentication failed') || errorMsg.includes('bad auth')) {
            userFriendlyMessage = 'MongoDB authentication failed. Please check your username and password in the connection URL';
          } else if (errorMsg.includes('connection') || errorMsg.includes('connect')) {
            userFriendlyMessage = 'Cannot connect to MongoDB. Please verify your connection URL and network access';
          } else if (errorMsg.includes('database') && errorMsg.includes('not found')) {
            userFriendlyMessage = 'The specified database was not found. Please check the database name';
          } else if (errorMsg.includes('collection') && errorMsg.includes('not found')) {
            userFriendlyMessage = 'The specified collection was not found. Please check the collection name';
          } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
            userFriendlyMessage = 'Connection timeout. Please check your network connection and MongoDB availability';
          } else {
            userFriendlyMessage = errorData.error || 'MongoDB connection error occurred';
          }
        }
        
        throw new Error(userFriendlyMessage);
      }
      console.error('  Non-Axios Error:', error);
      throw error;
    }
  }

  /**
   * Insert data into MongoDB collection via Go service
   */
  async insertData(request: DataInsertRequest): Promise<DataInsertResponse> {
    try {
      const encodedUri = encodeMongoUri(request.mongoUri);
      const response = await axios.post(`${DB_ACCESS_SERVICE}/method3/data-insert`, {
        mongo_uri: encodedUri,
        database_name: request.databaseName,
        collection_name: request.collectionName,
        data: request.data
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout for data insertion
      });

      // Return the Go service response directly
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Parse MongoDB errors for user-friendly messages
        const errorData = error.response?.data;
        let userFriendlyMessage = 'Data insertion failed';
        
        if (errorData?.error) {
          const errorMsg = errorData.error.toLowerCase();
          
          if (errorMsg.includes('auth error') || errorMsg.includes('authentication failed') || errorMsg.includes('bad auth')) {
            userFriendlyMessage = 'MongoDB authentication failed. Please check your credentials';
          } else if (errorMsg.includes('connection') || errorMsg.includes('connect')) {
            userFriendlyMessage = 'Cannot connect to MongoDB. Please verify your connection';
          } else if (errorMsg.includes('validation') || errorMsg.includes('invalid')) {
            userFriendlyMessage = 'Data validation failed. Please check your input data format';
          } else if (errorMsg.includes('duplicate')) {
            userFriendlyMessage = 'Duplicate entry detected. This record may already exist';
          } else {
            userFriendlyMessage = errorData.error || 'Data insertion error occurred';
          }
        }
        
        throw new Error(userFriendlyMessage);
      }
      throw error;
    }
  }

  /**
   * Retrieve data from MongoDB collection via Go service
   */
  async retrieveData(request: DataRetrievalRequest): Promise<DataRetrievalResponse> {
    try {
      const encodedUri = encodeMongoUri(request.mongoUri);
      const response = await axios.post(`${DB_ACCESS_SERVICE}/method3/data-get`, {
        mongo_uri: encodedUri,
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
        // Parse MongoDB errors for user-friendly messages
        const errorData = error.response?.data;
        let userFriendlyMessage = 'Data retrieval failed';
        
        if (errorData?.error) {
          const errorMsg = errorData.error.toLowerCase();
          
          if (errorMsg.includes('auth error') || errorMsg.includes('authentication failed') || errorMsg.includes('bad auth')) {
            userFriendlyMessage = 'MongoDB authentication failed. Please check your credentials';
          } else if (errorMsg.includes('connection') || errorMsg.includes('connect')) {
            userFriendlyMessage = 'Cannot connect to MongoDB. Please verify your connection';
          } else if (errorMsg.includes('database') && errorMsg.includes('not found')) {
            userFriendlyMessage = 'Database not found. Please check the database name';
          } else if (errorMsg.includes('collection') && errorMsg.includes('not found')) {
            userFriendlyMessage = 'Collection not found. Please check the collection name';
          } else {
            userFriendlyMessage = errorData.error || 'Data retrieval error occurred';
          }
        }
        
        throw new Error(userFriendlyMessage);
      }
      throw error;
    }
  }

  /**
   * Delete data from MongoDB collection via Go service
   */
  async deleteData(request: DataDeleteRequest): Promise<DataDeleteResponse> {
    try {
      const encodedUri = encodeMongoUri(request.mongoUri);
      const response = await axios.post(`${DB_ACCESS_SERVICE}/method3/data-delete`, {
        mongo_uri: encodedUri,
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

  /**
   * Add new fields to schema
   */
  async addSchemaFields(request: {
    databaseName: string;
    collectionName: string;
    newFields: Record<string, any>;
    mongoUri?: string;
  }): Promise<any> {
    try {
      console.log('Adding schema fields:', request.newFields, 'to', request.databaseName, request.collectionName);
      
      // If mongoUri is provided, also notify the Go service for consistency
      if (request.mongoUri) {
        try {
          const response = await axios.post(`${DB_ACCESS_SERVICE}/method3/add-schema-fields`, {
            mongo_uri: request.mongoUri,
            database_name: request.databaseName,
            collection_name: request.collectionName,
            new_fields: request.newFields
          }, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout for schema modification
          });

          console.log('✅ Go service notified of schema field addition:', response.data);
          return {
            message: `Schema fields added to collection '${request.collectionName}' and registered with database service.`,
            success: true,
            goServiceResponse: response.data
          };
        } catch (goServiceError) {
          console.warn('⚠️ Go service notification failed, but continuing with local schema update:', goServiceError);
          // Continue even if Go service fails - our local schema registry is the source of truth
        }
      }
      
      return {
        message: `Schema fields added to collection '${request.collectionName}'. Fields are registered in schema registry.`,
        success: true
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Schema field addition failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Remove field from schema
   */
  async removeSchemaField(request: {
    databaseName: string;
    collectionName: string;
    fieldName: string;
    mongoUri?: string;
  }): Promise<any> {
    try {
      console.log('Removing schema field:', request.fieldName, 'from', request.databaseName, request.collectionName);
      
      // If mongoUri is provided, also notify the Go service for consistency  
      if (request.mongoUri) {
        try {
          const response = await axios.post(`${DB_ACCESS_SERVICE}/method3/remove-schema-field`, {
            mongo_uri: request.mongoUri,
            database_name: request.databaseName,
            collection_name: request.collectionName,
            field_name: request.fieldName
          }, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout for schema modification
          });

          console.log('✅ Go service notified of schema field removal:', response.data);
          return {
            message: `Field '${request.fieldName}' removed from collection '${request.collectionName}' and database service notified.`,
            success: true,
            goServiceResponse: response.data
          };
        } catch (goServiceError) {
          console.warn('⚠️ Go service notification failed, but continuing with local schema update:', goServiceError);
          // Continue even if Go service fails - our local schema registry is the source of truth
        }
      }
      
      return {
        message: `Field '${request.fieldName}' removed from collection '${request.collectionName}' schema registry.`,
        success: true
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Schema field removal failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}

export default ExternalDatabaseService.getInstance();
