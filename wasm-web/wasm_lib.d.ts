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

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly voleithGenProof: (a: any) => [number, number, number];
    readonly voleithVerifyProofOutputs: (a: any, b: any) => [number, number, number];
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
