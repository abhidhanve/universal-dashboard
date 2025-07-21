export const frontendUrl =
  process.env.NODE_ENV === "development" || !process.env.FRONTEND_URL
    ? "http://localhost:8081"
    : process.env.FRONTEND_URL;

export const allowedOrigins = [
  frontendUrl, 
  "http://localhost:3000",  // React development server
  "http://localhost:5173",  // Vite development server
  "http://localhost:8080", 
  "http://localhost:8081"
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
