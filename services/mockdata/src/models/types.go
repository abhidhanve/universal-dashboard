package models

// DataType represents different types of data that can be generated
type DataType string

const (
	StringType  DataType = "string"
	IntType     DataType = "int"
	FloatType   DataType = "float"
	BoolType    DataType = "bool"
	DateType    DataType = "date"
	EmailType   DataType = "email"
	NameType    DataType = "name"
	AddressType DataType = "address"
	PhoneType   DataType = "phone"
	UUIDType    DataType = "uuid"
	URLType     DataType = "url"
	JSONType    DataType = "json"
	ArrayType   DataType = "array"
)

// Field represents a field in the schema
type Field struct {
	Name        string   `json:"name"`
	Type        DataType `json:"type"`
	Required    bool     `json:"required"`
	MinLength   int      `json:"min_length,omitempty"`
	MaxLength   int      `json:"max_length,omitempty"`
	Min         float64  `json:"min,omitempty"`
	Max         float64  `json:"max,omitempty"`
	Options     []string `json:"options,omitempty"`
	Pattern     string   `json:"pattern,omitempty"`
	ArrayType   DataType `json:"array_type,omitempty"`
	ArrayLength int      `json:"array_length,omitempty"`
	Nested      []Field  `json:"nested,omitempty"`
}

// Schema represents the data structure to generate mock data for
type Schema struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Fields      []Field `json:"fields"`
}

// GenerateRequest represents a request to generate mock data
type GenerateRequest struct {
	Schema Schema `json:"schema" binding:"required"`
	Count  int    `json:"count" binding:"required"`
}

// GenerateResponse represents the response containing generated data
type GenerateResponse struct {
	Message string                   `json:"message"`
	Schema  string                   `json:"schema"`
	Count   int                      `json:"count"`
	Data    []map[string]interface{} `json:"data"`
	Code    int                      `json:"code"`
}

// SchemaListResponse represents the response for listing predefined schemas
type SchemaListResponse struct {
	Message string            `json:"message"`
	Schemas map[string]Schema `json:"schemas"`
	Count   int               `json:"count"`
	Code    int               `json:"code"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code"`
}

// SuccessResponse represents a generic success response
type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Code    int         `json:"code"`
}
