package main

import (
	"fmt"

	"github.com/abhidhanve/universal-dashboard/services/mockdata/configs"
	"github.com/abhidhanve/universal-dashboard/services/mockdata/src/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	configs.InitEnvConfigs()

	port := configs.Env.Port

	// Set Gin mode based on environment
	if configs.Env.Port == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173", "http://localhost:3000", "http://localhost:8081"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(config))

	// Setup all routes using MVC architecture
	routes.SetupRoutes(router)

	fmt.Printf("🚀 Mockdata Service (MVC Architecture) starting on port %s\n", port)
	fmt.Printf("📋 Available endpoints:\n")
	fmt.Printf("   • Health: GET /ping\n")
	fmt.Printf("   • Generate: POST /v1/mockdata/generate\n")
	fmt.Printf("   • Predefined: POST /v1/mockdata/generate/:schema\n")
	fmt.Printf("   • Schemas: GET /v1/schemas\n")
	fmt.Printf("   • Info: GET /\n")

	router.Run(fmt.Sprintf(":%s", port))
}
