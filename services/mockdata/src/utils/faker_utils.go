package utils

import (
	"math/rand"
	"reflect"
	"strings"
	"time"

	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/models"
	"github.com/brianvoe/gofakeit/v6"
)

// FakerUtils provides utilities for data generation
type FakerUtils struct{}

// NewFakerUtils creates a new faker utils instance
func NewFakerUtils() *FakerUtils {
	gofakeit.Seed(time.Now().UnixNano())
	return &FakerUtils{}
}

// GenerateFieldValue generates a value for a specific field
func (f *FakerUtils) GenerateFieldValue(field models.Field) (interface{}, error) {
	// Handle required fields vs optional fields
	if !field.Required && rand.Float32() < 0.1 { // 10% chance of null for optional fields
		return nil, nil
	}

	switch field.Type {
	case models.StringType:
		return f.generateString(field), nil

	case models.IntType:
		min := int(field.Min)
		max := int(field.Max)
		if max == 0 {
			max = 1000
		}
		if min >= max {
			min = 0
		}
		return gofakeit.Number(min, max), nil

	case models.FloatType:
		min := field.Min
		max := field.Max
		if max == 0 {
			max = 1000.0
		}
		if min >= max {
			min = 0.0
		}
		return gofakeit.Float64Range(min, max), nil

	case models.BoolType:
		return gofakeit.Bool(), nil

	case models.DateType:
		return gofakeit.DateRange(
			time.Now().AddDate(-5, 0, 0),
			time.Now().AddDate(5, 0, 0),
		), nil

	case models.EmailType:
		return gofakeit.Email(), nil

	case models.NameType:
		return gofakeit.Name(), nil

	case models.AddressType:
		return map[string]interface{}{
			"street":  gofakeit.Street(),
			"city":    gofakeit.City(),
			"state":   gofakeit.State(),
			"zip":     gofakeit.Zip(),
			"country": gofakeit.Country(),
		}, nil

	case models.PhoneType:
		return gofakeit.Phone(), nil

	case models.UUIDType:
		return gofakeit.UUID(), nil

	case models.URLType:
		return gofakeit.URL(), nil

	case models.ArrayType:
		return f.generateArray(field)

	case models.JSONType:
		return f.generateNestedObject(field.Nested)

	default:
		return f.generateString(field), nil
	}
}

// generateString generates string values based on field constraints
func (f *FakerUtils) generateString(field models.Field) string {
	var result string

	// Use options if provided
	if len(field.Options) > 0 {
		return field.Options[rand.Intn(len(field.Options))]
	}

	// Use pattern if provided
	if field.Pattern != "" {
		switch field.Pattern {
		case "firstname":
			return gofakeit.FirstName()
		case "lastname":
			return gofakeit.LastName()
		case "company":
			return gofakeit.Company()
		case "job_title":
			return gofakeit.JobTitle()
		case "color":
			return gofakeit.Color()
		case "animal":
			return gofakeit.Animal()
		default:
			result = gofakeit.LoremIpsumSentence(3)
		}
	} else {
		result = gofakeit.LoremIpsumSentence(rand.Intn(5) + 1)
	}

	// Apply length constraints
	if field.MaxLength > 0 && len(result) > field.MaxLength {
		result = result[:field.MaxLength]
	}

	if field.MinLength > 0 && len(result) < field.MinLength {
		for len(result) < field.MinLength {
			result += " " + gofakeit.Word()
		}
		if len(result) > field.MaxLength && field.MaxLength > 0 {
			result = result[:field.MaxLength]
		}
	}

	return strings.TrimSpace(result)
}

// generateArray generates an array of values
func (f *FakerUtils) generateArray(field models.Field) ([]interface{}, error) {
	length := field.ArrayLength
	if length == 0 {
		length = rand.Intn(5) + 1 // Default 1-5 items
	}

	var array []interface{}

	elementField := models.Field{
		Name:      field.Name + "_element",
		Type:      field.ArrayType,
		Required:  true,
		MinLength: field.MinLength,
		MaxLength: field.MaxLength,
		Min:       field.Min,
		Max:       field.Max,
		Options:   field.Options,
		Pattern:   field.Pattern,
	}

	for i := 0; i < length; i++ {
		value, err := f.GenerateFieldValue(elementField)
		if err != nil {
			return nil, err
		}
		array = append(array, value)
	}

	return array, nil
}

// generateNestedObject generates a nested JSON object
func (f *FakerUtils) generateNestedObject(fields []models.Field) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	for _, field := range fields {
		value, err := f.GenerateFieldValue(field)
		if err != nil {
			return nil, err
		}
		result[field.Name] = value
	}

	return result, nil
}

// GetValueType returns the type name for a value (utility function)
func GetValueType(value interface{}) string {
	if value == nil {
		return "null"
	}

	switch v := value.(type) {
	case string:
		return "string"
	case int, int32, int64:
		return "integer"
	case float32, float64:
		return "number"
	case bool:
		return "boolean"
	case time.Time:
		return "date"
	case []interface{}:
		return "array"
	case map[string]interface{}:
		return "object"
	default:
		return reflect.TypeOf(v).String()
	}
}
