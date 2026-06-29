const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  appSource.includes("function recoverStaleGuanzhongResourceChoicePhase"),
  "Expected stale Guanzhong choice phases to be recoverable."
);
assert(
  appSource.includes("Number(state.guanzhongResourceChoice.age) < currentAge"),
  "Expected stale Guanzhong recovery to detect a previous-age choice phase."
);
assert(
  appSource.includes('state.phase = "game";'),
  "Expected stale Guanzhong recovery to return to the current age without advancing again."
);
assert(
  appSource.includes("正在同步进入下一阶段"),
  "Expected completed Guanzhong choices to show a completion/sync message instead of a misleading wait message."
);

console.log("guanzhong stale phase regression checks passed");
