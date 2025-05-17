# Tricky Interview Questions for Senior Golang Developers

### Question 1: Understanding the `go generate` Tool

**Problem Statement:**

What is the `go generate` tool? How is it used?

**Solution:**

The `go generate` tool is a command-line tool that is used to automate the generation of Go source code. It allows you to embed commands in your Go source code that will be executed by the `go generate` tool. These commands can be used to generate code based on other files, such as configuration files or data files.

**Explanation:**

The `go generate` tool works by scanning your Go source code for special comments that start with the `//go:generate` prefix. These comments contain commands that will be executed by the `go generate` tool. The commands can be any valid command-line command, such as `protoc` (to generate Go code from protocol buffer files) or `stringer` (to generate string representations of constants).

To use the `go generate` tool, you first need to add the `//go:generate` comments to your Go source code. Then, you can run the `go generate` command in your project directory. The `go generate` command will execute the commands in the `//go:generate` comments and generate the corresponding Go source code.

### Question 2: Implementing a Simple Bloom Filter

**Problem Statement:**

Implement a simple Bloom filter in Go.

**Solution:**

```go
package main

import (
	"fmt"
	"hash/fnv"
)

type BloomFilter struct {
	bitset  []bool
	size    uint32
	hashFns []func(string) uint32
}

func NewBloomFilter(size uint32, numHashFns int) *BloomFilter {
	return &BloomFilter{
		bitset:  make([]bool, size),
		size:    size,
		hashFns: generateHashFunctions(numHashFns),
	}
}

func generateHashFunctions(numHashFns int) []func(string) uint32 {
	hashFns := make([]func(string) uint32, numHashFns)
	for i := 0; i < numHashFns; i++ {
		seed := uint32(i)
		hashFns[i] = func(s string) uint32 {
			h := fnv.New32a()
			h.Write([]byte(s))
			return h.Sum32() % seed
		}
	}
	return hashFns
}

func (bf *BloomFilter) Add(s string) {
	for _, hashFn := range bf.hashFns {
		index := hashFn(s) % bf.size
		bf.bitset[index] = true
	}
}

func (bf *BloomFilter) Contains(s string) bool {
	for _, hashFn := range bf.hashFns {
		index := hashFn(s) % bf.size
		if !bf.bitset[index] {
			return false
		}
	}
	return true
}

func main() {
	bf := NewBloomFilter(100, 3)
	bf.Add("hello")
	bf.Add("world")

	fmt.Println(bf.Contains("hello")) // true
	fmt.Println(bf.Contains("world")) // true
	fmt.Println(bf.Contains("test"))  // false (might be true due to false positive)
}
```

**Explanation:**

The `BloomFilter` struct contains a bitset (a slice of booleans), a size, and a slice of hash functions. The `NewBloomFilter` function creates a new Bloom filter with the specified size and number of hash functions. The `Add` method adds an element to the Bloom filter by setting the bits at the indices calculated by the hash functions to true. The `Contains` method checks if an element is in the Bloom filter by checking if the bits at the indices calculated by the hash functions are all true.

### Question 3: Understanding the `pprof` Package

**Problem Statement:**

What is the `pprof` package in Go? How can it be used to profile Go programs?

**Solution:**

The `pprof` package in Go provides tools for profiling Go programs. It allows you to collect data about the CPU usage, memory allocation, and goroutine activity of your program. This data can be used to identify performance bottlenecks and optimize your code.

**Explanation:**

The `pprof` package works by sampling the execution of your program at regular intervals. The sampling data is then stored in a profile file, which can be analyzed using the `go tool pprof` command. The `go tool pprof` command provides a variety of tools for analyzing the profile data, such as:

*   **Top:** Shows the functions that are consuming the most CPU time or memory.
*   **Graph:** Shows a graphical representation of the call graph of your program.
*   **Web:** Starts a web server that allows you to browse the profile data in a web browser.

To use the `pprof` package, you first need to import the `net/http/pprof` package in your Go source code. Then, you need to register the `pprof` handlers with the `http.DefaultServeMux`. This can be done by adding the following code to your `main` function:

```go
import _ "net/http/pprof"
```

Then, you can run your program and access the `pprof` handlers by visiting the `/debug/pprof` endpoint in your web browser. For example, if your program is running on `localhost:8080`, you can access the `pprof` handlers by visiting `http://localhost:8080/debug/pprof`.

### Question 4: Implementing a Simple Retry Mechanism

**Problem Statement:**

Implement a simple retry mechanism in Go that retries a function a specified number of times if it returns an error.

**Solution:**

```go
package main

import (
	"fmt"
	"time"
)

func retry(attempts int, sleep time.Duration, f func() error) (err error) {
	for i := 0; i < attempts; i++ {
		err = f()
		if err == nil {
			return nil
		}

		fmt.Println("Attempt", i+1, "failed:", err)
		time.Sleep(sleep)
	}
	return fmt.Errorf("after %d attempts, last error: %s", attempts, err)
}

func main() {
	var attempts = 3
	var sleep = 2 * time.Second
	var operation = func() error {
		// Simulate an operation that might fail
		if time.Now().Unix()%2 == 0 {
			return nil // Success on even seconds
		}
		return fmt.Errorf("operation failed") // Fail on odd seconds
	}

	err := retry(attempts, sleep, operation)
	if err != nil {
		fmt.Println("Operation failed after multiple retries:", err)
	} else {
		fmt.Println("Operation succeeded")
	}
}
```

**Explanation:**

The `retry` function takes the number of attempts, the sleep duration, and a function as arguments. The `retry` function calls the function repeatedly until it returns nil or the number of attempts is exceeded. If the function returns an error, the `retry` function sleeps for the specified duration and then tries again.

### Question 5: Understanding the `sync.Cond` Type

**Problem Statement:**

What is the `sync.Cond` type in Go? How is it used?

**Solution:**

The `sync.Cond` type in Go provides a way for goroutines to wait for a specific condition to become true. It is typically used in conjunction with a mutex to protect the shared state that is being waited on.

**Explanation:**

The `sync.Cond` type has three methods:

*   **Wait:** Releases the mutex and waits for a signal.
*   **Signal:** Wakes up one goroutine that is waiting on the condition.
*   **Broadcast:** Wakes up all goroutines that are waiting on the condition.

To use the `sync.Cond` type, you first need to create a new `sync.Cond` value. Then, you need to acquire the mutex that protects the shared state. Then, you can call the `Wait` method to release the mutex and wait for a signal. When the condition becomes true, another goroutine can call the `Signal` or `Broadcast` method to wake up the waiting goroutine. The waiting goroutine will then reacquire the mutex and check if the condition is still true.

### Question 6: Implementing a Simple TCP Server

**Problem Statement:**

Implement a simple TCP server in Go that listens on a specified port and echoes back any data that it receives.

**Solution:**

```go
package main

import (
	"fmt"
	"net"
	"os"
)

func handleConnection(conn net.Conn) {
	defer conn.Close()

	buffer := make([]byte, 1024)
	for {
		n, err := conn.Read(buffer)
		if err != nil {
			fmt.Println("Error reading:", err.Error())
			return
		}

		fmt.Printf("Received: %s", string(buffer[:n]))

		_, err = conn.Write(buffer[:n])
		if err != nil {
			fmt.Println("Error writing:", err.Error())
			return
		}
	}
}

func main() {
	port := "8080"
	ln, err := net.Listen("tcp", ":"+port)
	if err != nil {
		fmt.Println("Error listening:", err.Error())
		os.Exit(1)
	}
	defer ln.Close()

	fmt.Println("Listening on port " + port)

	for {
		conn, err := ln.Accept()
		if err != nil {
			fmt.Println("Error accepting:", err.Error())
			os.Exit(1)
		}

		fmt.Println("Accepted connection")
		go handleConnection(conn)
	}
}
```

**Explanation:**

The `handleConnection` function reads data from the connection and writes it back to the connection. The `main` function listens on the specified port and accepts incoming connections. For each incoming connection, the `main` function starts a new goroutine to handle the connection.

### Question 7: Understanding the `go tool trace` Command

**Problem Statement:**

What is the `go tool trace` command? How can it be used to trace Go programs?

**Solution:**

The `go tool trace` command is a command-line tool that is used to trace the execution of Go programs. It allows you to collect data about the goroutine activity, garbage collection, and system calls of your program. This data can be used to identify performance bottlenecks and optimize your code.

**Explanation:**

The `go tool trace` command works by instrumenting your Go program to collect trace data. The trace data is then stored in a trace file, which can be analyzed using the `go tool trace` command. The `go tool trace` command provides a variety of tools for analyzing the trace data, such as:

*   **Goroutine analysis:** Shows the activity of each goroutine in your program.
*   **Garbage collection analysis:** Shows the garbage collection activity in your program.
*   **System call analysis:** Shows the system calls that are being made by your program.

To use the `go tool trace` command, you first need to build your Go program with the `-trace` flag. Then, you can run your program and collect the trace data by using the `go tool trace` command. For example:

```bash
go build -o myprogram -gcflags="-N -l" main.go
./myprogram
go tool trace trace.out
```

### Question 8: Implementing a Simple Semaphore

**Problem Statement:**

Implement a simple semaphore in Go.

**Solution:**

```go
package main

import "fmt"

type Semaphore struct {
	ch chan struct{}
}

func NewSemaphore(capacity int) *Semaphore {
	return &Semaphore{
		ch: make(chan struct{}, capacity),
	}
}

func (s *Semaphore) Acquire() {
	s.ch <- struct{}{}
}

func (s *Semaphore) Release() {
	<-s.ch
}

func main() {
	sem := NewSemaphore(2) // Allow 2 concurrent operations

	sem.Acquire()
	fmt.Println("First operation started")
	// time.Sleep(1 * time.Second)
	fmt.Println("First operation completed")
	sem.Release()

	sem.Acquire()
	fmt.Println("Second operation started")
	// time.Sleep(1 * time.Second)
	fmt.Println("Second operation completed")
	sem.Release()

	sem.Acquire() // Blocks until a release
	fmt.Println("Third operation started")
	// time.Sleep(1 * time.Second)
	fmt.Println("Third operation completed")
	sem.Release()
}
```

**Explanation:**

The `Semaphore` struct contains a channel of empty structs (`ch`). The `NewSemaphore` function creates a new semaphore with the specified capacity. The `Acquire` method acquires a permit from the semaphore by sending a value to the channel. The `Release` method releases a permit from the semaphore by receiving a value from the channel.

### Question 9: Understanding the `go doc` Tool

**Problem Statement:**

What is the `go doc` tool? How can it be used to view Go documentation?

**Solution:**

The `go doc` tool is a command-line tool that is used to view Go documentation. It allows you to view the documentation for Go packages, types, functions, and methods.

**Explanation:**

The `go doc` tool works by extracting the documentation from the Go source code. The documentation is written in special comments that start with the `//` prefix. The `go doc` tool can be used to view the documentation for a specific package, type, function, or method by specifying its name as an argument to the `go doc` command. For example:

```bash
go doc fmt.Println
```

This command will display the documentation for the `fmt.Println` function.

### Question 10: Implementing a Simple Circuit Breaker

**Problem Statement:**

Implement a simple circuit breaker in Go.

**Solution:**

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type CircuitBreaker struct {
	mutex     sync.RWMutex
	state     string // "CLOSED", "OPEN", "HALF-OPEN"
	failureThreshold int
	successThreshold int
	timeout     time.Duration
	failureCount int
	successCount int
	lastFailure time.Time
}

func NewCircuitBreaker(failureThreshold int, successThreshold int, timeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		state:     "CLOSED",
		failureThreshold: failureThreshold,
		successThreshold: successThreshold,
		timeout:     timeout,
		failureCount: 0,
		successCount: 0,
	}
}

func (cb *CircuitBreaker) Call(f func() error) error {
	cb.mutex.RLock()
	state := cb.state
	cb.mutex.RUnlock()

	switch state {
	case "CLOSED":
		err := f()
		if err != nil {
			cb.recordFailure()
			return err
		}
		cb.resetCounts()
		return nil
	case "OPEN":
		if time.Since(cb.lastFailure) > cb.timeout {
			cb.transitionToHalfOpen()
		}
		return fmt.Errorf("circuit breaker is open")
	case "HALF-OPEN":
		err := f()
		if err != nil {
			cb.recordFailure()
			cb.transitionToOpen()
			return err
		}
		cb.recordSuccess()
		if cb.successCount >= cb.successThreshold {
			cb.transitionToClosed()
		}
		return nil
	default:
		return fmt.Errorf("unknown circuit breaker state: %s", state)
	}
}

func (cb *CircuitBreaker) recordFailure() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()
	cb.failureCount++
	cb.lastFailure = time.Now()
	if cb.failureCount >= cb.failureThreshold {
		cb.transitionToOpen()
	}
}

func (cb *CircuitBreaker) recordSuccess() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()
	cb.successCount++
}

func (cb *CircuitBreaker) resetCounts() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()
	cb.failureCount = 0
	cb.successCount = 0
}

func (cb *CircuitBreaker) transitionToOpen() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()
	cb.state = "OPEN"
	fmt.Println("Circuit breaker transitioned to OPEN state")
}

func (cb *CircuitBreaker) transitionToHalfOpen() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()
	cb.state = "HALF-OPEN"
	fmt.Println("Circuit breaker transitioned to HALF-OPEN state")
}

func (cb *CircuitBreaker) transitionToClosed() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()
	cb.state = "CLOSED"
	fmt.Println("Circuit breaker transitioned to CLOSED state")
}

func main() {
	cb := NewCircuitBreaker(3, 2, 5*time.Second)

	operation := func() error {
		// Simulate an operation that might fail
		if time.Now().Unix()%3 == 0 {
			return fmt.Errorf("operation failed")
		}
		return nil
	}

	for i := 0; i < 10; i++ {
		err := cb.Call(operation)
		if err != nil {
			fmt.Println("Call failed:", err)
		} else {
			fmt.Println("Call succeeded")
		}
		time.Sleep(1 * time.Second)
	}
}