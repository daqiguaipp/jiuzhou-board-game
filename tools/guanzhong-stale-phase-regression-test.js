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
assert(
  appSource.includes("function requestOnlineGuanzhongResourceChoiceResolution"),
  "Expected completed online Guanzhong choices to request host resolution."
);
assert(
  appSource.includes("state.online.resolving = false;") && appSource.includes("await maybeResolveOnlineGuanzhongResourceChoicePhase();"),
  "Expected host turn resolution to release the resolving guard before resolving completed Guanzhong choices."
);
for (const phase of [
  '"hedong-discard-choice"',
  '"liaodong-guard-choice"',
  '"liaodong-resource-choice"',
  '"guanzhong-resource-choice"'
]) {
  assert(
    appSource.includes(phase),
    `Expected special online phase ${phase} to be recognized during sync.`
  );
}
assert(
  appSource.includes('"liaodong-resource-choice": 5'),
  "Expected phase ordering to keep Liaodong resource choices ahead of Guanzhong choices and before scoring."
);
assert(
  appSource.includes('"hedong-discard-choice", "liaodong-guard-choice", "liaodong-resource-choice"'),
  "Expected stale snapshot filtering to include round-end discard/resource choice phases."
);

console.log("guanzhong stale phase regression checks passed");
