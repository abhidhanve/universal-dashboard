# Build stage
FROM golang:1.23-alpine AS builder

# Install git, ca-certificates, and build tools
RUN apk add --no-cache git ca-certificates tzdata gcc musl-dev

# Set working directory
WORKDIR /app

# Set Go environment variables for better compatibility
ENV GO111MODULE=on \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies with verbose output and retry logic
RUN go env GOPROXY && \
    go mod download -x && \
    go mod verify

# Copy source code and config files
COPY src src
COPY configs configs
COPY main.go .

# Build the application
RUN go build -a -installsuffix cgo -o app .

# Final stage - use alpine instead of scratch for TLS support
FROM alpine:latest

# Install ca-certificates for HTTPS/TLS requests (crucial for MongoDB Atlas)
RUN apk --no-cache add ca-certificates

# Create non-root user
RUN adduser -D -s /bin/sh appuser

# Set working directory
WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/app .

# Change to non-root user
USER appuser

# Expose port
EXPOSE 9081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:9081/ping || exit 1

# Run the application
CMD ["./app"]
