import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Stack, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Share, 
  Analytics, 
  ContentCopy, 
  Edit,
  Add,
  Delete,
  Refresh
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
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

interface Collection {
  name: string;
  count: number;
  sampleDocument: any;
  schema: any;
}

interface SharedLink {
  id: string;
  token: string;
  project_id: number;
  collection_name: string;
  permissions: string[];
  expires_at: string;
  created_at: string;
}

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [shareConfig, setShareConfig] = useState({
    can_view: true,
    can_insert: false,
    can_update: false,
    can_delete: false,
    can_modify_schema: false,
    expires_in_days: 30
  });

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project> => {
      const response = await axios.get(`/api/projects/${projectId}`);
      return response.data.data;
    },
    enabled: !!projectId,
  });

  // Fetch MongoDB collections and schema analysis
  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ['collections', projectId],
    queryFn: async (): Promise<Collection[]> => {
      const response = await axios.get(`/api/projects/${projectId}/analyze`);
      return response.data.data || [];
    },
    enabled: !!projectId,
  });

  // Fetch shared links for this project
  const { data: sharedLinks, isLoading: sharedLinksLoading } = useQuery({
    queryKey: ['shared-links', projectId],
    queryFn: async (): Promise<SharedLink[]> => {
      const response = await axios.get(`/api/projects/${projectId}/links`);
      return response.data.data || [];
    },
    enabled: !!projectId,
  });

  // Create shared link mutation
  const createSharedLinkMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`/api/projects/${projectId}/share`, {
        project_id: projectId,
        collection_name: selectedCollection,
        ...shareConfig,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shared-links', projectId] });
      toast.success('Shared link created successfully!');
      setShareDialogOpen(false);
      
      // Copy link to clipboard
      const shareUrl = `${window.location.origin}/access/${data.token}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create shared link');
    },
  });

  const copyToClipboard = (token: string) => {
    const shareUrl = `${window.location.origin}/access/${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  if (projectLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Alert severity="error">
        Project not found
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {project.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {project.description || 'No description provided'}
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['collections', projectId] });
                toast.success('Schema analysis refreshed!');
              }}
            >
              Refresh Schema
            </Button>
            <Button
              variant="contained"
              startIcon={<Share />}
              onClick={() => setShareDialogOpen(true)}
            >
              Create Share Link
            </Button>
          </Stack>
        </Stack>
        
        <Stack direction="row" spacing={2} mb={2}>
          <Chip label={`Database: ${project.database_name}`} color="primary" variant="outlined" />
          <Chip label={`Created: ${new Date(project.created_at).toLocaleDateString()}`} variant="outlined" />
        </Stack>
      </Box>

      {/* Collections Schema Analysis */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            MongoDB Collections Analysis
          </Typography>
          
          {collectionsLoading ? (
            <CircularProgress />
          ) : collections?.length === 0 ? (
            <Alert severity="info">
              No collections found. Make sure your MongoDB connection is valid and contains data.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {collections?.map((collection) => (
                <Card key={collection.name} variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight="medium">
                        {collection.name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={`${collection.count} documents`} size="small" />
                        <Button
                          size="small"
                          startIcon={<Share />}
                          onClick={() => {
                            setSelectedCollection(collection.name);
                            setShareDialogOpen(true);
                          }}
                        >
                          Share
                        </Button>
                      </Stack>
                    </Stack>
                    
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Schema Fields:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.keys(collection.schema || {}).map((field) => (
                        <Chip
                          key={field}
                          label={`${field}: ${collection.schema[field]}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Shared Links */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Active Share Links
          </Typography>
          
          {sharedLinksLoading ? (
            <CircularProgress />
          ) : sharedLinks?.length === 0 ? (
            <Alert severity="info">
              No shared links created yet. Create one to allow clients to access and modify your data.
            </Alert>
          ) : (
            <List>
              {sharedLinks?.map((link) => (
                <ListItem key={link.id} divider>
                  <ListItemText
                    primary={`Collection: ${link.collection_name}`}
                    secondary={
                      <Stack direction="row" spacing={1} mt={1}>
                        {link.permissions.map((permission) => (
                          <Chip key={permission} label={permission} size="small" color="primary" />
                        ))}
                        <Chip 
                          label={`Expires: ${new Date(link.expires_at).toLocaleDateString()}`} 
                          size="small" 
                          color="secondary" 
                        />
                      </Stack>
                    }
                  />
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Copy link">
                      <IconButton onClick={() => copyToClipboard(link.token)}>
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit permissions">
                      <IconButton>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete link">
                      <IconButton color="error">
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Share Link</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Collection"
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              select
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="">Select a collection</option>
              {collections?.map((collection) => (
                <option key={collection.name} value={collection.name}>
                  {collection.name} ({collection.count} documents)
                </option>
              ))}
            </TextField>

            <Typography variant="h6">Permissions</Typography>
            
            <Stack spacing={2}>
              {[
                { key: 'can_view', label: 'View Data' },
                { key: 'can_insert', label: 'Insert New Records' },
                { key: 'can_update', label: 'Update Existing Records' },
                { key: 'can_delete', label: 'Delete Records' },
                { key: 'can_modify_schema', label: 'Modify Schema Structure' },
              ].map((permission) => (
                <Box key={permission.key} sx={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={shareConfig[permission.key as keyof typeof shareConfig] as boolean}
                    onChange={(e) => setShareConfig({ 
                      ...shareConfig, 
                      [permission.key]: e.target.checked 
                    })}
                    style={{ marginRight: 8 }}
                  />
                  <Typography>{permission.label}</Typography>
                </Box>
              ))}
            </Stack>

            <TextField
              label="Expires in (days)"
              type="number"
              value={shareConfig.expires_in_days}
              onChange={(e) => setShareConfig({ 
                ...shareConfig, 
                expires_in_days: parseInt(e.target.value) || 30 
              })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => createSharedLinkMutation.mutate(shareConfig)}
            variant="contained"
            disabled={!selectedCollection || createSharedLinkMutation.isPending}
          >
            {createSharedLinkMutation.isPending ? 'Creating...' : 'Create Share Link'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetailPage;

