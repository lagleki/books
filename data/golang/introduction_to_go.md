# Tricky Interview Questions for Senior Golang Developers

## How is OOP implemented in Go?
Generally, Go doesn't have classical OOP in the full sense, but it has some similar capabilities. Go lacks classes, objects, exceptions, and templates. There's no type hierarchy, but there are types themselves - meaning the ability to describe custom types/structures. Struct types (with methods) serve the same purposes as classes in other languages.

In Go, we can express things more straightforwardly compared to using classes - we can separately describe properties and behavior, and use _composition_ instead of traditional inheritance, which Go doesn't have.

Go has interfaces - types that declare sets of methods. Like interfaces in other languages, they have no implementation. Objects that implement all methods of an interface automatically implement that interface.

Encapsulation in Go is implemented at the package level. Names starting with a lowercase letter are only visible within that package (not exported). Conversely, anything starting with an uppercase letter is accessible from outside the package.

Go doesn't have inheritance, but it has structs - data types that can include other types, including other structs (this process is called embedding). Both parent and child structs can have their own methods. With embedding, child method implementations override parent implementations, as shown in this example:

```go
type Parent struct{}

func (c *Parent) Print() {
fmt.Println("parent")
}

type Child struct {
Parent
}

func (p *Child) Print() {
fmt.Println("child")
}

func main() {
var x Child
x.Print()
}

// child
```

By the way, this "inheritance" is called embedding. Let's discuss some embedding features:

*   **Simplicity:** embedding is very easy to use - we just define one type inside another.
*   **Composition over inheritance:** instead of inheriting methods and fields, Go prefers composition where one type can include another, extending its functionality.
*   **Behavior and interfaces:** if an embedded type implements a certain interface, then the type it's embedded in automatically implements that interface.

Here's another embedding example:

```go
type Engine struct {
Power int
Type  string
}

type Car struct {
Engine  
Brand   string
Model   string
}

func main() {
c := Car{
Engine: Engine{Power: 150, Type: "Petrol"},
Brand:  "Ford",
Model:  "Fiesta",
}
fmt.Println(c.Power)
}
```

And an example with embedded methods:

```go
type Writer interface {
Write([]byte) (int, error)
}

type Logger struct {
Writer
}
```

Now `Logger` automatically implements the `Writer` interface, but only if its embedded `Writer` field also implements the methods of this interface.

Some important features:

*   **Field names and conflicts:** if embedded and outer types have fields or methods with the same names, the outer type takes precedence.
*   **Implicit behavior:** one potential "gotcha" is that methods of embedded types become part of the outer type, which might not always be obvious when reading code.
*   **Interfaces and embedding:** Go also allows embedding interfaces, enabling creation of complex interfaces based on existing ones.

## Advantages and disadvantages of Go
**Advantages:**

*   **Simple syntax.** Go lacks inheritance, classes, objects and complex functions. Everything is concise and neat - this makes writing Go and reading others' code simple. Standards and comments are rarely needed for understanding - the code is almost always readable.
*   **Beginner-friendly.** The main Go tutorial is just 50 pages. Thanks to strictness and simple syntax, learning Go isn't difficult even for those with no development experience. It's designed to literally guide developers and protect them from mistakes and typos.
*   **Many built-in developer tools.** The language includes built-in testing tools, documentation utilities, code error detection tools and other useful features. Therefore, Go development is quite simple and pleasant - there's no feeling of constantly needing to search for third-party tools to ease the work.
*   `typecheck` will verify type compliance in code;
*   `gas` will find vulnerabilities;
*   `go vet` helps detect code errors;
*   `gofmt` properly formats code, adding spaces for alignment and tabs for indentation;
*   `godoc` finds comments and prepares a program manual from them, among others.

Go also has the pprof profiling package. It helps identify code fragments that take too long to execute, where the program heavily loads the CPU or consumes too much memory. The results are presented as a text report or profile. Using it requires the graphviz utility.

*   **Large number of libraries.** There are ready standard libraries for practically every task. Third-party libraries also exist, and their list keeps growing. Go code can connect to C and C++ libraries, of which there are many due to these languages' popularity.
*   **High performance.** Rewriting code from another language to Go (especially from Python) can improve performance 5-10 times even without special optimization.
*   **Reliability.** Go programs use memory and computational resources quite efficiently, so they work stably (though C devotees who love controlling every byte won't appreciate this).
*   **Cross-platform.** Few are surprised by this nowadays, but still. Google's language is supported on Windows, Linux, macOS, Android. It also works with FreeBSD, OpenBSD and other UNIX systems. The code is also portable: programs written for one of these operating systems can be easily recompiled for another OS.
*   **UTF-8 support** (one of the most complete among all programming languages).

**Disadvantages:**

*   **Limited functionality.** Whatever anyone writes about universality, Go's main area of application is network and server applications (according to this survey). It performs poorly with GUI creation. Therefore, writing a complete user application in Go is challenging due to limited capabilities, and it's generally inconvenient for many tasks. It should be used wisely where it's truly needed.
*   **Simplicity.** Yes, this is both an advantage and disadvantage, since simplicity comes from omitting some features (like OOP). Some things possible in other languages simply can't be done in Go. For example, developing large projects is difficult due to the lack of objects useful for distributed code collaboration.
*   **Size.** Even simple Go code can easily compile to files several MB in size. Of course, you can strip debug symbols and reduce size with a packer, but this requires caution.
*   **Memory management.** There's no manual memory management; you can't configure garbage collector behavior.
*   **Compiler** that throws local objects on the heap, can't inline functions with more than 3 statements, can't inline single-statement methods if defer is used, etc.
*   **Commas.** The creators wanted to eliminate semicolons, so Go doesn't have them. Instead, every third line of code ends with a comma.
*   Passing everything exclusively by value.

## What data types does Go use?
Go works with the following types:
* Method
* Boolean
* Numeric
* String
* Array
* Slice
* Struct
* Pointer
* Function
* Interface
* Map
* Channel

```go
// strings
str := "Hello"
str := `Multiline
string`

// numbers
num := 3          // int
num := 3.         // float64
num := 3 + 4i     // complex128
num := byte('a')  // byte (alias for uint8)
var u uint = 7        // uint (unsigned)
var p float32 = 22.7  // 32-bit float

// arrays
var numbers [5]int
numbers := [...]int{0, 0, 0, 0, 0}

// slices
slice := []int{2, 3, 4}
slice := []byte("Hello")

// pointers
func main () {
b := *getPointer()
fmt.Println("Value is", b)
}

func getPointer () (myPointer *int) {
a := 234
return &a
}

a := new(int)
*a = 234

// type conversion
i := 2
f := float64(i)
u := uint(i)
```

## What is reflection in Go and why is it useful?
Reflection in Go is implemented in the `reflect` package and represents a mechanism that allows code to examine values, types and structures at runtime, without prior knowledge about them.

Reflection is useful when we need to work with data of unknown type, for example during data serialization/deserialization, ORM system implementation, etc.

With reflection we can, for example, determine a variable's type, read and modify its values, call methods dynamically. This makes code more flexible, but reflection should be used carefully as it can lead to complex, hard-to-read code and reduce performance.

**Simple examples:**

*   **Determining variable type:**

```go
package main

import (  
"fmt"  
"reflect"  
)

func main() {  
x := 42  
fmt.Println("Variable x type:", reflect.TypeOf(x))  
}
```

In this example we use `reflect.TypeOf()` to determine variable `x`'s type. The program will output `int` since `x` is an integer.

*   **Reading and modifying values:**
```go
package main

import (
"fmt"
"reflect"
)

func main() {
x := 42
v := reflect.ValueOf(&x).Elem() // Get reflect.Value

fmt.Println("Original x value:", x)
v.SetInt(43) // Modify x's value
fmt.Println("New x value:", x)
}
```

Here we use `reflect.ValueOf()` to get a `reflect.Value` of variable `x`, then modify its value with `SetInt()`.

*   **Dynamic method invocation:**

```go
package main

import (  
"fmt"  
"reflect"  
)

type MyStruct struct {  
Field int  
}

func (m *MyStruct) UpdateField(val int) {  
m.Field = val  
}

func main() {  
x := MyStruct{Field: 10}

// Get reflect.Value of the struct
v := reflect.ValueOf(&x)

// Get method by name
method := v.MethodByName("UpdateField")

// Call method with arguments
method.Call([]reflect.Value{reflect.ValueOf(20)})

fmt.Println("Updated field value:", x.Field)
}
```

In this example we create a `MyStruct` instance, get the `UpdateField` method using `MethodByName` and call it dynamically with `Call`. The method updates the struct field's value.

## What are numeric constants in Go?
**Numeric constants** in Go are fixed values that don't change during program execution. They're represented by exact values without size or precision limitations, unlike variables. This means numeric constants can be represented with much greater precision than regular numeric variables.

They take their type (e.g., `int`, `float64`) only when necessary, such as when assigning to a variable or when used in an operation requiring a specific type. This provides flexibility and prevents information loss due to type size limitations, especially when performing mathematical operations with constants.

Simple example:

```go
package main

import "fmt"

const (
Big = 1 << 100 
Small = Big >> 99 
)

func needInt(x int) int { return x*10 + 1 }
func needFloat(x float64) float64 { return x * 0.1 }

func main() {
fmt.Println(needInt(Small)) 
fmt.Println(needFloat(Small)) 
fmt.Println(needFloat(Big))
}
```

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
sum:= 0

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

## Breaking a for/switch
What happens in the following example if `f()` returns `true`?

```go
for {
switch f() {
case true:
break
case false:
// some action
}
}
```

Obviously, `break` will be called. But it breaks the `switch`, not the `for` loop.

To fix this and break the `for` loop specifically, we can use a labeled loop and call `break` with that label. For example:

```go
loop:
for {
switch f() {
case true:
break loop
case false:
// some action
}
}
```

## What are generics about?
Generics, or **generalizations** are language features allowing work with different data types without changing their description.

In version `1.18`, generics appeared (they actually existed before, but we couldn't use them in our code - recall the `make(T type)` function).

Generics allow declaring (describing) universal methods, i.e. specifying not one type but sets of types as parameters and return values.

New keywords appeared:
*   `any` - equivalent to `interface{}`, usable anywhere (`func do(v any) any`, `var v any`, `type foo interface { Do() any }`)
*   `comparable` - an interface defining types that can be compared using `==` and `!=` (you can't create variables of this type - `var j comparable` will cause an error)

And the ability to define interfaces that can be used in parameterized functions and types (you can't create variables of this type - `var j Int` will cause an error):

```go
type Int interface {
int | int32 | int64
}
```

Adding `~` before types makes the interface match derived types too, like `myInt` in this example:

```go
type Int interface {
~int | ~int32 | ~int64
}

type myInt int
```

Go developers created a ready set of interfaces for us (the constraints package) that's very convenient to use.

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

## What are buffered and unbuffered file I/O?
**Buffered file I/O** uses a buffer for temporary data storage before reading or writing. Thus, instead of reading a file byte by byte, we read many data at once. We place data in a buffer and wait until someone reads it as desired.

**Unbuffered file I/O:** no buffer is used for temporary data storage before actual reading or writing, which may affect performance.

**When to use which?** When working with critical data, unbuffered file I/O is generally better since buffered reading may lead to using stale data, while unbuffered writing may lead to data loss in case of failure. However, in most cases there's no definitive answer.

## What about linters?
**A linter** is a static code analyzer. Using a linter you can catch errors.

Consider this code:

```go
package main

import "fmt"

func main() {
i := 0
if true {
i := 1
fmt.Println(i)
}
fmt.Println(i)
}
```

Using the built-in `vet` tool from Go's toolset, as well as `shadow`, we can detect shadowed variables.

Install `shadow`:

```cmd
go install 
golang.org/x/tools/go/analysis/passes/shadow/cmd/shadow
```

...link it with `vet` and run:

```go
go vet -vettool=$(which shadow)
```

...we get this output - the linter found the shadowed variable, and we can fix it.

```cmd
./main.go:8:3:
declaration of "i" shadows declaration at line 6
```

In general, using linters makes code more reliable and helps find potential errors, so you should choose a suitable linter and use it often.

There's long been golangci-lint for all occasions - a universal solution combining many linters in "one bottle". Convenient for both local runs and CI.

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

## Advantages and disadvantages of ORM compared to using built-in SQL capabilities?
**ORM advantages:**

1.  Convenience and development speed: ORM lets you interact with databases using an object-oriented approach, often simplifying and speeding up development.
2.  Security: ORM can help avoid some common vulnerabilities through built-in protection mechanisms.
3.  Database independence: ORM provides abstraction making it easier to switch between different DBMS without changing most application code.
4.  Easier refactoring and maintenance: since data access logic is centralized, making changes and maintaining applications becomes simpler.

**ORM disadvantages:**

1.  Performance: ORM can be less efficient than manually optimized SQL queries, especially in complex scenarios.
2.  Complexity: ORM can add an extra complexity layer that may be excessive for simple applications or queries.
3.  Limitations: some ORMs may limit developers' ability to use all features of specific DBMS.
4.  Learning curve: effectively using ORM requires time to learn its specifics and best practices.

**Go ORM examples:** gorm, Beego ORM, SQLBoiler and others.

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

File with link list (`links_list.txt`):

```go
https://www.yahoo.com/foobar
https://stackoverflow.com/foobar
https://blog.iddqd.uk/
https://google.com/404error
https://ya.ru/
https://github.com/foo/bar
https://stackoverflow.com/
```

Run the code (`go run .`), see the result:

```go
Not OK https://www.yahoo.com/foobar
Not OK https://stackoverflow.com/foobar
OK https://blog.iddqd.uk/
Not OK https://google.com/404error
OK https://ya.ru/
Not OK https://github.com/foo/bar
OK https://stackoverflow.com/
```

## Swapping variable values without a temporary variable
In many other languages you'd have to think about this task (except Python), but in Go it's not super hard to implement:

```go
package main
import "fmt"

func main() {
fmt.Println(swap())
}
func swap() []int {
a, b := 15, 10
b, a = a, b
return []int{a, b}
}
```

That's basically it.

## Sum of squares of numbers
**Task:** implement a `SumOfSquares` function that receives an integer `c` and returns the sum of all squares between 1 and `c`. You'll need to use `select` statements, goroutines and channels. For example, input 5 should return 55 because 1² + 2² + 3² + 4² + 5² = 55.

As a starting point, you can use this code:

```go
package main
import "fmt"

func SumOfSquares(c, quit chan int) {
// your code
}

func main() {
mychannel := make(chan int)
quitchannel:= make(chan int)
sum:= 0
go func() {
for i := 0; i < 6; i++ {
sum += <-mychannel
}
fmt.Println(sum)
}()
SumOfSquares(mychannel, quitchannel)
}
```

The final solution might look like this:

```go
package main
import "fmt"

func SumOfSquares(c, quit chan int) {
y := 1
for {
select {
case c <- (y*y):
y++
case <-quit:
return
}
}
}

func main() {
mychannel := make(chan int)
quitchannel:= make(chan int)
sum:= 0

go func() {
for i := 1; i <= 5; i++ {
sum += <-mychannel
}
fmt.Println(sum)
quitchannel <- 0
}()

SumOfSquares(mychannel, quitchannel)
}
```

Let's examine the `SumOfSquares` function. First on line 4 we declare variable `y`, then proceed to a `For-Select` loop. The `select` has two cases. `case c <- (y*y)` serves to send y's square through channel c, which is received in the goroutine created in the main routine. `case <-quit` serves to receive a message from the main routine that will return from the function.

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

## How to implement a rate limiter in Go?
**Rate limiter** is a mechanism for controlling access frequency to a specific resource. In Go you can use the rate package from the standard library for implementation.

One common rate limiting approach is using the token bucket algorithm, which allows adding a fixed number of tokens to a bucket at a fixed rate. When a token is taken from the bucket, the token addition rate temporarily decreases.

The rate package provides the NewLimiter() function for creating a new token bucket rate limiter. For example:

limiter := rate.NewLimiter(rate.Limit(100), 100)

Then you can use the limiter.Allow() method to check if a token is available before performing a task:

if limiter.Allow() {

// perform task

} else {

// rate limit exceeded

}

Alternatively, you can use the limiter.Wait() method to wait until a token becomes available:

limiter.Wait()

// perform task

You can also use the limiter.Reserve() method to reserve a token in advance and perform the task later.

### Go features compared to Python and Java
**Comparison with Java.** First, Go is compiled in the traditional sense, like Java. Both languages have strict static typing. Both support multithreaded operation.

Perhaps one of the main differences from Go (besides syntax) is Java's object-oriented nature and the fact that, to achieve cross-platform compatibility, it runs on the JVM (Java Virtual Machine). Meanwhile, Go programs execute in their own internal Runtime, and Go doesn't have classes with constructors. Instead of method instances, class inheritance hierarchies and dynamic methods, Go provides structs and interfaces.

Additionally, there are differences between Go and Java in concurrency implementation. In Go - goroutines (coroutines), channels, with all the "heavy" work handled by the program's scheduler. In Java - threads, tasks and more abstract concurrency APIs - executors, callables and futures.

**Comparison with Python.** Like Python, Go has relatively simple syntax, allowing quick feature implementation. Unlike Python, Go is a compiled language (technically Python is also compiled, but not in the traditional sense). Expectedly, this leads to reduced code execution time. Go also focuses heavily on concurrency - thanks to `goroutines` (its own built-in coroutines), it's easier to implement highly efficient parallel computations.

### Question 1: Goroutine Leaks

**Code Snippet:**

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan int)
	go func() {
		for i := 0; i < 10; i++ {
			ch <- i
		}
	}()

	for val := range ch {
		fmt.Println(val)
		if val == 5 {
			break
		}
	}
}
```

**Problem Statement:**

The code above is intended to print numbers 0 to 5 and then exit. However, it has a potential issue. Identify the issue and explain how to fix it.

**Solution:**

The issue is a goroutine leak. The goroutine sending data to the channel `ch` continues to run even after the main function's loop breaks at `val == 5`. Since the channel is unbuffered and the sender is blocked waiting to send, the goroutine will remain blocked indefinitely, leading to a leak.

To fix this, the sender goroutine needs to be signaled to exit when the receiver is done. This can be achieved by closing the channel.

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan int)
	go func() {
		defer close(ch) // Close the channel when the goroutine exits
		for i := 0; i < 10; i++ {
			ch <- i
		}
	}()

	for val := range ch {
		fmt.Println(val)
		if val == 5 {
			break
		}
	}
}
```

**Explanation:**

By adding `defer close(ch)` within the goroutine, we ensure that the channel is closed when the goroutine finishes its execution. Closing the channel signals to the receiver that no more data will be sent, allowing the `range` loop to terminate gracefully.

### Question 2: Data Race

**Code Snippet:**

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var counter int
	var wg sync.WaitGroup
	numGR := 1000

	wg.Add(numGR)

	for i := 0; i < numGR; i++ {
		go func() {
			defer wg.Done()
			counter++
		}()
	}

	wg.Wait()
	fmt.Printf("Counter: %d\n", counter)
}
```

**Problem Statement:**

The code above increments a shared `counter` variable from multiple goroutines. Identify the potential issue and explain how to fix it.

**Solution:**

The issue is a data race. Multiple goroutines are trying to access and modify the `counter` variable concurrently without any synchronization mechanism. This can lead to unpredictable and incorrect results.

To fix this, we need to protect the `counter` variable using a mutex.

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var counter int
	var wg sync.WaitGroup
	var mu sync.Mutex // Mutex to protect the counter
	numGR := 1000

	wg.Add(numGR)

	for i := 0; i < numGR; i++ {
		go func() {
			defer wg.Done()
			mu.Lock()         // Acquire the lock
			counter++         // Increment the counter
			mu.Unlock()       // Release the lock
		}()
	}

	wg.Wait()
	fmt.Printf("Counter: %d\n", counter)
}
```

**Explanation:**

By using a `sync.Mutex`, we ensure that only one goroutine can access and modify the `counter` variable at a time. The `mu.Lock()` method acquires the lock before incrementing the counter, and `mu.Unlock()` releases the lock after the increment. This prevents data races and ensures that the counter is incremented correctly.

### Question 3: Nil Pointer Dereference

**Code Snippet:**

```go
package main

import "fmt"

type Person struct {
	Name string
}

func (p *Person) String() string {
	return "Person: " + p.Name
}

func main() {
	var p *Person
	fmt.Println(p.String())
}
```

**Problem Statement:**

The code above attempts to call a method on a nil pointer. Identify the issue and explain how to fix it.

**Solution:**

The issue is a nil pointer dereference. The variable `p` is a pointer to a `Person` struct, but it is not initialized, so it has a nil value. Calling the `String()` method on a nil pointer will cause a panic.

To fix this, we need to check if the pointer is nil before calling the method.

```go
package main

import "fmt"

type Person struct {
	Name string
}

func (p *Person) String() string {
	if p == nil {
		return "Person: <nil>" // Handle nil pointer case
	}
	return "Person: " + p.Name
}

func main() {
	var p *Person
	fmt.Println(p.String())
}
```

**Explanation:**

By adding a nil check at the beginning of the `String()` method, we can handle the case where the pointer is nil. If the pointer is nil, we return a default string indicating that the person is nil. This prevents the panic and allows the program to continue execution.

### Question 4: Deferred Function Execution

**Code Snippet:**

```go
package main

import "fmt"

func main() {
	i := 0
	defer fmt.Println(i)
	i++
	return
}
```

**Problem Statement:**

What will be the output of the code above? Explain why.

**Solution:**

The output will be `0`.

**Explanation:**

The `defer` statement schedules a function call to be executed after the surrounding function returns. However, the arguments to the deferred function are evaluated immediately when the `defer` statement is executed. In this case, the value of `i` is `0` when the `defer fmt.Println(i)` statement is executed. Therefore, the deferred function will print the value of `i` at that time, which is `0`, even though `i` is incremented later.

### Question 5: Closure Gotcha

**Code Snippet:**

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	numGR := 5

	wg.Add(numGR)
	for i := 0; i < numGR; i++ {
		go func() {
			defer wg.Done()
			fmt.Println(i)
		}()
	}
	wg.Wait()
}
```

**Problem Statement:**

What will be the output of the code above? Is it what you expect? Explain why and how to fix it.

**Solution:**

The output will likely be 5 printed five times, but the order is not guaranteed. This is probably not what was intended.

**Explanation:**

The issue is that the loop variable `i` is captured by the closure. By the time the goroutines are executed, the loop has already completed, and the value of `i` is 5. Therefore, each goroutine will print the value of `i` at that time, which is 5.

To fix this, we need to pass the value of `i` as an argument to the goroutine.

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	numGR := 5

	wg.Add(numGR)
	for i := 0; i < numGR; i++ {
		go func(i int) { // Pass i as an argument to the goroutine
			defer wg.Done()
			fmt.Println(i)
		}(i)
	}
	wg.Wait()
}
```

**Explanation:**

By passing the value of `i` as an argument to the goroutine, we create a new variable `i` within the scope of the goroutine. This variable is initialized with the value of `i` at the time the goroutine is launched. Therefore, each goroutine will print the value of `i` that it was initialized with, which will be the correct value.

### Question 6: Select Statement

**Code Snippet:**

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch1 := make(chan string)
	ch2 := make(chan string)

	go func() {
		time.Sleep(2 * time.Second)
		ch1 <- "Message from channel 1"
	}()

	go func() {
		time.Sleep(1 * time.Second)
		ch2 <- "Message from channel 2"
	}()

	select {
	case msg1 := <-ch1:
		fmt.Println(msg1)
	case msg2 := <-ch2:
		fmt.Println(msg2)
	case <-time.After(1500 * time.Millisecond):
		fmt.Println("Timeout")
	}
}
```

**Problem Statement:**

What will be the output of the code above? Explain why.

**Solution:**

The output will be "Message from channel 2".

**Explanation:**

The `select` statement waits on multiple channel operations. In this case, it waits on `ch1`, `ch2`, and a timeout. The `ch2` channel receives a message after 1 second, while `ch1` receives a message after 2 seconds. The timeout is set to 1500 milliseconds (1.5 seconds). Since `ch2` receives a message before the timeout and before `ch1`, the `select` statement will execute the `case msg2 := <-ch2` branch, printing "Message from channel 2".

### Question 7: Recovering from Panic

**Code Snippet:**

```go
package main

import "fmt"

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered from panic:", r)
		}
	}()

	panic("Something went wrong")
}
```

**Problem Statement:**

Explain what the code above does and what it outputs.

**Solution:**

The code recovers from a panic.

**Explanation:**

The `defer` statement schedules a function call to be executed after the surrounding function returns. In this case, the deferred function calls `recover()`. The `recover()` function returns the value passed to `panic()`, or `nil` if the function is not panicking. If `recover()` returns a non-nil value, it means that the function is panicking, and the deferred function can handle the panic. In this case, the deferred function prints a message indicating that it has recovered from the panic, along with the value passed to `panic()`.

### Question 8: Interface Implementation

**Code Snippet:**

```go
package main

import "fmt"

type Stringer interface {
	String() string
}

type MyInt int

func (i MyInt) String() string {
	return fmt.Sprintf("MyInt: %d", i)
}

func main() {
	var s Stringer
	var i MyInt = 42
	s = i
	fmt.Println(s.String())
}
```

**Problem Statement:**

Explain what the code above does and what it outputs.

**Solution:**

The code demonstrates interface implementation.

**Explanation:**

The code defines an interface `Stringer` with a single method `String() string`. The code then defines a type `MyInt` as an alias for `int`. The code then defines a method `String() string` on the `MyInt` type. This method satisfies the `Stringer` interface, so `MyInt` implements the `Stringer` interface. The code then creates a variable `s` of type `Stringer` and assigns it a value of type `MyInt`. This is possible because `MyInt` implements the `Stringer` interface. The code then calls the `String()` method on the `s` variable, which prints "MyInt: 42".

### Question 9: Buffered Channels

**Code Snippet:**

```go
package main

import "fmt"

func main() {
	ch := make(chan int, 2)
	ch <- 1
	ch <- 2
	// ch <- 3 // Uncommenting this line will cause a deadlock
	fmt.Println(<-ch)
	fmt.Println(<-ch)
}
```

**Problem Statement:**

Explain what the code above does and what happens if you uncomment the line `ch <- 3`.

**Solution:**

The code demonstrates buffered channels.

**Explanation:**

The code creates a buffered channel with a capacity of 2. The code then sends two values to the channel. The code then receives two values from the channel. If you uncomment the line `ch <- 3`, the code will cause a deadlock. This is because the channel is full, and the sender is blocked waiting to send. However, there is no receiver to receive the value, so the sender will remain blocked indefinitely, leading to a deadlock.

### Question 10: Mutex and RWMutex

**Problem Statement:**

Explain the difference between `sync.Mutex` and `sync.RWMutex`. When would you use each?

**Solution:**

`sync.Mutex` provides exclusive lock access, while `sync.RWMutex` provides shared lock access for reading and exclusive lock access for writing.

**Explanation:**

`sync.Mutex` is a mutual exclusion lock. It allows only one goroutine to hold the lock at a time. This is useful when you need to protect a shared resource from concurrent access.

`sync.RWMutex` is a reader/writer mutual exclusion lock. It allows multiple goroutines to hold the lock for reading, but only one goroutine to hold the lock for writing. This is useful when you have a shared resource that is read frequently but written rarely. Using `sync.RWMutex` can improve performance in this case, as multiple readers can access the resource concurrently without blocking each other.