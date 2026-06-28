const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  /function getLocalPlayerId\(\)[\s\S]*state\.online\.localPlayerId[\s\S]*localStorage\.getItem\("playerId"\)/.test(appSource),
  "Expected score rendering to use a local-player helper that prefers the current online player id before stored ids."
);

assert(
  /renderCivilizationRadarChart\(scores,\s*options\s*=\s*\{\}\)[\s\S]*viewBoxSize = options\.viewBoxSize \|\| 340[\s\S]*center = options\.center \|\| 170[\s\S]*maxRadius = options\.maxRadius \|\| 90/.test(appSource),
  "Expected radar SVG defaults to leave enough room for six labels."
);

assert(
  stylesSource.includes(".score-radar__chart-wrap")
    && stylesSource.includes(".score-radar__details")
    && /max-width:\s*360px/.test(stylesSource),
  "Expected score radar styles to keep the chart and values in a complete centered layout."
);

console.log("score radar regression checks passed");
