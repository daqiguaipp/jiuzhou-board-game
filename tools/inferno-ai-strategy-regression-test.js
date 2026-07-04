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
  const bootIndex = source.indexOf("\nloadData()");
  if (bootIndex >= 0) source = source.slice(0, bootIndex);
  source += `
globalThis.__testApi = {
  state,
  pickAIChoice
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
    console: { ...console, log: () => {} },
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

function makeBoard(id, stages = []) {
  return { id, name: id, stages };
}

function makePlayer(id, board, hand = [], built = []) {
  return {
    id,
    name: id,
    board,
    kind: "ai",
    aiDifficulty: "inferno",
    coins: 3,
    hand,
    built,
    stagesBuilt: 0,
    freeFirstCardEachAgeUsed: {}
  };
}

function card(id, fields = {}) {
  return {
    id,
    name: id,
    color: "blue",
    type: "civic",
    age: 1,
    cost: [],
    points: 0,
    coins: 0,
    shields: 0,
    produces: [],
    ...fields
  };
}

function choose(api, player, players, age, turn) {
  api.state.players = players;
  api.state.age = age;
  api.state.turn = turn;
  return api.pickAIChoice(player);
}

const api = loadGameApi();

{
  const board = makeBoard("guanzhong");
  const yellow = card("age1-market", { color: "yellow", coins: 2, tradeDiscount: true });
  const blue = card("age1-points", { color: "blue", points: 4 });
  const player = makePlayer("inferno", board, [yellow, blue]);
  const players = [player, makePlayer("left", makeBoard("left")), makePlayer("right", makeBoard("right"))];
  const choice = choose(api, player, players, 1, 1);
  assert(choice.cardId === yellow.id, `Expected inferno AI to open with yellow economy, got ${choice.cardId}`);
}

{
  const board = makeBoard("neutral");
  const red = card("late-military-swing", { color: "red", shields: 1 });
  const blue = card("late-points", { color: "blue", points: 8 });
  const player = makePlayer("inferno", board, [red, blue], [card("old-shield", { color: "red", shields: 1 })]);
  const left = makePlayer("left", makeBoard("left"), [], [card("left-shields", { color: "red", shields: 2 })]);
  const right = makePlayer("right", makeBoard("right"), [], [card("right-shields", { color: "red", shields: 2 })]);
  const choice = choose(api, player, [player, left, right], 3, 6);
  assert(choice.cardId === red.id, `Expected inferno AI to make a meaningful late military swing, got ${choice.cardId}`);
}

{
  const board = makeBoard("qilu");
  const science = card("complete-science-set", { color: "green", scienceSymbol: "史学", points: 0 });
  const blue = card("raw-points", { color: "blue", points: 7 });
  const built = [
    card("jing", { color: "green", scienceSymbol: "经学" }),
    card("gong", { color: "green", scienceSymbol: "工学" })
  ];
  const player = makePlayer("inferno", board, [science, blue], built);
  const players = [player, makePlayer("left", makeBoard("left")), makePlayer("right", makeBoard("right"))];
  const choice = choose(api, player, players, 2, 4);
  assert(choice.cardId === science.id, `Expected inferno AI to complete science sets, got ${choice.cardId}`);
}

{
  const board = makeBoard("heluo");
  const chainSeed = card("chain-seed", { color: "blue", points: 2, chain_to: ["strong-later-card"] });
  const rawPoints = card("raw-age1-points", { color: "blue", points: 3 });
  const player = makePlayer("inferno", board, [chainSeed, rawPoints]);
  const players = [player, makePlayer("left", makeBoard("left")), makePlayer("right", makeBoard("right"))];
  const choice = choose(api, player, players, 1, 2);
  assert(choice.cardId === chainSeed.id, `Expected inferno AI to seed blue chains in Age I, got ${choice.cardId}`);
}

console.log("inferno AI strategy regression checks passed");
