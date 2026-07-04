const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  indexSource.includes('id="hotseatAiDifficultyShortcuts"'),
  "Expected local room setup to expose one-click AI difficulty shortcuts."
);

assert(
  indexSource.includes('href="styles.css?v=20260704-ai-shortcuts"'),
  "Expected styles.css cache version to refresh for AI shortcut layout changes."
);

assert(
  indexSource.includes('src="app.js?v=20260704-ai-shortcuts"'),
  "Expected app.js cache version to refresh so deployed shortcut buttons get click handlers."
);

for (const difficulty of ["easy", "normal", "hard", "inferno"]) {
  assert(
    indexSource.includes(`data-ai-difficulty="${difficulty}"`),
    `Expected a shortcut button for ${difficulty} AI difficulty.`
  );
}

assert(
  appSource.includes("bindHotseatAIDifficultyShortcuts();"),
  "Expected startup binding for hotseat AI difficulty shortcuts."
);

assert(
  /function setHotseatAIDifficulty\(difficulty\)[\s\S]*select\.value\.startsWith\("ai:"\)[\s\S]*select\.value = `ai:\$\{difficulty\}`/.test(appSource),
  "Expected the shortcut to update only seats that are already AI."
);

assert(
  stylesSource.includes(".hotseat-ai-shortcuts"),
  "Expected dedicated layout styles for hotseat AI difficulty shortcuts."
);

console.log("hotseat AI difficulty shortcut regression checks passed");
