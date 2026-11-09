const assert = require("node:assert/strict");
const { mkdir, writeFile } = require("node:fs/promises");
const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { chromium } = require("@playwright/test");
const { once } = require("node:events");
const path = require("node:path");

(async () => {
  let mongo, server, browser;
  const failures = [];
  try {
    await mkdir("test-results", { recursive: true });
    console.log("Starting isolated MongoDB replica set...");
    mongo = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
      binary: { version: "8.0.17" },
    });
    const uri = mongo.getUri();
    await mongoose.connect(uri, { dbName: "cryptcona_browser_test" });
    const password = randomBytes(20).toString("hex");
    const admin = await mongoose.connection
      .collection("users")
      .insertOne({
        name: "Cryptcona Admin",
        email: "admin@example.test",
        password: await bcrypt.hash(password, 10),
        role: "admin",
        status: "active",
        isVerified: true,
        currency: "USD",
        balance: 0,
        createdAt: new Date(),
      });
    console.log("Starting isolated application on port 3101...");
    server = spawn(process.execPath, [".next/standalone/server.js"], {
      cwd: process.cwd(),
      windowsHide: true,
      env: {
        ...process.env,
        PORT: "3101",
        HOSTNAME: "127.0.0.1",
        NEXTAUTH_URL: "http://127.0.0.1:3101",
        NEXTAUTH_SECRET: randomBytes(48).toString("hex"),
        MONGODB_URI: uri,
        MONGODB_DB_NAME: "cryptcona_browser_test",
        ADMIN_EMAIL: "admin@example.test",
        RESEND_API_KEY: "",
        RESEND_FROM_EMAIL: "",
        NODE_OPTIONS: `--require="${path.resolve('scripts/imagekit-test-preload.cjs').replaceAll('\\', '/')}"`,
        IMAGEKIT_PRIVATE_KEY: "private_test_only",
        IMAGEKIT_URL_ENDPOINT: "https://ik.imagekit.io/cryptcona-test",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let serverOutput = "";
    server.stdout.on("data", (x) => {
      serverOutput += x;
    });
    server.stderr.on("data", (x) => {
      serverOutput += x;
    });
    const base = "http://127.0.0.1:3101";
    let ready = false;
    for (let i = 0; i < 90; i++) {
      if (server.exitCode !== null) throw new Error("Test server exited: " + serverOutput.slice(-1500));
      try {
        if ((await fetch(base + "/login")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!ready)
      throw new Error(
        "Test server did not start: " + serverOutput.slice(-1000),
      );
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await context.routeWebSocket("wss://ws.kraken.com/v2", socket => socket.close());
    const page = await context.newPage();
    page.on("pageerror", (e) => failures.push(e.message));
    for (const route of [
      "/",
      "/markets",
      "/crypto",
      "/forex",
      "/platform",
      "/accounts",
      "/company",
      "/faq",
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
    ]) {
      const res = await page.goto(base + route);
      assert.ok(res.status() < 400, route);
      await page.locator("body").waitFor();
      assert.equal(
        await page
          .locator("body")
          .evaluate((el) => el.scrollWidth > window.innerWidth + 1),
        false,
        "Desktop overflow: " + route,
      );
    }
    await page.goto(base);
    await page.screenshot({
      path: "test-results/home-desktop.png",
      fullPage: true,
    });
    await page.goto(base + "/login");
    await page.screenshot({
      path: "test-results/login-desktop.png",
      fullPage: true,
    });
    for (const route of ["/", "/login", "/register", "/faq"]) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base + route);
      assert.equal(
        await page
          .locator("body")
          .evaluate((el) => el.scrollWidth > window.innerWidth + 1),
        false,
        "Mobile overflow: " + route,
      );
      await page.screenshot({
        path:
          "test-results/" +
          (route === "/" ? "home" : route.slice(1)) +
          "-mobile.png",
        fullPage: true,
      });
    }
    await page.goto(base);
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Markets", exact: true })
      .click();
    await page.waitForURL("**/markets");
    console.log(
      "Public routes, responsive layouts and mobile navigation passed.",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/login");
    await page.getByLabel("Email address").fill("admin@example.test");
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/admin", { timeout: 30000 });
    await page.waitForTimeout(700);
    await page.screenshot({
      path: "test-results/admin-desktop.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Settings", exact: true })
      .first()
      .click();
    await page
      .getByRole("heading", { name: "Payment Methods", exact: true })
      .waitFor();
    const addForm = page
      .locator("form")
      .filter({
        has: page.getByRole("heading", { name: "Add Payment Method" }),
      });
    await addForm.getByLabel("Method name").fill("Local Bank");
    await addForm
      .getByLabel("Payment details")
      .fill("Test Bank\nAccount: 123456");
    await addForm.getByRole("button", { name: "Add Method" }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "Payment method saved." })
      .waitFor();
    const methods = await (
      await context.request.get(base + "/api/wallet/deposit")
    ).json();
    assert.equal(
      methods.methods.find((m) => m.name === "Local Bank").details,
      "Test Bank\nAccount: 123456",
    );
    await page.screenshot({
      path: "test-results/admin-settings-desktop.png",
      fullPage: true,
    });
    const registered = await context.request.post(base + "/api/auth/register", {
      data: {
        name: "Test Trader",
        email: "trader@example.test",
        password,
        country: "NG",
        currency: "NGN",
        profitGoal: "2000",
        acceptTerms: true,
      },
    });
    assert.equal(registered.status(), 201);
    const userId = (await registered.json()).userId;
    const profit = await context.request.post(
      base + "/api/admin/users/ai-trader/execute",
      { data: { userId, amount: 1250.75 } },
    );
    assert.equal(profit.status(), 200, JSON.stringify(await profit.json()));
    const user = await mongoose.connection
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(userId) });
    assert.equal(user.balance, 1250.75);
    const credit = await mongoose.connection
      .collection("deposits")
      .findOne({
        userId: new mongoose.Types.ObjectId(userId),
        method: "AI_PROFIT_CREDIT",
      });
    assert.equal(credit.amountLocal, 1250.75);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/admin");
    await page.waitForTimeout(700);
    assert.equal(
      await page
        .locator("body")
        .evaluate((el) => el.scrollWidth > window.innerWidth + 1),
      false,
      "Admin mobile overflow",
    );
    await page.screenshot({
      path: "test-results/admin-mobile.png",
      fullPage: true,
    });
    const client = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await client.routeWebSocket("wss://ws.kraken.com/v2", socket => socket.close());
    const trader = await client.newPage();
    trader.on("pageerror", (e) => failures.push(e.message));
    await trader.goto(base + "/login");
    await trader.getByLabel("Email address").fill("trader@example.test");
    await trader.getByLabel("Password", { exact: true }).fill(password);
    await trader.getByRole("button", { name: "Sign in", exact: true }).click();
    await trader.waitForURL("**/dashboard/trading", { timeout: 30000 });
    await trader.getByRole("heading", { name: "A view of your market.", exact: true }).waitFor();
    const dash = await (
      await client.request.get(base + "/api/dashboard")
    ).json();
    assert.equal(dash.user.balance, 1250.75);
    assert.equal(dash.stats.totalProfit, 1250.75);
    await trader.screenshot({
      path: "test-results/dashboard-desktop.png",
      fullPage: true,
    });
    assert.equal(
      (
        await client.request.post(base + "/api/admin/settings/update", {
          data: { key: "payment_test", value: "test" },
        })
      ).status(),
      401,
    );
    for (const route of [
      "/dashboard/trading",
      "/dashboard/wallet",
      "/dashboard/history",
      "/dashboard/subscription",
      "/dashboard/profile",
      "/dashboard/settings",
      "/dashboard/chat",
      "/dashboard/support",
    ]) {
      const res = await trader.goto(base + route, { waitUntil: 'domcontentloaded' });
      assert.ok(res.status() < 400, route);
      await trader.waitForTimeout(700);
      assert.equal(
        await trader
          .locator("body")
          .evaluate((el) => el.scrollWidth > window.innerWidth + 1),
        false,
        "Account desktop overflow: " + route,
      );
    }
    await trader.goto(base + "/dashboard/wallet");
    await trader
      .getByRole("button", { name: "Local Bank", exact: true })
      .waitFor();
    await trader.screenshot({
      path: "test-results/wallet-desktop.png",
      fullPage: true,
    });
    await trader.setViewportSize({ width: 390, height: 844 });
    for (const route of [
      "/dashboard",
      "/dashboard/wallet",
      "/dashboard/profile",
      "/dashboard/settings",
      "/dashboard/history",
    ]) {
      await trader.goto(base + route, { waitUntil: 'domcontentloaded' });
      await trader.waitForTimeout(700);
      assert.equal(
        await trader
          .locator("body")
          .evaluate((el) => el.scrollWidth > window.innerWidth + 1),
        false,
        "Account mobile overflow: " + route,
      );
    }
    await trader.goto(base + "/dashboard");
    await trader.getByRole("heading", { name: "Overview", exact: true }).waitFor();
    await trader.screenshot({
      path: "test-results/dashboard-mobile.png",
      fullPage: true,
    });
    await require('./check-copy-trading.cjs')({page,trader,context,client,base,userId,mongoose}).catch(async error => {
      await page.screenshot({path:'test-results/copy-failure.png',fullPage:true});
      await writeFile('test-results/copy-failure.html',await page.content());
      throw error;
    });
    await require('./check-imagekit.cjs')({context,client,base,userId,mongoose});
    await require('./check-goals.cjs')({context,client,base,userId,mongoose});
    await require('./check-simulation.cjs')({trader,client,base,userId,mongoose});
    await require('./check-overview.cjs')({browser,trader,client,base,userId,mongoose,password});
    await require('./check-live-performance.cjs')({browser,client,base});
    await require('./check-responsive.cjs')({page,trader,base});
    assert.deepEqual(failures, [], "Browser runtime errors");
    await writeFile(
      "test-results/browser-summary.json",
      JSON.stringify(
        {
          passed: true,
          checks: [
            "public routes",
            "desktop/mobile overflow",
            "mobile navigation",
            "admin sign-in",
            "custom payment persistence",
            "registration",
            "exact profit credit and dashboard total",
            "user admin access denied",
            "account routes",
            "copy-trading profiles, activation, credits and retry protection",
            "ImageKit upload integration with mocked provider; private image authorization and KYC storage",
            "optional signup goals, consent, progress/reset/disable and withdrawals unaffected",
            "demo credits rejected and random funded trading disabled",
            "customer routes and every admin tab at 320, 390, 768 and 1024 pixels",
          ],
          screenshots: true,
        },
        null,
        2,
      ),
    );
    console.log(
      "Browser checks passed: authentication, payments, exact profit credits, account routes, responsive layouts.",
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server) {
      server.kill();
      await Promise.race([
        once(server, "exit"),
        new Promise((r) => setTimeout(r, 5000)),
      ]);
    }
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  }
})();
