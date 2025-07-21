package controllers

import (
	"net/http"

	"github.com/abhidhanve/universal-dashboard/services/db_access/src/models"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/services"
	"github.com/abhidhanve/universal-dashboard/services/db_access/src/utils"
	"github.com/gin-gonic/gin"
)

type DocumentController struct {
	documentService *services.DocumentService
}

func NewDocumentController() *DocumentController {
	return &DocumentController{
		documentService: services.NewDocumentService(),
	}
}

// CreateEntry handles document creation in a collection
func (ctrl *DocumentController) CreateEntry(c *gin.Context) {
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

	var req models.CreateDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendValidationError(c, err.Error())
		return
	}

	// Call service layer
	response, err := ctrl.documentService.CreateDocument(dbName, collectionName, req)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusCreated, response)
}

// GetCollectionEntries handles retrieving all entries from a collection with pagination
func (ctrl *DocumentController) GetCollectionEntries(c *gin.Context) {
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

	// Parse pagination parameters
	limit, skip := utils.ParsePaginationParams(c)

	// Call service layer
	response, err := ctrl.documentService.GetCollectionEntries(dbName, collectionName, limit, skip)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, response)
}

// UpdateEntry handles updating a specific document
func (ctrl *DocumentController) UpdateEntry(c *gin.Context) {
	dbName := c.Param("db")
	collectionName := c.Param("collection")
	entryID := c.Param("id")

	if dbName == "" {
		utils.SendBadRequest(c, "Database name is required")
		return
	}

	if collectionName == "" {
		utils.SendBadRequest(c, "Collection name is required")
		return
	}

	if entryID == "" {
		utils.SendBadRequest(c, "Document ID is required")
		return
	}

	var req models.UpdateDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendValidationError(c, err.Error())
		return
	}

	// Call service layer
	response, err := ctrl.documentService.UpdateDocument(dbName, collectionName, entryID, req)
	if err != nil {
		if err.Error() == "document not found" {
			utils.SendNotFound(c, "Document not found")
			return
		}
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, response)
}

// DeleteEntry handles deleting a specific document
func (ctrl *DocumentController) DeleteEntry(c *gin.Context) {
	dbName := c.Param("db")
	collectionName := c.Param("collection")
	entryID := c.Param("id")

	if dbName == "" {
		utils.SendBadRequest(c, "Database name is required")
		return
	}

	if collectionName == "" {
		utils.SendBadRequest(c, "Collection name is required")
		return
	}

	if entryID == "" {
		utils.SendBadRequest(c, "Document ID is required")
		return
	}

	// Call service layer
	response, err := ctrl.documentService.DeleteDocument(dbName, collectionName, entryID)
	if err != nil {
		if err.Error() == "document not found" {
			utils.SendNotFound(c, "Document not found")
			return
		}
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetEntry handles retrieving a specific document by ID
func (ctrl *DocumentController) GetEntry(c *gin.Context) {
	dbName := c.Param("db")
	collectionName := c.Param("collection")
	entryID := c.Param("id")

	if dbName == "" {
		utils.SendBadRequest(c, "Database name is required")
		return
	}

	if collectionName == "" {
		utils.SendBadRequest(c, "Collection name is required")
		return
	}

	if entryID == "" {
		utils.SendBadRequest(c, "Document ID is required")
		return
	}

	// Call service layer
	document, err := ctrl.documentService.GetDocumentByID(dbName, collectionName, entryID)
	if err != nil {
		if err.Error() == "document not found" {
			utils.SendNotFound(c, "Document not found")
			return
		}
		utils.SendInternalError(c, err.Error())
		return
	}

	data := map[string]interface{}{
		"database":    dbName,
		"collection":  collectionName,
		"document_id": entryID,
		"data":        document,
	}

	utils.SendSuccessResponse(c, http.StatusOK, "Document retrieved successfully", data)
}
