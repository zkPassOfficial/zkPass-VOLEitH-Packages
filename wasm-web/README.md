# @zkpass/wasm-lib-web

zkPass VOLE-in-the-Head prover and verifier as WebAssembly, for browsers and Chrome extensions.
The API (`voleithGenProof`, `voleithVerifyProofOutputs`) and the byte formats are documented in
the [`@zkpass/vole-node` README](https://www.npmjs.com/package/@zkpass/vole-node).

## Install

```sh
npm install @zkpass/wasm-lib-web
```

The package is an ES module plus `wasm_lib_bg.wasm`, which `init` loads.

## Usage

```js
import init, { voleithGenProof, voleithVerifyProofOutputs } from "@zkpass/wasm-lib-web";

// once, before the first call
await init({ module_or_path: wasmUrl });

const proof = voleithGenProof(input);
const outputs = voleithVerifyProofOutputs(waterfall, proof); // throws if verification fails
```

`wasmUrl` is the URL your bundler or extension serves `wasm_lib_bg.wasm` from. With Vite:

```js
const wasmUrl = new URL("@zkpass/wasm-lib-web/wasm_lib_bg.wasm", import.meta.url);
```

In a Chrome extension, add the `.wasm` file to `web_accessible_resources` and allow
`'wasm-unsafe-eval'` in the extension's CSP.

Both calls are synchronous. Run them in a Web Worker if the page has to stay responsive.

## Versioning

Released together with `@zkpass/vole-node` under one version number. A proof from
`@zkpass/wasm-lib-web@3.x` verifies with `@zkpass/vole-node@3.x` and `@zkpass/wasm-lib-worker@3.x`.
The `@zkpass/vole-node` README has the full versioning rule.

## License

Apache-2.0, © 2026 zkPass. See LICENSE and NOTICE in the package.
