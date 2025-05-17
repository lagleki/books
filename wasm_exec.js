// Copyright 2018 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

(() => {
    // Map web browser API and Node.js API to a single common API (preferring web standards over Node.js API).
    const isNodeJS = typeof process !== "undefined" && process.versions && process.versions.node;
    if (isNodeJS) {
        globalThis.require = require;
        globalThis.fs = require("fs");
        globalThis.__dirname = __dirname;
        globalThis.__filename = __filename;
    }

    if (!globalThis.performance) {
        globalThis.performance = {};
    }
    if (!globalThis.performance.now) {
        const start = Date.now();
        globalThis.performance.now = () => Date.now() - start;
    }

    const enosys = () => {
        const err = new Error("not implemented");
        err.code = "ENOSYS";
        return err;
    };

    if (!globalThis.fs) {
        let outputBuf = "";
        globalThis.fs = {
            constants: { O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1 }, // unused
            writeSync(fd, buf) {
                outputBuf += decoder.decode(buf);
                const nl = outputBuf.lastIndexOf("\n");
                if (nl != -1) {
                    console.log(outputBuf.substring(0, nl));
                    outputBuf = outputBuf.substring(nl + 1);
                }
                return buf.length;
            },
            write(fd, buf, offset, length, position, callback) {
                if (offset !== 0 || length !== buf.length || position !== null) {
                    callback(enosys());
                    return;
                }
                const n = this.writeSync(fd, buf);
                callback(null, n);
            },
            open(path, flags, mode, callback) { callback(enosys()); },
            read(fd, buffer, offset, length, position, callback) { callback(enosys()); },
            fsync(fd, callback) { callback(null); },
        };
    }

    const encoder = new TextEncoder("utf-8");
    const decoder = new TextDecoder("utf-8");

    globalThis.Go = class {
        constructor() {
            this.argv = ["js"];
            this.env = {};
            this.exit = (code) => {
                if (code !== 0) {
                    console.warn("exit code:", code);
                }
            };
            this._callbackTimeouts = new Map();
            this._nextCallbackTimeoutID = 1;

            const mem = () => {
                // The buffer may change when the heap grows.
                return new DataView(this._inst.exports.mem.buffer);
            };

            const setInt64 = (addr, v) => {
                mem().setUint32(addr + 0, v, true);
                mem().setUint32(addr + 4, Math.floor(v / 4294967296), true);
            };

            const getInt64 = (addr) => {
                const low = mem().getUint32(addr + 0, true);
                const high = mem().getUint32(addr + 4, true);
                return low + high * 4294967296;
            };

            const loadValue = (addr) => {
                const f = mem().getFloat64(addr, true);
                if (f === 0) {
                    return undefined;
                }
                if (!isNaN(f)) {
                    return f;
                }

                const id = mem().getUint32(addr, true);
                return this._values[id];
            };

            const storeValue = (addr, v) => {
                const nanHead = 0x7FF80000;

                if (typeof v === "number") {
                    if (isNaN(v)) {
                        mem().setUint32(addr + 4, nanHead, true);
                        mem().setUint32(addr, 0, true);
                        return;
                    }
                    if (v === 0) {
                        mem().setUint32(addr + 4, nanHead, true);
                        mem().setUint32(addr, 1, true);
                        return;
                    }
                    mem().setFloat64(addr, v, true);
                    return;
                }

                switch (v) {
                    case undefined:
                        mem().setFloat64(addr, 0, true);
                        return;
                    case null:
                        mem().setUint32(addr + 4, nanHead, true);
                        mem().setUint32(addr, 2, true);
                        return;
                    case true:
                        mem().setUint32(addr + 4, nanHead, true);
                        mem().setUint32(addr, 3, true);
                        return;
                    case false:
                        mem().setUint32(addr + 4, nanHead, true);
                        mem().setUint32(addr, 4, true);
                        return;
                }

                let id = this._ids.get(v);
                if (id === undefined) {
                    id = this._idPool.pop();
                    if (id === undefined) {
                        id = this._values.length;
                    }
                    this._values[id] = v;
                    this._ids.set(v, id);
                }
                mem().setUint32(addr + 4, nanHead, true);
                mem().setUint32(addr, id, true);
            };

            this._inst = null;
            this._values = [];
            this._ids = new Map();
            this._idPool = [];
            this._callbackShutdown = false;
            this.exited = false;

            const go = new globalThis.WebAssembly.Instance(new WebAssembly.Module(wasmModule), {
                go: {
                    // Go's JS -> Wasm wrapper (executed before main)
                    "runtime.wasmExit": (sp) => {
                        const code = mem().getInt32(sp + 8, true);
                        this.exited = true;
                        this.exit(code);
                    },
                    "runtime.wasmWrite": (sp) => {
                        const fd = mem().getInt32(sp + 8, true);
                        const p = mem().getInt32(sp + 16, true);
                        const n = mem().getInt32(sp + 24, true);
                        fs.writeSync(fd, new Uint8Array(mem().buffer, p, n));
                    },
                    "runtime.resetMemoryDataView": (sp) => {
                        mem();
                    },
                    "runtime.nanotime1": (sp) => {
                        setInt64(sp + 8, (performance.now() * 1000000) | 0);
                    },
                    "runtime.walltime1": (sp) => {
                        setInt64(sp + 8, Date.now() * 1000000);
                    },
                    "runtime.scheduleCallback": (sp) => {
                        const id = this._nextCallbackTimeoutID;
                        this._nextCallbackTimeoutID++;
                        this._callbackTimeouts.set(id, setTimeout(() => {
                            this._callbackTimeouts.delete(id);
                            const cb = loadValue(sp + 8);
                            cb();
                        }, getInt64(sp + 16) / 1000000));
                        storeValue(sp + 32, id);
                    },
                    "runtime.clearScheduledCallback": (sp) => {
                        const id = getInt64(sp + 8);
                        clearTimeout(this._callbackTimeouts.get(id));
                        this._callbackTimeouts.delete(id);
                    },
                    "runtime.getRandomData": (sp) => {
                        crypto.getRandomValues(new Uint8Array(mem().buffer, getInt64(sp + 8), getInt64(sp + 16)));
                    },
                }
            }).exports;
            this._inst = go;
        }

        run(instance) {
            this._inst = instance;
            this._inst.exports.run();
            if (this.exited) {
                throw new Error("Go program has already exited");
            }
        }

        _resume() {
            if (this.exited) {
                throw new Error("Go program has already exited");
            }
            this._inst.exports.resume();
            if (this.exited) {
                this._promiseShutdown();
            }
        }

        _makeFuncWrapper(id) {
            const go = this;
            return function () {
                const event = { id: id, this: this, args: arguments };
                go._pendingEvent = event;
                go._resume();
                return event.result;
            };
        }
    };
})();