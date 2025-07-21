package services

import (
	"context"
	"fmt"
	"time"

	"github.com/abhidhanve/universal-dashboard/services/db_access/src/models"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/mongodb"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/utils"
	"go.mongodb.org/mongo-driver/bson"
)

type DatabaseService struct{}

func NewDatabaseService() *DatabaseService {
	return &DatabaseService{}
}

// AllocateDatabase creates a new database with user credentials or tests existing MongoDB URI
func (s *DatabaseService) AllocateDatabase(req models.DatabaseAllocationRequest) (*models.DatabaseAllocationResponse, error) {
	// Method 3: Direct MongoDB URI connection (no user creation needed)
	if req.MongoURI != "" {
		return s.connectWithMongoURI(req)
	}

	// Original method: Create users (for local MongoDB)
	return s.allocateWithUserCreation(req)
}

// connectWithMongoURI handles Method 3: Direct connection using MongoDB URI
func (s *DatabaseService) connectWithMongoURI(req models.DatabaseAllocationRequest) (*models.DatabaseAllocationResponse, error) {
	// Validate database name
	if !utils.IsValidDBName(req.DBName) {
		return nil, fmt.Errorf("invalid database name: %s", req.DBName)
	}

	// Connect to MongoDB using the provided URI
	mongoClient, err := mongodb.ConnectWithURI(req.MongoURI)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %v", err)
	}
	defer mongoClient.Disconnect(context.Background())

	// Test connection with the provided MongoDB URI
	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.MediumTimeout)
	defer cancel()

	// List existing databases to validate if the requested database exists
	databases, err := mongoClient.ListDatabaseNames(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list databases: %v", err)
	}

	// Check if the requested database exists
	dbExists := false
	for _, dbName := range databases {
		if dbName == req.DBName {
			dbExists = true
			break
		}
	}

	// If database doesn't exist, return an error with available databases
	if !dbExists {
		return nil, fmt.Errorf("database '%s' does not exist. Available databases: %v", req.DBName, databases)
	}

	// Test database access
	db := mongoClient.Database(req.DBName)

	// Try to ping the database
	err = db.RunCommand(ctx, bson.D{{"ping", 1}}).Err()
	if err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	// Test write access by creating a test collection
	testCollection := db.Collection("_connection_test")
	_, err = testCollection.InsertOne(ctx, bson.M{"test": "connection", "timestamp": time.Now()})
	if err != nil {
		return nil, fmt.Errorf("failed to test write access: %v", err)
	}

	// Clean up test document
	testCollection.DeleteMany(ctx, bson.M{"test": "connection"})

	// Create response
	response := &models.DatabaseAllocationResponse{
		Message:  fmt.Sprintf("Successfully connected to existing database '%s' using provided MongoDB URI", req.DBName),
		Code:     200,
		URI:      req.MongoURI,
		Database: req.DBName,
		Username: "external", // Using external credentials from URI
	}

	return response, nil
}

// allocateWithUserCreation handles the original method with user creation
func (s *DatabaseService) allocateWithUserCreation(req models.DatabaseAllocationRequest) (*models.DatabaseAllocationResponse, error) {
	// Validate input
	if !utils.IsValidDBName(req.DBName) {
		return nil, fmt.Errorf("invalid database name: %s", req.DBName)
	}

	if !utils.IsValidUsername(req.UserName) {
		return nil, fmt.Errorf("invalid username: %s", req.UserName)
	}

	if !utils.IsValidPassword(req.Password) {
		return nil, fmt.Errorf("invalid password: must be 6-128 characters")
	}

	// Get MongoDB client
	client := mongodb.GetClient()
	db := client.Database(req.DBName)

	// Create user with readWrite permissions
	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.ShortTimeout)
	defer cancel()

	err := db.RunCommand(ctx, bson.D{
		{Key: "createUser", Value: req.UserName},
		{Key: "pwd", Value: req.Password},
		{Key: "roles", Value: bson.A{
			bson.D{
				{Key: "role", Value: "readWrite"},
				{Key: "db", Value: req.DBName},
			},
		}},
	}).Err()

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %v", err)
	}

	// ⚠️ SECURITY: This function is deprecated for security reasons
	// Database user creation should be handled by main server, not microservices
	// MongoDB hostname and credentials should not be stored in microservice environment
	return nil, fmt.Errorf("database user creation deprecated: should be handled by main server for security")
}

// TestDatabaseConnection tests if a database is accessible
func (s *DatabaseService) TestDatabaseConnection(dbName string) error {
	if !utils.IsValidDBName(dbName) {
		return fmt.Errorf("invalid database name: %s", dbName)
	}

	client := mongodb.GetClient()
	db := client.Database(dbName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.ShortTimeout)
	defer cancel()

	// Try to ping the database
	err := db.Client().Ping(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to connect to database %s: %v", dbName, err)
	}

	return nil
}

// GetDatabaseInfo retrieves basic information about a database
func (s *DatabaseService) GetDatabaseInfo(dbName string) (map[string]interface{}, error) {
	if !utils.IsValidDBName(dbName) {
		return nil, fmt.Errorf("invalid database name: %s", dbName)
	}

	client := mongodb.GetClient()
	db := client.Database(dbName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.ShortTimeout)
	defer cancel()

	// Get collections count
	collections, err := db.ListCollectionNames(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list collections: %v", err)
	}

	info := map[string]interface{}{
		"database":          dbName,
		"collections_count": len(collections),
		"collections":       collections,
		"status":            "active",
	}

	return info, nil
}
