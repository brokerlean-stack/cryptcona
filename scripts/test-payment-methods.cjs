const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

// Execute the real route handlers with isolated authentication and database doubles.
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
      console,
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

const payments = load("src/lib/paymentMethods.ts");
const response = {
  NextResponse: {
    json: (body, options) => ({
      status: options?.status || 200,
      json: async () => body,
    }),
  },
};
const request = (body) => ({ json: async () => body });

test("missing defaults remain editable without publishing empty destinations", () => {
  const existing = {
    key: "payment_bank",
    value: "Bank: Example\nAccount: 123",
    description: "Local Bank",
  };
  const editable = payments.getEditablePaymentSettings([existing]);
  assert.equal(editable.length, 5);
  assert.equal(
    editable.find((s) => s.key === existing.key).value,
    existing.value,
  );
  assert.equal(payments.getPaymentMethods(editable).length, 1);
  assert.equal(
    payments
      .getEditablePaymentSettings([
        { key: "payment_bank", value: "Existing bank" },
      ])
      .find((s) => s.key === "payment_bank").description,
    "Bank Transfer",
  );
});

test("custom names and multiline details survive conversion", () => {
  const key = payments.paymentMethodKey("Local Bank / NGN");
  assert.equal(key, "payment_local_bank_ngn");
  const [method] = payments.getPaymentMethods([
    {
      key,
      value: " Bank: Example\nAccount: 123 ",
      description: "Local Bank / NGN",
    },
  ]);
  assert.equal(method.id, "LOCAL_BANK_NGN");
  assert.equal(method.name, "Local Bank / NGN");
  assert.equal(method.details, "Bank: Example\nAccount: 123");
  assert.equal(
    payments.getPaymentMethods([{ key: "payment_btc", value: {} }]).length,
    0,
  );
});

test("admin save, customer listing, edit, duplicate, unpublish and deposit validation", async () => {
  const rows = new Map();
  let admin = true;
  let signedIn = true;
  let failDatabase = false;
  let depositCount = 0;
  const Setting = {
    create: async (row) => {
      if (rows.has(row.key)) throw { code: 11000 };
      rows.set(row.key, row);
      return row;
    },
    findOneAndUpdate: async ({ key }, { $set }) => {
      const row = { ...rows.get(key), key, ...$set };
      rows.set(key, row);
      return row;
    },
    find: async () => [...rows.values()],
    findOne: async ({ key }) => rows.get(key),
  };
  const shared = {
    "next/server": response,
    "@/lib/db": async () => {
      if (failDatabase) throw new Error("Offline");
    },
    "@/models/Setting": Setting,
  };
  const adminRoute = load("src/app/api/admin/settings/update/route.ts", {
    ...shared,
    "@/lib/adminAuth": {
      getAdminSession: async () => (admin ? { user: { role: "admin" } } : null),
    },
  });
  const wallet = load("src/app/api/wallet/deposit/route.ts", {
    ...shared,
    "@/lib/paymentMethods": payments,
    "next-auth": {
      getServerSession: async () =>
        signedIn ? { user: { id: "test-user", currency: "USD" } } : null,
    },
    "@/lib/auth": { authOptions: {} },
    "@/lib/mail": { sendDepositPendingEmail: async () => {} },
    "@/models/Deposit": {
      create: async (row) => {
        depositCount++;
        return row;
      },
    },
  });
  const setting = {
    key: "payment_local_bank",
    value: "Bank: Test\nAccount: 123",
    description: "Local Bank",
    create: true,
  };
  admin = false;
  assert.equal((await adminRoute.POST(request(setting))).status, 401);
  assert.equal(rows.size, 0);
  admin = true;
  for (const invalid of [
    null,
    { key: {}, value: "abc" },
    { key: "payment_", value: "abc" },
    { ...setting, value: "" },
    { ...setting, description: {} },
  ]) {
    assert.equal((await adminRoute.POST(request(invalid))).status, 400);
  }
  assert.equal((await adminRoute.POST(request(setting))).status, 200);
  assert.equal((await adminRoute.POST(request(setting))).status, 409);
  let listing = await (await wallet.GET()).json();
  assert.equal(listing.methods[0].name, "Local Bank");
  assert.equal(listing.methods[0].details, setting.value);
  const edited = {
    ...setting,
    create: false,
    value: "Bank: Updated\nAccount: 456",
    description: "Updated Bank",
  };
  assert.equal((await adminRoute.POST(request(edited))).status, 200);
  listing = await (await wallet.GET()).json();
  assert.equal(listing.methods[0].details, edited.value);
  assert.equal(listing.methods[0].name, edited.description);
  const deposit = { method: "LOCAL_BANK", amount: 25 };
  signedIn = false;
  assert.equal((await wallet.POST(request(deposit))).status, 401);
  signedIn = true;
  for (const amount of [0, -1, "25", Infinity, NaN]) {
    assert.equal(
      (await wallet.POST(request({ ...deposit, amount }))).status,
      400,
    );
  }
  assert.equal(
    (await wallet.POST(request({ ...deposit, method: "UNKNOWN" }))).status,
    400,
  );
  assert.equal((await wallet.POST(request(deposit))).status, 200);
  assert.equal(depositCount, 1);
  assert.equal(
    (await adminRoute.POST(request({ ...edited, value: "" }))).status,
    200,
  );
  assert.equal((await (await wallet.GET()).json()).methods.length, 0);
  assert.equal((await wallet.POST(request(deposit))).status, 400);
  failDatabase = true;
  assert.equal((await adminRoute.POST(request(edited))).status, 500);
});
