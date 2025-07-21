# Universal Panel - Microservices

This directory contains the Go-based microservices that power Universal Panel's backend infrastructure, providing specialized services for authentication, database access, and development utilities.

## 🔒 SECURE ARCHITECTURE OVERVIEW

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Main Server    │    │  Go Services    │
│   (React)       │───▶│   (Bun/Node)     │───▶│   (Data Only)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                │ 🔒 SECURE CONNECTION
                                │ (Credentials managed here only)
                                ▼
                       ┌────────────────┐
                       │   Databases    │
                       │ PostgreSQL +   │
                       │    MongoDB     │
                       └────────────────┘
```

## 🛡 SECURITY MODEL

### Main Server (Credential Manager) 🔐
- **Centralized Database Access**: All MongoDB connections managed here
- **Credential Security**: No credentials stored in microservices  
- **Connection Pooling**: Efficient database connection management
- **Data Proxy**: Fetches data and sends to Go services for processing

### Go Services (Pure Processing) ⚡
- **Stateless Operation**: No database connections or credentials
- **Data Processing**: Receives data from main server, processes, returns results
- **High Performance**: Focus on computation without I/O overhead
- **Secure Communication**: Token-based authentication with main server

## 🚀 Services Overview

### 🗄 Database Access Service 
High-performance data processing service that receives data from the main server, performs analysis and transformations, then returns results. **NO direct database access.**

## 🔄 SECURE WORKFLOW

### Developer Flow:
1. **Login** → Main Server authenticates developer
2. **Create Project** → Developer enters: `mongodb+srv://...`, company, people  
3. **Analyze Schema** → Main Server connects to MongoDB → Fetches sample data → Sends to Go Service for analysis
4. **Generate Form** → Go Service analyzes data → Returns schema → Main Server creates form
5. **Share Link** → Main Server creates: `https://yourapp.com/shared/abc123token`

### Client Flow:
1. **Access Link** → Client visits shared URL  
2. **View Form** → Main Server renders dynamic form based on stored schema
3. **Fill Data** → Client enters data
4. **Submit** → Main Server validates → Connects to MongoDB → Inserts data
5. **Confirmation** → Client sees success message

## 📊 Monitoring & Logging

### Health Checks
Each service exposes health check endpoints:
```
GET /health     # Service health status  
GET /metrics    # Service metrics (optional)
```

### Security Monitoring
- **Audit Logs**: All database access logged
- **Authentication Tracking**: Service-to-service auth monitoring  
- **Anomaly Detection**: Unusual access pattern alerts

## ⚠️ SECURITY COMPLIANCE

✅ **No Credentials in Services**: All database credentials centralized  
✅ **Encrypted Communication**: TLS for all service communication  
✅ **Token Authentication**: Service-to-service auth tokens  
✅ **Audit Logging**: Complete access trail  
✅ **Regular Key Rotation**: Automated credential rotation

