import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  LinearProgress,
  Button,
} from '@mui/material';
import {
  Folder,
  Share,
  Storage,
  TrendingUp,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface DashboardStats {
  totalProjects: number;
//   totalSharedLinks: number;
  totalClients: number;
  recentActivity: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [projectsRes, clientsRes] = await Promise.all([
        axios.get('/api/projects'),
        axios.get('/shared-links'),
        axios.get('/clients'),
      ]);

      return {
        totalProjects: projectsRes.data.data?.length || 0,
        // totalSharedLinks: sharedLinksRes.data.data?.length || 0,
        totalClients: clientsRes.data.data?.length || 0,
        recentActivity: 12, // This can be calculated from actual data later
      };
    },
  });

  const statCards = [
    {
      title: 'Total Projects',
      value: stats?.totalProjects || 0,
      icon: <Folder sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary.main',
      bgColor: 'primary.light',
    },
    // {
    //   title: 'Shared Links',
    //   value: stats?.totalSharedLinks || 0,
    //   icon: <Share sx={{ fontSize: 40, color: 'secondary.main' }} />,
    //   color: 'secondary.main',
    //   bgColor: 'secondary.light',
    // }
    
    {
      title: 'Active Clients',
      value: stats?.totalClients || 0,
      icon: <Storage sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success.main',
      bgColor: 'success.light',
    },
    {
      title: 'This Month',
      value: stats?.recentActivity || 0,
      icon: <TrendingUp sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning.main',
      bgColor: 'warning.light',
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back! Here's what's happening with your projects.
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/projects')}
            size="large"
          >
            New Project
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        {statCards.map((card, index) => (
          <Card
            key={index}
            sx={{
              height: '100%',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    backgroundColor: card.bgColor + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </Box>
                
                <Box>
                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    color={card.color}
                  >
                    {isLoading ? (
                      <LinearProgress sx={{ width: 60 }} />
                    ) : (
                      card.value
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.title}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Recent Activity Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '2fr 1fr',
          },
          gap: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Recent Activity
            </Typography>
            
            <Stack spacing={2} mt={2}>
              {[
                { action: 'Created project', name: 'E-commerce Analytics', time: '2 hours ago', status: 'success' },
                { action: 'Shared link created', name: 'Customer Database', time: '5 hours ago', status: 'info' },
                { action: 'Schema modified', name: 'User Profiles', time: '1 day ago', status: 'warning' },
                { action: 'Data exported', name: 'Sales Report', time: '2 days ago', status: 'default' },
              ].map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {item.action}: {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.time}
                    </Typography>
                  </Box>
                  <Chip
                    label={item.action.split(' ')[0]}
                    color={item.status as any}
                    size="small"
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Quick Actions
            </Typography>
            
            <Stack spacing={2} mt={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/projects')}
              >
                Create New Project
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Share />}
                onClick={() => navigate('/projects')}
              >
                Share Database Access
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Storage />}
                onClick={() => navigate('/projects')}
              >
                View All Data
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DashboardPage;
