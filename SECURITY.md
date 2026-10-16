# Security

## Reporting a vulnerability

Please report security issues by email to info@zkpass.org, not in a public issue.

Include the package name and version, a description of the problem, and if possible a way to
reproduce it. For a soundness bug (a proof that verifies but should not) that would be the
`WaterfallSpec` and the proof. For a zero-knowledge bug, describe what the proof or the prover's
behavior reveals about the witness.

## Versions

Packages with the same proof format verify each other's proofs. Packages with different formats do
not, so prover and verifier have to be upgraded together when the format changes. CHANGELOG.md
lists the proof format of each major version. Note that a major version bump can also come from an
API change alone, with the proof format unchanged.

## Scope

In scope: the native addons, the WebAssembly modules and the JavaScript loaders in this repository,
as published on npm under `@zkpass/`.

## Known limitations

- The prover is not constant-time. It has secret-dependent table lookups, and neither WebAssembly
  nor JavaScript runtimes make timing guarantees. Do not run the prover where an attacker can
  measure its timing precisely.
- `voleithVerifyProofOutputs` returns the output bits the proof commits to. The caller has to
  compare them with the expected values; a proof of the statement with other outputs is still a
  valid proof.
- Inputs over 16 MiB, and statements with more than 1024 nodes or more than 2^18 committed bits,
  are rejected with an exception.
