# SOLID Principles

## Introduction

SOLID is an acronym representing five design principles intended to make software designs more understandable, flexible, and maintainable. These principles are a subset of many principles promoted by Robert C. Martin.

*   **Single Responsibility Principle (SRP):** A class should have only one reason to change.
*   **Open/Closed Principle (OCP):** Software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification.
*   **Liskov Substitution Principle (LSP):** Objects of a superclass should be able to be replaced with objects of its subclasses without affecting the correctness of the program.
*   **Interface Segregation Principle (ISP):** Many client-specific interfaces are better than one general-purpose interface.
*   **Dependency Inversion Principle (DIP):** Depend upon abstractions, not concretions.

## Tricky Interview Question

**Question:** Explain the Open/Closed Principle and how it can be applied in practice.

**Answer:** The Open/Closed Principle states that software entities should be open for extension but closed for modification. This means you should be able to add new functionality without changing existing code. In practice, this can be achieved through the use of abstractions like interfaces and abstract classes. By programming to interfaces, you can introduce new implementations without altering the code that depends on those interfaces.

## Code Example: Open/Closed Principle Violation and Refactoring

**Violation:**

```csharp
public class Rectangle
{
    public double Width { get; set; }
    public double Height { get; set; }
}

public class Circle
{
    public double Radius { get; set; }
}

public class AreaCalculator
{
    public double CalculateArea(object shape)
    {
        if (shape is Rectangle)
        {
            Rectangle rectangle = (Rectangle)shape;
            return rectangle.Width * rectangle.Height;
        }
        else if (shape is Circle)
        {
            Circle circle = (Circle)shape;
            return Math.PI * circle.Radius * circle.Radius;
        }

        throw new ArgumentException("Shape is not supported");
    }
}
```

**Refactoring:**

```csharp
public interface IShape
{
    double CalculateArea();
}

public class Rectangle : IShape
{
    public double Width { get; set; }
    public double Height { get; set; }

    public double CalculateArea()
    {
        return Width * Height;
    }
}

public class Circle : IShape
{
    public double Radius { get; set; }

    public double CalculateArea()
    {
        return Math.PI * Radius * Radius;
    }
}

public class AreaCalculator
{
    public double CalculateArea(IShape shape)
    {
        return shape.CalculateArea();
    }
}
```

**Explanation:**

The original `AreaCalculator` violates the Open/Closed Principle because every time a new shape is introduced, the `CalculateArea` method needs to be modified. The refactored code introduces an `IShape` interface with a `CalculateArea` method. Each shape class implements this interface, providing its own implementation of the area calculation. The `AreaCalculator` now depends on the `IShape` abstraction, allowing new shapes to be added without modifying the `AreaCalculator` class.

## Code Debugging Task: Single Responsibility Principle

**Code with Bug:**

```csharp
public class User
{
    public string Name { get; set; }
    public string Email { get; set; }

    public void SaveUser(User user)
    {
        // Save user to database
    }

    public void SendEmail(string email, string message)
    {
        // Send email to user
    }
}
```

**Explanation of Bug and Corrected Code:**

The `User` class violates the Single Responsibility Principle because it has two responsibilities: managing user data and sending emails. These responsibilities should be separated into different classes.

**Corrected Code:**

```csharp
public class User
{
    public string Name { get; set; }
    public string Email { get; set; }
}

public class UserRepository
{
    public void SaveUser(User user)
    {
        // Save user to database
    }
}

public class EmailService
{
    public void SendEmail(string email, string message)
    {
        // Send email to user
    }
}
```

In the corrected code, the `UserRepository` class is responsible for saving user data, and the `EmailService` class is responsible for sending emails. This separation of concerns makes the code more modular, testable, and maintainable.


## Additional Questions and Answers

<details><summary>Question: What is SOLID?</summary>

SOLID is a set of object-oriented programming principles aimed at creating understandable, flexible, and maintainable code. The SOLID acronym stands for:

1. **Single Responsibility Principle**
2. **Open/Closed Principle**
3. **Liskov Substitution Principle**
4. **Interface Segregation Principle**
5. **Dependency Inversion Principle**
</details>

<details><summary>Question: What is the essence of the Single Responsibility Principle (SRP)?</summary>

The Single Responsibility Principle states that a class should have only one reason to change, meaning it should have only one responsibility.

**Key aspects:**
- Each class solves only one task
- All class methods relate to that task
- Requirement changes for one task should only affect one class

**SRP violation example:**
```csharp
class Report {
    void GenerateReport() { /* ... */ }
    void SaveToFile() { /* ... */ }
    void PrintReport() { /* ... */ }
}
```

**Corrected version:**
```csharp
class Report {
    void Generate() { /* ... */ }
}

class ReportSaver {
    void Save(Report report) { /* ... */ }
}

class ReportPrinter {
    void Print(Report report) { /* ... */ }
}
```
</details>

<details><summary>Question: What does the Open/Closed Principle (OCP) mean?</summary>

The Open/Closed Principle states that software entities (classes, modules, functions) should be:

- **Open for extension**: New behavior can be added without modifying existing code
- **Closed for modification**: Source code shouldn't change when adding new functionality

**OCP implementation methods:**
1. Using abstractions (interfaces, abstract classes)
2. Applying design patterns (Strategy, Decorator, etc.)
3. Using extension mechanisms (e.g., through Dependency Injection)

**OCP violation example:**
```csharp
class ReportGenerator {
    void Generate(string type) {
        if (type == "PDF") { /* ... */ }
        else if (type == "HTML") { /* ... */ }
    }
}
```

**Corrected version:**
```csharp
interface IReportGenerator {
    void Generate();
}

class PdfReportGenerator : IReportGenerator { /* ... */ }
class HtmlReportGenerator : IReportGenerator { /* ... */ }