const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const shareCoverPath = path.join(root, "assets", "share-cover.jpg");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(indexSource.includes('id="copyInviteLinkButton"'), "Expected lobby to include a copy invite link button.");
assert(indexSource.includes('id="inviteCard"'), "Expected online entry to include a hidden invite card.");
assert(indexSource.includes('property="og:title"'), "Expected Open Graph title metadata.");
assert(indexSource.includes('property="og:description"'), "Expected Open Graph description metadata.");
assert(indexSource.includes('property="og:image" content="https://daqiguaipp.github.io/assets/share-cover.jpg"'), "Expected Open Graph image metadata.");
assert(indexSource.includes('property="og:type" content="website"'), "Expected Open Graph website type metadata.");
assert(indexSource.includes('property="og:url" content="https://daqiguaipp.github.io/"'), "Expected canonical Open Graph URL metadata.");
assert(indexSource.includes('name="twitter:card" content="summary_large_image"'), "Expected Twitter large-card metadata.");
assert(indexSource.includes('name="twitter:image" content="https://daqiguaipp.github.io/assets/share-cover.jpg"'), "Expected Twitter image metadata.");
assert(fs.existsSync(shareCoverPath), "Expected assets/share-cover.jpg to exist.");

assert(/function buildInviteLink\(roomCode\)[\s\S]*location\.origin[\s\S]*location\.pathname[\s\S]*room=/.test(appSource), "Expected buildInviteLink to use origin, pathname, and room parameter.");
assert(/function copyTextWithManualFallback\(text, successMessage\)[\s\S]*navigator\.clipboard\.writeText/.test(appSource), "Expected shared copy helper to use navigator.clipboard.writeText.");
assert(/function copyInviteLink\(\)[\s\S]*buildInviteLink\(code\)/.test(appSource), "Expected copyInviteLink to copy the invite URL.");
assert(/function handleInviteLinkOnLoad\(\)[\s\S]*URLSearchParams[\s\S]*params\.get\("room"\)[\s\S]*params\.get\("join"\)/.test(appSource), "Expected room and join URL parameters to be recognized.");
assert(/function renderInviteCard\(roomCode\)[\s\S]*inviteCard[\s\S]*inviteRoomCode/.test(appSource), "Expected renderInviteCard to update the visual invite card.");
assert(/handleInviteLinkOnLoad\(\)/.test(appSource), "Expected invite link handling after event setup.");
assert(appSource.includes('$("copyInviteLinkButton").addEventListener("click", copyInviteLink)'), "Expected copy invite link button event binding.");
assert(appSource.includes('已识别房间邀请，请输入名称后加入。'), "Expected recognized-invite status message.");
assert(appSource.includes('没有找到这个房间，可能房间码已失效。'), "Expected missing-room invite-friendly error message.");
assert(appSource.includes('房间已关闭。'), "Expected closed-room message.");

assert(stylesSource.includes(".invite-card"), "Expected invite card styling.");
assert(stylesSource.includes(".room-code-actions"), "Expected room-code copy action layout styling.");
assert(stylesSource.includes(".invite-card__code"), "Expected large room-code styling for invite card.");

console.log("invite link regression checks passed");
