# Build stage
FROM golang:1.19-alpine AS builder

# Install git and ca-certificates (needed for dependencies)
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Create non-root user
RUN adduser -D -s /bin/sh appuser

# Set working directory
WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Copy app.env file
COPY --from=builder /app/app.env .

# Change to non-root user
USER appuser

# Expose port
EXPOSE 9081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:9081/ping || exit 1

# Run the application
CMD ["./main"]
COPY src src
COPY configs configs

RUN go build -o app


FROM scratch 

COPY --from=BUILD_IMAGE /app/app /

CMD [ "/app" ]
