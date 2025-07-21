package services

import (
	"fmt"

	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/models"
)

// SchemaService handles business logic for schema management
type SchemaService struct{}

// NewSchemaService creates a new schema service instance
func NewSchemaService() *SchemaService {
	return &SchemaService{}
}

// ListPredefinedSchemas returns all predefined schemas with metadata
func (s *SchemaService) ListPredefinedSchemas() map[string]interface{} {
	result := make(map[string]interface{})

	for name, schema := range models.PredefinedSchemas {
		schemaInfo := map[string]interface{}{
			"name":           schema.Name,
			"description":    schema.Description,
			"field_count":    len(schema.Fields),
			"required_count": s.countRequiredFields(schema.Fields),
			"field_types":    s.getFieldTypes(schema.Fields),
		}
		result[name] = schemaInfo
	}

	return result
}

// GetSchemaDetails returns detailed information about a specific schema
func (s *SchemaService) GetSchemaDetails(schemaName string) (map[string]interface{}, error) {
	schema, exists := models.PredefinedSchemas[schemaName]
	if !exists {
		return nil, fmt.Errorf("schema '%s' not found", schemaName)
	}

	details := map[string]interface{}{
		"name":        schema.Name,
		"description": schema.Description,
		"fields":      s.getFieldDetails(schema.Fields),
		"statistics": map[string]interface{}{
			"total_fields":    len(schema.Fields),
			"required_fields": s.countRequiredFields(schema.Fields),
			"optional_fields": s.countOptionalFields(schema.Fields),
			"field_types":     s.getFieldTypes(schema.Fields),
			"complexity":      s.calculateComplexity(schema.Fields),
		},
	}

	return details, nil
}

// ValidateSchemaStructure validates the structure of a custom schema
func (s *SchemaService) ValidateSchemaStructure(schema models.Schema) map[string]interface{} {
	validation := map[string]interface{}{
		"valid":    true,
		"errors":   []string{},
		"warnings": []string{},
	}

	errors := []string{}
	warnings := []string{}

	// Basic validation
	if schema.Name == "" {
		errors = append(errors, "Schema name is required")
	}

	if len(schema.Fields) == 0 {
		errors = append(errors, "Schema must have at least one field")
	}

	// Field validation
	fieldNames := make(map[string]bool)
	for i, field := range schema.Fields {
		// Check for duplicate field names
		if fieldNames[field.Name] {
			errors = append(errors, fmt.Sprintf("Duplicate field name '%s'", field.Name))
		}
		fieldNames[field.Name] = true

		// Field-specific validation
		if field.Name == "" {
			errors = append(errors, fmt.Sprintf("Field at index %d: name is required", i))
		}

		// Type-specific warnings
		if field.Type == models.ArrayType && field.ArrayType == "" {
			errors = append(errors, fmt.Sprintf("Field '%s': array_type is required for array fields", field.Name))
		}

		if field.Type == models.StringType && field.MaxLength > 1000 {
			warnings = append(warnings, fmt.Sprintf("Field '%s': max_length is very large (%d), consider reducing for performance", field.Name, field.MaxLength))
		}
	}

	// Performance warnings
	if len(schema.Fields) > 50 {
		warnings = append(warnings, "Schema has many fields (>50), generation might be slow")
	}

	validation["errors"] = errors
	validation["warnings"] = warnings
	validation["valid"] = len(errors) == 0

	return validation
}

// CompareSchemas compares two schemas and returns differences
func (s *SchemaService) CompareSchemas(schema1, schema2 models.Schema) map[string]interface{} {
	comparison := map[string]interface{}{
		"schema1_name": schema1.Name,
		"schema2_name": schema2.Name,
		"differences":  []string{},
		"similarities": []string{},
	}

	differences := []string{}
	similarities := []string{}

	// Compare field counts
	if len(schema1.Fields) != len(schema2.Fields) {
		differences = append(differences, fmt.Sprintf("Field count differs: %d vs %d", len(schema1.Fields), len(schema2.Fields)))
	} else {
		similarities = append(similarities, fmt.Sprintf("Both schemas have %d fields", len(schema1.Fields)))
	}

	// Compare field types
	types1 := s.getFieldTypes(schema1.Fields)
	types2 := s.getFieldTypes(schema2.Fields)

	for fieldType, count1 := range types1 {
		if count2, exists := types2[fieldType]; exists {
			if count1 != count2 {
				differences = append(differences, fmt.Sprintf("'%s' field count differs: %d vs %d", fieldType, count1, count2))
			}
		} else {
			differences = append(differences, fmt.Sprintf("'%s' fields only in schema1", fieldType))
		}
	}

	for fieldType := range types2 {
		if _, exists := types1[fieldType]; !exists {
			differences = append(differences, fmt.Sprintf("'%s' fields only in schema2", fieldType))
		}
	}

	comparison["differences"] = differences
	comparison["similarities"] = similarities

	return comparison
}

// Helper methods

func (s *SchemaService) countRequiredFields(fields []models.Field) int {
	count := 0
	for _, field := range fields {
		if field.Required {
			count++
		}
	}
	return count
}

func (s *SchemaService) countOptionalFields(fields []models.Field) int {
	count := 0
	for _, field := range fields {
		if !field.Required {
			count++
		}
	}
	return count
}

func (s *SchemaService) getFieldTypes(fields []models.Field) map[string]int {
	types := make(map[string]int)
	for _, field := range fields {
		types[string(field.Type)]++
	}
	return types
}

func (s *SchemaService) getFieldDetails(fields []models.Field) []map[string]interface{} {
	var details []map[string]interface{}

	for _, field := range fields {
		fieldDetail := map[string]interface{}{
			"name":     field.Name,
			"type":     field.Type,
			"required": field.Required,
		}

		if field.MinLength > 0 || field.MaxLength > 0 {
			fieldDetail["length_constraints"] = map[string]int{
				"min": field.MinLength,
				"max": field.MaxLength,
			}
		}

		if field.Min > 0 || field.Max > 0 {
			fieldDetail["numeric_constraints"] = map[string]float64{
				"min": field.Min,
				"max": field.Max,
			}
		}

		if len(field.Options) > 0 {
			fieldDetail["options"] = field.Options
		}

		if field.Pattern != "" {
			fieldDetail["pattern"] = field.Pattern
		}

		if field.Type == models.ArrayType {
			fieldDetail["array_config"] = map[string]interface{}{
				"element_type": field.ArrayType,
				"length":       field.ArrayLength,
			}
		}

		details = append(details, fieldDetail)
	}

	return details
}

func (s *SchemaService) calculateComplexity(fields []models.Field) string {
	score := 0

	for _, field := range fields {
		switch field.Type {
		case models.StringType, models.IntType, models.FloatType, models.BoolType:
			score += 1
		case models.DateType, models.EmailType, models.NameType, models.PhoneType:
			score += 2
		case models.AddressType, models.UUIDType, models.URLType:
			score += 3
		case models.ArrayType:
			score += 4
		case models.JSONType:
			score += 5 + len(field.Nested)
		}
	}

	if score < 10 {
		return "low"
	} else if score < 25 {
		return "medium"
	} else {
		return "high"
	}
}
