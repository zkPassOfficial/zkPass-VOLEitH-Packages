# @zkpass/vole-node

zkPass VOLE-in-the-Head prover and verifier for Node.

It proves that a boolean circuit, or a DAG of circuits, evaluates to some output bits on a private
witness, and verifies such proofs. The same two functions are available for browsers
(`@zkpass/wasm-lib-web`) and Cloudflare Workers (`@zkpass/wasm-lib-worker`), with the same byte
formats.

The protocol is from Baum, Braun, Delpech de Saint Guilhem, Klooß, Orsini, Roy and Scholl,
*Publicly Verifiable Zero-Knowledge and Post-Quantum Signatures From VOLE-in-the-Head* (CRYPTO 2023,
[ePrint 2023/996](https://eprint.iacr.org/2023/996)), and the [FAEST](https://faest.info)
specification. Proofs are non-interactive and use only symmetric primitives (AES, Blake2b, ChaCha).

## Install

```sh
npm install @zkpass/vole-node
```

Requires Node 18 or later. The package loads a native addon for the current platform and falls
back to WebAssembly where there is none. No other package has to be installed.

| Platform | Package installed |
|---|---|
| macOS arm64 | `@zkpass/vole-node-darwin-arm64` |
| macOS x64 | `@zkpass/vole-node-darwin-x64` |
| Linux x64 (glibc 2.17+) | `@zkpass/vole-node-linux-x64-gnu` |
| Linux arm64 (glibc 2.17+) | `@zkpass/vole-node-linux-arm64-gnu` |
| Windows x64 | `@zkpass/vole-node-win32-x64-msvc` |
| anything else | `@zkpass/wasm-lib-node` |

npm only installs the package matching the current platform (via `os` and `cpu` in package.json).
If the native addon fails to load, the wasm build is used. If both fail, `require` throws with both
error messages.

The platform packages and the wasm fallback are `optionalDependencies`. Do not install with
`--omit=optional` (or the older `--no-optional`); the package would have nothing to load.

## Usage

```js
const { voleithGenProof, voleithVerifyProofOutputs } = require("@zkpass/vole-node");

// prover: input is a Borsh-encoded WaterfallInput, see "Byte formats"
const proof = voleithGenProof(input);

// verifier: returns the output bits, throws if verification fails
const outputs = voleithVerifyProofOutputs(waterfall, proof);
```

Both functions take and return `Uint8Array` (a Node `Buffer` is one). The native addons return a
`Buffer`, the wasm fallback a plain `Uint8Array`; treat the result as a `Uint8Array` or wrap it with
`Buffer.from`. Both calls are synchronous. Use a worker thread if the event loop must not block.

## API

### `voleithGenProof(input: Uint8Array): Uint8Array`

`input` is a Borsh-encoded `WaterfallInput`. Returns the proof bytes. Throws if the input is
malformed, if `k` is not 4 or 8, or if a dependency reads past the end of the witness.

The prover evaluates the circuits on the given witness and proves the result, whatever it is. A
witness on which an assertion node computes `false` yields a valid proof with output bit `false`.
The caller of `voleithVerifyProofOutputs` compares the returned bits with the expected values.

### `voleithVerifyProofOutputs(waterfall: Uint8Array, proof: Uint8Array): Uint8Array`

`waterfall` is a Borsh-encoded `WaterfallSpec`, `proof` the output of `voleithGenProof`. Returns a
Borsh-encoded `Vec<NodeOutput>` with the output bits of every node marked `out`, sorted by node id.

Throws:

- the decoding error, if `waterfall` or `proof` is malformed or describes an invalid statement
- `proof rejected`, if both decode fine but the proof does not verify

A returned value means the proof was made with a witness on which `waterfall` produces exactly
these bits. The caller compares them with the expected values (an assertion node's result bit, a
public field).

Inputs larger than 16 MiB are rejected. Malformed input throws an exception.

## Byte formats

Everything is [Borsh](https://borsh.io): little-endian integers, `bool` as one byte (0 or 1),
`Vec<T>` as a `u32` element count followed by the elements, `String` as a `u32` byte count followed
by the UTF-8 bytes, structs as their fields in order without padding. The field names below are just for reading, Borsh encodes by
position.

### The statement: `WaterfallSpec`

A statement is a DAG of nodes. Each node runs a gadget, either a boolean circuit given as Bristol
text or one of the two built-in AES gadgets. Its input wires are fed from the witness or from the
output wires of other nodes.

```rust
struct WaterfallSpec {
    circuits: Vec<BaseCircuitSpec>, // the circuits nodes may name
    nodes: Vec<NodeSpec>,           // ids 0, 1, 2, ... in this order
}

struct BaseCircuitSpec {
    name: String,    // the name nodes refer to it by; unique, and not "AES" or "AES256"
    bristol: String, // the circuit in the Bristol text format
}

struct NodeSpec {
    id: u64,                   // must equal the node's position: 0, 1, 2, ...
    name: String,              // a listed circuit's name, or "AES" / "AES256"
    out: bool,                 // true: the node's output bits are public and the verifier returns them
    deps: Vec<DependencySpec>, // where every input wire comes from
}

struct DependencySpec {
    source: i64,       // the id of an earlier node, or -1 for the witness
    input_start: u64,  // first input wire of this node that the range lands on
    source_start: u64, // first output wire of the source node (or first witness bit) that it reads
    size: u64,         // number of wires
}
```

A dependency feeds this node's input wires `input_start .. input_start + size` from the source's
output wires (or from witness bits) `source_start .. source_start + size`. The following is checked
before anything is proven or verified:

- Node ids are `0, 1, 2, ...` in listing order. A dependency can only reference a node with a
  smaller id. Nodes run in listing order.
- A node's dependencies must cover each of its input wires exactly once. A range may not go past
  the node's inputs or the source's outputs.
- A circuit name may be listed only once and may not be a reserved name.
- Limits: at most 1024 nodes; at most 2^24 gates and 2^25 wires per circuit; at most 2^18
  committed bits over all nodes (a circuit's input wires and AND gate outputs, an AES node's inputs
  and internal state).

**Boolean circuits** are Bristol text: three header lines (`gates wires`, then `n_inputs w_1 ... w_n`
with the width of each input group, then `n_outputs w_1 ... w_m` with the width of each output
group), followed by one gate per line as `n_in n_out in... out TYPE`, where `TYPE` is `XOR`, `AND`
or `INV`. As usual for the format, the input wires are the first `w_1 + ... + w_n` wire indices and
the output wires the last `w_1 + ... + w_m`, in group order. A node's input wires are its input
groups concatenated, its output wires its output groups concatenated.

**AES gadgets** need no circuit text. A node named `AES` is one AES-128 block encryption, `AES256`
one AES-256 block encryption. These are proven with the FAEST constraints instead of gate by gate.

| Name | Input wires | Output wires |
|---|---|---|
| `AES` | 256: key (128 bits) then block (128 bits) | 128: the ciphertext, one group |
| `AES256` | 384: key (256 bits) then block (128 bits) | 128: the ciphertext, one group |

Key, block and ciphertext are each treated as one big-endian integer, as written in FIPS 197 (the
first byte of the key is the most significant). Wire `i` carries bit `i` of that integer. So wire 0
is the lowest bit of the *last* byte, wire 7 the highest bit of the last byte, wire 8 the lowest bit
of the second-to-last byte, and so on. This matches the wire order of the commonly used Bristol AES
circuits. In code:

```js
function toWires(bytes) {
  const wires = [];
  for (let i = bytes.length - 1; i >= 0; i--) {
    for (let bit = 0; bit < 8; bit++) {
      wires.push(((bytes[i] >> bit) & 1) === 1);
    }
  }
  return wires;
}

function fromWires(wires) {
  const bytes = new Uint8Array(wires.length / 8);
  for (let i = 0; i < wires.length; i++) {
    if (wires[i]) bytes[bytes.length - 1 - (i >> 3)] |= 1 << (i & 7);
  }
  return bytes;
}
```

For boolean circuits the wires mean whatever the circuit's author decided. The Bristol format only
fixes their positions.

### The prover's input: `WaterfallInput`

```rust
struct WaterfallInput {
    k: u8,                    // 4 or 8, see "Choosing k"
    inputs: Vec<bool>,        // the witness: one flat bit vector, read by dependencies with source -1
    waterfall: WaterfallSpec, // the statement
}
```

The witness never leaves the prover. The proof only reveals the output bits of nodes marked `out`.

### The verifier's output: `Vec<NodeOutput>`

```rust
struct NodeOutput {
    id: u64,                // the node id
    groups: Vec<Vec<bool>>, // its output bits, one vector per output group, in group order
}
```

One entry per node with `out: true`, sorted by id.

### The proof

Treat the proof bytes as opaque. The first byte is the proof format version, the rest is the proof.
The proof carries its own `k`, the verifier never chooses one. A proof is bound to the statement it
was made for and only verifies against the identical `WaterfallSpec` (identical up to circuit names
and repeated circuits, which do not change the statement).

### Example

One `AES` node over a 256-bit witness (the key, then the block), with the ciphertext public. The
witness is the test vector from FIPS 197 Appendix C.1, so the output can be checked against the
known ciphertext. The input is Borsh-encoded by hand below.

```js
const { voleithGenProof, voleithVerifyProofOutputs } = require("@zkpass/vole-node");

// Borsh encoding: little-endian integers, u32-prefixed vectors and strings, structs field by field.
function concat(...parts) {
  let length = 0;
  for (const part of parts) length += part.length;
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function littleEndian(size, write) {
  const bytes = new Uint8Array(size);
  write(new DataView(bytes.buffer));
  return bytes;
}

const u8 = (n) => Uint8Array.of(n);
const u32 = (n) => littleEndian(4, (view) => view.setUint32(0, n, true));
const u64 = (n) => littleEndian(8, (view) => view.setBigUint64(0, BigInt(n), true));
const i64 = (n) => littleEndian(8, (view) => view.setBigInt64(0, BigInt(n), true));
const bool = (b) => Uint8Array.of(b ? 1 : 0);

function encodeString(s) {
  const utf8 = new TextEncoder().encode(s);
  return concat(u32(utf8.length), utf8);
}

function encodeVec(items, encodeItem) {
  return concat(u32(items.length), ...items.map(encodeItem));
}

function encodeDependency(d) {
  return concat(i64(d.source), u64(d.inputStart), u64(d.sourceStart), u64(d.size));
}

function encodeNode(n) {
  return concat(u64(n.id), encodeString(n.name), bool(n.out), encodeVec(n.deps, encodeDependency));
}

function encodeCircuit(c) {
  return concat(encodeString(c.name), encodeString(c.bristol));
}

function encodeWaterfallSpec(w) {
  return concat(encodeVec(w.circuits, encodeCircuit), encodeVec(w.nodes, encodeNode));
}

function encodeWaterfallInput(k, witness, w) {
  return concat(u8(k), encodeVec(witness, bool), encodeWaterfallSpec(w));
}

// Decode the verifier's output, a Vec<NodeOutput>.
function decodeOutputs(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  function readU32() {
    const n = view.getUint32(offset, true);
    offset += 4;
    return n;
  }
  const outputs = [];
  const nodeCount = readU32();
  for (let i = 0; i < nodeCount; i++) {
    const id = view.getBigUint64(offset, true);
    offset += 8;
    const groups = [];
    const groupCount = readU32();
    for (let g = 0; g < groupCount; g++) {
      const length = readU32();
      const bits = [];
      for (let b = 0; b < length; b++) bits.push(bytes[offset + b] === 1);
      groups.push(bits);
      offset += length;
    }
    outputs.push({ id, groups });
  }
  return outputs;
}

// AES wire order, see "AES gadgets".
function toWires(bytes) {
  const wires = [];
  for (let i = bytes.length - 1; i >= 0; i--) {
    for (let bit = 0; bit < 8; bit++) {
      wires.push(((bytes[i] >> bit) & 1) === 1);
    }
  }
  return wires;
}

function fromWires(wires) {
  const bytes = new Uint8Array(wires.length / 8);
  for (let i = 0; i < wires.length; i++) {
    if (wires[i]) bytes[bytes.length - 1 - (i >> 3)] |= 1 << (i & 7);
  }
  return bytes;
}

// The statement: node 0 encrypts witness bits 128..256 under the key in witness bits 0..128.
const waterfall = {
  circuits: [],
  nodes: [{ id: 0, name: "AES", out: true, deps: [{ source: -1, inputStart: 0, sourceStart: 0, size: 256 }] }],
};

// Prover side.
const key = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
const block = Buffer.from("00112233445566778899aabbccddeeff", "hex");
const witness = [...toWires(key), ...toWires(block)];
const proof = voleithGenProof(encodeWaterfallInput(4, witness, waterfall));

// Verifier side.
const outputs = decodeOutputs(voleithVerifyProofOutputs(encodeWaterfallSpec(waterfall), proof));
const ciphertext = Buffer.from(fromWires(outputs[0].groups[0])).toString("hex");
console.log(`proof ${proof.length} bytes, node ${outputs[0].id} output ${ciphertext}`);
if (ciphertext !== "69c4e0d86a7b0430d8cdb78070b4c55a") throw new Error("unexpected output");
```

With a circuit of your own, list it under `circuits` and refer to it by name. Here one node runs a
64-bit adder on 128 witness bits, and a second node encrypts the sum (zero-padded to a block) under
a key taken from the witness:

```js
const waterfall = {
  circuits: [{ name: "adder64", bristol: adder64BristolText }],
  nodes: [
    { id: 0, name: "adder64", out: true, deps: [{ source: -1, inputStart: 0, sourceStart: 0, size: 128 }] },
    { id: 1, name: "AES", out: true, deps: [
      { source: -1, inputStart: 0, sourceStart: 128, size: 128 }, // key: witness bits 128..256
      { source: 0, inputStart: 128, sourceStart: 0, size: 64 },   // low 64 bits of the block: node 0's output
      { source: -1, inputStart: 192, sourceStart: 256, size: 64 }, // high 64 bits of the block: 64 zero witness bits
    ] },
  ],
};
// witness: 320 bits, the two summands at 0..128, the key at 128..256, zeros at 256..320
```

## Choosing k

The prover picks `k`. Both values give the same security. `k = 8` roughly halves the proof size but
takes longer to prove and verify.

| k | proof size, zkFetch statement (40 nodes, 7 of them AES) |
|---|---|
| 4 | 66 084 bytes |
| 8 | 34 276 bytes |

## Versioning

This package, its platform packages, `@zkpass/wasm-lib-web` and `@zkpass/wasm-lib-worker` are
released together under one version number.

- Major: the proof format changed (a proof in one format does not verify in another), or the
  JavaScript API changed incompatibly (function renamed or removed, signature changed, init step
  added).
- Minor: additions, nothing breaks.
- Patch: backward-compatible fixes.

Within a major version all packages verify each other's proofs: a proof from
`@zkpass/wasm-lib-web@3.x` verifies with `@zkpass/vole-node@3.x`. 3.x produces and accepts proof
format 9. CHANGELOG.md in the repository lists the proof format of each major version.

## Security

The implementation follows the published protocol. The AES witness extension is tested against the
FAEST reference vectors, the rest against the protocol's own consistency tests. The prover is not
constant-time, and WebAssembly runtimes make no constant-time guarantees either. See SECURITY.md in
the repository for how to report vulnerabilities.

## License

Apache-2.0, © 2026 zkPass. See LICENSE and NOTICE in the package.
