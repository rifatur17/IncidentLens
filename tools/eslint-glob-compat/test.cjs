"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");
const { test } = require("node:test");
const adapter = require("./index.cjs");
const fixtures = require("./reference-fixtures.json");
const frontendRequire = createRequire(path.resolve(__dirname, "../../frontend/package.json"));
const configRequire = createRequire(frontendRequire.resolve("eslint-config-next"));
const pluginEntry = configRequire.resolve("@next/eslint-plugin-next");
const pluginRequire = createRequire(pluginEntry);
const { globSync } = pluginRequire("fast-glob");
const { getRootDirs } = require(path.join(path.dirname(pluginEntry), "utils/get-root-dirs.js"));

function withFixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "incidentlens-glob-compat-"));
  const previous = process.cwd();
  try {
    for (const directory of ["site-a/pages", "site-b/pages", "01", "02", "03", "04", "05",
      "1", "2", "3", "4", "5", ".hidden", "space name"]) {
      fs.mkdirSync(path.join(root, "apps", directory), { recursive: true });
    }
    fs.writeFileSync(path.join(root, "apps/file.txt"), "fixture");
    fs.writeFileSync(path.join(root, "apps/site-a/pages/about.js"), "export default function About() {}");
    process.chdir(root);
    run(root.replace(/\\/g, "/"));
  } finally {
    process.chdir(previous);
    assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(), "incidentlens-glob-compat-")));
    fs.rmSync(root, { recursive: true });
  }
}

for (const { pattern, expected } of fixtures) {
  test(`matches fast-glob 3.3.1 reference: ${pattern}`, () => withFixture(() => {
    assert.deepEqual(globSync(pattern, { onlyDirectories: true }).sort(), expected);
  }));
}

test("preserves absolute roots and advanced braces", () => withFixture((root) => {
  for (const { pattern, expected } of fixtures.filter((row) => row.pattern.startsWith("apps/"))) {
    assert.deepEqual(globSync(`${root}/${pattern}`, { onlyDirectories: true }).sort(),
      expected.map((entry) => `${root}/${entry}`));
  }
}));

test("follows directory symlinks without returning files", () => withFixture((root) => {
  fs.symlinkSync(`${root}/apps/site-a`, `${root}/apps/linked`, process.platform === "win32" ? "junction" : "dir");
  assert.deepEqual(globSync("apps/linked/*", { onlyDirectories: true }), ["apps/linked/pages"]);
}));

test("Next resolves default, string, array, Windows-normalized and absolute settings", () => withFixture((root) => {
  const globRequire = createRequire(pluginRequire.resolve("fast-glob"));
  assert.equal(globRequire("micromatch"), adapter, "override must reach Next's real glob matcher");
  const resolve = (rootDir) => getRootDirs({ cwd: root, settings: { next: { rootDir } } });
  assert.deepEqual(resolve(undefined), [root]);
  assert.deepEqual(resolve("apps/{01..05..2}").sort(), ["apps/01", "apps/03", "apps/05"]);
  assert.deepEqual(resolve([`${root}/apps/site-a`, "apps/site-b", 42]).sort(),
    [`${root}/apps/site-a`, "apps/site-b"].sort());
  assert.deepEqual(resolve("apps\\site-a"), ["apps/site-a"]);
}));

test("Next's real pages-link rule still finds absolute monorepo roots", () => withFixture((root) => {
  const { Linter } = frontendRequire("eslint");
  const plugin = require(pluginEntry);
  const messages = new Linter().verify('<a href="/about">About</a>', {
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "@next/next": plugin },
    settings: { next: { rootDir: `${root}/apps/{site-a,site-b}` } },
    rules: { "@next/next/no-html-link-for-pages": "error" },
  });
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.equal(messages[0].ruleId, "@next/next/no-html-link-for-pages");
}));

test("rejects use outside the reviewed brace-expansion contract", () => {
  assert.throws(() => adapter.braces("{1..3}"), TypeError);
  assert.throws(() => adapter.braces("{1..3}", { expand: true, nodupes: true, custom: true }), TypeError);
});

test("preserves nested, escaped, quoted, character-class and descending brace expansions", () => {
  const options = { expand: true, nodupes: true };
  for (const [pattern, expected] of [
    ["{a,{b,c}}", ["a", "b", "c"]],
    ["{{a,b},{c,d}}", ["a", "b", "c", "d"]],
    ["{5..1..2}", ["5", "3", "1"]],
    ["{-3..3..2}", ["-3", "-1", "1", "3"]],
    ["{a..e..2}", ["a", "c", "e"]],
    ['a{"b,c",d}', ["ab,c", "ad"]],
    ["a{'b,c',d}", ["ab,c", "ad"]],
    ['a{"{b,c}",d}', ["a{b,c}", "ad"]],
    ["{`a,b`,c}", ["a,b", "c"]],
    ["[a{b,c}]", ["[a{b,c}]"]],
    ["foo/\\{a,b\\}", ["foo/{a,b}"]],
    ["${a,b}", ["${a,b}"]],
  ]) assert.deepEqual(adapter.braces(pattern, options), expected, pattern);
});

test("deep malicious brace nesting does not exhaust the JavaScript stack", () => {
  const pattern = "{".repeat(12000) + "a,b" + "}".repeat(12000);
  assert.throws(() => adapter.braces(pattern, { expand: true, nodupes: true }), /safe 128-level limit/);
  assert.throws(() => globSync(pattern, { onlyDirectories: true }), /safe 128-level limit/);
  assert.throws(() => adapter.braces("{".repeat(65537), { expand: true, nodupes: true }), SyntaxError);
});
