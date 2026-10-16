/* tslint:disable */
/* eslint-disable */

/**
 * Prove a waterfall circuit.
 *
 * `input` is Borsh(`WasmWaterfallInput`): `k` (4 or 8), the witness bits and the `WaterfallSpec`.
 * Returns the proof bytes. Errors on malformed input.
 */
export function voleithGenProof(input: Uint8Array): Uint8Array;

/**
 * Verify a proof and return the output bits it commits to, as Borsh(`Vec<NodeOutput>`) sorted by
 * node id. `waterfall` is Borsh(`WaterfallSpec`), `proof` the output of `voleithGenProof`.
 *
 * Errors on malformed input, and with `proof rejected` when the proof does not verify. The caller
 * must compare the returned bits with the expected values.
 */
export function voleithVerifyProofOutputs(waterfall: Uint8Array, proof: Uint8Array): Uint8Array;
