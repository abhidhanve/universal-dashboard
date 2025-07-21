package utils

import (
	"net/http"

	"github.com/abhidhanve/universal-dashboard/services/db_access/src/models"
	"github.com/gin-gonic/gin"
)

// SendSuccessResponse sends a standardized success response
func SendSuccessResponse(c *gin.Context, statusCode int, message string, data interface{}) {
	response := models.SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
		Code:    0,
	}
	c.JSON(statusCode, response)
}

// SendErrorResponse sends a standardized error response
func SendErrorResponse(c *gin.Context, statusCode int, message string, code int) {
	response := models.ErrorResponse{
		Error: message,
		Code:  code,
	}
	c.JSON(statusCode, response)
}

// SendInternalError sends a 500 internal server error
func SendInternalError(c *gin.Context, message string) {
	SendErrorResponse(c, http.StatusInternalServerError, message, 1)
}

// SendBadRequest sends a 400 bad request error
func SendBadRequest(c *gin.Context, message string) {
	SendErrorResponse(c, http.StatusBadRequest, message, 1)
}

// SendNotFound sends a 404 not found error
func SendNotFound(c *gin.Context, message string) {
	SendErrorResponse(c, http.StatusNotFound, message, 1)
}

// SendValidationError sends a validation error response
func SendValidationError(c *gin.Context, message string) {
	SendBadRequest(c, "Invalid request body: "+message)
}

// CreateSuccessData creates a success data object
func CreateSuccessData(message string, data map[string]interface{}) map[string]interface{} {
	result := map[string]interface{}{
		"message": message,
		"code":    0,
	}

	for key, value := range data {
		result[key] = value
	}

	return result
}
