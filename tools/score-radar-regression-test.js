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
  /function getScoreRadarPlayerId\(\)[\s\S]*getLocalPlayerId\(\)[\s\S]*currentPlayer\(\)\?\.id/.test(appSource)
    && /const radarPlayerId = getScoreRadarPlayerId\(\)/.test(appSource)
    && /const localRadarEntry = scored\.find\(\(item\) => item\.player\.id === radarPlayerId\)/.test(appSource),
  "Expected score radar rendering to fall back to the current player when no stored local id exists."
);

const formatSpecialScoreTextBody = appSource.match(/function formatSpecialScoreText\(score\) \{([\s\S]*?)\n\}/)?.[1] || "";
assert(
  !formatSpecialScoreTextBody.includes("scienceChoices") && !formatSpecialScoreTextBody.includes("scienceChoice"),
  "Expected end-game science choices to stay in the science column instead of being duplicated in special rewards."
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
