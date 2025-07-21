import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Share,
  Folder,
  Storage,
} from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface Project {
  id: number;
  name: string;
  description: string;
  mongodb_uri: string;
  database_name: string;
  created_at: string;
  updated_at: string;
}

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    mongoUri: '',
    databaseName: '',
    collectionName: '',
  });

  // Fetch projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const response = await api.get('/projects');
      // Backend returns { success: true, data: [...], message, meta }
      return response.data.data || [];
    },
  });

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: async (projectData: typeof newProject) => {
      // Only send required fields
      const payload = {
        name: projectData.name,
        description: projectData.description,
        mongoUri: projectData.mongoUri,
        databaseName: projectData.databaseName,
        collectionName: projectData.collectionName,
      };
      const response = await api.post('/projects', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully!');
      setCreateDialogOpen(false);
      setNewProject({ name: '', description: '', mongoUri: '', databaseName: '', collectionName: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    },
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await api.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    setMenuAnchor(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedProject(null);
  };

  const handleCreateProject = () => {
    createMutation.mutate(newProject);
  };

  const handleDeleteProject = () => {
    if (selectedProject) {
      deleteMutation.mutate(selectedProject.id);
    }
    handleMenuClose();
  };

  const handleViewProject = (project: Project) => {
    navigate(`/projects/${project.id}`);
    handleMenuClose();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your MongoDB database projects
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          size="large"
        >
          New Project
        </Button>
      </Stack>

      {/* Projects Grid */}
      {projects?.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Folder sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No projects yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Create your first project to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {projects?.map((project) => (
            <Card
              key={project.id}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                },
              }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Storage color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      {project.name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, project);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Stack>
                
                <Typography variant="body2" color="text.secondary" mb={2} sx={{ minHeight: '40px' }}>
                  {project.description || 'No description provided'}
                </Typography>
                
                <Stack direction="row" spacing={1} mb={2}>
                  <Chip
                    label={project.database_name}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
                
                <Typography variant="caption" color="text.secondary">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Project Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedProject && handleViewProject(selectedProject)}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => selectedProject && navigate(`/projects/${selectedProject.id}`)}>
          <Share sx={{ mr: 1 }} fontSize="small" />
          Share Access
        </MenuItem>
        <MenuItem onClick={handleDeleteProject} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete Project
        </MenuItem>
      </Menu>

      {/* Create Project Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Project Name"
              fullWidth
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <TextField
              label="MongoDB URI"
              fullWidth
              value={newProject.mongoUri}
              onChange={(e) => setNewProject({ ...newProject, mongoUri: e.target.value })}
              placeholder="mongodb+srv://username:password@cluster.mongodb.net/"
              required
            />
            <TextField
              label="Database Name"
              fullWidth
              value={newProject.databaseName}
              onChange={(e) => setNewProject({ ...newProject, databaseName: e.target.value })}
              required
            />
            <TextField
              label="Collection Name"
              fullWidth
              value={newProject.collectionName}
              onChange={(e) => setNewProject({ ...newProject, collectionName: e.target.value })}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={!newProject.name || !newProject.mongoUri || !newProject.databaseName || !newProject.collectionName || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectsPage;
