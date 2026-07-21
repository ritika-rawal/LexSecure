export const ACCOUNT_IMPORT_VERSION = 1;

export const ACCOUNT_IMPORT_LIMITS = Object.freeze({
  MAXIMUM_PAYLOAD_BYTES: 64 * 1024,
  MAXIMUM_OBJECT_DEPTH: 6,
  MAXIMUM_OBJECT_NODES: 250,
});

export const DANGEROUS_IMPORT_KEYS = Object.freeze([
  '__proto__',
  'prototype',
  'constructor',
]);
