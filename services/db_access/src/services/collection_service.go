package services

import (
	"context"
	"fmt"

	"github.com/abhidhanve/universal-dashboard/services/db_access/src/models"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/mongodb"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type CollectionService struct{}

func NewCollectionService() *CollectionService {
	return &CollectionService{}
}

// ListCollections retrieves all collections in a database with their document counts
func (s *CollectionService) ListCollections(dbName string) (*models.CollectionsListResponse, error) {
	if !utils.IsValidDBName(dbName) {
		return nil, fmt.Errorf("invalid database name: %s", dbName)
	}

	client := mongodb.GetClient()
	db := client.Database(dbName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.ShortTimeout)
	defer cancel()

	// Get collection names
	collections, err := db.ListCollectionNames(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list collections: %v", err)
	}

	// Get collection info with document counts
	var collectionsInfo []models.CollectionInfo
	for _, collName := range collections {
		if !utils.IsValidCollectionName(collName) {
			continue // Skip invalid collection names
		}

		coll := db.Collection(collName)
		count, err := coll.CountDocuments(ctx, bson.M{})
		if err != nil {
			// Log error but continue with 0 count
			count = 0
		}

		collectionsInfo = append(collectionsInfo, models.CollectionInfo{
			Name:          collName,
			DocumentCount: count,
		})
	}

	response := &models.CollectionsListResponse{
		Message:     "Collections listed successfully",
		Database:    dbName,
		Collections: collectionsInfo,
		Total:       len(collectionsInfo),
		Code:        0,
	}

	return response, nil
}

// DetectSchema analyzes a collection and detects its schema structure
func (s *CollectionService) DetectSchema(dbName, collectionName string) (*models.SchemaDetectionResponse, error) {
	if !utils.IsValidDBName(dbName) {
		return nil, fmt.Errorf("invalid database name: %s", dbName)
	}

	if !utils.IsValidCollectionName(collectionName) {
		return nil, fmt.Errorf("invalid collection name: %s", collectionName)
	}

	client := mongodb.GetClient()
	db := client.Database(dbName)
	collection := db.Collection(collectionName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.MediumTimeout)
	defer cancel()

	// Get sample documents for schema analysis
	cursor, err := collection.Find(ctx, bson.M{}, options.Find().SetLimit(100))
	if err != nil {
		return nil, fmt.Errorf("failed to query collection: %v", err)
	}
	defer cursor.Close(ctx)

	var documents []bson.M
	if err = cursor.All(ctx, &documents); err != nil {
		return nil, fmt.Errorf("failed to decode documents: %v", err)
	}

	// Handle empty collection
	if len(documents) == 0 {
		return &models.SchemaDetectionResponse{
			Message:     "Collection is empty",
			Database:    dbName,
			Collection:  collectionName,
			Schema:      make(map[string]models.SchemaField),
			SampleCount: 0,
			TotalFields: 0,
			Code:        0,
		}, nil
	}

	// Analyze schema
	schema := utils.AnalyzeSchema(documents)

	response := &models.SchemaDetectionResponse{
		Message:     "Schema detected successfully",
		Database:    dbName,
		Collection:  collectionName,
		Schema:      schema,
		SampleCount: len(documents),
		TotalFields: len(schema),
		Code:        0,
	}

	return response, nil
}

// GetSampleData retrieves sample documents from a collection
func (s *CollectionService) GetSampleData(dbName, collectionName string, limit int) (*models.SampleDataResponse, error) {
	if !utils.IsValidDBName(dbName) {
		return nil, fmt.Errorf("invalid database name: %s", dbName)
	}

	if !utils.IsValidCollectionName(collectionName) {
		return nil, fmt.Errorf("invalid collection name: %s", collectionName)
	}

	// Validate and normalize limit
	if limit < 1 || limit > 100 {
		limit = 10
	}

	client := mongodb.GetClient()
	db := client.Database(dbName)
	collection := db.Collection(collectionName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.ShortTimeout)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{}, options.Find().SetLimit(int64(limit)))
	if err != nil {
		return nil, fmt.Errorf("failed to query collection: %v", err)
	}
	defer cursor.Close(ctx)

	var documents []bson.M
	if err = cursor.All(ctx, &documents); err != nil {
		return nil, fmt.Errorf("failed to decode documents: %v", err)
	}

	response := &models.SampleDataResponse{
		Message:    "Sample data retrieved successfully",
		Database:   dbName,
		Collection: collectionName,
		Data:       documents,
		Count:      len(documents),
		Code:       0,
	}

	return response, nil
}

// AnalyzeMultipleCollections analyzes document structures for multiple collections
func (s *CollectionService) AnalyzeMultipleCollections(req models.DocumentAnalysisRequest) (*models.DocumentAnalysisResponse, error) {
	if !utils.IsValidDBName(req.DBName) {
		return nil, fmt.Errorf("invalid database name: %s", req.DBName)
	}

	if len(req.Collections) == 0 {
		return nil, fmt.Errorf("no collections specified for analysis")
	}

	client := mongodb.GetClient()
	db := client.Database(req.DBName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.LongTimeout)
	defer cancel()

	results := make(map[string]models.DocumentAnalysisResult)

	// Analyze each collection
	for _, collName := range req.Collections {
		if !utils.IsValidCollectionName(collName) {
			results[collName] = models.DocumentAnalysisResult{
				Error: fmt.Sprintf("Invalid collection name: %s", collName),
			}
			continue
		}

		collection := db.Collection(collName)

		// Get sample documents
		cursor, err := collection.Find(ctx, bson.M{}, options.Find().SetLimit(50))
		if err != nil {
			results[collName] = models.DocumentAnalysisResult{
				Error: fmt.Sprintf("Failed to query collection: %v", err),
			}
			cursor.Close(ctx)
			continue
		}

		var documents []bson.M
		if err = cursor.All(ctx, &documents); err != nil {
			results[collName] = models.DocumentAnalysisResult{
				Error: fmt.Sprintf("Failed to decode documents: %v", err),
			}
			cursor.Close(ctx)
			continue
		}
		cursor.Close(ctx)

		// Handle empty collection
		if len(documents) == 0 {
			results[collName] = models.DocumentAnalysisResult{
				Message: "Collection is empty",
				Schema:  make(map[string]models.SchemaField),
			}
			continue
		}

		// Analyze schema
		schema := utils.AnalyzeSchema(documents)
		results[collName] = models.DocumentAnalysisResult{
			Schema:      schema,
			SampleCount: len(documents),
			FieldCount:  len(schema),
		}
	}

	response := &models.DocumentAnalysisResponse{
		Message:  "Document analysis completed",
		Database: req.DBName,
		Results:  results,
		Code:     0,
	}

	return response, nil
}

// Method3DetectSchema analyzes a collection schema using external MongoDB URI (Method 3)
func (s *CollectionService) Method3DetectSchema(req models.Method3SchemaRequest) (*models.SchemaDetectionResponse, error) {
	// Validate inputs
	if !utils.IsValidDBName(req.DatabaseName) {
		return nil, fmt.Errorf("invalid database name: %s", req.DatabaseName)
	}

	if !utils.IsValidCollectionName(req.CollectionName) {
		return nil, fmt.Errorf("invalid collection name: %s", req.CollectionName)
	}

	// Connect to external MongoDB using provided URI
	client, err := mongodb.ConnectWithURI(req.MongoURI)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to external MongoDB: %v", err)
	}
	defer client.Disconnect(context.Background())

	// Get the database
	db := client.Database(req.DatabaseName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.MediumTimeout)
	defer cancel()

	// Check if database exists by listing databases
	databases, err := client.ListDatabaseNames(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list databases: %v", err)
	}

	databaseExists := false
	for _, dbName := range databases {
		if dbName == req.DatabaseName {
			databaseExists = true
			break
		}
	}

	if !databaseExists {
		return &models.SchemaDetectionResponse{
			Message:     fmt.Sprintf("Database '%s' not found", req.DatabaseName),
			Database:    req.DatabaseName,
			Collection:  req.CollectionName,
			Schema:      make(map[string]models.SchemaField),
			SampleCount: 0,
			TotalFields: 0,
			Code:        404,
		}, nil
	}

	// Check if collection exists in the database
	collections, err := db.ListCollectionNames(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list collections: %v", err)
	}

	collectionExists := false
	for _, collName := range collections {
		if collName == req.CollectionName {
			collectionExists = true
			break
		}
	}

	if !collectionExists {
		return &models.SchemaDetectionResponse{
			Message:     fmt.Sprintf("Collection '%s' not found in database '%s'", req.CollectionName, req.DatabaseName),
			Database:    req.DatabaseName,
			Collection:  req.CollectionName,
			Schema:      make(map[string]models.SchemaField),
			SampleCount: 0,
			TotalFields: 0,
			Code:        404,
		}, nil
	}

	// Get the collection
	collection := db.Collection(req.CollectionName)

	// Check total document count
	totalCount, err := collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to count documents: %v", err)
	}

	// Handle empty collection (exists but has no documents)
	if totalCount == 0 {
		return &models.SchemaDetectionResponse{
			Message:     fmt.Sprintf("Collection '%s' exists but is empty", req.CollectionName),
			Database:    req.DatabaseName,
			Collection:  req.CollectionName,
			Schema:      make(map[string]models.SchemaField),
			SampleCount: 0,
			TotalFields: 0,
			Code:        0,
		}, nil
	}

	// Get sample documents for schema analysis
	cursor, err := collection.Find(ctx, bson.M{}, options.Find().SetLimit(100))
	if err != nil {
		return nil, fmt.Errorf("failed to query collection: %v", err)
	}
	defer cursor.Close(ctx)

	var documents []bson.M
	if err = cursor.All(ctx, &documents); err != nil {
		return nil, fmt.Errorf("failed to decode documents: %v", err)
	}

	// Analyze schema from documents with enhanced metadata
	schema := utils.AnalyzeEnhancedSchema(documents, int(totalCount))

	return &models.SchemaDetectionResponse{
		Message:     "Schema detected successfully using external MongoDB URI",
		Database:    req.DatabaseName,
		Collection:  req.CollectionName,
		Schema:      schema,
		SampleCount: len(documents),
		TotalFields: len(schema),
		Code:        0,
	}, nil
}

// Method3InsertData inserts data directly into external MongoDB (Method 3)
func (s *CollectionService) Method3InsertData(req models.Method3DataInsertRequest) (*models.CreateDocumentResponse, error) {
	// Validate inputs
	if !utils.IsValidDBName(req.DatabaseName) {
		return nil, fmt.Errorf("invalid database name: %s", req.DatabaseName)
	}

	if !utils.IsValidCollectionName(req.CollectionName) {
		return nil, fmt.Errorf("invalid collection name: %s", req.CollectionName)
	}

	// Connect to external MongoDB using provided URI
	client, err := mongodb.ConnectWithURI(req.MongoURI)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to external MongoDB: %v", err)
	}
	defer client.Disconnect(context.Background())

	// Get the database and collection
	db := client.Database(req.DatabaseName)
	collection := db.Collection(req.CollectionName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.ShortTimeout)
	defer cancel()

	// Insert the document
	result, err := collection.InsertOne(ctx, req.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to insert document: %v", err)
	}

	return &models.CreateDocumentResponse{
		Message:    "Document created successfully in external MongoDB",
		Database:   req.DatabaseName,
		Collection: req.CollectionName,
		DocumentID: result.InsertedID,
		Code:       0,
	}, nil
}

// Method3GetData retrieves data from external MongoDB (Method 3)
func (s *CollectionService) Method3GetData(req models.Method3DataRequest) (*models.CollectionEntriesResponse, error) {
	// Validate inputs
	if !utils.IsValidDBName(req.DatabaseName) {
		return nil, fmt.Errorf("invalid database name: %s", req.DatabaseName)
	}

	if !utils.IsValidCollectionName(req.CollectionName) {
		return nil, fmt.Errorf("invalid collection name: %s", req.CollectionName)
	}

	// Connect to external MongoDB using provided URI
	client, err := mongodb.ConnectWithURI(req.MongoURI)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to external MongoDB: %v", err)
	}
	defer client.Disconnect(context.Background())

	// Get the database and collection
	db := client.Database(req.DatabaseName)
	collection := db.Collection(req.CollectionName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.ShortTimeout)
	defer cancel()

	// Get all documents
	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to query collection: %v", err)
	}
	defer cursor.Close(ctx)

	var documents []bson.M
	if err = cursor.All(ctx, &documents); err != nil {
		return nil, fmt.Errorf("failed to decode documents: %v", err)
	}

	return &models.CollectionEntriesResponse{
		Message:    "Entries retrieved successfully from external MongoDB",
		Database:   req.DatabaseName,
		Collection: req.CollectionName,
		Data:       documents,
		Count:      len(documents),
		TotalCount: int64(len(documents)),
		Limit:      50,
		Skip:       0,
		HasMore:    false,
		Code:       0,
	}, nil
}

// Method3DeleteData deletes data from external MongoDB (Method 3)
func (s *CollectionService) Method3DeleteData(req models.Method3DataRequest) (*models.DeleteDocumentResponse, error) {
	// Validate inputs
	if !utils.IsValidDBName(req.DatabaseName) {
		return nil, fmt.Errorf("invalid database name: %s", req.DatabaseName)
	}

	if !utils.IsValidCollectionName(req.CollectionName) {
		return nil, fmt.Errorf("invalid collection name: %s", req.CollectionName)
	}

	if req.DocumentID == "" {
		return nil, fmt.Errorf("document ID is required for deletion")
	}

	// Connect to external MongoDB using provided URI
	client, err := mongodb.ConnectWithURI(req.MongoURI)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to external MongoDB: %v", err)
	}
	defer client.Disconnect(context.Background())

	// Get the database and collection
	db := client.Database(req.DatabaseName)
	collection := db.Collection(req.CollectionName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.ShortTimeout)
	defer cancel()

	// Convert string ID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(req.DocumentID)
	if err != nil {
		return nil, fmt.Errorf("invalid document ID: %v", err)
	}

	// Delete the document
	result, err := collection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		return nil, fmt.Errorf("failed to delete document: %v", err)
	}

	if result.DeletedCount == 0 {
		return nil, fmt.Errorf("document not found")
	}

	return &models.DeleteDocumentResponse{
		Message:      "Document deleted successfully from external MongoDB",
		Database:     req.DatabaseName,
		Collection:   req.CollectionName,
		DocumentID:   req.DocumentID,
		DeletedCount: result.DeletedCount,
		Code:         0,
	}, nil
}

// Method3AddSchemaFields adds new fields to a collection's schema using external MongoDB URI
func (s *CollectionService) Method3AddSchemaFields(req models.Method3SchemaModificationRequest) (*models.Method3SchemaModificationResponse, error) {
	if req.DatabaseName == "" {
		return nil, fmt.Errorf("database name is required")
	}
	if req.CollectionName == "" {
		return nil, fmt.Errorf("collection name is required")
	}
	if req.NewFields == nil || len(req.NewFields) == 0 {
		return nil, fmt.Errorf("new fields are required")
	}

	// Connect to external MongoDB using Method 3
	client, err := mongodb.ConnectWithURI("mongodb+srv://abhidhanve:z4dJr5ZGGqBGE3QL@cluster0.whtrr4k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
	if err != nil {
		return nil, fmt.Errorf("failed to connect to external MongoDB: %v", err)
	}
	defer client.Disconnect(context.TODO())

	// Get the collection
	collection := client.Database(req.DatabaseName).Collection(req.CollectionName)

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.MediumTimeout)
	defer cancel()

	// For MongoDB, we don't modify the schema directly since it's schema-less
	// Instead, we can add sample documents with the new fields set to null
	// Or simply return success since adding fields to a document doesn't require schema changes
	// MongoDB will automatically accept new fields when documents are inserted/updated

	// We'll just validate that the collection exists
	count, err := collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to access collection: %v", err)
	}

	return &models.Method3SchemaModificationResponse{
		Message: fmt.Sprintf("Schema fields can be added to collection '%s' (contains %d documents). MongoDB will accept new fields when documents are inserted/updated.", req.CollectionName, count),
		Success: true,
	}, nil
}

// Method3RemoveSchemaField removes a field from a collection's documents using external MongoDB URI
func (s *CollectionService) Method3RemoveSchemaField(req models.Method3SchemaFieldRemovalRequest) (*models.Method3SchemaModificationResponse, error) {
	if req.DatabaseName == "" {
		return nil, fmt.Errorf("database name is required")
	}
	if req.CollectionName == "" {
		return nil, fmt.Errorf("collection name is required")
	}
	if req.FieldName == "" {
		return nil, fmt.Errorf("field name is required")
	}
	if req.FieldName == "_id" {
		return nil, fmt.Errorf("cannot remove the _id field")
	}

	// Connect to external MongoDB using Method 3
	client, err := mongodb.ConnectWithURI("mongodb+srv://abhidhanve:z4dJr5ZGGqBGE3QL@cluster0.whtrr4k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
	if err != nil {
		return nil, fmt.Errorf("failed to connect to external MongoDB: %v", err)
	}
	defer client.Disconnect(context.TODO())

	// Get the collection
	collection := client.Database(req.DatabaseName).Collection(req.CollectionName)

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.LongTimeout)
	defer cancel()

	// Remove the field from all documents in the collection
	filter := bson.M{req.FieldName: bson.M{"$exists": true}}
	update := bson.M{"$unset": bson.M{req.FieldName: ""}}

	result, err := collection.UpdateMany(ctx, filter, update)
	if err != nil {
		return nil, fmt.Errorf("failed to remove field from documents: %v", err)
	}

	return &models.Method3SchemaModificationResponse{
		Message: fmt.Sprintf("Field '%s' removed from %d documents in collection '%s'", req.FieldName, result.ModifiedCount, req.CollectionName),
		Success: true,
	}, nil
}
