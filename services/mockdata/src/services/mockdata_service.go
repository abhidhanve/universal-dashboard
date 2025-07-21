package services

import (
	"fmt"

	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/models"
	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/utils"
)

// MockdataService handles business logic for mock data generation
type MockdataService struct {
	fakerUtils *utils.FakerUtils
}

// NewMockdataService creates a new mockdata service instance
func NewMockdataService() *MockdataService {
	return &MockdataService{
		fakerUtils: utils.NewFakerUtils(),
	}
}

// GenerateData generates mock data based on the provided schema and count
func (s *MockdataService) GenerateData(req models.GenerateRequest) ([]map[string]interface{}, error) {
	// Validate the request
	if err := utils.ValidateGenerateRequest(req); err != nil {
		return nil, fmt.Errorf("validation error: %v", err)
	}

	// Sanitize count to ensure it's within limits
	count := utils.SanitizeCount(req.Count)

	var data []map[string]interface{}

	for i := 0; i < count; i++ {
		record := make(map[string]interface{})

		for _, field := range req.Schema.Fields {
			value, err := s.fakerUtils.GenerateFieldValue(field)
			if err != nil {
				return nil, fmt.Errorf("error generating field %s: %v", field.Name, err)
			}
			record[field.Name] = value
		}

		data = append(data, record)
	}

	return data, nil
}

// GeneratePredefinedData generates data using a predefined schema
func (s *MockdataService) GeneratePredefinedData(schemaName string, count int) ([]map[string]interface{}, error) {
	// Get predefined schema
	schema, exists := models.PredefinedSchemas[schemaName]
	if !exists {
		return nil, fmt.Errorf("predefined schema '%s' not found", schemaName)
	}

	// Create generate request
	req := models.GenerateRequest{
		Schema: schema,
		Count:  count,
	}

	return s.GenerateData(req)
}

// GetPredefinedSchemas returns all available predefined schemas
func (s *MockdataService) GetPredefinedSchemas() map[string]models.Schema {
	return models.PredefinedSchemas
}

// GetPredefinedSchema returns a specific predefined schema
func (s *MockdataService) GetPredefinedSchema(name string) (models.Schema, error) {
	schema, exists := models.PredefinedSchemas[name]
	if !exists {
		return models.Schema{}, fmt.Errorf("predefined schema '%s' not found", name)
	}
	return schema, nil
}

// ValidateCustomSchema validates a custom schema without generating data
func (s *MockdataService) ValidateCustomSchema(schema models.Schema) error {
	return utils.ValidateSchema(schema)
}

// GetSchemaStatistics returns statistics about a schema
func (s *MockdataService) GetSchemaStatistics(schema models.Schema) map[string]interface{} {
	stats := make(map[string]interface{})

	stats["name"] = schema.Name
	stats["description"] = schema.Description
	stats["total_fields"] = len(schema.Fields)

	// Count field types
	fieldTypes := make(map[string]int)
	requiredFields := 0
	optionalFields := 0

	for _, field := range schema.Fields {
		fieldTypes[string(field.Type)]++
		if field.Required {
			requiredFields++
		} else {
			optionalFields++
		}
	}

	stats["field_types"] = fieldTypes
	stats["required_fields"] = requiredFields
	stats["optional_fields"] = optionalFields

	return stats
}
