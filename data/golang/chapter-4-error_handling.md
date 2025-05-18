# Tricky Interview Questions for Senior Golang Developers

### Question 1: Understanding the Copy Function

**Code Snippet:**

```go
package main

import "fmt"

func main() {
	src := []int{1, 2, 3, 4, 5}
	dst := make([]int, 3)
	n := copy(dst, src)
	fmt.Println("Copied", n, "elements")
	fmt.Println("Source:", src)
	fmt.Println("Destination:", dst)
}
```

**Problem Statement:**

Explain what the `copy` function does in Go. What will be the output of the code above?

**Solution:**

The `copy` function copies elements from a source slice to a destination slice. It returns the number of elements copied, which will be the minimum of the lengths of the source and destination slices.

The output will be:

```
Copied 3 elements
Source: [1 2 3 4 5]
Destination: [1 2 3]
```

**Explanation:**

The `copy` function copies elements from the `src` slice to the `dst` slice. The `dst` slice has a length of 3, so the `copy` function copies the first 3 elements from the `src` slice to the `dst` slice. The `copy` function returns the number of elements copied, which is 3.

### Question 2: Using the Empty Struct

**Problem Statement:**

What are some use cases for the empty struct `struct{}` in Go?

**Solution:**

The empty struct `struct{}` is a struct that has no fields. It is often used as a signal or a placeholder when you only need to indicate the presence or absence of something, without needing to store any data.

Some use cases for the empty struct include:

*   **Set implementation:** You can use a map with the empty struct as the value type to implement a set. The keys of the map represent the elements of the set, and the presence of a key in the map indicates that the element is in the set.
*   **Channel signaling:** You can use a channel with the empty struct as the element type to signal events between goroutines. Sending a value on the channel indicates that the event has occurred, and the value itself is not important.
*   **Placeholder in structs:** You can use the empty struct as a placeholder in structs to reduce memory usage. If you have a struct that contains a field that is only used to indicate the presence or absence of something, you can replace the field with the empty struct to reduce the memory usage of the struct.

### Question 3: Understanding the `unsafe` Package

**Problem Statement:**

What is the `unsafe` package in Go? When should you use it, and what are the risks?

**Solution:**

The `unsafe` package in Go provides access to low-level memory operations that are not normally available in Go. It allows you to bypass the type system and perform operations such as converting between different pointer types, accessing the memory of a struct field directly, and calling functions at arbitrary memory addresses.

The `unsafe` package should only be used when absolutely necessary, as it can lead to undefined behavior, memory corruption, and security vulnerabilities. It should only be used when you need to perform operations that are not possible using the standard Go language features, such as interacting with hardware or implementing low-level data structures.

The risks of using the `unsafe` package include:

*   **Type safety violations:** The `unsafe` package allows you to bypass the type system, which can lead to type safety violations and undefined behavior.
*   **Memory corruption:** The `unsafe` package allows you to access memory directly, which can lead to memory corruption if you are not careful.
*   **Security vulnerabilities:** The `unsafe` package can be used to exploit security vulnerabilities in your code.
*   **Portability issues:** Code that uses the `unsafe` package may not be portable to different architectures or operating systems.

### Question 4: Detecting Goroutine Leaks

**Problem Statement:**

How can you detect goroutine leaks in Go?

**Solution:**

Goroutine leaks occur when goroutines are blocked indefinitely, preventing them from exiting and consuming resources. Detecting goroutine leaks can be challenging, but there are several techniques you can use:

*   **Profiling:** You can use the Go profiler to identify goroutines that are blocked for extended periods of time. The profiler can show you the call stacks of the blocked goroutines, which can help you identify the cause of the leak.
*   **Runtime statistics:** You can use the `runtime.NumGoroutine()` function to get the number of active goroutines in your program. If the number of goroutines is constantly increasing, it may indicate a goroutine leak.
*   **Logging:** You can add logging statements to your code to track the creation and termination of goroutines. This can help you identify goroutines that are not being terminated properly.
*   **Code review:** You can review your code carefully to identify potential sources of goroutine leaks, such as unbuffered channels, missing `defer` statements, and infinite loops.

### Question 5: Implementing a Rate Limiter

**Problem Statement:**

Implement a simple rate limiter in Go that allows a maximum of N requests per second.

**Solution:**

```go
package main

import (
	"fmt"
	"time"
)

type RateLimiter struct {
	tokens       chan struct{}
	fillInterval time.Duration
}

func NewRateLimiter(rate int) *RateLimiter {
	rl := &RateLimiter{
		tokens:       make(chan struct{}, rate),
		fillInterval: time.Second / time.Duration(rate),
	}

	go rl.fillTokens()
	return rl
}

func (rl *RateLimiter) fillTokens() {
	ticker := time.NewTicker(rl.fillInterval)
	defer ticker.Stop()

	for range ticker.C {
		select {
		case rl.tokens <- struct{}{}:
		default:
			// Rate limit exceeded
		}
	}
}

func (rl *RateLimiter) Allow() bool {
	select {
	case <-rl.tokens:
		return true
	default:
		return false
	}
}

func main() {
	rl := NewRateLimiter(5) // Allow 5 requests per second

	for i := 0; i < 10; i++ {
		if rl.Allow() {
			fmt.Println("Request allowed")
		} else {
			fmt.Println("Rate limit exceeded")
		}
		time.Sleep(100 * time.Millisecond)
	}
}
```

**Explanation:**

The `RateLimiter` struct contains a channel of empty structs (`tokens`) and a fill interval. The `NewRateLimiter` function creates a new rate limiter with the specified rate and starts a goroutine that fills the `tokens` channel at the specified interval. The `Allow` method attempts to receive a value from the `tokens` channel. If a value is received, it means that a token is available, and the request is allowed. If the channel is empty, it means that the rate limit has been exceeded, and the request is denied.

### Question 6: Understanding Memory Alignment

**Problem Statement:**

What is memory alignment in Go? Why is it important?

**Solution:**

Memory alignment is the requirement that data must be stored at memory addresses that are multiples of a certain value, called the alignment. The alignment is typically determined by the size of the data type. For example, an `int32` value may need to be aligned at a 4-byte boundary, meaning that its memory address must be a multiple of 4.

Memory alignment is important for several reasons:

*   **Performance:** Unaligned memory access can be slower than aligned memory access, especially on some architectures.
*   **Correctness:** Some architectures may not support unaligned memory access at all, and attempting to access unaligned memory can lead to crashes or other undefined behavior.
*   **Portability:** Memory alignment requirements can vary between different architectures, so code that relies on unaligned memory access may not be portable.

### Question 7: Implementing a Worker Pool

**Problem Statement:**

Implement a simple worker pool in Go that can execute a fixed number of tasks concurrently.

**Solution:**

```go
package main

import (
	"fmt"
	"sync"
)

func worker(id int, jobs <-chan int, results chan<- int) {
	for j := range jobs {
		fmt.Println("worker", id, "processing job", j)
		// Simulate some work
		// time.Sleep(time.Second)
		results <- j * 2
	}
}

func main() {
	numJobs := 10
	numWorkers := 3

	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)

	var wg sync.WaitGroup
	for w := 1; w <= numWorkers; w++ {
		wg.Add(1)
		go func(w int) {
			defer wg.Done()
			worker(w, jobs, results)
		}(w)
	}

	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs)

	wg.Wait()
	close(results)

	for a := range results {
		fmt.Println(a)
	}
}
```

**Explanation:**

The `worker` function receives jobs from the `jobs` channel and sends the results to the `results` channel. The `main` function creates a fixed number of worker goroutines and distributes the jobs to the workers. The `main` function also collects the results from the workers and prints them to the console.

### Question 8: Understanding the `go vet` Tool

**Problem Statement:**

What is the `go vet` tool? What kinds of problems can it detect?

**Solution:**

The `go vet` tool is a static analysis tool that is included with the Go distribution. It is used to detect common errors in Go code, such as:

*   Unreachable code
*   Unused variables
*   Incorrect format strings
*   Shadowing variables
*   Data races
*   Nil pointer dereferences

The `go vet` tool can help you identify and fix potential problems in your code before you run it, which can save you time and effort in the long run.

### Question 9: Implementing a Simple LRU Cache

**Problem Statement:**

Implement a simple LRU (Least Recently Used) cache in Go.

**Solution:**

```go
package main

import (
	"container/list"
	"fmt"
)

type LRUCache struct {
	capacity int
	cache    map[interface{}]*list.Element
	list     *list.List
}

type entry struct {
	key   interface{}
	value interface{}
}

func NewLRUCache(capacity int) *LRUCache {
	return &LRUCache{
		capacity: capacity,
		cache:    make(map[interface{}]*list.Element),
		list:     list.New(),
	}
}

func (c *LRUCache) Get(key interface{}) (value interface{}, ok bool) {
	if elem, ok := c.cache[key]; ok {
		c.list.MoveToFront(elem)
		return elem.Value.(*entry).value, true
	}
	return nil, false
}

func (c *LRUCache) Put(key interface{}, value interface{}) {
	if elem, ok := c.cache[key]; ok {
		c.list.MoveToFront(elem)
		elem.Value.(*entry).value = value
		return
	}

	ent := &entry{key, value}
	elem := c.list.PushFront(ent)
	c.cache[key] = elem

	if c.list.Len() > c.capacity {
		elem := c.list.Back()
		if elem != nil {
			c.list.Remove(elem)
			delete(c.cache, elem.Value.(*entry).key)
		}
	}
}

func main() {
	cache := NewLRUCache(3)
	cache.Put("a", 1)
	cache.Put("b", 2)
	cache.Put("c", 3)
	fmt.Println(cache.Get("a")) // nil false
	cache.Put("d", 4)
	fmt.Println(cache.Get("b")) // nil false
	fmt.Println(cache.Get("c")) // 3 true
	fmt.Println(cache.Get("d")) // 4 true
}
```

**Explanation:**

The `LRUCache` struct contains a capacity, a cache (a map from key to list element), and a list (a doubly linked list). The `Get` method retrieves a value from the cache. If the value is found, it is moved to the front of the list and returned. The `Put` method adds a value to the cache. If the value is already in the cache, it is moved to the front of the list and updated. If the cache is full, the least recently used value is removed from the cache.

### Question 10: Understanding Context Switching

**Problem Statement:**

What is context switching in Go? How does it work?

**Solution:**

Context switching is the process of switching the CPU from one goroutine to another. It allows multiple goroutines to share the same CPU core and execute concurrently.

**Explanation:**

In Go, context switching is performed by the Go scheduler. The Go scheduler is a part of the Go runtime that is responsible for managing goroutines and scheduling them to run on the CPU. The Go scheduler uses a technique called "cooperative multitasking" to perform context switching. In cooperative multitasking, each goroutine voluntarily yields control of the CPU to the scheduler at certain points in its execution, such as when it is blocked waiting for I/O or when it calls the `runtime.Gosched()` function. The scheduler then selects another goroutine to run on the CPU.

## How is OOP implemented in Go?

Generally, Go doesn't have classical OOP in the full sense, but it has some similar capabilities. Go lacks classes, objects, exceptions, and templates. There's no type hierarchy, but there are types themselves - meaning the ability to describe custom types/structures. Struct types (with methods) serve the same purposes as classes in other languages.

In Go, we can express things more straightforwardly compared to using classes - we can separately describe properties and behavior, and use _composition_ instead of traditional inheritance, which Go doesn't have.

## What is reflection in Go and why is it useful?

Reflection in Go is implemented in the `reflect` package and represents a mechanism that allows code to examine values, types and structures at runtime, without prior knowledge about them.

Reflection is useful when we need to work with data of unknown type, for example during data serialization/deserialization, ORM system implementation, etc.

With reflection we can, for example, determine a variable's type, read and modify its values, call methods dynamically. This makes code more flexible, but reflection should be used carefully as it can lead to complex, hard-to-read code and reduce performance.

## What are buffered and unbuffered file I/O?

**Buffered file I/O** uses a buffer for temporary data storage before reading or writing. Thus, instead of reading a file byte by byte, we read many data at once. We place data in a buffer and wait until someone reads it as desired.

**Unbuffered file I/O:** no buffer is used for temporary data storage before actual reading or writing, which may affect performance.

**When to use which?** When working with critical data, unbuffered file I/O is generally better since buffered reading may lead to using stale data, while unbuffered writing may lead to data loss in case of failure. However, in most cases there's no definitive answer.

## Implementing link traversal from a file

**Task:** given a file containing HTTP links to various resources, implement traversal of all these links, outputting OK for 200 response codes and Not OK otherwise.

Here's what the naive version looks like (we read the file into memory and iterate through the link slice):

```go
package main

import (
	"bufio"
	"context"
	"net/http"
	"os"
	"strings"
	"time"
)

func main() {
	if err := run(); err != nil {
		println(err.Error())
		os.Exit(1)
	}
}

func run() error {
	var ctx = context.Background()

	// open file
	f, err := os.Open("links_list.txt")
	if err != nil {
		return err
	}
	defer func() { _ = f.Close() }()

	// read file line by line
	var scan = bufio.NewScanner(f)
	for scan.Scan() {
		var url = strings.TrimSpace(scan.Text())

		if ok, fetchErr := fetchLink(ctx, http.MethodGet, url); fetchErr != nil {
			return fetchErr
		} else {
			if ok {
				println("OK", url)
			} else {
				println("Not OK", url)
			}
		}
	}

	// check scanner for errors
	if err = scan.Err(); err != nil {
		return err
	}

	return nil
}

// declare HTTP client for reuse
var httpClient = http.Client{Timeout: time.Second * 5}

func fetchLink(ctx context.Context, method, url string) (bool, error) {
	// create request object
	var req, err = http.NewRequestWithContext(ctx, method, url, http.NoBody)
	if err != nil {
		return false, err
	}

	// execute it
	resp, err := httpClient.Do(req)
	if err != nil {
		return false, err
	}

	// validate status code
	if resp.StatusCode == http.StatusOK {
		return true, nil
	}

	return false, nil
}
```

## How can JSON data be processed in Golang?

Golang provides the built-in `encoding/json` package for working with JSON data. Here's an example of reading and writing JSON data:

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Person struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func main() {
	// Convert struct to JSON
	person := Person{Name: "John Doe", Age: 30}
	jsonData, _ := json.Marshal(person)
	fmt.Println(string(jsonData))

	// Read JSON into struct
	var decodedPerson Person
	json.Unmarshal(jsonData, &decodedPerson)
	fmt.Println(decodedPerson.Name, decodedPerson.Age)
}
```

In this example, the `Person` struct represents an object with `Name` and `Age` fields. The `json.Marshal()` function converts the struct to a JSON string, while `json.Unmarshal()` reads a JSON string and converts it to a struct.

The `encoding/json` package provides powerful and flexible tools for working with JSON data in Golang.