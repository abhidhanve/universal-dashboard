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
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { 
  Share, 
  ContentCopy, 
  Delete
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  developerId: string;
  name: string;
  description: string;
  mongoUri: string;
  databaseName: string;
  collectionName: string;
  schemaData: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SharedLink {
  id: string;
  token: string;
  projectId: string;
  expiresAt: string | null;
  isActive: boolean;
  permissions: {
    canInsert: boolean;
    canView: boolean;
    canDelete: boolean;
    canModifySchema: boolean;
  };
  createdAt: string;
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [permissions, setPermissions] = useState({
    canInsert: true,
    canView: true,
    canDelete: true,  // Enable delete by default for testing
    canModifySchema: true  // Enable schema modification by default for testing
  });
  const [expiresIn, setExpiresIn] = useState<number>(7);

  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project> => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data.data;
    },
  });

  // Fetch shared links
  const { data: sharedLinks = [] } = useQuery({
    queryKey: ['shared-links', projectId],
    queryFn: async (): Promise<SharedLink[]> => {
      const response = await api.get(`/projects/${projectId}/links`);
      return response.data.data || [];
    },
  });

  // Create shared link mutation
  const createSharedLinkMutation = useMutation({
    mutationFn: async (linkData: { permissions: { canInsert: boolean; canView: boolean; canDelete: boolean; canModifySchema: boolean }; expiresIn?: number }) => {
      const response = await api.post(`/projects/${projectId}/share`, {
        canInsert: linkData.permissions.canInsert,
        canView: linkData.permissions.canView,
        canDelete: linkData.permissions.canDelete,
        canModifySchema: linkData.permissions.canModifySchema,
        expiresAt: linkData.expiresIn ? new Date(Date.now() + linkData.expiresIn * 24 * 60 * 60 * 1000).toISOString() : undefined
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-links', projectId] });
      setShareDialogOpen(false);
      toast.success('Shared link created successfully!');
    },
    onError: () => {
      toast.error('Failed to create shared link');
    },
  });

  // Refresh schema mutation
  const refreshSchemaMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/projects/${projectId}/refresh-schema`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Schema refreshed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to refresh schema');
    },
  });

  // Delete shared link mutation
  const deleteSharedLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const response = await api.delete(`/projects/${projectId}/links/${linkId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-links', projectId] });
      toast.success('Shared link deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete shared link');
    },
  });

  const copyToClipboard = (token: string) => {
    const shareUrl = `${window.location.origin}/access/${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleCreateSharedLink = () => {
    createSharedLinkMutation.mutate({ permissions, expiresIn });
  };

  const handleDeleteSharedLink = (linkId: string, token: string) => {
    if (window.confirm(`Are you sure you want to revoke access for token ${token.substring(0, 10)}...?`)) {
      deleteSharedLinkMutation.mutate(linkId);
    }
  };

  if (isLoadingProject) {
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
      <Box mb={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {project.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {project.description}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<Share />}
              onClick={() => setShareDialogOpen(true)}
            >
              Share
            </Button>
            {/* <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(`/projects/${projectId}/edit`)}
            >
              Edit
            </Button> */}
          </Stack>
        </Stack>
        
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Chip label={`Database: ${project.databaseName}`} color="primary" variant="outlined" />
          <Chip label={`Collection: ${project.collectionName}`} color="secondary" variant="outlined" />
          <Chip label={`Created: ${new Date(project.createdAt).toLocaleDateString()}`} variant="outlined" />
          <Chip 
            label={project.isActive ? "Active" : "Inactive"} 
            color={project.isActive ? "success" : "error"} 
            variant="filled" 
          />
        </Stack>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Schema Analysis
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => refreshSchemaMutation.mutate()}
              disabled={refreshSchemaMutation.isPending}
              title="Refresh from database while preserving manually added fields"
            >
              {refreshSchemaMutation.isPending ? 'Refreshing...' : 'Refresh from DB'}
            </Button>
          </Stack>
          
          {project.schemaData && Object.keys(project.schemaData).length > 0 ? (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Fields detected in collection ({Object.keys(project.schemaData).length} fields):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1, gap: 1 }}>
                {Object.entries(project.schemaData).map(([field, fieldData]: [string, any]) => (
                  <Chip
                    key={field}
                    label={`${field}: ${fieldData?.type || 'unknown'}`}
                    size="small"
                    variant="outlined"
                    color={fieldData?.type ? 'primary' : 'default'}
                  />
                ))}
              </Stack>
              
              {/* Schema Statistics */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Schema Statistics: {Object.keys(project.schemaData).length} fields detected from database collection
                </Typography>
                
                {/* Detailed Field Information */}
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {Object.entries(project.schemaData).slice(0, 3).map(([field, fieldData]: [string, any]) => (
                    <Typography key={field} variant="caption" sx={{ fontFamily: 'monospace' }}>
                      <strong>{field}</strong>: {fieldData?.type || 'unknown'} 
                      {fieldData?.stats?.form_type && ` (${fieldData.stats.form_type})`}
                      {fieldData?.stats?.examples && ` - e.g., ${fieldData.stats.examples[0]}`}
                    </Typography>
                  ))}
                  {Object.keys(project.schemaData).length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      ... and {Object.keys(project.schemaData).length - 3} more fields
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                No schema data available.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => refreshSchemaMutation.mutate()}
                disabled={refreshSchemaMutation.isPending}
                sx={{ mt: 1 }}
                title="Analyze schema from database"
              >
                {refreshSchemaMutation.isPending ? 'Analyzing...' : 'Analyze from DB'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Shared Links
          </Typography>
          
          {sharedLinks.length > 0 ? (
            <List>
              {sharedLinks.map((link) => (
                <ListItem
                  key={link.id}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 1,
                    mb: 1
                  }}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        edge="end"
                        onClick={() => copyToClipboard(link.token)}
                        title="Copy link to clipboard"
                      >
                        <ContentCopy />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteSharedLink(link.id, link.token)}
                        color="error"
                        title="Delete/Revoke this link"
                      >
                        <Delete />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={`Token: ${link.token.substring(0, 20)}...`}
                    secondary={
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        {Object.entries(link.permissions).map(([key, value]) => 
                          value && (
                            <Chip
                              key={key}
                              label={key}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )
                        )}
                        {link.expiresAt && (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Expires: ${new Date(link.expiresAt).toLocaleDateString()}`}
                          />
                        )}
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No shared links created yet.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Shared Link</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Permissions
              </Typography>
              <Stack direction="column" spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={permissions.canView}
                      onChange={(e) => setPermissions(prev => ({ ...prev, canView: e.target.checked }))}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Can View Data</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Allow viewing and browsing existing data
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={permissions.canInsert}
                      onChange={(e) => setPermissions(prev => ({ ...prev, canInsert: e.target.checked }))}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Can Insert Data</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Allow submitting new data entries
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={permissions.canDelete}
                      onChange={(e) => setPermissions(prev => ({ ...prev, canDelete: e.target.checked }))}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Can Delete Data</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Allow removing existing data entries
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={permissions.canModifySchema}
                      onChange={(e) => setPermissions(prev => ({ ...prev, canModifySchema: e.target.checked }))}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Can Modify Schema</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Allow adding/removing data fields
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
              
              <TextField
                fullWidth
                label="Expires in (days)"
                type="number"
                value={expiresIn}
                onChange={(e) => setExpiresIn(Number(e.target.value))}
                sx={{ mt: 2 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateSharedLink}
            disabled={createSharedLinkMutation.isPending}
          >
            {createSharedLinkMutation.isPending ? <CircularProgress size={20} /> : 'Create Link'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
