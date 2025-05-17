# Concurrency and Asynchronous Programming in C#

## Introduction

Concurrency and asynchronous programming are essential techniques for building responsive and scalable applications. Concurrency allows multiple tasks to run seemingly simultaneously, while asynchronous programming enables a program to start a potentially long-running task and continue executing other tasks without waiting for the first task to complete. In C#, these concepts are primarily implemented using threads, tasks, and the async/await keywords.

## Interview Question: Task.Run vs. Task.Factory.StartNew

Explain the difference between `Task.Run` and `Task.Factory.StartNew`.

## Code Example

```csharp
using System;
using System.Threading.Tasks;

public class ConcurrencyExample
{
    public static void Main(string[] args)
    {
        // Using Task.Run
        Task taskRun = Task.Run(() =>
        {
            Console.WriteLine("Task.Run: Executing on thread {0}", System.Threading.Thread.CurrentThread.ManagedThreadId);
        });

        // Using Task.Factory.StartNew
        Task taskFactory = Task.Factory.StartNew(() =>
        {
            Console.WriteLine("Task.Factory.StartNew: Executing on thread {0}", System.Threading.Thread.CurrentThread.ManagedThreadId);
        });

        Task.WaitAll(taskRun, taskFactory);

        Console.WriteLine("Main thread completed.");
        Console.ReadKey();
    }
}
```

## Detailed Explanation

### Task.Run

*   `Task.Run` is a simplified way to start a task on the thread pool. It was introduced in .NET 4.5 and is the preferred way to offload work to the thread pool.
*   It directly queues the work to the thread pool, making it concise and easy to use.
*   It returns a `Task` object that represents the asynchronous operation.

### Task.Factory.StartNew

*   `Task.Factory.StartNew` is a more flexible but also more complex way to create and start tasks.
*   It allows you to specify various options, such as the `TaskScheduler`, `TaskCreationOptions`, and `CancellationToken`.
*   It can be used to create tasks that run on a specific scheduler or with specific creation options.

### Differences, Use Cases, and Potential Pitfalls

*   **Simplicity**: `Task.Run` is simpler and easier to use for basic scenarios.
*   **Flexibility**: `Task.Factory.StartNew` provides more control over task creation and scheduling.
*   **TaskCreationOptions**: `Task.Factory.StartNew` allows you to specify options like `LongRunning` (useful for preventing thread pool starvation) or `AttachedToParent` (useful for creating nested tasks).
*   **Schedulers**: `Task.Factory.StartNew` allows you to specify a custom `TaskScheduler`, enabling you to run tasks on specific threads or in specific contexts.

In most cases, `Task.Run` is sufficient. Use `Task.Factory.StartNew` when you need more control over task creation and scheduling.

## Code Debugging Task: Race Condition

Find and fix the race condition in the following code.

```csharp
using System;
using System.Threading;

public class RaceConditionExample
{
    static int counter = 0;

    public static void Main(string[] args)
    {
        Thread t1 = new Thread(IncrementCounter);
        Thread t2 = new Thread(IncrementCounter);

        t1.Start();
        t2.Start();

        t1.Join();
        t2.Join();

        Console.WriteLine("Counter value: {0}", counter);
        Console.ReadKey();
    }

    static void IncrementCounter()
    {
        for (int i = 0; i < 100000; i++)
        {
            counter++; // Race condition
        }
    }
}
```

## Explanation and Corrected Code

### Race Condition

The race condition occurs because multiple threads are trying to access and modify the `counter` variable simultaneously without any synchronization. This can lead to lost updates, where one thread overwrites the changes made by another thread.

### Corrected Code

```csharp
using System;
using System.Threading;

public class RaceConditionExample
{
    static int counter = 0;
    static object lockObject = new object();

    public static void Main(string[] args)
    {
        Thread t1 = new Thread(IncrementCounter);
        Thread t2 = new Thread(IncrementCounter);

        t1.Start();
        t2.Start();

        t1.Join();
        t2.Join();

        Console.WriteLine("Counter value: {0}", counter);
        Console.ReadKey();
    }

    static void IncrementCounter()
    {
        for (int i = 0; i < 100000; i++)
        {
            lock (lockObject)
            {
                counter++; // Race condition fixed with lock
            }
        }
    }
}
```

### Explanation of the Fix

*   A `lock` statement is used to ensure that only one thread can access the `counter` variable at a time.
*   The `lockObject` is a private object used as the lock.
*   When a thread enters the `lock` block, it acquires the lock on `lockObject`. If another thread tries to enter the `lock` block while the first thread is still holding the lock, it will be blocked until the first thread releases the lock.
*   This prevents the race condition and ensures that the `counter` variable is updated correctly.

## Дополнительные вопросы и ответы (Additional Questions and Answers)

<details><summary>Question: Is the List type a thread-safe collection?</summary>

>The List type can be thread-safe for read operations.
>User code must provide all synchronization when adding/removing elements concurrently across multiple threads.
</details>

<details><summary>Question: Thread vs Task - usage examples?</summary>

>The Thread class creates and controls a thread. It takes a method to execute in the thread.
>The Task class allows running a separate long-running task. It runs asynchronously in a thread pool thread but can also run synchronously.
```csharp
var t = new Thread(() => Thread.Sleep(1000));
t.IsBackground = false; // Foreground thread - system waits for its completion
t.Start();
Task.Run(() => Task.Delay(1000)).Wait(); // Using TPL
```
</details>

<details><summary>Question: Which keyword is used to block concurrent execution of code sections by multiple threads?</summary>

>The lock keyword is used to prevent concurrent execution of code sections by multiple threads. lock defines a block where the code becomes inaccessible to other threads until the current thread completes its execution.