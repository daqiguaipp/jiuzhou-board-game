const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const appPath = path.join(root, "app.js");
const boardsPath = path.join(root, "data", "wonderBoards.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadGameApi() {
  let source = fs.readFileSync(appPath, "utf8").replace(/^\uFEFF/, "");
  const bootIndex = source.indexOf("\nloadData()");
  if (bootIndex >= 0) source = source.slice(0, bootIndex);
  source += `
globalThis.__testApi = {
  state,
  normalizeBoards,
  scorePlayer,
  resolveTurn,
  startOverseasTradeChoicePhase,
  getLingnanTradeCandidates,
  chooseLingnanTradePartnerForAI,
  setLingnanOverseasTradePartner,
  pendingOverseasTradeChoicePlayers
};
`;
  const elements = {};
  const element = (id = "") => elements[id] || (elements[id] = {
    id,
    value: "",
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
    location: { protocol: "http:", hostname: "127.0.0.1", search: "" },
    crypto: { randomUUID: () => "test-uuid" },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    document: {
      documentElement: {},
      body: { dataset: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} } },
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

function makeYellowCards(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `yellow-${index + 1}`,
    name: `黄牌${index + 1}`,
    color: "yellow",
    type: "commercial",
    cost: [],
    points: 0,
    coins: 0,
    age: 1,
    builtAge: 1
  }));
}

function setupRound(api, players) {
  api.state.mode = "hotseat";
  api.state.phase = "game";
  api.state.age = 1;
  api.state.turn = 1;
  api.state.seatCursor = 0;
  api.state.players = players;
  api.state.cards = {
    ages: {
      "1": players.flatMap((player) => player.hand),
      "2": [],
      "3": []
    }
  };
  api.state.selected = Object.fromEntries(players.map((player) => {
    const card = player.hand[0];
    if (player.board.id === "lingnan") {
      return [player.id, { action: "wonder", cardId: card.id, payment: { total: 0 } }];
    }
    return [player.id, { action: "sell", cardId: card.id }];
  }));
  api.state.pendingChoice = {};
  api.state.logs = [];
}

const api = loadGameApi();
const boards = api.normalizeBoards(JSON.parse(fs.readFileSync(boardsPath, "utf8").replace(/^\uFEFF/, "")));
const boardById = Object.fromEntries(boards.map((board) => [board.id, board]));

const lingnanPlayer = makePlayer("lingnan", boardById.lingnan, [], makeYellowCards(5));
const lingnanScore = api.scorePlayer(lingnanPlayer);
assert(lingnanScore.lingnanCommerceBonus === 5, "Expected Lingnan five yellow cards to grant +5 Lingnan commerce bonus.");
assert(lingnanScore.commerce === lingnanScore.commerceBase + 5, "Expected Lingnan bonus to be included in commerce.");
assert(!lingnanScore.specialEntries.some((entry) => entry.sourceName === "岭南商业牌加成"), "Expected Lingnan commerce bonus to stay out of special entries.");
assert(lingnanScore.guild === 0, "Expected Lingnan yellow-card bonus to stay out of guild score.");

const qiluPlayer = makePlayer("qilu", boardById.qilu, [], makeYellowCards(5));
const qiluScore = api.scorePlayer(qiluPlayer);
assert(qiluScore.lingnanCommerceBonus === 0, "Expected non-Lingnan player to have no Lingnan commerce bonus.");
assert(!qiluScore.specialEntries.some((entry) => entry.sourceName === "岭南商业牌加成"), "Expected non-Lingnan player to show no Lingnan special entry.");

const lingnanAi = makePlayer("lingnan-ai", boardById.lingnan, [{ id: "ln-wonder", name: "岭南建设牌", color: "blue", cost: [], points: 1 }]);
lingnanAi.kind = "ai";
const qilu = makePlayer("qilu", boardById.qilu, [{ id: "qilu-sell", name: "齐鲁卖牌", color: "blue", cost: [], points: 1 }]);
const heluo = makePlayer("heluo", boardById.heluo, [{ id: "heluo-sell", name: "河洛卖牌", color: "blue", cost: [], points: 1 }]);
const hedong = makePlayer("hedong", boardById.hedong, [{ id: "hedong-sell", name: "河东卖牌", color: "blue", cost: [], points: 1 }]);
setupRound(api, [lingnanAi, qilu, heluo, hedong]);
api.resolveTurn(false);
assert(api.state.phase === "game", "Expected AI Lingnan sea-trade choice to resolve without stuck phase.");
assert(api.state.turn === 2, "Expected turn to advance after AI Lingnan auto choice.");
assert(lingnanAi.overseasTradePartnerId === "heluo", "Expected AI Lingnan to choose the only non-neighbor in a 4-player game.");
assert(!lingnanAi.pendingOverseasTradeChoice, "Expected AI Lingnan pending sea-trade choice to be cleared.");
assert(api.state.logs.some((line) => line.includes("岭南开通海上贸易通道")), "Expected AI Lingnan auto choice log.");

const lingnanThree = makePlayer("lingnan-3p", boardById.lingnan, [{ id: "ln-3p", name: "岭南三人建设牌", color: "blue", cost: [], points: 1 }]);
lingnanThree.kind = "ai";
setupRound(api, [
  lingnanThree,
  makePlayer("qilu-3p", boardById.qilu, [{ id: "qilu-3p-card", name: "齐鲁三人牌", color: "blue", cost: [], points: 1 }]),
  makePlayer("heluo-3p", boardById.heluo, [{ id: "heluo-3p-card", name: "河洛三人牌", color: "blue", cost: [], points: 1 }])
]);
api.resolveTurn(false);
assert(api.state.phase === "game", "Expected 3-player Lingnan to avoid impossible sea-trade choice phase.");
assert(api.state.turn === 2, "Expected 3-player Lingnan round to advance.");
assert(!lingnanThree.pendingOverseasTradeChoice, "Expected 3-player Lingnan to have no pending sea-trade choice.");
assert(!lingnanThree.overseasTradePartnerId, "Expected 3-player Lingnan to skip overseas trade partner.");

console.log("lingnan regression checks passed");
