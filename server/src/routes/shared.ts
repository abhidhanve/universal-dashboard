import { Router } from 'express';
import { SharedLinkController } from '../controllers/sharedLinkController';

const router = Router();

// ===========================================
// CLIENT ACCESS ROUTES
// (NO Authentication Required - Token-based access only)
// ===========================================

// Complete Workflow Step 4: Client Operations via Shared Links

// Get project schema and form structure for clients
router.get('/:token', SharedLinkController.getSharedProject);

// Client CRUD operations based on permissions
router.post('/:token/data', SharedLinkController.insertData);      // INSERT permission
router.get('/:token/data', SharedLinkController.getData);          // VIEW permission  
router.delete('/:token/data/:documentId', SharedLinkController.deleteData); // DELETE permission

export default router;
