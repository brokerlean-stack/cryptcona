const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, dependencies = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(
    source,
    {
      module,
      exports: module.exports,
      console: { error() {} },
      require: (name) => {
        if (!(name in dependencies))
          throw new Error(`Unexpected dependency: ${name}`);
        return dependencies[name];
      },
    },
    { filename: file },
  );
  return module.exports;
}

const amounts = load("src/lib/profitAmount.ts");
const userId = "123456789012345678901234";

function fixture({
  authorized = true,
  missing = false,
  failLedger = false,
  failEmail = false,
  balance = 100,
} = {}) {
  const state = { balance, credits: [], closed: false, databaseCalls: 0 };
  const transaction = {
    async withTransaction(callback) {
      const before = state.balance;
      try {
        return await callback();
      } catch (error) {
        state.balance = before;
        throw error;
      }
    },
    async endSession() {
      state.closed = true;
    },
  };
  const route = load("src/app/api/admin/users/ai-trader/execute/route.ts", {
    "next/server": {
      NextResponse: {
        json: (body, options) => ({ status: options?.status || 200, body }),
      },
    },
    "@/lib/adminAuth": {
      getAdminSession: async () =>
        authorized ? { user: { role: "admin" } } : null,
    },
    "@/lib/profitAmount": amounts,
    "@/lib/db": async () => {
      state.databaseCalls++;
      return { startSession: async () => transaction };
    },
    "@/models/User": {
      async findByIdAndUpdate(id, update, options) {
        assert.equal(id, userId);
        assert.equal(options.session, transaction);
        assert.equal(options.new, true);
        if (missing) return null;
        state.balance += update.$inc.balance;
        return {
          balance: state.balance,
          currency: "NGN",
          email: "test@example.test",
          aiProfitTarget: 9999,
        };
      },
    },
    "@/models/Deposit": {
      async create(rows, options) {
        assert.equal(options.session, transaction);
        if (failLedger) throw new Error("Ledger unavailable");
        state.credits.push(...rows);
      },
    },
    "@/lib/mail": {
      sendCustomTemplateEmail: async () => {
        if (failEmail) throw new Error("Email unavailable");
      },
    },
  });
  return {
    state,
    post: (amount) => route.POST({ json: async () => ({ userId, amount }) }),
  };
}

test("entered amounts are never partially parsed or replaced with an old target", async () => {
  for (const value of [
    undefined,
    null,
    "",
    " ",
    0,
    -10,
    NaN,
    Infinity,
    true,
    {},
    [],
    "1,000",
    "25oops",
    "1e3",
    "1.234",
  ]) {
    const { post, state } = fixture();
    assert.equal((await post(value)).status, 400, String(value));
    assert.equal(state.balance, 100);
    assert.equal(state.credits.length, 0);
    assert.equal(state.databaseCalls, 0);
  }
});

test("whole and decimal profits credit exactly the requested amount in account currency", async () => {
  for (const amount of [25, "1250.75", "0.01", "10000"]) {
    const { post, state } = fixture();
    const response = await post(amount);
    assert.equal(response.status, 200);
    assert.equal(state.balance, 100 + Number(amount));
    assert.equal(state.credits.length, 1);
    assert.equal(state.credits[0].amountLocal, Number(amount));
    assert.equal(state.credits[0].method, "AI_PROFIT_CREDIT");
    assert.equal(state.credits[0].currency, "NGN");
    assert.equal(response.body.amount, Number(amount));
    assert.equal(response.body.balance, state.balance);
    assert.equal(state.closed, true);
  }
});

test("failed ledger write rolls back the balance", async () => {
  const { post, state } = fixture({ failLedger: true });
  assert.equal((await post(75)).status, 500);
  assert.equal(state.balance, 100);
  assert.equal(state.credits.length, 0);
  assert.equal(state.closed, true);
});

test("notification failure does not report a committed credit as failed", async () => {
  const { post, state } = fixture({ balance: 9990, failEmail: true });
  assert.equal((await post(25)).status, 200);
  assert.equal(state.balance, 10015);
  assert.equal(state.credits.length, 1);
});

test("unauthorized and missing users cannot receive a credit", async () => {
  const unauthorized = fixture({ authorized: false });
  assert.equal((await unauthorized.post(25)).status, 401);
  assert.equal(unauthorized.state.databaseCalls, 0);
  const missing = fixture({ missing: true });
  assert.equal((await missing.post(25)).status, 404);
  assert.equal(missing.state.credits.length, 0);
});
