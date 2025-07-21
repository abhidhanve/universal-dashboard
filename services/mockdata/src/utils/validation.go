package utils

import (
	"fmt"

	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/models"
)

// ValidateSchema validates a schema structure
func ValidateSchema(schema models.Schema) error {
	if schema.Name == "" {
		return fmt.Errorf("schema name is required")
	}

	if len(schema.Fields) == 0 {
		return fmt.Errorf("schema must have at least one field")
	}

	for i, field := range schema.Fields {
		if err := validateField(field, i); err != nil {
			return err
		}
	}

	return nil
}

// validateField validates a single field
func validateField(field models.Field, index int) error {
	if field.Name == "" {
		return fmt.Errorf("field at index %d: name is required", index)
	}

	if field.Type == "" {
		return fmt.Errorf("field '%s': type is required", field.Name)
	}

	// Validate field type
	validTypes := map[models.DataType]bool{
		models.StringType:  true,
		models.IntType:     true,
		models.FloatType:   true,
		models.BoolType:    true,
		models.DateType:    true,
		models.EmailType:   true,
		models.NameType:    true,
		models.AddressType: true,
		models.PhoneType:   true,
		models.UUIDType:    true,
		models.URLType:     true,
		models.JSONType:    true,
		models.ArrayType:   true,
	}

	if !validTypes[field.Type] {
		return fmt.Errorf("field '%s': invalid type '%s'", field.Name, field.Type)
	}

	// Validate length constraints for string types
	if field.Type == models.StringType && field.MinLength > field.MaxLength && field.MaxLength > 0 {
		return fmt.Errorf("field '%s': min_length cannot be greater than max_length", field.Name)
	}

	// Validate numeric constraints
	if (field.Type == models.IntType || field.Type == models.FloatType) && field.Min > field.Max && field.Max > 0 {
		return fmt.Errorf("field '%s': min cannot be greater than max", field.Name)
	}

	// Validate array type
	if field.Type == models.ArrayType {
		if field.ArrayType == "" {
			return fmt.Errorf("field '%s': array_type is required for array fields", field.Name)
		}
		if !validTypes[field.ArrayType] {
			return fmt.Errorf("field '%s': invalid array_type '%s'", field.Name, field.ArrayType)
		}
		if field.ArrayLength < 0 {
			return fmt.Errorf("field '%s': array_length cannot be negative", field.Name)
		}
	}

	// Validate nested fields for JSON type
	if field.Type == models.JSONType {
		for i, nested := range field.Nested {
			if err := validateField(nested, i); err != nil {
				return fmt.Errorf("field '%s' nested field: %v", field.Name, err)
			}
		}
	}

	return nil
}

// ValidateGenerateRequest validates a generate request
func ValidateGenerateRequest(req models.GenerateRequest) error {
	if err := ValidateSchema(req.Schema); err != nil {
		return fmt.Errorf("schema validation error: %v", err)
	}

	if req.Count <= 0 {
		return fmt.Errorf("count must be greater than 0")
	}

	if req.Count > 10000 {
		return fmt.Errorf("count cannot exceed 10000 for performance reasons")
	}

	return nil
}

// SanitizeCount ensures count is within acceptable limits
func SanitizeCount(count int) int {
	if count <= 0 {
		return 1
	}
	if count > 10000 {
		return 10000
	}
	return count
}
