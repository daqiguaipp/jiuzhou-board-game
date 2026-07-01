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
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 430, height: 932 }
];

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp"
  }[ext] || "application/octet-stream";
}

function startStaticServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const decodedPath = decodeURIComponent(url.pathname);
    const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
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
      const address = server.address();
      resolve({
        server,
        origin: `http://127.0.0.1:${address.port}`
      });
    });
  });
}

async function waitForStablePage(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 2000 }).catch(() => {});
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
        const images = [...document.images];
        const imageSettled = Promise.all(images.map((image) => {
          if (image.complete) return Promise.resolve();
          return new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });
        }));
        await Promise.race([
          imageSettled,
          new Promise((resolve) => setTimeout(resolve, 1500))
        ]);
      });
      break;
    } catch (error) {
      if (!String(error.message || "").includes("Execution context was destroyed") || attempt === 2) throw error;
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(250);
    }
  }
  await page.waitForTimeout(250);
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

async function assertVisibleWithinViewport(page, selector, label) {
  const result = await page.locator(selector).first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return {
      exists: true,
      visible: style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0,
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }).catch(() => ({ exists: false }));

  if (!result.exists) throw new Error(`${label}: missing ${selector}`);
  if (!result.visible) throw new Error(`${label}: not visible ${selector}`);

  const { rect, viewport } = result;
  const tolerance = 1;
  if (rect.left < -tolerance || rect.right > viewport.width + tolerance) {
    throw new Error(`${label}: ${selector} horizontally outside viewport (${rect.left}, ${rect.right}, width ${viewport.width})`);
  }
}

async function openHome(page, origin) {
  await page.goto(`${origin}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#homeView:not(.hidden)");
  await waitForStablePage(page);
  await assertNoHorizontalOverflow(page, "home");
  await assertVisibleWithinViewport(page, "#startButton", "home start button");
  await assertVisibleWithinViewport(page, "#onlineButton", "home online button");
}

async function openOnlineEntry(page) {
  await page.click("#onlineButton");
  await page.waitForSelector("#onlineView:not(.hidden)");
  await waitForStablePage(page);
  await assertNoHorizontalOverflow(page, "online entry");
  await assertVisibleWithinViewport(page, "#onlineEntry", "online entry");
  await assertVisibleWithinViewport(page, "#createOnlineRoomButton", "online create button");
  await assertVisibleWithinViewport(page, "#joinOnlineRoomButton", "online join button");
}

async function openGameHand(page, origin) {
  await page.goto(`${origin}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#homeView:not(.hidden)");
  await page.click("#startButton");
  await page.waitForSelector("#roomView:not(.hidden)");
  await page.selectOption("#playerCount", "3");
  await page.$$eval("[data-player-role]", (selects) => {
    for (const select of selects) select.value = "human";
  });
  await page.click("#beginGameButton");
  await page.waitForSelector("#gameView:not(.hidden)");
  await page.waitForFunction(() => window.JIUZHOU_CARDS && typeof renderMobileCardSummary === "function");
  await waitForStablePage(page);
  await page.evaluate(() => {
    const cards = Object.values(window.JIUZHOU_CARDS.ages || {}).flat();
    const linkedCard = cards.find((card) =>
      Array.isArray(card.chain_from_icons) && card.chain_from_icons.length
      && Array.isArray(card.chain_to_icons) && card.chain_to_icons.length
    ) || cards.find((card) => Array.isArray(card.chain_from_icons) && card.chain_from_icons.length)
      || cards.find((card) => Array.isArray(card.chain_to_icons) && card.chain_to_icons.length);
    if (!linkedCard) throw new Error("No linked card found for mobile screenshot test.");

    const player = typeof currentPlayer === "function" ? currentPlayer() : null;
    const host = document.querySelector("#handCards") || document.querySelector("#current-hand");
    if (!host) throw new Error("Hand container not found.");
    host.innerHTML = `
      <article class="card ${linkedCard.color || ""} mobile-screenshot-target">
        ${renderMobileCardSummary(linkedCard, player)}
        <div class="action-buttons">
          <button class="primary">建造</button>
          <button>售出</button>
          <button>建区域</button>
        </div>
      </article>
    `;
    host.classList.remove("hidden");
    host.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(250);
}

async function assertMobileChainLayout(page, label) {
  await assertNoHorizontalOverflow(page, label);
  await assertVisibleWithinViewport(page, "#gameView", `${label} game view`);
  await assertVisibleWithinViewport(page, ".mobile-screenshot-target", `${label} hand card`);
  await assertVisibleWithinViewport(page, ".mobile-screenshot-target .mobile-card-value--cost", `${label} cost line`);
  await assertVisibleWithinViewport(page, ".mobile-screenshot-target .mobile-card-chain-row", `${label} chain row`);
  await assertVisibleWithinViewport(page, ".mobile-screenshot-target .action-buttons", `${label} action buttons`);

  const layout = await page.evaluate(() => {
    const card = document.querySelector(".mobile-screenshot-target");
    const costLine = card?.querySelector(".mobile-card-value--cost");
    const chainRow = card?.querySelector(".mobile-card-chain-row");
    const chainInCost = costLine?.querySelector(".mobile-card-chain-icons, .mobile-card-chain-text");
    const chainGroups = [...(chainRow?.querySelectorAll(".mobile-card-chain-group") || [])];
    const actionButtons = card?.querySelector(".action-buttons");
    const rectOf = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    };
    return {
      hasCostLine: Boolean(costLine),
      hasChainRow: Boolean(chainRow),
      chainInCost: Boolean(chainInCost),
      chainGroupCount: chainGroups.length,
      chainRowText: chainRow?.textContent.replace(/\s+/g, " ").trim() || "",
      costRect: costLine ? rectOf(costLine) : null,
      chainRect: chainRow ? rectOf(chainRow) : null,
      actionRect: actionButtons ? rectOf(actionButtons) : null,
      viewportWidth: window.innerWidth,
      overflowItems: [...document.querySelectorAll(".mobile-screenshot-target, .mobile-screenshot-target *")]
        .map((element) => ({ tag: element.tagName, className: element.className, rect: rectOf(element) }))
        .filter((item) => item.rect.left < -1 || item.rect.right > window.innerWidth + 1)
    };
  });

  if (!layout.hasCostLine) throw new Error(`${label}: missing cost line`);
  if (!layout.hasChainRow) throw new Error(`${label}: missing chain row`);
  if (layout.chainInCost) throw new Error(`${label}: chain icons/text are still inside the cost line`);
  if (layout.chainGroupCount < 1) throw new Error(`${label}: chain row has no from/to groups`);
  if (!layout.chainRowText.includes("前置") && !layout.chainRowText.includes("后续")) {
    throw new Error(`${label}: chain row does not label prerequisite/follow-up links`);
  }
  if (layout.chainRect.top <= layout.costRect.top) {
    throw new Error(`${label}: chain row is not below the cost line`);
  }
  if (layout.actionRect.top < layout.chainRect.bottom - 1) {
    throw new Error(`${label}: action buttons overlap the chain row`);
  }
  if (layout.overflowItems.length) {
    throw new Error(`${label}: elements overflow horizontally: ${JSON.stringify(layout.overflowItems.slice(0, 3))}`);
  }
}

async function run() {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const { server, origin } = await startStaticServer();
  const results = [];
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    for (const viewport of viewports) {
      const label = `${viewport.width}x${viewport.height}`;
      const page = await browser.newPage({
        viewport,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      });
      page.setDefaultTimeout(10000);
      page.on("dialog", (dialog) => dialog.accept());

      console.log(`[${label}] home`);
      await openHome(page, origin);
      await page.screenshot({ path: path.join(screenshotDir, `mobile-${label}-home.png`), fullPage: true });

      console.log(`[${label}] online entry`);
      await openOnlineEntry(page);
      await page.screenshot({ path: path.join(screenshotDir, `mobile-${label}-online.png`), fullPage: true });

      console.log(`[${label}] game hand`);
      await openGameHand(page, origin);
      await assertMobileChainLayout(page, label);
      const gameScreenshot = path.join(screenshotDir, `mobile-${label}.png`);
      await page.screenshot({ path: gameScreenshot, fullPage: true });

      results.push({ viewport: label, status: "passed", screenshot: gameScreenshot });
      console.log(`[${label}] passed`);
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  console.table(results);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
