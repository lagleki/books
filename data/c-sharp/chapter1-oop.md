# Object-Oriented Programming (OOP) in C#

## Introduction to OOP Principles

Object-Oriented Programming (OOP) is a programming paradigm based on the concept of "objects", which contain data in the form of fields (attributes) and code in the form of methods (procedures). C# is an object-oriented language that supports the four core principles of OOP:

*   **Encapsulation:** Bundling data (attributes) and methods that operate on the data into a single unit (class). It hides the internal state of the object and protects it from outside access, exposing only necessary information through a public interface.
*   **Inheritance:** Creating new classes (derived classes) from existing classes (base classes). Derived classes inherit the attributes and methods of the base class, promoting code reuse and establishing "is-a" relationships.
*   **Polymorphism:** The ability of an object to take on many forms. It allows objects of different classes to be treated as objects of a common type, enabling code flexibility and extensibility. Polymorphism is achieved through inheritance and interfaces.
*   **Abstraction:** Simplifying complex reality by modeling classes based on essential attributes and behaviors, hiding unnecessary implementation details from the user. Abstract classes and interfaces are used to achieve abstraction in C#.

## Tricky Interview Question

**Question:** Explain the difference between an abstract class and an interface in C#. When would you use one over the other?

## Code Example

```csharp
// Interface
public interface IShape
{
    double GetArea();
}

// Abstract class
public abstract class Shape
{
    public string Name { get; set; }

    public abstract double GetArea();

    public virtual string GetDescription()
    {
        return "This is a shape.";
    }
}

// Concrete class inheriting from abstract class and implementing interface
public class Circle : Shape, IShape
{
    public double Radius { get; set; }

    public override double GetArea()
    {
        return Math.PI * Radius * Radius;
    }

    public override string GetDescription()
    {
        return "This is a circle.";
    }
}

public class Rectangle : Shape
{
    public double Width { get; set; }
    public double Height { get; set; }

    public override double GetArea()
    {
        return Width * Height;
    }
}
```

## Detailed Answer

**Abstract Class:**

*   Can have both abstract and non-abstract methods (concrete methods with implementation).
*   Can have fields (member variables).
*   Can have constructors.
*   A class can inherit from only one abstract class.
*   Provides a base implementation that derived classes can inherit and extend.

**Interface:**

*   Can only have method declarations (no implementation). From C# 8.0, interfaces can have default implementations for members.
*   Cannot have fields (member variables).
*   Cannot have constructors.
*   A class can implement multiple interfaces.
*   Defines a contract that implementing classes must adhere to.

**When to use which:**

*   **Abstract Class:** Use when you want to provide a common base implementation for a family of classes, and you expect derived classes to share some common functionality. Also, use when you need to maintain a state (fields).
*   **Interface:** Use when you want to define a contract that multiple unrelated classes can implement. Use when you want to achieve polymorphism and allow objects of different types to be treated as objects of a common type. Also, use when you want to define a set of methods that a class *must* implement.

**Potential Pitfalls:**

*   **Abstract Class:** Tight coupling between base class and derived classes. Changes to the base class can affect derived classes.
*   **Interface:** Interface pollution (adding methods to an interface that not all implementing classes need).

## Code Debugging Task

**Task:** Find and fix the bug in the following code that violates the Liskov Substitution Principle.

```csharp
public class Bird
{
    public virtual void Fly()
    {
        Console.WriteLine("Bird is flying");
    }
}

public class Ostrich : Bird
{
    public override void Fly()
    {
        throw new Exception("Ostrich cannot fly");
    }
}

public class Program
{
    public static void Main(string[] args)
    {
        Bird bird = new Ostrich();
        bird.Fly(); // This throws an exception
    }
}
```

## Detailed Explanation of the Bug and Corrected Code

**Bug:**

The `Ostrich` class inherits from the `Bird` class, but it overrides the `Fly()` method to throw an exception. This violates the Liskov Substitution Principle (LSP), which states that derived classes should be substitutable for their base classes without altering the correctness of the program. In this case, substituting a `Bird` object with an `Ostrich` object causes the program to throw an exception, violating the LSP.

**Corrected Code:**

```csharp
public class Bird
{
    public virtual void Fly()
    {
        Console.WriteLine("Bird is flying");
    }
}

public class FlyingBird : Bird
{
    public override void Fly()
    {
        Console.WriteLine("FlyingBird is flying");
    }
}

public class Ostrich : Bird
{
    // Ostrich doesn't fly
}

public class Program
{
    public static void Main(string[] args)
    {
        Bird bird = new FlyingBird();
        bird.Fly(); // This works fine

        Bird ostrich = new Ostrich();
        //ostrich.Fly(); // Ostrich doesn't fly, so no need to call Fly()
    }
}
```

**Explanation of the corrected code:**

1.  Created a new class `FlyingBird` that inherits from `Bird` and overrides the `Fly()` method to provide the flying behavior.
2.  The `Ostrich` class now inherits from `Bird` but does not override the `Fly()` method. This indicates that ostriches do not fly.
3.  In the `Main()` method, we create a `FlyingBird` object and assign it to a `Bird` variable. Calling `Fly()` on this object will execute the `FlyingBird`'s `Fly()` method, which prints "FlyingBird is flying".
4.  We also create an `Ostrich` object and assign it to a `Bird` variable. Since `Ostrich` does not override the `Fly()` method, calling `Fly()` on this object would execute the `Bird`'s `Fly()` method, which prints "Bird is flying". However, since ostriches don't fly, we don't call the `Fly()` method on the `Ostrich` object.

This corrected code adheres to the Liskov Substitution Principle because substituting a `Bird` object with a `FlyingBird` or `Ostrich` object does not alter the correctness of the program.

## Additional Questions and Answers

<details><summary>Question: What is the difference between the "ref" and "out" keywords?</summary>

>A parameter with the out keyword doesn't need to be initialized before being passed to a method, while a parameter with the ref keyword must be initialized before the method call that uses these parameters.
</details>

<details><summary>Question: What's the difference between optional parameters and named parameters?</summary>

>Optional parameters allow omitting arguments in function calls, while named parameters enable passing arguments by parameter name.
```csharp
public void optionalParamFunc(int p1, int p2 = 2, int p3 = 3);
optionalParamFunc(1, p3:10); // Equivalent to optionalParamFunc(1,2,10);
```
</details>

<details><summary>Question: What are the main differences between classes and structs in C#?</summary>

>Key differences between classes and structs:
>    * Structs are value types while classes are reference types
>    * All struct types implicitly inherit from System.ValueType, are implicitly sealed and cannot be abstract
>    * Assigning struct variables creates copies of the data
>    * Struct fields cannot have initializers
>    * Different interpretation of 'this' between structs and classes
>    * Structs cannot have parameterless constructors
>    * Structs cannot have destructors
>    * Default value for reference types is null
>    * Conversion between reference and value types involves boxing/unboxing
</details>

<details><summary>Question: How to compare strings in C#?</summary>

```csharp
string s1 = "123";
string s2 = s1.Substring(0, 2) + "3";

// Value comparisons (all will work)
if (s1 == s2) { }
if (s1.CompareTo(s2) == 0) { }
if (s1.Equals(s2)) { }
if (string.Equals(s1, s2)) { }

// Reference comparisons (shouldn't be used)
if ((object)s1 == (object)s2) { }
if (object.ReferenceEquals(s1, s2)) { }
```
</details>

<details><summary>Question: What is abstraction and how does it relate to OOP?</summary>

>Abstraction is a simplified model of real-world entities for solving specific problems, represented through objects. Any object is an abstraction as it only partially represents a real entity. During the transformation of real entities into objects, we eliminate non-essential characteristics.
>For example, we could create a simplified Person class that handles movement while abstracting away details like breathing, eating, or sensory functions.
</details>

<details><summary>Question: What are properties in C#?</summary>

>In C#, properties are special accessor methods that provide controlled access to class fields. They consist of get and set blocks:
>    * The get block returns the field value
>    * The set block assigns the value using the implicit 'value' parameter
</details>

<details><summary>Question: What access modifiers exist in C#?</summary>

>C# access modifiers:
>    * public: Accessible from any code
>    * private: Accessible only within the declaring class
>    * protected: Accessible within the class and derived classes
>    * internal: Accessible within the same assembly
>    * protected internal: Accessible within assembly or derived classes
>    * private protected: Accessible within class and derived classes in same assembly
</details>

<details><summary>Question: What is the essence of polymorphism?</summary>

>Polymorphism enables functions to handle different data types through:
>    * Ad-hoc polymorphism (method overloading, type conversion)
>    * Parametric polymorphism (generics)
>    * Inclusion polymorphism (inheritance, interfaces, virtual methods)
</details>

<details><summary>Question: How do events differ from delegates?</summary>

>Events differ from delegates like properties differ from fields:
>    * Events can only be class members and can only be raised within their declaring class
>    * Event subscribers cannot remove other subscribers
>    * Events are implemented as private delegate fields with add/remove methods
</details>

<details><summary>Question: Can a class implement two interfaces with identical methods? If yes, how?</summary>

>Yes. Common methods can be implemented once implicitly or twice explicitly (using interface names). Explicit implementations require casting to the interface type for access. Different interface methods should use explicit implementation to avoid conflicts.
</details>

<details><summary>Question: What is an abstract class? When must a class be declared abstract?</summary>

>An abstract class:
>    * Provides partial implementation to be completed by derived classes
>    * Cannot be instantiated directly
>    * Must be declared when containing abstract members
>    * Used to share common functionality across related classes
</details>

<details><summary>Question: What are the differences between interfaces and abstract classes?</summary>

>Key differences:
>    * Interfaces contain only declarations (no fields or implementations)
>    * Classes implement multiple interfaces but inherit only one class
>    * Abstract classes can have fields and partial implementations
>    * Interfaces define contracts, abstract classes provide base functionality
</details>

<details><summary>Question: What's the difference between abstract and virtual classes/methods?</summary>

>Abstract classes:
>    * Marked with abstract keyword
>    * Contain abstract members (no implementation)
>    * Derived classes must implement abstract members
>
>Virtual members:
>    * Marked with virtual keyword
>    * Provide default implementation
>    * Can be overridden in derived classes using override
</details>

<details><summary>Question: What does the virtual modifier mean?</summary>

>The virtual modifier:
>    * Marks methods/properties as overridable in derived classes
>    * Requires override keyword in derived classes
>    * Enables runtime polymorphism based on object type
>    * Non-virtual methods use compile-time binding
</details>

<details><summary>Question: What's the difference between encapsulation and hiding?</summary>

>Encapsulation:
>    * OOP principle of bundling data with methods
>    * Protects internal state through access control
>
>Hiding:
>    * Using access modifiers to restrict visibility
>    * Method hiding with 'new' keyword in derived classes
</details>

<details><summary>Question: Can I prevent inheritance from my class?</summary>

>Yes. Use the sealed modifier to prevent class inheritance.
</details>

<details><summary>Question: Can I allow class inheritance but prevent method overriding?</summary>

>Yes. Use sealed override on virtual methods in derived classes to prevent further overriding.
</details>

<details><summary>Question: What's the default access level for class fields?</summary>

>Fields default to private access when no modifier is specified.
</details>

<details><summary>Question: How to assign values to readonly fields?</summary>

>Readonly fields can be initialized:
>    * At declaration
>    * In class constructors
</details>

<details><summary>Question: When is a static constructor called?</summary>

>A static constructor:
>    * Runs automatically before first instance creation
>    * Executes before any static members are accessed
>    * Runs only once per type
</details>

<details><summary>Question: What's the difference between constants and readonly fields?</summary>

>Constants:
>    * Initialized at compile-time
>    * Must be value types
>
>Readonly fields:
>    * Can be initialized at declaration or in constructors
>    * Can be reference types
</details>

<details><summary>Question: What's the difference between cast and as operator?</summary>

>Differences:
>    * Cast throws InvalidCastException on failure
>    * As operator returns null on failure
</details>