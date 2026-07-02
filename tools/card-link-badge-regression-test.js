const fs = require("fs");
const http = require("http");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const localBrowserPath = path.join(rootDir, ".ms-playwright");
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(localBrowserPath)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowserPath;
}

const { chromium } = require("playwright");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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
    ".webp": "image/webp",
    ".svg": "image/svg+xml"
  }[ext] || "application/octet-stream";
}

function startServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const relativePath = decodeURIComponent(url.pathname) === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
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
    server.listen(0, "127.0.0.1", () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }));
  });
}

async function waitForReady(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(() => window.__JIUZHOU_TEST_API__ && window.JIUZHOU_BOARDS && window.JIUZHOU_CARDS);
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
}

async function seedLinkedCards(page) {
  await page.evaluate(() => {
    const api = window.__JIUZHOU_TEST_API__;
    const boards = window.JIUZHOU_BOARDS;
    const board = boards.find((item) => item.id === "guanzhong") || boards[0];
    const linkedCard = {
      id: "link-badge-hand-card",
      name: "链接徽章测试",
      color: "blue",
      type: "civilian",
      age: 2,
      builtAge: 2,
      cost: ["木材"],
      produces: [],
      points: 2,
      shields: 0,
      coins: 0,
      scienceSymbol: null,
      tradeDiscount: null,
      effect: null,
      chainKey: "test-link-current",
      chain_from: "test-link-prev",
      chain_to: ["test-link-next"],
      chain_from_icons: ["chain_school_study.svg"],
      chain_to_icons: ["chain_library_senate.svg"],
      displayName: "链接徽章测试"
    };
    const builtLinkedCard = {
      ...linkedCard,
      id: "link-badge-built-card",
      name: "已建链接测试",
      builtAge: 1
    };
    api.state.mode = "hotseat";
    api.state.phase = "game";
    api.state.view = "game";
    api.state.age = 2;
    api.state.turn = 1;
    api.state.players = [{
      id: "p1",
      name: "测试玩家",
      board,
      coins: 10,
      hand: [linkedCard],
      built: [builtLinkedCard],
      builtCards: [builtLinkedCard],
      stagesBuilt: 0,
      tucked: [],
      militaryTokens: [],
      coinLedger: [],
      coinLogs: [],
      specialScoreLogs: [],
      temporaryBuildDiscounts: [],
      freeFirstCardUsedByAge: {},
      extraCoinsFirstGainUsedByRound: {}
    }, {
      id: "p2",
      name: "玩家二",
      board: boards.find((item) => item.id === "qilu") || board,
      coins: 3,
      hand: [],
      built: [],
      builtCards: [],
      stagesBuilt: 0,
      tucked: [],
      militaryTokens: []
    }, {
      id: "p3",
      name: "玩家三",
      board: boards.find((item) => item.id === "heluo") || board,
      coins: 3,
      hand: [],
      built: [],
      builtCards: [],
      stagesBuilt: 0,
      tucked: [],
      militaryTokens: []
    }];
    api.state.cards = {
      ages: {
        "1": [{ ...builtLinkedCard, chainKey: "test-link-prev" }],
        "2": [linkedCard],
        "3": [{ ...linkedCard, id: "link-next-card", name: "后续链接测试", chainKey: "test-link-next" }]
      }
    };
    api.state.seatCursor = 0;
    api.state.selected = {};
    api.state.pendingChoice = {};
    api.state.logs = [];
    api.showView("game");
    api.renderGame();
  });
  await page.waitForSelector(".card-link-badge");
}

async function verifyViewport(browser, origin, viewport, screenshotName) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await waitForReady(page);
  await seedLinkedCards(page);
  await page.evaluate(() => window.openBuiltSlotDetail("p1", "blue"));
  await page.waitForSelector("#builtSlotDialog[open] .readonly-card .card-link-badge", { state: "attached" });
  const result = await page.evaluate(() => {
    const texts = [...document.querySelectorAll(".card-link-badge")].map((item) => item.textContent.trim());
    const titles = [...document.querySelectorAll(".card-link-badge")].map((item) => item.getAttribute("title"));
    return {
      texts,
      titles,
      oldChainIconCount: document.querySelectorAll(".chain-icon, .card-link-icon").length,
      handBadgeCount: document.querySelectorAll("#handCards .card-link-badge, #current-hand .card-link-badge").length,
      miniBadgeCount: document.querySelectorAll(".built-mini-card .card-link-badge").length,
      readonlyBadgeCount: document.querySelectorAll("#builtSlotDialog .readonly-card .card-link-badge").length,
      overflow: document.documentElement.scrollWidth > window.innerWidth
    };
  });
  assert(result.texts.includes("前"), `${screenshotName}: expected previous link badge text.`);
  assert(result.texts.includes("后"), `${screenshotName}: expected next link badge text.`);
  assert(result.texts.every((text) => text === "前" || text === "后"), `${screenshotName}: expected only stable Chinese badge text.`);
  assert(result.titles.includes("可由上一时代建筑免费升级"), `${screenshotName}: expected previous badge title.`);
  assert(result.titles.includes("可升级到下一时代建筑"), `${screenshotName}: expected next badge title.`);
  assert(result.oldChainIconCount === 0, `${screenshotName}: expected no old chain icon elements.`);
  assert(result.handBadgeCount >= 2, `${screenshotName}: expected hand card badges.`);
  assert(result.miniBadgeCount >= 2, `${screenshotName}: expected built mini card badges.`);
  assert(result.readonlyBadgeCount >= 2, `${screenshotName}: expected built detail card badges.`);
  assert(!result.overflow, `${screenshotName}: expected no horizontal overflow.`);
  assert(errors.length === 0, `${screenshotName}: console errors:\n${errors.join("\n")}`);
  const screenshotPath = path.join(rootDir, "screenshots", screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.close();
  return screenshotPath;
}

(async () => {
  fs.mkdirSync(path.join(rootDir, "screenshots"), { recursive: true });
  const { server, origin } = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, origin, { width: 1440, height: 900 }, "card-link-badge-desktop.png");
    const mobile = await verifyViewport(browser, origin, { width: 390, height: 844 }, "card-link-badge-mobile-390x844.png");
    console.log(`desktop: passed ${desktop}`);
    console.log(`mobile-390x844: passed ${mobile}`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
