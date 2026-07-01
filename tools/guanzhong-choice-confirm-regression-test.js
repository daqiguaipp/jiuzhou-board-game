const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  appSource.includes("function hasPendingGuanzhongResourceChoice"),
  "Expected Guanzhong to distinguish selected options from confirmed completion."
);
assert(
  appSource.includes("hasPendingGuanzhongResourceChoice(player) && !isAI(player)"),
  "Expected pending Guanzhong players to remain pending until they confirm."
);
assert(
  appSource.includes("if (hasPendingGuanzhongResourceChoice(localPlayer)) return localPlayer;"),
  "Expected the local Guanzhong player to stay active after selecting all options but before confirming."
);
assert(
  appSource.includes("!hasPendingGuanzhongResourceChoice(player) || isAI(player)"),
  "Expected confirmation to be allowed while a Guanzhong pending record still exists."
);
assert(
  appSource.includes("pendingGuanzhongResourceChoices: player.pendingGuanzhongResourceChoices || legacy.pendingGuanzhongResourceChoices || null"),
  "Expected online player normalization to preserve Guanzhong pending resource choices from Firebase."
);

console.log("guanzhong choice confirmation regression checks passed");
