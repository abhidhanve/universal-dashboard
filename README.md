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


### Architecture Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Universal Panel System                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────┐    ┌─────────────────────┐    ┌─────────────────────────────┐
│                   │    │                     │    │                             │
│   React Client    │◄──►│  Bun/Node.js        │◄──►│     Go Microservice         │
│                   │    │   Main Server       │    │                             │
│  • UI/UX          │    │                     │    │  • Heavy DB Operations      │
│  • Form Rendering │    │  • Authentication   │    │  • Schema Analysis          │
│  • User Actions   │    │  • JWT Tokens       │    │  • CRUD Operations          │
│                   │    │  • MongoDB URIs     │    │  • Performance Optimized    │
└───────────────────┘    │  • Link Generation. │    └─────────────────────────────┘
                         │  • Access Control   │                 │
                         │  • API Gateway      │                 │
                         └─────────────────────┘                 │
                                   │                             │
                        ┌──────────▼─────────┐         ┌─────────▼─────────┐
                        │                    │         │                   │
                        │   PostgreSQL       │         │     MongoDB       │
                        │   (Auth Database)  │         │  (Data Storage)   │
                        │                    │         │                   │
                        │  • User Accounts   │         │  • Collections    │
                        │  • Projects        │         │  • Documents      │
                        │  • Shared Links    │         │  • Schemas        │
                        │  • Permissions     │         │  • User Data      │
                        └────────────────────┘         └───────────────────┘
```

### User Journey Flow

#### 🔧 Developer Workflow
```
1. 👨‍💻 Developer Login
   ↓
2. 🗂️ Create Project (Enter MongoDB URI)
   ↓
3. 🔍 Schema Analysis (Go service analyzes collections)
   ↓
4. 📝 Form Generation (Main server generates dynamic forms)
   ↓
5. 🔗 Generate Shared Link (Custom permissions)
   ↓
6. 📤 Share with Clients
```

#### 👥 Client Workflow  
```
1. 🌐 Access Shared Link
   ↓
2. 📋 View Dynamic Form (Generated from schema)
   ↓
3. ✏️ Fill & Submit Data
   ↓
4. 🔄 Real-time Operations (CRUD via Go service)
   ↓
5. 💾 Data Stored in MongoDB
   ↓
6. ✅ Confirmation to User
```

#### 🔒 Security & Data Flow
```
Client Request → Main Server (Validates JWT) → Go Service (DB Operations) → MongoDB
     ↑                    │                          │                      │
     └── Secure Response ←┴── Permission Check ←─────┴── Data Validation ←──┘
```

## 📁 Project Structure

```
universal-panel/
├── client/                    # React TypeScript frontend
│   ├── src/
│   │   ├── api/              # API client configuration
│   │   ├── context/          # React Context providers
│   │   ├── layouts/          # Layout components
│   │   ├── pages/            # Application pages
│   │   ├── routes/           # Client-side routing
│   │   ├── theme/            # UI theme configuration
│   │   ├── App.tsx           # Main application component
│   │   └── index.tsx         # Application entry point
│   ├── public/               # Static assets
│   ├── build/                # Production build output
│   └── package.json          # Frontend dependencies
├── server/                    # Node.js/Bun backend
│   ├── src/
│   │   ├── auth/             # Authentication logic
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Authentication & logging
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic services
│   │   ├── types/            # TypeScript definitions
│   │   └── utils/            # Utility functions
│   ├── .env.example          # Environment template
│   ├── config.ts             # Application configuration
│   ├── index.ts              # Server entry point
│   └── package.json          # Backend dependencies
├── services/                  # Go microservices
│   ├── db_access/            # Database operations service
│   │   ├── src/
│   │   │   ├── controllers/  # HTTP request handlers
│   │   │   ├── models/       # Data models
│   │   │   ├── routes/       # Service routes
│   │   │   └── services/     # Database operations
│   │   ├── configs/          # Configuration management
│   │   ├── app.env           # Environment variables
│   │   ├── main.go           # Service entry point
│   │   └── Dockerfile        # Container configuration
│   ├── start_services.sh     # Start all microservices
│   └── stop_services.sh      # Stop all microservices
├── config.json               # Global configuration
└── README.md                 # This file
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
git clone https://github.com/abhidhanve/universal-panel.git
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
cd services/db_access
go mod tidy
```

### 3. Start the Application

**Start Database Service:**
```bash
cd services
chmod +x start_services.sh
./start_services.sh
```

**Start Backend Server:**
```bash
cd server
bun run dev

```

**Start Frontend:**
```bash
cd client
npm start  

```

**Universal Panel** - Making database management and client access simple and secure.
