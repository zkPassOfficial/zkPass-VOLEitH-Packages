# Changelog

All packages are released together with the same version number. A new major version means the
proof format changed or the JavaScript API changed incompatibly. Within a major version all
packages verify each other's proofs.

| Version | Proof format |
|---|---|
| 3.x | 9 |
| 2.x | 3 |
| 1.x | unversioned |

## 3.0.1 (2026-10-16)

- Platform packages renamed to `@zkpass/vole-node-darwin-arm64`, `@zkpass/vole-node-darwin-x64`,
  `@zkpass/vole-node-linux-x64-gnu`, `@zkpass/vole-node-linux-arm64-gnu` and
  `@zkpass/vole-node-win32-x64-msvc`. The old names (`@zkpass/darwin-arm64`, `@zkpass/darwin-x64`,
  `@zkpass/linux-x64-gnu`, `@zkpass/linux-arm64-gnu`, `@zkpass/win32-x64-msvc`) stay on npm at 3.0.0.
  No change for `@zkpass/vole-node` users, it installs the new names.
- `@zkpass/wasm-lib-worker` now calls the wasm-bindgen start function on import, like the browser and
  Node builds do, and only exports the two API functions. Type declarations use `Uint8Array` instead
  of `any`.
- All packages now ship README, LICENSE, NOTICE and THIRD-PARTY-LICENSES. The `@zkpass/vole-node`
  README has a full example and documents the wire order of the AES gadgets.

## 3.0.0

Published 2026-10-01 for `@zkpass/wasm-lib-web` and `@zkpass/wasm-lib-worker`, 2026-10-09 for the
Node packages.

Proof format 9. `voleithVerifyProofOutputs` replaces `voleithVerifyProof` and returns the verified
output bits. The prover picks `k` (4 or 8).

## 2.0.0 (2026-09-28)

Proof format 3. `@zkpass/wasm-lib-web` and `@zkpass/wasm-lib-worker` only.

## 1.0.0 (2025-08-14, `@zkpass/wasm-lib-worker` 2025-08-19)

First release, with `voleithGenProof` and `voleithVerifyProof`.
