import { Request, Response } from 'express';
import { authDb } from '../auth/database';
import externalDatabaseService from '../services/externalDatabaseService';

export class ProjectController {
  /**
   * Create a new project
   * POST /api/projects
   */
  static async createProject(req: Request, res: Response) {
    try {
      const { name, description, mongoUri, databaseName, collectionName } = req.body;
      const developerId = req.developer?.id;

      if (!developerId) {
        return res.status(401).json({ error: 'Developer authentication required' });
      }

      // Validate required fields
      if (!name || !mongoUri || !databaseName || !collectionName) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['name', 'mongoUri', 'databaseName', 'collectionName']
        });
      }

      // Test connection before creating project (skip for now in development)
      // const isConnected = await externalDatabaseService.testConnection(mongoUri, databaseName);
      // if (!isConnected) {
      //   return res.status(400).json({
      //     error: 'Database connection failed',
      //     message: 'Unable to connect to the provided MongoDB URI and database'
      //   });
      // }

      // Analyze schema
      let schemaData = null;
      try {
        const schemaResult = await externalDatabaseService.analyzeSchema({
          mongoUri,
          databaseName,
          collectionName
        });
        schemaData = schemaResult.schema; // Extract schema from Go service response
      } catch (error) {
        console.warn('Schema analysis failed during project creation:', error);
        // Continue without schema data
      }

      // Create project
      const project = await authDb.createProject(developerId, {
        name,
        description,
        mongoUri,
        databaseName,
        collectionName,
        schemaData
      });

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully'
      });
    } catch (error) {
      console.error('Project creation error:', error);
      res.status(500).json({
        error: 'Project creation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all projects for the authenticated developer
   * GET /api/projects
   */
  static async getProjects(req: Request, res: Response) {
    try {
      const developerId = req.developer?.id;

      if (!developerId) {
        return res.status(401).json({ error: 'Developer authentication required' });
      }

      const projects = await authDb.getProjectsByDeveloper(developerId);

      res.status(200).json({
        success: true,
        data: projects,
        count: projects.length
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({
        error: 'Failed to retrieve projects',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get a specific project by ID
   * GET /api/projects/:id
   */
  static async getProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const developerId = req.developer?.id;

      if (!developerId) {
        return res.status(401).json({ error: 'Developer authentication required' });
      }

      const project = await authDb.getProjectById(id);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'No project found with the specified ID'
        });
      }

      // Verify ownership
      if (project.developerId !== developerId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own projects'
        });
      }

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        error: 'Failed to retrieve project',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update a project's schema by re-analyzing
   * POST /api/projects/:id/refresh-schema
   */
  static async refreshSchema(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const developerId = req.developer?.id;

      if (!developerId) {
        return res.status(401).json({ error: 'Developer authentication required' });
      }

      const project = await authDb.getProjectById(id);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'No project found with the specified ID'
        });
      }

      // Verify ownership
      if (project.developerId !== developerId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own projects'
        });
      }

      console.log('🔄 Schema refresh started:', {
        projectId: id,
        currentSchema: Object.keys(project.schemaData || {}),
        mongoUri: project.mongoUri ? 'Present' : 'Missing',
        databaseName: project.databaseName,
        collectionName: project.collectionName,
        timestamp: new Date().toISOString()
      });

      // Re-analyze schema from MongoDB
      console.log('📞 Calling Go service for schema analysis...');
      const schemaResult = await externalDatabaseService.analyzeSchema({
        mongoUri: project.mongoUri,
        databaseName: project.databaseName,
        collectionName: project.collectionName
      });
      console.log('✅ Go service responded successfully');

      // Extract schema data from Go service response
      const freshSchemaData = schemaResult.schema;

      // Get current schema to preserve manually added fields
      const currentSchema = project.schemaData || {};
      
      // Merge schemas: keep manually added fields + update existing fields with fresh data
      const mergedSchema = { ...currentSchema };

      // Update existing fields with fresh analysis data (but keep manually added ones)
      for (const [fieldName, fieldData] of Object.entries(freshSchemaData)) {
        // If the field exists in fresh schema, update it
        // But preserve any manual modifications if they exist
        if (currentSchema[fieldName]) {
          // Field exists in both - merge the data
          mergedSchema[fieldName] = {
            ...fieldData, // Fresh analysis data
            ...currentSchema[fieldName], // Keep any manual overrides
            // Always update the type from fresh analysis as it's more reliable
            type: (fieldData as any)?.type || (currentSchema[fieldName] as any)?.type
          };
        } else {
          // New field from database analysis
          mergedSchema[fieldName] = fieldData;
        }
      }

      console.log('🔗 Schema merge completed:', {
        projectId: id,
        freshFields: Object.keys(freshSchemaData),
        currentFields: Object.keys(currentSchema),
        mergedFields: Object.keys(mergedSchema),
        preservedManualFields: Object.keys(currentSchema).filter(field => !(field in freshSchemaData)),
        timestamp: new Date().toISOString()
      });

      // Update project with merged schema (preserves manual additions)
      const updatedProject = await authDb.updateProject(id, {
        schemaData: mergedSchema
      });

      res.status(200).json({
        success: true,
        data: updatedProject,
        message: `Schema refreshed successfully. Preserved ${Object.keys(currentSchema).filter(field => !(field in freshSchemaData)).length} manually added fields.`
      });
    } catch (error) {
      console.error('❌ Schema refresh error details:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.params.id,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        error: 'Schema refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete a project
   * DELETE /api/projects/:id
   */
  static async deleteProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const developerId = req.developer?.id;

      if (!developerId) {
        return res.status(401).json({ error: 'Developer authentication required' });
      }

      const project = await authDb.getProjectById(id);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'No project found with the specified ID'
        });
      }

      // Verify ownership
      if (project.developerId !== developerId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own projects'
        });
      }

      const deleted = await authDb.deleteProject(id);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Project deleted successfully'
        });
      } else {
        res.status(500).json({
          error: 'Delete failed',
          message: 'Failed to delete project'
        });
      }
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        error: 'Project deletion failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
