# Tricky Interview Questions for Senior Golang Developers

### Question 1: Context Cancellation

**Code Snippet:**

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	ch := make(chan int, 1)

	go func() {
		time.Sleep(2 * time.Second)
		ch <- 1
	}()

	select {
	case <-ch:
		fmt.Println("Received value from channel")
	case <-ctx.Done():
		fmt.Println("Context cancelled:", ctx.Err())
	}
}
```

**Problem Statement:**

What will be the output of the code above? Explain why.

**Solution:**

The output will be "Context cancelled: context deadline exceeded".

**Explanation:**

The code creates a context with a timeout of 1 second. A goroutine is launched that sends a value to the channel `ch` after 2 seconds. The `select` statement waits on either receiving a value from the channel or the context being cancelled. Since the context is cancelled after 1 second, and the goroutine sends a value to the channel after 2 seconds, the `select` statement will execute the `case <-ctx.Done()` branch, printing "Context cancelled: context deadline exceeded".

### Question 2: Goroutine and Channel Deadlock

**Code Snippet:**

```go
package main

func main() {
	ch := make(chan string)
	ch <- "Hello"
}
```

**Problem Statement:**

What will happen when you run this code? Explain why.

**Solution:**

The code will deadlock.

**Explanation:**

The code creates an unbuffered channel and attempts to send a value to it. However, there is no receiver waiting to receive the value. Therefore, the sender will block indefinitely, leading to a deadlock.

### Question 3: Using `sync.Once`

**Code Snippet:**

```go
package main

import (
	"fmt"
	"sync"
)

var (
	once     sync.Once
	resource string
)

func initializeResource() {
	resource = "Initialized"
	fmt.Println("Resource initialized")
}

func main() {
	for i := 0; i < 3; i++ {
		once.Do(initializeResource)
		fmt.Println("Resource:", resource)
	}
}
```

**Problem Statement:**

What will be the output of the code above? Explain the purpose of `sync.Once`.

**Solution:**

```
Resource initialized
Resource: Initialized
Resource: Initialized
Resource: Initialized
```

**Explanation:**

`sync.Once` is used to ensure that a function is executed only once, even if it is called multiple times from different goroutines. In this case, the `initializeResource` function is called multiple times, but it is only executed once because of `once.Do(initializeResource)`. The subsequent calls to `once.Do(initializeResource)` do nothing.

### Question 4: Understanding `iota`

**Code Snippet:**

```go
package main

import "fmt"

const (
	A = iota
	B
	C
)

func main() {
	fmt.Println(A, B, C)
}
```

**Problem Statement:**

What will be the output of the code above? Explain the purpose of `iota`.

**Solution:**

The output will be `0 1 2`.

**Explanation:**

`iota` is a special constant that is used to generate a sequence of increasing integer values. It starts at 0 and is incremented by 1 for each constant in a constant declaration. In this case, `A` is assigned the value 0, `B` is assigned the value 1, and `C` is assigned the value 2.

### Question 5: Slices and Appending

**Code Snippet:**

```go
package main

import "fmt"

func main() {
	slice1 := []int{1, 2, 3}
	slice2 := append(slice1, 4, 5)
	fmt.Println(slice1, slice2)
}
```

**Problem Statement:**

What will be the output of the code above? Explain how appending to a slice works.

**Solution:**

The output will be `[1 2 3] [1 2 3 4 5]`.

**Explanation:**

The `append` function adds elements to the end of a slice. If the slice has enough capacity, the elements are added to the existing underlying array. If the slice does not have enough capacity, a new underlying array is allocated, and the elements are copied to the new array. In this case, `slice1` has enough capacity to hold the new elements, so the elements are added to the existing underlying array. `slice2` is a new slice that points to the same underlying array as `slice1`, but with a different length and capacity.

### Question 6: Maps and Mutability

**Code Snippet:**

```go
package main

import "fmt"

func main() {
	m := map[string]int{
		"a": 1,
		"b": 2,
	}
	delete(m, "a")
	fmt.Println(m)
}
```

**Problem Statement:**

What will be the output of the code above? Explain how maps work in Go.

**Solution:**

The output will be `map[b:2]`.

**Explanation:**

The code creates a map with two key-value pairs. The code then deletes the key-value pair with the key "a". The code then prints the map, which now only contains the key-value pair with the key "b". Maps in Go are mutable, meaning that you can add, delete, and modify key-value pairs after the map has been created.

### Question 7: Type Assertions

**Code Snippet:**

```go
package main

import "fmt"

func main() {
	var i interface{} = "hello"

	s := i.(string)
	fmt.Println(s)

	f, ok := i.(float64)
	fmt.Println(f, ok)
}
```

**Problem Statement:**

What will be the output of the code above? Explain what type assertions are and how they work.

**Solution:**

```
hello
0 false
```

**Explanation:**

Type assertions are used to extract the underlying value of an interface. The first type assertion `s := i.(string)` asserts that the underlying value of the interface `i` is a string. Since this is true, the type assertion succeeds, and the value of `s` is set to "hello". The second type assertion `f, ok := i.(float64)` asserts that the underlying value of the interface `i` is a float64. Since this is false, the type assertion fails, and the value of `f` is set to the zero value for float64 (0), and the value of `ok` is set to false.

### Question 8: String Immutability

**Problem Statement:**

Explain why strings are immutable in Go. What are the benefits of string immutability?

**Solution:**

Strings are immutable in Go for several reasons:

*   **Simplicity:** Immutability makes strings easier to reason about and work with. You don't have to worry about a string being modified unexpectedly.
*   **Safety:** Immutability makes strings safe to share between goroutines. You don't have to worry about data races when multiple goroutines are accessing the same string.
*   **Efficiency:** Immutability allows strings to be stored in a more efficient way. For example, strings can be stored in a read-only memory segment.

### Question 9: Using `defer` with Named Return Values

**Code Snippet:**

```go
package main

import "fmt"

func increment() (result int) {
	defer func() {
		result++
	}()
	return 0
}

func main() {
	fmt.Println(increment())
}
```

**Problem Statement:**

What will be the output of the code above? Explain how `defer` interacts with named return values.

**Solution:**

The output will be `1`.

**Explanation:**

When a function has named return values, the return values are initialized when the function is called. The `defer` statement schedules a function call to be executed after the surrounding function returns, but before the return values are returned. In this case, the `result` variable is initialized to 0 when the `increment` function is called. The `defer` statement schedules a function call to be executed after the `increment` function returns, but before the `result` variable is returned. The deferred function increments the `result` variable by 1. Therefore, the `increment` function returns the value 1.

### Question 10: Understanding the `nil` Interface

**Problem Statement:**

Explain what a `nil` interface is in Go. How is it different from a `nil` pointer?

**Solution:**

A `nil` interface is an interface that has a type but no value. A `nil` pointer is a pointer that points to nothing.

**Explanation:**

An interface is a type that specifies a set of methods that a type must implement. An interface value consists of two parts: a type and a value. The type is the type of the underlying value, and the value is the underlying value itself. A `nil` interface is an interface that has a type but no value. This means that the interface has a type, but the underlying value is `nil`. A `nil` pointer is a pointer that points to nothing. This means that the pointer does not have a type or a value.

The difference between a `nil` interface and a `nil` pointer is that a `nil` interface has a type, while a `nil` pointer does not. This means that you can call methods on a `nil` interface, but you cannot call methods on a `nil` pointer.

## Additional Concurrency Q&A

## What are lock-free data structures, and does Go have them?

**Lock-free data structures** are a type of data structure designed for multithreaded operations without using traditional locks like mutexes.

The main idea is to provide thread safety and avoid problems associated with locks, including deadlocks and performance bottlenecks.

Lock-free data structures typically use atomic operations like CAS (compare-and-swap) to ensure data consistency between threads. These operations allow threads to compete for data modification while guaranteeing only one thread can successfully modify data at any given time.

In Go, a language with concurrency support, there are several examples of lock-free or nearly lock-free data structures, especially in the standard library. For example:

1.  **Channels:** although Go channels aren't completely lock-free, they provide a high-level way to exchange data between goroutines without explicit locks.
2.  **Atomic operations:** the `sync/atomic` package in Go provides primitives for atomic operations, which are key components for creating lock-free data structures.
3.  **`sync.Map`:** designed for use cases where keys mostly don't change, it uses optimizations to reduce lock needs.

## What is a channel, and what types of channels exist in Go?

**Channels** are communication tools between goroutines.

Technically they're pipelines/tubes where you can read or place data. So one goroutine can send data to a channel, and another can read data placed in that channel.

Go has the `chan` keyword for channel creation. A channel can only transmit data of one type.

```go
package main

import "fmt"

func main() {
var c chan int
fmt.Println(c)
}
```

With simple variable declaration, the channel value is `nil`, meaning the channel is uninitialized. For initialization, the `make()` function is used.

Depending on capacity definition, channels can be **buffered** or **unbuffered**.

To create an unbuffered channel, call `make()` without specifying channel capacity:

```go
var intCh chan int = make(chan int)
```

Buffered channels are also created with `make()`, but the second argument specifies channel capacity. If the channel is empty, the receiver waits until at least one element appears.

```go
chanBuf := make(chan bool, 3)
```

Four operations can be performed with a channel:
* create a channel
* write data to a channel
* read from a channel
* close a channel

**Unidirectional channels:** in Go you can define channels as send-only or receive-only.

A channel can be a function's return value. However, you should be careful with write/read operations on returned channels.

## How do buffered and unbuffered channels work?

**Buffered channels** let you quickly queue tasks so you can handle many requests and process them later. Additionally, buffered channels can be used as semaphores, limiting your application's throughput.

The gist: all incoming requests are redirected to a channel that processes them in order. When finishing request processing, the channel notifies the original caller that it's ready to handle a new request. Thus, the channel's buffer capacity limits how many concurrent requests it can store.

Here's what implementing this method looks like:

```go
package main

import (
"fmt"
)

func main() {
numbers := make(chan int, 5)
// the numbers channel can't store more than five integers - it's a buffered channel with capacity 5
counter := 10
for i := 0; i < counter; i++ {
select {
// processing happens here
case numbers <- i * i:
fmt.Println("About to process", i)
default:
fmt.Print("No space for ", i, " ")
}
// we start putting data in numbers, but when the channel is full, it stops storing data and executes the default branch
}
fmt.Println()
for {
select {
case num := <-numbers:
fmt.Print("*", num, " ")
default:
fmt.Println("Nothing left to read!")
return
}
}
}
```

Similarly, we try to read from `numbers` using a `for` loop. When all data is read from the channel, the `default` branch executes and the program exits with `return`.
Running the above code produces this output:

```cmd
$ go run bufChannel.go
About to process 0
. . .
About to process 4
No space for 5 No space for 6 No space for 7 No space for 8 No space
for 9
*0 *1 *4 *9 *16 Nothing left to read!
```

In general:
*   a **buffered channel** will only block a goroutine if the entire buffer is full and another write is attempted. Once a read occurs from the channel, the goroutine unblocks. If there's only one goroutine (just the `main` function) and the channel blocks it... it won't block anywhere.

```go
package main

import (
"fmt"
)

func main() {
naturals := make(chan int)
squares := make(chan int)

go func() {
for x := 0; x <= 10; x++ {
naturals <- x
}
close(naturals)
}()

go func() {
for x := range naturals {
squares <- x * x
}
close(squares)
}()

for x := range squares {
fmt.Println(x)
}
}
```

## What is the semaphore package in Go?

**A semaphore** is a construct that can limit or control access to a shared resource. In Go's context, a semaphore can limit goroutines' access to a shared resource, though originally semaphores were used to limit thread access.

Semaphores can have weights that set the maximum number of threads or goroutines accessing the resource.
The process is maintained using `Acquire()` and `Release()` methods defined as:

```go
func (s *Weighted) Acquire(ctx context.Context, n int64) error
func (s *Weighted) Release(n int64)
```

The second `Acquire()` parameter defines the semaphore's weight.

```go
package main

import (
"context"
"fmt"
"os"
"strconv"
"time"
"golang.org/x/sync/semaphore"
)

var Workers = 4
```

This variable defines the maximum number of goroutines this program can execute.

```go
var sem = semaphore.NewWeighted(int64(Workers))
```

Here we define a semaphore with weight equal to the maximum number of goroutines that can execute simultaneously. This means no more than `Workers` goroutines can acquire the semaphore simultaneously.

```go
func worker(n int) int {
square := n * n
time.Sleep(time.Second)
return square
}
```

The `worker()` function executes as part of a goroutine. However since we're using a semaphore, there's no need to return results to a channel.

```go
func main() {
if len(os.Args) != 2 {
fmt.Println("Need #jobs!")
return
}

nJobs, err := strconv.Atoi(os.Args[1])
if err != nil {
fmt.Println(err)
return
}
```

We read the number of jobs we want to run.

```go
// where to store results
var results = make([]int, nJobs)
// required for Acquire()
ctx := context.TODO()

for i := range results {
err = sem.Acquire(ctx, 1)
if err != nil {
fmt.Println("Cannot acquire semaphore:", err)
break
}
```

We acquire the semaphore as many times as `nJobs` specifies. If `nJobs` exceeds `Workers`, the `Acquire()` call will block and wait for `Release()` calls to unblock.

```go
go func(i int) {
defer sem.Release(1)
temp := worker(i)
results[i] = temp
}(i)
}
```

We launch goroutines to perform this task and write results to the `results` slice. Since each goroutine writes to its own slice element, there are no race conditions.

```go
err = sem.Acquire(ctx, int64(Workers))
if err != nil {
fmt.Println(err)
}
```

We acquire all tokens this way so the `sem.Acquire()` call blocks until all worker processes/goroutines finish. Functionally this is similar to calling `Wait()`.

```go
for k, v := range results {
fmt.Println(k, "->", v)
}
}
```

That's roughly how semaphores are used in practice.