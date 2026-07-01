const fs = require("fs");
const http = require("http");
const path = require("path");

const localBrowserPath = path.join(__dirname, ".ms-playwright");
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(localBrowserPath)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowserPath;
}

const { chromium } = require("playwright");

const rootDir = __dirname;
const screenshotDir = path.join(rootDir, "screenshots");
const viewports = [
  { name: "desktop-1440x900", width: 1440, height: 900, isMobile: false },
  { name: "mobile-390x844", width: 390, height: 844, isMobile: true }
];

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp"
  }[ext] || "application/octet-stream";
}

function startStaticServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const relativePath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const filePath = path.resolve(rootDir, relativePath);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, { "Content-Type": contentType(filePath) });
      response.end(data);
    });
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, origin: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

async function waitForStablePage(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 1500 }).catch(() => {});
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.race([
      Promise.all([...document.images].map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      })),
      new Promise((resolve) => setTimeout(resolve, 1000))
    ]);
  });
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));
  if (metrics.scrollWidth > metrics.innerWidth) {
    throw new Error(`${label}: horizontal overflow ${metrics.scrollWidth} > ${metrics.innerWidth}`);
  }
}

async function clickAndMeasure(page, selector, waitSelector, label) {
  const startedAt = Date.now();
  await page.click(selector);
  await page.waitForSelector(waitSelector, { timeout: 1000 });
  const elapsed = Date.now() - startedAt;
  if (elapsed > 1000) throw new Error(`${label}: took ${elapsed}ms`);
  return elapsed;
}

async function verifyViewport(browser, viewport, origin) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("ERR_NETWORK_ACCESS_DENIED")) {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(`${origin}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#homeView:not(.hidden)", { timeout: 1000 });
  await waitForStablePage(page);
  await assertNoHorizontalOverflow(page, `${viewport.name} home`);
  await page.screenshot({ path: path.join(screenshotDir, `performance-${viewport.name}-home.png`), fullPage: true });

  const initialState = await page.evaluate(() => ({
    boardPreviewChildren: document.querySelector("#boardPreview")?.children.length || 0,
    rulesLoaded: !document.querySelector("#rulesCopy")?.textContent.includes("正在准备")
  }));
  if (initialState.boardPreviewChildren !== 0) {
    throw new Error(`${viewport.name}: board preview rendered before room entry`);
  }
  if (initialState.rulesLoaded) {
    throw new Error(`${viewport.name}: rules content rendered before first click`);
  }

  const roomMs = await clickAndMeasure(page, "#startButton", "#roomView:not(.hidden)", `${viewport.name} room entry`);
  await page.waitForFunction(() => document.querySelector("#boardPreview")?.children.length > 0, null, { timeout: 1000 });
  await assertNoHorizontalOverflow(page, `${viewport.name} room`);
  await page.screenshot({ path: path.join(screenshotDir, `performance-${viewport.name}-room.png`), fullPage: true });

  await page.goto(`${origin}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#homeView:not(.hidden)", { timeout: 1000 });
  const onlineMs = await clickAndMeasure(page, "#onlineButton", "#onlineView:not(.hidden)", `${viewport.name} online entry`);
  await page.waitForFunction(() => {
    const status = document.querySelector("#onlineStatus")?.textContent || "";
    return status.includes("联机") || status.includes("准备");
  }, null, { timeout: 1000 });
  await assertNoHorizontalOverflow(page, `${viewport.name} online`);
  await page.screenshot({ path: path.join(screenshotDir, `performance-${viewport.name}-online.png`), fullPage: true });

  await page.goto(`${origin}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#homeView:not(.hidden)", { timeout: 1000 });
  const rulesSelector = viewport.isMobile ? "#homeRulesButton" : "#rulesButton";
  const rulesMs = await clickAndMeasure(page, rulesSelector, "#rulesDialog[open]", `${viewport.name} rules dialog`);
  await page.waitForFunction(() => !document.querySelector("#rulesCopy")?.textContent.includes("正在准备"), null, { timeout: 1000 });
  await assertNoHorizontalOverflow(page, `${viewport.name} rules`);
  await page.screenshot({ path: path.join(screenshotDir, `performance-${viewport.name}-rules.png`), fullPage: true });

  if (pageErrors.length) throw new Error(`${viewport.name}: ${pageErrors.join(" | ")}`);
  if (consoleErrors.length) throw new Error(`${viewport.name}: ${consoleErrors.join(" | ")}`);
  await context.close();
  return { viewport: viewport.name, roomMs, onlineMs, rulesMs };
}

(async () => {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const { server, origin } = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const results = [];
    for (const viewport of viewports) {
      results.push(await verifyViewport(browser, viewport, origin));
    }
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
