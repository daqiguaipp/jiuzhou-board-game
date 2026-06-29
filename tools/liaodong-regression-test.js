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
  beatsInMilitary,
  resolveMilitary,
  scorePlayer,
  describeStage,
  addLiaodongResourceCard,
  prepareLiaodongResourceChoices,
  finalizeLiaodongResourceChoicesForPlayer,
  prepareLiaodongGuardChoices,
  startLiaodongGuardChoicePhase,
  chooseLiaodongGuardSideForAI
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

function makeMilitaryCard(id, shields) {
  return { id, name: id, color: "red", cost: [], shields, age: 1 };
}

function makePlayer(id, board, built = [], hand = []) {
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
    extraCoinsFirstGainUsedByRound: {}
  };
}

const boardsJson = JSON.parse(fs.readFileSync(boardJsonPath, "utf8").replace(/^\uFEFF/, ""));
const boardDataSource = fs.readFileSync(boardDataPath, "utf8");
const indexSource = fs.readFileSync(indexPath, "utf8");
const liaodong = boardsJson.find((board) => board.id === "liaodong");

assert(liaodong, "Expected Liaodong board to exist.");
assert(boardsJson[boardsJson.length - 1].id === "liaodong", "Expected Liaodong to be appended last.");
assert(liaodong.name === "辽东" && liaodong.subtitle === "山海边郡", "Expected Liaodong identity fields.");
assert(liaodong.startResource?.["石料"] === 1, "Expected Liaodong start resource to be stone.");
assert(liaodong.summary === "警戒边境，守住战线后获得屯垦资源；三时代无败额外得分", "Expected Liaodong summary.");
assert(liaodong.totem === "watchtower", "Expected Liaodong symbolic totem.");
assert(liaodong.stages?.[1]?.effects?.effect === "guardBothNeighbors", "Expected Liaodong stage 2 guard-both effect.");
assert(boardDataSource.includes('"id": "liaodong"'), "Expected wonderBoards-data.js to include Liaodong.");
assert(indexSource.includes("辽东擅长边郡警戒"), "Expected rules text to mention Liaodong.");

const api = loadGameApi();
const boards = api.normalizeBoards(boardsJson);
const boardById = Object.fromEntries(boards.map((board) => [board.id, board]));
const liaodongPlayer = makePlayer("liaodong", boardById.liaodong, [makeMilitaryCard("liao-red", 4)]);
const leftPlayer = makePlayer("left", boardById.qilu, [makeMilitaryCard("left-red", 6)]);
const rightPlayer = makePlayer("right", boardById.hexi, [makeMilitaryCard("right-red", 5)]);

api.state.boards = boards;
api.state.players = [leftPlayer, liaodongPlayer, rightPlayer];
api.state.age = 1;
api.state.turn = 1;
api.state.logs = [];
api.state.mode = "hotseat";
liaodongPlayer.liaodongGuardByAge = { 1: "left" };

assert(!api.beatsInMilitary(leftPlayer, liaodongPlayer), "Expected guarded left neighbor with +2 not to defeat Liaodong.");
leftPlayer.built = [makeMilitaryCard("left-red-7", 7)];
leftPlayer.builtCards = leftPlayer.built;
assert(api.beatsInMilitary(leftPlayer, liaodongPlayer), "Expected guarded left neighbor with +3 to defeat Liaodong.");
rightPlayer.built = [makeMilitaryCard("right-red-5", 5)];
rightPlayer.builtCards = rightPlayer.built;
assert(api.beatsInMilitary(rightPlayer, liaodongPlayer), "Expected unguarded right neighbor with +1 to defeat Liaodong normally.");
liaodongPlayer.built = [makeMilitaryCard("liao-red-6", 6)];
liaodongPlayer.builtCards = liaodongPlayer.built;
rightPlayer.built = [makeMilitaryCard("right-red-4", 4)];
rightPlayer.builtCards = rightPlayer.built;
assert(api.beatsInMilitary(liaodongPlayer, rightPlayer), "Expected Liaodong to still defeat the guarded neighbor normally when ahead.");

liaodongPlayer.stagesBuilt = 2;
liaodongPlayer.built = [makeMilitaryCard("liao-red-4b", 4)];
liaodongPlayer.builtCards = liaodongPlayer.built;
leftPlayer.built = [makeMilitaryCard("left-red-6b", 6)];
leftPlayer.builtCards = leftPlayer.built;
rightPlayer.built = [makeMilitaryCard("right-red-6b", 6)];
rightPlayer.builtCards = rightPlayer.built;
assert(!api.beatsInMilitary(leftPlayer, liaodongPlayer) && !api.beatsInMilitary(rightPlayer, liaodongPlayer), "Expected stage 2 to guard both neighbors with +3 threshold.");
leftPlayer.built = [makeMilitaryCard("left-red-7b", 7)];
leftPlayer.builtCards = leftPlayer.built;
rightPlayer.built = [makeMilitaryCard("right-red-7b", 7)];
rightPlayer.builtCards = rightPlayer.built;
assert(api.beatsInMilitary(leftPlayer, liaodongPlayer) && api.beatsInMilitary(rightPlayer, liaodongPlayer), "Expected stage 2 to allow defeat only at +3 or more on both sides.");

liaodongPlayer.stagesBuilt = 0;
api.state.age = 1;
liaodongPlayer.built = [makeMilitaryCard("liao-red-safe", 4)];
liaodongPlayer.builtCards = liaodongPlayer.built;
leftPlayer.built = [makeMilitaryCard("left-red-safe", 5)];
leftPlayer.builtCards = leftPlayer.built;
rightPlayer.built = [makeMilitaryCard("right-red-safe", 4)];
rightPlayer.builtCards = rightPlayer.built;
liaodongPlayer.militaryTokens = [];
leftPlayer.militaryTokens = [];
rightPlayer.militaryTokens = [];
liaodongPlayer.liaodongGuardByAge = { 1: "left" };
const militaryOutcome = api.resolveMilitary();
assert(militaryOutcome.liaodongResults.some((entry) => entry.playerId === "liaodong" && entry.safeThisAge), "Expected Liaodong safe-age result when no defeat token was gained.");
api.prepareLiaodongResourceChoices(militaryOutcome.liaodongResults);
assert(liaodongPlayer.pendingLiaodongResourceChoice?.age === 1, "Expected Liaodong pending resource choice after safe age.");
liaodongPlayer.pendingLiaodongResourceChoice.choice = "铁矿";
api.finalizeLiaodongResourceChoicesForPlayer(liaodongPlayer);
assert(liaodongPlayer.built.some((card) => card.name === "屯垦铁矿"), "Expected Liaodong resource card to be added to built cards.");
assert(liaodongPlayer.liaodongNoDefeatAges?.[1], "Expected Liaodong no-defeat age tracking.");

api.state.age = 3;
liaodongPlayer.pendingLiaodongResourceChoice = null;
api.prepareLiaodongResourceChoices([{ playerId: "liaodong", safeThisAge: true }]);
assert(!liaodongPlayer.pendingLiaodongResourceChoice, "Expected no Liaodong resource choice in Age III.");

liaodongPlayer.liaodongNoDefeatAges = { 1: true, 2: true, 3: true };
let score = api.scorePlayer(liaodongPlayer);
assert(score.specialEntries.some((entry) => entry.sourceName === "辽东区域特质" && entry.points === 6), "Expected Liaodong perfect-defense bonus.");
liaodongPlayer.liaodongNoDefeatAges = { 1: true, 2: false, 3: true };
score = api.scorePlayer(liaodongPlayer);
assert(!score.specialEntries.some((entry) => entry.sourceName === "辽东区域特质" && entry.points === 6), "Expected no Liaodong perfect-defense bonus after any defeat age.");

liaodongPlayer.stagesBuilt = 0;
liaodongPlayer.pendingLiaodongGuardChoice = { age: 2 };
api.state.age = 2;
assert(api.startLiaodongGuardChoicePhase(true), "Expected Liaodong guard-choice phase to start.");
leftPlayer.built = [makeMilitaryCard("left-threat", 6)];
leftPlayer.builtCards = leftPlayer.built;
rightPlayer.built = [makeMilitaryCard("right-weak", 3)];
rightPlayer.builtCards = rightPlayer.built;
assert(api.chooseLiaodongGuardSideForAI(liaodongPlayer, api.state.players) === "left", "Expected AI to guard the stronger neighboring threat.");

assert(api.describeStage(boardById.liaodong.stages[1]).includes("同时警戒左右两方"), "Expected Liaodong stage 2 description.");

console.log("liaodong regression checks passed");
