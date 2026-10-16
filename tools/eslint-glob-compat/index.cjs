"use strict";

const { expand } = require("brace-expansion");
const picomatch = require("picomatch");
const { randomUUID } = require("node:crypto");

// Brace syntax inside quotes or character classes is literal in micromatch.
// Protect those spans in a linear pass before Bash-style expansion; never build
// or recursively walk an AST from a caller's pattern.
function protectLiterals(pattern) {
  let prefix;
  do { prefix = `__INCIDENTLENS_${randomUUID().replace(/-/g, "")}_`; }
  while (pattern.includes(prefix));
  const literals = [];
  let result = "";
  let braceDepth = 0;
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === "\\") {
      result += char + (pattern[++i] || "");
      continue;
    }
    if (!['"', "'", "`", "["].includes(char)) {
      if (char === "{" && ++braceDepth > 128) {
        throw new RangeError("Glob brace nesting exceeds the safe 128-level limit");
      }
      if (char === "}") braceDepth = Math.max(0, braceDepth - 1);
      result += char;
      continue;
    }
    const bracket = char === "[";
    let depth = 1;
    let value = bracket ? "[" : "";
    while (++i < pattern.length) {
      const next = pattern[i];
      if (next === "\\") { value += next + (pattern[++i] || ""); continue; }
      if (bracket && next === "[") depth++;
      if (bracket && next === "]") {
        depth--;
        if (depth === 0) { value += next; break; }
      } else if (!bracket && next === char) break;
      value += next;
    }
    const token = `${prefix}${literals.length}__`;
    literals.push(value);
    result += token;
  }
  const tokens = new RegExp(`${prefix}(\\d+)__`, "g");
  return { pattern: result, restore: (entry) => entry.replace(tokens, (_, index) => literals[Number(index)]) };
}

// fast-glob 3.3.1 calls only these three micromatch methods. Preserve its exact
// Picomatch 2.3.2 matching/scanning engine, replacing the vulnerable AST expander
// with patched brace-expansion (including padded and stepped ranges).
function braces(pattern, options = {}) {
  if (options.expand !== true || options.nodupes !== true ||
      Object.keys(options).some((key) => key !== "expand" && key !== "nodupes")) {
    throw new TypeError("Unsupported fast-glob brace contract; review the dependency override");
  }
  if (typeof pattern !== "string") throw new TypeError("Expected a glob string");
  if (pattern.length > 65536) throw new SyntaxError("Glob pattern exceeds the original 64 KiB limit");
  if (!pattern.includes("{") || !pattern.includes("}")) return [pattern];
  const protectedPattern = protectLiterals(pattern);
  return [...new Set(expand(protectedPattern.pattern).map(protectedPattern.restore))];
}

module.exports = { braces, makeRe: picomatch.makeRe, scan: picomatch.scan };
