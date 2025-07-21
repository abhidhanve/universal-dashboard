package models

// PredefinedSchemas contains common schema templates
var PredefinedSchemas = map[string]Schema{
	"user": {
		Name:        "User",
		Description: "Basic user profile",
		Fields: []Field{
			{Name: "id", Type: UUIDType, Required: true},
			{Name: "first_name", Type: NameType, Required: true, Pattern: "firstname"},
			{Name: "last_name", Type: NameType, Required: true, Pattern: "lastname"},
			{Name: "email", Type: EmailType, Required: true},
			{Name: "phone", Type: PhoneType, Required: false},
			{Name: "age", Type: IntType, Required: false, Min: 18, Max: 99},
			{Name: "is_active", Type: BoolType, Required: true},
			{Name: "created_at", Type: DateType, Required: true},
		},
	},
	"product": {
		Name:        "Product",
		Description: "E-commerce product",
		Fields: []Field{
			{Name: "id", Type: UUIDType, Required: true},
			{Name: "name", Type: StringType, Required: true, MinLength: 5, MaxLength: 100},
			{Name: "description", Type: StringType, Required: true, MinLength: 20, MaxLength: 500},
			{Name: "price", Type: FloatType, Required: true, Min: 1.0, Max: 10000.0},
			{Name: "category", Type: StringType, Required: true, Options: []string{"Electronics", "Clothing", "Books", "Home", "Sports"}},
			{Name: "in_stock", Type: BoolType, Required: true},
			{Name: "tags", Type: ArrayType, ArrayType: StringType, ArrayLength: 3},
			{Name: "created_at", Type: DateType, Required: true},
		},
	},
	"blog_post": {
		Name:        "Blog Post",
		Description: "Blog article",
		Fields: []Field{
			{Name: "id", Type: UUIDType, Required: true},
			{Name: "title", Type: StringType, Required: true, MinLength: 10, MaxLength: 200},
			{Name: "content", Type: StringType, Required: true, MinLength: 100, MaxLength: 5000},
			{Name: "author", Type: NameType, Required: true},
			{Name: "category", Type: StringType, Required: true, Options: []string{"Technology", "Lifestyle", "Business", "Science", "Entertainment"}},
			{Name: "published", Type: BoolType, Required: true},
			{Name: "views", Type: IntType, Required: false, Min: 0, Max: 1000000},
			{Name: "tags", Type: ArrayType, ArrayType: StringType, ArrayLength: 5},
			{Name: "published_at", Type: DateType, Required: true},
		},
	},
	"order": {
		Name:        "Order",
		Description: "E-commerce order",
		Fields: []Field{
			{Name: "id", Type: UUIDType, Required: true},
			{Name: "customer_id", Type: UUIDType, Required: true},
			{Name: "total_amount", Type: FloatType, Required: true, Min: 10.0, Max: 5000.0},
			{Name: "status", Type: StringType, Required: true, Options: []string{"pending", "processing", "shipped", "delivered", "cancelled"}},
			{Name: "items", Type: ArrayType, ArrayType: JSONType, ArrayLength: 3},
			{Name: "shipping_address", Type: AddressType, Required: true},
			{Name: "created_at", Type: DateType, Required: true},
		},
	},
	"company": {
		Name:        "Company",
		Description: "Company information",
		Fields: []Field{
			{Name: "id", Type: UUIDType, Required: true},
			{Name: "name", Type: StringType, Required: true, Pattern: "company"},
			{Name: "industry", Type: StringType, Required: true, Options: []string{"Technology", "Healthcare", "Finance", "Retail", "Manufacturing"}},
			{Name: "employees", Type: IntType, Required: true, Min: 1, Max: 50000},
			{Name: "website", Type: URLType, Required: false},
			{Name: "founded_year", Type: IntType, Required: true, Min: 1800, Max: 2024},
			{Name: "headquarters", Type: AddressType, Required: true},
			{Name: "active", Type: BoolType, Required: true},
		},
	},
}
