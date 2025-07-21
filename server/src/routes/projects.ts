import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { SharedLinkController } from '../controllers/sharedLinkController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// ===========================================
// PROJECT MANAGEMENT ROUTES 
// (Require JWT Authentication)
// ===========================================

// Use JWT authentication for all project routes
router.use(authenticateJWT);

// Project CRUD operations - Complete Workflow Step 2
router.post('/', ProjectController.createProject);        // Create project + schema analysis
router.get('/', ProjectController.getProjects);           // List all projects  
router.get('/:id', ProjectController.getProject);         // Get project details + schema
router.post('/:id/refresh-schema', ProjectController.refreshSchema); // Re-analyze schema
router.delete('/:id', ProjectController.deleteProject);   // Delete project

// Shared link management - Complete Workflow Step 3  
router.post('/:id/share', SharedLinkController.createSharedLink);  // Generate client access token
router.get('/:id/links', SharedLinkController.getSharedLinks);     // View all shared links
router.delete('/:id/links/:linkId', SharedLinkController.deleteSharedLink); // Delete/revoke shared link

export default router;
