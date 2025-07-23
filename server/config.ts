export const frontendUrl =
  process.env.NODE_ENV === "development" || !process.env.FRONTEND_URL
    ? "http://localhost:8081"
    : process.env.FRONTEND_URL;

export const allowedOrigins = [
  frontendUrl, 
  // Development origins
  "http://localhost:3000",  // React development server
  "http://localhost:3001",  // React development server (alternative port)
  "http://localhost:5173",  // Vite development server
  "http://localhost:8080", 
  "http://localhost:8081",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173",
  // Production frontend URLs (Vercel patterns)
  "https://universal-panel-g5i8.vercel.app",
  "https://universal-panel-client.vercel.app",
  "https://universal-panel.vercel.app", 
  "https://universal-dashboard.vercel.app",
  // Add wildcard for vercel preview deployments (you'll need to add specific URLs)
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

// Clean Workflow Configuration
export const universalPanelConfig = {
  // Direct MongoDB connection configuration
  mongodb: {
    connectionTimeout: 10000,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  },
  
  // JWT Configuration
  jwt: {
    expiresIn: '24h',
    algorithm: 'HS256' as const
  },
  
  // Shared Link Configuration
  sharedLinks: {
    tokenLength: 32,
    defaultExpiryDays: 30
  }
};
