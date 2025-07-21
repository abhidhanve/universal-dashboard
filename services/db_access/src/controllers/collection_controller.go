package controllers

import (
	"net/http"

	"github.com/abhidhanve/universal-dashboard/services/db_access/src/models"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/services"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/utils"
	"github.com/gin-gonic/gin"
)

type CollectionController struct {
	collectionService *services.CollectionService
}

func NewCollectionController() *CollectionController {
	return &CollectionController{
		collectionService: services.NewCollectionService(),
	}
}

// ListCollections handles listing all collections in a database
func (ctrl *CollectionController) ListCollections(c *gin.Context) {
	dbName := c.Param("db")

	if dbName == "" {
		utils.SendBadRequest(c, "Database name is required")
		return
	}

	// Call service layer
	response, err := ctrl.collectionService.ListCollections(dbName)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, response)
}

// DetectSchema handles schema detection for a collection
func (ctrl *CollectionController) DetectSchema(c *gin.Context) {
	dbName := c.Param("db")
	collectionName := c.Param("collection")

	if dbName == "" {
		utils.SendBadRequest(c, "Database name is required")
		return
	}

	if collectionName == "" {
		utils.SendBadRequest(c, "Collection name is required")
		return
	}

	// Call service layer
	response, err := ctrl.collectionService.DetectSchema(dbName, collectionName)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetSampleData handles sample data retrieval from a collection
func (ctrl *CollectionController) GetSampleData(c *gin.Context) {
	dbName := c.Param("db")
	collectionName := c.Param("collection")

	if dbName == "" {
		utils.SendBadRequest(c, "Database name is required")
		return
	}

	if collectionName == "" {
		utils.SendBadRequest(c, "Collection name is required")
		return
	}

	// Parse limit parameter
	limitStr := c.DefaultQuery("limit", "10")
	limit := utils.ValidateLimit(limitStr, 10, 100)

	// Call service layer
	response, err := ctrl.collectionService.GetSampleData(dbName, collectionName, limit)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, response)
}

// AnalyzeDocuments handles document analysis for multiple collections
func (ctrl *CollectionController) AnalyzeDocuments(c *gin.Context) {
	var req models.DocumentAnalysisRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendValidationError(c, err.Error())
		return
	}

	// Call service layer
	response, err := ctrl.collectionService.AnalyzeMultipleCollections(req)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, response)
}

// Method3SchemaAnalysis handles schema analysis using external MongoDB URI (Method 3)
func (ctrl *CollectionController) Method3SchemaAnalysis(c *gin.Context) {
	var req models.Method3SchemaRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendValidationError(c, err.Error())
		return
	}

	// Call service layer for Method 3 schema analysis
	response, err := ctrl.collectionService.Method3DetectSchema(req)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, response)
}

// Method3DataInsert handles data insertion using external MongoDB URI (Method 3)
func (ctrl *CollectionController) Method3DataInsert(c *gin.Context) {
	var req models.Method3DataInsertRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendValidationError(c, err.Error())
		return
	}

	// Call service layer for Method 3 data insertion
	response, err := ctrl.collectionService.Method3InsertData(req)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, response)
}

// Method3DataGet handles data retrieval using external MongoDB URI (Method 3)
func (ctrl *CollectionController) Method3DataGet(c *gin.Context) {
	var req models.Method3DataRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendValidationError(c, err.Error())
		return
	}

	// Call service layer for Method 3 data retrieval
	response, err := ctrl.collectionService.Method3GetData(req)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, response)
}

// Method3DataDelete handles data deletion using external MongoDB URI (Method 3)
func (ctrl *CollectionController) Method3DataDelete(c *gin.Context) {
	var req models.Method3DataRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendValidationError(c, err.Error())
		return
	}

	// Call service layer for Method 3 data deletion
	response, err := ctrl.collectionService.Method3DeleteData(req)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, response)
}
