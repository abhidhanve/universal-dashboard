import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required for authentication');
}

const sql = neon(DATABASE_URL);

export interface Developer {
  id: string;
  name: string;
  email: string;
  password: string;
  company?: string;
  verified: boolean;
  tier: 'free' | 'premium' | 'enterprise';
  createdAt: string;
  lastLoginAt?: string;
}

export interface Client {
  id: string;
  developerId: string;
  name: string;
  description?: string;
  apiKey: string;
  permissions: string[]; // ['read', 'write', 'delete', 'admin']
  active: boolean;
  rateLimitTier: 'free' | 'premium' | 'enterprise';
  createdAt: string;
  lastUsedAt?: string;
  requestCount: number;
}

export interface ApiUsage {
  id: string;
  clientId: string;
  endpoint: string;
  method: string;
  timestamp: string;
  responseStatus: number;
  responseTime: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface Developer {
  id: string;
  name: string;
  email: string;
  password: string;
  company?: string;
  verified: boolean;
  tier: 'free' | 'premium' | 'enterprise';
  createdAt: string;
  lastLoginAt?: string;
}

export interface Client {
  id: string;
  developerId: string;
  name: string;
  description?: string;
  apiKey: string;
  permissions: string[]; // ['read', 'write', 'delete', 'admin']
  active: boolean;
  rateLimitTier: 'free' | 'premium' | 'enterprise';
  createdAt: string;
  lastUsedAt?: string;
  requestCount: number;
}

export interface ApiUsage {
  id: string;
  clientId: string;
  endpoint: string;
  method: string;
  timestamp: string;
  responseStatus: number;
  responseTime: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface Project {
  id: string;
  developerId: string;
  name: string;
  description?: string;
  mongoUri: string;
  databaseName: string;
  collectionName: string;
  schemaData?: any; // JSON schema data
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SharedLink {
  id: string;
  projectId: string;
  token: string;
  expiresAt?: string;
  isActive: boolean;
  permissions: {
    canInsert: boolean;
    canView: boolean;
    canDelete: boolean;
    canModifySchema: boolean;
  };
  customSchema?: any;
  createdAt: string;
}

export interface ClientEntry {
  id: string;
  projectId: string;
  sharedLinkId: string;
  documentId: string;
  data: any; // JSON data that was inserted
  createdAt: string;
}

class AuthDatabase {
  constructor() {
    this.initializeTables();
  }

  private async initializeTables() {
    try {
      // Create developers table
      await sql`
        CREATE TABLE IF NOT EXISTS developers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          company TEXT,
          verified BOOLEAN DEFAULT FALSE,
          tier TEXT DEFAULT 'free',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          last_login_at TIMESTAMPTZ
        )
      `;

      // Create clients table
      await sql`
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          developer_id TEXT NOT NULL REFERENCES developers(id),
          name TEXT NOT NULL,
          description TEXT,
          api_key TEXT UNIQUE NOT NULL,
          permissions JSONB NOT NULL,
          active BOOLEAN DEFAULT TRUE,
          rate_limit_tier TEXT DEFAULT 'free',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          last_used_at TIMESTAMPTZ,
          request_count INTEGER DEFAULT 0
        )
      `;

      // Create API usage table
      await sql`
        CREATE TABLE IF NOT EXISTS api_usage (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL REFERENCES clients(id),
          endpoint TEXT NOT NULL,
          method TEXT NOT NULL,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          response_status INTEGER,
          response_time INTEGER,
          ip_address TEXT,
          user_agent TEXT
        )
      `;

      // Create projects table for external database connections
      await sql`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          developer_id TEXT NOT NULL REFERENCES developers(id),
          name TEXT NOT NULL,
          description TEXT,
          mongo_uri TEXT NOT NULL,
          database_name TEXT NOT NULL,
          collection_name TEXT NOT NULL,
          schema_data JSONB,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      // Create shared_links table for client access
      await sql`
        CREATE TABLE IF NOT EXISTS shared_links (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL REFERENCES projects(id),
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMPTZ,
          is_active BOOLEAN DEFAULT TRUE,
          can_insert BOOLEAN DEFAULT TRUE,
          can_view BOOLEAN DEFAULT TRUE,
          can_delete BOOLEAN DEFAULT FALSE,
          can_modify_schema BOOLEAN DEFAULT FALSE,
          custom_schema JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      // Create client_entries table to track what clients insert
      await sql`
        CREATE TABLE IF NOT EXISTS client_entries (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL REFERENCES projects(id),
          shared_link_id TEXT NOT NULL REFERENCES shared_links(id),
          document_id TEXT NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      // Create indexes for performance
      await sql`CREATE INDEX IF NOT EXISTS idx_clients_developer_id ON clients(developer_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_clients_api_key ON clients(api_key)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_usage_client_id ON api_usage(client_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON api_usage(timestamp)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON projects(developer_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_shared_links_project_id ON shared_links(project_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_shared_links_token ON shared_links(token)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_client_entries_project_id ON client_entries(project_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_client_entries_link_id ON client_entries(shared_link_id)`;

      console.log('✅ Authentication database tables initialized');
    } catch (error) {
      console.error('❌ Failed to initialize auth database:', error);
      throw error;
    }
  }

  // Developer operations
  async createDeveloper(data: Omit<Developer, 'id' | 'createdAt' | 'verified'>): Promise<Developer> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const [developer] = await sql`
      INSERT INTO developers (id, name, email, password, company, tier)
      VALUES (${id}, ${data.name}, ${data.email}, ${hashedPassword}, ${data.company || null}, ${data.tier})
      RETURNING *
    `;
    
    return this.mapDeveloperRow(developer);
  }

  async getDeveloperById(id: string): Promise<Developer | null> {
    const [row] = await sql`
      SELECT * FROM developers WHERE id = ${id}
    `;
    
    return row ? this.mapDeveloperRow(row) : null;
  }

  async getDeveloperByEmail(email: string): Promise<Developer | null> {
    const [row] = await sql`
      SELECT * FROM developers WHERE email = ${email}
    `;
    
    return row ? this.mapDeveloperRow(row) : null;
  }

  async updateDeveloperLogin(id: string): Promise<void> {
    await sql`
      UPDATE developers 
      SET last_login_at = NOW() 
      WHERE id = ${id}
    `;
  }

  async verifyDeveloper(id: string): Promise<void> {
    await sql`
      UPDATE developers 
      SET verified = TRUE 
      WHERE id = ${id}
    `;
  }

  async updateDeveloper(id: string, updateData: { name?: string }): Promise<Developer | null> {
    const { name } = updateData;
    
    if (!name) {
      throw new Error('No update data provided');
    }

    const [result] = await sql`
      UPDATE developers 
      SET name = ${name}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!result) {
      return null;
    }

    return this.mapDeveloperRow(result);
  }

  private mapDeveloperRow(row: any): Developer {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      company: row.company,
      verified: Boolean(row.verified),
      tier: row.tier,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at
    };
  }

  // Client operations
  async createClient(data: Omit<Client, 'id' | 'createdAt' | 'requestCount' | 'apiKey'>): Promise<Client> {
    const id = uuidv4();
    const apiKey = this.generateApiKey();
    
    const [client] = await sql`
      INSERT INTO clients (id, developer_id, name, description, api_key, permissions, active, rate_limit_tier)
      VALUES (
        ${id}, 
        ${data.developerId}, 
        ${data.name}, 
        ${data.description || null}, 
        ${apiKey}, 
        ${JSON.stringify(data.permissions)}, 
        ${data.active}, 
        ${data.rateLimitTier}
      )
      RETURNING *
    `;
    
    return this.mapClientRow(client);
  }

  async getClientById(id: string): Promise<Client | null> {
    const [row] = await sql`
      SELECT * FROM clients WHERE id = ${id}
    `;
    
    return row ? this.mapClientRow(row) : null;
  }

  async getClientByApiKey(apiKey: string): Promise<Client | null> {
    const [row] = await sql`
      SELECT * FROM clients 
      WHERE api_key = ${apiKey} AND active = TRUE
    `;
    
    return row ? this.mapClientRow(row) : null;
  }

  async getClientsByDeveloperId(developerId: string): Promise<Client[]> {
    const rows = await sql`
      SELECT * FROM clients 
      WHERE developer_id = ${developerId} 
      ORDER BY created_at DESC
    `;
    
    return rows.map(row => this.mapClientRow(row));
  }

  private mapClientRow(row: any): Client {
    return {
      id: row.id,
      developerId: row.developer_id,
      name: row.name,
      description: row.description,
      apiKey: row.api_key,
      permissions: row.permissions,
      active: Boolean(row.active),
      rateLimitTier: row.rate_limit_tier,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
      requestCount: row.request_count || 0
    };
  }

  async updateClientUsage(clientId: string): Promise<void> {
    await sql`
      UPDATE clients 
      SET last_used_at = NOW(), request_count = request_count + 1 
      WHERE id = ${clientId}
    `;
  }

  async regenerateApiKey(clientId: string): Promise<string> {
    const newApiKey = this.generateApiKey();
    await sql`
      UPDATE clients 
      SET api_key = ${newApiKey} 
      WHERE id = ${clientId}
    `;
    return newApiKey;
  }

  async deactivateClient(clientId: string): Promise<void> {
    await sql`
      UPDATE clients 
      SET active = FALSE 
      WHERE id = ${clientId}
    `;
  }

  // API Usage tracking
  async logApiUsage(data: Omit<ApiUsage, 'id' | 'timestamp'>): Promise<void> {
    const id = uuidv4();
    await sql`
      INSERT INTO api_usage (id, client_id, endpoint, method, response_status, response_time, ip_address, user_agent)
      VALUES (
        ${id}, 
        ${data.clientId}, 
        ${data.endpoint}, 
        ${data.method}, 
        ${data.responseStatus}, 
        ${data.responseTime}, 
        ${data.ipAddress || null}, 
        ${data.userAgent || null}
      )
    `;
  }

  async getUsageStats(clientId: string, timeframe: 'hour' | 'day' | 'week' | 'month'): Promise<any> {
    // Simplified approach - just return basic client request count for now
    try {
      const clientResult = await sql`
        SELECT request_count FROM clients WHERE id = ${clientId}
      `;
      
      const requestCount = clientResult[0]?.request_count || 0;
      
      return { 
        total_requests: requestCount, 
        avg_response_time: 0, 
        error_count: 0 
      };
    } catch (error) {
      // Return default stats if query fails
      return { total_requests: 0, avg_response_time: 0, error_count: 0 };
    }
  }

  private generateApiKey(): string {
    const prefix = process.env.API_KEY_PREFIX || 'up_test_';
    const length = parseInt(process.env.API_KEY_LENGTH || '32');
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    let result = prefix;
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // ===== PROJECT MANAGEMENT METHODS =====

  async createProject(developerId: string, projectData: {
    name: string;
    description?: string;
    mongoUri: string;
    databaseName: string;
    collectionName: string;
    schemaData?: any;
  }): Promise<Project> {
    const projectId = uuidv4();
    
    const result = await sql`
      INSERT INTO projects (
        id, developer_id, name, description, mongo_uri, 
        database_name, collection_name, schema_data, is_active
      ) VALUES (
        ${projectId}, ${developerId}, ${projectData.name}, ${projectData.description}, 
        ${projectData.mongoUri}, ${projectData.databaseName}, ${projectData.collectionName},
        ${JSON.stringify(projectData.schemaData)}, true
      ) RETURNING *
    `;

    return this.mapProjectRow(result[0]);
  }

  async getProjectsByDeveloper(developerId: string): Promise<Project[]> {
    const result = await sql`
      SELECT * FROM projects 
      WHERE developer_id = ${developerId} AND is_active = true
      ORDER BY created_at DESC
    `;

    return result.map(row => this.mapProjectRow(row));
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    const result = await sql`
      SELECT * FROM projects 
      WHERE id = ${projectId} AND is_active = true
    `;

    return result.length > 0 ? this.mapProjectRow(result[0]) : null;
  }

  async updateProject(projectId: string, updates: Partial<{
    name: string;
    description: string;
    mongoUri: string;
    databaseName: string;
    collectionName: string;
    schemaData: any;
  }>): Promise<Project | null> {
    // For simplicity, let's handle common update cases
    if (updates.schemaData !== undefined) {
      await sql`
        UPDATE projects 
        SET schema_data = ${JSON.stringify(updates.schemaData)}, updated_at = NOW()
        WHERE id = ${projectId} AND is_active = true
      `;
    }

    if (updates.name !== undefined) {
      await sql`
        UPDATE projects 
        SET name = ${updates.name}, updated_at = NOW()
        WHERE id = ${projectId} AND is_active = true
      `;
    }

    return this.getProjectById(projectId);
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const result = await sql`
      UPDATE projects SET is_active = false, updated_at = NOW() 
      WHERE id = ${projectId} AND is_active = true
      RETURNING id
    `;

    return result.length > 0;
  }

  // ===== SHARED LINK MANAGEMENT METHODS =====

  async createSharedLink(projectId: string, linkData: {
    expiresAt?: Date;
    canInsert?: boolean;
    canView?: boolean;
    canDelete?: boolean;
    canModifySchema?: boolean;
    customSchema?: any;
  }): Promise<SharedLink> {
    const linkId = uuidv4();
    const token = this.generateShareToken();
    
    const result = await sql`
      INSERT INTO shared_links (
        id, project_id, token, expires_at, is_active,
        can_insert, can_view, can_delete, can_modify_schema, custom_schema
      ) VALUES (
        ${linkId}, ${projectId}, ${token}, ${linkData.expiresAt || null}, true,
        ${linkData.canInsert ?? true}, ${linkData.canView ?? true}, ${linkData.canDelete ?? false},
        ${linkData.canModifySchema ?? false}, ${JSON.stringify(linkData.customSchema) || null}
      ) RETURNING *
    `;

    return this.mapSharedLinkRow(result[0]);
  }

  async getSharedLinkByToken(token: string): Promise<SharedLink | null> {
    const result = await sql`
      SELECT * FROM shared_links 
      WHERE token = ${token} AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    `;

    return result.length > 0 ? this.mapSharedLinkRow(result[0]) : null;
  }

  async getSharedLinksByProject(projectId: string): Promise<SharedLink[]> {
    const result = await sql`
      SELECT * FROM shared_links 
      WHERE project_id = ${projectId} AND is_active = true
      ORDER BY created_at DESC
    `;

    return result.map(row => this.mapSharedLinkRow(row));
  }

  async updateSharedLink(linkId: string, updates: Partial<{
    expiresAt: Date;
    canInsert: boolean;
    canView: boolean;
    canDelete: boolean;
    isActive: boolean;
  }>): Promise<SharedLink | null> {
    // Handle specific update cases
    if (updates.isActive !== undefined) {
      await sql`
        UPDATE shared_links 
        SET is_active = ${updates.isActive}
        WHERE id = ${linkId}
      `;
    }

    if (updates.expiresAt !== undefined) {
      await sql`
        UPDATE shared_links 
        SET expires_at = ${updates.expiresAt}
        WHERE id = ${linkId}
      `;
    }

    // Get the updated record
    const result = await sql`
      SELECT * FROM shared_links WHERE id = ${linkId}
    `;
    
    return result.length > 0 ? this.mapSharedLinkRow(result[0]) : null;
  }

  async deleteSharedLink(linkId: string): Promise<boolean> {
    const result = await sql`
      UPDATE shared_links SET is_active = false 
      WHERE id = ${linkId}
    `;

    return result.length > 0;
  }

  // ===== SCHEMA MODIFICATION METHODS =====

  async updateSharedLinkSchema(token: string, customSchema: any): Promise<SharedLink | null> {
    const result = await sql`
      UPDATE shared_links 
      SET custom_schema = ${JSON.stringify(customSchema)}
      WHERE token = ${token} AND is_active = true
      RETURNING *
    `;

    return result.length > 0 ? this.mapSharedLinkRow(result[0]) : null;
  }

  async getEffectiveSchema(token: string): Promise<any | null> {
    const link = await this.getSharedLinkByToken(token);
    if (!link) return null;

    // Return custom schema if available, otherwise return null (will use original schema)
    return link.customSchema || null;
  }

  // ===== CLIENT ENTRY TRACKING =====

  async trackClientEntry(projectId: string, sharedLinkId: string, documentId: string, data: any): Promise<ClientEntry> {
    const entryId = uuidv4();
    
    const result = await sql`
      INSERT INTO client_entries (
        id, project_id, shared_link_id, document_id, data
      ) VALUES (
        ${entryId}, ${projectId}, ${sharedLinkId}, ${documentId}, ${JSON.stringify(data)}
      ) RETURNING *
    `;

    return this.mapClientEntryRow(result[0]);
  }

  async getClientEntriesByProject(projectId: string): Promise<ClientEntry[]> {
    const result = await sql`
      SELECT * FROM client_entries 
      WHERE project_id = ${projectId}
      ORDER BY created_at DESC
    `;

    return result.map(row => this.mapClientEntryRow(row));
  }

  // ===== HELPER METHODS =====

  private mapProjectRow(row: any): Project {
    return {
      id: row.id,
      developerId: row.developer_id,
      name: row.name,
      description: row.description,
      mongoUri: row.mongo_uri,
      databaseName: row.database_name,
      collectionName: row.collection_name,
      schemaData: row.schema_data,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapSharedLinkRow(row: any): SharedLink {
    return {
      id: row.id,
      projectId: row.project_id,
      token: row.token,
      expiresAt: row.expires_at,
      isActive: row.is_active,
      permissions: {
        canInsert: row.can_insert,
        canView: row.can_view,
        canDelete: row.can_delete,
        canModifySchema: row.can_modify_schema
      },
      customSchema: row.custom_schema || undefined, // Neon returns JSONB as objects already
      createdAt: row.created_at
    };
  }

  private mapClientEntryRow(row: any): ClientEntry {
    return {
      id: row.id,
      projectId: row.project_id,
      sharedLinkId: row.shared_link_id,
      documentId: row.document_id,
      data: row.data,
      createdAt: row.created_at
    };
  }

  private generateShareToken(): string {
    const prefix = 'share_';
    const length = 32;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    let result = prefix;
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}

export const authDb = new AuthDatabase();
export default AuthDatabase;
