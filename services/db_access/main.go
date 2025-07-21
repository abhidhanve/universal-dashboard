package main

import (
	"fmt"
	"log"

	"github.com/abhidhanve/universal-dashboard/services/db_access/configs"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// ⚠️ SECURITY: Global MongoDB client removed for security
// All database connections now managed by main server

func main() {
	// Initialize environment configurations
	configs.InitEnvConfigs()

	// Get port from environment
	port := configs.Env.Port

	// Initialize Gin router
	router := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173", "http://localhost:3000", "http://localhost:8081"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(config))

	// ⚠️ SECURITY: MongoDB client initialization removed
	// All database connections now managed by main server for security
	// Microservice only handles operations with URIs provided by main server

	// Setup all routes using MVC architecture
	routes.SetupRoutes(router)

	fmt.Printf("🚀 DB Access Service (MVC Architecture) starting on port %s\n", port)
	fmt.Println("📋 Available endpoints:")
	fmt.Println("   • Health: GET /ping")
	fmt.Println("   • Allocate DB: POST /allocate")
	fmt.Println("   • Collections: GET /collections/:db")
	fmt.Println("   • Schema Detection: GET /detect-schema/:db/:collection")
	fmt.Println("   • Documents: GET /entries/:db/:collection")
	fmt.Println("   • CRUD: POST|GET|PUT|DELETE /entry/:db/:collection[/:id]")
	fmt.Println("   • API v1: /api/v1/*")
	fmt.Println("   • Info: GET /")

	// Start the server
	if err := router.Run(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
