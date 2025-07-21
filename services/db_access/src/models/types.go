package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

// Database allocation request
type DatabaseAllocationRequest struct {
	DBName   string `json:"db_name" binding:"required"`
	UserName string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	MongoURI string `json:"mongo_uri,omitempty"` // Optional for Method 3
}

// Database allocation response
type DatabaseAllocationResponse struct {
	Message  string `json:"message"`
	Code     int    `json:"code"`
	URI      string `json:"uri"`
	Database string `json:"database"`
	Username string `json:"username"`
}

// Document creation request
type CreateDocumentRequest struct {
	Data map[string]interface{} `json:"data" binding:"required"`
}

// Document creation response
type CreateDocumentResponse struct {
	Message    string      `json:"message"`
	Database   string      `json:"database"`
	Collection string      `json:"collection"`
	DocumentID interface{} `json:"document_id"`
	Code       int         `json:"code"`
}

// Document update request
type UpdateDocumentRequest struct {
	Data map[string]interface{} `json:"data" binding:"required"`
}

// Document update response
type UpdateDocumentResponse struct {
	Message       string `json:"message"`
	Database      string `json:"database"`
	Collection    string `json:"collection"`
	DocumentID    string `json:"document_id"`
	MatchedCount  int64  `json:"matched_count"`
	ModifiedCount int64  `json:"modified_count"`
	Code          int    `json:"code"`
}

// Document deletion response
type DeleteDocumentResponse struct {
	Message      string `json:"message"`
	Database     string `json:"database"`
	Collection   string `json:"collection"`
	DocumentID   string `json:"document_id"`
	DeletedCount int64  `json:"deleted_count"`
	Code         int    `json:"code"`
}

// Collection entries response
type CollectionEntriesResponse struct {
	Message    string   `json:"message"`
	Database   string   `json:"database"`
	Collection string   `json:"collection"`
	Data       []bson.M `json:"data"`
	Count      int      `json:"count"`
	TotalCount int64    `json:"total_count"`
	Limit      int      `json:"limit"`
	Skip       int      `json:"skip"`
	HasMore    bool     `json:"has_more"`
	Code       int      `json:"code"`
}

// Enhanced field statistics for form generation
type FieldStats struct {
	MinLength    *int     `json:"min_length,omitempty"`    // For strings
	MaxLength    *int     `json:"max_length,omitempty"`    // For strings
	AvgLength    *float64 `json:"avg_length,omitempty"`    // For strings
	MinValue     *float64 `json:"min_value,omitempty"`     // For numbers
	MaxValue     *float64 `json:"max_value,omitempty"`     // For numbers
	AvgValue     *float64 `json:"avg_value,omitempty"`     // For numbers
	UniqueValues []string `json:"unique_values,omitempty"` // Sample unique values (limited)
	IsRequired   bool     `json:"is_required"`             // Based on frequency
	Pattern      *string  `json:"pattern,omitempty"`       // Common patterns detected
	Validation   *string  `json:"validation,omitempty"`    // Suggested validation rules
	FormType     string   `json:"form_type"`               // Suggested form input type
	Examples     []string `json:"examples,omitempty"`      // Sample values for form
	ArrayItems   *string  `json:"array_items,omitempty"`   // Type of array items if array
}

// Schema field information
type SchemaField struct {
	Type        string         `json:"type"`
	Occurrences int            `json:"occurrences"`
	TotalDocs   int            `json:"total_docs"`
	Frequency   float64        `json:"frequency"`
	AllTypes    map[string]int `json:"all_types"`
	Stats       *FieldStats    `json:"stats,omitempty"` // Enhanced statistics for form generation
}

// Schema detection response
type SchemaDetectionResponse struct {
	Message     string                 `json:"message"`
	Database    string                 `json:"database"`
	Collection  string                 `json:"collection"`
	Schema      map[string]SchemaField `json:"schema"`
	SampleCount int                    `json:"sample_count"`
	TotalFields int                    `json:"total_fields"`
	Code        int                    `json:"code"`
}

// Collection information
type CollectionInfo struct {
	Name          string `json:"name"`
	DocumentCount int64  `json:"document_count"`
}

// Collections list response
type CollectionsListResponse struct {
	Message     string           `json:"message"`
	Database    string           `json:"database"`
	Collections []CollectionInfo `json:"collections"`
	Total       int              `json:"total"`
	Code        int              `json:"code"`
}

// Document analysis request
type DocumentAnalysisRequest struct {
	DBName      string   `json:"db_name" binding:"required"`
	Collections []string `json:"collections" binding:"required"`
}

// Method 3 schema analysis request (using external MongoDB URI)
type Method3SchemaRequest struct {
	MongoURI       string `json:"mongo_uri" binding:"required"`
	DatabaseName   string `json:"database_name" binding:"required"`
	CollectionName string `json:"collection_name" binding:"required"`
}

// Method 3 data insertion request (using external MongoDB URI)
type Method3DataInsertRequest struct {
	MongoURI       string                 `json:"mongo_uri" binding:"required"`
	DatabaseName   string                 `json:"database_name" binding:"required"`
	CollectionName string                 `json:"collection_name" binding:"required"`
	Data           map[string]interface{} `json:"data" binding:"required"`
}

// Method 3 data operations request (using external MongoDB URI)
type Method3DataRequest struct {
	MongoURI       string `json:"mongo_uri" binding:"required"`
	DatabaseName   string `json:"database_name" binding:"required"`
	CollectionName string `json:"collection_name" binding:"required"`
	DocumentID     string `json:"document_id,omitempty"` // For delete operations
}

// Document analysis result
type DocumentAnalysisResult struct {
	Schema      map[string]SchemaField `json:"schema,omitempty"`
	SampleCount int                    `json:"sample_count,omitempty"`
	FieldCount  int                    `json:"field_count,omitempty"`
	Message     string                 `json:"message,omitempty"`
	Error       string                 `json:"error,omitempty"`
}

// Document analysis response
type DocumentAnalysisResponse struct {
	Message  string                            `json:"message"`
	Database string                            `json:"database"`
	Results  map[string]DocumentAnalysisResult `json:"results"`
	Code     int                               `json:"code"`
}

// Sample data response
type SampleDataResponse struct {
	Message    string   `json:"message"`
	Database   string   `json:"database"`
	Collection string   `json:"collection"`
	Data       []bson.M `json:"data"`
	Count      int      `json:"count"`
	Code       int      `json:"code"`
}

// Query parameters for pagination
type QueryParams struct {
	Limit int `form:"limit"`
	Skip  int `form:"skip"`
}

// Common error response
type ErrorResponse struct {
	Error string `json:"error"`
	Code  int    `json:"code"`
}

// Success response wrapper
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Code    int         `json:"code"`
}

// MongoDB connection info
type MongoConnectionInfo struct {
	Hostname string
	Database string
	Username string
	Password string
}

// Field type information for schema analysis
type FieldTypeInfo struct {
	TypeName string
	Count    int
}

// Document filter for ID operations
type DocumentFilter struct {
	Filter bson.M
	ID     string
}

// Context timeout configuration
type ContextConfig struct {
	ShortTimeout  time.Duration
	MediumTimeout time.Duration
	LongTimeout   time.Duration
}

// Default context timeouts
var DefaultContextConfig = ContextConfig{
	ShortTimeout:  10 * time.Second,
	MediumTimeout: 30 * time.Second,
	LongTimeout:   60 * time.Second,
}
