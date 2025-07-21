package services

import (
	"context"
	"fmt"

	"github.com/abhidhanve/universal-dashboard/services/db_access/src/models"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/mongodb"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DocumentService struct{}

func NewDocumentService() *DocumentService {
	return &DocumentService{}
}

// CreateDocument creates a new document in a specified collection
func (s *DocumentService) CreateDocument(dbName, collectionName string, req models.CreateDocumentRequest) (*models.CreateDocumentResponse, error) {
	if !utils.IsValidDBName(dbName) {
		return nil, fmt.Errorf("invalid database name: %s", dbName)
	}

	if !utils.IsValidCollectionName(collectionName) {
		return nil, fmt.Errorf("invalid collection name: %s", collectionName)
	}

	if !utils.ValidateDocumentData(req.Data) {
		return nil, fmt.Errorf("invalid document data")
	}

	client := mongodb.GetClient()
	db := client.Database(dbName)
	collection := db.Collection(collectionName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.ShortTimeout)
	defer cancel()

	// Sanitize document data
	sanitizedData := utils.SanitizeDocumentData(req.Data)

	result, err := collection.InsertOne(ctx, sanitizedData)
	if err != nil {
		return nil, fmt.Errorf("failed to create document: %v", err)
	}

	response := &models.CreateDocumentResponse{
		Message:    "Document created successfully",
		Database:   dbName,
		Collection: collectionName,
		DocumentID: result.InsertedID,
		Code:       0,
	}

	return response, nil
}

// GetCollectionEntries retrieves all entries from a specific collection with pagination
func (s *DocumentService) GetCollectionEntries(dbName, collectionName string, limit, skip int) (*models.CollectionEntriesResponse, error) {
	if !utils.IsValidDBName(dbName) {
		return nil, fmt.Errorf("invalid database name: %s", dbName)
	}

	if !utils.IsValidCollectionName(collectionName) {
		return nil, fmt.Errorf("invalid collection name: %s", collectionName)
	}

	// Validate pagination parameters
	if limit < 1 || limit > 1000 {
		limit = 50
	}
	if skip < 0 {
		skip = 0
	}

	client := mongodb.GetClient()
	db := client.Database(dbName)
	collection := db.Collection(collectionName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.MediumTimeout)
	defer cancel()

	// Get total count
	totalCount, err := collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to count documents: %v", err)
	}

	// Find documents with pagination
	findOptions := options.Find().SetLimit(int64(limit)).SetSkip(int64(skip))
	cursor, err := collection.Find(ctx, bson.M{}, findOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to query collection: %v", err)
	}
	defer cursor.Close(ctx)

	var documents []bson.M
	if err = cursor.All(ctx, &documents); err != nil {
		return nil, fmt.Errorf("failed to decode documents: %v", err)
	}

	// Calculate if there are more documents
	hasMore := utils.CalculateHasMore(skip, len(documents), totalCount)

	response := &models.CollectionEntriesResponse{
		Message:    "Entries retrieved successfully",
		Database:   dbName,
		Collection: collectionName,
		Data:       documents,
		Count:      len(documents),
		TotalCount: totalCount,
		Limit:      limit,
		Skip:       skip,
		HasMore:    hasMore,
		Code:       0,
	}

	return response, nil
}

// UpdateDocument updates a specific document in a collection
func (s *DocumentService) UpdateDocument(dbName, collectionName, entryID string, req models.UpdateDocumentRequest) (*models.UpdateDocumentResponse, error) {
	if !utils.IsValidDBName(dbName) {
		return nil, fmt.Errorf("invalid database name: %s", dbName)
	}

	if !utils.IsValidCollectionName(collectionName) {
		return nil, fmt.Errorf("invalid collection name: %s", collectionName)
	}

	if entryID == "" {
		return nil, fmt.Errorf("document ID cannot be empty")
	}

	if !utils.ValidateDocumentData(req.Data) {
		return nil, fmt.Errorf("invalid document data")
	}

	client := mongodb.GetClient()
	db := client.Database(dbName)
	collection := db.Collection(collectionName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.ShortTimeout)
	defer cancel()

	// Create filter for document ID
	filter := utils.CreateMongoFilter(entryID)

	// Sanitize update data
	sanitizedData := utils.SanitizeDocumentData(req.Data)
	update := bson.M{"$set": sanitizedData}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return nil, fmt.Errorf("failed to update document: %v", err)
	}

	if result.MatchedCount == 0 {
		return nil, fmt.Errorf("document not found")
	}

	response := &models.UpdateDocumentResponse{
		Message:       "Document updated successfully",
		Database:      dbName,
		Collection:    collectionName,
		DocumentID:    entryID,
		MatchedCount:  result.MatchedCount,
		ModifiedCount: result.ModifiedCount,
		Code:          0,
	}

	return response, nil
}

// DeleteDocument deletes a specific document from a collection
func (s *DocumentService) DeleteDocument(dbName, collectionName, entryID string) (*models.DeleteDocumentResponse, error) {
	if !utils.IsValidDBName(dbName) {
		return nil, fmt.Errorf("invalid database name: %s", dbName)
	}

	if !utils.IsValidCollectionName(collectionName) {
		return nil, fmt.Errorf("invalid collection name: %s", collectionName)
	}

	if entryID == "" {
		return nil, fmt.Errorf("document ID cannot be empty")
	}

	client := mongodb.GetClient()
	db := client.Database(dbName)
	collection := db.Collection(collectionName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.ShortTimeout)
	defer cancel()

	// Create filter for document ID
	filter := utils.CreateMongoFilter(entryID)

	result, err := collection.DeleteOne(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to delete document: %v", err)
	}

	if result.DeletedCount == 0 {
		return nil, fmt.Errorf("document not found")
	}

	response := &models.DeleteDocumentResponse{
		Message:      "Document deleted successfully",
		Database:     dbName,
		Collection:   collectionName,
		DocumentID:   entryID,
		DeletedCount: result.DeletedCount,
		Code:         0,
	}

	return response, nil
}

// GetDocumentByID retrieves a specific document by its ID
func (s *DocumentService) GetDocumentByID(dbName, collectionName, entryID string) (bson.M, error) {
	if !utils.IsValidDBName(dbName) {
		return nil, fmt.Errorf("invalid database name: %s", dbName)
	}

	if !utils.IsValidCollectionName(collectionName) {
		return nil, fmt.Errorf("invalid collection name: %s", collectionName)
	}

	if entryID == "" {
		return nil, fmt.Errorf("document ID cannot be empty")
	}

	client := mongodb.GetClient()
	db := client.Database(dbName)
	collection := db.Collection(collectionName)

	ctx, cancel := context.WithTimeout(context.Background(), models.DefaultContextConfig.ShortTimeout)
	defer cancel()

	// Create filter for document ID
	filter := utils.CreateMongoFilter(entryID)

	var document bson.M
	err := collection.FindOne(ctx, filter).Decode(&document)
	if err != nil {
		return nil, fmt.Errorf("document not found: %v", err)
	}

	return document, nil
}
