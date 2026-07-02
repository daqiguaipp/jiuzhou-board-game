const fs = require("fs");
const http = require("http");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const localBrowserPath = path.join(rootDir, ".ms-playwright");
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(localBrowserPath)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowserPath;
}

const { chromium } = require("playwright");

const screenshotDir = path.join(rootDir, "screenshots");

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
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, origin: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

async function waitForReady(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(() => window.__JIUZHOU_TEST_API__ && window.JIUZHOU_BOARDS && window.JIUZHOU_CARDS);
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all([...document.images].map((image) => (
      image.complete ? Promise.resolve() : new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      })
    )));
  });
}

function consoleErrorsFor(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function seedHedongChoice(page, mode = "hotseat") {
  await page.evaluate((nextMode) => {
    const api = window.__JIUZHOU_TEST_API__;
    const boards = window.JIUZHOU_BOARDS;
    const hedong = boards.find((board) => board.id === "hedong");
    const qilu = boards.find((board) => board.id === "qilu");
    const heluo = boards.find((board) => board.id === "heluo");
    const card = {
      id: `hedong-test-card-${nextMode}`,
      name: nextMode === "online" ? "联机河东测试牌" : "河东测试牌",
      color: "yellow",
      type: "commercial",
      cost: [],
      coins: 2,
      age: 1
    };
    const makePlayer = (id, name, board, hand = []) => ({
      id,
      name,
      board,
      coins: 3,
      hand,
      built: [],
      builtCards: [],
      stagesBuilt: 2,
      tucked: [],
      militaryTokens: [],
      coinLedger: [],
      coinLogs: [],
      specialScoreLogs: [],
      temporaryBuildDiscounts: [],
      freeFirstCardUsedByAge: {},
      extraCoinsFirstGainUsedByRound: {}
    });
    const hedongPlayer = makePlayer("hedong-player", "河东玩家", hedong, [{ id: "hand-a", name: "手牌甲", color: "blue", cost: [], points: 1 }]);
    hedongPlayer.pendingHedongDiscardBuildChoice = true;
    api.state.mode = nextMode;
    api.state.phase = "game";
    api.state.view = "game";
    api.state.players = [
      hedongPlayer,
      makePlayer("qilu-player", "齐鲁玩家", qilu, [{ id: "hand-b", name: "手牌乙", color: "red", cost: [], shields: 1 }]),
      makePlayer("heluo-player", "河洛玩家", heluo, [{ id: "hand-c", name: "手牌丙", color: "green", cost: [], science: { text: 1 } }])
    ];
    api.state.age = 1;
    api.state.turn = 2;
    api.state.seatCursor = 0;
    api.state.selected = {};
    api.state.pendingChoice = {};
    api.state.logs = [];
    api.state.discardPile = [{
      ...card,
      discardPileId: `discard-${card.id}`,
      discardedAt: Date.now(),
      discardedAge: 1,
      discardedTurn: 2,
      discardedByPlayerId: "qilu-player",
      discardedByPlayerName: "齐鲁玩家",
      discardReason: "sell"
    }];
    api.state.discardPilePicker = null;
    api.state.hedongDiscardChoice = null;
    api.state.resolvedSpecialEffects = {};
    if (nextMode === "online") {
      localStorage.setItem("playerId", "hedong-player");
      localStorage.setItem("jiuzhou.playerId", "hedong-player");
      const writes = [];
      api.state.online.roomCode = "TEST";
      api.state.online.localPlayerId = "hedong-player";
      api.state.online.hostId = "hedong-player";
      api.state.online.isHost = true;
      api.state.online.resolving = false;
      api.state.online.roomData = {};
      api.state.online.roomRef = {
        writes,
        update: async (payload) => {
          writes.push(payload);
          return null;
        }
      };
    } else {
      api.state.online.isHost = false;
      api.state.online.roomRef = null;
    }
    api.startHedongDiscardBuildChoicePhase(true);
  }, mode);
  await page.waitForSelector("#discardPileDialog[open]");
  await page.waitForSelector(".discard-choice-card");
}

async function verifyCurrentChoice(page, mode, screenshotName) {
  const before = await page.evaluate(() => ({
    phase: window.__JIUZHOU_TEST_API__.state.phase,
    turn: window.__JIUZHOU_TEST_API__.state.turn,
    dialogOpen: document.getElementById("discardPileDialog")?.open,
    confirmDisabled: document.getElementById("discardChoiceConfirmButton")?.disabled,
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    choiceCards: document.querySelectorAll(".discard-choice-card").length
  }));
  assert(before.phase === "hedong-discard-choice", `${mode}: expected Hedong choice phase.`);
  assert(before.dialogOpen, `${mode}: expected discard choice dialog to open once.`);
  assert(before.confirmDisabled, `${mode}: expected confirm disabled before card selection.`);
  assert(!before.overflow, `${mode}: expected no horizontal overflow before selection.`);
  assert(before.choiceCards > 0, `${mode}: expected discard choice cards.`);

  await page.locator(".discard-choice-card").first().click();
  await page.waitForSelector(".discard-choice-card.is-selected");
  const selected = await page.evaluate(() => ({
    selectedCards: document.querySelectorAll(".discard-choice-card.is-selected").length,
    confirmDisabled: document.getElementById("discardChoiceConfirmButton")?.disabled
  }));
  assert(selected.selectedCards === 1, `${mode}: expected exactly one selected discard card.`);
  assert(!selected.confirmDisabled, `${mode}: expected confirm enabled after selection.`);

  await page.screenshot({ path: path.join(screenshotDir, screenshotName), fullPage: true });
  await page.locator("#discardChoiceConfirmButton").click();
  await page.waitForFunction(() => {
    const api = window.__JIUZHOU_TEST_API__;
    return api.state.phase === "game" && api.state.turn === 3 && !document.getElementById("discardPileDialog")?.open;
  });
  const after = await page.evaluate(() => {
    const api = window.__JIUZHOU_TEST_API__;
    const player = api.state.players.find((item) => item.id === "hedong-player");
    api.renderGame();
    return {
      phase: api.state.phase,
      turn: api.state.turn,
      pending: Boolean(player.pendingHedongDiscardBuildChoice),
      builtNames: player.built.map((card) => card.name),
      discardCount: api.state.discardPile.length,
      dialogOpenAfterRender: document.getElementById("discardPileDialog")?.open,
      logText: api.state.logs.join("\n"),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      syncWrites: api.state.online.roomRef?.writes?.length || 0
    };
  });
  assert(after.phase === "game", `${mode}: expected game phase after confirmation.`);
  assert(after.turn === 3, `${mode}: expected next turn after confirmation.`);
  assert(!after.pending, `${mode}: expected pending Hedong flag cleared.`);
  assert(after.builtNames.some((name) => name.includes("河东测试牌")), `${mode}: expected selected discard card to be built.`);
  assert(after.discardCount === 0, `${mode}: expected selected card removed from discard pile.`);
  assert(!after.dialogOpenAfterRender, `${mode}: expected no repeated dialog after render.`);
  assert(after.logText.includes("河东从弃牌堆取回"), `${mode}: expected Hedong discard recovery log.`);
  assert(!after.overflow, `${mode}: expected no horizontal overflow after confirmation.`);
  if (mode === "online") assert(after.syncWrites > 0, "online: expected host sync writes.");
}

async function verifyEmptyPileSkip(page) {
  await page.evaluate(() => {
    const api = window.__JIUZHOU_TEST_API__;
    const player = api.state.players[0];
    api.state.mode = "hotseat";
    api.state.phase = "game";
    api.state.turn = 4;
    api.state.discardPile = [];
    api.state.logs = [];
    api.state.resolvedSpecialEffects = {};
    player.pendingHedongDiscardBuildChoice = true;
    api.startHedongDiscardBuildChoicePhase(false);
  });
  const result = await page.evaluate(() => {
    const api = window.__JIUZHOU_TEST_API__;
    return {
      phase: api.state.phase,
      pending: Boolean(api.state.players[0].pendingHedongDiscardBuildChoice),
      logText: api.state.logs.join("\n"),
      dialogOpen: document.getElementById("discardPileDialog")?.open
    };
  });
  assert(result.phase === "game", "empty pile: expected phase to stay game and continue resolve.");
  assert(!result.pending, "empty pile: expected pending flag cleared.");
  assert(result.logText.includes("弃牌堆为空，河东奖励未触发。"), "empty pile: expected skip log.");
  assert(!result.dialogOpen, "empty pile: expected no dialog.");
}

(async () => {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const { server, origin } = await startServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of [
      { name: "desktop", width: 1440, height: 900 },
      { name: "mobile-390x844", width: 390, height: 844 }
    ]) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      const errors = consoleErrorsFor(page);
      await page.goto(origin, { waitUntil: "domcontentloaded" });
      await waitForReady(page);
      await seedHedongChoice(page, "hotseat");
      await verifyCurrentChoice(page, `hotseat ${viewport.name}`, `hedong-discard-${viewport.name}.png`);
      if (viewport.name === "desktop") await verifyEmptyPileSkip(page);
      assert(errors.length === 0, `${viewport.name}: console errors:\n${errors.join("\n")}`);
      results.push(`${viewport.name}: passed`);
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = consoleErrorsFor(page);
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await waitForReady(page);
    await seedHedongChoice(page, "online");
    await verifyCurrentChoice(page, "online host mobile", "hedong-discard-online-mobile-390x844.png");
    assert(errors.length === 0, `online: console errors:\n${errors.join("\n")}`);
    results.push("online host mobile: passed");
    await page.close();

    console.log(results.join("\n"));
    console.log(`screenshots: ${path.join(screenshotDir, "hedong-discard-*.png")}`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
