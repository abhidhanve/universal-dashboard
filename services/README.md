# UniversalPanel Services - Method 3: Direct Database Connection

This directory contains the microservices for UniversalPanel's **Method 3 implementation** - Direct Database Connection approach.

## Architecture Overview

Method 3 provides the simplest and most direct approach where UniversalPanel connects directly to your MongoDB database, automatically detects schemas, and provides admin interface without requiring changes to your existing application.

## Services

### 1. Database Access Service (`/services/db_access/`) - PRIMARY SERVICE

**Port: 9081**

The core service that handles all database operations, schema detection, and data management.

#### Features:

- **Automatic Schema Detection** - Analyzes your existing MongoDB collections
- **Direct Database Operations** - CRUD operations without API layer
- **Collection Introspection** - Discovers document structures automatically
- **Database Allocation** - Creates isolated database spaces
- **Admin Interface Data** - Provides data for frontend forms

#### Current Endpoints:

- `GET /ping` - Health check
- `GET /entries` - Get database entries
- `POST /allocate` - Allocate database for user  
- `POST /entry` - Create new entry

#### NEW Method 3 Endpoints (to be implemented):

- `GET /detect-schema/:db/:collection` - Auto-detect collection schema
- `GET /collections/:db` - List all collections in database
- `POST /analyze-documents` - Analyze document structures
- `GET /sample-data/:db/:collection` - Get sample documents
- `PUT /entry/:db/:collection/:id` - Update specific entry
- `DELETE /entry/:db/:collection/:id` - Delete specific entry

#### Environment Variables:

```
MONGODB_URI="mongodb://marsian:6450@127.0.0.1:27017/"
MONGODB_HOSTNAME="127.0.0.1:27017"
PORT=9081
```

### 2. Mock Data Generation Service (`/services/mockdata/`) - TESTING ONLY

**Port: 9083**

Used for testing and demonstration purposes only.

## Method 3 Workflow

```
Your Existing App:
Your Frontend → Your Backend → Your MongoDB Database
                                      ↑
UniversalPanel (Independent):         |
Admin Interface → DB Access Service → (Shared Database)
```

1. **Schema Detection**: DB Access Service connects to your MongoDB and automatically detects collection schemas
2. **Admin Interface**: Provides CRUD interface based on detected schemas  
3. **Direct Operations**: Performs database operations directly without affecting your existing APIs
4. **Real-time Sync**: Changes are immediately visible in your main application

## Running Method 3 Services

1. Install Go dependencies:

   ```bash
   cd services/db_access && go mod tidy
   cd ../mockdata && go mod tidy
   ```

2. Start services:

   ```bash
   ./start_services.sh
   ```

   Or manually:
   ```bash
   # Terminal 1 - DB Access Service (Primary)
   cd services/db_access && go run main.go

   # Terminal 2 - Mock Data Service (Testing)
   cd services/mockdata && go run main.go
   ```

## Architecture

Services follow this structure:

```
services/
├── db_access/           # Primary service for Method 3
│   ├── main.go         # Entry point
│   ├── go.mod          # Go module
│   ├── app.env         # Environment variables  
│   ├── configs/
│   │   └── env.go      # Configuration loader
│   └── src/
│       ├── handlers/   # HTTP handlers
│       ├── helpers/    # Utility functions
│       └── mongodb/    # Database connection
└── mockdata/           # Testing service
    ├── main.go         # Entry point
    ├── go.mod          # Go module
    ├── configs/
    │   └── env.go      # Configuration loader
    └── src/
        ├── handlers/   # HTTP handlers
        ├── helpers/    # Utility functions
        └── generators/ # Data generators
```

## Method 3 Benefits

- ✅ **No API Changes**: Your existing application remains untouched
- ✅ **Automatic Schema Detection**: No manual schema definition needed
- ✅ **Real-time Sync**: Changes visible immediately in your app
- ✅ **Lightweight**: Minimal overhead on your system
- ✅ **Safe**: Read-only schema detection, careful write operations
- ✅ **Flexible**: Works with any MongoDB schema structure
