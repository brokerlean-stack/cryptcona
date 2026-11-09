const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const vm = require("node:vm");
const fs = require("node:fs");
const moduleValue = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/lib/copyTrading.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  { exports: moduleValue.exports, module: moduleValue, Date, Set },
);
const { validateProfile, weekReturn, cumulativeReturn, weekStart } =
  moduleValue.exports;
const photo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6lJ8AAAAASUVORK5CYII=";
const monday = weekStart().toISOString().slice(0, 10);
const profile = () => ({
  name: "Test Trader",
  bio: "Test profile",
  region: "West Africa",
  photo,
  currency: "USD",
  active: true,
  weeks: [{ week: monday, capital: 1000, profit: 100 }],
});
test("weekly return uses starting capital and total return compounds gains and losses", () => {
  assert.equal(weekReturn({ capital: 1000, profit: 100 }), 10);
  assert.equal(weekReturn({ capital: 1000, profit: -50 }), -5);
  assert.ok(
    Math.abs(
      cumulativeReturn([
        { capital: 1000, profit: 100 },
        { capital: 1100, profit: -55 },
      ]) - 4.5,
    ) < 0.000001,
  );
  assert.equal(cumulativeReturn([]), 0);
});
test("valid profile and blank performance history are accepted", () => {
  assert.equal(validateProfile(profile()).error, undefined);
  assert.equal(
    validateProfile({ ...profile(), weeks: [] }).value.weeks.length,
    0,
  );
});
test("invalid photos, capital, duplicate dates and future dates are rejected", () => {
  for (const change of [
    { photo: "https://example.com/photo.svg" },
    { photo: "data:image/svg+xml;base64,AAAA" },
    { photo: "x".repeat(1600000) },
    { name: "" },
    { bio: "" },
    { region: "" },
    { currency: "not-a-currency" },
    { active: "true" },
    { weeks: [{ week: monday, capital: 0, profit: 1 }] },
    { weeks: [{ week: monday, capital: 100, profit: -101 }] },
    { weeks: [{ week: "2099-01-05", capital: 100, profit: 5 }] },
    { weeks: [{ week: "2026-02-30", capital: 100, profit: 5 }] },
    { weeks: [{ week: monday, capital: 100.001, profit: 5 }] },
    { weeks: [profile().weeks[0], profile().weeks[0]] },
  ]) {
    assert.ok(
      validateProfile({ ...profile(), ...change }).error,
      JSON.stringify(change).slice(0, 100),
    );
  }
});
test("week boundaries use UTC Monday, including year changes", () => {
  assert.equal(
    weekStart(new Date("2026-01-04T23:59:59Z")).toISOString(),
    "2025-12-29T00:00:00.000Z",
  );
  assert.equal(
    weekStart(new Date("2026-01-05T00:00:00Z")).toISOString(),
    "2026-01-05T00:00:00.000Z",
  );
});
