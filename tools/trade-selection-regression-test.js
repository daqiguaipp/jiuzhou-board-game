const fs = require("fs");
const path = require("path");
const vm = require("vm");

const appPath = path.join(__dirname, "..", "app.js");
const appSource = fs.readFileSync(appPath, "utf8");

function extractFunction(name) {
  const marker = `function ${name}`;
  const start = appSource.indexOf(marker);
  if (start < 0) throw new Error(`Missing function ${name}`);
  const openParen = appSource.indexOf("(", start);
  if (openParen < 0) throw new Error(`Missing parameter list for ${name}`);
  let parenDepth = 0;
  let bodyStart = -1;
  for (let index = openParen; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "(") parenDepth += 1;
    else if (char === ")") parenDepth -= 1;
    else if (char === "{" && parenDepth === 0) {
      bodyStart = index;
      break;
    }
  }
  if (bodyStart < 0) throw new Error(`Missing function body for ${name}`);
  let braceDepth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") braceDepth += 1;
    else if (char === "}") {
      braceDepth -= 1;
      if (braceDepth === 0) return appSource.slice(start, index + 1);
    }
  }
  throw new Error(`Unclosed function ${name}`);
}

const sourceToEvaluate = [
  `const RESOURCE_NAMES = ["粮食", "木材", "石料", "铁矿", "陶器", "简帛", "布匹"];`,
  `const BASIC_RESOURCES = ["粮食", "木材", "石料", "铁矿"];`,
  `const ADVANCED_RESOURCES = ["陶器", "简帛", "布匹"];`,
  extractFunction("builtStages"),
  extractFunction("getBuiltCards"),
  extractFunction("getPlayerResources"),
  extractFunction("getResourceChoices"),
  extractFunction("getWildBasicResourceCount"),
  extractFunction("applyTradeWildBasicCoverage"),
  extractFunction("applyResourceChoiceCoverage"),
  extractFunction("getTradeResourceAvailability"),
  extractFunction("canPlayerProvideTradePurchases"),
  extractFunction("getNeighborResourceAvailabilityBySides"),
  extractFunction("buildMissingTradeUnits"),
  extractFunction("getUnpurchasableResourceCounts"),
  extractFunction("tradeSideDistance"),
  extractFunction("tradeSideLabel"),
  extractFunction("getTradeDiscounts"),
  extractFunction("getTradeDiscountSource"),
  extractFunction("getTradePriceDetails"),
  extractFunction("getTradeRebate"),
  extractFunction("chooseDefaultTradeSelections"),
  extractFunction("calculateTradePlan")
].join("\n\n");

const context = {
  console,
  getResources(player) {
    return player.resources || {};
  },
  resolveCardResourceChoice(card) {
    return card.resourceChoice || [];
  }
};
vm.createContext(context);
vm.runInContext(sourceToEvaluate, context, { filename: "app.js" });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const buyer = { built: [], board: { stages: [] }, stagesBuilt: 0, coins: 99 };
const leftNeighbor = {
  id: "left",
  built: [{ resourceChoice: ["木材", "石料"] }],
  board: { stages: [], startResource: {} },
  stagesBuilt: 0,
  resources: {}
};
const rightNeighbor = {
  id: "right",
  built: [],
  board: { stages: [], startResource: {} },
  stagesBuilt: 0,
  resources: { 木材: 1 }
};
const tradeNeighbors = [
  { side: "left", player: leftNeighbor },
  { side: "right", player: rightNeighbor }
];
const missingUnits = context.buildMissingTradeUnits({ 木材: 1, 石料: 1 }, tradeNeighbors);
const autoSelections = context.chooseDefaultTradeSelections(buyer, missingUnits, tradeNeighbors, 0);
const autoPlan = context.calculateTradePlan(buyer, missingUnits, autoSelections, tradeNeighbors, 0);

assert(
  autoPlan.ok === true,
  `Expected default trade selection to find the valid plan, got ${JSON.stringify({ autoSelections, autoPlan })}`
);

const manualPlan = context.calculateTradePlan(
  buyer,
  missingUnits,
  { "木材-0": "right", "石料-0": "left" },
  tradeNeighbors,
  0
);

assert(
  manualPlan.ok === true,
  `Expected manual trade selection to be valid, got ${JSON.stringify(manualPlan)}`
);

console.log("trade selection regression checks passed");
