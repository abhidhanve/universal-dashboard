import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  TextField,
  CircularProgress,
  Alert,
  Container,
  Checkbox,
  FormControlLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Delete, Visibility, Add, Refresh, Settings } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface ProjectSchema {
  projectName: string;
  description: string;
  databaseName: string;
  collectionName: string;
  schema: Record<string, any>;
  permissions: {
    canInsert: boolean;
    canView: boolean;
    canDelete: boolean;
    canModifySchema: boolean;
  };
}

interface FormField {
  name: string;
  type: string;
  formType: string;
  required: boolean;
  examples?: string[];
}

const ClientAccessPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  
  const [projectInfo, setProjectInfo] = useState<ProjectSchema | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // New states for data viewing and management
  const [activeTab, setActiveTab] = useState(0); // 0: Insert Form, 1: View Data, 2: Modify Schema
  const [viewData, setViewData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [isDeletingData, setIsDeletingData] = useState(false);
  
  // Schema modification states
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('string');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [schemaModified, setSchemaModified] = useState(false);

  // Fetch shared project information
  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        const response = await api.get(`/shared/${token}`);
        const projectData = response.data.data;
        console.log('Client Access - Project Info Loaded:', projectData);
        console.log('Permissions:', projectData.permissions);
        setProjectInfo(projectData);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load project information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectInfo();
  }, [token]);

  // Clear form data when schema changes to show new fields
  useEffect(() => {
    if (schemaModified) {
      setFormData({});
      setSchemaModified(false);
    }
  }, [projectInfo?.schema, schemaModified]);

  // Generate form fields from schema
  const generateFormFields = (): FormField[] => {
    if (!projectInfo?.schema) return [];
    
    return Object.entries(projectInfo.schema)
      .filter(([key]) => key !== '_id') // Exclude MongoDB _id field
      .map(([key, fieldInfo]: [string, any]) => ({
        name: key,
        type: fieldInfo.type,
        formType: fieldInfo.stats?.form_type || 'text',
        required: fieldInfo.stats?.is_required || false,
        examples: fieldInfo.stats?.examples || [],
      }));
  };

  // Handle form input changes
  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Handle array field changes (skills, hobbies, etc.)
  const handleArrayChange = (fieldName: string, value: string) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [fieldName]: arrayValue
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectInfo?.permissions.canInsert) {
      toast.error('You do not have permission to insert data');
      return;
    }

    // Validate required fields
    const requiredFields = generateFormFields().filter(field => field.required);
    const missingFields = requiredFields.filter(field => {
      const value = formData[field.name];
      return !value || (typeof value === 'string' && !value.trim()) || 
             (Array.isArray(value) && value.length === 0);
    });

    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.map(f => f.name).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(
        `/shared/${token}/data`,
        { data: formData }
      );

      toast.success('Data submitted successfully!');
      setSubmitSuccess(true);
      setFormData({});
      
      // Refresh data if viewing tab is active
      if (activeTab === 1) {
        fetchViewData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch data for viewing
  const fetchViewData = async () => {
    if (!projectInfo?.permissions.canView || !token) return;

    setIsLoadingData(true);
    try {
      const response = await api.get(`/shared/${token}/data`);
      setViewData(response.data.data?.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load data');
      setViewData([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Handle data deletion
  const handleDeleteData = async (documentId: string) => {
    if (!projectInfo?.permissions.canDelete || !token) {
      toast.error('You do not have permission to delete data');
      return;
    }

    setIsDeletingData(true);
    try {
      await api.delete(`/shared/${token}/data/${documentId}`);
      toast.success('Data deleted successfully!');
      
      // Refresh the data list
      await fetchViewData();
      setDeleteConfirmOpen(false);
      setSelectedDeleteId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete data');
    } finally {
      setIsDeletingData(false);
    }
  };

  // Handle tab change and load data if viewing tab
  const handleTabChange = (_: any, newValue: number) => {
    setActiveTab(newValue);
    
    // Get tab types array to determine which tab was clicked
    const availableTabs = [];
    if (projectInfo?.permissions.canInsert) availableTabs.push('insert');
    if (projectInfo?.permissions.canView) availableTabs.push('view');
    if (projectInfo?.permissions.canModifySchema) availableTabs.push('schema');
    
    if (availableTabs[newValue] === 'view') {
      fetchViewData();
    }
  };

  // Add new field to schema
  const handleAddField = async () => {
    if (!newFieldName.trim() || !projectInfo?.permissions.canModifySchema || !token) {
      toast.error('You do not have permission to modify schema or field name is empty');
      return;
    }

    if (projectInfo.schema[newFieldName]) {
      toast.error('Field name already exists');
      return;
    }

    setIsAddingField(true);
    try {
      const newField = {
        [newFieldName]: {
          type: newFieldType,
          stats: {
            form_type: newFieldType === 'number' ? 'number' : 
                      newFieldType === 'boolean' ? 'checkbox' :
                      newFieldType === 'array' ? 'array' : 'text',
            is_required: newFieldRequired,
            examples: []
          }
        }
      };

      // Add field via API call - this will persist the change
      await api.put(`/shared/${token}/schema`, {
        newFields: newField
      });

      // Refetch the project info to get the updated schema from the database
      const response = await api.get(`/shared/${token}`);
      setProjectInfo(response.data.data);

      toast.success(`Field "${newFieldName}" added successfully`);
      setNewFieldName('');
      setNewFieldType('string');
      setNewFieldRequired(false);
      setSchemaModified(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add field');
    } finally {
      setIsAddingField(false);
    }
  };

  // Remove field from schema
  const handleRemoveField = async (fieldName: string) => {
    if (!projectInfo?.permissions.canModifySchema || !token) {
      toast.error('You do not have permission to modify schema');
      return;
    }

    if (fieldName === '_id') {
      toast.error('Cannot remove the _id field');
      return;
    }

    try {
      await api.delete(`/shared/${token}/schema/${fieldName}`);

      // Refetch the project info to get the updated schema from the database
      const response = await api.get(`/shared/${token}`);
      setProjectInfo(response.data.data);

      toast.success(`Field "${fieldName}" removed successfully`);
      setSchemaModified(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove field');
    }
  };

  // Render form field based on type
  const renderFormField = (field: FormField) => {
    const { name, formType, examples } = field;
    const value = formData[name] || '';

    switch (formType) {
      case 'email':
        return (
          <TextField
            key={name}
            fullWidth
            type="email"
            label={name.charAt(0).toUpperCase() + name.slice(1)}
            value={value}
            onChange={(e) => handleInputChange(name, e.target.value)}
            placeholder={examples?.[0] || `Enter ${name}`}
            variant="outlined"
            required={field.required}
          />
        );

      case 'tel':
        return (
          <TextField
            key={name}
            fullWidth
            type="tel"
            label={name.charAt(0).toUpperCase() + name.slice(1)}
            value={value}
            onChange={(e) => handleInputChange(name, e.target.value)}
            placeholder={examples?.[0] || `Enter ${name}`}
            variant="outlined"
            required={field.required}
          />
        );

      case 'number':
        return (
          <TextField
            key={name}
            fullWidth
            type="number"
            label={name.charAt(0).toUpperCase() + name.slice(1)}
            value={value}
            onChange={(e) => handleInputChange(name, parseFloat(e.target.value) || '')}
            placeholder={examples?.[0] || `Enter ${name}`}
            variant="outlined"
            required={field.required}
          />
        );

      case 'date':
        return (
          <TextField
            key={name}
            fullWidth
            type="date"
            label={name.charAt(0).toUpperCase() + name.slice(1)}
            value={value}
            onChange={(e) => handleInputChange(name, e.target.value)}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            required={field.required}
          />
        );

      case 'checkbox':
        return (
          <FormControlLabel
            key={name}
            control={
              <Checkbox
                checked={value || false}
                onChange={(e) => handleInputChange(name, e.target.checked)}
              />
            }
            label={name.charAt(0).toUpperCase() + name.slice(1)}
          />
        );

      case 'array':
        return (
          <TextField
            key={name}
            fullWidth
            label={name.charAt(0).toUpperCase() + name.slice(1)}
            value={Array.isArray(value) ? value.join(', ') : ''}
            onChange={(e) => handleArrayChange(name, e.target.value)}
            placeholder={`Enter ${name} separated by commas (e.g., coding, gaming)`}
            variant="outlined"
            helperText="Enter multiple values separated by commas"
            required={field.required}
          />
        );

      default:
        return (
          <TextField
            key={name}
            fullWidth
            label={name.charAt(0).toUpperCase() + name.slice(1)}
            value={value}
            onChange={(e) => handleInputChange(name, e.target.value)}
            placeholder={examples?.[0] || `Enter ${name}`}
            variant="outlined"
            required={field.required}
          />
        );
    }
  };

  if (isLoading) {
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
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !projectInfo) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h5" color="error" gutterBottom>
              Access Error
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              {error || 'Invalid or expired shared link'}
            </Typography>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (submitSuccess) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h4" color="primary" gutterBottom>
              ✅ Success!
            </Typography>
            <Typography variant="h6" gutterBottom>
              Your data has been submitted successfully
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              Thank you for your submission to {projectInfo.projectName}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => {
                setSubmitSuccess(false);
                setFormData({});
              }}
            >
              Submit Another Entry
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const formFields = generateFormFields();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom color="primary">
              {projectInfo.projectName}
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={2}>
              {projectInfo.description}
            </Typography>
            <Stack direction="row" spacing={1} mb={2}>
              <Chip label={projectInfo.databaseName} size="small" />
              <Chip label={projectInfo.collectionName} size="small" />
              {/* Debug: Show current permissions */}
              {projectInfo.permissions.canInsert && <Chip label="Can Insert" color="success" size="small" />}
              {projectInfo.permissions.canView && <Chip label="Can View" color="info" size="small" />}
              {projectInfo.permissions.canDelete && <Chip label="Can Delete" color="error" size="small" />}
              {projectInfo.permissions.canModifySchema && <Chip label="Can Modify Schema" color="warning" size="small" />}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="data operations tabs"
              variant="fullWidth"
            >
              {projectInfo.permissions.canInsert && (
                <Tab 
                  icon={<Add />} 
                  label="Insert Data" 
                  disabled={!projectInfo.permissions.canInsert}
                />
              )}
              {projectInfo.permissions.canView && (
                <Tab 
                  icon={<Visibility />} 
                  label="View Data" 
                  disabled={!projectInfo.permissions.canView}
                />
              )}
              {projectInfo.permissions.canModifySchema && (
                <Tab 
                  icon={<Settings />} 
                  label="Modify Schema" 
                  disabled={!projectInfo.permissions.canModifySchema}
                />
              )}
            </Tabs>
          </Box>

          <CardContent>
            {/* Render tab content based on available permissions and active tab */}
            {(() => {
              const availableTabs = [];
              if (projectInfo.permissions.canInsert) availableTabs.push('insert');
              if (projectInfo.permissions.canView) availableTabs.push('view');
              if (projectInfo.permissions.canModifySchema) availableTabs.push('schema');
              
              const currentTab = availableTabs[activeTab];
              
              // Insert Data Tab
              if (currentTab === 'insert') {
                return (
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      Submit Your Information
                    </Typography>
                    
                    <form onSubmit={handleSubmit}>
                      <Stack spacing={3}>
                        {formFields.map(renderFormField)}
                        
                        <Box sx={{ pt: 2 }}>
                          <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={isSubmitting}
                            fullWidth
                          >
                            {isSubmitting ? (
                              <>
                                <CircularProgress size={20} sx={{ mr: 1 }} />
                                Submitting...
                              </>
                            ) : (
                              'Submit Data'
                            )}
                          </Button>
                        </Box>
                      </Stack>
                    </form>
                  </Box>
                );
              }
              
              // View Data Tab
              if (currentTab === 'view') {
                return (
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h5">
                        View Data
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchViewData}
                        disabled={isLoadingData}
                        size="small"
                      >
                        {isLoadingData ? 'Loading...' : 'Refresh'}
                      </Button>
                    </Stack>

                    {isLoadingData ? (
                      <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                      </Box>
                    ) : viewData.length === 0 ? (
                      <Box textAlign="center" py={4}>
                        <Typography color="text.secondary">
                          No data found in this collection
                        </Typography>
                      </Box>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table>
                          <TableHead>
                            <TableRow>
                              {Object.keys(projectInfo.schema).map((field) => (
                                <TableCell key={field}>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {field.charAt(0).toUpperCase() + field.slice(1)}
                                  </Typography>
                                </TableCell>
                              ))}
                              {projectInfo.permissions.canDelete && (
                                <TableCell align="center">
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    Actions
                                  </Typography>
                                </TableCell>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {viewData.map((row, index) => (
                              <TableRow key={row._id || index}>
                                {Object.keys(projectInfo.schema).map((field) => (
                                  <TableCell key={field}>
                                    {Array.isArray(row[field]) 
                                      ? row[field].join(', ')
                                      : typeof row[field] === 'object' && row[field] !== null
                                      ? JSON.stringify(row[field])
                                      : String(row[field] || '')}
                                  </TableCell>
                                ))}
                                {projectInfo.permissions.canDelete && (
                                  <TableCell align="center">
                                    <IconButton
                                      color="error"
                                      size="small"
                                      onClick={() => {
                                        setSelectedDeleteId(row._id);
                                        setDeleteConfirmOpen(true);
                                      }}
                                      disabled={!row._id}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                );
              }
              
              // Schema Modification Tab
              if (currentTab === 'schema') {
                return (
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      Modify Schema
                    </Typography>
                    
                    {schemaModified && (
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Schema has been modified. The form will update automatically.
                      </Alert>
                    )}

                    {/* Current Schema Display */}
                    <Typography variant="h6" gutterBottom>
                      Current Schema Fields
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Field Name</strong></TableCell>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell><strong>Form Type</strong></TableCell>
                            <TableCell><strong>Required</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(projectInfo.schema).map(([fieldName, fieldInfo]: [string, any]) => (
                            <TableRow key={fieldName}>
                              <TableCell>{fieldName}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={fieldInfo.type} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined" 
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={fieldInfo.stats?.form_type || 'text'} 
                                  size="small" 
                                  color="secondary" 
                                  variant="outlined" 
                                />
                              </TableCell>
                              <TableCell>
                                {fieldInfo.stats?.is_required ? (
                                  <Chip label="Required" size="small" color="error" />
                                ) : (
                                  <Chip label="Optional" size="small" color="default" />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {fieldName !== '_id' && (
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => handleRemoveField(fieldName)}
                                    title={`Remove ${fieldName} field`}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Add New Field Form */}
                    <Typography variant="h6" gutterBottom>
                      Add New Field
                    </Typography>
                    <Stack spacing={3} sx={{ maxWidth: 500 }}>
                      <TextField
                        fullWidth
                        label="Field Name"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        placeholder="e.g., email, age, skills"
                        variant="outlined"
                      />
                      
                      <FormControl fullWidth>
                        <InputLabel>Field Type</InputLabel>
                        <Select
                          value={newFieldType}
                          label="Field Type"
                          onChange={(e) => setNewFieldType(e.target.value)}
                        >
                          <MenuItem value="string">String (Text)</MenuItem>
                          <MenuItem value="number">Number</MenuItem>
                          <MenuItem value="boolean">Boolean (True/False)</MenuItem>
                          <MenuItem value="array">Array (Multiple Values)</MenuItem>
                          <MenuItem value="date">Date</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={newFieldRequired}
                            onChange={(e) => setNewFieldRequired(e.target.checked)}
                          />
                        }
                        label="Required Field"
                      />

                      <Button
                        variant="contained"
                        onClick={handleAddField}
                        disabled={isAddingField || !newFieldName.trim()}
                        startIcon={isAddingField ? <CircularProgress size={16} /> : <Add />}
                      >
                        {isAddingField ? 'Adding Field...' : 'Add Field'}
                      </Button>
                    </Stack>
                  </Box>
                );
              }
              
              // No permissions fallback
              return (
                <Alert severity="warning">
                  You do not have any permissions for this shared link
                </Alert>
              );
            })()}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this record? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedDeleteId && handleDeleteData(selectedDeleteId)}
              color="error"
              disabled={isDeletingData}
            >
              {isDeletingData ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ClientAccessPage;
