const fs = require("fs");
const path = require("path");
const vm = require("vm");

const appPath = path.join(__dirname, "..", "app.js");
const appSource = fs.readFileSync(appPath, "utf8");

function extractConst(name) {
  const match = appSource.match(new RegExp(`const ${name} = ([^;]+);`));
  if (!match) throw new Error(`Missing const ${name}`);
  return `const ${name} = ${match[1]};`;
}

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
    if (char === "(") {
      parenDepth += 1;
    } else if (char === ")") {
      parenDepth -= 1;
    } else if (char === "{" && parenDepth === 0) {
      bodyStart = index;
      break;
    }
  }
  if (bodyStart < 0) throw new Error(`Missing function body for ${name}`);
  let braceDepth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") {
      braceDepth += 1;
    } else if (char === "}") {
      braceDepth -= 1;
      if (braceDepth === 0) {
        return appSource.slice(start, index + 1);
      }
    }
  }
  throw new Error(`Unclosed function ${name}`);
}

const sourceToEvaluate = [
  `const RESOURCE_NAMES = ["粮食", "木材", "石料", "铁矿", "陶器", "简帛", "布匹"];`,
  `const BASIC_RESOURCES = ["粮食", "木材", "石料", "铁矿"];`,
  extractFunction("builtStages"),
  extractFunction("getBuiltCards"),
  extractFunction("getPlayerResources"),
  extractFunction("getResourceChoices"),
  extractFunction("applyResourceChoiceCoverage"),
  extractFunction("getWildBasicResourceCount"),
  extractFunction("applyTradeWildBasicCoverage"),
  extractFunction("getTradeResourceAvailability"),
  extractFunction("canPlayerProvideTradePurchases")
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

const sellerWithWildBasic = {
  board: {
    stages: [
      { effects: { wildBasicResource: 1 } }
    ]
  },
  stagesBuilt: 1,
  built: [],
  resources: {}
};

assert(
  context.getTradeResourceAvailability(sellerWithWildBasic, "粮食") === 1,
  "Expected wild basic resource to count toward single-resource trade availability."
);

assert(
  context.canPlayerProvideTradePurchases(sellerWithWildBasic, { 粮食: 1 }) === true,
  "Expected seller with one wild basic resource to satisfy one basic-resource trade purchase."
);

assert(
  context.canPlayerProvideTradePurchases(sellerWithWildBasic, { 粮食: 1, 木材: 1 }) === false,
  "Expected one wild basic resource not to satisfy two separate basic-resource purchases."
);

const lingnanBuyer = {};
const overseasPriceScript = [
  extractFunction("tradeSideDistance"),
  extractFunction("getTradeDiscountSource"),
  extractFunction("getTradeDiscounts"),
  extractFunction("getTradePriceDetails")
].join("\n\n");
const priceContext = {
  ...context,
  builtStages(player) {
    return player.board?.stages?.slice(0, player.stagesBuilt || 0) || [];
  }
};
vm.createContext(priceContext);
vm.runInContext(
  [
    `const BASIC_RESOURCES = ["粮食", "木材", "石料", "铁矿"];`,
    `const ADVANCED_RESOURCES = ["陶器", "简帛", "布匹"];`,
    overseasPriceScript
  ].join("\n\n"),
  priceContext,
  { filename: "app.js" }
);

assert(
  priceContext.getTradePriceDetails(lingnanBuyer, "overseas", "粮食").unitPrice === 2,
  "Expected Lingnan overseas trade to remain at 2 coins per resource."
);

console.log("trade wild-basic regression checks passed");
