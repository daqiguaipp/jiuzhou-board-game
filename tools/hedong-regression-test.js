const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const appPath = path.join(root, "app.js");
const boardJsonPath = path.join(root, "data", "wonderBoards.json");
const boardDataPath = path.join(root, "data", "wonderBoards-data.js");
const indexPath = path.join(root, "index.html");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadGameApi() {
  let source = fs.readFileSync(appPath, "utf8").replace(/^\uFEFF/, "");
  source = source.replace(/loadData\(\)\s*\n\s*\.then\(setupEvents\)\s*\n\s*\.catch\([\s\S]*?\n\s*\}\);?\s*$/m, "");
  source += `
globalThis.__testApi = {
  state,
  normalizeBoards,
  executeAction,
  scorePlayer,
  describeStage,
  addToDiscardPile,
  buildCardFromDiscardPile,
  canBuildCardFromDiscardPile,
  startHedongDiscardBuildChoicePhase,
  finalizeHedongDiscardBuildChoice,
  chooseBestDiscardPileCardForAI,
  startSeventhCardStage
};
`;
  const elements = {};
  const element = (id = "") => elements[id] || (elements[id] = {
    id,
    innerHTML: "",
    textContent: "",
    disabled: false,
    open: false,
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    dataset: {},
    style: {},
    addEventListener: () => {},
    setAttribute: () => {},
    removeAttribute: () => {},
    showModal() { this.open = true; },
    close() { this.open = false; },
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 100, height: 100 })
  });
  const sandbox = {
    console,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    location: { protocol: "file:", search: "" },
    crypto: { randomUUID: () => "test-uuid" },
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      documentElement: {},
      body: { classList: { add: () => {}, remove: () => {}, toggle: () => {} } },
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      getElementById: element
    },
    window: {}
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: appPath });
  return sandbox.__testApi;
}

function makePlayer(id, board, hand = [], built = []) {
  return {
    id,
    name: id,
    board,
    coins: 3,
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
    extraCoinsFirstGainUsedByRound: {},
    soldCardCount: 0
  };
}

const boardsJson = JSON.parse(fs.readFileSync(boardJsonPath, "utf8").replace(/^\uFEFF/, ""));
const boardDataSource = fs.readFileSync(boardDataPath, "utf8");
const indexSource = fs.readFileSync(indexPath, "utf8");
const boardIds = boardsJson.map((board) => board.id);
const guanzhongIndex = boardIds.indexOf("guanzhong");
const hedongIndex = boardIds.indexOf("hedong");
const qiluIndex = boardIds.indexOf("qilu");
const hedong = boardsJson.find((board) => board.id === "hedong");

assert(hedong, "Expected Hedong board to exist.");
assert(guanzhongIndex >= 0 && hedongIndex === guanzhongIndex + 1 && qiluIndex === hedongIndex + 1, "Expected Hedong after Guanzhong and before Qilu.");
assert(!boardsJson.some((board) => "tags" in board || "routeTags" in board || "difficultyTags" in board), "Expected no route tag fields on board data.");
assert(hedong.name === "河东" && hedong.subtitle === "太行盐铁", "Expected Hedong identity fields.");
assert(hedong.startResource?.["铁矿"] === 1, "Expected Hedong start resource to be iron.");
assert(hedong.summary === "卖牌获得更多铜钱，终局按卖牌数量额外得分", "Expected Hedong summary.");
assert(hedong.themeColor && hedong.accentColor && hedong.tintColor && hedong.totem, "Expected Hedong theme fields.");
assert(hedong.stages?.[0]?.name === "晋阳铁冶" && hedong.stages[0].effects?.points === 3, "Expected Hedong stage 1.");
assert(hedong.stages?.[1]?.name === "盐铁官营" && hedong.stages[1].effects?.effect === "buildFromDiscardPile", "Expected Hedong stage 2 discard build effect.");
assert(hedong.stages?.[2]?.name === "太行关塞" && hedong.stages[2].effects?.points === 9, "Expected Hedong stage 3.");
assert(boardDataSource.includes('"id": "hedong"'), "Expected wonderBoards-data.js to include Hedong.");
assert(indexSource.includes("河东擅长盐铁财政"), "Expected rules text to mention Hedong.");

const api = loadGameApi();
const boards = api.normalizeBoards(boardsJson);
const boardById = Object.fromEntries(boards.map((board) => [board.id, board]));
const sellCard = { id: "sell-card", name: "Sell Card", color: "blue", cost: [], points: 2, age: 1 };
const yellowCard = { id: "yellow-card", name: "Yellow Card", color: "yellow", type: "commercial", cost: [], coins: 4, age: 1 };
const duplicateCard = { id: "duplicate-card", name: "Already Built", color: "blue", cost: [], points: 3, age: 1 };
const lastCard = { id: "last-card", name: "Last Card", color: "red", cost: [], shields: 1, age: 1 };

api.state.boards = boards;
api.state.mode = "hotseat";
api.state.phase = "game";
api.state.age = 1;
api.state.turn = 3;
api.state.discardPile = [];
api.state.logs = [];
api.state.players = [
  makePlayer("hedong", boardById.hedong, [sellCard], []),
  makePlayer("qilu", boardById.qilu, [], []),
  makePlayer("heluo", boardById.heluo, [lastCard], [])
];

api.executeAction(api.state.players[0], sellCard, { action: "sell" });
assert(api.state.players[0].coins === 8, "Expected Hedong selling to grant 5 coins.");
assert(api.state.players[0].soldCardCount === 1, "Expected Hedong sold-card count to increment.");
assert(api.state.discardPile.length === 1 && api.state.discardPile[0].id === "sell-card", "Expected Hedong sold card to enter discard pile.");
assert(api.state.logs.some((line) => line.includes("河东技能") && line.includes("获得5铜钱")), "Expected Hedong sell log to mention ability and 5 coins.");

api.state.players[0].soldCardCount = 7;
let score = api.scorePlayer(api.state.players[0]);
assert(score.specialEntries.some((entry) => entry.sourceName === "河东区域特质" && entry.points === 3), "Expected Hedong final scoring source for 7 sold cards.");
api.state.players[0].soldCardCount = 13;
score = api.scorePlayer(api.state.players[0]);
assert(score.specialEntries.some((entry) => entry.sourceName === "河东区域特质" && entry.points === 6), "Expected Hedong final scoring cap at 6.");

assert(api.describeStage(boardById.hedong.stages[1]).includes("弃牌堆") && api.describeStage(boardById.hedong.stages[1]).includes("免费建造"), "Expected Hedong stage 2 description.");

api.state.discardPile = [];
api.addToDiscardPile(yellowCard, api.state.players[1], "sell");
assert(api.canBuildCardFromDiscardPile(api.state.players[0], api.state.discardPile[0]).ok, "Expected legal discard pile card to be selectable.");
const buildResult = api.buildCardFromDiscardPile(api.state.players[0], "yellow-card");
assert(buildResult.ok, "Expected Hedong to free-build selected discard card.");
assert(api.state.players[0].built.some((card) => card.id === "yellow-card"), "Expected selected discard card to enter built cards.");
assert(api.state.discardPile.length === 0, "Expected selected discard card to be removed from discard pile.");
assert(api.state.players[0].coins >= 12, "Expected yellow card build reward to trigger.");

api.state.players[0].built = [{ id: "existing", name: "Already Built", color: "blue" }];
api.state.players[0].builtCards = api.state.players[0].built;
api.state.discardPile = [];
api.addToDiscardPile(duplicateCard, api.state.players[1], "sell");
assert(!api.canBuildCardFromDiscardPile(api.state.players[0], api.state.discardPile[0]).ok, "Expected duplicate card names to be blocked.");
assert(!api.chooseBestDiscardPileCardForAI(api.state.players[0]), "Expected AI to skip when no legal discard card exists.");

api.state.players[0].stagesBuilt = 2;
api.state.players[0].pendingHedongDiscardBuildChoice = true;
api.state.discardPile = [];
api.addToDiscardPile({ ...yellowCard, id: "yellow-2", name: "Yellow 2" }, api.state.players[1], "sell");
assert(api.startHedongDiscardBuildChoicePhase(true), "Expected Hedong discard choice phase to start.");
api.finalizeHedongDiscardBuildChoice(api.state.players[0], "yellow-2");
assert(api.state.players[0].built.some((card) => card.id === "yellow-2"), "Expected phase finalization to build selected card.");
assert(!api.state.players[0].pendingHedongDiscardBuildChoice, "Expected phase finalization to clear pending choice.");

api.state.phase = "game";
api.state.players[0].hand = [{ id: "non-heluo-last", name: "Non Heluo Last", color: "blue", cost: [], points: 1 }];
api.state.players[1].hand = [];
api.state.players[2].hand = [lastCard];
api.state.players[2].stagesBuilt = 2;
api.state.discardPile = [];
assert(api.startSeventhCardStage(false), "Expected Heluo seventh-card stage to start.");
assert(api.state.discardPile.some((card) => card.id === "non-heluo-last"), "Expected non-Heluo final hand to enter discard pile when Heluo seventh-card stage starts.");

console.log("hedong regression checks passed");
