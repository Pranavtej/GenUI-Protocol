# Conformance fixtures

Language-neutral test vectors for GenUI Protocol implementations (runtimes, validators, SDKs).
Each file has `{ description, cases[] }`.

- `patch.json` — apply `patches` to `input`; the result MUST equal `expected`, or, for cases with `"error": true`, the whole batch MUST be rejected (atomic, input unchanged).
- `validation.json` — validate `document`; `valid` MUST match, and when `errorContains` is set one error message MUST contain it.

The TypeScript runners live in `packages/runtime/runtime-core/test/conformance.test.ts` and `packages/runtime/validation/test/conformance.test.ts`.
