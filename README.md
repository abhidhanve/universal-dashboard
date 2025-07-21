# Universal Panel

Universal Panel is a comprehensive full-stack application that enables developers to create dynamic forms, manage databases, and provide client access through secure shared links. It serves as a universal interface for MongoDB collections with real-time schema analysis, form generation, and multi-user collaboration features.

## 🚀 Core Features

### Developer Features
- **Project Management**: Create and manage multiple database projects
- **Schema Analysis**: Automatic MongoDB collection schema detection and analysis
- **Shared Link System**: Generate secure links with customizable permissions
- **Profile Management**: Developer profiles with authentication
- **Real-time Updates**: Live schema updates and form regeneration

### Client Features
- **Dynamic Forms**: Auto-generated forms based on database schema
- **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- **Permission-Based Access**: Granular permissions (view, insert, delete, modify schema)
- **Schema Modification**: Add/remove fields with real-time form updates
- **Data Management**: Browse, filter, and manage database records

### Security & Performance
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Permissions**: Fine-grained access control
- **Rate Limiting**: API rate limiting with tier-based quotas
- **Data Validation**: Comprehensive input validation and sanitization
- **Persistent Storage**: Dual database architecture (PostgreSQL + MongoDB)


## 📁 Project Structure

```
universal-panel/
├── client/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── context/       # React Context providers
│   │   └── api/           # API client configuration
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── server/                # Node.js/Bun backend
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Authentication & logging
│   │   ├── routes/        # API routes
│   │   ├── auth/          # Database models & auth
│   │   └── types/         # TypeScript definitions
│   └── package.json       # Backend dependencies
├── services/              # Microservices
│   ├── auth/             # Go authentication service
│   ├── db_access/        # Go database service
│   └── scripts/          # Service management scripts
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Bun** runtime
- **PostgreSQL** database (or Neon account)
- **MongoDB** database (local or cloud)
- **Go** (v1.19 or higher) for microservices

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/universal-panel.git
cd universal-panel
```

### 2. Install Dependencies

**Frontend:**
```bash
cd client
npm install
```

**Backend:**
```bash
cd server
bun install
```

**Services:**
```bash
cd services/auth
go mod download

cd ../db_access  
go mod download
```

### 3. Start the Services

**Start All Services**
```bash
# Start microservices
cd services
./start_services.sh

# Start backend (new terminal)
cd server
bun run dev

# Start frontend (new terminal)  
cd client
npm start
```

## 📖 Usage Guide

### Developer Workflow

1. **Sign Up/Login**: Create a developer account
2. **Create Project**: Add a new MongoDB project with connection details
3. **Analyze Schema**: Let the system analyze your collection structure
4. **Generate Shared Links**: Create secure links with specific permissions
5. **Share with Clients**: Provide links for client access

### Client Access

1. **Access via Link**: Use shared link provided by developer
2. **View Data**: Browse existing records (if permitted)
3. **Add Records**: Submit new data through generated forms
4. **Modify Schema**: Add/remove fields (if permitted)
5. **Manage Data**: Edit or delete records (based on permissions)


**Universal Panel** - Making database management and client access simple and secure.
