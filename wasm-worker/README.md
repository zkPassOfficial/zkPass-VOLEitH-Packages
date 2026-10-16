# @zkpass/wasm-lib-worker

zkPass VOLE-in-the-Head prover and verifier as WebAssembly, for Cloudflare Workers. The API
(`voleithGenProof`, `voleithVerifyProofOutputs`) and the byte formats are documented in the
[`@zkpass/vole-node` README](https://www.npmjs.com/package/@zkpass/vole-node).

## Install

```sh
npm install @zkpass/wasm-lib-worker
```

## Usage

```js
import { voleithGenProof, voleithVerifyProofOutputs } from "@zkpass/wasm-lib-worker";

const outputs = voleithVerifyProofOutputs(waterfall, proof); // throws if verification fails
```

There is no init step. Wrangler imports the `.wasm` as a compiled `WebAssembly.Module`, and the
package's `index.js` instantiates it at import time. Wrangler bundles the `.wasm` with the Worker.

Workers plans limit the CPU time per request. Measure how long the calls take in your Worker and
check that against your plan's limit.

## Versioning

Released together with `@zkpass/vole-node` under one version number. A proof from
`@zkpass/wasm-lib-web@3.x` verifies with `@zkpass/wasm-lib-worker@3.x` and `@zkpass/vole-node@3.x`.
The `@zkpass/vole-node` README has the full versioning rule.

## License

Apache-2.0, © 2026 zkPass. See LICENSE and NOTICE in the package.
