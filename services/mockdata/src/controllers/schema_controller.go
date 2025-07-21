package controllers

import (
	"net/http"

	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/models"
	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/services"
	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/utils"
	"github.com/gin-gonic/gin"
)

// SchemaController handles HTTP requests for schema management
type SchemaController struct {
	service *services.SchemaService
}

// NewSchemaController creates a new schema controller
func NewSchemaController() *SchemaController {
	return &SchemaController{
		service: services.NewSchemaService(),
	}
}

// ListPredefinedSchemas returns all available predefined schemas
// GET /schemas
func (ctrl *SchemaController) ListPredefinedSchemas(c *gin.Context) {
	schemas := ctrl.service.ListPredefinedSchemas()

	response := map[string]interface{}{
		"schemas": schemas,
		"count":   len(schemas),
	}

	utils.RespondSuccess(c, http.StatusOK, "Predefined schemas retrieved successfully", response)
}

// GetSchemaDetails returns detailed information about a specific schema
// GET /schemas/:name
func (ctrl *SchemaController) GetSchemaDetails(c *gin.Context) {
	schemaName := c.Param("name")

	details, err := ctrl.service.GetSchemaDetails(schemaName)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Schema not found", err)
		return
	}

	utils.RespondSuccess(c, http.StatusOK, "Schema details retrieved successfully", details)
}

// ValidateCustomSchema validates a custom schema structure
// POST /schemas/validate
func (ctrl *SchemaController) ValidateCustomSchema(c *gin.Context) {
	var schema models.Schema

	if err := c.ShouldBindJSON(&schema); err != nil {
		utils.RespondValidationError(c, "Invalid schema format", err.Error())
		return
	}

	validation := ctrl.service.ValidateSchemaStructure(schema)

	if validation["valid"].(bool) {
		utils.RespondSuccess(c, http.StatusOK, "Schema validation successful", validation)
	} else {
		utils.RespondError(c, http.StatusBadRequest, "Schema validation failed", nil)
		c.JSON(http.StatusBadRequest, utils.APIResponse{
			Success: false,
			Message: "Schema validation failed",
			Data:    validation,
			Code:    1,
		})
	}
}

// CompareSchemas compares two schemas and returns differences
// POST /schemas/compare
func (ctrl *SchemaController) CompareSchemas(c *gin.Context) {
	type CompareRequest struct {
		Schema1 models.Schema `json:"schema1" binding:"required"`
		Schema2 models.Schema `json:"schema2" binding:"required"`
	}

	var req CompareRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondValidationError(c, "Invalid request body", err.Error())
		return
	}

	comparison := ctrl.service.CompareSchemas(req.Schema1, req.Schema2)

	utils.RespondSuccess(c, http.StatusOK, "Schema comparison completed", comparison)
}

// GetSchemaByName returns a specific predefined schema
// GET /schemas/:name/definition
func (ctrl *SchemaController) GetSchemaByName(c *gin.Context) {
	schemaName := c.Param("name")

	schema, exists := models.PredefinedSchemas[schemaName]
	if !exists {
		utils.RespondError(c, http.StatusNotFound, "Schema not found", nil)
		return
	}

	response := map[string]interface{}{
		"name":   schemaName,
		"schema": schema,
	}

	utils.RespondSuccess(c, http.StatusOK, "Schema definition retrieved successfully", response)
}

// GetSchemaTypes returns all available field types and their descriptions
// GET /schemas/types
func (ctrl *SchemaController) GetSchemaTypes(c *gin.Context) {
	types := map[string]interface{}{
		"string": map[string]interface{}{
			"description": "Text data with optional length constraints",
			"options":     []string{"min_length", "max_length", "pattern", "options"},
		},
		"int": map[string]interface{}{
			"description": "Integer numbers with optional min/max constraints",
			"options":     []string{"min", "max"},
		},
		"float": map[string]interface{}{
			"description": "Decimal numbers with optional min/max constraints",
			"options":     []string{"min", "max"},
		},
		"bool": map[string]interface{}{
			"description": "Boolean true/false values",
			"options":     []string{},
		},
		"date": map[string]interface{}{
			"description": "Date and time values",
			"options":     []string{},
		},
		"email": map[string]interface{}{
			"description": "Valid email addresses",
			"options":     []string{},
		},
		"name": map[string]interface{}{
			"description": "Human names (first, last, or full)",
			"options":     []string{"pattern"},
		},
		"address": map[string]interface{}{
			"description": "Address objects with street, city, state, zip, country",
			"options":     []string{},
		},
		"phone": map[string]interface{}{
			"description": "Phone numbers in various formats",
			"options":     []string{},
		},
		"uuid": map[string]interface{}{
			"description": "Universally unique identifiers",
			"options":     []string{},
		},
		"url": map[string]interface{}{
			"description": "Valid URL addresses",
			"options":     []string{},
		},
		"array": map[string]interface{}{
			"description": "Arrays of specified element types",
			"options":     []string{"array_type", "array_length"},
			"required":    []string{"array_type"},
		},
		"json": map[string]interface{}{
			"description": "Nested JSON objects",
			"options":     []string{"nested"},
			"required":    []string{"nested"},
		},
	}

	utils.RespondSuccess(c, http.StatusOK, "Field types retrieved successfully", types)
}
