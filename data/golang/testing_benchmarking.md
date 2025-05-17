# Tricky Interview Questions for Senior Golang Developers

### Question 1: Understanding the `go build` Tool

**Problem Statement:**

What is the `go build` tool? How is it used to compile Go programs?

**Solution:**

The `go build` tool is a command-line tool that is used to compile Go programs. It takes a set of Go source files as input and produces an executable binary as output.

**Explanation:**

The `go build` tool works by first compiling the Go source files into object files. Then, it links the object files together to create an executable binary. The `go build` tool can also be used to create shared libraries and plugins.

### Question 2: Implementing a Simple Command-Line Tool

**Problem Statement:**

Implement a simple command-line tool in Go that takes a file as input and prints the number of lines, words, and characters in the file.

**Solution:**

```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage: go run main.go <filename>")
		os.Exit(1)
	}

	filename := os.Args[1]
	file, err := os.Open(filename)
	if err != nil {
		fmt.Println("Error opening file:", err)
		os.Exit(1)
	}
	defer file.Close()

	lines, words, chars := 0, 0, 0
	reader := bufio.NewReader(file)

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			fmt.Println("Error reading file:", err)
			os.Exit(1)
		}

		lines++
		words += len(strings.Fields(line))
		chars += len(line)
	}

	fmt.Printf("Lines: %d, Words: %d, Characters: %d\n", lines, words, chars)
}
```

**Explanation:**

This example demonstrates how to implement a simple command-line tool in Go. The tool takes a file as input and prints the number of lines, words, and characters in the file. The tool uses the `os.Args` variable to get the command-line arguments. The tool uses the `os.Open` function to open the file. The tool uses the `bufio.NewReader` function to create a buffered reader for the file. The tool uses the `reader.ReadString` method to read the file line by line. The tool uses the `strings.Fields` function to split the line into words. The tool uses the `len` function to get the number of lines, words, and characters.

### Question 3: Understanding the `go install` Tool

**Problem Statement:**

What is the `go install` tool? How is it used to install Go packages?

**Solution:**

The `go install` tool is a command-line tool that is used to install Go packages. It compiles the Go packages and installs them in the `GOPATH/bin` directory.

**Explanation:**

The `go install` tool works by first compiling the Go packages into object files. Then, it links the object files together to create an executable binary. The `go install` tool then installs the executable binary in the `GOPATH/bin` directory.

### Question 4: Implementing a Simple HTTP Client

**Problem Statement:**

Implement a simple HTTP client in Go that sends a GET request to a specified URL and prints the response body.

**Solution:**

```go
package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage: go run main.go <url>")
		os.Exit(1)
	}

	url := os.Args[1]
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println("Error sending request:", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Println("Error: Received status code", resp.StatusCode)
		os.Exit(1)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response body:", err)
		os.Exit(1)
	}

	fmt.Println(string(body))
}
```

**Explanation:**

This example demonstrates how to implement a simple HTTP client in Go. The client sends a GET request to a specified URL and prints the response body. The client uses the `http.Get` function to send the request. The client uses the `io.ReadAll` function to read the response body.

### Question 5: Understanding the `go mod` Tool

**Problem Statement:**

What is the `go mod` tool? How is it used to manage dependencies in Go projects?

**Solution:**

The `go mod` tool is a command-line tool that is used to manage dependencies in Go projects. It allows you to declare the dependencies of your project in a `go.mod` file and then automatically download and install those dependencies.

**Explanation:**

The `go mod` tool works by first creating a `go.mod` file in your project directory. The `go.mod` file contains the name of your module and a list of its dependencies. Then, you can run the `go mod download` command to download the dependencies. The `go mod tidy` command can be used to remove unused dependencies.

### Question 6: Implementing a Simple Concurrent Web Crawler

**Problem Statement:**

Implement a simple concurrent web crawler in Go that starts at a specified URL and recursively crawls all links on that page.

**Solution:**

```go
package main

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"

	"golang.org/x/net/html"
)

var visited = make(map[string]bool)
var mu sync.Mutex

func crawl(urlStr string, wg *sync.WaitGroup) {
	defer wg.Done()

	mu.Lock()
	if visited[urlStr] {
		mu.Unlock()
		return
	}
	visited[urlStr] = true
	mu.Unlock()

	fmt.Println("Crawling:", urlStr)

	resp, err := http.Get(urlStr)
	if err != nil {
		fmt.Println("Error fetching URL:", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Println("Error: Received status code", resp.StatusCode)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response body:", err)
		return
	}

	doc, err := html.Parse(strings.NewReader(string(body)))
	if err != nil {
		fmt.Println("Error parsing HTML:", err)
		return
	}

	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "a" {
			for _, a := range n.Attr {
				if a.Key == "href" {
					absoluteURL := toAbsoluteURL(urlStr, a.Val)
					if absoluteURL != "" {
						wg.Add(1)
						go crawl(absoluteURL, wg)
					}
					break
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)
}

func toAbsoluteURL(baseURL, relativeURL string) string {
	base, err := url.Parse(baseURL)
	if err != nil {
		return ""
	}

	relative, err := url.Parse(relativeURL)
	if err != nil {
		return ""
	}

	absolute := base.ResolveReference(relative)
	return absolute.String()
}

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage: go run main.go <url>")
		os.Exit(1)
	}

	startURL := os.Args[1]

	var wg sync.WaitGroup
	wg.Add(1)
	go crawl(startURL, &wg)

	wg.Wait()
	fmt.Println("Crawling complete.")
}
```

**Explanation:**

This example demonstrates how to implement a simple concurrent web crawler in Go. The crawler starts at a specified URL and recursively crawls all links on that page. The crawler uses the `net/http` package to send HTTP requests. The crawler uses the `golang.org/x/net/html` package to parse the HTML response. The crawler uses the `sync` package to synchronize the goroutines.

### Question 7: Understanding the `go vet` Tool

**Problem Statement:**

What is the `go vet` tool? How is it used to detect common errors in Go code?

**Solution:**

The `go vet` tool is a static analysis tool that is included with the Go distribution. It is used to detect common errors in Go code, such as:

*   Unreachable code
*   Unused variables
*   Incorrect format strings
*   Shadowing variables
*   Data races
*   Nil pointer dereferences

**Explanation:**

The `go vet` tool can help you identify and fix potential problems in your code before you run it, which can save you time and effort in the long run.

### Question 8: Implementing a Simple Linter

**Problem Statement:**

Implement a simple linter in Go that checks for common style violations in Go code.

**Solution:**

```go
package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"log"
	"os"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage: go run main.go <filename.go>")
		os.Exit(1)
	}

	filename := os.Args[1]
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, filename, nil, 0)
	if err != nil {
		log.Fatal(err)
	}

	ast.Inspect(node, func(n ast.Node) bool {
		switch x := n.(type) {
		case *ast.FuncDecl:
			if len(x.Name.Name) > 20 {
				fmt.Printf("%s: Function name '%s' is too long\n",
					fset.Position(x.Pos()), x.Name.Name)
			}
		case *ast.CommentGroup:
			for _, comment := range x.List {
				if strings.Contains(comment.Text, "TODO") {
					fmt.Printf("%s: Comment contains TODO: %s\n",
						fset.Position(comment.Pos()), comment.Text)
				}
			}
		}
		return true
	})
}
```

**Explanation:**

This example demonstrates how to implement a simple linter in Go. The linter checks for function names that are too long and comments that contain "TODO". The linter uses the `go/parser` package to parse the Go source code. The linter uses the `go/ast` package to traverse the abstract syntax tree.

### Question 9: Understanding the `go fmt` Tool

**Problem Statement:**

What is the `go fmt` tool? How is it used to format Go code?

**Solution:**

The `go fmt` tool is a command-line tool that is used to format Go code. It automatically formats your Go code according to the Go style guidelines.

**Explanation:**

The `go fmt` tool works by parsing your Go source code and then reprinting it in a canonical format. The `go fmt` tool can be used to format a single file or an entire directory of files.

### Question 10: Implementing a Simple Code Generator

**Problem Statement:**

Implement a simple code generator in Go that generates Go code from a template file.

**Solution:**

```go
package main

import (
	"fmt"
	"os"
	"strings"
	"text/template"
)

type Data struct {
	Name string
	Type string
}

func main() {
	if len(os.Args) != 3 {
		fmt.Println("Usage: go run main.go <template_file> <output_file>")
		os.Exit(1)
	}

	templateFile := os.Args[1]
	outputFile := os.Args[2]

	tmpl, err := template.ParseFiles(templateFile)
	if err != nil {
		fmt.Println("Error parsing template file:", err)
		os.Exit(1)
	}

	data := Data{Name: "MyVariable", Type: "int"}

	file, err := os.Create(outputFile)
	if err != nil {
		fmt.Println("Error creating output file:", err)
		os.Exit(1)
	}
	defer file.Close()

	err = tmpl.Execute(file, data)
	if err != nil {
		fmt.Println("Error executing template:", err)
		os.Exit(1)
	}

	fmt.Println("Code generated successfully.")
}
```

**Explanation:**

This example demonstrates how to implement a simple code generator in Go. The code generator takes a template file and an output file as arguments. The code generator parses the template file and then executes the template with the specified data. The code generator writes the output to the output file.