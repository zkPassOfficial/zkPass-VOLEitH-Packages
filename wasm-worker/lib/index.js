import * as imports from "./wasm_lib_bg.js";
// wrangler imports the .wasm as a compiled WebAssembly.Module
import module from "./wasm_lib_bg.wasm";

const instance = new WebAssembly.Instance(module, { "./wasm_lib_bg.js": imports });
imports.__wbg_set_wasm(instance.exports);
// initializes the externref table, as the generated wasm_lib.js would
instance.exports.__wbindgen_start();

export { voleithGenProof, voleithVerifyProofOutputs } from "./wasm_lib_bg.js";
