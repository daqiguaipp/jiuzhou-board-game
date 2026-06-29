const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const appPath = path.join(root, "app.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadGameApi() {
  let source = fs.readFileSync(appPath, "utf8").replace(/^\uFEFF/, "");
  source = source.replace(/loadData\(\)\s*\n\s*\.then\(setupEvents\)\s*\n\s*\.catch\([\s\S]*?\n\s*\}\);?\s*$/m, "");
  source += `
globalThis.__testApi = {
  state,
  resolveBuiltCardSettlement
};
`;
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
      getElementById: () => null
    },
    window: {}
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: appPath });
  return sandbox.__testApi;
}

function makeCard(id, color) {
  return { id, name: id, color, type: color === "yellow" ? "commercial" : "resource", cost: [] };
}

function makePlayer(id, built = []) {
  return {
    id,
    name: id,
    board: { id: "qilu", name: "\u9f50\u9c81", stages: [] },
    coins: 0,
    built,
    builtCards: built,
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

const api = loadGameApi();
const selfAndNeighborsText = "\u81ea\u5df1\u548c\u5de6\u53f3\u90bb";
const self = makePlayer("self", [makeCard("self-brown-1", "brown"), makeCard("self-brown-2", "brown")]);
const left = makePlayer("left", [makeCard("left-brown", "brown"), makeCard("left-gray", "gray")]);
const right = makePlayer("right", [
  makeCard("right-brown-1", "brown"),
  makeCard("right-brown-2", "brown"),
  makeCard("right-brown-3", "brown"),
  makeCard("right-gray", "gray")
]);
api.state.players = [left, self, right];
api.state.age = 2;
api.state.turn = 1;

const vineyard = {
  ...makeCard("vineyard", "yellow"),
  name: "\u6f15\u8fd0",
  perNeighborColorCoins: { brown: 1 }
};
self.built.push(vineyard);
api.resolveBuiltCardSettlement(self, vineyard);
assert(self.coins === 6, `Expected self plus both neighbors' brown cards to grant 6 coins, got ${self.coins}.`);
assert(vineyard.resolvedCoins === 6, `Expected resolvedCoins to be 6, got ${vineyard.resolvedCoins}.`);
assert(vineyard.resolvedReason.includes(selfAndNeighborsText) && vineyard.resolvedReason.includes("\u5171 6 \u5f20"), `Unexpected resolved reason: ${vineyard.resolvedReason}`);

const bazaar = {
  ...makeCard("bazaar", "yellow"),
  name: "\u5e02\u8236\u53f8",
  perNeighborColorCoins: { gray: 2 }
};
self.built.push(bazaar);
api.resolveBuiltCardSettlement(self, bazaar);
assert(self.coins === 10, `Expected self plus both neighbors' gray cards to add 4 coins, got total ${self.coins}.`);
assert(bazaar.resolvedCoins === 4, `Expected gray resolvedCoins to be 4, got ${bazaar.resolvedCoins}.`);
assert(bazaar.resolvedReason.includes(selfAndNeighborsText) && bazaar.resolvedReason.includes("\u5171 2 \u5f20"), `Unexpected gray resolved reason: ${bazaar.resolvedReason}`);

console.log("yellow neighbor coin regression checks passed");
