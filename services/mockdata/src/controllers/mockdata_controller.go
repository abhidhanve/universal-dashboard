package controllers

import (
	"net/http"
	"strconv"

	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/models"
	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/services"
	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/utils"
	"github.com/gin-gonic/gin"
)

// MockdataController handles HTTP requests for mock data generation
type MockdataController struct {
	service *services.MockdataService
}

// NewMockdataController creates a new mockdata controller
func NewMockdataController() *MockdataController {
	return &MockdataController{
		service: services.NewMockdataService(),
	}
}

// GenerateCustomData generates mock data from a custom schema
// POST /generate
func (ctrl *MockdataController) GenerateCustomData(c *gin.Context) {
	var req models.GenerateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondValidationError(c, "Invalid request body", err.Error())
		return
	}

	data, err := ctrl.service.GenerateData(req)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Failed to generate data", err)
		return
	}

	response := map[string]interface{}{
		"schema": req.Schema.Name,
		"count":  len(data),
		"data":   data,
	}

	utils.RespondSuccess(c, http.StatusOK, "Mock data generated successfully", response)
}

// GeneratePredefinedData generates mock data from a predefined schema
// POST /generate/:schema_name
func (ctrl *MockdataController) GeneratePredefinedData(c *gin.Context) {
	schemaName := c.Param("schema_name")

	countStr := c.DefaultQuery("count", "10")
	count, err := strconv.Atoi(countStr)
	if err != nil || count <= 0 {
		count = 10
	}

	data, err := ctrl.service.GeneratePredefinedData(schemaName, count)
	if err != nil {
		if err.Error() == "predefined schema '"+schemaName+"' not found" {
			utils.RespondError(c, http.StatusNotFound, "Schema not found", err)
		} else {
			utils.RespondError(c, http.StatusBadRequest, "Failed to generate data", err)
		}
		return
	}

	response := map[string]interface{}{
		"schema": schemaName,
		"count":  len(data),
		"data":   data,
	}

	utils.RespondSuccess(c, http.StatusOK, "Mock data generated successfully", response)
}

// BulkGenerate generates data for multiple schemas
// POST /generate/bulk
func (ctrl *MockdataController) BulkGenerate(c *gin.Context) {
	type BulkRequest struct {
		Schemas []struct {
			Name   string        `json:"name" binding:"required"`
			Count  int           `json:"count" binding:"required"`
			Custom bool          `json:"custom,omitempty"`
			Schema models.Schema `json:"schema,omitempty"`
		} `json:"schemas" binding:"required"`
	}

	var req BulkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondValidationError(c, "Invalid request body", err.Error())
		return
	}

	if len(req.Schemas) == 0 {
		utils.RespondValidationError(c, "At least one schema is required", nil)
		return
	}

	if len(req.Schemas) > 10 {
		utils.RespondValidationError(c, "Maximum 10 schemas allowed per bulk request", nil)
		return
	}

	results := make(map[string]interface{})

	for _, schemaReq := range req.Schemas {
		var data []map[string]interface{}
		var err error

		if schemaReq.Custom {
			// Use custom schema
			genReq := models.GenerateRequest{
				Schema: schemaReq.Schema,
				Count:  schemaReq.Count,
			}
			data, err = ctrl.service.GenerateData(genReq)
		} else {
			// Use predefined schema
			data, err = ctrl.service.GeneratePredefinedData(schemaReq.Name, schemaReq.Count)
		}

		if err != nil {
			results[schemaReq.Name] = map[string]interface{}{
				"error": err.Error(),
				"count": 0,
			}
		} else {
			results[schemaReq.Name] = map[string]interface{}{
				"data":  data,
				"count": len(data),
			}
		}
	}

	utils.RespondSuccess(c, http.StatusOK, "Bulk data generation completed", results)
}

// ValidateSchema validates a custom schema without generating data
// POST /validate
func (ctrl *MockdataController) ValidateSchema(c *gin.Context) {
	var schema models.Schema

	if err := c.ShouldBindJSON(&schema); err != nil {
		utils.RespondValidationError(c, "Invalid schema format", err.Error())
		return
	}

	err := ctrl.service.ValidateCustomSchema(schema)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Schema validation failed", err)
		return
	}

	// Get schema statistics
	stats := ctrl.service.GetSchemaStatistics(schema)

	response := map[string]interface{}{
		"valid":      true,
		"message":    "Schema is valid",
		"statistics": stats,
	}

	utils.RespondSuccess(c, http.StatusOK, "Schema validation successful", response)
}

// GetDataSample returns a small sample of generated data for preview
// GET /sample/:schema_name
func (ctrl *MockdataController) GetDataSample(c *gin.Context) {
	schemaName := c.Param("schema_name")

	// Always generate only 3 samples for preview
	sampleCount := 3

	data, err := ctrl.service.GeneratePredefinedData(schemaName, sampleCount)
	if err != nil {
		if err.Error() == "predefined schema '"+schemaName+"' not found" {
			utils.RespondError(c, http.StatusNotFound, "Schema not found", err)
		} else {
			utils.RespondError(c, http.StatusBadRequest, "Failed to generate sample", err)
		}
		return
	}

	response := map[string]interface{}{
		"schema": schemaName,
		"sample": data,
		"count":  len(data),
		"note":   "This is a sample preview. Use /generate endpoint for full data generation.",
	}

	utils.RespondSuccess(c, http.StatusOK, "Sample data generated successfully", response)
}
