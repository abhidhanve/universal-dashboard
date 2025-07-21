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
} from '@mui/material';
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

  // Fetch shared project information
  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        const response = await api.get(`/shared/${token}`);
        setProjectInfo(response.data.data);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load project information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectInfo();
  }, [token]);

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

    setIsSubmitting(true);
    try {
      await api.post(
        `/shared/${token}/data`,
        { data: formData }
      );

      toast.success('Data submitted successfully!');
      setSubmitSuccess(true);
      setFormData({});
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit data');
    } finally {
      setIsSubmitting(false);
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
            <Stack direction="row" spacing={1}>
              <Chip label={projectInfo.databaseName} size="small" />
              <Chip label={projectInfo.collectionName} size="small" />
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
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
                    disabled={isSubmitting || !projectInfo.permissions.canInsert}
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

                {!projectInfo.permissions.canInsert && (
                  <Alert severity="warning">
                    You do not have permission to submit data through this link
                  </Alert>
                )}
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ClientAccessPage;
