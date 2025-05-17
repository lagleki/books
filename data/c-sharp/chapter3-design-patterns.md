# Design Patterns in C#

Design patterns are reusable solutions to commonly occurring problems in software design. They provide a common vocabulary and a way to think about software design in a structured manner. Design patterns can be classified into three main categories:

*   **Creational:** These patterns deal with object creation mechanisms, trying to create objects in a manner suitable to the situation. Examples include Singleton, Factory Method, and Abstract Factory.
*   **Structural:** These patterns deal with class and object composition. They simplify the design by identifying a simple way to realize relationships between entities. Examples include Adapter, Bridge, and Decorator.
*   **Behavioral:** These patterns deal with algorithms and the assignment of responsibilities between objects. They describe not just patterns of objects or classes but also the patterns of communication between them. Examples include Strategy, Template Method, and Observer.

## Tricky Interview Question

Explain the difference between the Strategy and the Template Method patterns. When would you use one over the other?

## Code Example

```csharp
// Strategy Pattern
public interface IPaymentStrategy
{
    void Pay(int amount);
}

public class CreditCardPayment : IPaymentStrategy
{
    private string cardNumber;
    private string expiryDate;
    private string cvv;

    public CreditCardPayment(string cardNumber, string expiryDate, string cvv)
    {
        this.cardNumber = cardNumber;
        this.expiryDate = expiryDate;
        this.cvv = cvv;
    }

    public void Pay(int amount)
    {
        Console.WriteLine($"Paid {amount} using Credit Card: {cardNumber}");
    }
}

public class PayPalPayment : IPaymentStrategy
{
    private string email;

    public PayPalPayment(string email)
    {
        this.email = email;
    }

    public void Pay(int amount)
    {
        Console.WriteLine($"Paid {amount} using PayPal: {email}");
    }
}

public class ShoppingCart
{
    private IPaymentStrategy paymentStrategy;
    private int amount;

    public ShoppingCart(IPaymentStrategy paymentStrategy, int amount)
    {
        this.paymentStrategy = paymentStrategy;
        this.amount = amount;
    }

    public void Checkout()
    {
        paymentStrategy.Pay(amount);
    }
}

// Template Method Pattern
public abstract class DataProcessor
{
    public void ProcessData()
    {
        ReadData();
        Process();
        ValidateData();
        SaveData();
    }

    protected abstract void ReadData();
    protected abstract void Process();

    protected virtual void ValidateData()
    {
        Console.WriteLine("Data validation complete.");
    }
    protected abstract void SaveData();
}

public class CSVProcessor : DataProcessor
{
    protected override void ReadData()
    {
        Console.WriteLine("Reading data from CSV file.");
    }

    protected override void Process()
    {
        Console.WriteLine("Processing CSV data.");
    }

    protected override void SaveData()
    {
        Console.WriteLine("Saving data to database from CSV.");
    }
}

public class XMLProcessor : DataProcessor
{
    protected override void ReadData()
    {
        Console.WriteLine("Reading data from XML file.");
    }

    protected override void Process()
    {
        Console.WriteLine("Processing XML data.");
    }

    protected override void SaveData()
    {
        Console.WriteLine("Saving data to database from XML.");
    }
}

public class Example
{
    public static void Main(string[] args)
    {
        // Strategy Pattern
        var cart = new ShoppingCart(new CreditCardPayment("1234-5678-9012-3456", "12/24", "123"), 100);
        cart.Checkout();

        cart = new ShoppingCart(new PayPalPayment("test@example.com"), 50);
        cart.Checkout();

        // Template Method Pattern
        DataProcessor csvProcessor = new CSVProcessor();
        csvProcessor.ProcessData();

        DataProcessor xmlProcessor = new XMLProcessor();
        xmlProcessor.ProcessData();
    }
}
```

## Detailed Answer

The **Strategy Pattern** allows you to define a family of algorithms, encapsulate each one, and make them interchangeable. It lets the algorithm vary independently from clients that use it. The client chooses a strategy at runtime.

The **Template Method Pattern** defines the skeleton of an algorithm in a base class but lets subclasses override specific steps of the algorithm without changing its structure.

**When to use which:**

*   Use **Strategy** when you need to switch between different algorithms at runtime, and the client needs to choose the algorithm.
*   Use **Template Method** when you have an algorithm with some steps that are common across all implementations, and some steps that vary. The base class controls the overall algorithm structure, and subclasses provide specific implementations for the varying steps.

**Potential Pitfalls:**

*   **Strategy:** The client needs to be aware of the different strategies to choose the appropriate one. This can increase the complexity of the client code.
*   **Template Method:** Subclasses might inadvertently break the algorithm's structure if they are not careful when overriding the template methods.

## Code Debugging Task

Find and fix the bug in the following code that prevents the correct strategy from being selected.

```csharp
public interface IDiscountStrategy
{
    decimal ApplyDiscount(decimal price);
}

public class ChristmasDiscount : IDiscountStrategy
{
    public decimal ApplyDiscount(decimal price)
    {
        return price * 0.8m; // 20% discount
    }
}

public class NewYearDiscount : IDiscountStrategy
{
    public decimal ApplyDiscount(decimal price)
    {
        return price * 0.9m; // 10% discount
    }
}

public class DiscountManager
{
    private IDiscountStrategy discountStrategy;

    public DiscountManager(IDiscountStrategy discountStrategy)
    {
        this.discountStrategy = discountStrategy;
    }

    public decimal ApplyDiscount(decimal price)
    {
        return discountStrategy.ApplyDiscount(price);
    }
}

public class Example
{
    public static void Main(string[] args)
    {
        decimal price = 100m;
        string currentMonth = "December"; // Simulate current month

        IDiscountStrategy discountStrategy;

        if (currentMonth == "December")
        {
            discountStrategy = new NewYearDiscount(); // Bug: Should be ChristmasDiscount
        }
        else if (currentMonth == "January")
        {
            discountStrategy = new NewYearDiscount();
        }
        else
        {
            discountStrategy = new NewYearDiscount(); // No discount
        }

        DiscountManager discountManager = new DiscountManager(discountStrategy);
        decimal discountedPrice = discountManager.ApplyDiscount(price);

        Console.WriteLine($"Original Price: {price}");
        Console.WriteLine($"Discounted Price: {discountedPrice}");
    }
}
```

## Detailed Explanation of the Bug and Corrected Code

**Bug:**

The bug is in the `Main` method of the `Example` class. When the current month is "December", the code incorrectly instantiates `NewYearDiscount` instead of `ChristmasDiscount`.

**Corrected Code:**

```csharp
public interface IDiscountStrategy
{
    decimal ApplyDiscount(decimal price);
}

public class ChristmasDiscount : IDiscountStrategy
{
    public decimal ApplyDiscount(decimal price)
    {
        return price * 0.8m; // 20% discount
    }
}

public class NewYearDiscount : IDiscountStrategy
{
    public decimal ApplyDiscount(decimal price)
    {
        return price * 0.9m; // 10% discount
    }
}

public class DiscountManager
{
    private IDiscountStrategy discountStrategy;

    public DiscountManager(IDiscountStrategy discountStrategy)
    {
        this.discountStrategy = discountStrategy;
    }

    public decimal ApplyDiscount(decimal price)
    {
        return discountStrategy.ApplyDiscount(price);
    }
}

public class Example
{
    public static void Main(string[] args)
    {
        decimal price = 100m;
        string currentMonth = "December"; // Simulate current month

        IDiscountStrategy discountStrategy;

        if (currentMonth == "December")
        {
            discountStrategy = new ChristmasDiscount(); // Corrected: Instantiate ChristmasDiscount
        }
        else if (currentMonth == "January")
        {
            discountStrategy = new NewYearDiscount();
        }
        else
        {
            discountStrategy = new NewYearDiscount(); // No discount
        }

        DiscountManager discountManager = new DiscountManager(discountStrategy);
        decimal discountedPrice = discountManager.ApplyDiscount(price);

        Console.WriteLine($"Original Price: {price}");
        Console.WriteLine($"Discounted Price: {discountedPrice}");
    }
}
```

**Explanation:**

The corrected code instantiates `ChristmasDiscount` when the current month is "December", ensuring that the correct discount strategy is applied.

## Additional Questions and Answers

<details><summary>Question: What is IoC (Inversion of Control) and what is it used for?</summary>

>Inversion of Control (IoC) is an abstract principle and set of guidelines for writing loosely coupled code. The essence is that each system component should be as isolated as possible from others, not relying on implementation details of other components in its operation.
</details>

<details><summary>Question: What is a DI (Dependency Injection) container?</summary>

>A DI container is one way to implement the IoC principle. This container knows about all interfaces and their implementations in the system and can map them. Before using it, you need to register known types and their mappings (interface-->implementation).
</details>

<details><summary>Question: What DI container implementations do you know in C#? Which DI container is the best?</summary>

>Castle Windsor, Autofac, Ninject, Unity...and many others. The question of which is best isn't entirely appropriate. It depends on the specific implementation requirements and use case.
</details>

<details><summary>Question: Definition of the Singleton pattern</summary>

>Singleton is a creational pattern that ensures a class has only one instance while providing a global access point to it. Used when exactly one instance of a class is needed. Singletons can be thread-safe or not, with simple or lazy initialization.
```csharp
class Singleton
{
    private static readonly Singleton _instance = new Singleton();
    private Singleton() {}
    static Singleton() {}
    public static Singleton Instance { get { return _instance; } }
}
```
</details>

<details><summary>Question: What is MVVM?</summary>

>The MVVM (Model-View-ViewModel) pattern separates application logic from visual components, primarily used in WPF. Key components:
>    * Model: Describes application data and may contain related logic like property validation
>    * View: Defines the visual interface (buttons, text fields) for user interaction
>    * ViewModel: Connects Model and View through data binding. Automatically propagates model changes to view while containing logic for data retrieval and updates, keeping Model and View decoupled.
</details>