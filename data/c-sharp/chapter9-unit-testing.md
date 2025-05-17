# Unit Testing in C#

## Introduction to Unit Testing and TDD

Unit testing is a software testing method where individual units or components of a software are tested. The purpose is to validate that each unit of the software performs as designed. A unit is most often an individual function or procedure in a program.

Test-Driven Development (TDD) is a software development process that relies on the repetition of a very short development cycle: Requirements are turned into very specific test cases, then the software is improved to pass the new tests, and finally refactored to some acceptable standards. Kent Beck is credited with having developed or refined the technique.

Mocking is used in unit tests to isolate the code being tested from its dependencies. A mock object simulates the behavior of a real object, allowing you to verify that the code under test interacts with the dependency in the way you expect.

Assertions are statements that verify that a certain condition is true. Unit tests use assertions to check that the code under test produces the expected results.

## Tricky Interview Question

Explain the difference between mocking and stubbing.

## Detailed Answer

**Stubbing** provides canned answers to calls made during the test, usually without recording whether those calls were made at all. Stubs are simple and provide a basic level of isolation.

**Mocking** goes a step further by allowing you to verify that certain interactions occurred with the mock object. Mocks are more complex than stubs and provide a higher level of isolation. Mocking frameworks like Moq allow you to define expectations about how the code under test should interact with its dependencies.

**Unit Testing Frameworks:**

*   **NUnit:** A popular open-source unit testing framework for .NET.
*   **xUnit.net:** A modern unit testing framework for .NET, designed for extensibility and test-driven development.
*   **MSTest:** Microsoft's unit testing framework, included with Visual Studio.

## Code Example with Moq

First, install the Moq NuGet package:

```bash
Install-Package Moq
```

```csharp
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

public interface ICalculator
{
    int Add(int a, int b);
}

public class CalculatorService
{
    private readonly ICalculator _calculator;

    public CalculatorService(ICalculator calculator)
    {
        _calculator = calculator;
    }

    public int PerformCalculation(int a, int b)
    {
        return _calculator.Add(a, b) * 2;
    }
}

[TestClass]
public class CalculatorServiceTests
{
    [TestMethod]
    public void PerformCalculation_ShouldMultiplySumByTwo()
    {
        // Arrange
        var mockCalculator = new Mock<ICalculator>();
        mockCalculator.Setup(calc => calc.Add(It.IsAny<int>(), It.IsAny<int>())).Returns(5);

        var calculatorService = new CalculatorService(mockCalculator.Object);

        // Act
        int result = calculatorService.PerformCalculation(2, 3);

        // Assert
        Assert.AreEqual(10, result);
        mockCalculator.Verify(calc => calc.Add(It.IsAny<int>(), It.IsAny<int>()), Times.Once);
    }
}
```

## Code Debugging Task

Find and fix the issue in the following unit test that causes it to fail intermittently.

```csharp
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Threading;

[TestClass]
public class FlakyTest
{
    private static int _counter;

    [TestMethod]
    public void IncrementCounter_ShouldEventuallyReachTarget()
    {
        int target = 100;
        while (_counter < target)
        {
            ThreadPool.QueueUserWorkItem(_ => Interlocked.Increment(ref _counter));
        }

        Assert.AreEqual(target, _counter);
    }
}
```

## Explanation and Corrected Code

The issue with the original code is that the `Assert.AreEqual` is being called *before* the ThreadPool threads have completed their execution, leading to a race condition. The `_counter` variable might not have reached the `target` value by the time the assertion is made.

To fix this, we need to wait for all the queued work items in the ThreadPool to complete before making the assertion. We can achieve this by using a `ManualResetEvent`.

```csharp
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Threading;

[TestClass]
public class FixedFlakyTest
{
    private static int _counter;
    private static ManualResetEvent _resetEvent = new ManualResetEvent(false);

    [TestMethod]
    public void IncrementCounter_ShouldEventuallyReachTarget()
    {
        int target = 100;
        int workerThreads = 0;
        int completionThreads = 0;
        ThreadPool.GetMaxThreads(out workerThreads, out completionThreads);

        for (int i = 0; i < target; i++)
        {
            ThreadPool.QueueUserWorkItem(_ =>
            {
                Interlocked.Increment(ref _counter);
                if (Interlocked.CompareExchange(ref _counter, 0, target) == target)
                {
                    _resetEvent.Set();
                }
            });
        }

        _resetEvent.WaitOne(TimeSpan.FromSeconds(10)); // Wait up to 10 seconds

        Assert.AreEqual(target, _counter);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _counter = 0;
        _resetEvent.Reset();
    }
}
```

Key changes:

1.  A `ManualResetEvent` is used to signal when the counter has reached the target value.
2.  The `ThreadPool.QueueUserWorkItem` now sets the `ManualResetEvent` when the counter reaches the target.
3.  The test waits for the `ManualResetEvent` to be set, with a timeout to prevent the test from running indefinitely.
4.  A `TestCleanup` method is added to reset the counter and the `ManualResetEvent` after each test.


## Additional Questions and Answers

<details><summary>Question: What are integration tests vs unit tests?</summary>

> Unit testing: Verification of individual application modules (classes, libraries) in isolation from other modules. Enables regression testing (ensuring modules still work after changes).

> Integration testing: Software modules are combined and tested as a group. These tests verify correct interaction between subsystems (e.g., two classes). Conducted after unit testing.

> System testing: Verifies the entire application as a whole against requirements using black-box principles (without considering internal implementation).
</details>