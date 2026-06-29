const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const boardJson = JSON.parse(fs.readFileSync(path.join(root, "data", "wonderBoards.json"), "utf8").replace(/^\uFEFF/, ""));
const boardDataSource = fs.readFileSync(path.join(root, "data", "wonderBoards-data.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const expectedSummaries = {
  guanzhong: "前两时代战争胜利可获得基础资源牌",
  hedong: "卖牌获得更多铜钱，终局按卖牌数量额外得分",
  qilu: "每套经学、工学、史学额外得分",
  jiangnan: "建设区域得分加钱，且更难被战胜",
  bashu: "终局铜钱折分更强，且更难被战胜",
  heluo: "蓝牌终局额外得分",
  jingchu: "多色发展，终局按已建卡牌颜色得分",
  yanzhao: "战争胜利获得额外分数与铜钱",
  lingnan: "黄牌建造即得钱，终局黄牌额外得分，且更难被战胜",
  mobei: "战争胜利可掠夺邻国铜钱",
  hexi: "自有高级资源可互相视为彼此",
  liaodong: "警戒边境，守住战线后获得屯垦资源；三时代无败额外得分"
};

const expectedTotems = {
  guanzhong: "ding",
  hedong: "iron-seal",
  qilu: "bamboo",
  jiangnan: "egret",
  bashu: "sunbird",
  heluo: "jade",
  jingchu: "phoenix",
  yanzhao: "horse",
  lingnan: "sail",
  mobei: "wolf",
  hexi: "camel",
  liaodong: "watchtower"
};

for (const board of boardJson) {
  assert(board.themeColor && board.accentColor && board.tintColor && board.totem, `Expected ${board.id} to have themeColor/accentColor/tintColor/totem.`);
  assert(board.summary === expectedSummaries[board.id], `Expected ${board.id} to have the configured preview summary.`);
  assert(board.totem === expectedTotems[board.id], `Expected ${board.id} to use a symbolic totem key, not a text avatar.`);
  assert(!("tags" in board || "routeTags" in board || "difficultyTags" in board), `Expected ${board.id} to avoid route tags.`);
}

assert(boardDataSource.includes('"themeColor"') && boardDataSource.includes('"totem"'), "Expected wonderBoards-data.js to include board theme fields.");
assert(boardDataSource.includes('"id": "hedong"') && boardDataSource.includes('"totem": "iron-seal"'), "Expected wonderBoards-data.js to include Hedong theme data.");
assert(indexSource.includes('id="boardDetailDialog"'), "Expected index.html to include the board detail dialog.");
assert(indexSource.includes('id="closeBoardDetailDialogButton"'), "Expected board detail dialog to include a close button.");
assert(appSource.includes("function openBoardDetail"), "Expected openBoardDetail to exist.");
assert(appSource.includes("function closeBoardDetail"), "Expected closeBoardDetail to exist.");
assert(appSource.includes("function renderBoardDetail"), "Expected renderBoardDetail to exist.");
assert(appSource.includes("function boardTotemSvg"), "Expected symbolic SVG totem rendering.");
assert(appSource.includes("iron-seal"), "Expected Hedong to render a symbolic iron-seal totem.");
assert(appSource.includes("handleBoardDetailDialogBackdrop"), "Expected backdrop close handling for board detail dialog.");
assert(appSource.includes("window.openBoardDetail = openBoardDetail"), "Expected openBoardDetail to be exposed for card buttons.");
assert(stylesSource.includes(".board-summary-card"), "Expected summary-card styles.");
assert(stylesSource.includes(".board-detail-dialog"), "Expected board detail dialog styles.");
assert(stylesSource.includes(".board-totem"), "Expected totem badge styles.");
assert(stylesSource.includes(".board-totem svg"), "Expected totem badges to render symbols instead of text avatars.");

const renderBoardPreviewMatch = appSource.match(/function renderBoardPreview\(\) \{[\s\S]*?\n\}/);
assert(renderBoardPreviewMatch, "Expected renderBoardPreview function to exist.");
assert(!renderBoardPreviewMatch[0].includes("stage-list"), "Board preview should not render the full stage list.");
assert(renderBoardPreviewMatch[0].includes("openBoardDetail"), "Board preview should include a detail button.");
assert(renderBoardPreviewMatch[0].includes("boardSummaryText(board)"), "Board preview should render the one-line board summary.");
assert(renderBoardPreviewMatch[0].includes("boardTotemSvg(board)"), "Board preview should render symbolic SVG totems.");

console.log("board preview UI regression checks passed");
