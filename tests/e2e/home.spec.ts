import { test, expect } from "@playwright/test";

test("home page shows main heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "欢迎使用 K8s 集群管理平台" })).toBeVisible();
});

test("can navigate from home to cluster detail when card exists", async ({ page }) => {
  await page.goto("/");

  const clusterCards = page.locator("text=集群ID");
  const cardCount = await clusterCards.count();

  if (cardCount > 0) {
    await clusterCards.first().click();
    await expect(page).toHaveURL(/\/cluster\/.+/);
  } else {
    await expect(page.getByRole("heading", { name: "欢迎使用 K8s 集群管理平台" })).toBeVisible();
  }
});
