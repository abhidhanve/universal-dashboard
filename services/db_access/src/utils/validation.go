package utils

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

// ParsePaginationParams parses limit and skip parameters from query string
func ParsePaginationParams(c *gin.Context) (int, int) {
	limitStr := c.DefaultQuery("limit", "50")
	skipStr := c.DefaultQuery("skip", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 1000 {
		limit = 50
	}

	skip, err := strconv.Atoi(skipStr)
	if err != nil || skip < 0 {
		skip = 0
	}

	return limit, skip
}

// ValidateLimit validates and normalizes limit parameter
func ValidateLimit(limitStr string, defaultLimit, maxLimit int) int {
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > maxLimit {
		return defaultLimit
	}
	return limit
}

// ValidateSkip validates and normalizes skip parameter
func ValidateSkip(skipStr string) int {
	skip, err := strconv.Atoi(skipStr)
	if err != nil || skip < 0 {
		return 0
	}
	return skip
}

// IsValidDBName checks if database name is valid
func IsValidDBName(dbName string) bool {
	if len(dbName) == 0 || len(dbName) > 64 {
		return false
	}

	// Basic validation - no spaces, special characters
	for _, char := range dbName {
		if !((char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') ||
			char == '_' || char == '-') {
			return false
		}
	}

	return true
}

// IsValidCollectionName checks if collection name is valid
func IsValidCollectionName(collectionName string) bool {
	if len(collectionName) == 0 || len(collectionName) > 120 {
		return false
	}

	// Collection names cannot start with system.
	if len(collectionName) >= 7 && collectionName[:7] == "system." {
		return false
	}

	return true
}

// IsValidUsername checks if username is valid
func IsValidUsername(username string) bool {
	if len(username) == 0 || len(username) > 32 {
		return false
	}

	// Basic validation for MongoDB username
	for _, char := range username {
		if !((char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') ||
			char == '_' || char == '-') {
			return false
		}
	}

	return true
}

// IsValidPassword checks if password meets minimum requirements
func IsValidPassword(password string) bool {
	return len(password) >= 6 && len(password) <= 128
}
