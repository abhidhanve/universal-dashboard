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
	Port              string `mapstructure:"PORT"`
	AES_key           string `mapstructure:"AES_KEY"`
	AES_iv            string `mapstructure:"AES_IV"`
	MaxConnections    int    `mapstructure:"MAX_CONNECTIONS"`
	ConnectionTimeout string `mapstructure:"CONNECTION_TIMEOUT"`
	LogLevel          string `mapstructure:"LOG_LEVEL"`
}

func loadEnvVariables() (config *env) {
	viper.AddConfigPath(".")
	viper.AddConfigPath("/app") // For production deployment
	viper.AddConfigPath("./services/db_access")

	viper.SetConfigName("app")
	viper.SetConfigType("env")

	// Also read from environment variables (this will override file values)
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: Config file not found, using environment variables: %v", err)
		// Don't fatal error in production, use env vars
	}

	if err := viper.Unmarshal(&config); err != nil {
		log.Fatal(err)
	}

	return
}
