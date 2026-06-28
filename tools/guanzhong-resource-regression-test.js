const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const boardJson = JSON.parse(fs.readFileSync(path.join(root, "data", "wonderBoards.json"), "utf8").replace(/^\uFEFF/, ""));
const boardDataSource = fs.readFileSync(path.join(root, "data", "wonderBoards-data.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const expectedAbility = "第一、第二时代武备结算后，每战胜 1 方邻国，选择粮食、木材、石料、铁矿中的一种，获得 1 张对应的基础资源牌并加入资源卡槽；可以重复选择。第三时代不触发。";
const guanzhongBoard = boardJson.find((board) => board.id === "guanzhong");

assert(guanzhongBoard?.ability === expectedAbility, "Expected Guanzhong board ability text to use the new resource-card military reward.");
assert(boardDataSource.includes(expectedAbility), "Expected wonderBoards-data.js to mirror the new Guanzhong ability text.");
assert(indexSource.includes("关中第一、第二时代武备结算后"), "Expected rules text to explain the new Guanzhong resource-card reward.");

for (const oldText of ["temporaryFreeResourceAccess", "freeWonderBuild", "canUseFreeWonderBuild", "下个时代可免费使用", "免资源建设"]) {
  assert(!appSource.includes(oldText), `Expected old Guanzhong mechanic to be removed or disabled: ${oldText}`);
}

for (const newFunction of [
  "createGuanzhongResourceCard",
  "addGuanzhongResourceCard",
  "prepareGuanzhongResourceChoices",
  "startGuanzhongResourceChoicePhase",
  "chooseGuanzhongResource",
  "maybeResolveOnlineGuanzhongResourceChoicePhase"
]) {
  assert(appSource.includes(`function ${newFunction}`), `Expected ${newFunction} to exist.`);
}

assert(appSource.includes("guanzhongResourceChoice"), "Expected Guanzhong pending choice state to be serialized for online sync.");
assert(appSource.includes('"guanzhong-resource-choice"'), "Expected a dedicated Guanzhong resource-choice phase.");
assert(appSource.includes("军功铁矿"), "Expected generated Guanzhong cards to use military-resource card names.");

console.log("guanzhong resource regression checks passed");
