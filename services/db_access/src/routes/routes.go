package routes

import (
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/controllers"
	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all routes for the DB Access service
func SetupRoutes(router *gin.Engine) {
	// Initialize controllers
	databaseController := controllers.NewDatabaseController()
	collectionController := controllers.NewCollectionController()
	documentController := controllers.NewDocumentController()

	// Health check endpoint
	router.GET("/ping", databaseController.Ping)

	// Root endpoint with service information
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service":     "DB Access Service",
			"version":     "1.0.0",
			"description": "MongoDB database access and management service with MVC architecture",
			"endpoints": gin.H{
				"health": "GET /ping",
				"database": gin.H{
					"allocate": "POST /allocate",
					"info":     "GET /db/:db/info",
					"test":     "GET /db/:db/test",
				},
				"collections": gin.H{
					"list":          "GET /collections/:db",
					"detect_schema": "GET /detect-schema/:db/:collection",
					"sample_data":   "GET /sample-data/:db/:collection",
					"analyze_docs":  "POST /analyze-documents",
				},
				"method3": gin.H{
					"schema_analysis": "POST /method3/schema-analysis",
					"data_insert":     "POST /method3/data-insert",
					"data_get":        "POST /method3/data-get",
					"data_delete":     "POST /method3/data-delete",
				},
				"documents": gin.H{
					"create":   "POST /entry/:db/:collection",
					"read":     "GET /entries/:db/:collection",
					"read_one": "GET /entry/:db/:collection/:id",
					"update":   "PUT /entry/:db/:collection/:id",
					"delete":   "DELETE /entry/:db/:collection/:id",
				},
			},
		})
	})

	// === DATABASE OPERATIONS ===
	// Database allocation and management
	router.POST("/allocate", databaseController.AllocateDatabase)
	router.GET("/db/:db/info", databaseController.GetDatabaseInfo)
	router.GET("/db/:db/test", databaseController.TestConnection)

	// === COLLECTION OPERATIONS ===
	// Collection management and schema analysis
	router.GET("/collections/:db", collectionController.ListCollections)
	router.GET("/detect-schema/:db/:collection", collectionController.DetectSchema)
	router.GET("/sample-data/:db/:collection", collectionController.GetSampleData)
	router.POST("/analyze-documents", collectionController.AnalyzeDocuments)

	// Method 3: External MongoDB URI operations
	router.POST("/method3/schema-analysis", collectionController.Method3SchemaAnalysis)
	router.POST("/method3/data-insert", collectionController.Method3DataInsert)
	router.POST("/method3/data-get", collectionController.Method3DataGet)
	router.POST("/method3/data-delete", collectionController.Method3DataDelete)
	router.POST("/method3/add-schema-fields", collectionController.Method3AddSchemaFields)
	router.POST("/method3/remove-schema-field", collectionController.Method3RemoveSchemaField)

	// === DOCUMENT OPERATIONS ===
	// CRUD operations for documents
	router.POST("/entry/:db/:collection", documentController.CreateEntry)
	router.GET("/entries/:db/:collection", documentController.GetCollectionEntries)
	router.GET("/entry/:db/:collection/:id", documentController.GetEntry)
	router.PUT("/entry/:db/:collection/:id", documentController.UpdateEntry)
	router.DELETE("/entry/:db/:collection/:id", documentController.DeleteEntry)

	// === API VERSION 1 ROUTES ===
	// Versioned API endpoints for future compatibility
	v1 := router.Group("/api/v1")
	{
		// Database operations
		v1.POST("/database/allocate", databaseController.AllocateDatabase)
		v1.GET("/database/:db", databaseController.GetDatabaseInfo)
		v1.GET("/database/:db/test", databaseController.TestConnection)

		// Collection operations
		v1.GET("/database/:db/collections", collectionController.ListCollections)
		v1.GET("/collection/:db/:collection/schema", collectionController.DetectSchema)
		v1.GET("/collection/:db/:collection/sample", collectionController.GetSampleData)
		v1.POST("/collections/analyze", collectionController.AnalyzeDocuments)

		// Document operations
		v1.POST("/document/:db/:collection", documentController.CreateEntry)
		v1.GET("/documents/:db/:collection", documentController.GetCollectionEntries)
		v1.GET("/document/:db/:collection/:id", documentController.GetEntry)
		v1.PUT("/document/:db/:collection/:id", documentController.UpdateEntry)
		v1.DELETE("/document/:db/:collection/:id", documentController.DeleteEntry)
	}
}
