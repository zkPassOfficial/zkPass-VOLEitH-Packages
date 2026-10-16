// Loads the native addon for this platform, falls back to the wasm build if that fails.
const { platform, arch } = process;

const native = {
  'darwin x64': '@zkpass/vole-node-darwin-x64',
  'darwin arm64': '@zkpass/vole-node-darwin-arm64',
  'linux x64': '@zkpass/vole-node-linux-x64-gnu',
  'linux arm64': '@zkpass/vole-node-linux-arm64-gnu',
  'win32 x64': '@zkpass/vole-node-win32-x64-msvc',
}[`${platform} ${arch}`];
const fallback = '@zkpass/wasm-lib-node';

function load(name) {
  const lib = require(name);
  if (typeof lib.voleithGenProof !== 'function' || typeof lib.voleithVerifyProofOutputs !== 'function') {
    throw new Error(`${name} does not export voleithGenProof and voleithVerifyProofOutputs`);
  }
  return lib;
}

let lib;
try {
  lib = load(native ?? fallback);
} catch (nativeError) {
  if (!native) throw new Error(`Failed to load ${fallback}: ${nativeError.message}`);
  try {
    lib = load(fallback);
  } catch (fallbackError) {
    throw new Error(
      `Failed to load ${native} (${nativeError.message}) and ${fallback} (${fallbackError.message})`,
    );
  }
}

module.exports.voleithGenProof = lib.voleithGenProof;
module.exports.voleithVerifyProofOutputs = lib.voleithVerifyProofOutputs;
