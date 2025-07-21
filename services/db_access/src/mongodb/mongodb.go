package mongodb

import (
	"context"
	"reflect"
	"sync"

	"github.com/abhidhanve/universal-dashboard/services/db_access/configs"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/bsontype"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	once     sync.Once
	dbClient *mongo.Client
)

func GetClient() *mongo.Client {
	once.Do(func() {
		db_uri := configs.Env.Mongodb_URI

		tM := reflect.TypeOf(bson.M{})
		reg := bson.NewRegistryBuilder().RegisterTypeMapEntry(bsontype.EmbeddedDocument, tM).Build()
		clientOptions := options.Client().ApplyURI(db_uri).SetRegistry(reg)

		client, err := mongo.Connect(context.TODO(), clientOptions)

		if err != nil {
			return
		}

		dbClient = client
	})

	return dbClient
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
