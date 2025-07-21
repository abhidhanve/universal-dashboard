import { Request, Response } from 'express';
import { authDb } from '../auth/database';
import externalDatabaseService from '../services/externalDatabaseService';

export class SharedLinkController {
  /**
   * Create a shared link for a project
   * POST /api/projects/:id/share
   */
  static async createSharedLink(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { expiresAt, canInsert, canView, canDelete, canModifySchema } = req.body;
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
          message: 'You can only create shared links for your own projects'
        });
      }

      const sharedLink = await authDb.createSharedLink(id, {
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        canInsert: canInsert ?? true,
        canView: canView ?? true,
        canDelete: canDelete ?? false,
        canModifySchema: canModifySchema ?? false
      });

      res.status(201).json({
        success: true,
        data: sharedLink,
        message: 'Shared link created successfully'
      });
    } catch (error) {
      console.error('Create shared link error:', error);
      res.status(500).json({
        error: 'Shared link creation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all shared links for a project
   * GET /api/projects/:id/links
   */
  static async getSharedLinks(req: Request, res: Response) {
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
          message: 'You can only access shared links for your own projects'
        });
      }

      const sharedLinks = await authDb.getSharedLinksByProject(id);

      res.status(200).json({
        success: true,
        data: sharedLinks,
        count: sharedLinks.length
      });
    } catch (error) {
      console.error('Get shared links error:', error);
      res.status(500).json({
        error: 'Failed to retrieve shared links',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Disable/enable a shared link
   * PUT /api/shared-links/:token
   */
  static async updateSharedLink(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { isActive } = req.body;
      const developerId = req.developer?.id;

      if (!developerId) {
        return res.status(401).json({ error: 'Developer authentication required' });
      }

      const sharedLink = await authDb.getSharedLinkByToken(token);

      if (!sharedLink) {
        return res.status(404).json({
          error: 'Shared link not found',
          message: 'No shared link found with the specified token'
        });
      }

      // Verify ownership through project
      const project = await authDb.getProjectById(sharedLink.projectId);
      if (!project || project.developerId !== developerId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update shared links for your own projects'
        });
      }

      const updatedLink = await authDb.updateSharedLink(sharedLink.id, {
        isActive: isActive ?? sharedLink.isActive
      });

      res.status(200).json({
        success: true,
        data: updatedLink,
        message: 'Shared link updated successfully'
      });
    } catch (error) {
      console.error('Update shared link error:', error);
      res.status(500).json({
        error: 'Shared link update failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ===== CLIENT ACCESS METHODS (NO AUTH REQUIRED) =====

  /**
   * Get project information for clients using shared link
   * GET /shared/:token
   */
  static async getSharedProject(req: Request, res: Response) {
    try {
      const { token } = req.params;

      const sharedLink = await authDb.getSharedLinkByToken(token);

      if (!sharedLink) {
        return res.status(404).json({
          error: 'Invalid or expired link',
          message: 'The shared link is invalid or has expired'
        });
      }

      const project = await authDb.getProjectById(sharedLink.projectId);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'The project associated with this link no longer exists'
        });
      }

      // Return safe project information for clients
      const clientProjectInfo = {
        projectName: project.name,
        description: project.description,
        databaseName: project.databaseName,
        collectionName: project.collectionName,
        schema: project.schemaData || {},
        permissions: {
          canInsert: sharedLink.permissions.canInsert,
          canView: sharedLink.permissions.canView,
          canDelete: sharedLink.permissions.canDelete,
          canModifySchema: sharedLink.permissions.canModifySchema
        }
      };

      res.status(200).json({
        success: true,
        data: clientProjectInfo
      });
    } catch (error) {
      console.error('Get shared project error:', error);
      res.status(500).json({
        error: 'Failed to load project',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Client data insertion through shared link
   * POST /shared/:token/data
   */
  static async insertData(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { data } = req.body;

      const sharedLink = await authDb.getSharedLinkByToken(token);

      if (!sharedLink || !sharedLink.permissions.canInsert) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'This link does not allow data insertion'
        });
      }

      const project = await authDb.getProjectById(sharedLink.projectId);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'The project associated with this link no longer exists'
        });
      }

      // Insert data using external database service
      const result = await externalDatabaseService.insertData({
        mongoUri: project.mongoUri,
        databaseName: project.databaseName,
        collectionName: project.collectionName,
        data
      });

      // Track the client entry
      if (result.document_id) {
        await authDb.trackClientEntry(
          project.id,
          sharedLink.id,
          result.document_id,
          data
        );
      }

      res.status(201).json({
        success: true,
        data: result,
        message: 'Data inserted successfully'
      });
    } catch (error) {
      console.error('Client data insertion error:', error);
      res.status(500).json({
        error: 'Data insertion failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Client data retrieval through shared link
   * GET /shared/:token/data
   */
  static async getData(req: Request, res: Response) {
    try {
      const { token } = req.params;

      const sharedLink = await authDb.getSharedLinkByToken(token);

      if (!sharedLink || !sharedLink.permissions.canView) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'This link does not allow data viewing'
        });
      }

      const project = await authDb.getProjectById(sharedLink.projectId);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'The project associated with this link no longer exists'
        });
      }

      // Retrieve data using external database service
      const result = await externalDatabaseService.retrieveData({
        mongoUri: project.mongoUri,
        databaseName: project.databaseName,
        collectionName: project.collectionName
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Client data retrieval error:', error);
      res.status(500).json({
        error: 'Data retrieval failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Client data deletion through shared link
   * DELETE /shared/:token/data/:documentId
   */
  static async deleteData(req: Request, res: Response) {
    try {
      const { token, documentId } = req.params;

      const sharedLink = await authDb.getSharedLinkByToken(token);

      if (!sharedLink || !sharedLink.permissions.canDelete) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'This link does not allow data deletion'
        });
      }

      const project = await authDb.getProjectById(sharedLink.projectId);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'The project associated with this link no longer exists'
        });
      }

      // Delete data using external database service
      const result = await externalDatabaseService.deleteData({
        mongoUri: project.mongoUri,
        databaseName: project.databaseName,
        collectionName: project.collectionName,
        documentId
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Data deleted successfully'
      });
    } catch (error) {
      console.error('Client data deletion error:', error);
      res.status(500).json({
        error: 'Data deletion failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
