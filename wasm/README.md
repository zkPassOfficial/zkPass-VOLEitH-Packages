# @zkpass/wasm-lib-node

WebAssembly build of the zkPass VOLE-in-the-Head prover and verifier for Node (CommonJS).

`@zkpass/vole-node` uses this package as its fallback on platforms without a native addon, and is
the package to install. Its README documents the API (`voleithGenProof`,
`voleithVerifyProofOutputs`) and the byte formats.

Used directly, the package needs no init step:

```js
const { voleithGenProof, voleithVerifyProofOutputs } = require("@zkpass/wasm-lib-node");
```

It runs on every platform Node supports and is slower than the native addons.

## License

Apache-2.0, © 2026 zkPass. See LICENSE and NOTICE in the package.
