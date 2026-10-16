/**
 * Prove a waterfall circuit.
 *
 * `input` is a Borsh-encoded `WaterfallInput`. Returns the proof bytes. Throws on malformed
 * input.
 */
export function voleithGenProof(input: Uint8Array): Uint8Array;

/**
 * Verify a proof and return the output bits it commits to, as a Borsh-encoded `Vec<NodeOutput>`
 * sorted by node id.
 *
 * `waterfall` is a Borsh-encoded `WaterfallSpec`, `proof` the output of `voleithGenProof`. Throws
 * on malformed input, and with `proof rejected` when the proof does not verify. Compare the
 * returned bits with the expected values.
 */
export function voleithVerifyProofOutputs(waterfall: Uint8Array, proof: Uint8Array): Uint8Array;
