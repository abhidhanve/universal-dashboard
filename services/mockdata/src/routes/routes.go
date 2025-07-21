package routes

import (
	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/controllers"
	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all routes for the mockdata service
func SetupRoutes(router *gin.Engine) {
	// Initialize controllers
	mockdataController := controllers.NewMockdataController()
	schemaController := controllers.NewSchemaController()

	// Health check
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// API version group
	v1 := router.Group("/v1")
	{
		// Mock data generation routes
		mockdata := v1.Group("/mockdata")
		{
			// Custom schema data generation
			mockdata.POST("/generate", mockdataController.GenerateCustomData)

			// Predefined schema data generation
			mockdata.POST("/generate/:schema_name", mockdataController.GeneratePredefinedData)

			// Bulk data generation
			mockdata.POST("/generate/bulk", mockdataController.BulkGenerate)

			// Schema validation
			mockdata.POST("/validate", mockdataController.ValidateSchema)

			// Sample data for preview
			mockdata.GET("/sample/:schema_name", mockdataController.GetDataSample)
		}

		// Schema management routes
		schemas := v1.Group("/schemas")
		{
			// List all predefined schemas
			schemas.GET("", schemaController.ListPredefinedSchemas)

			// Get schema details
			schemas.GET("/:name", schemaController.GetSchemaDetails)

			// Get schema definition
			schemas.GET("/:name/definition", schemaController.GetSchemaByName)

			// Validate custom schema
			schemas.POST("/validate", schemaController.ValidateCustomSchema)

			// Compare schemas
			schemas.POST("/compare", schemaController.CompareSchemas)

			// Get available field types
			schemas.GET("/types", schemaController.GetSchemaTypes)
		}
	}

	// Legacy routes for backward compatibility (if needed)
	legacy := router.Group("/api/v1")
	{
		legacy.POST("/generate", mockdataController.GenerateCustomData)
		legacy.GET("/schemas", schemaController.ListPredefinedSchemas)
	}

	// Root info endpoint
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service":      "Universal Panel - Mockdata Service",
			"version":      "2.0.0",
			"description":  "Professional MVC Architecture for Mock Data Generation",
			"architecture": "MVC (Models-Views-Controllers)",
			"endpoints": gin.H{
				"health":       "GET /ping",
				"generate":     "POST /v1/mockdata/generate",
				"predefined":   "POST /v1/mockdata/generate/:schema_name",
				"bulk":         "POST /v1/mockdata/generate/bulk",
				"validate":     "POST /v1/mockdata/validate",
				"sample":       "GET /v1/mockdata/sample/:schema_name",
				"schemas":      "GET /v1/schemas",
				"schema_types": "GET /v1/schemas/types",
			},
		})
	})
}
