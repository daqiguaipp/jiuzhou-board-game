const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  appSource.includes("${renderMobileCardChainLinks(card)}"),
  "Expected mobile card summaries to render a dedicated chain-link row."
);
assert(
  !appSource.includes("${formatCost(card.cost)}${renderMobileChainBuildCostMarker(card)}"),
  "Expected mobile chain links not to be mixed into the cost line."
);
assert(
  appSource.includes("mobile-card-chain-group mobile-card-chain-group--from"),
  "Expected mobile chain rendering to distinguish prerequisite links."
);
assert(
  appSource.includes("mobile-card-chain-group mobile-card-chain-group--to"),
  "Expected mobile chain rendering to distinguish follow-up links."
);
assert(
  stylesSource.includes("body.view-game .mobile-card-chain-row"),
  "Expected mobile chain rows to have dedicated layout styles."
);

console.log("mobile chain link regression checks passed");
