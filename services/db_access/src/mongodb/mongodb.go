package mongodb

import (
	"context"
	"log"
	"reflect"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/bsontype"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ⚠️ SECURITY: Global MongoDB client removed for security reasons
// All connections now managed by main server

func GetClient() *mongo.Client {
	// ⚠️ SECURITY NOTICE: This function is deprecated for security reasons
	// MongoDB credentials should not be stored in microservices environment
	// Use ConnectWithURI() with URIs provided by main server instead
	log.Fatal("GetClient() deprecated: MongoDB URIs should be provided by main server, not stored in microservice environment")
	return nil
}

// ConnectWithURI connects to MongoDB using a custom URI (for Method 3)
func ConnectWithURI(mongoURI string) (*mongo.Client, error) {
	tM := reflect.TypeOf(bson.M{})
	reg := bson.NewRegistryBuilder().RegisterTypeMapEntry(bsontype.EmbeddedDocument, tM).Build()
	clientOptions := options.Client().ApplyURI(mongoURI).SetRegistry(reg)

	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		return nil, err
	}

	// Test the connection
	err = client.Ping(context.TODO(), nil)
	if err != nil {
		client.Disconnect(context.TODO())
		return nil, err
	}

	return client, nil
}
