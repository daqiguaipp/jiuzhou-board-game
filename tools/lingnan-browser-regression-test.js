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
  await page.waitForFunction(() => window.__JIUZHOU_TEST_API__ && window.JIUZHOU_BOARDS);
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
}

async function seedHumanLingnanChoice(page) {
  await page.evaluate(() => {
    const api = window.__JIUZHOU_TEST_API__;
    const boards = window.JIUZHOU_BOARDS;
    const boardById = Object.fromEntries(boards.map((board) => [board.id, board]));
    const makePlayer = (id, name, board) => ({
      id,
      name,
      board,
      coins: 3,
      hand: [{ id: `${id}-hand`, name: `${name}手牌`, color: "blue", cost: [], points: 1 }],
      built: [],
      builtCards: [],
      stagesBuilt: 1,
      tucked: [],
      militaryTokens: [],
      coinLedger: [],
      coinLogs: [],
      specialScoreLogs: [],
      temporaryBuildDiscounts: [],
      freeFirstCardUsedByAge: {},
      extraCoinsFirstGainUsedByRound: {}
    });
    const lingnan = makePlayer("lingnan-human", "岭南玩家", boardById.lingnan);
    lingnan.pendingOverseasTradeChoice = true;
    api.state.mode = "hotseat";
    api.state.phase = "overseas-trade-choice";
    api.state.view = "game";
    api.state.age = 1;
    api.state.turn = 2;
    api.state.seatCursor = 0;
    api.state.players = [
      lingnan,
      makePlayer("qilu", "齐鲁玩家", boardById.qilu),
      makePlayer("heluo", "河洛玩家", boardById.heluo),
      makePlayer("hedong", "河东玩家", boardById.hedong)
    ];
    api.state.selected = {};
    api.state.pendingChoice = {};
    api.state.overseasTradeChoice = { age: 1, turn: 2, pendingPlayerIds: [lingnan.id], selectedPartnerId: "" };
    api.state.logs = [];
    api.showView("game");
    api.renderGame();
  });
  await page.waitForSelector("#overseasTradeDialog[open]");
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
  await seedHumanLingnanChoice(page);
  const before = await page.evaluate(() => ({
    cards: document.querySelectorAll(".overseas-choice-card").length,
    disabled: document.getElementById("confirmOverseasTradePartnerButton")?.disabled,
    overflow: document.documentElement.scrollWidth > window.innerWidth
  }));
  assert(before.cards === 1, `${screenshotName}: expected exactly one legal non-neighbor candidate.`);
  assert(before.disabled, `${screenshotName}: expected confirm disabled before candidate selection.`);
  assert(!before.overflow, `${screenshotName}: expected no horizontal overflow before selection.`);
  await page.locator(".overseas-choice-card").first().click();
  await page.waitForSelector(".overseas-choice-card.is-selected");
  const selected = await page.evaluate(() => ({
    disabled: document.getElementById("confirmOverseasTradePartnerButton")?.disabled,
    selected: document.querySelectorAll(".overseas-choice-card.is-selected").length
  }));
  assert(!selected.disabled, `${screenshotName}: expected confirm enabled after selection.`);
  assert(selected.selected === 1, `${screenshotName}: expected selected candidate highlight.`);
  const screenshotPath = path.join(rootDir, "screenshots", screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.locator("#confirmOverseasTradePartnerButton").click();
  await page.waitForFunction(() => {
    const api = window.__JIUZHOU_TEST_API__;
    return api.state.phase === "game" && api.state.turn === 3 && !document.getElementById("overseasTradeDialog")?.open;
  });
  const after = await page.evaluate(() => {
    const api = window.__JIUZHOU_TEST_API__;
    const player = api.state.players.find((item) => item.id === "lingnan-human");
    return {
      partnerId: player.overseasTradePartnerId,
      pending: Boolean(player.pendingOverseasTradeChoice),
      overflow: document.documentElement.scrollWidth > window.innerWidth
    };
  });
  assert(after.partnerId === "heluo", `${screenshotName}: expected human Lingnan selected non-neighbor.`);
  assert(!after.pending, `${screenshotName}: expected pending state cleared.`);
  assert(!after.overflow, `${screenshotName}: expected no horizontal overflow after confirmation.`);
  assert(errors.length === 0, `${screenshotName}: console errors:\n${errors.join("\n")}`);
  await page.close();
  return screenshotPath;
}

(async () => {
  fs.mkdirSync(path.join(rootDir, "screenshots"), { recursive: true });
  const { server, origin } = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, origin, { width: 1440, height: 900 }, "lingnan-overseas-desktop.png");
    const mobile = await verifyViewport(browser, origin, { width: 390, height: 844 }, "lingnan-overseas-mobile-390x844.png");
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
