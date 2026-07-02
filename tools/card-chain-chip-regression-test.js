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
    const cards = Object.values(window.JIUZHOU_CARDS.ages).flat();
    const board = boards.find((item) => item.id === "guanzhong") || boards[0];
    const cloneCard = (name) => {
      const card = cards.find((item) => item.name === name);
      if (!card) throw new Error(`Missing test card: ${name}`);
      return { ...card };
    };
    const hand = ["藏书楼", "诗书", "百工", "工坊", "城邑", "郡城", "中书省"].map(cloneCard);
    const built = ["藏书楼", "诗书", "百工", "工坊", "城邑", "郡城", "中书省"].map(cloneCard);
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
      hand,
      built,
      builtCards: built,
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
    api.state.cards = window.JIUZHOU_CARDS;
    api.state.seatCursor = 0;
    api.state.selected = {};
    api.state.pendingChoice = {};
    api.state.logs = [];
    api.showView("game");
    api.renderGame();
  });
  await page.waitForSelector(".card-chain-chip");
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
  await page.waitForSelector("#builtSlotDialog[open] .readonly-card .card-chain-chip", { state: "attached" });
  const result = await page.evaluate(() => {
    const texts = [...document.querySelectorAll(".card-chain-chip")].map((item) => item.textContent.trim());
    const titles = [...document.querySelectorAll(".card-chain-chip")].map((item) => item.getAttribute("title"));
    const ariaLabels = [...document.querySelectorAll(".card-chain-chip")].map((item) => item.getAttribute("aria-label"));
    const iconSrcs = [...document.querySelectorAll(".card-chain-chip__icon")].map((item) => item.getAttribute("src"));
    const handCard = document.querySelector("#handCards .card, #current-hand .card");
    const handPrev = handCard?.querySelector(".card-cost-rail .card-chain-chip--prev");
    const handNext = handCard?.querySelector(":scope > .card-chain-chips--next .card-chain-chip--next");
    const handPrevRect = handPrev?.getBoundingClientRect();
    const costRect = handCard?.querySelector(".card-cost-rail")?.getBoundingClientRect();
    const handNextRect = handNext?.getBoundingClientRect();
    const handCardRect = handCard?.getBoundingClientRect();
    return {
      texts,
      titles,
      ariaLabels,
      iconSrcs,
      iconCount: document.querySelectorAll(".card-chain-chip__icon").length,
      svgCount: document.querySelectorAll(`.card-${"link"}-label svg, .card-${"link"}-badge svg`).length,
      oldChainIconCount: document.querySelectorAll(".chain-icon, .card-link-icon").length,
      oldTextClassCount: document.querySelectorAll(`.mobile-card-chain-text, .card-${"link"}-label, .card-${"link"}-labels, .card-${"link"}-badge, .card-${"link"}-badges, .card-${"link"}-badge--prev, .card-${"link"}-badge--next`).length,
      handPrevCount: document.querySelectorAll("#handCards .card-cost-rail .card-chain-chip--prev, #current-hand .card-cost-rail .card-chain-chip--prev").length,
      handNextCount: document.querySelectorAll("#handCards .card > .card-chain-chips--next .card-chain-chip--next, #current-hand .card > .card-chain-chips--next .card-chain-chip--next").length,
      miniLabelCount: document.querySelectorAll(".built-mini-card .card-chain-chip").length,
      readonlyPrevCount: document.querySelectorAll("#builtSlotDialog .readonly-card .card-cost-rail .card-chain-chip--prev").length,
      readonlyNextCount: document.querySelectorAll("#builtSlotDialog .readonly-card > .card-chain-chips--next .card-chain-chip--next").length,
      mobileSummaryLabelCount: document.querySelectorAll(".mobile-card-summary .card-chain-chip").length,
      handPrevInCostRail: Boolean(handPrev && handPrev.closest(".card-cost-rail")),
      handNextInTopRight: Boolean(handNextRect && handCardRect && handNextRect.top <= handCardRect.top + 24 && handNextRect.right >= handCardRect.right - 96),
      handPrevBelowCost: Boolean(handPrevRect && costRect && handPrevRect.top >= costRect.top),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      isMobile: window.innerWidth <= 760,
      visibleText: document.body.innerText
    };
  });
  assert(result.texts.length > 0, `${screenshotName}: expected chain chips.`);
  assert(result.texts.every((text) => text === ""), `${screenshotName}: expected icon-only chain chips with no visible text.`);
  assert(result.iconCount === result.texts.length, `${screenshotName}: expected every chain chip to contain an icon image.`);
  for (const expectedIcon of ["chain_scriptorium_library.svg", "chain_library_senate.svg", "chain_workshop_laboratory.svg", "chain_laboratory_observatory.svg", "chain_baths_aqueduct.svg"]) {
    assert(result.iconSrcs.some((src) => src && src.endsWith(expectedIcon)), `${screenshotName}: expected chain icon ${expectedIcon}.`);
  }
  assert(!result.texts.includes("前"), `${screenshotName}: expected no single-character previous badge.`);
  assert(!result.texts.includes("后"), `${screenshotName}: expected no single-character next badge.`);
  const oldPrevText = `前置${"链接"}`;
  const oldNextText = `后续${"链接"}`;
  assert(!result.texts.includes(oldPrevText), `${screenshotName}: expected no generic previous link text.`);
  assert(!result.texts.includes(oldNextText), `${screenshotName}: expected no generic next link text.`);
  assert(result.svgCount === 0, `${screenshotName}: expected no old inline SVG chain badges.`);
  assert(result.titles.includes("由《诗书》免费升级建造"), `${screenshotName}: expected previous card-name title.`);
  assert(result.titles.includes("可升级为《中书省》"), `${screenshotName}: expected next card-name title.`);
  assert(result.ariaLabels.includes("由《诗书》免费升级建造"), `${screenshotName}: expected previous card-name aria-label.`);
  assert(result.ariaLabels.includes("可升级为《中书省》"), `${screenshotName}: expected next card-name aria-label.`);
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
  assert(!new RegExp("[\\u{1F517}\\u{26D3}]", "u").test(result.visibleText), `${screenshotName}: expected no emoji chain characters.`);
  assert(!result.visibleText.includes(oldPrevText), `${screenshotName}: expected no visible generic previous link text.`);
  assert(!result.visibleText.includes(oldNextText), `${screenshotName}: expected no visible generic next link text.`);
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
    const desktop = await verifyViewport(browser, origin, { width: 1440, height: 900 }, "card-chain-chip-desktop.png");
    const mobile = await verifyViewport(browser, origin, { width: 390, height: 844 }, "card-chain-chip-mobile-390x844.png");
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
