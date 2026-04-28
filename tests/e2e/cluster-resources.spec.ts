import { test, expect } from "@playwright/test";

/** 与路由 `/cluster/[id]/...` 配合；列表页不依赖该 ID 是否存在于 Volc 侧。 */
const CLUSTER_ID = "e2e-mock-cluster";
const minimalNamespaceYaml = `apiVersion: v1
kind: Namespace
metadata:
  name: e2e-namespace
`;

test.fixme("YAML 新建：拦截 API 后显示创建成功", async ({ page }) => {
  await page.route("**/api/kubernetes/create", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto(`/cluster/${CLUSTER_ID}/yaml-create?kind=Namespace`);
  await expect(page.getByText("YAML新建", { exact: true }).first()).toBeVisible();
  const editor = page.locator('[contenteditable="true"]').first();
  await editor.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.type(minimalNamespaceYaml);

  const postReqPromise = page.waitForRequest(
    (r) => r.url().includes("/api/kubernetes/create") && r.method() === "POST",
    { timeout: 30_000 }
  );
  await page.getByRole("button", { name: "创 建" }).click();
  const postReq = await postReqPromise;
  const body = postReq.postDataJSON() as { yaml?: string };
  expect(body.yaml ?? "").toContain("apiVersion");

  const successBar = page.locator(".ant-alert-success");
  await expect(successBar).toBeVisible({ timeout: 20_000 });
  await expect(successBar).toContainText("创建");
  await expect(successBar).toContainText("资源已成功创建", { useInnerText: true });
});

test("Service / 事件 / Deployment / StatefulSet 列表表头正常展示", async ({ page }) => {
  const checks: Array<{ path: string; header: string }> = [
    { path: `/cluster/${CLUSTER_ID}/service`, header: "ClusterIP" },
    { path: `/cluster/${CLUSTER_ID}/event`, header: "事件内容" },
    { path: `/cluster/${CLUSTER_ID}/deployment`, header: "副本数" },
    { path: `/cluster/${CLUSTER_ID}/statefulset`, header: "副本数" },
  ];

  for (const { path: pathTo, header } of checks) {
    await test.step(`列表页 ${pathTo}`, async () => {
      await page.goto(pathTo);
      await expect(page.getByRole("columnheader", { name: "名称" }).first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
    });
  }
});
