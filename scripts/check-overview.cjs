const assert = require("node:assert/strict");
module.exports = async ({ trader, base, browser, password }) => {
  console.log("Checking overview, wallet shortcuts and account currency...");
  await trader.setViewportSize({ width: 1440, height: 1000 });
  await trader.goto(base + "/dashboard");
  await trader
    .getByRole("heading", { name: "Overview", exact: true })
    .waitFor();
  await trader.getByText("Account currency: NGN", { exact: true }).waitFor();
  await trader.getByRole("button", { name: "Refresh overview" }).isEnabled();
  assert.equal(
    await trader
      .getByRole("heading", { name: "New position", exact: true })
      .count(),
    0,
  );
  await trader.getByRole("heading", { name: "Quick actions" }).waitFor();
  await trader.getByRole("button", { name: "Payments", exact: true }).click();
  await trader
    .getByRole("heading", { name: "Account credit", exact: true })
    .first()
    .waitFor();
  await trader.getByRole("button", { name: "Trades", exact: true }).click();
  await trader
    .getByText("Recorded account trade", { exact: true })
    .first()
    .waitFor();
  await trader.getByRole("button", { name: "All", exact: true }).click();
  await trader.screenshot({
    path: "test-results/overview-desktop.png",
    fullPage: true,
  });
  await trader.setViewportSize({ width: 390, height: 844 });
  await trader.screenshot({
    path: "test-results/overview-mobile.png",
    fullPage: true,
  });
  await trader
    .locator('.overview-actions a[href="/dashboard/wallet?view=withdraw"]')
    .click();
  await trader
    .getByPlaceholder("Wallet address or Bank account details...")
    .waitFor();
  await trader.goto(base + "/dashboard/trading");
  await trader.getByText("Account currency: NGN", { exact: true }).waitFor();
  assert.match(await trader.locator(".sim-metrics").innerText(), /NGN/);
  const signupContext = await browser.newContext();
  try {
    const signup = await signupContext.newPage();
    await signup.goto(base + "/register");
    await signup
      .getByLabel("Full name", { exact: true })
      .fill("Overview Currency Test");
    await signup
      .getByLabel("Email address", { exact: true })
      .fill("overview-currency@example.test");
    await signup.getByLabel("Password", { exact: true }).fill(password);
    await signup.getByLabel("Confirm password", { exact: true }).fill(password);
    await signup.locator("form select").nth(0).selectOption("GB");
    await signup.locator("form select").nth(1).selectOption("GBP");
    await signup.getByRole("checkbox").check();
    await signup.getByRole("button", { name: "Create account" }).click();
    await signup.waitForURL("**/dashboard/trading", { timeout: 30000 });
    await signup.getByText("Account currency: GBP", { exact: true }).waitFor();
    assert.match(await signup.locator(".sim-metrics").innerText(), /GBP/);
  } finally {
    await signupContext.close();
  }
};
