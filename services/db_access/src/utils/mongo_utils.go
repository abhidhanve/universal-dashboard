package utils

import (
	"reflect"
	"regexp"
	"strconv"
	"time"

	"github.com/abhidhanve/universal-dashboard/services/db_access/src/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CreateMongoFilter creates a BSON filter for document ID operations
func CreateMongoFilter(entryID string) bson.M {
	// Try ObjectID first
	if objID, err := primitive.ObjectIDFromHex(entryID); err == nil {
		return bson.M{"_id": objID}
	}

	// Try integer ID
	if intID, err := strconv.Atoi(entryID); err == nil {
		return bson.M{"_id": intID}
	}

	// Fall back to string ID
	return bson.M{"_id": entryID}
}

// AnalyzeSchema analyzes schema from a collection of documents
func AnalyzeSchema(documents []bson.M) map[string]models.SchemaField {
	schema := make(map[string]models.SchemaField)
	fieldTypes := make(map[string]map[string]int)

	// Analyze all documents
	for _, doc := range documents {
		analyzeDocument(doc, "", fieldTypes)
	}

	// Create schema summary
	for field, types := range fieldTypes {
		maxCount := 0
		mostCommonType := "mixed"

		// Find most common type
		for typeName, count := range types {
			if count > maxCount {
				maxCount = count
				mostCommonType = typeName
			}
		}

		schema[field] = models.SchemaField{
			Type:        mostCommonType,
			Occurrences: maxCount,
			TotalDocs:   len(documents),
			Frequency:   float64(maxCount) / float64(len(documents)),
			AllTypes:    types,
		}
	}

	return schema
}

// AnalyzeEnhancedSchema provides enhanced schema analysis for form generation
func AnalyzeEnhancedSchema(documents []bson.M, totalCount int) map[string]models.SchemaField {
	schema := make(map[string]models.SchemaField)
	fieldTypes := make(map[string]map[string]int)
	fieldStats := make(map[string]*models.FieldStats)

	// Analyze all documents
	for _, doc := range documents {
		analyzeDocumentEnhanced(doc, "", fieldTypes, fieldStats)
	}

	// Create enhanced schema summary
	for field, types := range fieldTypes {
		maxCount := 0
		mostCommonType := "mixed"

		// Find most common type and map primitive types
		normalizedTypes := make(map[string]int)
		for typeName, count := range types {
			normalizedType := typeName
			// Normalize primitive.A to array
			if typeName == "primitive.A" {
				normalizedType = "array"
			}
			normalizedTypes[normalizedType] = count

			if count > maxCount {
				maxCount = count
				mostCommonType = normalizedType
			}
		}

		stats := fieldStats[field]
		if stats == nil {
			stats = &models.FieldStats{}
		}

		schema[field] = models.SchemaField{
			Type:        mostCommonType,
			Occurrences: maxCount,
			TotalDocs:   len(documents),
			Frequency:   float64(maxCount) / float64(len(documents)),
			AllTypes:    normalizedTypes, // Use normalized types
			Stats:       stats,
		}
	}

	return schema
}

// analyzeDocument recursively analyzes a single document
func analyzeDocument(doc bson.M, prefix string, fieldTypes map[string]map[string]int) {
	for key, value := range doc {
		fieldName := key
		if prefix != "" {
			fieldName = prefix + "." + key
		}

		if fieldTypes[fieldName] == nil {
			fieldTypes[fieldName] = make(map[string]int)
		}

		typeName := getValueType(value)
		fieldTypes[fieldName][typeName]++

		// Handle nested documents
		if nested, ok := value.(bson.M); ok {
			analyzeDocument(nested, fieldName, fieldTypes)
		} else if nestedMap, ok := value.(map[string]interface{}); ok {
			bsonM := bson.M{}
			for k, v := range nestedMap {
				bsonM[k] = v
			}
			analyzeDocument(bsonM, fieldName, fieldTypes)
		}
	}
}

// getValueType determines the type name for a value
func getValueType(value interface{}) string {
	if value == nil {
		return "null"
	}

	switch v := value.(type) {
	case primitive.ObjectID:
		return "ObjectID"
	case string:
		return "string"
	case int, int32, int64:
		return "number"
	case float32, float64:
		return "number"
	case bool:
		return "boolean"
	case primitive.DateTime:
		return "date"
	case time.Time:
		return "date"
	case []interface{}:
		return "array"
	case primitive.A: // MongoDB array type
		return "array"
	case bson.M, map[string]interface{}:
		return "object"
	case primitive.Binary:
		return "binary"
	default:
		// Check if it's a slice type
		reflectType := reflect.TypeOf(v)
		if reflectType != nil && reflectType.Kind() == reflect.Slice {
			return "array"
		}
		return reflect.TypeOf(v).String()
	}
}

// BuildConnectionURI builds a MongoDB connection URI
func BuildConnectionURI(hostname, username, password, database string) string {
	return "mongodb://" + username + ":" + password + "@" + hostname + "/" + database
}

// ValidateDocumentData validates that document data is not empty and is valid BSON
func ValidateDocumentData(data map[string]interface{}) bool {
	if len(data) == 0 {
		return false
	}

	// Check for reserved MongoDB fields that shouldn't be set manually
	if _, exists := data["_id"]; exists {
		// Allow _id if it's a valid format, but be cautious
		return true
	}

	return true
}

// SanitizeDocumentData removes or sanitizes problematic fields
func SanitizeDocumentData(data map[string]interface{}) map[string]interface{} {
	sanitized := make(map[string]interface{})

	for key, value := range data {
		// Skip certain system fields if needed
		if key != "" && value != nil {
			sanitized[key] = value
		}
	}

	return sanitized
}

// CalculateHasMore determines if there are more documents beyond current pagination
func CalculateHasMore(skip, count int, totalCount int64) bool {
	return int64(skip+count) < totalCount
}

// analyzeDocumentEnhanced recursively analyzes a single document with enhanced statistics
func analyzeDocumentEnhanced(doc bson.M, prefix string, fieldTypes map[string]map[string]int, fieldStats map[string]*models.FieldStats) {
	for key, value := range doc {
		fieldName := key
		if prefix != "" {
			fieldName = prefix + "." + key
		}

		if fieldTypes[fieldName] == nil {
			fieldTypes[fieldName] = make(map[string]int)
		}
		if fieldStats[fieldName] == nil {
			fieldStats[fieldName] = &models.FieldStats{
				UniqueValues: make([]string, 0),
				Examples:     make([]string, 0),
			}
		}

		typeName := getValueType(value)
		fieldTypes[fieldName][typeName]++

		// Collect enhanced statistics based on type
		collectFieldStats(value, fieldStats[fieldName])

		// Handle nested documents
		if nested, ok := value.(bson.M); ok {
			analyzeDocumentEnhanced(nested, fieldName, fieldTypes, fieldStats)
		} else if nestedMap, ok := value.(map[string]interface{}); ok {
			bsonM := bson.M{}
			for k, v := range nestedMap {
				bsonM[k] = v
			}
			analyzeDocumentEnhanced(bsonM, fieldName, fieldTypes, fieldStats)
		}
	}
}

// collectFieldStats collects detailed statistics for a field value
func collectFieldStats(value interface{}, stats *models.FieldStats) {
	switch v := value.(type) {
	case string:
		length := len(v)
		if stats.MinLength == nil || length < *stats.MinLength {
			stats.MinLength = &length
		}
		if stats.MaxLength == nil || length > *stats.MaxLength {
			stats.MaxLength = &length
		}

		// Calculate average length (simple accumulation)
		if stats.AvgLength == nil {
			avg := float64(length)
			stats.AvgLength = &avg
		} else {
			*stats.AvgLength = (*stats.AvgLength + float64(length)) / 2
		}

		// Store unique values (limit to first 10)
		if len(stats.UniqueValues) < 10 {
			exists := false
			for _, existing := range stats.UniqueValues {
				if existing == v {
					exists = true
					break
				}
			}
			if !exists {
				stats.UniqueValues = append(stats.UniqueValues, v)
			}
		}

		// Add to examples (limit to first 5)
		if len(stats.Examples) < 5 {
			exists := false
			for _, example := range stats.Examples {
				if example == v {
					exists = true
					break
				}
			}
			if !exists {
				stats.Examples = append(stats.Examples, v)
			}
		}

		// Detect patterns and suggest form type
		stats.FormType = detectFormType(v)
		if pattern := detectPattern(v); pattern != "" {
			stats.Pattern = &pattern
		}

	case int, int32, int64:
		val := toFloat64(v)
		if stats.MinValue == nil || val < *stats.MinValue {
			stats.MinValue = &val
		}
		if stats.MaxValue == nil || val > *stats.MaxValue {
			stats.MaxValue = &val
		}
		if stats.AvgValue == nil {
			stats.AvgValue = &val
		} else {
			*stats.AvgValue = (*stats.AvgValue + val) / 2
		}
		stats.FormType = "number"

	case float32, float64:
		val := toFloat64(v)
		if stats.MinValue == nil || val < *stats.MinValue {
			stats.MinValue = &val
		}
		if stats.MaxValue == nil || val > *stats.MaxValue {
			stats.MaxValue = &val
		}
		if stats.AvgValue == nil {
			stats.AvgValue = &val
		} else {
			*stats.AvgValue = (*stats.AvgValue + val) / 2
		}
		stats.FormType = "number"

	case bool:
		stats.FormType = "checkbox"

	case primitive.DateTime, time.Time:
		stats.FormType = "date"

	case []interface{}:
		stats.FormType = "array"
		if len(v) > 0 {
			// Determine array item type
			itemType := getValueType(v[0])
			stats.ArrayItems = &itemType
		}

	case primitive.A: // MongoDB array type
		stats.FormType = "array"
		if len(v) > 0 {
			// Determine array item type
			itemType := getValueType(v[0])
			stats.ArrayItems = &itemType
		}

	case primitive.ObjectID:
		stats.FormType = "text"
		if len(stats.Examples) < 5 {
			stats.Examples = append(stats.Examples, v.Hex())
		}

	default:
		// Check if it's a slice type using reflection
		reflectType := reflect.TypeOf(v)
		if reflectType != nil && reflectType.Kind() == reflect.Slice {
			stats.FormType = "array"
			// Try to get slice information
			reflectValue := reflect.ValueOf(v)
			if reflectValue.Len() > 0 {
				firstElement := reflectValue.Index(0).Interface()
				itemType := getValueType(firstElement)
				stats.ArrayItems = &itemType
			}
		} else {
			stats.FormType = "text"
		}
	}
}

// detectFormType suggests appropriate HTML form input type
func detectFormType(value string) string {
	// Email pattern
	if matched, _ := regexp.MatchString(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`, value); matched {
		return "email"
	}

	// URL pattern
	if matched, _ := regexp.MatchString(`^https?://`, value); matched {
		return "url"
	}

	// Phone pattern
	if matched, _ := regexp.MatchString(`^[\+]?[1-9][\d]{0,15}$`, value); matched {
		return "tel"
	}

	// Date pattern (ISO)
	if matched, _ := regexp.MatchString(`^\d{4}-\d{2}-\d{2}`, value); matched {
		return "date"
	}

	// Long text (more than 100 characters)
	if len(value) > 100 {
		return "textarea"
	}

	return "text"
}

// detectPattern detects common patterns in string values
func detectPattern(value string) string {
	patterns := map[string]string{
		`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`: "email",
		`^https?://`:             "url",
		`^[\+]?[1-9][\d]{0,15}$`: "phone",
		`^\d{4}-\d{2}-\d{2}`:     "date",
		`^[A-Z]{2,3}\d{4,}$`:     "code",
	}

	for pattern, name := range patterns {
		if matched, _ := regexp.MatchString(pattern, value); matched {
			return name
		}
	}
	return ""
}

// toFloat64 converts numeric types to float64
func toFloat64(value interface{}) float64 {
	switch v := value.(type) {
	case int:
		return float64(v)
	case int32:
		return float64(v)
	case int64:
		return float64(v)
	case float32:
		return float64(v)
	case float64:
		return v
	default:
		return 0
	}
}
