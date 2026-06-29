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
  scorePlayer,
  describeStage,
  getJingchuColorBonus,
  hasActiveJingchuPeek,
  getJingchuIncomingPlayer,
  renderJingchuPeekButton,
  renderJingchuPeekDialogBody
};
`;
  const element = () => ({
    innerHTML: "",
    textContent: "",
    open: false,
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    addEventListener: () => {},
    setAttribute: () => {},
    showModal() { this.open = true; },
    close() { this.open = false; },
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 100, height: 100 })
  });
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    location: { protocol: "file:" },
    crypto: { randomUUID: () => "test-uuid" },
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      documentElement: {},
      body: { classList: { add: () => {}, remove: () => {}, toggle: () => {} } },
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      getElementById: () => element()
    },
    window: {}
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: appPath });
  return sandbox.__testApi;
}

function makePlayer(id, board, built = [], stagesBuilt = 0, hand = []) {
  return {
    id,
    name: id,
    board,
    coins: 3,
    hand,
    built,
    stagesBuilt,
    tucked: [],
    militaryTokens: [],
    coinLedger: [],
    coinLogs: [],
    specialScoreLogs: [],
    temporaryBuildDiscounts: [],
    freeFirstCardUsedByAge: {},
    extraCoinsFirstGainUsedByRound: {}
  };
}

const boardsJson = JSON.parse(fs.readFileSync(boardJsonPath, "utf8").replace(/^\uFEFF/, ""));
const boardDataSource = fs.readFileSync(boardDataPath, "utf8");
const indexSource = fs.readFileSync(indexPath, "utf8");
const boardIds = boardsJson.map((board) => board.id);
const heluoIndex = boardIds.indexOf("heluo");
const jingchuIndex = boardIds.indexOf("jingchu");
const yanzhaoIndex = boardIds.indexOf("yanzhao");
const jingchu = boardsJson.find((board) => board.id === "jingchu");

assert(jingchu, "Expected Jingchu board to exist.");
assert(heluoIndex >= 0 && jingchuIndex === heluoIndex + 1 && yanzhaoIndex === jingchuIndex + 1, "Expected Jingchu to be inserted after Heluo and before Yanzhao.");
assert(!boardsJson.some((board) => "tags" in board || "routeTags" in board || "difficultyTags" in board), "Expected no route tag fields on board data.");
assert(jingchu.name === "荆楚" && jingchu.subtitle === "云梦巫风", "Expected Jingchu identity fields.");
assert(jingchu.startResource?.["木材"] === 1, "Expected Jingchu start resource to be wood.");
assert(jingchu.summary === "多色发展，终局按已建卡牌颜色得分", "Expected Jingchu summary.");
assert(jingchu.themeColor && jingchu.accentColor && jingchu.tintColor && jingchu.totem, "Expected Jingchu theme fields.");
assert(jingchu.stages?.[0]?.name === "云梦泽薮" && jingchu.stages[0].effects?.coins === 5 && !jingchu.stages[0].effects?.points, "Expected Jingchu stage 1 to grant 5 coins only.");
assert(jingchu.stages?.[1]?.effects?.effect === "peekIncomingHandThisAge", "Expected Jingchu stage 2 peek effect.");
assert(jingchu.stages?.[2]?.effects?.points === 9, "Expected Jingchu stage 3 to grant 9 points.");
assert(boardDataSource.includes('"id": "jingchu"'), "Expected wonderBoards-data.js to include Jingchu.");
assert(indexSource.includes("荆楚擅长多色发展"), "Expected rules text to mention Jingchu.");

const api = loadGameApi();
const boards = api.normalizeBoards(boardsJson);
const boardById = Object.fromEntries(boards.map((board) => [board.id, board]));
const builtColors = ["brown", "gray", "blue", "red", "yellow", "green", "purple", "blue"].map((color, index) => ({
  id: `card-${index}`,
  name: `测试${color}${index}`,
  color
}));
const jingchuPlayer = makePlayer("jingchu", boardById.jingchu, builtColors, 2);
jingchuPlayer.peekIncomingHandAge = 1;
api.state.players = [
  makePlayer("left", boardById.qilu, [], 0, [{ id: "left-card", name: "左手牌", color: "blue", cost: [], points: 2 }]),
  jingchuPlayer,
  makePlayer("right", boardById.heluo, [], 0, [{ id: "right-card", name: "右手牌", color: "red", cost: ["铁矿"], shields: 1 }])
];
api.state.age = 1;
api.state.turn = 3;
api.state.mode = "hotseat";
api.state.phase = "game";

const score = api.scorePlayer(jingchuPlayer);
assert(api.getJingchuColorBonus(jingchuPlayer) === 7, "Expected Jingchu color bonus to cap at 7 colors.");
assert(score.specialEntries.some((entry) => entry.sourceName === "荆楚区域特质" && entry.points === 7), "Expected score panel source entry for Jingchu color bonus.");
assert(api.describeStage(boardById.jingchu.stages[0]).includes("铜钱") && api.describeStage(boardById.jingchu.stages[0]).includes("5"), "Expected stage 1 reward display to be +5 coins.");
assert(api.describeStage(boardById.jingchu.stages[1]).includes("查看来牌上家"), "Expected stage 2 reward display to describe incoming-hand peek.");

assert(api.hasActiveJingchuPeek(jingchuPlayer), "Expected Jingchu peek to be active in the same age.");
assert(api.getJingchuIncomingPlayer(jingchuPlayer)?.id === "right", "Expected Age I incoming hand source to be right neighbor.");
api.state.age = 2;
assert(!api.hasActiveJingchuPeek(jingchuPlayer), "Expected Jingchu peek to expire in the next age.");

jingchuPlayer.peekIncomingHandAge = 2;
api.state.age = 2;
api.state.seatCursor = 1;
assert(api.getJingchuIncomingPlayer(jingchuPlayer)?.id === "left", "Expected Age II incoming hand source to switch with pass direction.");
assert(api.renderJingchuPeekButton(jingchuPlayer).includes("查看来牌上家手牌"), "Expected local peek button prompt.");
assert(api.renderJingchuPeekDialogBody(jingchuPlayer).includes("左手牌"), "Expected peek dialog to show readonly incoming hand cards.");

console.log("jingchu regression checks passed");
