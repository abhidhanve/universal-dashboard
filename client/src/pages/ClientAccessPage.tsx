import React, { useState, useEffect } from 'react';
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
  IconButton,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Visibility,
  Settings,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

interface SharedLinkInfo {
  id: string;
  project_name: string;
  collection_name: string;
  permissions: string[];
  can_view: boolean;
  can_insert: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_modify_schema: boolean;
  expires_at: string;
}

interface DocumentRecord {
  _id: string;
  [key: string]: any;
}

interface SchemaField {
  name: string;
  type: string;
  required: boolean;
}

const ClientAccessPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState<any>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);
  const [editedData, setEditedData] = useState<any>({});

  // Fetch shared link info and permissions
  const { data: linkInfo, isLoading: linkLoading, error: linkError } = useQuery({
    queryKey: ['shared-link', token],
    queryFn: async (): Promise<SharedLinkInfo> => {
      const response = await axios.get(`/shared-links/${token}`);
      return response.data.data;
    },
    enabled: !!token,
  });

  // Fetch collection data
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['collection-data', token],
    queryFn: async (): Promise<DocumentRecord[]> => {
      const response = await axios.get(`/shared-links/${token}/data`);
      return response.data.data || [];
    },
    enabled: !!token && !!linkInfo?.can_view,
  });

  // Fetch current schema
  const { data: schema, isLoading: schemaLoading } = useQuery({
    queryKey: ['collection-schema', token],
    queryFn: async (): Promise<SchemaField[]> => {
      const response = await axios.get(`/shared-links/${token}/schema`);
      return response.data.data || [];
    },
    enabled: !!token && !!linkInfo?.can_modify_schema,
  });

  // Create new record mutation
  const createRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`/shared-links/${token}/data`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-data', token] });
      toast.success('Record created successfully!');
      setAddDialogOpen(false);
      setNewRecord({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create record');
    },
  });

  // Update record mutation
  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await axios.put(`/shared-links/${token}/data/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-data', token] });
      toast.success('Record updated successfully!');
      setEditingRecord(null);
      setEditedData({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update record');
    },
  });

  // Delete record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/shared-links/${token}/data/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-data', token] });
      toast.success('Record deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete record');
    },
  });

  // Modify schema mutation
  const modifySchemaMutation = useMutation({
    mutationFn: async (schemaChanges: any) => {
      const response = await axios.post(`/shared-links/${token}/schema`, schemaChanges);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-schema', token] });
      queryClient.invalidateQueries({ queryKey: ['collection-data', token] });
      toast.success('Schema updated successfully!');
      setSchemaDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update schema');
    },
  });

  if (linkLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (linkError || !linkInfo) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              Invalid or expired access link
            </Alert>
            <Typography variant="h5" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The link you're trying to access is either invalid or has expired.
              Please contact the project owner for a new access link.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const isExpired = new Date(linkInfo.expires_at) < new Date();

  if (isExpired) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              This access link has expired
            </Alert>
            <Typography variant="h5" gutterBottom>
              Link Expired
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This access link expired on {new Date(linkInfo.expires_at).toLocaleDateString()}.
              Please contact the project owner for a new access link.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
      <Card sx={{ maxWidth: 1200, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box mb={4}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {linkInfo.project_name}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Collection: {linkInfo.collection_name}
            </Typography>
            
            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
              {linkInfo.can_view && <Chip label="View" color="primary" size="small" />}
              {linkInfo.can_insert && <Chip label="Insert" color="success" size="small" />}
              {linkInfo.can_update && <Chip label="Update" color="warning" size="small" />}
              {linkInfo.can_delete && <Chip label="Delete" color="error" size="small" />}
              {linkInfo.can_modify_schema && <Chip label="Modify Schema" color="secondary" size="small" />}
            </Stack>
            
            <Typography variant="body2" color="text.secondary">
              Expires: {new Date(linkInfo.expires_at).toLocaleString()}
            </Typography>
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={2} mb={3}>
            {linkInfo.can_insert && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddDialogOpen(true)}
              >
                Add Record
              </Button>
            )}
            
            {linkInfo.can_modify_schema && (
              <Button
                variant="outlined"
                startIcon={<Settings />}
                onClick={() => setSchemaDialogOpen(true)}
              >
                Modify Schema
              </Button>
            )}
          </Stack>

          {/* Data Table */}
          {linkInfo.can_view && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Data Records ({documents?.length || 0})
              </Typography>
              
              {documentsLoading ? (
                <CircularProgress />
              ) : documents?.length === 0 ? (
                <Alert severity="info">
                  No records found in this collection.
                  {linkInfo.can_insert && " You can add the first record using the 'Add Record' button above."}
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        {/* Generate headers from first document */}
                        {documents && documents[0] && Object.keys(documents[0]).map((key) => (
                          <TableCell key={key} sx={{ fontWeight: 'bold' }}>
                            {key}
                          </TableCell>
                        ))}
                        {(linkInfo.can_update || linkInfo.can_delete) && (
                          <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {documents?.map((doc) => (
                        <TableRow key={doc._id}>
                          {Object.entries(doc).map(([key, value]) => (
                            <TableCell key={key}>
                              {editingRecord === doc._id && key !== '_id' ? (
                                <TextField
                                  size="small"
                                  value={editedData[key] ?? value}
                                  onChange={(e) => setEditedData({ 
                                    ...editedData, 
                                    [key]: e.target.value 
                                  })}
                                  fullWidth
                                />
                              ) : (
                                <Typography variant="body2">
                                  {typeof value === 'object' 
                                    ? JSON.stringify(value) 
                                    : String(value)}
                                </Typography>
                              )}
                            </TableCell>
                          ))}
                          {(linkInfo.can_update || linkInfo.can_delete) && (
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                {linkInfo.can_update && (
                                  <>
                                    {editingRecord === doc._id ? (
                                      <>
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => {
                                            updateRecordMutation.mutate({
                                              id: doc._id,
                                              data: { ...doc, ...editedData }
                                            });
                                          }}
                                        >
                                          <Save />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            setEditingRecord(null);
                                            setEditedData({});
                                          }}
                                        >
                                          <Cancel />
                                        </IconButton>
                                      </>
                                    ) : (
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setEditingRecord(doc._id);
                                          setEditedData({});
                                        }}
                                      >
                                        <Edit />
                                      </IconButton>
                                    )}
                                  </>
                                )}
                                
                                {linkInfo.can_delete && (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to delete this record?')) {
                                        deleteRecordMutation.mutate(doc._id);
                                      }
                                    }}
                                  >
                                    <Delete />
                                  </IconButton>
                                )}
                              </Stack>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Record Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Record</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Generate form fields based on existing schema or first document */}
            {documents && documents[0] && Object.keys(documents[0])
              .filter(key => key !== '_id')
              .map((key) => (
                <TextField
                  key={key}
                  label={key}
                  value={newRecord[key] || ''}
                  onChange={(e) => setNewRecord({ ...newRecord, [key]: e.target.value })}
                  fullWidth
                />
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => createRecordMutation.mutate(newRecord)}
            variant="contained"
            disabled={createRecordMutation.isPending}
          >
            {createRecordMutation.isPending ? 'Adding...' : 'Add Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schema Modification Dialog */}
      <Dialog open={schemaDialogOpen} onClose={() => setSchemaDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modify Schema Structure</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Schema modification interface - This allows you to add, remove, or modify field types in the collection.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Schema modification feature is coming soon! This will allow you to add new fields, change field types, and modify validation rules.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSchemaDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientAccessPage;
