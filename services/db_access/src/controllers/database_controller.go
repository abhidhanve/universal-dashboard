package controllers

import (
	"net/http"

	"github.com/abhidhanve/universal-dashboard/services/db_access/src/models"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/services"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/utils"
	"github.com/gin-gonic/gin"
)

type DatabaseController struct {
	databaseService *services.DatabaseService
}

func NewDatabaseController() *DatabaseController {
	return &DatabaseController{
		databaseService: services.NewDatabaseService(),
	}
}

// Ping handles health check endpoint
func (ctrl *DatabaseController) Ping(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "pong"})
}

// AllocateDatabase handles database allocation with user creation
func (ctrl *DatabaseController) AllocateDatabase(c *gin.Context) {
	var req models.DatabaseAllocationRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendValidationError(c, err.Error())
		return
	}

	// Call service layer
	response, err := ctrl.databaseService.AllocateDatabase(req)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetDatabaseInfo handles database information retrieval
func (ctrl *DatabaseController) GetDatabaseInfo(c *gin.Context) {
	dbName := c.Param("db")

	if dbName == "" {
		utils.SendBadRequest(c, "Database name is required")
		return
	}

	// Call service layer
	info, err := ctrl.databaseService.GetDatabaseInfo(dbName)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	utils.SendSuccessResponse(c, http.StatusOK, "Database information retrieved successfully", info)
}

// TestConnection handles database connection testing
func (ctrl *DatabaseController) TestConnection(c *gin.Context) {
	dbName := c.Param("db")

	if dbName == "" {
		utils.SendBadRequest(c, "Database name is required")
		return
	}

	// Call service layer
	err := ctrl.databaseService.TestDatabaseConnection(dbName)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	data := map[string]interface{}{
		"database": dbName,
		"status":   "connected",
	}

	utils.SendSuccessResponse(c, http.StatusOK, "Database connection successful", data)
}
