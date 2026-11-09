const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const sharp = require("sharp");
module.exports = async function checkCopyTrading({
  page,
  trader,
  context,
  client,
  base,
  userId,
  mongoose,
}) {
  const adminRequest = context.request;
  console.log('Checking copy-trading profile creation...');
  const userRequest = client.request;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/admin");
  await page
    .getByRole("button", { name: "Copy trading", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Create profile", exact: true })
    .click();
  await page.getByLabel("Trader name", { exact: true }).fill("Test Strategy");
  await page.getByLabel("Region", { exact: true }).fill("West Africa");
  await page
    .getByLabel("Bio", { exact: true })
    .fill("A test profile for diversified market research.");
  const photo = await sharp("public/trading-team.png")
    .resize(128, 128)
    .png()
    .toBuffer();
  await page
    .getByLabel("Profile photo", { exact: true })
    .setInputFiles({
      name: "test-profile.png",
      mimeType: "image/png",
      buffer: photo,
    });
  await page.getByRole("button", { name: "Add week", exact: true }).click();
  await page.getByLabel("Starting capital", { exact: true }).fill("1000");
  await page.getByLabel("Profit / loss", { exact: true }).fill("100");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Trader profile saved." })
    .waitFor();
  let adminData = await (
    await adminRequest.get(base + "/api/admin/copy-trading")
  ).json();
  let profile = adminData.profiles.find((p) => p.name === "Test Strategy");
  assert.ok(profile);
  assert.equal(profile.weeks[0].profit, 100);
  await page
    .getByRole("button", { name: "Edit Test Strategy", exact: true })
    .click();
  await page
    .getByLabel("Bio", { exact: true })
    .fill("Updated strategy profile for the copy-trading test.");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Trader profile saved." })
    .waitFor();
  assert.equal(
    (
      await userRequest.post(base + "/api/admin/copy-trading", {
        data: profile,
      })
    ).status(),
    401,
  );
  await trader.setViewportSize({ width: 1440, height: 1000 });
  await trader.goto(base + "/dashboard/copy-trading");
  await trader
    .getByRole("heading", { name: "Test Strategy", exact: true })
    .waitFor();
  await trader.screenshot({
    path: "test-results/copy-profiles-desktop.png",
    fullPage: true,
  });
  await trader
    .getByRole("button", { name: "View profile", exact: true })
    .click();
  await trader.getByRole("dialog").waitFor();
  await trader.screenshot({
    path: "test-results/copy-profile-details.png",
    fullPage: true,
  });
  await trader
    .getByRole("button", { name: "Copy trader", exact: true })
    .click();
  await trader
    .getByRole("status")
    .filter({ hasText: "Copy profile activated." })
    .waitFor();
  let u = await mongoose.connection
    .collection("users")
    .findOne({ _id: new mongoose.Types.ObjectId(userId) });
  const copySessionId = u.copySessionId;
  assert.equal(String(u.copyProfileId), profile._id);
  await userRequest.post(base + "/api/copy-trading", {
    data: { profileId: profile._id },
  });
  u = await mongoose.connection
    .collection("users")
    .findOne({ _id: new mongoose.Types.ObjectId(userId) });
  assert.equal(
    u.copySessionId,
    copySessionId,
    "Repeated activation must not reset the copy session",
  );
  await page
    .getByRole("button", { name: "Refresh copy trading", exact: true })
    .click();
  await page.getByRole("button", { name: "View members", exact: true }).click();
  await page.getByLabel("Member", { exact: true }).selectOption(userId);
  await page.getByLabel("Profit amount (NGN)", { exact: true }).fill("25.25");
  await page
    .getByLabel("Credit note", { exact: true })
    .fill("Weekly admin copy credit");
  await page
    .getByRole("button", { name: "Credit profit", exact: true })
    .click();
  await page.getByRole("status").filter({ hasText: "25.25" }).waitFor();
  const payload = {
    userId,
    profileId: profile._id,
    copySessionId,
    amount: 10.5,
    note: "Retry protection test",
    requestId: randomUUID(),
  };
  const repeated = await Promise.all(
    Array.from({ length: 4 }, () =>
      adminRequest.post(base + "/api/admin/copy-trading/credit", {
        data: payload,
      }),
    ),
  );
  for (const response of repeated)
    assert.equal(response.status(), 200, await response.text());
  assert.equal(
    (
      await adminRequest.post(base + "/api/admin/copy-trading/credit", {
        data: { ...payload, amount: 99 },
      })
    ).status(),
    409,
  );
  assert.equal(
    (
      await userRequest.post(base + "/api/admin/copy-trading/credit", {
        data: { ...payload, requestId: randomUUID() },
      })
    ).status(),
    401,
  );
  for (const amount of [0, -1, null, "10oops", 1.001])
    assert.equal(
      (
        await adminRequest.post(base + "/api/admin/copy-trading/credit", {
          data: { ...payload, amount, requestId: randomUUID() },
        })
      ).status(),
      400,
    );
  const dash = await (await userRequest.get(base + "/api/dashboard")).json();
  assert.equal(dash.user.balance, 1286.5);
  assert.equal(dash.user.actualDeposit, 0);
  assert.equal(dash.stats.totalProfit, 1286.5);
  const copy = await (await userRequest.get(base + "/api/copy-trading")).json();
  assert.equal(copy.totalCredited, 35.75);
  assert.equal(copy.weeklyCredited, 35.75);
  assert.equal(copy.credits.length, 2);
  assert.equal(
    await mongoose.connection
      .collection("copycredits")
      .countDocuments({ requestId: payload.requestId }),
    1,
  );
  assert.equal(
    await mongoose.connection
      .collection("deposits")
      .countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        method: "COPY_PROFIT_CREDIT",
      }),
    2,
  );
  await trader.reload();
  await trader
    .getByRole("button", { name: "Stop copying", exact: true })
    .waitFor();
  await trader.screenshot({
    path: "test-results/copy-active-desktop.png",
    fullPage: true,
  });
  await trader.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await trader
      .locator("body")
      .evaluate((el) => el.scrollWidth > innerWidth + 1),
    false,
    "Copy page mobile overflow",
  );
  await trader.screenshot({
    path: "test-results/copy-active-mobile.png",
    fullPage: true,
  });
  await trader
    .getByRole("button", { name: "View profile", exact: true })
    .click();
  await trader.screenshot({
    path: "test-results/copy-details-mobile.png",
    fullPage: true,
  });
  await trader
    .getByRole("button", { name: "Close profile", exact: true })
    .click();
  await trader
    .getByRole("button", { name: "Stop copying", exact: true })
    .click();
  await trader
    .getByRole("status")
    .filter({ hasText: "Copying stopped." })
    .waitFor();
  assert.equal(
    (
      await adminRequest.post(base + "/api/admin/copy-trading/credit", {
        data: { ...payload, requestId: randomUUID() },
      })
    ).status(),
    409,
  );
  await userRequest.post(base + "/api/copy-trading", {
    data: { profileId: profile._id },
  });
  assert.equal(
    (
      await adminRequest.post(base + "/api/admin/copy-trading/credit", {
        data: { ...payload, requestId: randomUUID() },
      })
    ).status(),
    409,
    "Old copy session cannot receive a credit",
  );
  adminData = await (
    await adminRequest.get(base + "/api/admin/copy-trading")
  ).json();
  profile = adminData.profiles.find((p) => p._id === profile._id);
  const paused = await adminRequest.post(base + "/api/admin/copy-trading", {
    data: { ...profile, active: false },
  });
  assert.equal(paused.status(), 200);
  const current = await mongoose.connection
    .collection("users")
    .findOne({ _id: new mongoose.Types.ObjectId(userId) });
  assert.equal(
    (
      await adminRequest.post(base + "/api/admin/copy-trading/credit", {
        data: {
          ...payload,
          copySessionId: current.copySessionId,
          requestId: randomUUID(),
        },
      })
    ).status(),
    409,
  );
  await userRequest.post(base + "/api/copy-trading", {
    data: { profileId: null },
  });
  assert.equal(
    (
      await userRequest.post(base + "/api/copy-trading", {
        data: { profileId: profile._id },
      })
    ).status(),
    409,
  );
  assert.equal(
    (
      await userRequest.post(base + "/api/copy-trading", { data: "bad input" })
    ).status(),
    400,
  );
  const second = { ...profile, name: "Second Strategy", active: true, photo: 'data:image/png;base64,' + photo.toString('base64') };
  delete second._id;
  const secondResponse = await adminRequest.post(
    base + "/api/admin/copy-trading",
    { data: second },
  );
  assert.equal(secondResponse.status(), 200);
  const secondId = (await secondResponse.json()).profile._id;
  await userRequest.post(base + "/api/copy-trading", {
    data: { profileId: secondId },
  });
  assert.equal(
    (await (await userRequest.get(base + "/api/copy-trading")).json())
      .subscription.profileId,
    secondId,
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Copy trading", exact: true })
    .first()
    .click();
  await page
    .getByRole("heading", { name: "Second Strategy", exact: true })
    .waitFor();
  await page.screenshot({
    path: "test-results/copy-admin-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page
      .locator("body")
      .evaluate((el) => el.scrollWidth > innerWidth + 1),
    false,
    "Copy admin mobile overflow",
  );
  await page.screenshot({
    path: "test-results/copy-admin-mobile.png",
    fullPage: true,
  });
  console.log(
    "Copy-trading checks passed: profile photo/create/edit, weekly returns, activation, credits, concurrent retries, stop/restart, pause, access control and mobile layouts.",
  );
};
