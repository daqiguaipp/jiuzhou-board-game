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
      name: "链牌测试",
      color: "blue",
      type: "civilian",
      age: 2,
      builtAge: 2,
      cost: ["wood"],
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
      displayName: "链牌测试"
    };
    const builtLinkedCard = {
      ...linkedCard,
      id: "link-badge-built-card",
      name: "已建链牌",
      builtAge: 1
    };
    api.state.mode = "hotseat";
    api.state.phase = "game";
    api.state.view = "game";
    api.state.age = 2;
    api.state.turn = 1;
    api.state.players = [{
      id: "p1",
      name: "Test Player",
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
      name: "Player Two",
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
      name: "Player Three",
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
        "3": [{ ...linkedCard, id: "link-next-card", name: "后续链牌", chainKey: "test-link-next" }]
      }
    };
    api.state.seatCursor = 0;
    api.state.selected = {};
    api.state.pendingChoice = {};
    api.state.logs = [];
    api.showView("game");
    api.renderGame();
  });
  await page.waitForSelector(".card-link-label");
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
  await page.waitForSelector("#builtSlotDialog[open] .readonly-card .card-link-label", { state: "attached" });
  const result = await page.evaluate(() => {
    const texts = [...document.querySelectorAll(".card-link-label")].map((item) => item.textContent.trim());
    const titles = [...document.querySelectorAll(".card-link-label")].map((item) => item.getAttribute("title"));
    const ariaLabels = [...document.querySelectorAll(".card-link-label")].map((item) => item.getAttribute("aria-label"));
    const handCard = document.querySelector("#handCards .card, #current-hand .card");
    const handPrev = handCard?.querySelector(".card-cost-rail .card-link-label--prev");
    const handNext = handCard?.querySelector(":scope > .card-link-label--next");
    const handPrevRect = handPrev?.getBoundingClientRect();
    const costRect = handCard?.querySelector(".card-cost-rail")?.getBoundingClientRect();
    const handNextRect = handNext?.getBoundingClientRect();
    const handCardRect = handCard?.getBoundingClientRect();
    return {
      texts,
      titles,
      ariaLabels,
      svgCount: document.querySelectorAll(".card-link-label svg, .card-link-badge svg").length,
      oldChainIconCount: document.querySelectorAll(".chain-icon, .card-link-icon").length,
      oldTextClassCount: document.querySelectorAll(".mobile-card-chain-text, .card-link-badge, .card-link-badges, .card-link-badge--prev, .card-link-badge--next").length,
      handPrevCount: document.querySelectorAll("#handCards .card-cost-rail .card-link-label--prev, #current-hand .card-cost-rail .card-link-label--prev").length,
      handNextCount: document.querySelectorAll("#handCards .card > .card-link-label--next, #current-hand .card > .card-link-label--next").length,
      miniLabelCount: document.querySelectorAll(".built-mini-card .card-link-label").length,
      readonlyPrevCount: document.querySelectorAll("#builtSlotDialog .readonly-card .card-cost-rail .card-link-label--prev").length,
      readonlyNextCount: document.querySelectorAll("#builtSlotDialog .readonly-card > .card-link-label--next").length,
      mobileSummaryLabelCount: document.querySelectorAll(".mobile-card-summary .card-link-label").length,
      handPrevInCostRail: Boolean(handPrev && handPrev.closest(".card-cost-rail")),
      handNextInTopRight: Boolean(handNextRect && handCardRect && handNextRect.top <= handCardRect.top + 24 && handNextRect.right >= handCardRect.right - 96),
      handPrevBelowCost: Boolean(handPrevRect && costRect && handPrevRect.top >= costRect.top),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      isMobile: window.innerWidth <= 760,
      visibleText: document.body.innerText
    };
  });
  assert(result.texts.includes("前置链接"), `${screenshotName}: expected previous link label text.`);
  assert(result.texts.includes("后续链接"), `${screenshotName}: expected next link label text.`);
  assert(!result.texts.includes("前"), `${screenshotName}: expected no single-character previous badge.`);
  assert(!result.texts.includes("后"), `${screenshotName}: expected no single-character next badge.`);
  assert(result.svgCount === 0, `${screenshotName}: expected no SVG chain badges.`);
  assert(result.titles.includes("可由上一时代前置建筑免费升级"), `${screenshotName}: expected previous label title.`);
  assert(result.titles.includes("可升级到下一时代后续建筑"), `${screenshotName}: expected next label title.`);
  assert(result.ariaLabels.includes("可由上一时代前置建筑免费升级"), `${screenshotName}: expected previous label aria-label.`);
  assert(result.ariaLabels.includes("可升级到下一时代后续建筑"), `${screenshotName}: expected next label aria-label.`);
  assert(result.oldChainIconCount === 0, `${screenshotName}: expected no old chain icon elements.`);
  assert(result.oldTextClassCount === 0, `${screenshotName}: expected no old text badge classes.`);
  assert(result.handPrevCount >= 1, `${screenshotName}: expected hand previous label in cost rail.`);
  assert(result.handNextCount >= 1, `${screenshotName}: expected hand next label in top right.`);
  assert(result.miniLabelCount >= 1, `${screenshotName}: expected built mini card label.`);
  assert(result.readonlyPrevCount >= 1, `${screenshotName}: expected built detail previous label in cost rail.`);
  assert(result.readonlyNextCount >= 1, `${screenshotName}: expected built detail next label in top right.`);
  assert(result.mobileSummaryLabelCount >= 1, `${screenshotName}: expected mobile summary label fallback.`);
  if (!result.isMobile) {
    assert(result.handPrevInCostRail, `${screenshotName}: expected previous label inside cost rail.`);
    assert(result.handPrevBelowCost, `${screenshotName}: expected previous label below cost column area.`);
    assert(result.handNextInTopRight, `${screenshotName}: expected next label near top right.`);
  }
  assert(!/[🔗⛓]/u.test(result.visibleText), `${screenshotName}: expected no emoji chain characters.`);
  assert(!result.overflow, `${screenshotName}: expected no horizontal overflow.`)
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
