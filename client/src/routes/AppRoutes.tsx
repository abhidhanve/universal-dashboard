import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';
import DashboardLayout from '../layouts/DashboardLayout';
import ProjectsPage from '../pages/ProjectsPage';
import ProjectDetailPage from '../pages/ProjectDetailPage';
import ClientAccessPage from '../pages/ClientAccessPage';
import ProfilePage from '../pages/ProfilePage';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Public routes - always accessible */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      
      {/* Client access route (no auth needed) */}
      <Route path="/access/:token" element={<ClientAccessPage />} />
      
      {/* Protected routes - only accessible when authenticated */}
      {isAuthenticated ? (
        <Route path="/*" element={
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/dashboard" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
          </DashboardLayout>
        } />
      ) : (
        /* Redirect unauthenticated users to login for protected routes */
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

export default AppRoutes;
