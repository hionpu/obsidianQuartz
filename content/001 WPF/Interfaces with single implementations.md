---
type: reference
title: Interfaces with single implementations
tags:
  - "#WPF"
  - "#CSharp"
  - "#Design-Patterns"
  - "#SOLID"
  - "#Unit-Testing"
categories: null
createdAt: 2025-06-05 11:12
lastmod: 2025-06-05 11:12
lang: en
pin: true
math: true
mermaid: true
permalink: interfaces-with-single-implementations
---
# The Value of Interfaces with Single Implementations

In my journey of refactoring a large [[WPF]] application to follow better design practices, I encountered a common question that many developers face: **"If an interface has only one implementation, is it really necessary?"**

This question often arises when developers are first exposed to [[SOLID]] principles and [[Design-Patterns|design patterns]]. They see interfaces like `IApiService` that only have a single concrete implementation `ApiService`, and wonder if this abstraction adds any value or if it's just "architecture astronautics."

## The Case for Single-Implementation Interfaces

After examining numerous well-structured codebases and applying these principles in my own work, I've concluded that interfaces with single implementations provide substantial value. Here's why:

### 1. Dependency Inversion and Decoupling

The [[SOLID|Dependency Inversion Principle]] states that high-level modules should not depend on low-level modules; both should depend on abstractions. An interface creates a clear boundary between components, regardless of how many implementations exist.

```csharp
// Better: Depends on abstraction
public class ContentViewModel
{
    private readonly IApiService _apiService;
    
    public ContentViewModel(IApiService apiService)
    {
        _apiService = apiService;
    }
}

// Less flexible: Directly coupled to implementation
public class ContentViewModel
{
    private readonly ApiService _apiService;
    
    public ContentViewModel(ApiService apiService)
    {
        _apiService = apiService;
    }
}
```

This decoupling means changes to the implementation don't affect consumers, as long as the interface remains stable.

### 2. Unit Testing Made Simple

Perhaps the most immediate benefit is in [[Unit-Testing|unit testing]]. With interfaces, you can create mock implementations for testing purposes:

```csharp
[TestMethod]
public async Task LoadContent_ShouldDisplayContentTitle()
{
    // Arrange
    var mockApiService = new Mock<IApiService>();
    mockApiService.Setup(x => x.GetContentAsync(It.IsAny<string>()))
                  .ReturnsAsync(new ContentItem { Title = "Test Content" });
    
    var viewModel = new ContentViewModel(mockApiService.Object);
    
    // Act
    await viewModel.LoadContentCommand.ExecuteAsync("test");
    
    // Assert
    Assert.AreEqual("Test Content", viewModel.ContentTitle);
}
```

Without interfaces, testing becomes significantly more complex, often requiring elaborate setups with test servers or databases.

### 3. Future-Proofing Your Design

What starts as a single implementation frequently evolves into multiple implementations as requirements change:

```csharp
// Original implementation
public class ApiService : IApiService { /*...*/ }

// Later addition for testing
public class MockApiService : IApiService { /*...*/ }

// Another implementation for offline mode
public class OfflineApiService : IApiService { /*...*/ }

// Added for a specific client with different API structure
public class LegacyApiService : IApiService { /*...*/ }
```

Having established the interface from the beginning makes these transitions seamless.

### 4. Design by Contract

An interface defines a clear contract that implementations must fulfill. This explicitness in API boundaries helps developers understand how components are meant to interact, improving maintainability.

### 5. Enabling the Decorator Pattern

One of the most powerful patterns enabled by interfaces is the [[Design-Patterns|decorator pattern]], which allows adding behavior without modifying existing code:

```csharp
// Original service
public class ApiService : IApiService { /*...*/ }

// Add logging without changing the original implementation
public class LoggingApiService : IApiService 
{
    private readonly IApiService _inner;
    private readonly ILogger _logger;
    
    public LoggingApiService(IApiService inner, ILogger logger) 
    {
        _inner = inner;
        _logger = logger;
    }
    
    public async Task<T> GetAsync<T>(string endpoint) 
    {
        _logger.Log($"Calling {endpoint}");
        var result = await _inner.GetAsync<T>(endpoint);
        _logger.Log($"Completed {endpoint}");
        return result;
    }
}
```

This pattern is invaluable for adding cross-cutting concerns like caching, logging, or performance monitoring.

## Real-World Examples

In my recent refactoring project, I introduced several interfaces that initially had single implementations:

- `INavigationService`: Decouples page/view navigation from ViewModels
- `IApiService`: Creates a stable contract for API interactions  
- `IContentHierarchyService`: Manages content organization independently of UI
- `IMemoRepository`: Abstracts data access for the memo feature

These interfaces made the codebase significantly more testable and maintainable, even though most started with just one implementation.

## When to Use Interfaces

Based on my experience, interfaces with single implementations are most valuable when:

1. **The component crosses architectural boundaries** (e.g., UI to Services layer)
2. **You need to unit test the consumer** of the implementation
3. **The component is likely to evolve** or have alternate implementations
4. **You need to apply cross-cutting concerns** (logging, caching, etc.)
5. **You're working in a team environment** where clear contracts help collaboration

## When to Reconsider

Of course, interfaces aren't always necessary. You might skip them when:

1. The class is a simple data container (POCO/DTO)
2. You're certain the implementation will never change or be mocked
3. You're working in very performance-critical code where the abstraction overhead matters
4. You're in the exploratory phase and the design is still fluid
