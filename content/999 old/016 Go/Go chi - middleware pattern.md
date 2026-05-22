---
type: reference
title: Go chi - middleware pattern
tags: 
categories: 
createdAt: 2025-06-26 17:42
lastmod: 2025-06-26 17:42
lang: ko
pin: true
math: true
mermaid: true
permalink:
---
When I started learning Go web development, one of the concepts that initially confused me was middleware. How do they work? When do they execute? Should I apply them globally or to specific routes? After diving deep into the Chi router and building my first Go web application, I want to share what I've learned about middleware patterns that every Go developer should know.

## What is Middleware?

Middleware functions sit between incoming HTTP requests and your final handler functions. Think of them as a series of processing stations that every request passes through before reaching its destination.

```go
Request → Middleware1 → Middleware2 → Middleware3 → Handler → Response
```

In Go, middleware follows a simple pattern: it takes an `http.Handler` and returns an `http.Handler`. This creates a "chain" where each middleware can process the request before passing it to the next middleware or handler.

```go
func MyMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Do something BEFORE the handler
        fmt.Println("Before handler")
        
        // Call the next handler in the chain
        next.ServeHTTP(w, r)
        
        // Do something AFTER the handler
        fmt.Println("After handler")
    })
}
```

## How Middleware Chaining Works

The key insight that clicked for me was understanding that middleware creates nested function calls. When you register multiple middleware, they don't execute in a simple sequence—they wrap around each other like onions.

Here's what actually happens when you have multiple middleware:

```go
r.Use(LoggingMiddleware)
r.Use(AuthMiddleware)
r.Use(CORSMiddleware)
r.Get("/api/users", GetUsersHandler)
```

Internally, this becomes:

```go
finalHandler = LoggingMiddleware(AuthMiddleware(CORSMiddleware(GetUsersHandler)))
```

When a request comes in, the execution flow looks like this:

```
1. LoggingMiddleware BEFORE
2. AuthMiddleware BEFORE
3. CORSMiddleware BEFORE
4. GetUsersHandler EXECUTES
5. CORSMiddleware AFTER
6. AuthMiddleware AFTER
7. LoggingMiddleware AFTER
```

This nested execution is powerful because it allows middleware to:

- Set up context before the handler runs
- Modify the response after the handler completes
- Short-circuit the chain by returning early (like for authentication failures)

## Global vs Route-Specific Middleware

One of the most important decisions in structuring your Go web application is determining which middleware should be global and which should be route-specific.

### Global Middleware Pattern

Global middleware applies to every single request that hits your server:

```go
func main() {
    r := chi.NewRouter()
    
    // Global middleware - runs for ALL routes
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(ErrorHandlingMiddleware)
    
    // All routes defined below get this middleware
    r.Get("/", HomeHandler)
    r.Get("/api/users", GetUsersHandler)
    r.Get("/admin/dashboard", AdminHandler)
}
```

**Use global middleware for:**

- Request logging
- Panic recovery
- Error handling
- Basic security headers

### Route-Specific Middleware Pattern

Route-specific middleware only applies to certain routes or route groups. This is not only acceptable—it's the recommended approach for most middleware!

```go
r.Route("/api", func(r chi.Router) {
    r.Use(CORSMiddleware)      // Only API routes need CORS
    r.Use(RateLimitMiddleware) // Only API routes need rate limiting
    
    r.Get("/users", GetUsersHandler)
    r.Post("/posts", CreatePostHandler)
})

r.Route("/admin", func(r chi.Router) {
    r.Use(AuthMiddleware)   // Only admin routes need authentication
    r.Use(AdminMiddleware)  // Only admin routes need admin checks
    
    r.Get("/dashboard", AdminDashboardHandler)
    r.Get("/users", ManageUsersHandler)
})
```

**Use route-specific middleware for:**

- Authentication (only protected routes need it)
- CORS headers (only API routes need them)
- Rate limiting (only public APIs need it)
- Input validation (only routes with user input need it)
- Caching (only expensive operations need it)

## Why Route-Specific Middleware is Better

When I first started, I thought applying all middleware globally was simpler. I was wrong. Route-specific middleware offers significant advantages:

**Performance Benefits:**

```go
// ❌ Bad: Every request pays the authentication cost
r.Use(AuthMiddleware) // Runs for homepage, static files, everything!

// ✅ Good: Only protected routes pay the authentication cost
r.Route("/admin", func(r chi.Router) {
    r.Use(AuthMiddleware) // Only runs for admin routes
})
```

**Security Benefits:**

```go
// ❌ Bad: CORS headers on admin panel (security risk)
r.Use(CORSMiddleware) // Adds permissive CORS to admin routes

// ✅ Good: CORS only where needed
r.Route("/api", func(r chi.Router) {
    r.Use(CORSMiddleware) // Only public API gets CORS
})
```

**Maintainability Benefits:** Route-specific middleware makes your intent crystal clear. When I see this code:

```go
r.Route("/api", func(r chi.Router) {
    r.Use(RateLimitMiddleware)
    r.Use(ValidationMiddleware)
    
    r.Route("/admin", func(r chi.Router) {
        r.Use(AuthMiddleware)
        // admin API routes
    })
})
```

I immediately understand that:

- All API routes get rate limiting and validation
- Admin API routes additionally require authentication
- Other routes in the application don't have these concerns

## Middleware Patterns in Chi Router

Chi provides several patterns for applying middleware at different scopes:

### Pattern 1: Global Middleware

```go
r.Use(middleware.Logger)    // Applies to ALL routes
```

### Pattern 2: Route Group Middleware

```go
r.Route("/api", func(r chi.Router) {
    r.Use(APIMiddleware)    // Applies to all /api/* routes
    
    r.Get("/users", handler)
    r.Post("/posts", handler)
})
```

### Pattern 3: Single Route Middleware

```go
// Single middleware
r.With(CacheMiddleware).Get("/expensive", handler)

// Multiple middleware
r.With(AuthMiddleware, ValidationMiddleware).Post("/secure", handler)
```

### Pattern 4: Nested Route Groups

```go
r.Route("/api", func(r chi.Router) {
    r.Use(APIMiddleware)    // Applies to all /api/*
    
    r.Route("/protected", func(r chi.Router) {
        r.Use(AuthMiddleware)  // Applies to all /api/protected/*
        
        // This route gets both APIMiddleware AND AuthMiddleware
        r.Get("/profile", handler)
    })
})
```

## Common Middleware Use Cases

Here are the middleware patterns I use most frequently in production applications:

### Authentication Middleware

```go
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return // Stop the chain here
        }
        
        // Validate token and set user context
        // ...
        
        next.ServeHTTP(w, r)
    })
}
```

### CORS Middleware

```go
func CORSMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return // Handle preflight request
        }
        
        next.ServeHTTP(w, r)
    })
}
```

### Logging Middleware

```go
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        next.ServeHTTP(w, r)
        
        slog.Info("Request completed",
            "method", r.Method,
            "path", r.URL.Path,
            "duration", time.Since(start))
    })
}
```

## Structured Logging in Go

While we're talking about middleware, let's touch on structured logging—a pattern that pairs perfectly with middleware for observability.

Instead of plain text logs:

```go
log.Println("User logged in: john_doe from IP 192.168.1.1")
```

Use structured logging with key-value pairs:

```go
slog.Info("User logged in",
    "username", "john_doe",
    "ip", "192.168.1.1",
    "timestamp", time.Now())
```

This outputs JSON that's machine-readable:

```json
{
  "time": "2024-01-15T10:30:45Z",
  "level": "INFO",
  "msg": "User logged in",
  "username": "john_doe",
  "ip": "192.168.1.1"
}
```

Structured logs are invaluable for debugging production issues and can be easily ingested by log aggregation tools.

## Best Practices

After building several Go web applications, here are my recommendations:

### Middleware Ordering Matters

```go
r.Use(LoggingMiddleware)    // Log everything first
r.Use(RecovererMiddleware)  // Catch panics early
r.Use(AuthMiddleware)       // Check auth before business logic
r.Use(ValidationMiddleware) // Validate input last before handler
```

### Keep Middleware Focused

Each middleware should have one responsibility:

- Authentication middleware only checks auth
- Logging middleware only logs
- CORS middleware only handles CORS

### Use Context for Request-Scoped Data

```go
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Validate user and add to context
        user := validateToken(r.Header.Get("Authorization"))
        ctx := context.WithValue(r.Context(), "user", user)
        
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

### Handle Errors Gracefully

```go
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            w.Header().Set("Content-Type", "application/json")
            w.WriteHeader(http.StatusUnauthorized)
            json.NewEncoder(w).Encode(map[string]string{
                "error": "Authorization header required",
            })
            return
        }
        
        next.ServeHTTP(w, r)
    })
}
```

## Real-World Application Structure

Here's how I structure a typical Go web application with middleware:

```go
func main() {
    r := chi.NewRouter()
    
    // Global middleware (applies to everything)
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(ErrorHandlingMiddleware)
    
    // Static files (no additional middleware needed)
    r.Handle("/static/*", http.StripPrefix("/static/", 
        http.FileServer(http.Dir("web/static/"))))
    
    // Health check (no additional middleware needed)
    r.Get("/health", handlers.HealthCheck)
    
    // Public API (CORS + rate limiting)
    r.Route("/api", func(r chi.Router) {
        r.Use(CORSMiddleware)
        r.Use(RateLimitMiddleware)
        
        r.Route("/player", func(r chi.Router) {
            r.Use(ValidationMiddleware) // Only player routes need validation
            r.Get("/{gameName}/{tagLine}", handlers.GetPlayerStats)
        })
    })
    
    // Admin API (authentication required)
    r.Route("/admin", func(r chi.Router) {
        r.Use(AuthMiddleware)
        r.Use(AdminMiddleware)
        
        r.Get("/dashboard", handlers.AdminDashboard)
        r.Get("/users", handlers.ManageUsers)
    })
    
    // Web pages (CSRF protection for forms)
    r.Route("/", func(r chi.Router) {
        r.Get("/", handlers.HomePage)
        r.With(CSRFMiddleware).Post("/search", handlers.SearchPlayer)
    })
    
    slog.Info("Server starting", "port", 8080)
    http.ListenAndServe(":8080", r)
}
```

## Conclusion

Understanding middleware is crucial for building robust Go web applications. The key insights that helped me were:

1. **Middleware creates nested execution**, not sequential execution
2. **Route-specific middleware is better** than applying everything globally
3. **Chi provides flexible patterns** for applying middleware at different scopes
4. **Middleware should be focused** on single responsibilities
5. **Structured logging pairs perfectly** with middleware for observability

Middleware might seem complex at first, but once you understand the patterns, it becomes a powerful tool for writing clean, maintainable web applications. The separation of concerns it provides—keeping cross-cutting concerns like authentication, logging, and validation separate from your business logic—is invaluable as your application grows.

Start with global middleware for the basics (logging, error handling), then add route-specific middleware as you need more specialized behavior. Your future self will thank you for the clarity and maintainability this approach provides.
