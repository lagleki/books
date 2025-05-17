# Code Smells

## Introduction to Common Mistakes and Code Smells

Code smells are surface indications of deeper problems within the code. They don't always indicate a bug, but they suggest a potential issue that could hinder maintainability, readability, and extensibility. Common code smells include:

*   **Long Method:** A method that has grown too large and complex, making it difficult to understand and maintain.
*   **God Class:** A class that does too much, centralizing control and responsibilities in a single class.
*   **Data Clumps:** Groups of variables that frequently appear together, suggesting a missing abstraction.

## Tricky Interview Question: God Class

Explain what is a 'God Class' and how to refactor it.

## Detailed Answer: God Class

A 'God Class' is a class that assumes too many responsibilities and knows about too many other classes. It tends to be large, complex, and difficult to maintain. This code smell violates the Single Responsibility Principle.

**Refactoring Techniques:**

*   **Extract Class:** Move some of the responsibilities to a new class.
*   **Extract Method:** Break down large methods into smaller, more focused methods.
*   **Introduce Parameter Object:** If the class manipulates a lot of data, group related data into a new class.

## Code Example: God Class

```csharp
public class OrderProcessor
{
    public void ProcessOrder(Order order)
    {
        // Validate order details
        if (!ValidateOrder(order))
        {
            throw new Exception("Invalid order");
        }

        // Calculate total amount
        decimal totalAmount = CalculateTotal(order);

        // Apply discounts
        decimal discountedAmount = ApplyDiscounts(totalAmount, order.CustomerId);

        // Calculate shipping cost
        decimal shippingCost = CalculateShipping(order.ShippingAddress);

        // Process payment
        ProcessPayment(discountedAmount + shippingCost, order.PaymentInfo);

        // Update inventory
        UpdateInventory(order.Items);

        // Send confirmation email
        SendConfirmationEmail(order.CustomerEmail, totalAmount, discountedAmount + shippingCost);
    }

    private bool ValidateOrder(Order order) { /* ... */ return true; }
    private decimal CalculateTotal(Order order) { /* ... */ return 100; }
    private decimal ApplyDiscounts(decimal amount, int customerId) { /* ... */ return amount; }
    private decimal CalculateShipping(string shippingAddress) { /* ... */ return 10; }
    private void ProcessPayment(decimal amount, PaymentInfo paymentInfo) { /* ... */ }
    private void UpdateInventory(List<OrderItem> items) { /* ... */ }
    private void SendConfirmationEmail(string customerEmail, decimal totalAmount, decimal finalAmount) { /* ... */ }
}

public class Order { public string CustomerEmail { get; set; } public string ShippingAddress { get; set; } public int CustomerId { get; set; } public PaymentInfo PaymentInfo { get; set; } public List<OrderItem> Items { get; set; } }
public class PaymentInfo { }
public class OrderItem { }
```

## Code Debugging Task: Long Method

Refactor the following code to remove the 'Long Method' code smell.

```csharp
public class ReportGenerator
{
    public string GenerateReport(List<DataPoint> data)
    {
        string report = "Report:\n";

        // Calculate statistics
        double sum = 0;
        foreach (var d in data)
        {
            sum += d.Value;
        }
        double average = sum / data.Count;

        double min = data[0].Value;
        foreach (var d in data)
        {
            if (d.Value < min)
            {
                min = d.Value;
            }
        }

        double max = data[0].Value;
        foreach (var d in data)
        {
            if (d.Value > max)
            {
                max = d.Value;
            }
        }

        // Format the report
        report += $"Average: {average}\n";
        report += $"Minimum: {min}\n";
        report += $"Maximum: {max}\n";

        // Add data points to the report
        report += "Data Points:\n";
        foreach (var d in data)
        {
            report += $"{d.Label}: {d.Value}\n";
        }

        return report;
    }
}

public class DataPoint { public string Label { get; set; } public double Value { get; set; }
```

## Explanation and Corrected Code

The `GenerateReport` method in the `ReportGenerator` class is a 'Long Method' because it performs multiple distinct operations: calculating statistics, formatting the report, and adding data points. To refactor it, we can extract these operations into separate methods.

**Refactored Code:**

```csharp
public class ReportGenerator
{
    public string GenerateReport(List<DataPoint> data)
    {
        string report = "Report:\n";

        // Calculate statistics
        var stats = CalculateStatistics(data);

        // Format the report
        report += FormatStatistics(stats.Average, stats.Minimum, stats.Maximum);

        // Add data points to the report
        report += FormatDataPoints(data);

        return report;
    }

    private (double Average, double Minimum, double Maximum) CalculateStatistics(List<DataPoint> data)
    {
        double sum = 0;
        foreach (var d in data)
        {
            sum += d.Value;
        }
        double average = sum / data.Count;

        double min = data[0].Value;
        foreach (var d in data)
        {
            if (d.Value < min)
            {
                min = d.Value;
            }
        }

        double max = data[0].Value;
        foreach (var d in data)
        {
            if (d.Value > max)
            {
                max = d.Value;
            }
        }

        return (average, min, max);
    }

    private string FormatStatistics(double average, double min, double max)
    {
        return $"Average: {average}\nMinimum: {min}\nMaximum: {max}\n";
    }

    private string FormatDataPoints(List<DataPoint> data)
    {
        string dataPoints = "Data Points:\n";
        foreach (var d in data)
        {
            dataPoints += $"{d.Label}: {d.Value}\n";
        }
        return dataPoints;
    }
}

public class DataPoint { public string Label { get; set; } public double Value { get; set; }
```

## Additional Questions and Answers

<details><summary>Question: When should StringBuilder be preferred over string?</summary>

>StringBuilder should be used when the string is modified frequently.
</details>

<details><summary>Question: What is the difference between String and StringBuilder classes?</summary>

>The String class represents an immutable string.
>When any String method is executed, the system creates a new object in memory with allocated space.
>The StringBuilder class represents a dynamic string.
>When creating a StringBuilder string, it allocates more memory than needed, and when adding elements, the string isn't recreated.
>If the allocated memory becomes insufficient for new elements, the object's capacity will be increased.
</details>