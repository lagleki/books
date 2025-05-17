# Tricky Interview Questions for Senior Golang Developers

### Question 1: Method Sets and Interfaces

**Code Snippet:**

```go
package main

import "fmt"

type I interface {
	M()
}

type T struct {
	S string
}

func (t T) M() {
	fmt.Println(t.S)
}

func main() {
	var i I = T{"hello"}
	i.M()
}
```

**Problem Statement:**

Can you modify the `M()` method to use a pointer receiver `(t *T)` instead of a value receiver `(t T)`? What are the implications of this change?

**Solution:**

Yes, you can modify the `M()` method to use a pointer receiver. However, this changes the method set of the `T` type.

```go
package main

import "fmt"

type I interface {
	M()
}

type T struct {
	S string
}

func (t *T) M() {
	fmt.Println(t.S)
}

func main() {
	var i I = &T{"hello"} // Changed to &T
	i.M()
}
```

**Explanation:**

When `M()` has a value receiver, both `T` and `*T` implement `I`. When `M()` has a pointer receiver, only `*T` implements `I`. Therefore, you must assign a pointer of type `T` to the interface `i`.

### Question 2: Shadowing Variables

**Code Snippet:**

```go
package main

import "fmt"

var x = 10

func main() {
	fmt.Println(x)
	x := 5
	fmt.Println(x)
}
```

**Problem Statement:**

What will be the output of the code above? Explain the concept of variable shadowing.

**Solution:**

The output will be:

```
10
5
```

**Explanation:**

Variable shadowing occurs when a variable is declared in an inner scope with the same name as a variable in an outer scope. In this case, the `x` variable declared inside the `main` function shadows the `x` variable declared in the global scope. Therefore, the first `fmt.Println(x)` prints the value of the global `x` variable, which is 10, and the second `fmt.Println(x)` prints the value of the local `x` variable, which is 5.

### Question 3: Defer, Panic, and Recover Order

**Code Snippet:**

```go
package main

import "fmt"

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered:", r)
		}
	}()

	defer fmt.Println("First defer")
	panic("Something went wrong")
	defer fmt.Println("Second defer")
}
```

**Problem Statement:**

What will be the output of the code above? Explain the order in which `defer` statements are executed when a panic occurs.

**Solution:**

The output will be:

```
First defer
Recovered: Something went wrong
```

**Explanation:**

When a panic occurs, the `defer` statements are executed in reverse order of their declaration. In this case, the `defer fmt.Println("First defer")` statement is executed first, printing "First defer". Then, the `defer func() { ... }()` statement is executed, which recovers from the panic and prints "Recovered: Something went wrong". The `defer fmt.Println("Second defer")` statement is not executed because the panic occurred before it.

### Question 4: Struct Embedding and Method Promotion

**Code Snippet:**

```go
package main

import "fmt"

type A struct {
	Name string
}

func (a A) PrintName() {
	fmt.Println("A's name:", a.Name)
}

type B struct {
	A
}

func main() {
	b := B{A{Name: "Alice"}}
	b.PrintName()
}
```

**Problem Statement:**

Explain how struct embedding works in Go. What is method promotion?

**Solution:**

Struct embedding allows you to include one struct inside another struct. Method promotion allows you to call the methods of the embedded struct directly on the outer struct.

**Explanation:**

In this case, the `B` struct embeds the `A` struct. This means that the `B` struct has all the fields and methods of the `A` struct. The `PrintName()` method of the `A` struct is promoted to the `B` struct, so you can call it directly on the `b` variable.

### Question 5: Channel Direction

**Code Snippet:**

```go
package main

import "fmt"

func sendOnly(ch chan<- int) {
	ch <- 1
}

func receiveOnly(ch <-chan int) {
	fmt.Println(<-ch)
}

func main() {
	ch := make(chan int, 1)
	sendOnly(ch)
	receiveOnly(ch)
}
```

**Problem Statement:**

Explain the purpose of channel direction in Go. How do `chan<-` and `<-chan` work?

**Solution:**

Channel direction is used to specify whether a channel can be used for sending or receiving. `chan<-` specifies a send-only channel, and `<-chan` specifies a receive-only channel.

**Explanation:**

In this case, the `sendOnly` function takes a send-only channel as an argument. This means that the `sendOnly` function can only send values to the channel, and it cannot receive values from the channel. The `receiveOnly` function takes a receive-only channel as an argument. This means that the `receiveOnly` function can only receive values from the channel, and it cannot send values to the channel.

### Question 6: Select with Default Case

**Code Snippet:**

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan int)

	select {
	case val := <-ch:
		fmt.Println("Received:", val)
	default:
		fmt.Println("No value received")
	}

	time.Sleep(1 * time.Second)
}
```

**Problem Statement:**

What will be the output of the code above? Explain the purpose of the `default` case in a `select` statement.

**Solution:**

The output will be:

```
No value received
```

**Explanation:**

The `select` statement waits on multiple channel operations. If none of the channel operations are ready, the `default` case is executed. In this case, the channel `ch` is empty, so the `case val := <-ch` branch is not ready. Therefore, the `default` case is executed, printing "No value received".

### Question 7: Race Conditions with Maps

**Code Snippet:**

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	m := make(map[int]int)
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			m[i] = i
		}(i)
	}

	wg.Wait()
	fmt.Println("Map:", m)
}
```

**Problem Statement:**

The code above attempts to concurrently write to a map. Identify the potential issue and explain how to fix it.

**Solution:**

The issue is a race condition. Multiple goroutines are trying to access and modify the map concurrently without any synchronization mechanism. This can lead to unpredictable and incorrect results.

To fix this, we need to protect the map using a mutex.

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	m := make(map[int]int)
	var wg sync.WaitGroup
	var mu sync.Mutex // Mutex to protect the map

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			mu.Lock()   // Acquire the lock
			m[i] = i    // Write to the map
			mu.Unlock() // Release the lock
		}(i)
	}

	wg.Wait()
	fmt.Println("Map:", m)
}
```

**Explanation:**

By using a `sync.Mutex`, we ensure that only one goroutine can access and modify the map at a time. The `mu.Lock()` method acquires the lock before writing to the map, and `mu.Unlock()` releases the lock after the write. This prevents race conditions and ensures that the map is updated correctly.

### Question 8: Understanding the Zero Value

**Problem Statement:**

What is the zero value of the following types in Go: `int`, `bool`, `string`, `struct`, `pointer`, `slice`, `map`, `channel`, `interface`?

**Solution:**

*   `int`: 0
*   `bool`: `false`
*   `string`: `""` (empty string)
*   `struct`: A struct with all fields set to their zero values.
*   `pointer`: `nil`
*   `slice`: `nil`
*   `map`: `nil`
*   `channel`: `nil`
*   `interface`: `nil`

### Question 9: Using `time.After`

**Code Snippet:**

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	timeout := time.After(2 * time.Second)
	fmt.Println("Waiting...")
	<-timeout
	fmt.Println("Timeout!")
}
```

**Problem Statement:**

Explain what the code above does and what it outputs.

**Solution:**

The code waits for 2 seconds and then prints "Timeout!".

**Explanation:**

The `time.After` function returns a channel that receives the current time after the specified duration. In this case, the `timeout` variable is assigned a channel that will receive the current time after 2 seconds. The `<-timeout` statement blocks until the channel receives a value. After 2 seconds, the channel receives the current time, and the `<-timeout` statement unblocks, allowing the program to continue execution and print "Timeout!".

### Question 10: Working with Variadic Functions

**Code Snippet:**

```go
package main

import "fmt"

func sum(nums ...int) int {
	total := 0
	for _, num := range nums {
		total += num
	}
	return total
}

func main() {
	fmt.Println(sum(1, 2, 3))
	fmt.Println(sum(4, 5, 6, 7))
}
```

**Problem Statement:**

Explain how variadic functions work in Go. What is the type of the `nums` parameter in the `sum` function?

**Solution:**

Variadic functions are functions that can take a variable number of arguments. The type of the `nums` parameter in the `sum` function is `[]int` (a slice of integers).

**Explanation:**

The `...` syntax in the function signature indicates that the function is variadic. When a variadic function is called, the arguments are passed as a slice to the function. In this case, the `sum` function takes a variable number of integers as arguments. The arguments are passed as a slice of integers to the `nums` parameter. The `sum` function then iterates over the slice and calculates the sum of the integers.