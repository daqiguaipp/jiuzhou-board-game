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
  buildTradeOptions,
  canPay,
  canPlayerProvideTradePurchases,
  getTradeResourceAvailability,
  resolveMilitary,
  beatsInMilitary,
  getResources,
  getPlayerResources
};
`;
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    location: { protocol: "file:" },
    crypto: { randomUUID: () => "test-uuid" },
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      documentElement: {},
      body: {},
      querySelector: () => null,
      addEventListener: () => {},
      getElementById: () => ({ innerHTML: "", textContent: "", classList: { add: () => {}, remove: () => {}, toggle: () => {} } })
    },
    window: {}
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: appPath });
  return sandbox.__testApi;
}

function makePlayer(id, board, coins, shields = 0, built = []) {
  return {
    id,
    name: id,
    board,
    coins,
    hand: [],
    built: shields ? [{ id: `${id}-military`, name: `${id}武备`, color: "red", shields }] : [],
    stagesBuilt: 0,
    tucked: [],
    militaryTokens: [],
    coinLedger: [],
    coinLogs: [],
    specialScoreLogs: [],
    temporaryBuildDiscounts: [],
    freeFirstCardUsedByAge: {},
    extraCoinsFirstGainUsedByRound: {},
    ...built.length ? { built: [...(shields ? [{ id: `${id}-military`, name: `${id}武备`, color: "red", shields }] : []), ...built] } : {}
  };
}

const expectedMobeiAbility = "时代末武备结算时，每战胜 1 方邻国，夺取该邻国当前铜钱数的一半，向下取整，最多夺取 5 枚；若该邻国至少有 1 枚铜钱，则至少夺取 1 枚。若左右两方都战胜，分别结算。";
const expectedHexiAbility = "支付建造卡牌或建设区域成本时，你自己拥有的陶器、简帛、布匹可以互相视为任意一种高级资源；从邻国购买来的资源不能因此转换。";
const boardsJson = JSON.parse(fs.readFileSync(boardJsonPath, "utf8").replace(/^\uFEFF/, ""));
const boardDataSource = fs.readFileSync(boardDataPath, "utf8");
const indexSource = fs.readFileSync(indexPath, "utf8");

const mobei = boardsJson.find((board) => board.id === "mobei");
const hexi = boardsJson.find((board) => board.id === "hexi");

assert(mobei?.name === "漠北", "Expected data/wonderBoards.json to contain the Mobei board.");
assert(hexi?.name === "河西", "Expected data/wonderBoards.json to contain the Hexi board.");
assert(mobei?.ability === expectedMobeiAbility, "Expected Mobei ability text to match the specified plunder rule.");
assert(hexi?.ability === expectedHexiAbility, "Expected Hexi ability text to match the specified advanced-resource rule.");
assert(mobei.stages?.[0]?.effects?.military === 1, "Expected Mobei stage 1 to grant military +1.");
assert(mobei.stages?.[1]?.effects?.points === 6, "Expected Mobei stage 2 to grant 6 points.");
assert(mobei.stages?.[2]?.effects?.points === 9, "Expected Mobei stage 3 to grant 9 points.");
assert(hexi.stages?.[0]?.effects?.points === 3, "Expected Hexi stage 1 to grant 3 points.");
assert(hexi.stages?.[1]?.effects?.coins === 6 && hexi.stages?.[1]?.effects?.points === 3, "Expected Hexi stage 2 to grant 6 coins and 3 points.");
assert(hexi.stages?.[2]?.effects?.points === 9, "Expected Hexi stage 3 to grant 9 points.");
assert(boardDataSource.includes('"id": "mobei"') && boardDataSource.includes('"id": "hexi"'), "Expected wonderBoards-data.js to include Mobei and Hexi.");
assert(indexSource.includes("漠北擅长劫掠") && indexSource.includes("河西擅长丝路贸易"), "Expected rules text to explain Mobei and Hexi.");

const api = loadGameApi();
const boards = api.normalizeBoards(boardsJson);
const boardById = Object.fromEntries(boards.map((board) => [board.id, board]));

function setPlayers(players, age = 1) {
  api.state.players = players;
  api.state.age = age;
  api.state.turn = 6;
  api.state.logs = [];
}

const leftRich = makePlayer("leftRich", boardById.qilu, 14, 0);
const mobeiStrong = makePlayer("mobeiStrong", boardById.mobei, 2, 3);
const rightSix = makePlayer("rightSix", boardById.heluo, 6, 0);
setPlayers([leftRich, mobeiStrong, rightSix], 1);
api.resolveMilitary();
assert(leftRich.coins === 9, "Mobei should plunder at most 5 coins from a 14-coin neighbor.");
assert(rightSix.coins === 3, "Mobei should plunder half rounded down from a 6-coin neighbor.");
assert(mobeiStrong.coins === 10, "Mobei should receive coins directly from both defeated neighbors.");

const leftOne = makePlayer("leftOne", boardById.qilu, 1, 0);
const mobeiOne = makePlayer("mobeiOne", boardById.mobei, 0, 2);
const rightZero = makePlayer("rightZero", boardById.heluo, 0, 0);
setPlayers([leftOne, mobeiOne, rightZero], 1);
api.resolveMilitary();
assert(leftOne.coins === 0 && mobeiOne.coins === 1, "Mobei should plunder 1 coin from a defeated 1-coin neighbor and 0 from a 0-coin neighbor.");

const jiangnanDefender = makePlayer("jiangnanDefender", boardById.jiangnan, 6, 1);
const mobeiPlusOne = makePlayer("mobeiPlusOne", boardById.mobei, 0, 2);
const rightFiller = makePlayer("rightFiller", boardById.heluo, 0, 9);
setPlayers([jiangnanDefender, mobeiPlusOne, rightFiller], 1);
api.resolveMilitary();
assert(jiangnanDefender.coins === 6 && mobeiPlusOne.coins === 0, "Mobei must not bypass two-point defense when only 1 shield higher.");

const hexiPlayer = makePlayer("hexiPlayer", boardById.hexi, 10, 0, [
  { id: "hexi-cloth-a", name: "布匹A", color: "gray", produces: ["布匹"] },
  { id: "hexi-cloth-b", name: "布匹B", color: "gray", produces: ["布匹"] },
  { id: "hexi-pottery", name: "陶器A", color: "gray", produces: ["陶器"] }
]);
setPlayers([makePlayer("left", boardById.qilu, 3), hexiPlayer, makePlayer("right", boardById.heluo, 3)], 2);
const hexiFlexiblePayment = api.canPay(hexiPlayer, { "简帛": 2, "布匹": 1 });
assert(hexiFlexiblePayment.ok, "Hexi should pay advanced-resource costs by converting its own advanced resources.");

const leftPottery = makePlayer("leftPottery", boardById.yanzhao, 3, 0, [
  { id: "left-pottery", name: "邻国陶器", color: "gray", produces: ["陶器"] }
]);
const hexiNeedsPurchasedPottery = makePlayer("hexiNeedsPurchasedPottery", boardById.hexi, 10, 0, [
  { id: "hexi-cloth-1", name: "布匹1", color: "gray", produces: ["布匹"] },
  { id: "hexi-cloth-2", name: "布匹2", color: "gray", produces: ["布匹"] }
]);
setPlayers([leftPottery, hexiNeedsPurchasedPottery, makePlayer("rightEmpty", boardById.heluo, 3)], 2);
const cannotConvertPurchased = api.canPay(hexiNeedsPurchasedPottery, { "简帛": 4 });
assert(!cannotConvertPurchased.ok, "Hexi must not convert a purchased advanced resource into another advanced resource.");
const canUsePurchasedAsItself = api.canPay(hexiNeedsPurchasedPottery, { "陶器": 1, "简帛": 1, "布匹": 1 });
assert(canUsePurchasedAsItself.ok, "Hexi should still be able to buy and use an advanced resource as itself.");

const buyer = makePlayer("buyer", boardById.qilu, 10);
const hexiSeller = makePlayer("hexiSeller", boardById.hexi, 3, 0, [
  { id: "seller-cloth", name: "河西布匹", color: "gray", produces: ["布匹"] }
]);
setPlayers([makePlayer("far", boardById.heluo, 3), buyer, hexiSeller], 2);
assert(!api.canPlayerProvideTradePurchases(hexiSeller, { "简帛": 1 }), "Other players must not buy converted advanced resources from Hexi.");
assert(api.canPlayerProvideTradePurchases(hexiSeller, { "布匹": 1 }), "Other players can buy Hexi's actual produced advanced resources.");

assert(!api.canPay(hexiPlayer, { "粮食": 1 }).ok, "Hexi must not convert advanced resources into basic resources.");
const hexiBasic = makePlayer("hexiBasic", boardById.hexi, 10, 0, [{ id: "wood", name: "木材", color: "brown", produces: ["木材"] }]);
setPlayers([makePlayer("leftIron", boardById.yanzhao, 3), hexiBasic, makePlayer("rightFood", boardById.mobei, 3)], 2);
assert(!api.canPay(hexiBasic, { "简帛": 2 }).ok, "Hexi must not convert basic resources into advanced resources.");

console.log("mobei/hexi regression checks passed");
