package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIResponse represents a standardized API response
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Code    int         `json:"code"`
	Meta    interface{} `json:"meta,omitempty"`
}

// RespondSuccess sends a successful response
func RespondSuccess(c *gin.Context, statusCode int, message string, data interface{}) {
	response := APIResponse{
		Success: true,
		Message: message,
		Data:    data,
		Code:    0,
	}

	c.JSON(statusCode, response)
}

// RespondError sends an error response
func RespondError(c *gin.Context, statusCode int, message string, err error) {
	response := APIResponse{
		Success: false,
		Message: message,
		Code:    1,
	}

	if err != nil {
		response.Error = err.Error()
	} else {
		response.Error = message
	}

	c.JSON(statusCode, response)
}

// RespondValidationError sends a validation error response
func RespondValidationError(c *gin.Context, message string, details interface{}) {
	response := APIResponse{
		Success: false,
		Message: message,
		Error:   "Validation failed",
		Code:    1,
		Meta:    details,
	}

	c.JSON(http.StatusBadRequest, response)
}

// RespondInternalError sends an internal server error response
func RespondInternalError(c *gin.Context, err error) {
	response := APIResponse{
		Success: false,
		Message: "Internal server error",
		Error:   err.Error(),
		Code:    1,
	}

	c.JSON(http.StatusInternalServerError, response)
}
