# Tricky Interview Questions for Senior Golang Developers

### Question 1: Understanding the `go:embed` Directive

**Problem Statement:**

What is the `go:embed` directive? How can it be used to embed files and directories into Go binaries?

**Solution:**

The `go:embed` directive is a compiler directive that allows you to embed files and directories into your Go binaries. This can be useful for including static assets, such as HTML templates, CSS files, and JavaScript files, in your application.

**Explanation:**

To use the `go:embed` directive, you first need to import the `embed` package in your Go source code. Then, you can declare a variable of type `embed.FS` and use the `//go:embed` directive to associate the variable with the files and directories that you want to embed. For example:

```go
package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
)

//go:embed static
var staticFS embed.FS

func main() {
	// Access embedded files
	fsys, err := fs.Sub(staticFS, "static")
	if err != nil {
		log.Fatal(err)
	}

	http.Handle("/", http.FileServer(http.FS(fsys)))

	fmt.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### Question 2: Implementing a Generic Stack

**Problem Statement:**

Implement a generic stack data structure in Go using type parameters (generics).

**Solution:**

```go
package main

import "fmt"

type Stack[T any] struct {
	items []T
}

func NewStack[T any]() *Stack[T] {
	return &Stack[T]{
		items: []T{},
	}
}

func (s *Stack[T]) Push(item T) {
	s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
	if len(s.items) == 0 {
		var zero T
		return zero, false
	}
	item := s.items[len(s.items)-1]
	s.items = s.items[:len(s.items)-1]
	return item, true
}

func (s *Stack[T]) Peek() (T, bool) {
	if len(s.items) == 0 {
		var zero T
		return zero, false
	}
	return s.items[len(s.items)-1], true
}

func (s *Stack[T]) IsEmpty() bool {
	return len(s.items) == 0
}

func main() {
	stack := NewStack[int]()
	stack.Push(1)
	stack.Push(2)
	stack.Push(3)

	fmt.Println("Peek:", stack.Peek())

	for !stack.IsEmpty() {
		item, _ := stack.Pop()
		fmt.Println("Popped:", item)
	}
}
```

**Explanation:**

The `Stack[T any]` struct defines a generic stack that can store elements of any type. The `NewStack[T any]()` function creates a new stack of the specified type. The `Push` method adds an element to the top of the stack. The `Pop` method removes and returns the element at the top of the stack. The `Peek` method returns the element at the top of the stack without removing it. The `IsEmpty` method returns true if the stack is empty.

### Question 3: Understanding the `comparable` Constraint

**Problem Statement:**

What is the `comparable` constraint in Go generics? What types satisfy this constraint?

**Solution:**

The `comparable` constraint is a predefined constraint in Go generics that specifies that a type must be comparable using the `==` and `!=` operators.

**Explanation:**

Types that satisfy the `comparable` constraint include:

*   Boolean types
*   Numeric types
*   String types
*   Pointer types
*   Channel types
*   Interface types
*   Arrays of comparable types
*   Structs whose fields are all comparable types

Types that do not satisfy the `comparable` constraint include:

*   Slices
*   Maps
*   Functions

### Question 4: Implementing a Simple Concurrent Map

**Problem Statement:**

Implement a simple concurrent map in Go that allows multiple goroutines to read and write to the map concurrently.

**Solution:**

```go
package main

import (
	"fmt"
	"sync"
)

type ConcurrentMap[K comparable, V any] struct {
	mu sync.RWMutex
	m  map[K]V
}

func NewConcurrentMap[K comparable, V any]() *ConcurrentMap[K, V] {
	return &ConcurrentMap[K, V]{
		m: make(map[K]V),
	}
}

func (cm *ConcurrentMap[K, V]) Load(key K) (V, bool) {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	val, ok := cm.m[key]
	return val, ok
}

func (cm *ConcurrentMap[K, V]) Store(key K, value V) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.m[key] = value
}

func (cm *ConcurrentMap[K, V]) Delete(key K) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	delete(cm.m, key)
}

func main() {
	cmap := NewConcurrentMap[string, int]()

	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			cmap.Store(fmt.Sprintf("key-%d", i), i)
		}(i)
	}

	wg.Wait()

	val, ok := cmap.Load("key-50")
	fmt.Println("key-50:", val, ok)
}
```

**Explanation:**

The `ConcurrentMap[K comparable, V any]` struct defines a generic concurrent map that can store key-value pairs of any comparable type. The `NewConcurrentMap[K comparable, V any]()` function creates a new concurrent map of the specified type. The `Load` method retrieves a value from the map. The `Store` method adds or updates a value in the map. The `Delete` method removes a value from the map.

### Question 5: Understanding the `any` Type

**Problem Statement:**

What is the `any` type in Go? How is it different from the `interface{}` type?

**Solution:**

The `any` type is an alias for the `interface{}` type. It is used to represent a value of any type.

**Explanation:**

The `any` type was introduced in Go 1.18 as a more readable alias for the `interface{}` type. The two types are equivalent and can be used interchangeably.

### Question 6: Implementing a Simple Merge Sort

**Problem Statement:**

Implement a simple merge sort algorithm in Go using generics.

**Solution:**

```go
package main

import "fmt"

func merge[T any](left, right []T, compare func(T, T) bool) []T {
	result := make([]T, 0, len(left)+len(right))
	i, j := 0, 0
	for i < len(left) && j < len(right) {
		if compare(left[i], right[j]) {
			result = append(result, left[i])
			i++
		} else {
			result = append(result, right[j])
			j++
		}
		
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
		sum:= 0
		
		go func() {
		for i := 1; i <= 5; i++ {
		sum += <-naturals
		}
		fmt.Println(sum)
		}()
		
		SumOfSquares(naturals, squares)
		}
		
		## What are lock-free data structures, and does Go have them?
		
		**Lock-free data structures** are a type of data structure designed for multithreaded operations without using traditional locks like mutexes.
		
		The main idea is to provide thread safety and avoid problems associated with locks, including deadlocks and performance bottlenecks.
		
		Lock-free data structures typically use atomic operations like CAS (compare-and-swap) to ensure data consistency between threads. These operations allow threads to compete for data modification while guaranteeing only one thread can successfully modify data at any given time.
		
		In Go, a language with concurrency support, there are several examples of lock-free or nearly lock-free data structures, especially in the standard library. For example:
		
		1.  **Channels:** although Go channels aren't completely lock-free, they provide a high-level way to exchange data between goroutines without explicit locks.
		2.  **Atomic operations:** the `sync/atomic` package in Go provides primitives for atomic operations, which are key components for creating lock-free data structures.
		3.  **`sync.Map`:** designed for use cases where keys mostly don't change, it uses optimizations to reduce lock needs.
		
		## Implementing a WorkerPool with a given function
		
		We need to split processes into several goroutines - without creating a new goroutine each time, but reusing existing ones. For this we'll create a job channel and a result channel. For each worker we'll create a goroutine that will wait for a new job, apply the given function to it, and send the answer to the result channel.
		
		Here's the complete implementation:
		
		```go
		package main
		
		import (
		"fmt"
		)
		
		func worker(id int, f func(int) int, jobs <-chan int, results chan<- int) {
		for j := range jobs {
		results <- f(j)
		}
		}
		
		func main() {
		const numJobs = 5
		jobs := make(chan int, numJobs)
		results := make(chan int, numJobs)
		
		multiplier := func(x int) int {
		return x * 10
		}
		
		for w := 1; w <= 3; w++ {
		go worker(w,  multiplier, jobs, results)
		}
		
		for j := 1; j <= numJobs; j++ {
		jobs <- j
		}
		close(jobs)
		
		for i := 1; i <= numJobs; i++ {
		fmt.Println(<-results)
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
	}
	result = append(result, left[i:]...)
	result = append(result, right[j:]...)
	return result
}

func mergeSort[T any](list []T, compare func(T, T) bool) []T {
	if len(list) <= 1 {
		return list
	}

	mid := len(list) / 2
	left := mergeSort(list[:mid], compare)
	right := mergeSort(list[mid:], compare)

	return merge(left, right, compare)
}

func main() {
	numbers := []int{5, 2, 9, 1, 5, 6}
	sortedNumbers := mergeSort(numbers, func(a, b int) bool {
		return a < b
	})
	fmt.Println("Sorted numbers:", sortedNumbers)

	strings := []string{"banana", "apple", "cherry"}
	sortedStrings := mergeSort(strings, func(a, b string) bool {
		return a < b
	})
	fmt.Println("Sorted strings:", sortedStrings)
}
```

**Explanation:**

The `mergeSort[T any]` function implements the merge sort algorithm using generics. The `compare` function is used to compare two elements of the list. The `merge` function merges two sorted lists into a single sorted list.

### Question 7: Understanding Type Inference in Generics

**Problem Statement:**

Explain how type inference works in Go generics. Provide examples.

**Solution:**

Type inference in Go generics allows the compiler to automatically infer the type arguments for a generic function or type based on the context in which it is used.

**Explanation:**

```go
package main

import "fmt"

func Print[T any](s []T) {
	for _, v := range s {
		fmt.Print(v, " ")
	}
	fmt.Println()
}

func main() {
	numbers := []int{1, 2, 3}
	Print(numbers) // Type inference: T is int

	strings := []string{"hello", "world"}
	Print(strings) // Type inference: T is string
}
```

### Question 8: Implementing a Simple Set

**Problem Statement:**

Implement a simple set data structure in Go using generics.

**Solution:**

```go
package main

import "fmt"

type Set[T comparable] struct {
	m map[T]bool
}

func NewSet[T comparable]() *Set[T] {
	return &Set[T]{
		m: make(map[T]bool),
	}
}

func (s *Set[T]) Add(item T) {
	s.m[item] = true
}

func (s *Set[T]) Remove(item T) {
	delete(s.m, item)
}

func (s *Set[T]) Contains(item T) bool {
	return s.m[item]
}

func (s *Set[T]) Size() int {
	return len(s.m)
}

func main() {
	set := NewSet[int]()
	set.Add(1)
	set.Add(2)
	set.Add(3)

	fmt.Println("Contains 2:", set.Contains(2))
	fmt.Println("Size:", set.Size())

	set.Remove(2)
	fmt.Println("Contains 2 after removal:", set.Contains(2))
	fmt.Println("Size after removal:", set.Size())
}
```

**Explanation:**

The `Set[T comparable]` struct defines a generic set that can store elements of any comparable type. The `NewSet[T comparable]()` function creates a new set of the specified type. The `Add` method adds an element to the set. The `Remove` method removes an element from the set. The `Contains` method returns true if the set contains the element. The `Size` method returns the number of elements in the set.

### Question 9: Understanding Type Sets

**Problem Statement:**

What are type sets in Go? How are they defined and used?

**Solution:**

Type sets are a feature introduced in Go 1.18 that allows you to define a set of types that satisfy a particular interface.

**Explanation:**

```go
package main

import "fmt"

type Stringable interface {
	~string | ~[]byte // Type set: string or []byte
	String() string
}

type MyString string

func (s MyString) String() string {
	return string(s)
}

func PrintString[T Stringable](s T) {
	fmt.Println(s.String())
}

func main() {
	var myString MyString = "hello"
	PrintString(myString)

	var byteArray []byte = []byte("world")
	// PrintString(byteArray) // This will not work because []byte does not have String() method
	fmt.Println(string(byteArray))
}
```

### Question 10: Implementing a Simple LRU Cache with Generics

**Problem Statement:**

Implement a simple LRU (Least Recently Used) cache in Go using generics.

**Solution:**

```go
package main

import (
	"container/list"
	"fmt"
)

type LRUCache[K comparable, V any] struct {
	capacity  int
	cache     map[K]*list.Element
	list      *list.List
}

type entry[K comparable, V any] struct {
	key   K
	value V
}

func NewLRUCache[K comparable, V any](capacity int) *LRUCache[K, V] {
	return &LRUCache[K, V]{
		capacity:  capacity,
		cache:     make(map[K]*list.Element),
		list:      list.New(),
	}
}

func (c *LRUCache[K, V]) Get(key K) (value V, ok bool) {
	if elem, ok := c.cache[key]; ok {
		c.list.MoveToFront(elem)
		return elem.Value.(*entry[K, V]).value, true
	}
	var zero V
	return zero, false
}

func (c *LRUCache[K, V]) Put(key K, value V) {
	if elem, ok := c.cache[key]; ok {
		c.list.MoveToFront(elem)
		elem.Value.(*entry[K, V]).value = value
		return
	}

	ent := &entry[K, V]{key, value}
	elem := c.list.PushFront(ent)
	c.cache[key] = elem

	if c.list.Len() > c.capacity {
		elem := c.list.Back()
		if elem != nil {
			c.list.Remove(elem)
			delete(c.cache, elem.Value.(*entry[K, V]).key)
		}
	}
}

func main() {
	cache := NewLRUCache[string, int](3)
	cache.Put("a", 1)
	cache.Put("b", 2)
	cache.Put("c", 3)
	fmt.Println(cache.Get("a"))
	cache.Put("d", 4)
	fmt.Println(cache.Get("b"))
	fmt.Println(cache.Get("c"))
	fmt.Println(cache.Get("d"))
}