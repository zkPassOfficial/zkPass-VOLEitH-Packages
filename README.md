# zkPass-VOLEitH-Packages

npm packages for the zkPass VOLE-in-the-Head prover and verifier. Each package has its own
directory.

The packages contain build output only: native Node addons and WebAssembly modules compiled from
Rust, plus the JavaScript that loads them.

| Directory | Package | What it is |
|---|---|---|
| `node-addons/` | `@zkpass/vole-node` | Node. Loads the native addon for the current platform, falls back to wasm. |
| `vole-node-<platform>/` | `@zkpass/vole-node-<platform>` | The native addons, one per platform. Installed by `@zkpass/vole-node`; the platform list is in its README. |
| `wasm/` | `@zkpass/wasm-lib-node` | The wasm build for Node. Fallback for `@zkpass/vole-node`. |
| `wasm-web/` | `@zkpass/wasm-lib-web` | Browsers and Chrome extensions. |
| `wasm-worker/` | `@zkpass/wasm-lib-worker` | Cloudflare Workers. |

All packages export the same two functions, `voleithGenProof` and `voleithVerifyProofOutputs`,
and use the same byte formats.

## Which package do I need?

- Node service (prover or verifier): `@zkpass/vole-node`
- Web page or browser extension: `@zkpass/wasm-lib-web`
- Cloudflare Worker: `@zkpass/wasm-lib-worker`

The full reference (API, byte formats, limits, choosing `k`) is in
[node-addons/README.md](node-addons/README.md). The other READMEs only cover what is different in
that runtime.

## Versioning

All packages are released together with the same version number.

- Major: the proof format changed, or the JavaScript API changed in an incompatible way (a function
  renamed or removed, a signature changed, an init step added).
- Minor: additions, nothing breaks.
- Patch: backward-compatible fixes.

Within one major version every package verifies every other package's proofs. 3.x uses proof
format 9. See [CHANGELOG.md](CHANGELOG.md) for the format of each major version.

## Publishing

```sh
node publish.js --dry-run   # pack all nine packages and list their contents
node publish.js             # publish them, dependencies first
```

The version comes from the package.json files. All nine must match or nothing is published. The
script packs everything first and compares it with what is already on npm. A package already
published with an identical tarball is skipped, so an interrupted run can be repeated. If the
published tarball differs, the script stops; bump the version and run it again.

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities and for known limitations (among
others, the prover is not constant-time).

## License

Apache-2.0, © 2026 zkPass. See [LICENSE](LICENSE). Every package contains its own copy of LICENSE,
[NOTICE](NOTICE) (third-party software compiled into the binaries) and
[THIRD-PARTY-LICENSES](THIRD-PARTY-LICENSES) (their license texts and copyright notices).
