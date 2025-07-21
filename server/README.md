# 🚀 Universal Panel - Method 3 Server

**Direct Database Connection Proxy Server**

This server implements **Method 3** of the Universal Panel system, providing a simple Express.js proxy layer between the React frontend and the Go microservices for direct database operations.

## 🏗️ **Architecture**

```
Frontend (React)
    ↓ HTTP API calls
Express Server (Proxy)
    ↓ Microservice calls  
Go Services (db_access + mockdata)
    ↓ Direct connection
MongoDB Database
```

## 🎯 **Method 3 Features**

- ✅ **Direct Database Access** - No user authentication or ownership
- ✅ **Schema Detection** - Automatic field type analysis 
- ✅ **CRUD Operations** - Create, Read, Update, Delete entries
- ✅ **Collection Management** - List and browse collections
- ✅ **Mock Data Generation** - Test data with templates
- ✅ **Real-time Proxy** - Direct passthrough to microservices

## 🛠️ **Technology Stack**

- **Runtime**: Bun.js
- **Framework**: Express.js + TypeScript
- **HTTP Client**: Axios
- **Microservices**: Go (Gin framework)
- **Database**: MongoDB (direct connection)

## 🚀 **Quick Start**

### **Prerequisites**
- Bun.js installed
- Go microservices running (ports 9081, 9083)
- MongoDB instance available

### **Installation**
```bash
# Install dependencies
bun install

# Copy environment configuration
cp .env.example .env

# Start development server
bun run dev
```

The server will start on **http://localhost:9090**

## 📡 **API Endpoints**

### **Health & Info**
- `GET /` - Server information and endpoints
- `GET /health` - Server health check
- `GET /api/health` - API health check

### **Database Management**
- `GET /api/databases` - Check database service status
- `POST /api/databases/connect` - Test database connection
- `GET /api/databases/:db/collections` - List collections

### **Schema Detection** 
- `GET /api/schema/:db/:collection` - Detect collection schema
- `POST /api/schema/analyze` - Analyze documents
- `GET /api/schema/:db/:collection/sample` - Get sample data

### **CRUD Operations**
- `GET /api/data/:db/:collection` - Get entries (with pagination)
- `POST /api/data/:db/:collection` - Create new entry
- `PUT /api/data/:db/:collection/:id` - Update entry
- `DELETE /api/data/:db/:collection/:id` - Delete entry

### **Mock Data Generation**
- `POST /api/mockdata/generate` - Generate data with custom schema
- `GET /api/mockdata/templates` - List available templates
- `GET /api/mockdata/templates/:template` - Get template schema
- `GET /api/mockdata/generate/:template` - Generate data from template
- `POST /api/mockdata/validate` - Validate schema

## 🔧 **Configuration**

### **Environment Variables**
```bash
PORT=9090                           # Server port
NODE_ENV=development               # Environment
FRONTEND_URL=http://localhost:5173  # React app URL

# Microservices
DB_ACCESS_SERVICE=http://127.0.0.1:9081   # Database service
MOCKDATA_SERVICE=http://127.0.0.1:9083    # Mock data service
```

## 🎯 **Method 3 Differences**

Unlike Methods 1 & 2, this server:

❌ **Removed:**
- User authentication & JWT tokens
- Database ownership models
- Prisma ORM & PostgreSQL 
- Complex artifact/collection hierarchies
- User management routes

✅ **Added:**
- Simple proxy functionality
- Direct microservice integration  
- Schema detection endpoints
- Mock data generation
- Real-time database operations

## 📊 **Development**

### **Scripts**
- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run build` - Build for production
- `bun test` - Run tests

### **Project Structure**
```
server/
├── index.ts                 # Main server file
├── config.ts               # Configuration
├── package.json            # Dependencies
├── tsconfig.json          # TypeScript config
├── .env.example           # Environment template
└── src/
    ├── routes/
    │   ├── api.ts         # Main API router
    │   ├── database.ts    # Database management
    │   ├── schema.ts      # Schema detection  
    │   ├── data.ts        # CRUD operations
    │   └── mockdata.ts    # Mock data generation
    └── types/
        └── method3.ts     # TypeScript types
```

## 🔗 **Microservices Integration**

### **DB Access Service** (Port 9081)
- Schema detection and analysis
- Collection management
- CRUD operations
- Database connections

### **Mock Data Service** (Port 9083)  
- Test data generation
- Schema templates
- Data validation

## 🧪 **Testing**

### **Health Check**
```bash
curl http://localhost:9090/health
```

### **Database Connection Test**
```bash
curl -X POST http://localhost:9090/api/databases/connect \
  -H "Content-Type: application/json" \
  -d '{"database": "test_db"}'
```

### **Schema Detection**
```bash
curl http://localhost:9090/api/schema/test_db/users
```

### **Mock Data Generation**
```bash
curl -X POST http://localhost:9090/api/mockdata/generate \
  -H "Content-Type: application/json" \
  -d '{"schema": {"name": "string", "email": "email"}, "count": 5}'
```

## 📚 **Documentation**

- **API Documentation**: See individual route files for detailed endpoint specs
- **Microservices**: Check `services/` directory for Go service documentation  
- **Frontend Integration**: Compatible with React frontend on port 5173

## 🎯 **Ready for Method 3 Development**

This server is specifically designed for **Method 3: Direct Database Connection** and provides a clean, simple proxy layer for the React frontend to interact with the Go microservices and MongoDB database directly.

**Next Steps:**
1. ✅ Server implementation complete
2. 🔧 Test with running microservices  
3. 🔗 Integrate with React frontend
4. 📊 Implement UI components for Method 3
