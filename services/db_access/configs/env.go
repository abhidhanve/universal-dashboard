package configs

import (
	"log"

	"github.com/spf13/viper"
)

var Env *env

func InitEnvConfigs() {
	Env = loadEnvVariables()
}

type env struct {
	// ⚠️ SECURITY: MongoDB credentials removed from microservices
	// Main server now manages all MongoDB URIs securely
	// Mongodb_URI      string `mapstructure:"MONGODB_URI"`      // REMOVED for security
	// Mongodb_Hostname string `mapstructure:"MONGODB_HOSTNAME"` // REMOVED for security

	Port              string `mapstructure:"PORT"`
	AES_key           string `mapstructure:"AES_KEY"`
	AES_iv            string `mapstructure:"AES_IV"`
	MaxConnections    int    `mapstructure:"MAX_CONNECTIONS"`
	ConnectionTimeout string `mapstructure:"CONNECTION_TIMEOUT"`
	LogLevel          string `mapstructure:"LOG_LEVEL"`
}

func loadEnvVariables() (config *env) {
	viper.AddConfigPath(".")

	viper.SetConfigName("app")

	viper.SetConfigType("env")

	if err := viper.ReadInConfig(); err != nil {
		log.Fatal("Error reading env file", err)
	}

	if err := viper.Unmarshal(&config); err != nil {
		log.Fatal(err)
	}

	return
}
