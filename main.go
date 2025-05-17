package main

import (
	"bytes"
	"fmt"
	"syscall/js"

	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
)

type outputCapturer struct {
	buf *bytes.Buffer
}

func (o *outputCapturer) Write(p []byte) (n int, err error) {
	return o.buf.Write(p)
}

func executeGoCodeWrapper(this js.Value, args []js.Value) interface{} {
	handler := js.FuncOf(func(this js.Value, pArgs []js.Value) interface{} {
		resolve := pArgs[0]
		reject := pArgs[1]

		go func() {
			if len(args) == 0 || args[0].Type() != js.TypeString {
				errorResult := js.Global().Get("Object").New()
				errorResult.Set("error", "Invalid or missing code argument")
				reject.Invoke(errorResult)
				return
			}

			code := args[0].String()
			var outputBuf, errorBuf bytes.Buffer
			output := &outputCapturer{buf: &outputBuf}
			errorOut := &outputCapturer{buf: &errorBuf}

			// Create interpreter with stdlib support
			i := interp.New(interp.Options{
				Stdout: output,
				Stderr: errorOut,
			})
			i.Use(stdlib.Symbols)

			// Execute the code
			_, err := i.Eval(code)
			if err != nil {
				errorBuf.WriteString(err.Error())
			}

			// Prepare result for JS
			result := js.Global().Get("Object").New()
			result.Set("output", outputBuf.String())
			result.Set("error", errorBuf.String())
			resolve.Invoke(result)
		}()

		return nil
	})

	return js.Global().Get("Promise").New(handler)
}

func main() {
	fmt.Println("Go WebAssembly runner initialized")
	js.Global().Set("executeGoCode", js.FuncOf(executeGoCodeWrapper))
	select {}
}
