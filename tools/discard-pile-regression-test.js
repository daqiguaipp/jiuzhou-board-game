const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const appPath = path.join(root, "app.js");
const indexPath = path.join(root, "index.html");
const stylesPath = path.join(root, "styles.css");
const boardsPath = path.join(root, "data", "wonderBoards.json");

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
  addToDiscardPile,
  removeFromDiscardPile,
  discardLastCards,
  executeAction,
  buildCardFromDiscardPile,
  canBuildCardFromDiscardPile,
  openDiscardPilePicker,
  gameSnapshot,
  applyRoomGameState,
  renderDiscardPileDialog
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
    location: { protocol: "file:" },
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
    extraCoinsFirstGainUsedByRound: {}
  };
}

const appSource = fs.readFileSync(appPath, "utf8");
const indexSource = fs.readFileSync(indexPath, "utf8");
const stylesSource = fs.readFileSync(stylesPath, "utf8");

assert(appSource.includes("discardPile"), "Expected app state and online snapshot code to mention discardPile.");
assert(appSource.includes("function addToDiscardPile"), "Expected addToDiscardPile helper.");
assert(appSource.includes("function openDiscardPilePicker"), "Expected future picker helper.");
assert(indexSource.includes("discardPileEntry"), "Expected hand panel discard pile entry.");
assert(indexSource.includes("discardPileDialog"), "Expected discard pile dialog markup.");
assert(stylesSource.includes(".discard-pile-entry"), "Expected discard pile entry styling.");
assert(stylesSource.includes(".discard-pile-card"), "Expected discard pile card styling.");
const discardEntryStyle = stylesSource.match(/\.discard-pile-entry\s*\{([^}]*)\}/i)?.[1] || "";
assert(!/position:\s*absolute/i.test(discardEntryStyle), "Expected discard pile entry to stay in normal hand-panel flow instead of covering cards.");
assert(/margin:\s*12px 0 0 auto/i.test(discardEntryStyle), "Expected desktop discard pile entry to align to the right edge of the hand panel.");

const api = loadGameApi();
const boards = api.normalizeBoards(JSON.parse(fs.readFileSync(boardsPath, "utf8").replace(/^\uFEFF/, "")));
const boardById = Object.fromEntries(boards.map((board) => [board.id, board]));
const sellCard = { id: "sell-card", name: "Sell Card", color: "blue", cost: [], points: 3, age: 1 };
const wonderCard = { id: "wonder-card", name: "Wonder Card", color: "brown", cost: [], produces: ["粮食"], age: 1 };
const lastCard = { id: "last-card", name: "Last Card", color: "red", cost: [], shields: 1, age: 1 };
const usedSeventhCard = { id: "used-seventh", name: "Used Seventh", color: "green", cost: [], science: { "经学": 1 }, age: 1 };
const freeBuildCard = { id: "free-build", name: "Free Build", color: "yellow", cost: ["木材"], coins: 2, age: 1 };

api.state.boards = boards;
api.state.players = [
  makePlayer("player-a", boardById.guanzhong, [sellCard]),
  makePlayer("player-b", boardById.heluo, [lastCard])
];
api.state.age = 1;
api.state.turn = 6;
api.state.discardPile = [];
api.state.logs = [];

const firstEntry = api.addToDiscardPile(sellCard, api.state.players[0], "sell");
assert(api.state.discardPile.length === 1, "Expected addToDiscardPile to append one card.");
assert(firstEntry.discardReason === "sell", "Expected discard reason metadata.");
assert(firstEntry.discardedByPlayerId === "player-a", "Expected discarded player id metadata.");
assert(firstEntry.discardedAge === 1 && firstEntry.discardedTurn === 6, "Expected age and turn metadata.");
assert(api.removeFromDiscardPile("sell-card")?.id === "sell-card", "Expected removeFromDiscardPile to remove by card id.");
assert(api.state.discardPile.length === 0, "Expected removed card to disappear from discard pile.");

api.executeAction(api.state.players[0], sellCard, { action: "sell" });
assert(api.state.players[0].coins === 6, "Expected selling to grant 3 coins.");
assert(api.state.discardPile.length === 1 && api.state.discardPile[0].id === "sell-card", "Expected sold card to enter discard pile.");

api.state.discardPile = [];
api.executeAction(api.state.players[0], wonderCard, { action: "wonder", payment: { total: 0 }, stage: boardById.guanzhong.stages[0] });
assert(api.state.discardPile.length === 0, "Expected cards used for region construction to stay out of discard pile.");

api.state.players[0].hand = [];
api.state.players[1].hand = [lastCard];
api.discardLastCards(["player-a"]);
assert(api.state.players.every((player) => player.hand.length === 0), "Expected final hands to be cleared.");
assert(api.state.discardPile.length === 1 && api.state.discardPile[0].id === "last-card", "Expected only unused last cards to enter discard pile.");

api.state.discardPile = [];
api.state.players[0].hand = [];
api.state.players[1].hand = [usedSeventhCard];
api.discardLastCards([]);
assert(api.state.discardPile.length === 1 && api.state.discardPile[0].id === "used-seventh", "Expected unused seventh card leftovers to enter discard pile.");

api.state.discardPile = [api.addToDiscardPile(freeBuildCard, api.state.players[1], "ageEnd")];
api.state.players[0].built = [{ id: "existing", name: "Already Built", color: "blue" }];
api.state.players[0].builtCards = api.state.players[0].built;
assert(api.canBuildCardFromDiscardPile(api.state.players[0], api.state.discardPile[0]).ok, "Expected selectable discard card with no duplicate name.");
api.buildCardFromDiscardPile(api.state.players[0], "free-build");
assert(api.state.discardPile.length === 0, "Expected free-built card to be removed from discard pile.");
assert(api.state.players[0].built.some((card) => card.id === "free-build"), "Expected free-built card to enter built cards.");

api.state.discardPile = [api.addToDiscardPile({ ...freeBuildCard, id: "dupe", name: "Already Built" }, api.state.players[1], "sell")];
assert(!api.canBuildCardFromDiscardPile(api.state.players[0], api.state.discardPile[0]).ok, "Expected duplicate names to be blocked in picker mode.");

const snapshot = api.gameSnapshot();
assert(Array.isArray(snapshot.discardPile), "Expected gameSnapshot to include discardPile.");
api.applyRoomGameState({
  status: "playing",
  phase: "game",
  age: 1,
  round: 2,
  players: Object.fromEntries(api.state.players.map((player) => [player.id, player])),
  game: { discardPile: [{ id: "synced-card", name: "Synced", color: "blue", cost: ["木材"] }] }
});
assert(api.state.discardPile.length === 1 && api.state.discardPile[0].id === "synced-card", "Expected applyRoomGameState to read synced discardPile.");

api.openDiscardPilePicker(api.state.players[0], { title: "Pick" });
const discardDialogHtml = api.renderDiscardPileDialog();
assert(discardDialogHtml.includes("Synced"), "Expected discard pile dialog to render card names.");
assert(!discardDialogHtml.includes("&lt;span"), "Expected discard pile cost icons to render as HTML instead of escaped tag text.");

console.log("discard pile regression checks passed");
