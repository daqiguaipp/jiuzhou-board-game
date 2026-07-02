const RESOURCE_NAMES = ["粮食", "木材", "石料", "铁矿", "陶器", "简帛", "布匹"];
const SCIENCE_NAMES = ["经学", "工学", "史学"];
const BASIC_RESOURCES = ["粮食", "木材", "石料", "铁矿"];
const ADVANCED_RESOURCES = ["陶器", "简帛", "布匹"];
const DATA_ASSET_VERSION = "20260629-discard-pile";
const JIUZHOU_SAVE_VERSION = 1;
const HOTSEAT_SAVE_KEY = "jiuzhou.hotseat.save.v1";
const LEGACY_HOTSEAT_SAVE_KEY = "jiuzhou.hotseatSave.v1";
const GUANZHONG_ABILITY_TEXT = "第一、第二时代武备结算后，每战胜 1 方邻国，选择粮食、木材、石料、铁矿中的一种，获得 1 张对应的基础资源牌并加入资源卡槽；可以重复选择。第三时代不触发。";
const GUANZHONG_RESOURCE_CARD_NAMES = {
  粮食: "军功粮食",
  木材: "军功木材",
  石料: "军功石料",
  铁矿: "军功铁矿"
};
const FIXED_CARD_NAMES = {
  1: new Set(["井田","水渠","民户","征役","石作坊","冶铁场","陶坊","书简坊","市肆","乡校","宗庙","城邑","早市","铸币","关市","甲士","战车","边卒","诗书","百工","春秋","粟田","工徒","采石场","礼乐台","商贾","戍边营","礼制","山林","学舍","商亭","社稷坛","行商","弓手","水利术","屯田","匠户","漆器坊","竹帛馆","布帛市","邑墙","货币铺","祭坛","望楼","驿路","车骑","城防","史官","农政"]),
  2: new Set(["官田","丁籍","铁官","工坊群","官窑","典籍馆","货栈","郡城","太学","都护府","驿馆","盐铁","漕运","丝路","府兵","骑军","边镇","律令","算学","国史馆","地志","纸坊","运河码头","钱庄","市舶司","羽林军","经筵","水经注","驿道","行宫","法曹","商税","水师","重甲","天文台","河渠署","锦坊","州府","互市","贡赋","镇戍","医方","讲武堂","宫城","坊市","陷阵营","楼船营","礼律合编","编年史"]),
  3: new Set(["天下名城","书院","宫阙","大都会","礼制大成","商帮","海贸","工坊联盟","财赋重地","禁军","火器营","海防营","理学","工部营造","通鉴","天文历法","士人公会","工匠公会","军功公会","商人公会","城市公会","文华殿","典籍流通","边防总督","典章制度","农政公会","制度公会","海贸公会","万国来朝","巨型粮仓","钱引","神机营","羽林卫","方志总编","学宫公会","盛世宫苑","票号","市镇网络","边军屯垦","农书","运河公会","书院公会","天下粮仓","九州舆图","榷场","远征军","水陆都司","金石学","九州公会"]),
};
const AGE_CONFIG = {
  1: { label: "Age I", direction: "left", militaryWin: 1 },
  2: { label: "Age II", direction: "right", militaryWin: 3 },
  3: { label: "Age III", direction: "left", militaryWin: 5 }
};
const AI_DIFFICULTIES = {
  easy: "简单",
  normal: "普通",
  hard: "困难",
  inferno: "炼狱"
};

const FIREBASE_SCRIPTS = [
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"
];
const ONLINE_CHAT_MAX_MESSAGES = 80;
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const ROOM_CLEANUP_BATCH_SIZE = 20;
const ROOM_CLEANUP_COOLDOWN_MS = 60 * 1000;
const HOME_HERO_BACKGROUNDS = {
  desktop: "assets/home-hero-bg-optimized.jpg",
  mobile: "assets/home-hero-bg-small.jpg"
};
const RADAR_DIMENSIONS = [
  { key: "resource", label: "资源后勤" },
  { key: "civilization", label: "文明建设" },
  { key: "military", label: "武备威慑" },
  { key: "science", label: "学术文化" },
  { key: "commerce", label: "商贸经济" },
  { key: "endgame", label: "终局规划" }
];

let firebaseLoadPromise = null;
let loadingOverlayTimer = null;
let rulesContentPromise = null;
let appShellPromise = null;

const state = {
  boards: [],
  cards: null,
  view: "home",
  mode: "hotseat",
  phase: "lobby",
  players: [],
  age: 1,
  turn: 1,
  seatCursor: 0,
  mobileGameTab: "hand",
  scoreDetails: {},
  aiTimer: null,
  selected: {},
  pendingChoice: {},
  seventhCard: null,
  seventhCardPlayers: [],
  tradeContext: null,
  overseasTradeChoice: null,
  guanzhongResourceChoice: null,
  hedongDiscardChoice: null,
  liaodongGuardChoice: null,
  liaodongResourceChoice: null,
  resolvedSpecialEffects: {},
  scienceChoiceContext: null,
  discardPile: [],
  discardPilePicker: null,
  lastAppliedRoundKey: "",
  inspectPlayerId: "",
  logs: [],
  ui: {
    appShellMounted: false,
    deferredEventsBound: false,
    roomSetupRendered: false,
    boardPreviewRendered: false,
    boardSelectsRendered: false,
    rulesLoaded: false
  },
  online: {
    roomCode: "",
    localPlayerId: "",
    hostId: "",
    isHost: false,
    roomRef: null,
    roomListener: null,
    roomStatusListener: null,
    roomChatListener: null,
    roomGameListener: null,
    roomListenerTimer: null,
    roomRenderSignature: "",
    roomChatSignature: "",
    roomGameSignature: "",
    roomChannel: "",
    roomStatusValue: "",
    pendingRoomSnapshot: null,
    syncStatusTimer: null,
    lastCleanupAt: 0,
    roomData: null,
    roomClosedNotified: false,
    kickedNotified: false,
    lobbyPreview: false,
    resolving: false,
    joining: false,
    starting: false,
    aiLocks: {}
  }
};

function initialOnlineState() {
  return {
    roomCode: "",
    localPlayerId: "",
    hostId: "",
    isHost: false,
    roomRef: null,
    roomListener: null,
    roomStatusListener: null,
    roomChatListener: null,
    roomGameListener: null,
    roomListenerTimer: null,
    roomRenderSignature: "",
    roomChatSignature: "",
    roomGameSignature: "",
    roomChannel: "",
    roomStatusValue: "",
    pendingRoomSnapshot: null,
    syncStatusTimer: null,
    lastCleanupAt: 0,
    roomData: null,
    roomClosedNotified: false,
    kickedNotified: false,
    lobbyPreview: false,
    resolving: false,
    joining: false,
    starting: false,
    aiLocks: {}
  };
}

const $ = (id) => document.getElementById(id);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeForFirebase(value) {
  if (value === undefined) return null;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeForFirebase(item));
  const cleaned = {};
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) cleaned[key] = sanitizeForFirebase(item);
  }
  return cleaned;
}

function firebaseUpdate(ref, payload) {
  return ref.update(sanitizeForFirebase(payload));
}

function firebaseSet(ref, payload) {
  return ref.set(sanitizeForFirebase(payload));
}

function roomExpiryTime(now = Date.now()) {
  return now + ROOM_TTL_MS;
}

function roomLeasePayload(now = Date.now()) {
  return {
    updatedAt: now,
    expiresAt: roomExpiryTime(now)
  };
}

function applyRoomLease(target, now = Date.now()) {
  if (!target || typeof target !== "object") return target;
  Object.assign(target, roomLeasePayload(now));
  return target;
}

async function cleanupExpiredRooms() {
  const now = Date.now();
  const db = await ensureFirebase();
  const snapshot = await db.ref("rooms")
    .orderByChild("expiresAt")
    .endAt(now)
    .limitToFirst(ROOM_CLEANUP_BATCH_SIZE)
    .get();
  if (!snapshot.exists()) return 0;
  const updates = {};
  let removed = 0;
  snapshot.forEach((child) => {
    const room = child.val();
    if (!room) return;
    if (child.key === state.online.roomCode) return;
    const updatedAt = Number(room.updatedAt || room.createdAt || 0);
    const status = roomStatus(room);
    if (updatedAt && now - updatedAt < ROOM_TTL_MS) return;
    if (status === "playing" && updatedAt && now - updatedAt < ROOM_TTL_MS) return;
    updates[`rooms/${child.key}`] = null;
    removed += 1;
  });
  if (!removed) return 0;
  await db.ref().update(updates);
  return removed;
}

async function maybeCleanupExpiredRooms(force = false) {
  const now = Date.now();
  if (!force && state.online.lastCleanupAt && now - state.online.lastCleanupAt < ROOM_CLEANUP_COOLDOWN_MS) return 0;
  state.online.lastCleanupAt = now;
  try {
    return await cleanupExpiredRooms();
  } catch (error) {
    console.warn("Expired room cleanup skipped", error);
    return 0;
  }
}

function normalizeOnlineChatMessages(room = state.online.roomData) {
  return Object.entries(room?.chat || {})
    .map(([id, entry]) => ({ id, ...(entry || {}) }))
    .filter((entry) => typeof entry.text === "string" && entry.text.trim())
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .slice(-ONLINE_CHAT_MAX_MESSAGES);
}

function formatChatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function localOnlinePlayerRecord(room = state.online.roomData) {
  return room?.players?.[state.online.localPlayerId] || null;
}

function canSendOnlineChat(room = state.online.roomData) {
  return state.mode === "online"
    && Boolean(state.online.roomRef)
    && Boolean(localOnlinePlayerRecord(room))
    && !isAiRecord(localOnlinePlayerRecord(room));
}

function renderOnlineChatList(targetId, messages, localPlayerId) {
  const target = $(targetId);
  if (!target) return;
  target.innerHTML = messages.length
    ? messages.map((entry) => {
      const own = entry.playerId === localPlayerId;
      const timeText = formatChatTime(entry.createdAt);
      return `
        <div class="chat-entry ${own ? "chat-entry--own" : ""}">
          <div class="chat-entry__meta">
            <strong>${entry.playerName || "玩家"}</strong>
            <span>${timeText}</span>
          </div>
          <div class="chat-entry__body">${escapeHtml(entry.text)}</div>
        </div>
      `;
    }).join("")
    : `<div class="chat-empty">暂无聊天消息，和房间里的玩家打个招呼吧。</div>`;
  target.scrollTop = target.scrollHeight;
}

function renderOnlineChatPanels(room = state.online.roomData) {
  const messages = normalizeOnlineChatMessages(room);
  const localPlayer = localOnlinePlayerRecord(room);
  const canSend = canSendOnlineChat(room);
  const statusText = room
    ? (localPlayer ? `${localPlayer.name || "玩家"} · 在线聊天` : "房间同步中")
    : "未连接";
  const panels = [
    ["onlineChatList", "onlineChatStatus", "onlineChatInput", "onlineChatSendButton"],
    ["gameChatList", "gameChatStatus", "gameChatInput", "gameChatSendButton"]
  ];
  for (const [listId, statusId, inputId, buttonId] of panels) {
    renderOnlineChatList(listId, messages, state.online.localPlayerId);
    if ($(statusId)) $(statusId).textContent = statusText;
    if ($(inputId)) {
      $(inputId).disabled = !canSend;
      $(inputId).placeholder = canSend ? "输入消息，按回车发送" : "联机连接后可发送消息";
    }
    if ($(buttonId)) $(buttonId).disabled = !canSend;
  }
}

async function submitOnlineChatMessage(source = "game") {
  if (!state.online.roomRef || state.mode !== "online") return;
  const input = $(source === "lobby" ? "onlineChatInput" : "gameChatInput");
  if (!input) return;
  const text = input.value.replace(/\s+/g, " ").trim();
  if (!text) return;
  const player = localOnlinePlayerRecord();
  if (!player || isAiRecord(player)) return;
  const createdAt = Date.now();
  const messageId = `msg-${createdAt}-${safeId()}`;
  const message = {
    id: messageId,
    playerId: player.id,
    playerName: player.name || "玩家",
    text: text.slice(0, 120),
    createdAt
  };
  if (!state.online.roomData) state.online.roomData = {};
  state.online.roomData.chat = { ...(state.online.roomData.chat || {}), [messageId]: message };
  renderOnlineChatPanels(state.online.roomData);
  if ($("onlineChatInput")) $("onlineChatInput").value = "";
  if ($("gameChatInput")) $("gameChatInput").value = "";
  await firebaseUpdate(state.online.roomRef, {
    [`chat/${messageId}`]: message,
    [`players/${player.id}/lastSeen`]: createdAt,
    ...roomLeasePayload(createdAt)
  });
}

function showLoading(message = "正在处理……") {
  const overlay = $("loadingOverlay");
  const messageNode = $("loadingMessage");
  if (!overlay || !messageNode) return;
  messageNode.textContent = message;
  overlay.classList.remove("hidden");
  if (loadingOverlayTimer) clearTimeout(loadingOverlayTimer);
  loadingOverlayTimer = setTimeout(() => {
    messageNode.textContent = "同步时间较长，请检查网络，或刷新页面重试。";
  }, 15000);
}

function updateLoading(message = "正在处理……") {
  const overlay = $("loadingOverlay");
  const messageNode = $("loadingMessage");
  if (!overlay || !messageNode) return;
  messageNode.textContent = message;
  if (overlay.classList.contains("hidden")) overlay.classList.remove("hidden");
  if (loadingOverlayTimer) clearTimeout(loadingOverlayTimer);
  loadingOverlayTimer = setTimeout(() => {
    messageNode.textContent = "同步时间较长，请检查网络，或刷新页面重试。";
  }, 15000);
}

function hideLoading() {
  const overlay = $("loadingOverlay");
  if (loadingOverlayTimer) {
    clearTimeout(loadingOverlayTimer);
    loadingOverlayTimer = null;
  }
  if (overlay) overlay.classList.add("hidden");
}

function updateTurnLoadingForPhase() {
}

function shuffle(items) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function sumObjects(...objects) {
  const result = {};
  for (const object of objects) {
    for (const [key, value] of Object.entries(object || {})) {
      result[key] = (result[key] || 0) + value;
    }
  }
  return result;
}

function safeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clientPlayerId() {
  const key = "jiuzhou.playerId";
  for (const storage of [localStorage, sessionStorage]) {
    try {
      let id = storage.getItem("playerId") || storage.getItem(key);
      if (!id) {
        id = safeId();
      }
      storage.setItem(key, id);
      storage.setItem("playerId", id);
      return id;
    } catch (error) {
      console.warn("Player id storage unavailable", error);
    }
  }
  if (!state.online.localPlayerId) state.online.localPlayerId = safeId();
  return state.online.localPlayerId;
}

function getLocalPlayerId() {
  if (state.mode === "online" && state.online.localPlayerId) return state.online.localPlayerId;
  try {
    return localStorage.getItem("playerId")
      || localStorage.getItem("jiuzhou.playerId")
      || state.online.localPlayerId
      || currentPlayer()?.id
      || "";
  } catch (error) {
    return state.online.localPlayerId || currentPlayer()?.id || "";
  }
}

function getScoreRadarPlayerId() {
  const localPlayerId = getLocalPlayerId();
  if (state.players.some((player) => player.id === localPlayerId)) return localPlayerId;
  const currentPlayerId = currentPlayer()?.id || "";
  if (state.players.some((player) => player.id === currentPlayerId)) return currentPlayerId;
  return state.players[0]?.id || "";
}

function getStoredPlayerName() {
  try {
    return localStorage.getItem("playerName")
      || localStorage.getItem("jiuzhou.playerName")
      || "";
  } catch (error) {
    return "";
  }
}

function saveOnlineSession(roomCodeValue, playerId, playerName) {
  try {
    localStorage.setItem("currentRoomCode", roomCodeValue);
    localStorage.setItem("playerId", playerId);
    localStorage.setItem("playerName", playerName);
    localStorage.setItem("jiuzhou.currentRoomCode", roomCodeValue);
    localStorage.setItem("jiuzhou.playerId", playerId);
    localStorage.setItem("jiuzhou.playerName", playerName);
  } catch (error) {
    console.warn("Online session storage unavailable", error);
  }
}

function clearOnlineSession() {
  try {
    localStorage.removeItem("currentRoomCode");
    localStorage.removeItem("jiuzhou.currentRoomCode");
  } catch (error) {
    console.warn("Online session storage unavailable", error);
  }
}

function resetOnlineState() {
  state.online = initialOnlineState();
  state.lastAppliedRoundKey = "";
}

function showOnlineEntry(message = "未连接", shouldAlert = false) {
  detachRoomListener();
  if (state.online.syncStatusTimer) {
    clearTimeout(state.online.syncStatusTimer);
    state.online.syncStatusTimer = null;
  }
  clearOnlineSession();
  resetOnlineState();
  state.mode = "online";
  state.phase = "lobby";
  $("createOnlineRoomButton").disabled = false;
  $("joinOnlineRoomButton").disabled = false;
  $("onlineEntry").classList.remove("hidden");
  $("onlineLobby").classList.add("hidden");
  hideInviteCard();
  $("onlineBackButton").textContent = "返回首页";
  finishOnlineSyncNotice(message);
  showView("online");
  hideLoading();
  if (shouldAlert && message) alert(message);
}

function roomCode() {
  return `JZ${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function normalizeInviteRoomCode(value = "") {
  return String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

function buildInviteLink(roomCode) {
  const code = normalizeInviteRoomCode(roomCode);
  return `${location.origin}${location.pathname}?room=${encodeURIComponent(code)}`;
}

function renderInviteCard(roomCode) {
  const card = $("inviteCard");
  if (!card) return;
  const code = normalizeInviteRoomCode(roomCode);
  $("inviteRoomCode").textContent = code || "------";
  card.classList.toggle("hidden", !code);
}

function hideInviteCard() {
  const card = $("inviteCard");
  if (card) card.classList.add("hidden");
}

function fillJoinNameFromStorage() {
  const storedName = getStoredPlayerName();
  if (storedName) $("joinName").value = storedName;
}

async function copyTextWithManualFallback(text, successMessage) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
    await navigator.clipboard.writeText(text);
    $("onlineStatus").textContent = successMessage;
  } catch (error) {
    window.prompt("复制失败，请手动复制：", text);
    $("onlineStatus").textContent = "请手动复制邀请内容。";
  }
}

async function copyInviteLink() {
  const code = state.online.roomCode;
  if (!code) return;
  await copyTextWithManualFallback(buildInviteLink(code), "邀请链接已复制，可发送给微信/QQ好友。");
}

async function handleInviteLinkOnLoad() {
  const params = new URLSearchParams(location.search);
  const code = normalizeInviteRoomCode(params.get("room") || params.get("join") || "");
  if (!code) return false;
  await ensureAppShellMounted();
  state.mode = "online";
  state.phase = "lobby";
  $("onlineEntry").classList.remove("hidden");
  $("onlineLobby").classList.add("hidden");
  $("joinCode").value = code;
  fillJoinNameFromStorage();
  renderInviteCard(code);
  $("onlineStatus").textContent = "已识别房间邀请，请输入名称后加入。";
  $("onlineBackButton").textContent = "返回首页";
  showView("online");
  setTimeout(() => $("joinName").focus(), 0);
  return true;
}

function storedOnlineSession() {
  const roomCode = normalizeInviteRoomCode(safeLocalStorageGet("jiuzhou.currentRoomCode") || safeLocalStorageGet("currentRoomCode") || "");
  const playerId = safeLocalStorageGet("jiuzhou.playerId") || safeLocalStorageGet("playerId") || "";
  const playerName = safeLocalStorageGet("jiuzhou.playerName") || safeLocalStorageGet("playerName") || "";
  return roomCode && playerId ? { roomCode, playerId, playerName } : null;
}

async function enterOnlineEntry() {
  await ensureAppShellMounted();
  state.mode = "online";
  showView("online");
  hideInviteCard();
  $("onlineEntry")?.classList.remove("hidden");
  $("onlineLobby")?.classList.add("hidden");
  if ($("onlineStatus")) $("onlineStatus").textContent = hasFirebaseConfig() ? "正在准备联机…" : "联机未配置";
  if ($("onlineBackButton")) $("onlineBackButton").textContent = "返回首页";
  if (hasFirebaseConfig()) {
    runAfterFirstPaint(() => {
      if ($("onlineStatus")) $("onlineStatus").textContent = "准备联机";
      void maybeCleanupExpiredRooms();
    });
  }
}

async function openContinueOnlineDialog() {
  await ensureAppShellMounted();
  const session = storedOnlineSession();
  if (!session) {
    await enterOnlineEntry();
    return;
  }
  const codeNode = $("continueOnlineRoomCode");
  if (codeNode) codeNode.textContent = session.roomCode;
  const dialog = $("continueOnlineDialog");
  if (!dialog) {
    await restoreOnlineSession();
    return;
  }
  document.body.classList.add("dialog-open");
  if (!dialog.open) dialog.showModal();
}

function closeContinueOnlineDialog() {
  const dialog = $("continueOnlineDialog");
  if (dialog?.open) dialog.close();
  document.body.classList.remove("dialog-open");
}

async function reconnectOnlineFromDialog() {
  closeContinueOnlineDialog();
  await ensureAppShellMounted();
  state.mode = "online";
  showView("online");
  if ($("onlineStatus")) $("onlineStatus").textContent = "正在重连房间…";
  await restoreOnlineSession();
}

async function discardOnlineSessionFromDialog() {
  const confirmed = window.confirm("放弃后将清除本地房间记录，但不会关闭远程房间。确定吗？");
  if (!confirmed) return;
  closeContinueOnlineDialog();
  clearOnlineSession();
  await enterOnlineEntry();
}

async function restoreOnlineSession() {
  const session = storedOnlineSession();
  if (!session) return false;
  await ensureAppShellMounted();
  state.mode = "online";
  showView("online");
  $("onlineEntry")?.classList.remove("hidden");
  $("onlineLobby")?.classList.add("hidden");
  if ($("onlineStatus")) $("onlineStatus").textContent = "检测到上次联机房间，正在重连…";
  try {
    const db = await ensureFirebase();
    const ref = db.ref(`rooms/${session.roomCode}`);
    const snapshot = await ref.get();
    const room = snapshot.val();
    const player = room?.players?.[session.playerId];
    const status = roomStatus(room);
    if (!room || !player || status === "closed" || player.kickedAt) {
      clearOnlineSession();
      showOnlineEntry("上次联机房间已失效，请重新创建或加入。", false);
      return false;
    }
    saveOnlineSession(session.roomCode, session.playerId, session.playerName || player.name || "玩家");
    attachRoom(session.roomCode, session.playerId, ref);
    state.online.roomData = room;
    state.online.hostId = room.hostId;
    state.online.isHost = room.hostId === session.playerId;
    state.online.roomStatusValue = status;
    if (status === "lobby" || status === "waiting") {
      applyIncomingLobbySnapshot(room);
    } else if (status === "playing" || status === "finished") {
      detachLobbyRoomListener();
      attachGameRoomListener();
      applyIncomingGameSnapshot(room.game || {});
    } else {
      showOnlineEntry("房间状态异常，请重新加入。", false);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("Online session restore failed", error);
    clearOnlineSession();
    showOnlineEntry("上次联机重连失败，请重新创建或加入。", false);
    return false;
  }
}

function hasFirebaseConfig() {
  const config = window.JIUZHOU_FIREBASE_CONFIG;
  return Boolean(config && config.apiKey && config.databaseURL && config.projectId && config.appId);
}

function isDebugEnabled(scope = "debug") {
  try {
    return localStorage.getItem("jiuzhou.debug") === "1" || localStorage.getItem(`jiuzhou.${scope}`) === "1";
  } catch (error) {
    return false;
  }
}

function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn("Local save failed", error);
    return false;
  }
}

function safeLocalStorageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Local save cleanup failed", error);
  }
}

function hotseatSavePayload() {
  return {
    version: JIUZHOU_SAVE_VERSION,
    savedAt: Date.now(),
    mode: state.mode,
    phase: state.phase,
    view: state.view,
    players: state.players,
    age: state.age,
    turn: state.turn,
    seatCursor: state.seatCursor,
    selected: state.selected,
    pendingChoice: state.pendingChoice,
    seventhCard: state.seventhCard,
    seventhCardPlayers: state.seventhCardPlayers,
    discardPile: state.discardPile,
    hedongDiscardChoice: state.hedongDiscardChoice,
    resolvedSpecialEffects: state.resolvedSpecialEffects,
    inspectPlayerId: state.inspectPlayerId,
    logs: state.logs
  };
}

function isValidHotseatSave(save) {
  return Boolean(
    save
    && save.version === JIUZHOU_SAVE_VERSION
    && save.mode === "hotseat"
    && ["lobby", "room", "game", "seventh-card", "overseas-trade-choice", "hedong-discard-choice", "liaodong-guard-choice", "liaodong-resource-choice", "guanzhong-resource-choice", "end-science-choice", "score"].includes(save.phase)
    && Array.isArray(save.players)
    && save.players.length >= 3
    && save.players.length <= 7
    && Number.isInteger(Number(save.age))
    && Number.isInteger(Number(save.turn))
  );
}

function readHotseatSave() {
  const raw = safeLocalStorageGet(HOTSEAT_SAVE_KEY) || safeLocalStorageGet(LEGACY_HOTSEAT_SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!isValidHotseatSave(parsed)) {
      clearHotseatSave(false);
      return null;
    }
    return parsed;
  } catch (error) {
    clearHotseatSave(false);
    return null;
  }
}

function updateContinueGameControls() {
  $("continueGameButton")?.classList.add("hidden");
  $("clearLocalSaveButton")?.classList.add("hidden");
  refreshContinueHotseatButton();
}

function hasActiveHotseatGame() {
  return state.mode === "hotseat"
    && Array.isArray(state.players)
    && state.players.length > 0
    && ["game", "score", "lobby", "room"].includes(state.phase);
}

function hasRestorableHotseatGame() {
  return hasActiveHotseatGame() || Boolean(readHotseatSave());
}

function refreshHotseatReturnHomeButtons() {
  const isHotseat = state.mode === "hotseat";
  $("roomReturnHomeButton")?.classList.toggle("hidden", !isHotseat);
  $("gameReturnHomeButton")?.classList.toggle("hidden", !isHotseat);
  $("scoreReturnHomeButton")?.classList.toggle("hidden", !isHotseat);
  refreshOnlineHostCloseButtons();
}

function refreshOnlineHostCloseButtons() {
  const canClose = state.mode === "online" && state.online.isHost && Boolean(state.online.roomRef);
  $("gameCloseRoomButton")?.classList.toggle("hidden", !canClose || state.view !== "game");
  $("scoreCloseRoomButton")?.classList.toggle("hidden", !canClose || state.view !== "score");
}

function refreshContinueHotseatButton() {
  refreshHotseatReturnHomeButtons();
}

function resetHotseatState() {
  clearHotseatAITimer();
  Object.assign(state, {
    mode: "hotseat",
    phase: "lobby",
    players: [],
    age: 1,
    turn: 1,
    seatCursor: 0,
    scoreDetails: {},
    selected: {},
    pendingChoice: {},
    seventhCard: null,
    seventhCardPlayers: [],
    tradeContext: null,
    overseasTradeChoice: null,
    guanzhongResourceChoice: null,
    hedongDiscardChoice: null,
    liaodongGuardChoice: null,
    liaodongResourceChoice: null,
    resolvedSpecialEffects: {},
    scienceChoiceContext: null,
    discardPile: [],
    discardPilePicker: null,
    inspectPlayerId: "",
    logs: []
  });
}

function startNewHotseatRoom() {
  resetHotseatState();
  ensureRoomSetupRendered();
  ensureBoardPreviewRendered();
  showView("room");
}

async function openContinueHotseatDialog() {
  await ensureAppShellMounted();
  const dialog = $("continueHotseatDialog");
  if (!dialog) {
    continueHotseatGame();
    return;
  }
  document.body.classList.add("dialog-open");
  if (!dialog.open) dialog.showModal();
}

function closeContinueHotseatDialog() {
  const dialog = $("continueHotseatDialog");
  if (dialog?.open) dialog.close();
  document.body.classList.remove("dialog-open");
}

function continueHotseatGame() {
  closeContinueHotseatDialog();
  if (!hasActiveHotseatGame()) {
    void restoreHotseatGame();
    return;
  }
  if (state.phase === "score") {
    showView("score");
    renderScores();
    return;
  }
  if (state.phase === "lobby" || state.phase === "room") {
    ensureRoomSetupRendered();
    showView("room");
    return;
  }
  showView("game");
  renderGame();
}

async function restartHotseatGameFromDialog() {
  const confirmed = window.confirm("重新开始会清除上次单机进度，确定吗？");
  if (!confirmed) return;
  closeContinueHotseatDialog();
  clearHotseatSave();
  await ensureAppShellMounted();
  startNewHotseatRoom();
}

function isAnyDialogOpen() {
  return Array.from(document.querySelectorAll("dialog")).some((dialog) => dialog.open);
}

function closeReturnHomeDialog() {
  const dialog = $("returnHomeDialog");
  if (dialog?.open) dialog.close();
  document.body.classList.remove("dialog-open");
}

function clearHotseatAITimer() {
  if (!state.aiTimer) return;
  clearTimeout(state.aiTimer);
  state.aiTimer = null;
}

function requestReturnHome() {
  if (state.mode !== "hotseat" || !["room", "game", "score"].includes(state.view)) return;
  const dialog = $("returnHomeDialog");
  if (!dialog || dialog.open || isAnyDialogOpen()) return;
  document.body.classList.add("dialog-open");
  dialog.showModal();
}

function confirmReturnHome() {
  closeReturnHomeDialog();
  clearHotseatAITimer();
  showView("home");
  refreshContinueHotseatButton();
}

function handleReturnHomeKeydown(event) {
  if (event.key !== "Escape" || state.mode !== "hotseat") return;
  const dialog = $("returnHomeDialog");
  if (dialog?.open) {
    event.preventDefault();
    closeReturnHomeDialog();
    return;
  }
  if (!["room", "game", "score"].includes(state.view) || isAnyDialogOpen()) return;
  event.preventDefault();
  requestReturnHome();
}

function saveHotseatGame() {
  if (state.mode !== "hotseat" || !state.players.length || state.phase === "lobby") return;
  safeLocalStorageSet(HOTSEAT_SAVE_KEY, JSON.stringify(hotseatSavePayload()));
  updateContinueGameControls();
}

function clearHotseatSave(updateControls = true) {
  safeLocalStorageRemove(HOTSEAT_SAVE_KEY);
  safeLocalStorageRemove(LEGACY_HOTSEAT_SAVE_KEY);
  if (updateControls) updateContinueGameControls();
}

async function restoreHotseatGame() {
  const save = readHotseatSave();
  if (!save) {
    updateContinueGameControls();
    return false;
  }
  await ensureAppShellMounted();
  Object.assign(state, {
    mode: "hotseat",
    phase: save.phase,
    players: save.players,
    age: Number(save.age) || 1,
    turn: Number(save.turn) || 1,
    seatCursor: Number(save.seatCursor) || 0,
    selected: save.selected || {},
    pendingChoice: save.pendingChoice || {},
    seventhCard: save.seventhCard || null,
    seventhCardPlayers: Array.isArray(save.seventhCardPlayers) ? save.seventhCardPlayers : [],
    discardPile: Array.isArray(save.discardPile) ? save.discardPile : [],
    hedongDiscardChoice: save.hedongDiscardChoice || null,
    resolvedSpecialEffects: save.resolvedSpecialEffects && typeof save.resolvedSpecialEffects === "object" ? save.resolvedSpecialEffects : {},
    inspectPlayerId: save.inspectPlayerId || "",
    logs: Array.isArray(save.logs) ? save.logs : []
  });
  state.seatCursor = Math.max(0, Math.min(state.seatCursor, state.players.length - 1));
  if (state.phase === "score") {
    showView("score");
    renderScores();
  } else if (state.phase === "lobby" || state.phase === "room") {
    ensureRoomSetupRendered();
    showView("room");
  } else {
    showView("game");
    renderGame();
  }
  updateContinueGameControls();
  return true;
}

function currentHomeHeroBackground() {
  return window.matchMedia("(max-width: 760px)").matches ? HOME_HERO_BACKGROUNDS.mobile : HOME_HERO_BACKGROUNDS.desktop;
}

function warmHomeHeroBackground() {
  const src = currentHomeHeroBackground();
  if (document.body.dataset.heroBgSrc === src && document.body.classList.contains("hero-bg-ready")) return;
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    document.documentElement.style.setProperty("--hero-home-image", `url("${src}")`);
    document.body.dataset.heroBgSrc = src;
    document.body.classList.add("hero-bg-ready");
  };
  image.onerror = () => {
    console.warn("Home hero background failed to load", src);
  };
  image.src = src;
}

function scheduleHomeHeroBackground() {
  const run = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => warmHomeHeroBackground(), { timeout: 900 });
      return;
    }
    setTimeout(() => warmHomeHeroBackground(), 60);
  };
  requestAnimationFrame(run);
}

function runAfterFirstPaint(callback, timeout = 120) {
  requestAnimationFrame(() => setTimeout(callback, timeout));
}

function bindEvent(id, eventName, handler, options) {
  const element = $(id);
  if (element) element.addEventListener(eventName, handler, options);
}

function bindClick(id, handler, options) {
  bindEvent(id, "click", handler, options);
}

async function ensureAppShellMounted() {
  if (state.ui.appShellMounted) return;
  if ($("roomView") && $("onlineView") && $("gameView") && $("scoreView")) {
    state.ui.appShellMounted = true;
    setupDeferredEvents();
    return;
  }
  const root = $("deferredAppRoot");
  if (!root) throw new Error("页面结构缺少 deferredAppRoot。");
  appShellPromise ||= fetch(`partials/app-shell.html?v=${DATA_ASSET_VERSION}`)
    .then((response) => {
      if (!response.ok) throw new Error("页面模块加载失败。");
      return response.text();
    });
  root.innerHTML = await appShellPromise;
  state.ui.appShellMounted = true;
  setupDeferredEvents();
}

function ensureRoomSetupRendered() {
  if (!state.ui.roomSetupRendered) {
    renderRoomSetup();
    state.ui.roomSetupRendered = true;
  }
  if (!state.ui.boardSelectsRendered) {
    renderBoardSelects();
    state.ui.boardSelectsRendered = true;
  }
}

function ensureBoardPreviewRendered(force = false) {
  if (!force && state.ui.boardPreviewRendered) return;
  renderBoardPreview();
  state.ui.boardPreviewRendered = true;
}

async function loadRulesContent() {
  if (state.ui.rulesLoaded) return;
  const target = $("rulesCopy");
  if (!target) return;
  target.innerHTML = `<p class="hint">规则说明正在加载。</p>`;
  rulesContentPromise ||= fetch(`partials/rules.html?v=${DATA_ASSET_VERSION}`)
    .then((response) => {
      if (!response.ok) throw new Error("规则说明加载失败。");
      return response.text();
    });
  try {
    target.innerHTML = await rulesContentPromise;
    state.ui.rulesLoaded = true;
  } catch (error) {
    target.innerHTML = `<p class="hint">规则说明暂时加载失败，请刷新后重试。</p>`;
    throw error;
  }
}

async function openRulesDialog() {
  const dialog = $("rulesDialog");
  if (!dialog) return;
  if (!dialog.open) dialog.showModal();
  try {
    await loadRulesContent();
  } catch (error) {
    console.warn(error);
  }
}

function shouldForceMobileLandscapeLayout() {
  const width = window.innerWidth || document.documentElement?.clientWidth || 0;
  const height = window.innerHeight || document.documentElement?.clientHeight || 0;
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  if (!shortSide || !longSide) return false;
  const supportedViews = new Set(["online", "game", "score"]);
  return supportedViews.has(state.view)
    && shortSide <= 960
    && height > width
    && longSide / shortSide >= 1.2;
}

function syncMobileLandscapeFallback() {
  document.body.classList.remove("force-mobile-landscape");
}

function setMobileGameTab(tab = "hand") {
  const allowedTabs = new Set(["hand", "city", "players", "log"]);
  state.mobileGameTab = allowedTabs.has(tab) ? tab : "hand";
  document.body.dataset.mobileGameTab = state.mobileGameTab;
  document.querySelectorAll("[data-mobile-game-tab]").forEach((button) => {
    const isActive = button.dataset.mobileGameTab === state.mobileGameTab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function bindMobileGameTabs() {
  document.querySelectorAll("[data-mobile-game-tab]").forEach((button) => {
    button.addEventListener("click", () => setMobileGameTab(button.dataset.mobileGameTab));
  });
  setMobileGameTab(state.mobileGameTab);
}

function beginOnlineSyncNotice() {
  if (state.online.syncStatusTimer) clearTimeout(state.online.syncStatusTimer);
  $("onlineStatus").textContent = "正在同步房间状态…";
  state.online.syncStatusTimer = setTimeout(() => {
    if (state.mode === "online") {
      $("onlineStatus").textContent = "房间同步较慢，请检查网络或刷新重试。";
    }
  }, 8000);
}

function finishOnlineSyncNotice(message) {
  if (state.online.syncStatusTimer) {
    clearTimeout(state.online.syncStatusTimer);
    state.online.syncStatusTimer = null;
  }
  if (message) $("onlineStatus").textContent = message;
}

function iconSvg(name) {
  const svg = (body, viewBox = "0 0 24 24") => `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const icons = {
    "粮食": svg(`
      <path d="M12 21c.3-5.8.3-11.5 0-17" fill="none" stroke="#8a5a1f" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M12 8c-2.7-.8-4.3-2.4-4.8-4.5 2.6.1 4.4 1.4 5.1 3.8" fill="#dca83b" stroke="#8a5a1f" stroke-width="1"/>
      <path d="M12.2 10.8c2.8-.7 4.6-2.2 5.3-4.3-2.7-.1-4.6 1.1-5.6 3.5" fill="#e5bd53" stroke="#8a5a1f" stroke-width="1"/>
      <path d="M12 14c-2.6-.6-4.4-2.1-5.4-4.4 2.8-.1 4.7 1.1 5.6 3.5" fill="#efcf68" stroke="#8a5a1f" stroke-width="1"/>
      <path d="M12.1 17.2c2.4-.7 4-2.1 4.8-4-2.5-.1-4.2 1-5 3" fill="#d99a2b" stroke="#8a5a1f" stroke-width="1"/>
    `),
    "木材": svg(`
      <path d="M4.2 9.1h12.6c1.8 0 3.2 1.4 3.2 3.1s-1.4 3.1-3.2 3.1H4.2c-1.8 0-3.2-1.4-3.2-3.1s1.4-3.1 3.2-3.1Z" fill="#a46435" stroke="#6e3e20" stroke-width="1.2"/>
      <path d="M7.2 6.4h9.4c1.4 0 2.6 1.1 2.6 2.5s-1.2 2.5-2.6 2.5H7.2c-1.4 0-2.6-1.1-2.6-2.5s1.2-2.5 2.6-2.5Z" fill="#c07a3e" stroke="#6e3e20" stroke-width="1.1"/>
      <circle cx="4.5" cy="12.2" r="2.1" fill="#e4b06c" stroke="#6e3e20" stroke-width="1"/>
      <circle cx="7.2" cy="8.9" r="1.6" fill="#edbf7b" stroke="#6e3e20" stroke-width="0.9"/>
      <path d="M4.1 12.2c.4-.5 1-.8 1.7-.6M7 8.9c.3-.4.8-.6 1.3-.5" fill="none" stroke="#8b552c" stroke-width=".8" stroke-linecap="round"/>
    `),
    "石料": svg(`
      <path d="M5 9.6 10 5l6.8 1.8 3.2 6.1-3.8 5.4H7.4L3.5 14Z" fill="#a9adb2" stroke="#626870" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="m10 5 1.2 5.4 5.6-3.6M11.2 10.4l5 7.9M11.2 10.4 3.5 14" fill="none" stroke="#7d838a" stroke-width="1"/>
      <path d="M7.3 10.3 10 8M14.2 9.1l2.1.5" fill="none" stroke="#d8dadd" stroke-width="1.2" stroke-linecap="round"/>
    `),
    "铁矿": svg(`
      <path d="M5.2 10.1 10.2 5l7.1 1.5 3.3 6.3-4.4 5.5H7.1L3.3 13Z" fill="#5d6268" stroke="#30343a" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="m10.2 5 1.5 6 5.6-4.5M11.7 11l4.5 7.3M11.7 11 3.3 13" fill="none" stroke="#3e444b" stroke-width="1"/>
      <path d="M7.7 10.2 10.9 7.5M14.3 9.3l2.4.4M13 14.5l2.1 1" fill="none" stroke="#cfd5db" stroke-width="1.2" stroke-linecap="round"/>
    `),
    "陶器": svg(`
      <path d="M9 4.8h6l-.8 3.1c2 1.1 3.3 3.3 3.3 5.9 0 4.2-2.3 6.2-5.5 6.2s-5.5-2-5.5-6.2c0-2.6 1.3-4.8 3.3-5.9Z" fill="#b86637" stroke="#71371f" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M8.9 4.8c.7 1 5.5 1 6.2 0M9.8 8.1c1.4.8 3 .8 4.4 0M7.4 13.2c2.5 1.5 6.7 1.5 9.2 0" fill="none" stroke="#f0b777" stroke-width="1" stroke-linecap="round"/>
      <path d="M6.8 12.1c-2.2-.1-2.7 3.4-.4 3.8M17.2 12.1c2.2-.1 2.7 3.4.4 3.8" fill="none" stroke="#71371f" stroke-width="1.2" stroke-linecap="round"/>
    `),
    "简帛": svg(`
      <path d="M6.1 3.9 14 5.1l-1.8 11.7-7.9-1.2Z" fill="#d99d48" stroke="#7d4d22" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="m8.1 4.2-1.8 11.7M10.5 4.6 8.7 16.3M12.8 4.9 11 16.6" stroke="#9a642a" stroke-width=".8" stroke-linecap="round"/>
      <path d="M5.3 6.5 13.1 7.7M4.9 12.7l7.8 1.2" stroke="#7f2d22" stroke-width="1" stroke-linecap="round"/>
      <path d="M13.4 9.5c2.8-.9 5.8.2 6.3 2.5.5 2.2-1.5 4.4-4.4 5l-5.1 1.1 1.6-7.7Z" fill="#f1d8a3" stroke="#8a5c2e" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M15.1 16.9c-1.4.3-2.7-.3-2.9-1.4s.7-2.2 2-2.5 2.7.3 2.9 1.4-.6 2.2-2 2.5Z" fill="#e6c27e" stroke="#8a5c2e" stroke-width=".9"/>
      <path d="M14.3 11.2h2.7M13.6 13.1h3.1" stroke="#9b6b36" stroke-width=".7" stroke-linecap="round"/>
    `),
    "布匹": svg(`
      <path d="M7.3 5.1h9c1.6 0 2.9 1.1 2.9 2.5v2.2H7.3Z" fill="#304d72" stroke="#19334f" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M5.8 8.8h9.4c1.6 0 2.9 1.1 2.9 2.5v2.1H5.8Z" fill="#a63f34" stroke="#6d2a24" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M4.5 12.3h9.5c1.7 0 3 1.2 3 2.6v2.5H4.5Z" fill="#d6c092" stroke="#8b7041" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M7.3 5.1c-1.3 0-2.3 1-2.3 2.1s1 2.1 2.3 2.1 2.3-.9 2.3-2.1-1-2.1-2.3-2.1Z" fill="#49688e" stroke="#19334f" stroke-width="1"/>
      <path d="M5.8 8.8c-1.3 0-2.4 1-2.4 2.2s1.1 2.2 2.4 2.2 2.4-1 2.4-2.2-1.1-2.2-2.4-2.2Z" fill="#c45a4f" stroke="#6d2a24" stroke-width="1"/>
      <path d="M4.5 12.3c-1.3 0-2.4 1.1-2.4 2.4s1.1 2.4 2.4 2.4 2.5-1.1 2.5-2.4-1.1-2.4-2.5-2.4Z" fill="#ead8b0" stroke="#8b7041" stroke-width="1"/>
      <path d="M5 14.7h-1M15.4 5.6v11.6" stroke="#c6923c" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M13.5 7.2c1.2.7 2.7.7 3.9 0M13.5 13.8c1.2.7 2.7.7 3.9 0" fill="none" stroke="#e0b35d" stroke-width=".8" stroke-linecap="round"/>
    `),
    "铜钱": svg(`
      <circle cx="12" cy="12" r="8.6" fill="#c8842c" stroke="#714015" stroke-width="1.3"/>
      <circle cx="12" cy="12" r="6.5" fill="#e4b24c" stroke="#9b6420" stroke-width=".9"/>
      <rect x="9" y="9" width="6" height="6" rx=".6" fill="#fff6ce" stroke="#70431b" stroke-width="1.1"/>
      <path d="M7.2 7.7c2.2-2 7.5-2 9.7 0M7.3 16.2c2.2 2 7.4 2 9.6 0" fill="none" stroke="#fff0a8" stroke-width="1" stroke-linecap="round"/>
    `),
    "武备": svg(`
      <path d="m6 19 4.2-4.2M18 19l-4.2-4.2" stroke="#5b341f" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M5.2 4.5 12 11.3l-1.8 1.8L3.4 6.3l.3-2.1Z" fill="#b8c0c8" stroke="#4f5965" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M18.8 4.5 12 11.3l1.8 1.8 6.8-6.8-.3-2.1Z" fill="#cfd6dd" stroke="#4f5965" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="m8.8 12.7 2.5 2.5M15.2 12.7l-2.5 2.5" stroke="#7a4a2a" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="12" cy="13.4" r="1.2" fill="#c58a3b" stroke="#6d3f20" stroke-width=".8"/>
    `),
    "经学": svg(`
      <path d="M4.3 6.5c2.4-.9 5.1-.5 7.7 1.1v11.1c-2.4-1.6-5-2-7.7-1.1Z" fill="#f2e5bd" stroke="#7a5830" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M19.7 6.5c-2.4-.9-5.1-.5-7.7 1.1v11.1c2.4-1.6 5-2 7.7-1.1Z" fill="#ead49b" stroke="#7a5830" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M6.6 9.2h3.2M6.6 12h3.2M14.2 9.2h3.2M14.2 12h3.2" stroke="#8a6534" stroke-width=".9" stroke-linecap="round"/>
    `),
    "工学": svg(`
      <path d="M12 3.8 14 5l2.1-.5 1.4 2-.9 1.9.9 1.8-1.4 2-2.1-.5-2 1.2-2-1.2-2.1.5-1.4-2 .9-1.8-.9-1.9 1.4-2L10 5Z" fill="#8fa5a8" stroke="#455d60" stroke-width="1.1" stroke-linejoin="round"/>
      <circle cx="12" cy="8.4" r="2.2" fill="#f5ead3" stroke="#455d60" stroke-width="1"/>
      <path d="m6 18 4-4M10.4 18.4 5.6 13.6M14.3 14.7l4.2 4.2" stroke="#7b542f" stroke-width="1.6" stroke-linecap="round"/>
      <path d="m17.6 14.1 2.1 2.1-1.8 1.8-2.1-2.1Z" fill="#c89143" stroke="#7b542f" stroke-width=".9"/>
    `),
    "史学": svg(`
      <path d="M5.2 4.8h13.6v14.4H5.2Z" fill="#d8b56b" stroke="#75552a" stroke-width="1.2"/>
      <path d="M7.3 4.8v14.4M10.4 4.8v14.4M13.6 4.8v14.4M16.7 4.8v14.4" stroke="#9a7134" stroke-width=".8"/>
      <path d="M7.1 8.2h9.7M7.1 12h9.7M7.1 15.8h9.7" stroke="#6f4f27" stroke-width=".8" stroke-linecap="round"/>
      <path d="M4.1 6.5c-.7 1.5-.7 8.5 0 10M19.9 6.5c.7 1.5.7 8.5 0 10" fill="none" stroke="#5e4322" stroke-width="1"/>
    `),
    "万能基础资源": svg(`
      <path d="M12 3.8 14.1 9l5.3.4-4 3.5 1.3 5.2-4.7-2.8-4.7 2.8 1.3-5.2-4-3.5 5.3-.4Z" fill="#f3cf5a" stroke="#9d6c1e" stroke-width="1.1" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="2.3" fill="#fff3b8" stroke="#9d6c1e" stroke-width=".9"/>
    `),
    "商业": svg(`
      <path d="M5 10.2h14l-1 8.3H6Z" fill="#d9a142" stroke="#7a4a1e" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M4.5 10.2 7 5.5h10l2.5 4.7" fill="#f0c45a" stroke="#7a4a1e" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M8.2 10.4c0 1.4-2.2 1.4-2.2 0M12 10.4c0 1.4-2.3 1.4-2.3 0M15.8 10.4c0 1.4-2.3 1.4-2.3 0M19.5 10.4c0 1.4-2.2 1.4-2.2 0" fill="none" stroke="#8a5421" stroke-width="1"/>
      <rect x="9" y="13" width="6" height="5.5" rx=".8" fill="#fff1bd" stroke="#8a5421" stroke-width=".9"/>
    `),
    "交易": svg(`
      <path d="M5.2 8.5h10.6l-2-2.1M15.8 8.5l-2 2.1M18.8 15.5H8.2l2 2.1M8.2 15.5l2-2.1" fill="none" stroke="#2f6b73" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="7.2" cy="15.5" r="2.4" fill="#d9a142" stroke="#7a4a1e" stroke-width="1"/>
      <circle cx="16.8" cy="8.5" r="2.4" fill="#d9a142" stroke="#7a4a1e" stroke-width="1"/>
    `),
    "折扣": svg(`
      <path d="M5 9.2V5h4.2l9.5 9.5-4.2 4.2Z" fill="#f1d37c" stroke="#7b542f" stroke-width="1.2" stroke-linejoin="round"/>
      <circle cx="7.7" cy="7.7" r="1" fill="#fff6d6" stroke="#7b542f" stroke-width=".8"/>
      <path d="m10 15 5-5M10.5 10.5h.1M14.5 14.5h.1" stroke="#8d342b" stroke-width="1.5" stroke-linecap="round"/>
    `),
    "公会": svg(`
      <path d="M12 3.8 18.8 7v5.2c0 4.2-2.9 6.8-6.8 8-3.9-1.2-6.8-3.8-6.8-8V7Z" fill="#9b6a48" stroke="#5a3524" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M8.3 10.5h7.4M8.3 13.2h7.4M10 16h4" stroke="#f2d9a2" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M12 6.4v11.2" stroke="#6d4128" stroke-width=".9"/>
    `),
    "计分": svg(`
      <path d="M12 3.8 14.2 9l5.6.5-4.2 3.6 1.3 5.5-4.9-2.9-4.9 2.9 1.3-5.5-4.2-3.6L9.8 9Z" fill="#f0c85a" stroke="#8d5d20" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M9 12.1h6M12 9.1v6" stroke="#fff4bc" stroke-width="1.2" stroke-linecap="round"/>
    `),
    "邻国": svg(`
      <path d="M4 12h15M7 8l-3 4 3 4M17 8l3 4-3 4" fill="none" stroke="#446a79" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 6.2h6v11.6H9Z" fill="#e7c77a" stroke="#7a5830" stroke-width="1.1"/>
    `),
    "建造": svg(`
      <path d="M5 18.5h14M7.2 18.5V9.8l4.8-4.2 4.8 4.2v8.7" fill="#d8b56b" stroke="#75552a" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M10 18.5v-5h4v5M8.8 10.7h2M13.2 10.7h2" stroke="#75552a" stroke-width="1.1" stroke-linecap="round"/>
    `)
  };
  return icons[name] || "";
}

function formatIconLabel(name, amount = null) {
  const countText = amount === null ? "" : `×${amount}`;
  return `<span class="icon-label" title="${name}"><span class="icon-symbol ${iconKindClass(name)}">${iconMarkup(name)}</span><span class="icon-name">${name}</span>${countText ? `<span class="icon-count">${countText}</span>` : ""}</span>`;
}

function formatIconText(name, amount = null) {
  const countText = amount === null ? "" : `×${amount}`;
  return `${name}${countText}`;
}

function formatIconMap(map = {}, options = {}) {
  const { includeCoins = true, resources = RESOURCE_NAMES, html = true } = options;
  const parts = [];
  if (includeCoins && map.coins) parts.push(html ? formatIconLabel("铜钱", map.coins) : formatIconText("铜钱", map.coins));
  for (const resource of resources) {
    if (map[resource]) parts.push(html ? formatIconLabel(resource, map[resource]) : formatIconText(resource, map[resource]));
  }
  return parts.length ? parts.join("、") : "免费";
}

function formatCost(cost = []) {
  if (!Array.isArray(cost) || cost.length === 0) return "免费";
  const counts = {};
  cost.forEach((item) => {
    const resource = normalizeCostItem(item);
    if (!resource) return;
    counts[resource] = (counts[resource] || 0) + 1;
  });
  return formatIconMap(counts);
}

function formatResourceMap(cost = {}) {
  return formatIconMap(cost);
}

function resolveCardResourceChoice(card) {
  if (!card) return [];
  if (Array.isArray(card.resourceChoice) && card.resourceChoice.length) return [...card.resourceChoice];
  const text = [card.effectText, card.effect_text, card.description, card.effect]
    .filter((value) => typeof value === "string" && value.trim())
    .join("｜");
  if (!text || !/[二三四]选一/.test(text) || !text.includes("/")) return [];
  const matches = RESOURCE_NAMES.filter((resource) => text.includes(resource));
  return [...new Set(matches)];
}

function formatIconOnlyAmount(name, amount = null) {
  const countText = amount === null ? "" : `×${amount}`;
  return `<span class="icon-label icon-label--compact" title="${name}"><span class="icon-symbol ${iconKindClass(name)}">${iconMarkup(name)}</span>${countText ? `<span class="icon-count">${countText}</span>` : ""}</span>`;
}

function cardText(card) {
  const parts = [];
  const resourceChoice = resolveCardResourceChoice(card);
  if (resourceChoice.length) {
    parts.push(`产出：${resourceChoice.map((resource) => `${resource}×1`).join(" / ")}（每回合${resourceChoice.length}选一）`);
  }
  if (card.produces?.length) parts.push(`产出：${formatProduces(card.produces)}`);
  if (card.points > 0) parts.push(`文明分：${card.points}`);
  if ((card.shields || card.military || 0) > 0) parts.push(`${formatIconLabel("武备")}：+${card.shields || card.military}`);
  if (card.scienceSymbol) parts.push(`学术：${formatIconLabel(card.scienceSymbol)}`);
  if (card.coins > 0) parts.push(`商业：+${formatIconLabel("铜钱", card.coins)}`);
  if (card.effect) parts.push(`效果：${card.effect}`);
  return parts.join("；") || card.description || "";
}

function formatProduces(produces = []) {
  if (!Array.isArray(produces) || !produces.length) return "";
  const counts = {};
  for (const item of produces) {
    const resource = typeof item === "string" ? item : item?.["resource"];
    const amount = typeof item === "string" ? 1 : item?.["amount"] || 1;
    if (!resource) continue;
    counts[resource] = (counts[resource] || 0) + amount;
  }
  return formatIconMap(counts);
}

function iconOnly(name, className = "card-resource-icon") {
  return `<span class="${className} ${iconKindClass(name)}" title="${name}">${iconMarkup(name)}</span>`;
}

function renderResourceChoiceInline(resourceChoice = [], iconClassName = "card-resource-icon", options = {}) {
  const { showSeparators = true } = options;
  if (!Array.isArray(resourceChoice) || !resourceChoice.length) return "";
  return resourceChoice
    .map((resource, index) => `${showSeparators && index ? '<span class="resource-choice-separator" aria-hidden="true">/</span>' : ""}${iconOnly(resource, iconClassName)}`)
    .join("");
}

function compactIcon(name) {
  return `<span class="icon-symbol ${iconKindClass(name)}" title="${name}">${iconMarkup(name)}</span>`;
}

function normalizeCostItem(item) {
  if (typeof item === "string") return item;
  return item?.resource || "";
}

function renderCardCostRail(card) {
  if (!Array.isArray(card.cost) || !card.cost.length) return "";
  const costCount = card.cost.filter(Boolean).length;
  const icons = card.cost
    .filter(Boolean)
    .map((item) => iconOnly(normalizeCostItem(item) === "coins" ? "铜钱" : normalizeCostItem(item), "card-cost-icon"))
    .join("");
  return icons ? `<aside class="card-cost-rail" style="--cost-count:${costCount}">${icons}</aside>` : "";
}

function allCards() {
  return Object.values(state.cards?.ages || {}).flat();
}

function cardChainKey(card) {
  return card?.chainKey || card?.chain_key || "";
}

function hasBuiltChainSource(player, chainFrom) {
  if (!chainFrom) return false;
  return player.built.some((built) => cardChainKey(built) === chainFrom);
}

function canUseChainBuild(player, card) {
  return Boolean(card?.chain_from && hasBuiltChainSource(player, card.chain_from));
}

function chainDisplayNames(chainKey) {
  const names = allCards()
    .filter((card) => cardChainKey(card) === chainKey)
    .map((card) => card.displayName || card.name || card.originalName)
    .filter(Boolean);
  return [...new Set(names)];
}

function iconKindClass(name) {
  if (RESOURCE_NAMES.includes(name) || name === "铜钱" || name === "万能基础资源") return "resource-icon";
  if (SCIENCE_NAMES.includes(name)) return "science-icon";
  if (name === "武备") return "military-icon";
  return "";
}

function iconMarkup(name) {
  return iconSvg(name) || `<span class="icon-fallback" aria-hidden="true">${escapeHtml(String(name || "?").slice(0, 1))}</span>`;
}

function hasPreviousCardLink(card) {
  return Boolean(card?.chain_from || (Array.isArray(card?.chain_from_icons) && card.chain_from_icons.length));
}

function hasNextCardLink(card) {
  return Boolean((Array.isArray(card?.chain_to) && card.chain_to.length) || (Array.isArray(card?.chain_to_icons) && card.chain_to_icons.length));
}

function cardLinkBadges(card, className = "", mode = "both") {
  const badges = [];
  if (mode !== "next" && hasPreviousCardLink(card)) {
    badges.push('<span class="card-link-badge card-link-badge--prev" title="可由上一时代建筑免费升级" aria-label="可由上一时代建筑免费升级">前</span>');
  }
  if (mode !== "prev" && hasNextCardLink(card)) {
    badges.push('<span class="card-link-badge card-link-badge--next" title="可升级到下一时代建筑" aria-label="可升级到下一时代建筑">后</span>');
  }
  return badges.length ? `<div class="card-link-badges${className ? ` ${className}` : ""}">${badges.join("")}</div>` : "";
}

function renderCardChainIcons(card) {
  return cardLinkBadges(card);
}

function summarizeProduces(produces = []) {
  if (!Array.isArray(produces) || !produces.length) return [];
  const counts = {};
  for (const item of produces) {
    const resource = typeof item === "string" ? item : item?.resource;
    const amount = typeof item === "string" ? 1 : item?.amount || 1;
    if (!resource) continue;
    counts[resource] = (counts[resource] || 0) + amount;
  }
  return Object.entries(counts).map(([name, amount]) => ({ name, amount }));
}

function effectIconForCard(card) {
  if (card.tradeDiscount || card.tradeRebate) return "交易";
  if (card.oneTimeBuildDiscount || card.effect?.includes("建造")) return "建造";
  if (card.commerceScore || card.guildScore || card.resolvedPoints || card.points) return "计分";
  if (card.effect?.includes("邻")) return "邻国";
  if (card.color === "purple") return "公会";
  if (card.color === "yellow") return "商业";
  return "计分";
}

function cardOutputLabel(card) {
  if (card.effect) return card.effect;
  if (card.effectText) return card.effectText;
  if (card.effect_text) return card.effect_text;
  if (card.description) return card.description;
  if (card.guildScore) return guildLabel(card.guildScore);
  if (card.commerceScore) return commerceLabel(card.commerceScore);
  if (card.tradeDiscount) return tradeDiscountLabel(card.tradeDiscount);
  if (card.tradeRebate) return "购买铜钱减免";
  if (card.oneTimeBuildDiscount) return "建造折扣";
  return "特殊效果";
}

function renderCardMainOutput(card) {
  const resourceChoice = resolveCardResourceChoice(card);
  if (resourceChoice.length) {
    const showSeparators = resourceChoice.length === 2;
    return `
      <div class="card-output-icons card-output-icons--choice card-output-icons--choice-${resourceChoice.length}">
        ${renderResourceChoiceInline(resourceChoice, "card-output-icon", { showSeparators })}
      </div>
      <p class="card-output-text">${resourceChoice.length}选一资源</p>
    `;
  }
  const produces = summarizeProduces(card.produces);
  if (produces.length) {
    return `
      <div class="card-output-icons">
        ${produces.map((item) => iconOnly(item.name, "card-output-icon")).join("")}
      </div>
      <p class="card-output-text">${produces.map((item) => `${item.name} ×${item.amount}`).join("、")}</p>
    `;
  }
  if (card.points > 0 && card.coins > 0) {
    return `
      <strong class="card-output-number">${card.points}</strong>
      <p class="card-output-text">文明分 +${card.coins} 铜钱</p>
    `;
  }
  if (card.points > 0) {
    return `
      <strong class="card-output-number">${card.points}</strong>
      <p class="card-output-text">文明分</p>
    `;
  }
  if ((card.shields || card.military || 0) > 0) {
    return `
      <div class="card-output-icons">${iconOnly("武备", "card-output-icon")}</div>
      <p class="card-output-text">武备 +${card.shields || card.military}</p>
    `;
  }
  if (card.scienceSymbol) {
    return `
      <div class="card-output-icons">${iconOnly(card.scienceSymbol, "card-output-icon")}</div>
      <p class="card-output-text">${card.scienceSymbol}符号</p>
    `;
  }
  if (card.coins > 0) {
    return `
      <div class="card-output-icons">${iconOnly("铜钱", "card-output-icon")}</div>
      <p class="card-output-text">铜钱 +${card.coins}</p>
    `;
  }
  const iconName = effectIconForCard(card);
  return `
    <div class="card-output-icons">${iconOnly(iconName, "card-output-icon")}</div>
    <p class="card-output-text card-output-effect">${cardOutputLabel(card)}</p>
  `;
}

function guildLabel(kind) {
  const labels = {
    stages: "每段已建区域板 2 分",
    stagesOne: "每段已建区域板 1 分",
    science: "每张绿牌 1 分",
    scienceAll: "自己和邻居每张绿牌 1 分",
    neighborGreen: "左右邻居每张绿牌 1 分",
    scienceSymbols: "每个学术符号 1 分",
    scienceDouble: "自己每张绿牌 2 分",
    commerce: "每张黄牌 1 分",
    neighborYellow: "左右邻居每张黄牌 1 分",
    commerceResourceAll: `自己和邻居每个${formatIconText("布匹")}资源 1 分`,
    neighborBrown: "左右邻居每张棕牌 1 分",
    brown: "每张棕牌 1 分",
    resources: "每张棕/灰牌 1 分",
    neighborGrayDouble: "左右邻居每张灰牌 2 分",
    selfBrownGrayPurple: "自己每张棕/灰/紫牌 1 分",
    grayAll: "自己和邻居每张灰牌 1 分",
    blue: "每张蓝牌 1 分",
    blueAll: "自己和邻居每张蓝牌 1 分",
    neighborBlue: "左右邻居每张蓝牌 1 分",
    military: "每张红牌 1 分",
    militaryAll: "自己和邻居每张红牌 1 分",
    neighborRed: "左右邻居每张红牌 1 分",
    defeats: "每个失败标记 1 分",
    neighborDefeats: "左右邻居每个失败标记 1 分",
    chooseScienceAtEnd: "终局选择 1 个学术符号",
    stagesAll: "自己和邻居每段已建区域板 1 分",
    coins: `每 3 ${formatIconText("铜钱")} 1 分`,
    neighborsBlue: "左右邻居每张蓝牌 1 分",
    yellow: "自己和邻居每张黄牌 1 分",
    uniqueColors: "每种不同颜色已建牌 1 分"
  };
  return labels[kind] || kind;
}

function commerceLabel(rule) {
  if (!rule) return "商业效果";
  if (typeof rule === "string") return rule;
  if (rule.type === "yellow") return `自己每张黄牌 ${rule.points} 分`;
  if (rule.type === "resource") return `每个${formatIconText(rule.resource)}资源 ${rule.points} 分`;
  if (rule.type === "coinsStep") return `每 ${rule.coins} ${formatIconText("铜钱")} ${rule.points} 分`;
  if (rule.type === "neighborColor") return `左右邻居每张${colorLabel(rule.color)} ${rule.points} 分`;
  if (rule.type === "color") return `自己每张${colorLabel(rule.color)} ${rule.points} 分`;
  if (rule.type === "stages") return `自己每段已建区域板 ${rule.points} 分`;
  return "商业效果";
}

function tradeDiscountTypeLabel(resources = []) {
  const normalized = [...new Set(resources)];
  const hasBasic = normalized.some((resource) => BASIC_RESOURCES.includes(resource));
  const hasAdvanced = normalized.some((resource) => ADVANCED_RESOURCES.includes(resource));
  if (hasBasic && hasAdvanced) return "资源";
  if (hasBasic) return "基础资源";
  if (hasAdvanced) return "高级资源";
  return "资源";
}

function tradeSideText(side) {
  return side === "left" ? "左邻" : side === "right" ? "右邻" : side;
}

function tradeDiscountLabel(tradeDiscount) {
  if (!tradeDiscount) return "邻国购买优惠";
  const parts = ["left", "right"]
    .filter((side) => Array.isArray(tradeDiscount[side]) && tradeDiscount[side].length)
    .map((side) => `${tradeSideText(side)}${tradeDiscountTypeLabel(tradeDiscount[side])}每个只需 1 铜钱`);
  return parts.join("｜") || "邻国购买优惠";
}

function log(message) {
  state.logs.unshift(message);
  state.logs = state.logs.slice(0, 80);
  renderLogs();
}

function showView(name) {
  state.view = name;
  for (const id of ["homeView", "roomView", "onlineView", "gameView", "scoreView"]) {
    const view = $(id);
    if (view) view.classList.toggle("hidden", id !== `${name}View`);
  }
  document.body.classList.remove("view-home", "view-room", "view-online", "view-game", "view-score");
  document.body.classList.add(`view-${name}`);
  document.body.dataset.gameMode = state.mode || "";
  if (name === "game" && !["hand", "city", "players", "log"].includes(state.mobileGameTab)) setMobileGameTab("hand");
  syncMobileLandscapeFallback();
  refreshHotseatReturnHomeButtons();
  if (name === "home") {
    scheduleHomeHeroBackground();
    refreshContinueHotseatButton();
  }
  $("resetButton")?.classList.toggle("hidden", name === "home" || name === "room" || name === "online");
}

async function loadData() {
  let boards = window.JIUZHOU_BOARDS;
  let cards = window.JIUZHOU_CARDS;

  if (location.protocol !== "file:") {
    try {
      [boards, cards] = await Promise.all([
        fetch(`data/wonderBoards.json?v=${DATA_ASSET_VERSION}`).then((response) => response.json()),
        fetch(`data/cards.json?v=${DATA_ASSET_VERSION}`).then((response) => response.json())
      ]);
    } catch (error) {
      if (!boards || !cards) throw error;
    }
  }

  if (!boards || !cards) {
    throw new Error("没有找到游戏数据文件。");
  }

  state.boards = normalizeBoards(boards);
  state.cards = cards;
}

function normalizeBoards(boards = []) {
  return boards.map((board) => {
    const cloned = clone(board);
    if (cloned.id === "guanzhong") {
      cloned.ability = GUANZHONG_ABILITY_TEXT;
    }
    if (cloned.id === "jiangnan") {
      cloned.ability = "江南技能：每完成 1 个区域阶段，获得 1 文明分和 2 铜钱；邻国武备必须至少比你高 2 点，才算战胜你。";
    }
    if (cloned.id === "bashu") {
      cloned.ability = "巴蜀技能：游戏结束时，铜钱按每 2 枚 = 1 分计算；邻国武备必须至少比你高 2 点，才算战胜你。";
    }
    if (cloned.id === "qilu") {
      cloned.ability = "齐鲁技能：每集齐一套“经学 + 工学 + 史学”，额外获得 2 分。";
    }
    if (cloned.id === "heluo") {
      cloned.ability = "河洛技能：游戏结束时，每张已建蓝牌额外获得 1 分，不设上限。";
    }
    if (cloned.id === "yanzhao") {
      cloned.ability = "燕赵技能：战争结算时，若战胜 1 方邻国，额外获得 1 分、1 铜钱；若左右两方都战胜，总共额外获得 3 分、3 铜钱。";
    }
    if (cloned.id === "lingnan") {
      cloned.ability = "岭南技能：每当你建造黄牌，立即获得 2 铜钱。游戏结束时，每张已建黄牌额外获得 1 分；邻国武备必须至少比你高 2 点，才算战胜你。";
    }
    return cloned;
  });
}

function isThreePlayerGame() {
  const configuredCount = Number($("playerCount")?.value || 0);
  const playerCount = state.players.length || configuredCount;
  return playerCount === 3;
}

function isLingnanStageOne(stage, player = null) {
  const owner = player || state.players.find((item) => item.board?.stages?.includes(stage));
  return owner?.board?.id === "lingnan" && stage?.name === "南海市舶";
}

function getLingnanBuiltYellowBonus(player) {
  return player?.board?.id === "lingnan"
    ? getBuiltCards(player).filter((card) => card.color === "yellow").length
    : 0;
}

function getLingnanOverseasPartner(player) {
  if (!player?.overseasTradePartnerId) return null;
  return state.players.find((item) => item.id === player.overseasTradePartnerId) || null;
}

function getLingnanTradeCandidates(player) {
  if (!player || player.board?.id !== "lingnan" || state.players.length <= 3) return [];
  const left = getLeftNeighbor(player);
  const right = getRightNeighbor(player);
  return state.players.filter((item) => item.id !== player.id && item.id !== left?.id && item.id !== right?.id);
}

function shouldOpenLingnanOverseasTrade(player, stage) {
  return player?.board?.id === "lingnan"
    && stage?.effects?.effect === "openOverseasTradeRoute"
    && !isThreePlayerGame()
    && !player.overseasTradePartnerId
    && getLingnanTradeCandidates(player).length > 0;
}

function setupEvents() {
  bindClick("continueGameButton", restoreHotseatGame);
  bindClick("clearLocalSaveButton", () => {
    clearHotseatSave();
    location.reload();
  });
  bindClick("startButton", async () => {
    await ensureAppShellMounted();
    if (hasRestorableHotseatGame()) {
      await openContinueHotseatDialog();
      return;
    }
    startNewHotseatRoom();
  });
  bindClick("onlineButton", async () => {
    if (storedOnlineSession()) await openContinueOnlineDialog();
    else await enterOnlineEntry();
  });
  bindClick("rulesButton", openRulesDialog);
  bindClick("homeRulesButton", openRulesDialog);
  bindClick("closeRulesButton", () => $("rulesDialog")?.close());
  bindClick("cancelReturnHomeButton", closeReturnHomeDialog);
  bindClick("confirmReturnHomeButton", confirmReturnHome);
  bindEvent("returnHomeDialog", "close", () => document.body.classList.remove("dialog-open"));
  bindClick("continueHotseatButton", continueHotseatGame);
  bindClick("restartHotseatButton", restartHotseatGameFromDialog);
  bindClick("cancelContinueHotseatButton", closeContinueHotseatDialog);
  bindEvent("continueHotseatDialog", "close", () => document.body.classList.remove("dialog-open"));
  bindClick("reconnectOnlineButton", reconnectOnlineFromDialog);
  bindClick("discardOnlineSessionButton", discardOnlineSessionFromDialog);
  bindClick("cancelContinueOnlineButton", closeContinueOnlineDialog);
  bindEvent("continueOnlineDialog", "close", () => document.body.classList.remove("dialog-open"));
  bindClick("confirmCloseRoomButton", confirmCloseOnlineRoom);
  bindClick("cancelCloseRoomButton", closeCloseRoomConfirmDialog);
  bindEvent("closeRoomConfirmDialog", "close", () => document.body.classList.remove("dialog-open"));
  document.addEventListener("keydown", handleReturnHomeKeydown);
  window.addEventListener("resize", syncMobileLandscapeFallback);
  window.addEventListener("orientationchange", syncMobileLandscapeFallback);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", syncMobileLandscapeFallback);
  window.addEventListener("beforeunload", saveHotseatGame);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveHotseatGame();
  });
  syncMobileLandscapeFallback();
  scheduleHomeHeroBackground();
  updateContinueGameControls();
}

function setupDeferredEvents() {
  if (state.ui.deferredEventsBound) return;
  state.ui.deferredEventsBound = true;
  bindClick("gameRulesButton", openRulesDialog);
  bindClick("closeBoardDetailDialogButton", closeBoardDetail);
  bindEvent("boardDetailDialog", "click", handleBoardDetailDialogBackdrop);
  bindEvent("boardDetailDialog", "close", () => document.body.classList.remove("dialog-open"));
  bindClick("closeJingchuPeekDialogButton", closeJingchuPeekDialog);
  bindEvent("jingchuPeekDialog", "click", handleJingchuPeekDialogBackdrop);
  bindEvent("jingchuPeekDialog", "close", () => document.body.classList.remove("dialog-open"));
  bindClick("discardPileEntry", openDiscardPileDialog);
  bindClick("closeDiscardPileDialogButton", closeDiscardPileDialog);
  bindEvent("discardPileDialog", "click", handleDiscardPileDialogBackdrop);
  bindEvent("discardPileDialog", "close", () => {
    state.discardPilePicker = null;
    document.body.classList.remove("dialog-open");
  });
  bindEvent("playerCount", "change", () => {
    renderRoomSetup();
    state.ui.roomSetupRendered = true;
    ensureBoardPreviewRendered(true);
  });
  bindClick("beginGameButton", beginHotseatGame);
  bindClick("roomReturnHomeButton", requestReturnHome);
  bindClick("createOnlineRoomButton", createOnlineRoom);
  bindClick("joinOnlineRoomButton", joinOnlineRoom);
  bindClick("onlineBackButton", leaveOnlineRoom);
  bindClick("readyOnlineButton", toggleOnlineReady);
  bindClick("copyRoomCodeButton", copyRoomCode);
  bindClick("copyInviteLinkButton", copyInviteLink);
  bindClick("startOnlineGameButton", startOnlineGame);
  bindClick("addAiPlayerButton", addOnlineAIPlayer);
  bindClick("closeOnlineRoomButton", closeOnlineRoom);
  bindClick("returnRoomButton", returnToOnlineRoom);
  bindClick("scoreReturnHomeButton", requestReturnHome);
  bindClick("scoreCloseRoomButton", requestCloseOnlineRoom);
  bindEvent("onlineChatForm", "submit", async (event) => {
    event.preventDefault();
    await submitOnlineChatMessage("lobby");
  });
  bindEvent("gameChatForm", "submit", async (event) => {
    event.preventDefault();
    await submitOnlineChatMessage("game");
  });
  bindClick("newGameButton", () => location.reload());
  bindClick("resetButton", () => location.reload());
  bindClick("gameReturnHomeButton", requestReturnHome);
  bindClick("gameCloseRoomButton", requestCloseOnlineRoom);
  bindClick("nextSeatButton", nextSeat);
  bindClick("tradeConfirmButton", confirmTradePlan);
  bindClick("tradeCancelButton", cancelTradePlan);
  bindClick("tradeCancelFooterButton", cancelTradePlan);
  bindEvent("tradeDialog", "close", () => {
    state.tradeContext = null;
  });
  bindEvent("overseasTradeDialog", "cancel", (event) => event.preventDefault());
  bindEvent("overseasTradeDialog", "close", () => document.body.classList.remove("dialog-open"));
  bindClick("scienceChoiceJingButton", () => chooseScienceChoice("经学"));
  bindClick("scienceChoiceGongButton", () => chooseScienceChoice("工学"));
  bindClick("scienceChoiceShiButton", () => chooseScienceChoice("史学"));
  bindEvent("scienceChoiceDialog", "cancel", (event) => event.preventDefault());
  bindClick("closePlayerOverviewDialogButton", closePlayerOverviewDialog);
  bindClick("closeBuiltSlotDialogButton", closeBuiltSlotDialog);
  bindClick("closeCoinLedgerDialogButton", closeCoinLedgerDialog);
  bindClick("closeScoreDetailDialogButton", closeScoreDetailDialog);
  bindEvent("playerOverviewDialog", "click", handlePlayerOverviewDialogBackdrop);
  bindEvent("playerOverviewDialog", "close", handlePlayerOverviewDialogClose);
  bindEvent("builtSlotDialog", "click", handleBuiltSlotDialogBackdrop);
  bindEvent("builtSlotDialog", "close", () => document.body.classList.remove("dialog-open"));
  bindEvent("coinLedgerDialog", "click", handleCoinLedgerDialogBackdrop);
  bindEvent("coinLedgerDialog", "close", () => document.body.classList.remove("dialog-open"));
  bindEvent("scoreDetailDialog", "click", handleScoreDetailDialogBackdrop);
  bindEvent("scoreDetailDialog", "close", () => document.body.classList.remove("dialog-open"));
  bindMobileGameTabs();
  syncMobileLandscapeFallback();
}

function renderRoomSetup() {
  const count = Number($("playerCount").value || 3);
  const setup = $("playerSetup");
  setup.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const row = document.createElement("div");
    row.className = "player-row";

    const input = document.createElement("input");
    input.placeholder = `玩家 ${i + 1}`;
    input.value = `玩家 ${i + 1}`;
    input.dataset.playerName = String(i);

    const select = document.createElement("select");
    select.dataset.boardChoice = String(i);
    select.innerHTML = boardOptions("随机区域");

    const role = document.createElement("select");
    role.dataset.playerRole = String(i);
    role.innerHTML = `
      <option value="human">真人</option>
      <option value="ai:easy">AI：简单</option>
      <option value="ai:normal" ${i > 0 ? "selected" : ""}>AI：普通</option>
      <option value="ai:hard">AI：困难</option>
      <option value="ai:inferno">AI：炼狱</option>
    `;

    row.append(input, select, role);
    setup.append(row);
  }
}

function renderBoardSelects() {
  if ($("hostBoard")) $("hostBoard").innerHTML = boardOptions("随机区域");
  if ($("joinBoard")) $("joinBoard").innerHTML = boardOptions("随机区域");
}

function boardOptions(emptyLabel) {
  return `<option value="">${emptyLabel}</option>${state.boards.map((board) => `<option value="${board.id}">${board.name}</option>`).join("")}`;
}

function formatBoardAbilityHtml(ability = "") {
  const normalized = String(ability || "").replace(/^[^：]+技能：/, "区域特质：").trim();
  if (!normalized) return "";
  const parts = normalized.split("；").map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) return normalized;
  return parts.map((part, index) => `${part}${index < parts.length - 1 ? "；" : ""}`).join("<br>");
}

function boardThemeStyle(board = {}) {
  return `--board-theme:${board.themeColor || "#7e452a"}; --board-accent:${board.accentColor || "#c1913d"}; --board-tint:${board.tintColor || "#f7f1e7"};`;
}

function boardSummaryText(board = {}) {
  return board.summary || String(board.ability || "").split("；")[0] || "查看详情了解区域特质";
}

function boardTotemSvg(board = {}) {
  const common = `viewBox="0 0 64 64" aria-hidden="true" focusable="false"`;
  const stroke = `fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"`;
  const fill = `fill="currentColor"`;
  const icons = {
    ding: `<svg ${common}><path ${stroke} d="M18 20h28M22 20l3 24h14l3-24M24 44h16M25 50h4M35 50h4M22 14h20M28 14c0-5 8-5 8 0"/></svg>`,
    bamboo: `<svg ${common}><path ${stroke} d="M22 10v44M38 10v44M17 22h14M33 22h14M17 38h14M33 38h14M26 14c-5 1-9 4-11 9M42 14c5 1 9 4 11 9"/></svg>`,
    egret: `<svg ${common}><path ${stroke} d="M39 14c-10 2-17 10-17 21 0 8 5 14 13 15M39 14c5 7 5 14 1 21M23 35c-4 4-7 8-9 14M38 14l10-5M33 50l-5 7M38 50l5 7"/></svg>`,
    sunbird: `<svg ${common}><circle ${stroke} cx="32" cy="32" r="8"/><path ${stroke} d="M32 8v10M32 46v10M8 32h10M46 32h10M15 15l7 7M42 42l7 7M49 15l-7 7M22 42l-7 7"/></svg>`,
    jade: `<svg ${common}><circle ${stroke} cx="32" cy="32" r="19"/><circle ${stroke} cx="32" cy="32" r="7"/><path ${stroke} d="M32 13v8M32 43v8M13 32h8M43 32h8"/></svg>`,
    phoenix: `<svg ${common}><path ${stroke} d="M33 13c-8 6-11 13-8 23 2 7 8 11 16 12"/><path ${stroke} d="M33 13c8 4 13 10 15 18M28 31c-7-2-13-6-17-13M31 38c-9 1-16 5-21 12M41 48c-2 4-5 7-9 9M37 22l10-8"/></svg>`,
    "iron-seal": `<svg ${common}><path ${stroke} d="M18 24h28l-4 18H22l-4-18Z"/><path ${stroke} d="M24 24c1-8 15-8 16 0M24 42h16M21 50h22M28 30h8M32 30v7"/></svg>`,
    horse: `<svg ${common}><path ${stroke} d="M17 43c5-11 10-18 20-22l9 8-5 20M24 39h19M20 49h27M36 21l6-8M42 29h7M26 30l-7-4"/></svg>`,
    sail: `<svg ${common}><path ${stroke} d="M18 49h30M25 48V12M27 15c10 4 16 12 18 24H27M25 20c-7 5-10 12-9 21h9"/></svg>`,
    wolf: `<svg ${common}><path ${stroke} d="M16 42l8-22 8 8 8-8 8 22-8 9H24l-8-9Z"/><path ${stroke} d="M25 42h14M25 34h.1M39 34h.1"/><path ${fill} d="M30 41h4l-2 4z"/></svg>`,
    camel: `<svg ${common}><path ${stroke} d="M13 43h38M18 43c1-11 6-19 14-19 4 0 6 3 8 8 2-4 4-6 8-6M24 43v9M43 43v9M49 32l5-7M54 25l-4-3"/></svg>`,
    watchtower: `<svg ${common}><path ${stroke} d="M22 52h20M24 52V22h16v30M20 22h24l-4-10H24l-4 10Z"/><path ${stroke} d="M28 30h8M28 37h8M30 52v-8M34 52v-8"/></svg>`
  };
  return icons[board.totem] || `<svg ${common}><path ${stroke} d="M32 10l18 11v22L32 54 14 43V21l18-11Z"/><path ${stroke} d="M32 20v24M22 26h20"/></svg>`;
}

function renderBoardPreview() {
  $("boardPreview").innerHTML = state.boards.map((board) => `
    <article class="board-card board-summary-card" style="${boardThemeStyle(board)}">
      <div class="board-summary-card__band"></div>
      <div class="board-summary-card__head">
        <span class="board-totem">${boardTotemSvg(board)}</span>
        <div>
          <h4>${board.name}</h4>
          <span class="pill">${board.subtitle}</span>
        </div>
      </div>
      <p><strong class="board-meta-label">初始资源：</strong>${formatResourceMap(board.startResource)}</p>
      <p class="board-summary-text">${boardSummaryText(board)}</p>
      <button type="button" class="ghost board-detail-button" onclick="openBoardDetail('${board.id}')">查看详情</button>
    </article>
  `).join("");
}

function renderBoardDetail(board) {
  return `
    <div class="board-detail-hero" style="${boardThemeStyle(board)}">
      <span class="board-totem board-totem--large">${boardTotemSvg(board)}</span>
      <div>
        <h3>${board.name}</h3>
        <p>${board.subtitle}</p>
      </div>
    </div>
    <section class="board-detail-section">
      <p><strong class="board-meta-label">初始资源：</strong>${formatResourceMap(board.startResource)}</p>
      <p class="board-ability"><strong class="board-meta-label">完整区域特质：</strong>${formatBoardAbilityHtml(board.ability).replace(/^区域特质：/, "")}</p>
    </section>
    <section class="board-detail-section">
      <h4>区域阶段</h4>
      <div class="stage-list board-detail-stage-list">
        ${board.stages.map((stage, index) => `
          <div class="stage board-detail-stage">
            <strong>${index + 1}. ${stage.name}</strong>
            <p><strong class="board-meta-label">成本：</strong>${formatResourceMap(stage.cost)}</p>
            <p><strong class="board-meta-label">奖励：</strong>${describeStage(stage)}</p>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function openBoardDetail(boardId) {
  const board = state.boards.find((item) => item.id === boardId);
  if (!board) return;
  const dialog = $("boardDetailDialog");
  $("boardDetailDialogTitle").textContent = `${board.name}｜${board.subtitle}`;
  $("boardDetailDialogBody").innerHTML = renderBoardDetail(board);
  dialog.setAttribute("style", boardThemeStyle(board));
  document.body.classList.add("dialog-open");
  if (!dialog.open) dialog.showModal();
}

function closeBoardDetail() {
  if ($("boardDetailDialog")?.open) $("boardDetailDialog").close();
}

function handleBoardDetailDialogBackdrop(event) {
  const dialog = $("boardDetailDialog");
  const rect = dialog.getBoundingClientRect();
  const clickedInside = rect.top <= event.clientY
    && event.clientY <= rect.top + rect.height
    && rect.left <= event.clientX
    && event.clientX <= rect.left + rect.width;
  if (!clickedInside) closeBoardDetail();
}

function renderJingchuPeekDialogBody(player) {
  if (!canLocalPlayerUseJingchuPeek(player)) return `<p class="hint">当前不能查看来牌上家手牌。</p>`;
  const incoming = getJingchuIncomingPlayer(player);
  const hand = normalizeHand(incoming?.hand);
  if (!incoming) return `<p class="hint">暂无可查看的来牌上家。</p>`;
  return `
    <div class="jingchu-peek-note">
      <strong>楚巫占策</strong>
      <p>你正在查看 ${incoming.name} 当前手牌。此窗口只读，不能选择或操作这些牌。</p>
    </div>
    ${hand.length
      ? `<div class="readonly-card-grid">${hand.map((card) => renderReadonlyCard(card, incoming)).join("")}</div>`
      : `<p class="hint">${incoming.name} 当前没有手牌。</p>`}
  `;
}

function openJingchuPeekDialog(playerId = currentPlayer()?.id) {
  const player = state.players.find((item) => item.id === playerId);
  if (!player || !canLocalPlayerUseJingchuPeek(player)) return;
  $("jingchuPeekDialogTitle").textContent = `${player.name}｜楚巫占策`;
  $("jingchuPeekDialogBody").innerHTML = renderJingchuPeekDialogBody(player);
  document.body.classList.add("dialog-open");
  $("jingchuPeekDialog").showModal();
}

function closeJingchuPeekDialog() {
  if ($("jingchuPeekDialog")?.open) $("jingchuPeekDialog").close();
}

function handleJingchuPeekDialogBackdrop(event) {
  const dialog = $("jingchuPeekDialog");
  const rect = dialog.getBoundingClientRect();
  const clickedInside = rect.top <= event.clientY
    && event.clientY <= rect.top + rect.height
    && rect.left <= event.clientX
    && event.clientX <= rect.left + rect.width;
  if (!clickedInside) closeJingchuPeekDialog();
}

function parsePlayerRoleSelection(value = "human") {
  if (String(value).toLowerCase() === "human") {
    return { kind: "human", aiDifficulty: null };
  }
  const [kindPart, difficultyPart] = String(value).split(":");
  const kind = String(kindPart || "human").toLowerCase();
  if (kind !== "ai") {
    return { kind: "human", aiDifficulty: null };
  }
  return { kind: "ai", aiDifficulty: difficultyPart || "normal" };
}

function beginHotseatGame() {
  const names = [...document.querySelectorAll("[data-player-name]")].map((input, index) => input.value.trim() || `玩家 ${index + 1}`);
  const choices = [...document.querySelectorAll("[data-board-choice]")].map((select) => select.value);
  const roles = [...document.querySelectorAll("[data-player-role]")].map((select) => parsePlayerRoleSelection(select.value));
  const players = buildPlayers(names.map((name, index) => ({
    id: safeId(),
    name,
    boardChoice: choices[index],
    kind: roles[index].kind,
    aiDifficulty: roles[index].aiDifficulty
  })));
  if (!players) return;
  try {
    validateDeckConfig();
    validateUniqueCards();
  } catch (error) {
    alert(error.message);
    return;
  }

  state.mode = "hotseat";
  state.phase = "game";
  state.players = shuffle(players);
  state.age = 1;
  state.turn = 1;
  state.seatCursor = 0;
  state.selected = {};
  state.pendingChoice = {};
  state.hedongDiscardChoice = null;
  state.resolvedSpecialEffects = {};
  state.discardPile = [];
  state.discardPilePicker = null;
  state.logs = [];
  showView("game");
  startAge(1);
  log(`座次已随机确定：${state.players.map((player) => `${player.name}（${player.board.name}）`).join(" → ")}`);
  saveHotseatGame();
}

function buildPlayers(entries) {
  const choices = entries.map((entry) => entry.boardChoice).filter(Boolean);
  const duplicateChoice = choices.some((choice, index, list) => list.indexOf(choice) !== index);
  if (duplicateChoice) {
    alert("每个区域板只能被一名玩家选择。");
    return null;
  }
  if (entries.length < 3 || entries.length > 7) {
    alert("联机和热座都支持 3-7 名玩家。");
    return null;
  }
  const pickedBoards = entries.map((entry) => state.boards.find((board) => board.id === entry.boardChoice) || null);
  const freeBoards = shuffle(state.boards.filter((board) => !choices.includes(board.id)));
  return entries.map((entry, index) => {
    const board = clone(pickedBoards[index] || freeBoards.pop());
    return {
      id: entry.id,
      name: entry.name,
      board,
      kind: entry.kind || "human",
      isAI: (entry.kind || "human") === "ai",
      aiDifficulty: (entry.kind || "human") === "ai" ? (entry.aiDifficulty || "normal") : null,
      boardChoice: entry.boardChoice || "",
      joinedAt: entry.joinedAt || Date.now(),
      coins: 3,
      hand: [],
      built: [],
      stagesBuilt: 0,
      tucked: [],
      militaryTokens: [],
      coinLedger: [],
      coinLogs: [],
      specialScoreLogs: [],
      temporaryBuildDiscounts: [],
      freeFirstCardUsedByAge: {},
      extraCoinsFirstGainUsedByRound: {},
      soldCardCount: 0
    };
  });
}

async function createOnlineRoom() {
  try {
    $("createOnlineRoomButton").disabled = true;
    showLoading("正在创建房间中……");
    await maybeCleanupExpiredRooms(true);
    const db = await ensureFirebase();
    const code = roomCode();
    const playerId = clientPlayerId();
    const name = $("hostName").value.trim() || "房主";
    const now = Date.now();
    beginOnlineSyncNotice();
    const room = {
      status: "lobby",
      phase: "lobby",
      hostId: playerId,
      createdAt: now,
      ...roomLeasePayload(now),
      chat: {},
      players: {
        [playerId]: { id: playerId, name, boardChoice: "", boardMode: "random", ready: false, joinedAt: now, lastSeen: now }
      },
      game: null
    };
    const ref = db.ref(`rooms/${code}`);
    await firebaseSet(ref, room);
    updateLoading("正在同步房间状态……");
    saveOnlineSession(code, playerId, name);
    attachRoom(code, playerId, ref);
    $("onlineStatus").textContent = "已创建房间";
  } catch (error) {
    $("createOnlineRoomButton").disabled = false;
    hideLoading();
    showOnlineError(error);
  }
}

async function joinOnlineRoom() {
  if (state.online.joining || state.online.roomRef) return;
  state.online.joining = true;
  $("joinOnlineRoomButton").disabled = true;
  showLoading("正在加入房间中……");
  beginOnlineSyncNotice();
  try {
    const db = await ensureFirebase();
    const code = $("joinCode").value.trim().toUpperCase();
    if (!code) throw new Error("请输入房间码。");
    const ref = db.ref(`rooms/${code}`);
    const snapshot = await ref.get();
    if (!snapshot.exists()) throw new Error("没有找到这个房间，可能房间码已失效。");
    const room = snapshot.val();
    const status = roomStatus(room);
    if (status === "closed") throw new Error("房间已关闭。");
    if (status !== "lobby" && status !== "waiting") throw new Error("这局已经开始，暂时不能中途加入。");
    const playerMap = room.players || {};
    const players = uniqueLobbyPlayers(room);
    const playerId = clientPlayerId();
    const existingPlayer = playerMap[playerId];
    const name = $("joinName").value.trim() || "玩家";
    const now = Date.now();
    if (!existingPlayer && players.length >= 7) throw new Error("房间已满。");
    await firebaseUpdate(ref.child(`players/${playerId}`), {
      id: playerId,
      name,
      boardChoice: existingPlayer?.boardChoice || "",
      boardMode: existingPlayer?.boardMode || "random",
      ready: existingPlayer?.ready || false,
      joinedAt: existingPlayer?.joinedAt || now,
      lastSeen: now
    });
    await firebaseUpdate(ref, roomLeasePayload(now));
    updateLoading("正在同步房间状态……");
    saveOnlineSession(code, playerId, name);
    attachRoom(code, playerId, ref);
    finishOnlineSyncNotice(existingPlayer ? "重连成功" : "已加入房间");
  } catch (error) {
    state.online.joining = false;
    $("joinOnlineRoomButton").disabled = false;
    hideLoading();
    showOnlineError(error);
  }
}

async function toggleOnlineReady() {
  if (!state.online.roomRef || !state.online.localPlayerId || !state.online.roomData) return;
  const player = state.online.roomData.players?.[state.online.localPlayerId];
  if (!player) return;
  const button = $("readyOnlineButton");
  if (button) button.disabled = true;
  try {
    const now = Date.now();
    await firebaseUpdate(state.online.roomRef, {
      [`players/${state.online.localPlayerId}/ready`]: !player.ready,
      [`players/${state.online.localPlayerId}/lastSeen`]: now,
      ...roomLeasePayload(now)
    });
  } catch (error) {
    showOnlineError(error);
  } finally {
    if (button) button.disabled = false;
  }
}

async function addOnlineAIPlayer() {
  const room = state.online.roomData;
  if (!state.online.isHost || !state.online.roomRef || !room) return;
  const players = orderedLobbyPlayers(room);
  if (players.length >= 7) {
    $("lobbyHint").textContent = "房间已满，最多 7 名玩家。";
    return;
  }
  const difficulty = "normal";
  const ordinal = nextAiOrdinal(room);
  const aiId = `ai-${safeId()}`;
  const now = Date.now();
  await firebaseUpdate(state.online.roomRef.child(`players/${aiId}`), {
    id: aiId,
    name: `AI 玩家 ${ordinal}`,
    kind: "ai",
    isAI: true,
    aiDifficulty: difficulty,
    boardChoice: "",
    boardMode: "random",
    ready: true,
    joinedAt: now,
    lastSeen: now
  });
  await firebaseUpdate(state.online.roomRef, roomLeasePayload(now));
}

async function removeOnlineAIPlayer(playerId) {
  const room = state.online.roomData;
  if (!state.online.isHost || !state.online.roomRef || !room) return;
  const player = room.players?.[playerId];
  const status = roomStatus(room);
  if (!isAiRecord(player) || (status !== "lobby" && status !== "waiting" && status !== "finished")) return;
  const now = Date.now();
  await state.online.roomRef.child(`players/${playerId}`).remove();
  await firebaseUpdate(state.online.roomRef, roomLeasePayload(now));
}

async function leaveOnlineRoom() {
  const ref = state.online.roomRef;
  const playerId = state.online.localPlayerId;
  const room = state.online.roomData;
  if (!ref || !playerId || !room) {
    showView("home");
    return;
  }
  showLoading("正在离开房间……");
  detachRoomListener();
  if (ref) {
    if ((roomStatus(room) === "lobby" || roomStatus(room) === "waiting" || roomStatus(room) === "finished") && playerId) {
      try {
        const remainingPlayers = orderedLobbyPlayers(room).filter((player) => player.id !== playerId);
        if (!remainingPlayers.length) {
          await ref.remove();
        } else {
          const now = Date.now();
          await ref.child(`players/${playerId}`).remove();
          const updates = roomLeasePayload(now);
          if (room.hostId === playerId) updates.hostId = remainingPlayers.find((player) => !isAiRecord(player))?.id || remainingPlayers[0].id;
          await firebaseUpdate(ref, updates);
        }
        clearOnlineSession();
      } catch (error) {
        console.warn("Leave online room failed", error);
      }
    }
  }
  showOnlineEntry("未连接");
  hideLoading();
}

function attachRoom(code, playerId, ref) {
  state.mode = "online";
  state.online.roomCode = code;
  state.online.localPlayerId = playerId;
  state.online.roomRef = ref;
  state.online.joining = false;
  state.online.roomClosedNotified = false;
  state.online.kickedNotified = false;
  state.online.lobbyPreview = false;
  detachRoomListener();
  beginOnlineSyncNotice();
  state.online.roomStatusListener = (snapshot) => {
    const rawStatus = snapshot.val();
    const status = rawStatus == null
      ? ""
      : roomStatus({ status: rawStatus, phase: state.online.roomData?.phase || state.phase });
    handleIncomingOnlineStatus(status);
  };
  state.online.roomChatListener = (snapshot) => {
    applyIncomingRoomChat(snapshot.val() || {});
  };
  ref.child("status").on("value", state.online.roomStatusListener);
  ref.child("chat").on("value", state.online.roomChatListener);
  attachLobbyRoomListener();
}

function detachRoomListener() {
  if (state.online.roomListenerTimer) {
    clearTimeout(state.online.roomListenerTimer);
    state.online.roomListenerTimer = null;
  }
  detachLobbyRoomListener();
  detachGameRoomListener();
  if (state.online.roomRef && state.online.roomStatusListener) {
    state.online.roomRef.child("status").off("value", state.online.roomStatusListener);
  }
  if (state.online.roomRef && state.online.roomChatListener) {
    state.online.roomRef.child("chat").off("value", state.online.roomChatListener);
  }
  state.online.roomListener = null;
  state.online.roomStatusListener = null;
  state.online.roomChatListener = null;
  state.online.roomGameListener = null;
  state.online.roomRenderSignature = "";
  state.online.roomChatSignature = "";
  state.online.roomGameSignature = "";
  state.online.roomChannel = "";
  state.online.roomStatusValue = "";
  state.online.pendingRoomSnapshot = null;
}

function attachLobbyRoomListener() {
  if (!state.online.roomRef || state.online.roomListener) return;
  state.online.roomChannel = "lobby";
  state.online.roomListener = (snapshot) => {
    const room = snapshot.val();
    if (!room) {
      const message = state.online.roomClosedNotified ? "" : "房间已被房主关闭。";
      state.online.roomClosedNotified = true;
      showOnlineEntry(message || "房间已被房主关闭。", Boolean(message));
      return;
    }
    const status = roomStatus(room);
    if (status === "playing" || status === "finished") return;
    const signature = roomRenderSignature(room);
    if (signature === state.online.roomRenderSignature) return;
    state.online.roomRenderSignature = signature;
    state.online.pendingRoomSnapshot = null;
    state.online.roomListenerTimer = null;
    applyIncomingLobbySnapshot(room);
  };
  state.online.roomRef.on("value", state.online.roomListener);
}

function detachLobbyRoomListener() {
  if (state.online.roomRef && state.online.roomListener) {
    state.online.roomRef.off("value", state.online.roomListener);
  }
  state.online.roomListener = null;
  if (state.online.roomChannel === "lobby") state.online.roomChannel = "";
}

function attachGameRoomListener() {
  if (!state.online.roomRef || state.online.roomGameListener) return;
  state.online.roomChannel = "game";
  state.online.roomGameListener = (snapshot) => {
    applyIncomingGameSnapshot(snapshot.val());
  };
  state.online.roomRef.child("game").on("value", state.online.roomGameListener);
}

function detachGameRoomListener() {
  if (state.online.roomRef && state.online.roomGameListener) {
    state.online.roomRef.child("game").off("value", state.online.roomGameListener);
  }
  state.online.roomGameListener = null;
  if (state.online.roomChannel === "game") state.online.roomChannel = "";
}

function roomRenderSignature(room) {
  const cleaned = clone(room || {});
  delete cleaned.updatedAt;
  delete cleaned.expiresAt;
  delete cleaned.chat;
  if (cleaned.players && typeof cleaned.players === "object") {
    for (const player of Object.values(cleaned.players)) {
      if (player && typeof player === "object") delete player.lastSeen;
    }
  }
  if (isDebugEnabled()) {
    console.log("[ROOM_SIGNATURE] includes hand ids", summarizeRoomForDebug(cleaned));
  }
  return JSON.stringify(cleaned);
}

function gameRenderSignature(game) {
  const cleaned = clone(game || {});
  if (cleaned.players && typeof cleaned.players === "object") {
    for (const player of Object.values(cleaned.players)) {
      if (player && typeof player === "object") delete player.lastSeen;
    }
  }
  return JSON.stringify(cleaned);
}

function chatRenderSignature(chat) {
  return JSON.stringify(chat || {});
}

function summarizeRoomForDebug(room) {
  const playerSummary = Object.fromEntries(Object.entries(room?.players || {}).map(([id, player]) => [
    id,
    {
      handIds: normalizeHand(player?.hand).map((card) => card?.id).filter(Boolean),
      confirmedAction: player?.confirmedAction?.cardId || null,
      builtIds: normalizeHand(player?.built).map((card) => card?.id).filter(Boolean),
      coins: player?.coins || 0,
      stagesBuilt: player?.stagesBuilt || 0
    }
  ]));
  return {
    status: room?.status || "",
    phase: room?.phase || room?.game?.phase || "",
    age: room?.age || room?.game?.age || 0,
    round: room?.round || room?.game?.round || room?.game?.turn || 0,
    selected: Object.keys(room?.selected || room?.game?.selected || {}),
    players: playerSummary
  };
}

function applyIncomingLobbySnapshot(room) {
  if (!room) return;
  state.online.roomStatusValue = roomStatus(room);
  state.online.roomData = room;
  state.online.hostId = room.hostId;
  state.online.isHost = room.hostId === state.online.localPlayerId;
  const status = state.online.roomStatusValue;
  if (isDebugEnabled()) {
    console.log("[SNAPSHOT_APPLY] selected ids", Object.keys(room.selected || room.game?.selected || {}));
    console.log("[SNAPSHOT_APPLY] age round", room.age || room.game?.age || 1, room.round || room.game?.round || room.game?.turn || 1);
    console.log("[SNAPSHOT_APPLY] isHost", state.online.isHost);
  }
  if (status === "lobby" || status === "waiting") {
    state.online.starting = false;
  }
  const localPlayer = room.players?.[state.online.localPlayerId];
  if (!localPlayer && status !== "closed") {
    if (!state.online.kickedNotified) {
      state.online.kickedNotified = true;
      showOnlineEntry("你已被房主踢出房间。", true);
      hideLoading();
    }
    return;
  }
  if (status === "closed") {
    if (!state.online.roomClosedNotified) {
      state.online.roomClosedNotified = true;
      showOnlineEntry("房间已被房主关闭。", true);
      hideLoading();
    }
    return;
  }
  state.online.roomClosedNotified = false;
  state.online.kickedNotified = false;
  finishOnlineSyncNotice("房间已同步");
  if (status === "lobby" || status === "waiting") {
    resetLocalOnlineGameStateForLobby();
    state.online.lobbyPreview = false;
    renderOnlineLobby(room);
    showView("online");
    hideLoading();
    return;
  }
}

function applyIncomingRoomChat(chat) {
  const signature = chatRenderSignature(chat);
  if (signature === state.online.roomChatSignature) return;
  state.online.roomChatSignature = signature;
  if (!state.online.roomData) state.online.roomData = {};
  state.online.roomData.chat = chat || {};
  renderOnlineChatPanels(state.online.roomData);
}

function applyIncomingGameSnapshot(game) {
  const status = state.online.roomStatusValue || roomStatus(state.online.roomData || {});
  if (status !== "playing" && status !== "finished") return;
  if (!game) return;
  const signature = gameRenderSignature(game);
  if (signature === state.online.roomGameSignature) return;
  const mergedRoom = {
    ...(state.online.roomData || {}),
    status,
    phase: status === "finished" ? "score" : (game.phase || state.online.roomData?.phase || "game"),
    hostId: state.online.hostId || state.online.roomData?.hostId || "",
    age: game.age ?? state.online.roomData?.age ?? 1,
    round: game.turn ?? game.round ?? state.online.roomData?.round ?? 1,
    players: game.players || state.online.roomData?.players || {},
    selected: game.selected || {},
    seventhCard: game.seventhCard || null,
    overseasTradeChoice: game.overseasTradeChoice || null,
    log: game.logs || [],
    game: {
      ...game,
      players: game.players || {}
    }
  };
  if (shouldIgnoreStaleRoomSnapshot(mergedRoom)) {
    if (isDebugEnabled()) {
      console.warn("[STALE_GAME_SNAPSHOT_IGNORED] incoming", roomTurnState(mergedRoom));
      console.warn("[STALE_GAME_SNAPSHOT_IGNORED] current", currentTurnState());
    }
    return;
  }
  state.online.roomGameSignature = signature;
  state.online.roomData = mergedRoom;
  state.online.hostId = mergedRoom.hostId;
  state.online.isHost = mergedRoom.hostId === state.online.localPlayerId;
  const localPlayer = mergedRoom.players?.[state.online.localPlayerId];
  if (!localPlayer && status !== "closed") {
    if (!state.online.kickedNotified) {
      state.online.kickedNotified = true;
      showOnlineEntry("你已被房主踢出房间。", true);
      hideLoading();
    }
    return;
  }
  state.online.roomClosedNotified = false;
  state.online.kickedNotified = false;
  finishOnlineSyncNotice(status === "finished" ? "结算同步中" : "游戏同步中");
  applyRoomGameState(mergedRoom);
  showView(status === "finished" ? "score" : "game");
  if (status === "finished") renderScores();
  else renderGame();
  hideLoading();
  maybeDriveOnlineAI();
  if (isDebugEnabled()) console.log("[SNAPSHOT_APPLY] willMaybeResolve", state.online.isHost);
  maybeResolveOnlineTurn();
  if (state.phase === "liaodong-guard-choice") maybeResolveOnlineLiaodongGuardChoicePhase();
  if (state.phase === "liaodong-resource-choice") maybeResolveOnlineLiaodongResourceChoicePhase();
  if (state.phase === "hedong-discard-choice") maybeResolveOnlineHedongDiscardBuildChoicePhase();
  if (state.phase === "guanzhong-resource-choice") maybeResolveOnlineGuanzhongResourceChoicePhase();
  if (state.phase === "end-science-choice") maybeResolveOnlineScienceChoicePhase();
}

function handleIncomingOnlineStatus(status) {
  if (!status) {
    const message = state.online.roomClosedNotified ? "" : "房间已被房主关闭。";
    state.online.roomClosedNotified = true;
    showOnlineEntry(message || "房间已被房主关闭。", Boolean(message));
    return;
  }
  state.online.roomStatusValue = status;
  if (status === "closed") {
    if (!state.online.roomClosedNotified) {
      state.online.roomClosedNotified = true;
      showOnlineEntry("房间已被房主关闭。", true);
      hideLoading();
    }
    return;
  }
  if (status === "lobby" || status === "waiting") {
    state.online.roomRenderSignature = "";
    detachGameRoomListener();
    attachLobbyRoomListener();
    return;
  }
  state.online.roomGameSignature = "";
  detachLobbyRoomListener();
  attachGameRoomListener();
}

function renderOnlineLobby(room) {
  $("onlineEntry").classList.add("hidden");
  $("onlineLobby").classList.remove("hidden");
  hideInviteCard();
  $("onlineBackButton").textContent = "离开房间";
  $("roomCodeLabel").textContent = state.online.roomCode;
  const players = orderedLobbyPlayers(room);
  const blockReason = startBlockReason(room);
  const localPlayer = room.players?.[state.online.localPlayerId];
  const status = roomStatus(room);
  const canManageLobby = status === "lobby" || status === "waiting" || status === "finished";
  const canReady = Boolean(localPlayer) && !isAiRecord(localPlayer) && (status === "lobby" || status === "waiting");
  $("hostAiControls").classList.toggle("hidden", !state.online.isHost || !canManageLobby);
  $("addAiPlayerButton").disabled = !state.online.isHost || players.length >= 7;
  $("lobbyPlayers").innerHTML = players.map((player) => {
    const isAi = isAiRecord(player);
    const roleText = isAi ? `AI：${aiLabel(player.aiDifficulty || "normal")}` : "真人";
    const readyText = player.ready ? "已准备" : "未准备";
    const allowBoardControl = canManageLobby && (player.id === state.online.localPlayerId || (state.online.isHost && isAi));
    return `
      <div class="lobby-player">
        <div class="lobby-player__header">
          <strong>${player.name}${player.id === room.hostId ? " · 房主" : ""}</strong>
          <span class="lobby-player__badges">
            <span class="pill ${player.ready ? "ready" : ""}">${readyText}</span>
            <span class="pill">${roleText}</span>
          </span>
        </div>
        <p class="lobby-player__board">区域：${playerBoardLabel(player)}</p>
        ${allowBoardControl ? `
          <div class="lobby-player__controls">
            <select onchange="handleLobbyBoardChange('${player.id}', this.value)">
              ${boardOptionsForLobby(room, player)}
            </select>
            ${state.online.isHost && isAi ? `
              <select onchange="updateOnlineAiDifficulty('${player.id}', this.value)">
                ${Object.entries(AI_DIFFICULTIES).map(([value, label]) => `<option value="${value}" ${value === (player.aiDifficulty || "normal") ? "selected" : ""}>AI：${label}</option>`).join("")}
              </select>
            ` : ""}
          </div>
        ` : ""}
        <div class="lobby-player__actions">
          ${isAi && state.online.isHost && canManageLobby ? `<button class="ghost lobby-remove-ai" onclick="removeOnlineAIPlayer('${player.id}')">移除 AI</button>` : ""}
          ${!isAi && state.online.isHost && player.id !== state.online.localPlayerId && canManageLobby ? `<button class="ghost danger" onclick="kickOnlinePlayer('${player.id}')">踢出玩家</button>` : ""}
        </div>
      </div>
    `;
  }).join("");
  $("lobbyHint").textContent = blockReason || "所有玩家已准备，房主可以开局。AI 自动行动，由房主客户端负责执行同步，避免多人重复写入。";
  $("readyOnlineButton").textContent = localPlayer?.ready ? "取消准备" : "准备";
  $("readyOnlineButton").disabled = !canReady;
  $("startOnlineGameButton").disabled = Boolean(blockReason) || state.online.starting;
  $("startOnlineGameButton").classList.toggle("hidden", !state.online.isHost);
  renderOnlineChatPanels(room);
}

function orderedLobbyPlayers(room) {
  return uniqueLobbyPlayers(room).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
}

function uniqueLobbyPlayers(room) {
  const byId = new Map();
  for (const [id, player] of Object.entries(room?.players || {})) {
    if (!player) continue;
    byId.set(player.id || id, { ...player, id: player.id || id });
  }
  return [...byId.values()];
}

function isAiRecord(player) {
  return player?.isAI === true || String(player?.kind || "").toLowerCase() === "ai";
}

function nextAiOrdinal(room) {
  return uniqueLobbyPlayers(room).filter((player) => isAiRecord(player)).length + 1;
}

function roomStatus(room) {
  if (!room) return "lobby";
  if (room.status) return room.status;
  if (room.phase === "game") return "playing";
  if (room.phase === "score") return "finished";
  return room.phase || "lobby";
}

function playerBoardLabel(player) {
  if (!player) return "未选择";
  if (player.boardChoice) {
    const board = state.boards.find((item) => item.id === player.boardChoice);
    return board?.name || player.boardChoice;
  }
  if (player.boardMode === "random") return "随机";
  return "未选择";
}

function boardOptionsForLobby(room, player) {
  const taken = selectedBoardIds(room, player?.id);
  const currentChoice = player?.boardChoice || "";
  const isRandomSelected = !currentChoice && player?.boardMode === "random";
  return [
    `<option value="__random__" ${isRandomSelected ? "selected" : ""}>随机区域</option>`,
    ...state.boards.map((board) => {
      const disabled = board.id !== currentChoice && taken.has(board.id);
      return `<option value="${board.id}" ${board.id === currentChoice ? "selected" : ""} ${disabled ? "disabled" : ""}>${board.name}</option>`;
    })
  ].join("");
}

function selectedBoardIds(room, excludePlayerId = "") {
  return new Set(uniqueLobbyPlayers(room)
    .filter((player) => player.id !== excludePlayerId && player.boardChoice)
    .map((player) => player.boardChoice));
}

function hasDuplicateBoardSelections(room) {
  const seen = new Set();
  for (const player of uniqueLobbyPlayers(room)) {
    if (!player.boardChoice) continue;
    if (seen.has(player.boardChoice)) return true;
    seen.add(player.boardChoice);
  }
  return false;
}

function availableBoards(room, excludePlayerId = "") {
  const taken = selectedBoardIds(room, excludePlayerId);
  return state.boards.filter((board) => !taken.has(board.id));
}

function startBlockReason(room) {
  const status = roomStatus(room);
  const players = orderedLobbyPlayers(room);
  if (!state.online.isHost) return "只有房主可以开始";
  if (status !== "lobby" && status !== "waiting" && status !== "finished") return "房间状态异常";
  if (players.length < 3) return "至少需要3名玩家";
  if (players.length > 7) return "房间状态异常";
  if (hasDuplicateBoardSelections(room)) return "区域选择重复";
  if (!players.every((player) => player.boardChoice || player.boardMode === "random")) return "还有玩家未选择区域";
  if (!players.every((player) => player.ready === true)) return "还有玩家未准备";
  return "";
}

function resolveLobbyBoards(entries) {
  const fixedChoices = entries.filter((entry) => entry.boardChoice).map((entry) => entry.boardChoice);
  if (new Set(fixedChoices).size !== fixedChoices.length) {
    throw new Error("区域选择重复");
  }
  const freeBoards = shuffle(state.boards.filter((board) => !fixedChoices.includes(board.id)));
  return entries.map((entry) => {
    if (entry.boardChoice) return { ...entry, boardMode: "specific" };
    if (entry.boardMode === "random") {
      const board = freeBoards.pop();
      if (!board) throw new Error("没有可用区域。");
      return { ...entry, boardChoice: board.id, boardMode: "specific" };
    }
    throw new Error("还有玩家未选择区域。");
  });
}

async function setOnlineBoardChoice(playerId, boardId) {
  const roomRef = state.online.roomRef;
  if (!roomRef || !playerId || !boardId) return;
  let errorMessage = "";
  const result = await roomRef.transaction((current) => {
    if (!current) return current;
    const status = roomStatus(current);
    if (status !== "lobby" && status !== "waiting" && status !== "finished") return;
    const players = current.players || {};
    const player = players[playerId];
    if (!player) return current;
    const taken = Object.values(players)
      .filter((entry) => entry && entry.id !== playerId && entry.boardChoice)
      .map((entry) => entry.boardChoice);
    if (taken.includes(boardId)) {
      errorMessage = "该区域已被选择，请选择其他区域。";
      return;
    }
    players[playerId] = {
      ...player,
      boardChoice: boardId,
      boardMode: "specific",
      ready: isAiRecord(player) ? true : Boolean(player.ready),
      lastSeen: Date.now()
    };
    current.players = players;
    applyRoomLease(current);
    return sanitizeForFirebase(current);
  });
  if (errorMessage) {
    alert(errorMessage);
    return;
  }
  if (!result.committed) {
    alert("区域选择未生效，请重试。");
  }
}

async function setOnlineRandomBoard(playerId) {
  const roomRef = state.online.roomRef;
  if (!roomRef || !playerId) return;
  let errorMessage = "";
  const result = await roomRef.transaction((current) => {
    if (!current) return current;
    const status = roomStatus(current);
    if (status !== "lobby" && status !== "waiting" && status !== "finished") return;
    const players = current.players || {};
    const player = players[playerId];
    if (!player) return current;
    const taken = new Set(Object.values(players)
      .filter((entry) => entry && entry.id !== playerId && entry.boardChoice)
      .map((entry) => entry.boardChoice));
    const free = state.boards.filter((board) => !taken.has(board.id));
    if (!free.length) {
      errorMessage = "没有可用区域。";
      return;
    }
    players[playerId] = {
      ...player,
      boardChoice: "",
      boardMode: "random",
      ready: isAiRecord(player) ? true : Boolean(player.ready),
      lastSeen: Date.now()
    };
    current.players = players;
    applyRoomLease(current);
    return sanitizeForFirebase(current);
  });
  if (errorMessage) {
    alert(errorMessage);
    return;
  }
  if (!result.committed) {
    alert("随机区域未生效，请重试。");
  }
}

function handleLobbyBoardChange(playerId, boardId) {
  if (boardId === "__random__") {
    setOnlineRandomBoard(playerId);
    return;
  }
  if (!boardId) return;
  setOnlineBoardChoice(playerId, boardId);
}

async function updateOnlineAiDifficulty(playerId, difficulty) {
  const room = state.online.roomData;
  if (!state.online.isHost || !state.online.roomRef || !room) return;
  const player = room.players?.[playerId];
  if (!isAiRecord(player)) return;
  const now = Date.now();
  await firebaseUpdate(state.online.roomRef, {
    [`players/${playerId}/aiDifficulty`]: difficulty,
    [`players/${playerId}/lastSeen`]: now,
    ...roomLeasePayload(now)
  });
}

async function kickOnlinePlayer(playerId) {
  const room = state.online.roomData;
  if (!state.online.isHost || !state.online.roomRef || !room) return;
  if (playerId === state.online.localPlayerId) return;
  const status = roomStatus(room);
  if (status !== "lobby" && status !== "waiting" && status !== "finished") return;
  const player = room.players?.[playerId];
  if (!player || isAiRecord(player)) return;
  const confirmed = window.confirm(`确定要踢出 ${player.name} 吗？`);
  if (!confirmed) return;
  const now = Date.now();
  await firebaseUpdate(state.online.roomRef, {
    [`players/${playerId}/kickedAt`]: now,
    ...roomLeasePayload(now)
  });
  await state.online.roomRef.child(`players/${playerId}`).remove();
}

async function closeOnlineRoom() {
  const room = state.online.roomData;
  if (!state.online.isHost || !state.online.roomRef || !room) return;
  requestCloseOnlineRoom();
}

function requestCloseOnlineRoom() {
  const room = state.online.roomData;
  if (!state.online.isHost || !state.online.roomRef || !room) return;
  const dialog = $("closeRoomConfirmDialog");
  if (!dialog) {
    void confirmCloseOnlineRoom();
    return;
  }
  document.body.classList.add("dialog-open");
  if (!dialog.open) dialog.showModal();
}

function closeCloseRoomConfirmDialog() {
  const dialog = $("closeRoomConfirmDialog");
  if (dialog?.open) dialog.close();
  document.body.classList.remove("dialog-open");
}

async function confirmCloseOnlineRoom() {
  const room = state.online.roomData;
  if (!state.online.isHost || !state.online.roomRef || !room) return;
  closeCloseRoomConfirmDialog();
  showLoading("正在关闭房间……");
  try {
    const roomRef = state.online.roomRef;
    const now = Date.now();
    await firebaseUpdate(roomRef, {
      status: "closed",
      phase: "closed",
      closedAt: now,
      updatedAt: now
    });
  } catch (error) {
    hideLoading();
    showOnlineError(error);
  }
}

function stripRoomPlayersForLobby(room) {
  return Object.fromEntries(orderedLobbyPlayers(room).map((player) => {
    const preservedBoardChoice = player.boardChoice || player.board?.id || "";
    return [player.id, sanitizeForFirebase({
      id: player.id,
      name: player.name,
      kind: player.kind || (player.isAI ? "ai" : "human"),
      isAI: isAiRecord(player),
      aiDifficulty: isAiRecord(player) ? (player.aiDifficulty || "normal") : null,
      boardChoice: preservedBoardChoice,
      boardMode: preservedBoardChoice ? "specific" : (isAiRecord(player) ? "random" : "none"),
      ready: isAiRecord(player),
      joinedAt: player.joinedAt || Date.now(),
      lastSeen: Date.now()
    })];
  }));
}

async function returnToOnlineRoom() {
  if (state.mode !== "online" || !state.online.roomRef || !state.online.roomData) return;
  const room = state.online.roomData;
  state.online.starting = false;
  showLoading("正在返回房间……");
  try {
    if (state.online.isHost) {
      const lobbyPlayers = stripRoomPlayersForLobby(room);
      const now = Date.now();
      const lobbyRoom = {
        status: "lobby",
        phase: "lobby",
        hostId: room.hostId,
        createdAt: room.createdAt || now,
        ...roomLeasePayload(now),
        chat: room.chat || {},
        players: lobbyPlayers,
        game: null,
        age: null,
        round: null,
        direction: null,
        discardPile: [],
        selected: {},
        log: ["已返回房间，等待重新开局。"]
      };
      await firebaseSet(state.online.roomRef, lobbyRoom);
      void maybeCleanupExpiredRooms(true);
      state.online.lobbyPreview = false;
      applyIncomingLobbySnapshot(lobbyRoom);
      return;
    }
    state.online.lobbyPreview = true;
    renderOnlineLobby({
      ...room,
      status: "finished",
      phase: "finished",
      players: stripRoomPlayersForLobby(room)
    });
    $("lobbyHint").textContent = "已返回房间预览，等待房主重置并重新开局。";
    showView("online");
    hideLoading();
  } catch (error) {
    hideLoading();
    showOnlineError(error);
  }
}

async function startOnlineGame() {
  const room = state.online.roomData;
  if (state.online.starting) return;
  const reason = startBlockReason(room);
  if (reason) {
    $("lobbyHint").textContent = reason;
    return;
  }
  state.online.starting = true;
  $("startOnlineGameButton").disabled = true;
  try {
    validateDeckConfig();
    validateUniqueCards();
  } catch (error) {
    $("lobbyHint").textContent = error.message;
    state.online.starting = false;
    $("startOnlineGameButton").disabled = false;
    return;
  }
  try {
    const result = await state.online.roomRef.transaction((current) => {
      if (!current) return current;
      const status = roomStatus(current);
      if (status !== "lobby" && status !== "waiting" && status !== "finished") return;
      if (current.hostId !== state.online.localPlayerId) return;
      const entries = orderedLobbyPlayers(current);
      if (entries.length < 3 || entries.length > 7 || !entries.every((player) => player.ready === true)) return;
      if (hasDuplicateBoardSelections(current)) throw new Error("区域选择重复");
      if (!entries.every((player) => player.boardChoice || player.boardMode === "random")) throw new Error("还有玩家未选择区域");
      const preparedRoom = prepareMultiplayerGameRoom(current, entries);
      return sanitizeForFirebase(preparedRoom);
    });
    if (result.committed) return;
    state.online.starting = false;
    $("lobbyHint").textContent = "房间状态异常";
    $("startOnlineGameButton").disabled = false;
  } catch (error) {
    state.online.starting = false;
    $("startOnlineGameButton").disabled = false;
    showOnlineError(error);
  }
}

function prepareMultiplayerGameRoom(room, entries) {
  const now = Date.now();
  const resolvedEntries = resolveLobbyBoards(entries);
  const playerCount = entries.length;
  const age1Deck = cardsForAge(1, playerCount);
  const needed = playerCount * 7;
  if (isDebugEnabled("online")) {
    console.log("[DEAL_START] playerCount", playerCount);
    console.log("[DEAL_START] age1Deck length", age1Deck.length);
    console.log("[DEAL_START] needed cards", needed);
  }
  if (age1Deck.length < needed) {
    throw new Error(`第一时代牌库不足：需要 ${needed} 张，当前 ${age1Deck.length} 张。`);
  }

  const players = shuffle(buildPlayers(resolvedEntries) || []);
  const deck = shuffle(age1Deck);
  players.forEach((player, index) => {
    player.seatOrder = index;
    player.ready = true;
    player.boardChoice = resolvedEntries.find((entry) => entry.id === player.id)?.boardChoice || player.board.id;
    player.boardMode = "specific";
    player.joinedAt = resolvedEntries.find((entry) => entry.id === player.id)?.joinedAt || now;
    player.builtCards = player.builtCards || [];
    player.hand = deck.slice(index * 7, index * 7 + 7);
    if (isDebugEnabled("online")) {
      console.log("[DEAL_WRITE]", player.id, "-> hand length", player.hand.length);
      console.log("[DEAL_WRITE] hand card names", player.hand.map((card) => card.name));
    }
  });
  if (!players.every((player) => player.hand.length === 7)) {
    throw new Error("发牌失败：有玩家未获得 7 张手牌。");
  }
  if (isDebugEnabled("online")) {
    console.log("[DEAL_SUCCESS] hands written to players");
  }

  const logs = [
    "游戏开始，已发放第一时代手牌",
    `联机开局，座次为：${players.map((player) => `${player.name}（${player.board.name}）`).join(" → ")}`
  ];
  const pendingLiaodongGuardPlayers = prepareLiaodongGuardChoices(players, 1, { includeLogs: false });
  const initialSeatCursor = pendingLiaodongGuardPlayers.length
    ? Math.max(0, players.findIndex((player) => player.id === pendingLiaodongGuardPlayers[0].id))
    : 0;
  const roomPlayers = playersById(players);
  return {
    ...room,
    status: "playing",
    phase: pendingLiaodongGuardPlayers.length ? "liaodong-guard-choice" : "game",
    age: 1,
    round: 1,
    seatCursor: initialSeatCursor,
    direction: "left",
    players: roomPlayers,
    discardPile: [],
    selected: {},
    liaodongGuardChoice: pendingLiaodongGuardPlayers.length ? { age: 1, pendingPlayerIds: pendingLiaodongGuardPlayers.map((player) => player.id) } : null,
    liaodongResourceChoice: null,
    log: logs,
    game: {
      phase: pendingLiaodongGuardPlayers.length ? "liaodong-guard-choice" : "game",
      players: roomPlayers,
      age: 1,
      turn: 1,
      seatCursor: initialSeatCursor,
      selected: {},
      discardPile: [],
      hedongDiscardChoice: null,
      liaodongGuardChoice: pendingLiaodongGuardPlayers.length ? { age: 1, pendingPlayerIds: pendingLiaodongGuardPlayers.map((player) => player.id) } : null,
      liaodongResourceChoice: null,
      logs
    },
    ...roomLeasePayload(now)
  };
}

function applyRoomGameState(room) {
  const game = room.game || {};
  const status = roomStatus(room);
  const roomPhase = room.phase || game.phase || (status === "finished" ? "score" : "game");
  const oldRoundKey = state.lastAppliedRoundKey || "";
  const nextAge = room.age || game.age || 1;
  const nextTurn = room.round || game.turn || game.round || 1;
  const nextPhase = status === "finished" || roomPhase === "score"
      ? "score"
      : roomPhase === "seventh-card"
        ? "seventh-card"
        : roomPhase === "end-science-choice"
          ? "end-science-choice"
          : roomPhase === "overseas-trade-choice"
            ? "overseas-trade-choice"
            : roomPhase === "hedong-discard-choice"
              ? "hedong-discard-choice"
            : roomPhase === "liaodong-guard-choice"
              ? "liaodong-guard-choice"
            : roomPhase === "liaodong-resource-choice"
              ? "liaodong-resource-choice"
            : roomPhase === "guanzhong-resource-choice"
              ? "guanzhong-resource-choice"
      : "game";
  const newRoundKey = `${nextAge}-${nextTurn}-${nextPhase}`;
  const roundChanged = Boolean(oldRoundKey) && oldRoundKey !== newRoundKey;
  if (isDebugEnabled()) {
    console.log("[ROUND_SYNC] oldRoundKey", oldRoundKey || "(none)");
    console.log("[ROUND_SYNC] newRoundKey", newRoundKey);
  }
  state.phase = status === "finished" || roomPhase === "score"
    ? "score"
    : roomPhase === "seventh-card"
      ? "seventh-card"
      : roomPhase === "end-science-choice"
        ? "end-science-choice"
        : roomPhase === "overseas-trade-choice"
          ? "overseas-trade-choice"
          : roomPhase === "hedong-discard-choice"
            ? "hedong-discard-choice"
          : roomPhase === "liaodong-guard-choice"
            ? "liaodong-guard-choice"
          : roomPhase === "liaodong-resource-choice"
            ? "liaodong-resource-choice"
          : roomPhase === "guanzhong-resource-choice"
            ? "guanzhong-resource-choice"
      : "game";
  state.players = orderedGamePlayers(room.players, game.players);
  state.age = nextAge;
  state.turn = nextTurn;
  state.seatCursor = room.seatCursor || game.seatCursor || 0;
  state.selected = room.selected || game.selected || {};
  const rawSeventhCard = room.seventhCard || game.seventhCard || null;
  state.seventhCard = rawSeventhCard ? {
    ...rawSeventhCard,
    pendingPlayerIds: Array.isArray(rawSeventhCard.pendingPlayerIds) ? [...rawSeventhCard.pendingPlayerIds] : [],
    resolvedPlayerIds: Array.isArray(rawSeventhCard.resolvedPlayerIds)
      ? [...rawSeventhCard.resolvedPlayerIds]
      : Object.keys(rawSeventhCard.resolvedPlayerIds || {}).filter((playerId) => rawSeventhCard.resolvedPlayerIds[playerId]),
    choices: rawSeventhCard.choices || {},
    processed: Boolean(rawSeventhCard.processed)
  } : null;
  state.seventhCardPlayers = state.seventhCard?.pendingPlayerIds || [];
  state.overseasTradeChoice = room.overseasTradeChoice || game.overseasTradeChoice || null;
  state.guanzhongResourceChoice = room.guanzhongResourceChoice || game.guanzhongResourceChoice || null;
  state.hedongDiscardChoice = room.hedongDiscardChoice || game.hedongDiscardChoice || null;
  state.liaodongGuardChoice = room.liaodongGuardChoice || game.liaodongGuardChoice || null;
  state.liaodongResourceChoice = room.liaodongResourceChoice || game.liaodongResourceChoice || null;
  state.resolvedSpecialEffects = room.resolvedSpecialEffects || game.resolvedSpecialEffects || {};
  state.discardPile = normalizeDiscardPile(room.discardPile || game.discardPile || []);
  if (roundChanged) {
    if (isDebugEnabled()) console.log("[ROUND_SYNC] round changed, clearing local pending state");
    state.pendingChoice = {};
    state.tradeContext = null;
    if ($("tradeDialog")?.open) $("tradeDialog").close();
    if ($("overseasTradeDialog")?.open) $("overseasTradeDialog").close();
  } else if (state.selected[state.online.localPlayerId]) {
    delete state.pendingChoice[state.online.localPlayerId];
  }
  state.lastAppliedRoundKey = newRoundKey;
  state.logs = room.log || game.logs || game.log || [];
  if (isDebugEnabled()) {
    const localPlayerId = localStorage.getItem("playerId") || localStorage.getItem("jiuzhou.playerId") || state.online.localPlayerId;
    const firebaseHand = normalizeHand(room.players?.[localPlayerId]?.hand ?? game.players?.[localPlayerId]?.hand);
    const appliedPlayer = state.players.find((player) => player.id === localPlayerId);
    console.log("[CLIENT_APPLY_ROUND] localPlayerId", localPlayerId);
    console.log("[CLIENT_APPLY_ROUND] age round", state.age, state.turn);
    console.log("[CLIENT_APPLY_ROUND] hand ids", firebaseHand.map((card) => card?.id).filter(Boolean));
    console.log("[HAND_APPLY] localPlayerId", localPlayerId);
    console.log("[HAND_APPLY] firebase hand ids", firebaseHand.map((card) => card?.id).filter(Boolean));
    console.log("[HAND_APPLY] state hand ids after apply", normalizeHand(appliedPlayer?.hand).map((card) => card?.id).filter(Boolean));
  }
}

function gameSnapshot() {
  return {
    phase: state.phase,
    players: state.players,
    age: state.age,
    turn: state.turn,
    seatCursor: state.seatCursor,
    selected: state.selected,
    seventhCard: state.seventhCard,
    overseasTradeChoice: state.overseasTradeChoice,
    guanzhongResourceChoice: state.guanzhongResourceChoice,
    hedongDiscardChoice: state.hedongDiscardChoice,
    liaodongGuardChoice: state.liaodongGuardChoice,
    liaodongResourceChoice: state.liaodongResourceChoice,
    resolvedSpecialEffects: state.resolvedSpecialEffects,
    discardPile: state.discardPile,
    logs: state.logs
  };
}

function playersById(players = state.players) {
  return Object.fromEntries(players.map((player) => [player.id, player]));
}

function normalizeHand(hand) {
  if (Array.isArray(hand)) return hand;
  if (!hand || typeof hand !== "object") return [];
  return Object.keys(hand)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => hand[key])
    .filter(Boolean);
}

function normalizeStoredCards(cards) {
  return normalizeHand(cards).map((card) => ensureResolvedEffectFields(clone(card)));
}

function normalizeDiscardPile(pile) {
  return normalizeHand(pile).map((card) => ensureResolvedEffectFields(clone(card)));
}

function discardAgeLabel(age = state.age) {
  return AGE_CONFIG[age]?.label || `Age ${age || ""}`.trim();
}

function discardReasonLabel(reason) {
  return reason === "ageEnd" ? "时代末弃置" : "售出";
}

function addToDiscardPile(card, player, reason = "sell") {
  if (!card) return null;
  if (!Array.isArray(state.discardPile)) state.discardPile = [];
  const cardId = card.id || safeId();
  if (state.discardPile.some((entry) => entry.id === cardId)) {
    return state.discardPile.find((entry) => entry.id === cardId) || null;
  }
  const entry = ensureResolvedEffectFields({
    ...clone(card),
    id: cardId,
    discardPileId: `discard-${cardId}-${Date.now()}-${state.discardPile.length}`,
    discardedAt: Date.now(),
    discardedAge: state.age,
    discardedTurn: state.turn,
    discardedByPlayerId: player?.id || "",
    discardedByPlayerName: player?.name || "",
    discardReason: reason
  });
  state.discardPile.push(entry);
  renderDiscardPileEntry();
  return entry;
}

function removeFromDiscardPile(cardId) {
  if (!Array.isArray(state.discardPile) || !cardId) return null;
  const index = state.discardPile.findIndex((entry) => entry.id === cardId || entry.discardPileId === cardId);
  if (index < 0) return null;
  const [removed] = state.discardPile.splice(index, 1);
  renderDiscardPileEntry();
  return removed;
}

function stripDiscardMetadata(card) {
  const builtCard = ensureResolvedEffectFields(clone(card));
  delete builtCard.discardPileId;
  delete builtCard.discardedAt;
  delete builtCard.discardedAge;
  delete builtCard.discardedTurn;
  delete builtCard.discardedByPlayerId;
  delete builtCard.discardedByPlayerName;
  delete builtCard.discardReason;
  return builtCard;
}

function canBuildCardFromDiscardPile(player, discardEntry, options = {}) {
  if (!player || !discardEntry) return { ok: false, reason: "无法选择这张牌。" };
  const builtNames = new Set(getBuiltCards(player).map((card) => card.name));
  if (builtNames.has(discardEntry.name)) return { ok: false, reason: "你已建造同名牌。" };
  if (typeof options.canSelect === "function") {
    const result = options.canSelect(discardEntry, player);
    if (result === false) return { ok: false, reason: options.disabledReason || "当前效果不能选择这张牌。" };
    if (result && typeof result === "object" && result.ok === false) return result;
  }
  return { ok: true, reason: "" };
}

function buildCardFromDiscardPile(player, cardId, options = {}) {
  const entry = state.discardPile.find((card) => card.id === cardId || card.discardPileId === cardId);
  const availability = canBuildCardFromDiscardPile(player, entry, options);
  if (!availability.ok) return { ok: false, reason: availability.reason };
  const removed = removeFromDiscardPile(entry.id);
  if (!removed) return { ok: false, reason: "这张牌已不在弃牌堆中。" };
  if (!Array.isArray(player.built)) player.built = normalizeStoredCards(player.builtCards || []);
  player.builtCards = player.built;
  const builtCard = stripDiscardMetadata(removed);
  builtCard.builtAge = state.age;
  player.built.push(builtCard);
  resolveBuiltCardSettlement(player, builtCard);
  if (player.board.id === "lingnan" && builtCard.color === "yellow") {
    grantCoins(player, 2, {
      type: "gain",
      sourceType: "board",
      sourceName: "岭南海贸",
      coins: 2,
      description: "岭南海贸：建造黄牌，获得 2 铜钱。"
    });
    log("岭南海贸：建造黄牌，获得 2 铜钱。");
  }
  if (!options.silentLog) log(`${player.name}从弃牌堆免费建造《${builtCard.name}》。`);
  if (!options.skipSync && state.mode === "online" && state.online.isHost) void syncRoom(state.phase);
  if (options.render !== false) renderGame();
  return { ok: true, card: builtCard };
}

function orderedGamePlayers(players, legacyPlayers = [], legacyHands = {}) {
  if (Array.isArray(players)) return players;
  const legacyById = Array.isArray(legacyPlayers)
    ? Object.fromEntries(legacyPlayers.map((player) => [player.id, player]))
    : legacyPlayers || {};
  return Object.entries(players || {}).map(([id, player]) => {
    const legacy = legacyById[id] || {};
    const resolvedHand = player && Object.prototype.hasOwnProperty.call(player, "hand")
      ? normalizeHand(player.hand)
      : normalizeHand(legacy.hand || legacyHands[id]);
    return {
      ...legacy,
      ...player,
      id: player.id || id,
      aiDifficulty: (player.kind || legacy.kind) === "ai" ? (player.aiDifficulty || legacy.aiDifficulty || "normal") : null,
      hand: resolvedHand,
      built: normalizeStoredCards(player.built || legacy.built || []),
      tucked: normalizeHand(player.tucked || legacy.tucked || []).map((entry) => ({
        ...entry,
        card: entry?.card ? ensureResolvedEffectFields(clone(entry.card)) : entry?.card
      })),
      militaryTokens: player.militaryTokens || legacy.militaryTokens || [],
      coinLedger: Array.isArray(player.coinLedger || legacy.coinLedger || player.coinLogs || legacy.coinLogs)
        ? [...(player.coinLedger || legacy.coinLedger || player.coinLogs || legacy.coinLogs)]
        : [],
      coinLogs: Array.isArray(player.coinLedger || legacy.coinLedger || player.coinLogs || legacy.coinLogs)
        ? [...(player.coinLedger || legacy.coinLedger || player.coinLogs || legacy.coinLogs)]
        : [],
      specialScoreLogs: Array.isArray(player.specialScoreLogs || legacy.specialScoreLogs) ? [...(player.specialScoreLogs || legacy.specialScoreLogs)] : [],
      soldCardCount: Number(player.soldCardCount ?? legacy.soldCardCount ?? 0),
      pendingHedongDiscardBuildChoice: Boolean(player.pendingHedongDiscardBuildChoice || legacy.pendingHedongDiscardBuildChoice),
      pendingGuanzhongResourceChoices: player.pendingGuanzhongResourceChoices || legacy.pendingGuanzhongResourceChoices || null,
      pendingLiaodongGuardChoice: player.pendingLiaodongGuardChoice || legacy.pendingLiaodongGuardChoice || null,
      pendingLiaodongResourceChoice: player.pendingLiaodongResourceChoice || legacy.pendingLiaodongResourceChoice || null,
      liaodongGuardByAge: { ...(player.liaodongGuardByAge || legacy.liaodongGuardByAge || {}) },
      liaodongNoDefeatAges: { ...(player.liaodongNoDefeatAges || legacy.liaodongNoDefeatAges || {}) },
      temporaryBuildDiscounts: Array.isArray(player.temporaryBuildDiscounts || legacy.temporaryBuildDiscounts)
        ? [...(player.temporaryBuildDiscounts || legacy.temporaryBuildDiscounts)]
        : [],
      freeFirstCardUsedByAge: { ...(player.freeFirstCardUsedByAge || legacy.freeFirstCardUsedByAge || {}) },
      extraCoinsFirstGainUsedByRound: { ...(player.extraCoinsFirstGainUsedByRound || legacy.extraCoinsFirstGainUsedByRound || {}) },
      overseasTradePartnerId: player.overseasTradePartnerId || legacy.overseasTradePartnerId || "",
      seatOrder: player.seatOrder ?? legacy.seatOrder ?? Number.MAX_SAFE_INTEGER
    };
  }).sort((a, b) => {
    const seatDiff = (a.seatOrder ?? Number.MAX_SAFE_INTEGER) - (b.seatOrder ?? Number.MAX_SAFE_INTEGER);
    if (seatDiff !== 0) return seatDiff;
    return (a.joinedAt || 0) - (b.joinedAt || 0);
  });
}

async function syncRoom(phase = state.phase) {
  if (state.mode !== "online" || !state.online.roomRef) return;
  if (!state.online.isHost) return;
  state.phase = phase;
  const status = phase === "score" ? "finished" : "playing";
  const now = Date.now();
  const snapshot = gameSnapshot();
  const roomPlayers = playersById(snapshot.players);
  const nextRoomData = {
    ...(state.online.roomData || {}),
    status,
    phase,
    hostId: state.online.hostId,
    age: snapshot.age,
    round: snapshot.turn,
    players: roomPlayers,
    selected: snapshot.selected,
    seventhCard: snapshot.seventhCard,
    overseasTradeChoice: snapshot.overseasTradeChoice,
    guanzhongResourceChoice: snapshot.guanzhongResourceChoice,
    hedongDiscardChoice: snapshot.hedongDiscardChoice,
    liaodongGuardChoice: snapshot.liaodongGuardChoice,
    liaodongResourceChoice: snapshot.liaodongResourceChoice,
    resolvedSpecialEffects: snapshot.resolvedSpecialEffects,
    discardPile: snapshot.discardPile,
    log: snapshot.logs,
    game: { ...snapshot, players: roomPlayers },
    ...roomLeasePayload(now)
  };
  await firebaseUpdate(state.online.roomRef, {
    status,
    phase,
    age: snapshot.age,
    round: snapshot.turn,
    players: roomPlayers,
    selected: snapshot.selected,
    seventhCard: snapshot.seventhCard,
    overseasTradeChoice: snapshot.overseasTradeChoice,
    guanzhongResourceChoice: snapshot.guanzhongResourceChoice,
    hedongDiscardChoice: snapshot.hedongDiscardChoice,
    liaodongGuardChoice: snapshot.liaodongGuardChoice,
    liaodongResourceChoice: snapshot.liaodongResourceChoice,
    resolvedSpecialEffects: snapshot.resolvedSpecialEffects,
    discardPile: snapshot.discardPile,
    log: snapshot.logs,
    game: { ...snapshot, players: roomPlayers },
    ...roomLeasePayload(now)
  });
  state.online.roomData = nextRoomData;
  state.online.roomStatusValue = status;
  state.online.roomGameSignature = gameRenderSignature(nextRoomData.game || {});
  applyRoomGameState(nextRoomData);
  if (isDebugEnabled()) {
    const hostId = state.online.localPlayerId;
    console.log("[HOST_SYNC_DONE] Firebase write complete");
    console.log("[HOST_LOCAL_APPLY] roomData host hand ids", normalizeHand(nextRoomData.players?.[hostId]?.hand).map((card) => card?.id).filter(Boolean));
  }
}

async function syncSelection(playerId, choice) {
  if (state.mode !== "online" || !state.online.roomRef) return;
  const now = Date.now();
  const updates = {
    [`selected/${playerId}`]: choice,
    [`game/selected/${playerId}`]: choice,
    [`players/${playerId}/confirmedAction`]: choice,
    [`players/${playerId}/lastSeen`]: now,
    ...roomLeasePayload(now)
  };
  if (state.phase === "seventh-card") {
    updates[`seventhCard/choices/${playerId}`] = choice;
    updates[`game/seventhCard/choices/${playerId}`] = choice;
    updates[`seventhCard/resolvedPlayerIds/${playerId}`] = true;
    updates[`game/seventhCard/resolvedPlayerIds/${playerId}`] = true;
  }
  await firebaseUpdate(state.online.roomRef, updates);
  if (isDebugEnabled()) {
    const selectedAfterWrite = Object.keys({
      ...(state.online.roomData?.selected || state.online.roomData?.game?.selected || {}),
      [playerId]: choice
    });
    console.log("[CONFIRM_WRITE] playerId", playerId);
    console.log("[CONFIRM_WRITE] selected after write", selectedAfterWrite);
  }
}

async function refreshRoomSnapshotAndMaybeResolve() {
  if (state.mode !== "online" || !state.online.isHost || !state.online.roomRef || state.online.resolving) return;
  const snapshot = await state.online.roomRef.get();
  if (!snapshot.exists()) return;
  const room = snapshot.val();
  if (!room) return;
  state.online.roomData = room;
  state.online.roomStatusValue = roomStatus(room);
  state.online.roomGameSignature = gameRenderSignature(room.game || {});
  applyRoomGameState(room);
  await maybeResolveOnlineTurn();
}

function clearLocalTurnStateAfterRoundAdvance() {
  state.tradeContext = null;
  state.overseasTradeChoice = null;
  state.guanzhongResourceChoice = null;
  state.hedongDiscardChoice = null;
  state.liaodongGuardChoice = null;
  state.liaodongResourceChoice = null;
  state.scienceChoiceContext = null;
  state.pendingChoice = {};
  if ($("tradeDialog")?.open) $("tradeDialog").close();
  if ($("discardPileDialog")?.open) $("discardPileDialog").close();
  if ($("overseasTradeDialog")?.open) $("overseasTradeDialog").close();
  if ($("scienceChoiceDialog")?.open) $("scienceChoiceDialog").close();
  if ($("actionArea")) $("actionArea").innerHTML = "";
  if ($("current-hand")) $("current-hand").innerHTML = "";
  if ($("handCards")) $("handCards").innerHTML = "";
}

function resetLocalOnlineGameStateForLobby() {
  state.phase = "lobby";
  state.age = 1;
  state.turn = 1;
  state.selected = {};
  state.pendingChoice = {};
  state.seventhCard = null;
  state.seventhCardPlayers = [];
  state.tradeContext = null;
  state.overseasTradeChoice = null;
  state.guanzhongResourceChoice = null;
  state.hedongDiscardChoice = null;
  state.liaodongGuardChoice = null;
  state.liaodongResourceChoice = null;
  state.resolvedSpecialEffects = {};
  state.scienceChoiceContext = null;
  state.discardPile = [];
  state.discardPilePicker = null;
  clearLocalTurnStateAfterRoundAdvance();
}

function renderCurrentOnlinePhase() {
  if (state.phase === "score") {
    clearLocalTurnStateAfterRoundAdvance();
    if (isDebugEnabled()) console.log("[HOST_SCORE_VIEW] showView score called");
    showView("score");
    renderScores();
    return;
  }
  showView("game");
  renderGame();
  if (state.phase === "guanzhong-resource-choice") maybeResolveOnlineGuanzhongResourceChoicePhase();
  if (state.phase === "hedong-discard-choice") maybeResolveOnlineHedongDiscardBuildChoicePhase();
  if (state.phase === "liaodong-guard-choice") maybeResolveOnlineLiaodongGuardChoicePhase();
  if (state.phase === "liaodong-resource-choice") maybeResolveOnlineLiaodongResourceChoicePhase();
  if (state.phase === "end-science-choice") maybeResolveOnlineScienceChoicePhase();
}

function roomTurnState(room = {}) {
  const status = roomStatus(room);
  const roomPhase = status === "finished"
    ? "score"
    : room.phase || room.game?.phase || "game";
  return {
    phase: roomPhase === "score"
      ? "score"
      : roomPhase === "seventh-card"
        ? "seventh-card"
        : roomPhase === "end-science-choice"
        ? "end-science-choice"
        : roomPhase === "overseas-trade-choice"
          ? "overseas-trade-choice"
          : roomPhase === "hedong-discard-choice"
            ? "hedong-discard-choice"
          : roomPhase === "liaodong-guard-choice"
            ? "liaodong-guard-choice"
          : roomPhase === "liaodong-resource-choice"
            ? "liaodong-resource-choice"
          : roomPhase === "guanzhong-resource-choice"
            ? "guanzhong-resource-choice"
        : "game",
    age: room.age || room.game?.age || 1,
    round: room.round || room.game?.round || room.game?.turn || 1
  };
}

function currentTurnState() {
  return {
    phase: state.phase === "score"
      ? "score"
      : state.phase === "seventh-card"
        ? "seventh-card"
        : state.phase === "end-science-choice"
          ? "end-science-choice"
        : state.phase === "overseas-trade-choice"
          ? "overseas-trade-choice"
          : state.phase === "hedong-discard-choice"
            ? "hedong-discard-choice"
            : state.phase === "liaodong-guard-choice"
              ? "liaodong-guard-choice"
              : state.phase === "liaodong-resource-choice"
                ? "liaodong-resource-choice"
            : state.phase === "guanzhong-resource-choice"
              ? "guanzhong-resource-choice"
          : "game",
    age: state.age || 1,
    round: state.turn || 1
  };
}

function phaseOrder(phase) {
  return {
    "liaodong-guard-choice": -1,
    game: 0,
    "hedong-discard-choice": 1,
    "overseas-trade-choice": 2,
    "seventh-card": 3,
    "guanzhong-resource-choice": 4,
    "liaodong-resource-choice": 5,
    "end-science-choice": 6,
    score: 7
  }[phase] ?? 0;
}

function compareTurnState(left, right) {
  if ((left.age || 1) !== (right.age || 1)) return (left.age || 1) - (right.age || 1);
  if ((left.round || 1) !== (right.round || 1)) return (left.round || 1) - (right.round || 1);
  return phaseOrder(left.phase) - phaseOrder(right.phase);
}

function shouldIgnoreStaleRoomSnapshot(room) {
  const status = roomStatus(room);
  if (status !== "playing" && status !== "finished") return false;
  if (!["game", "seventh-card", "overseas-trade-choice", "hedong-discard-choice", "liaodong-guard-choice", "liaodong-resource-choice", "guanzhong-resource-choice", "end-science-choice", "score"].includes(state.phase)) return false;
  return compareTurnState(roomTurnState(room), currentTurnState()) < 0;
}

function onlineRoomTurnState() {
  return roomTurnState(state.online.roomData || {});
}

function isOnlineRoomStateCurrent() {
  if (state.mode !== "online") return true;
  const roomState = onlineRoomTurnState();
  return roomState.phase === state.phase
    && roomState.age === state.age
    && roomState.round === state.turn;
}

function willCompleteOnlineSelections(playerId) {
  if (state.mode !== "online") return false;
  if (state.phase !== "game" && state.phase !== "seventh-card") return false;
  const roomSelected = state.online.roomData?.selected || state.online.roomData?.game?.selected || {};
  const requiredPlayerIds = state.phase === "seventh-card"
    ? (state.seventhCard?.pendingPlayerIds || state.seventhCardPlayers || [])
    : state.players.map((player) => player.id);
  if (!requiredPlayerIds.length) return false;
  const selected = { ...roomSelected, ...state.selected, [playerId]: true };
  return requiredPlayerIds.every((id) => selected[id]);
}

function resyncAfterStaleOnlineState(message = "本地手牌状态已过期，已重新同步。") {
  clearLocalTurnStateAfterRoundAdvance();
  if (state.online.roomData) applyRoomGameState(state.online.roomData);
  renderCurrentOnlinePhase();
  if (state.phase !== "score") renderActionMessage(message, true);
}

function tradePlanFromPayment(player, payment) {
  if (!payment?.purchases) return null;
  const purchases = {};
  const sideCosts = {};
  let hasPurchases = false;
  for (const side of Object.keys(payment.purchases || {})) {
    purchases[side] = payment.purchases[side] || {};
    sideCosts[side] = neighborPurchaseTotal(player, payment, side);
    if (Object.keys(purchases[side]).length > 0) hasPurchases = true;
  }
  if (!hasPurchases && !payment.tradeCost) return null;
  const purchaseDetails = Array.isArray(payment.purchaseDetails) && payment.purchaseDetails.length
    ? payment.purchaseDetails
    : Object.entries(payment.purchases || {}).flatMap(([side, resourceMap]) => {
        const neighbor = getTradeNeighbor(player, side);
        return Object.entries(resourceMap || {}).flatMap(([resource, amount]) => {
          const price = getTradePriceDetails(player, side, resource);
          return Array.from({ length: amount }, () => ({
            fromPlayerId: neighbor?.id || "",
            side,
            distance: price.distance,
            resource,
            amount: 1,
            unitPrice: price.unitPrice,
            totalCost: price.unitPrice,
            discountSource: price.discountSource
          }));
        });
      });
  return {
    ...purchases,
    purchases: purchaseDetails,
    sideCosts,
    totalCost: payment.tradeCost || 0,
    coinCost: payment.coinCost || 0,
    total: payment.total || ((payment.coinCost || 0) + (payment.tradeCost || 0))
  };
}

function maybeDriveOnlineAI() {
  if (state.mode !== "online" || !state.online.isHost) return;
  if (state.phase === "overseas-trade-choice") {
    maybeResolveOnlineOverseasTradeChoicePhase();
    return;
  }
  if (state.phase === "guanzhong-resource-choice") {
    maybeResolveOnlineGuanzhongResourceChoicePhase();
    return;
  }
  if (state.phase === "hedong-discard-choice") {
    maybeResolveOnlineHedongDiscardBuildChoicePhase();
    return;
  }
  if (state.phase === "liaodong-guard-choice") {
    maybeResolveOnlineLiaodongGuardChoicePhase();
    return;
  }
  if (state.phase === "liaodong-resource-choice") {
    maybeResolveOnlineLiaodongResourceChoicePhase();
    return;
  }
  if (state.phase !== "game" && state.phase !== "seventh-card") return;
  const currentRoundKey = state.phase === "seventh-card"
    ? `${state.age}-${state.turn}-seventh`
    : `${state.age}-${state.turn}`;
  for (const key of Object.keys(state.online.aiLocks || {})) {
    if (!key.startsWith(`${currentRoundKey}:`)) delete state.online.aiLocks[key];
  }
  const controlledPlayerIds = state.phase === "seventh-card"
    ? (state.seventhCard?.pendingPlayerIds || state.seventhCardPlayers || [])
    : state.players.map((player) => player.id);
  for (const player of state.players.filter((item) => controlledPlayerIds.includes(item.id))) {
    if (!isAI(player)) continue;
    if (state.selected[player.id] || state.online.roomData?.selected?.[player.id] || state.online.roomData?.players?.[player.id]?.confirmedAction) continue;
    if (state.phase === "seventh-card" && state.seventhCard?.resolvedPlayerIds?.includes(player.id)) continue;
    const lockKey = `${currentRoundKey}:${player.id}`;
    if (state.online.aiLocks[lockKey]) continue;
    state.online.aiLocks[lockKey] = true;
    const delay = 300 + Math.floor(Math.random() * 200);
    setTimeout(() => runMultiplayerAiTurn(player.id, currentRoundKey), delay);
  }
}

async function runMultiplayerAiTurn(playerId, roundKey) {
  try {
    if (state.mode !== "online" || !state.online.isHost) return;
    if (state.phase !== "game" && state.phase !== "seventh-card") return;
    const currentRoundKey = state.phase === "seventh-card"
      ? `${state.age}-${state.turn}-seventh`
      : `${state.age}-${state.turn}`;
    if (currentRoundKey !== roundKey) return;
    if (state.online.roomData?.selected?.[playerId] || state.selected[playerId] || state.online.roomData?.players?.[playerId]?.confirmedAction) return;
    if (state.phase === "seventh-card" && !(state.seventhCard?.pendingPlayerIds || []).includes(playerId)) return;
    if (state.phase === "seventh-card" && state.seventhCard?.resolvedPlayerIds?.includes(playerId)) return;
    const player = state.players.find((item) => item.id === playerId);
    if (!player || !isAI(player)) return;
    const latestRoomHand = normalizeHand(
      state.online.roomData?.players?.[playerId]?.hand
      ?? state.online.roomData?.game?.players?.[playerId]?.hand
      ?? player.hand
    );
    player.hand = latestRoomHand;
    if (!latestRoomHand.length) return;
    const choice = pickAIChoice(player);
    if (!choice) return;
    if (!latestRoomHand.some((card) => card?.id === choice.cardId)) {
      if (isDebugEnabled()) {
        console.warn("[AI_STALE_CHOICE_BLOCKED]", playerId, choice.cardId, latestRoomHand.map((card) => card?.id).filter(Boolean));
      }
      return;
    }
    if (choice.action === "build" && !choice.payment && canUseFreeFirstCardBuild(player, state.age)) {
      choice.freeFirstCardEachAgeUsed = true;
    }
    if (choice.action === "wonder") {
      choice.stageIndex = player.stagesBuilt;
      choice.cost = player.board.stages[player.stagesBuilt]?.cost || {};
    }
    choice.tradePlan = tradePlanFromPayment(player, choice.payment);
    await syncSelection(player.id, choice);
    state.selected[player.id] = choice;
    log(`${player.name}正在思考后已自动确认行动。`);
    await maybeResolveOnlineTurn();
  } finally {
    delete state.online.aiLocks[`${roundKey}:${playerId}`];
  }
}

async function maybeResolveOnlineTurn() {
  if (state.mode !== "online" || !state.online.isHost || state.online.resolving) return;
  if (state.phase === "overseas-trade-choice") {
    await maybeResolveOnlineOverseasTradeChoicePhase();
    return;
  }
  if (state.phase === "guanzhong-resource-choice") {
    await maybeResolveOnlineGuanzhongResourceChoicePhase();
    return;
  }
  if (state.phase === "hedong-discard-choice") {
    await maybeResolveOnlineHedongDiscardBuildChoicePhase();
    return;
  }
  if (state.phase === "liaodong-guard-choice") {
    await maybeResolveOnlineLiaodongGuardChoicePhase();
    return;
  }
  if (state.phase === "liaodong-resource-choice") {
    await maybeResolveOnlineLiaodongResourceChoicePhase();
    return;
  }
  if (state.phase !== "game" && state.phase !== "seventh-card") return;
  if (!state.players.length) return;
  const roomSelected = state.online.roomData?.selected || state.online.roomData?.game?.selected || {};
  const selected = { ...roomSelected, ...state.selected };
  const requiredPlayerIds = state.phase === "seventh-card"
    ? (state.seventhCard?.pendingPlayerIds || state.seventhCardPlayers || [])
    : state.players.map((player) => player.id);
  const selectedIds = Object.keys(selected);
  const ready = requiredPlayerIds.length > 0 && requiredPlayerIds.every((playerId) => selected[playerId]);
  if (isDebugEnabled()) {
    console.log("[HOST_RESOLVE_CHECK] isHost", state.online.isHost);
    console.log("[HOST_RESOLVE_CHECK] age", state.age);
    console.log("[HOST_RESOLVE_CHECK] round", state.turn);
    console.log("[HOST_RESOLVE_CHECK] requiredPlayerIds", requiredPlayerIds);
    console.log("[HOST_RESOLVE_CHECK] selected ids", selectedIds);
    console.log("[HOST_RESOLVE_CHECK] ready", ready);
  }
  if (!ready) return;
  state.selected = selected;
  state.online.resolving = true;
  try {
    const hostId = state.online.localPlayerId;
    if (isDebugEnabled() && state.selected[hostId]) {
      console.log("[HOST_CONFIRM_LAST] playerId", hostId);
    }
    if (isDebugEnabled()) console.log("[HOST_RESOLVE_START] age round", state.age, state.turn);
    if (state.phase === "seventh-card") resolveSeventhCardTurn(false);
    else resolveTurn(false);
    if (state.phase === "overseas-trade-choice") {
      await maybeResolveOnlineOverseasTradeChoicePhase();
      hideLoading();
      return;
    }
    if (state.phase === "guanzhong-resource-choice") {
      await syncRoom("guanzhong-resource-choice");
      state.online.resolving = false;
      renderCurrentOnlinePhase();
      await maybeResolveOnlineGuanzhongResourceChoicePhase();
      hideLoading();
      return;
    }
    if (isDebugEnabled()) {
      console.log("[HOST_RESOLVE_AFTER_RESOLVE] new age/round", state.age, state.turn);
      console.log("[HOST_RESOLVE_AFTER_RESOLVE] host hand ids", normalizeHand(currentPlayer()?.hand).map((card) => card?.id).filter(Boolean));
    }
    await syncRoom(state.phase);
    clearLocalTurnStateAfterRoundAdvance();
    renderCurrentOnlinePhase();
    hideLoading();
    if (isDebugEnabled()) {
      console.log("[HOST_RESOLVE_DONE] new age round", state.age, state.turn);
      console.log("[HOST_SYNC_DONE] selected should be empty", Object.keys(state.selected || {}));
      console.log("[HOST_LOCAL_RENDER] rendered hand ids", normalizeHand(currentPlayer()?.hand).map((card) => card?.id).filter(Boolean));
    }
  } catch (error) {
    hideLoading();
    showOnlineError(error);
  } finally {
    state.online.resolving = false;
  }
}

async function copyRoomCode() {
  await copyTextWithManualFallback(state.online.roomCode, "房间码已复制");
}

function showOnlineError(error) {
  hideLoading();
  finishOnlineSyncNotice();
  $("onlineStatus").textContent = error.message;
  if (error.code === "firebase-not-configured") {
    $("onlineStatus").textContent = "联机未配置";
    return;
  }
  alert(`${error.message}\n\n请检查 Firebase 配置和网络。`);
}

async function ensureFirebase() {
  const config = window.JIUZHOU_FIREBASE_CONFIG;
  if (!hasFirebaseConfig()) {
    const error = new Error("联机未配置");
    error.code = "firebase-not-configured";
    throw error;
  }
  if (!window.firebase) {
    firebaseLoadPromise ||= Promise.all(FIREBASE_SCRIPTS.map((src) => loadScript(src)));
    await firebaseLoadPromise;
  }
  if (!firebase.apps.length) firebase.initializeApp(config);
  return firebase.database();
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("Firebase SDK 加载失败，请检查网络。")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Firebase SDK 加载失败，请检查网络。"));
    document.head.append(script);
  });
}

function startAge(age, shouldRender = true) {
  state.age = age;
  state.turn = 1;
  state.seatCursor = 0;
  state.selected = {};
  state.pendingChoice = {};
  state.seventhCard = null;
  state.seventhCardPlayers = [];
  state.liaodongGuardChoice = null;
  state.liaodongResourceChoice = null;
  expireTemporaryBoardEffects(age);
  const deck = shuffle(cardsForAge(age, state.players.length));
  const required = state.players.length * 7;
  if (deck.length !== required) {
    alert(`Age ${age} 的 ${state.players.length} 人局牌库数量错误：需要 ${required} 张，实际 ${deck.length} 张。`);
    return;
  }
  state.players.forEach((player, index) => {
    player.hand = deck.slice(index * 7, index * 7 + 7);
  });
  debugDeckReport(age, deck, state.players);
  log(`${AGE_CONFIG[age].label} 开始，每位玩家获得 7 张牌。`);
  prepareLiaodongGuardChoices(state.players, age);
  if (startLiaodongGuardChoicePhase(shouldRender)) {
    saveHotseatGame();
    return;
  }
  if (shouldRender) renderGame();
  saveHotseatGame();
}

function isDebugEnabled() {
  return new URLSearchParams(location.search).get("debug") === "1" || localStorage.getItem("jiuzhou.debug") === "1";
}

function debugDeckReport(age, deck, players) {
  if (!isDebugEnabled()) return;
  const colorCounts = {};
  const resourceCounts = {};
  const scienceCounts = {};
  for (const card of deck) {
    colorCounts[card.color] = (colorCounts[card.color] || 0) + 1;
    for (const [resource, value] of Object.entries(producesToResourceMap(card.produces || [], card.resource))) {
      resourceCounts[resource] = (resourceCounts[resource] || 0) + value;
    }
    for (const [symbol, value] of Object.entries(card.scienceSymbol ? { [card.scienceSymbol]: 1 } : card.science || {})) {
      scienceCounts[symbol] = (scienceCounts[symbol] || 0) + value;
    }
  }
  console.group(`[九州] Age ${age} 发牌统计`);
  console.table({ total: deck.length });
  console.table(colorCounts);
  console.table(resourceCounts);
  console.table(scienceCounts);
  console.table(players.map((player) => ({
    玩家: player.name,
    手牌: player.hand.map((card) => card.name).join("、")
  })));
  console.groupEnd();
}

function diagnoseMissingOnlineHand(player) {
  if (state.mode !== "online" || state.phase !== "game") return;
  const ageDeck = state.cards?.ages?.[String(state.age)] || [];
  const playerId = localStorage.getItem("playerId") || localStorage.getItem("jiuzhou.playerId") || state.online.localPlayerId;
  const rawPlayer = state.online.roomData?.players?.[playerId];
  console.error("未找到你的手牌，请刷新或重新加入房间", {
    roomCode: state.online.roomCode,
    playerId,
    playerCount: state.players.length,
    age: state.age,
    round: state.turn,
    player,
    handLength: player?.hand?.length || 0,
    ageDeckLength: ageDeck.length,
    rawRoomPlayer: rawPlayer
  });
}

function isAI(player) {
  return player?.kind === "ai";
}

async function nextSeat() {
  const player = currentPlayer();
  if (state.pendingChoice[player.id]) {
    await confirmPendingChoice({ advanceAfterConfirm: state.mode !== "online" });
    return;
  }
  if (state.mode === "online") return;
  if (!state.selected[player.id]) {
    alert("请先选择一个行动。");
    return;
  }
  const next = nextUnselectedSeat(state.seatCursor + 1);
  if (next === -1) {
    if (state.phase === "seventh-card") resolveSeventhCardTurn(true);
    else resolveTurn(true);
  } else {
    state.seatCursor = next;
    renderGame();
    saveHotseatGame();
  }
}

function nextUnselectedSeat(start) {
  const pendingPlayers = state.seventhCard?.pendingPlayerIds || state.seventhCardPlayers;
  for (let offset = 0; offset < state.players.length; offset += 1) {
    const index = (start + offset) % state.players.length;
    if (state.phase === "seventh-card" && !pendingPlayers.includes(state.players[index].id)) continue;
    if (!state.selected[state.players[index].id]) return index;
  }
  return -1;
}

function currentPlayer() {
  if (state.mode === "online") {
    const playerId = localStorage.getItem("playerId") || localStorage.getItem("jiuzhou.playerId") || state.online.localPlayerId;
    return state.players.find((player) => player.id === playerId) || state.players[0];
  }
  return state.players[state.seatCursor];
}

function currentOnlineHand(player = currentPlayer()) {
  if (!player) return [];
  if (state.mode !== "online") return normalizeHand(player.hand);
  if (state.online.roomData && compareTurnState(onlineRoomTurnState(), currentTurnState()) < 0) {
    return normalizeHand(player.hand);
  }
  const localPlayerId = localStorage.getItem("playerId") || localStorage.getItem("jiuzhou.playerId") || state.online.localPlayerId || player.id;
  const roomPlayer = state.online.roomData?.players?.[localPlayerId];
  const gamePlayer = state.online.roomData?.game?.players?.[localPlayerId];
  return roomPlayer && Object.prototype.hasOwnProperty.call(roomPlayer, "hand")
    ? normalizeHand(roomPlayer.hand)
    : normalizeHand(gamePlayer?.hand);
}

function blockStaleOnlineCard(cardId, player = currentPlayer()) {
  if (state.phase === "score" || !isOnlineRoomStateCurrent()) {
    const roomState = onlineRoomTurnState();
    const currentHandIds = currentOnlineHand(player).map((card) => card?.id).filter(Boolean);
    if (isDebugEnabled()) {
      console.warn("[BLOCK_STALE_HOST_CARD] cardId", cardId);
      console.warn("[BLOCK_STALE_HOST_CARD] phase age round", state.phase, state.age, state.turn);
      console.warn("[BLOCK_STALE_HOST_CARD] roomData phase age round", roomState.phase, roomState.age, roomState.round);
      console.warn("[BLOCK_STALE_HOST_CARD] roomData hand ids", currentHandIds);
    }
    resyncAfterStaleOnlineState();
    return true;
  }
  const currentHandIds = currentOnlineHand(player).map((card) => card?.id).filter(Boolean);
  if (currentHandIds.includes(cardId)) return false;
  if (isDebugEnabled()) {
    console.warn("[STALE_CARD_BLOCKED] cardId", cardId);
    console.warn("[STALE_CARD_BLOCKED] roomData hand ids", currentHandIds);
    console.warn("[BLOCK_STALE_HOST_CARD] cardId", cardId);
    console.warn("[BLOCK_STALE_HOST_CARD] phase age round", state.phase, state.age, state.turn);
    const roomState = onlineRoomTurnState();
    console.warn("[BLOCK_STALE_HOST_CARD] roomData phase age round", roomState.phase, roomState.age, roomState.round);
    console.warn("[BLOCK_STALE_HOST_CARD] roomData hand ids", currentHandIds);
  }
  resyncAfterStaleOnlineState("这张牌已不在当前手牌中，请等待同步或刷新页面。");
  return true;
}

function clearPendingChoiceUI(player = currentPlayer(), options = {}) {
  if (!player) return;
  delete state.pendingChoice[player.id];
  state.tradeContext = null;
  if (options.render !== false) renderGame();
}

async function chooseAction(cardId, action) {
  const player = currentPlayer();
  if (!player) return;
  if (state.selected[player.id]) {
    if (state.mode === "online") renderActionMessage("你已经确认本轮行动，请等待结算。", false);
    return;
  }
  if (state.mode === "online" && blockStaleOnlineCard(cardId, player)) return;
  player.hand = state.mode === "online" ? currentOnlineHand(player) : normalizeHand(player.hand);
  const card = player.hand.find((item) => item.id === cardId);
  if (!card) return;
  clearPendingChoiceUI(player);

  if (action === "build") {
    if (!player.built.some((built) => built.name === card.name) && canUseChainBuild(player, card)) {
      renderActionMessage("链条生效：已拥有前置卡牌，可免费建造。", false);
      setPendingChoice(player, {
        cardId,
        action,
        type: action,
        payment: null,
        tradePlan: null,
        chainFreeBuildUsed: true
      });
      return;
    }
    if (!player.built.some((built) => built.name === card.name) && canUseFreeFirstCardBuild(player, state.age)) {
      renderActionMessage("岭南区域能力：本时代第一张卡牌可免费建造。", false);
      setPendingChoice(player, {
        cardId,
        action,
        type: action,
        payment: null,
        tradePlan: null,
        freeFirstCardEachAgeUsed: true
      });
      return;
    }
    const tradeOptions = buildTradeOptions(card, player, getLeftNeighbor(player), getRightNeighbor(player));
    if (!tradeOptions.ok) {
      renderActionMessage(tradeOptions.message, true);
      return;
    }
    if (tradeOptions.requiresTrade) {
      showTradeDialog(tradeOptions);
      return;
    }
    setPendingChoice(player, {
      cardId,
      action,
      type: action,
      payment: tradeOptions.payment || null,
      tradePlan: null,
      chainFreeBuildUsed: tradeOptions.chainFreeBuildUsed || false
    });
    return;
  }

  if (action === "wonder") {
    const stageIndex = player.stagesBuilt;
    const stage = player.board.stages[stageIndex];
    if (!stage) {
      renderActionMessage("区域已全部建成。", true);
      return;
    }
    const wonderTarget = {
      purpose: "wonder",
      action: "wonder",
      card,
      cardId,
      stageIndex,
      stageName: stage.name,
      boardName: player.board.name,
      cost: stage.cost || {}
    };
    const tradeOptions = buildTradeOptions(wonderTarget, player, getLeftNeighbor(player), getRightNeighbor(player));
    if (!tradeOptions.ok) {
      renderActionMessage(tradeOptions.message, true);
      return;
    }
    if (tradeOptions.requiresTrade) {
      showTradeDialog(tradeOptions);
      return;
    }
    setPendingChoice(player, {
      cardId,
      action,
      type: action,
      stageIndex,
      cost: stage.cost || {},
      payment: tradeOptions.payment || null,
      tradePlan: null
    });
    return;
  }

  const validation = validateAction(player, card, action);
  if (!validation.ok) {
    renderActionMessage(validation.message, true);
    return;
  }
  setPendingChoice(player, { cardId, action, type: action, payment: validation.payment || null, tradePlan: null });
}

function setPendingChoice(player, choice) {
  state.pendingChoice[player.id] = choice;
  state.tradeContext = null;
  renderGame();
  saveHotseatGame();
}

function cancelPendingChoice() {
  const player = currentPlayer();
  if (!player || state.selected[player.id]) return;
  clearPendingChoiceUI(player);
}

async function confirmPendingChoice(options = {}) {
  const player = currentPlayer();
  if (!player) return;
  if (state.selected[player.id]) {
    if (state.mode === "online") renderActionMessage("你已经确认本轮行动，请等待结算。", false);
    return;
  }
  const choice = state.pendingChoice[player.id];
  if (!choice) {
    renderActionMessage("请先选择一个行动。", true);
    return;
  }
  if (state.mode === "online" && blockStaleOnlineCard(choice.cardId, player)) {
    if (isDebugEnabled()) {
      console.warn("[STALE_CONFIRM_BLOCKED] pending cardId", choice.cardId);
      console.warn("[STALE_CONFIRM_BLOCKED] roomData hand ids", currentOnlineHand(player).map((card) => card?.id).filter(Boolean));
    }
    return;
  }
  if (state.mode === "online") {
    const roomState = onlineRoomTurnState();
    const roomSelected = state.online.roomData?.selected || state.online.roomData?.game?.selected || {};
    if (roomState.phase !== state.phase || roomState.age !== state.age || roomState.round !== state.turn || roomSelected[player.id]) {
      if (isDebugEnabled()) {
        console.warn("[STALE_CONFIRM_BLOCKED] pending cardId", choice.cardId);
        console.warn("[STALE_CONFIRM_BLOCKED] roomData hand ids", currentOnlineHand(player).map((card) => card?.id).filter(Boolean));
      }
      clearPendingChoiceUI(player, { render: false });
      resyncAfterStaleOnlineState();
      return;
    }
  }
  state.selected[player.id] = choice;
  clearPendingChoiceUI(player, { render: false });
  if (state.mode === "online") {
    try {
      await syncSelection(player.id, choice);
    } catch (error) {
      showOnlineError(error);
      return;
    }
    if (state.online.isHost) {
      if (isDebugEnabled()) console.log("[HOST_AFTER_CONFIRM] before resolve phase age round", state.phase, state.age, state.turn);
      await refreshRoomSnapshotAndMaybeResolve();
      if (state.online.roomListenerTimer) {
        clearTimeout(state.online.roomListenerTimer);
        state.online.roomListenerTimer = null;
      }
      state.online.pendingRoomSnapshot = null;
      if (state.online.roomData) {
        state.online.roomGameSignature = gameRenderSignature(state.online.roomData.game || {});
      }
      clearLocalTurnStateAfterRoundAdvance();
      if (isDebugEnabled()) {
        console.log("[HOST_AFTER_CONFIRM] after syncRoom phase age round", state.phase, state.age, state.turn);
        console.log("[HOST_AFTER_CONFIRM] roomData host hand ids", currentOnlineHand(player).map((card) => card?.id).filter(Boolean));
        console.log("[HOST_AFTER_CONFIRM] state host hand ids", normalizeHand(currentPlayer()?.hand).map((card) => card?.id).filter(Boolean));
        console.log("[HOST_AFTER_CONFIRM] view should be", state.phase === "score" ? "score" : "game");
      }
      if (state.phase === "score") {
        showView("score");
        renderScores();
      } else {
        showView("game");
        renderGame();
      }
      hideLoading();
      return;
    }
    renderGame();
    return;
  } else {
    if (options.advanceAfterConfirm) {
      const next = nextUnselectedSeat(state.seatCursor + 1);
      if (next === -1) {
        if (state.phase === "seventh-card") resolveSeventhCardTurn(true);
        else resolveTurn(true);
      }
      else {
        state.seatCursor = next;
        renderGame();
        saveHotseatGame();
      }
    } else {
      renderGame();
      saveHotseatGame();
    }
  }
}

function validateAction(player, card, action) {
  if (action === "sell") return { ok: true };
  if (action === "wonder") {
    const stage = player.board.stages[player.stagesBuilt];
    if (!stage) return { ok: false, message: "区域已全部建成。" };
    const wonderTarget = {
      purpose: "wonder",
      action: "wonder",
      card,
      cardId: card.id,
      stageIndex: player.stagesBuilt,
      stageName: stage.name,
      boardName: player.board.name,
      cost: stage.cost || {}
    };
    const tradeOptions = buildTradeOptions(wonderTarget, player, getLeftNeighbor(player), getRightNeighbor(player));
    return tradeOptions.ok
      ? { ok: true, payment: tradeOptions.payment || tradeOptions.plan || null }
      : { ok: false, message: tradeOptions.message };
  }
  if (player.built.some((built) => built.name === card.name)) {
    return { ok: false, message: "不能重复建造同名卡牌。" };
  }
  if (canUseChainBuild(player, card)) {
    return { ok: true, payment: null, chainFreeBuildUsed: true };
  }
  if (canUseFreeFirstCardBuild(player, state.age)) {
    return { ok: true, payment: null, freeFirstCardEachAgeUsed: true };
  }
  const payment = canPay(player, card.cost || {});
  return payment.ok ? { ok: true, payment } : { ok: false, message: payment.message };
}

function countCost(cost = []) {
  if (!Array.isArray(cost)) return { ...(cost || {}) };
  const counted = {};
  for (const item of cost) {
    const resource = typeof item === "string" ? item : item?.resource;
    const amount = typeof item === "string" ? 1 : item?.amount || 1;
    if (!resource) continue;
    counted[resource] = (counted[resource] || 0) + amount;
  }
  return counted;
}

function getPlayerResources(player) {
  return getResources(player);
}

function getResourceChoices(player) {
  return getBuiltCards(player)
    .map((card) => resolveCardResourceChoice(card))
    .filter((choice) => Array.isArray(choice) && choice.length);
}

function getTradeResourceAvailability(player, resource) {
  const fixed = getPlayerResources(player)[resource] || 0;
  const choiceMatches = getResourceChoices(player)
    .filter((choice) => choice.includes(resource))
    .length;
  const wildBasic = BASIC_RESOURCES.includes(resource) ? getWildBasicResourceCount(player) : 0;
  return fixed + choiceMatches + wildBasic;
}

function canPlayerProvideTradePurchases(player, purchases = {}) {
  const remaining = { ...purchases };
  const fixedResources = getPlayerResources(player);
  for (const resource of RESOURCE_NAMES) {
    const used = Math.min(remaining[resource] || 0, fixedResources[resource] || 0);
    if (!used) continue;
    remaining[resource] = (remaining[resource] || 0) - used;
    if (remaining[resource] <= 0) delete remaining[resource];
  }
  const choiceCoverage = applyResourceChoiceCoverage(remaining, getResourceChoices(player));
  const wildBasicCoverage = applyTradeWildBasicCoverage(choiceCoverage.remaining, getWildBasicResourceCount(player));
  return Object.keys(wildBasicCoverage.remaining || {}).length === 0;
}

function applyResourceChoiceCoverage(missing = {}, choices = []) {
  const normalizedChoices = choices
    .map((choice) => [...new Set(choice.filter((resource) => missing[resource] > 0))])
    .filter((choice) => choice.length);
  let best = {
    remaining: { ...missing },
    usage: [],
    covered: 0
  };
  const totalMissing = Object.values(missing).reduce((total, count) => total + count, 0);

  function visit(index, remaining, usage) {
    const covered = totalMissing - Object.values(remaining).reduce((total, count) => total + count, 0);
    if (covered > best.covered) {
      best = { remaining: { ...remaining }, usage: [...usage], covered };
      if (covered === totalMissing) return;
    }
    if (index >= normalizedChoices.length) return;
    visit(index + 1, remaining, usage);
    for (const resource of normalizedChoices[index]) {
      if ((remaining[resource] || 0) <= 0) continue;
      const nextRemaining = { ...remaining, [resource]: remaining[resource] - 1 };
      if (nextRemaining[resource] <= 0) delete nextRemaining[resource];
      visit(index + 1, nextRemaining, [...usage, resource]);
    }
  }

  visit(0, { ...missing }, []);
  return { remaining: best.remaining, usage: best.usage };
}

function getWildBasicResourceCount(player) {
  return builtStages(player).reduce((total, stage) => total + (stage.effects?.wildBasicResource || 0), 0);
}

function applyTradeWildBasicCoverage(missing = {}, wildBasicCount = 0) {
  const remaining = { ...missing };
  let availableWild = wildBasicCount;
  while (availableWild > 0) {
    const target = BASIC_RESOURCES
      .filter((resource) => (remaining[resource] || 0) > 0)
      .sort((a, b) => (remaining[b] || 0) - (remaining[a] || 0) || BASIC_RESOURCES.indexOf(a) - BASIC_RESOURCES.indexOf(b))[0];
    if (!target) break;
    remaining[target] = Math.max(0, (remaining[target] || 0) - 1);
    if (remaining[target] <= 0) delete remaining[target];
    availableWild -= 1;
  }
  return { remaining };
}

function applyWildBasicResourceCoverage(player, remaining = {}, tradeNeighbors = []) {
  const adjusted = { ...remaining };
  const usage = {};
  let availableWild = getWildBasicResourceCount(player);
  while (availableWild > 0) {
    const candidates = BASIC_RESOURCES
      .filter((resource) => (adjusted[resource] || 0) > 0)
      .map((resource) => ({
        resource,
        deficit: adjusted[resource] || 0,
        supply: tradeNeighbors.reduce((total, entry) => total + getTradeResourceAvailability(entry.player, resource), 0)
      }));
    if (!candidates.length) break;
    candidates.sort((a, b) => a.supply - b.supply || b.deficit - a.deficit || BASIC_RESOURCES.indexOf(a.resource) - BASIC_RESOURCES.indexOf(b.resource));
    const chosen = candidates[0].resource;
    adjusted[chosen] = Math.max(0, (adjusted[chosen] || 0) - 1);
    usage[chosen] = (usage[chosen] || 0) + 1;
    availableWild -= 1;
  }
  return { remaining: adjusted, usage, totalUsed: Object.values(usage).reduce((total, count) => total + count, 0) };
}

function getMissingResources(cost, ownResources) {
  const counted = countCost(cost);
  const missing = {};
  for (const resource of RESOURCE_NAMES) {
    const need = counted[resource] || 0;
    const available = ownResources[resource] || 0;
    if (need > available) missing[resource] = need - available;
  }
  return missing;
}

function canUseHexiAdvancedFlex(player) {
  return player?.board?.id === "hexi";
}

function getMissingResourcesForPlayer(player, cost, ownResources, tradeNeighbors = []) {
  if (!canUseHexiAdvancedFlex(player)) return getMissingResources(cost, ownResources);
  const counted = countCost(cost);
  const missing = {};
  for (const resource of BASIC_RESOURCES) {
    const need = counted[resource] || 0;
    const available = ownResources[resource] || 0;
    if (need > available) missing[resource] = need - available;
  }
  const advancedNeeds = {};
  for (const resource of ADVANCED_RESOURCES) {
    if (counted[resource]) advancedNeeds[resource] = counted[resource];
  }
  let flexibleOwned = ADVANCED_RESOURCES.reduce((total, resource) => total + (ownResources[resource] || 0), 0);
  const advancedOrder = Object.keys(advancedNeeds).sort((a, b) => {
    const supplyDiff = tradeNeighbors.reduce((total, entry) => total + getTradeResourceAvailability(entry.player, a), 0)
      - tradeNeighbors.reduce((total, entry) => total + getTradeResourceAvailability(entry.player, b), 0);
    return supplyDiff || ADVANCED_RESOURCES.indexOf(a) - ADVANCED_RESOURCES.indexOf(b);
  });
  for (const resource of advancedOrder) {
    const used = Math.min(advancedNeeds[resource], flexibleOwned);
    advancedNeeds[resource] -= used;
    flexibleOwned -= used;
    if (advancedNeeds[resource] > 0) missing[resource] = advancedNeeds[resource];
  }
  return missing;
}

function getNeighborResourceAvailability(leftPlayer, rightPlayer, resource) {
  const left = getPlayerResources(leftPlayer)[resource] || 0;
  const right = getPlayerResources(rightPlayer)[resource] || 0;
  return { left, right };
}

function getTradeNeighbor(player, side) {
  const index = state.players.findIndex((item) => item.id === player.id);
  if (index < 0) return null;
  if (side === "left") return state.players[(index - 1 + state.players.length) % state.players.length];
  if (side === "right") return state.players[(index + 1) % state.players.length];
  if (side === "overseas") return getLingnanOverseasPartner(player) || state.players.find((item) => item.overseasTradePartnerId === player.id) || null;
  return null;
}

function tradeSideDistance(side) {
  return side === "overseas" ? 2 : 1;
}

function tradeSideLabel(side) {
  return {
    left: "左邻居",
    right: "右邻居",
    overseas: "海上贸易对象"
  }[side] || side;
}

function getTradeNeighbors(player, leftPlayer = null, rightPlayer = null) {
  const candidates = [
    { side: "left", player: leftPlayer || getTradeNeighbor(player, "left") },
    { side: "right", player: rightPlayer || getTradeNeighbor(player, "right") }
  ];
  const overseasPartner = getTradeNeighbor(player, "overseas");
  if (overseasPartner) {
    candidates.push({ side: "overseas", player: overseasPartner });
  }
  const seen = new Set();
  return candidates.filter((entry) => {
    if (!entry.player || entry.player.id === player.id) return false;
    if (seen.has(entry.player.id)) return false;
    seen.add(entry.player.id);
    return true;
  });
}

function getNeighborResourceAvailabilityBySides(tradeNeighbors, resource) {
  const availability = {};
  for (const entry of tradeNeighbors) {
    availability[entry.side] = getTradeResourceAvailability(entry.player, resource);
  }
  return availability;
}

function getTradeCost(player, neighborSide, resource) {
  return getTradePriceDetails(player, neighborSide, resource).unitPrice;
}

function getTradePriceDetails(player, side, resource) {
  const distance = tradeSideDistance(side);
  const basePrice = 2;
  if (side === "overseas") {
    return { basePrice, unitPrice: 2, discountSource: null, distance };
  }
  const discounts = getTradeDiscounts(player);
  if (discounts[side]?.has(resource)) {
    return {
      basePrice,
      unitPrice: 1,
      discountSource: getTradeDiscountSource(player, side, resource),
      distance
    };
  }
  return { basePrice, unitPrice: 2, discountSource: null, distance };
}

function getTradeDiscountSource(player, side, resource) {
  for (const source of [...player.built, ...builtStages(player)]) {
    const tradeDiscount = source.effects?.tradeDiscount || source.tradeDiscount;
    if (tradeDiscount?.[side]?.includes(resource)) return source.name || "黄牌优惠";
  }
  return null;
}

function formatMissingResourceText(missing = {}) {
  return Object.entries(missing)
    .filter(([, count]) => count > 0)
    .map(([resource, count]) => `${resource}×${count}`)
    .join("、");
}

function buildMissingTradeUnits(missing = {}, tradeNeighbors = []) {
  const missingUnits = [];
  for (const [resource, count] of Object.entries(missing)) {
    for (let index = 0; index < count; index += 1) {
      const availability = getNeighborResourceAvailabilityBySides(tradeNeighbors, resource);
      const sources = [];
      for (const entry of tradeNeighbors) {
        if ((availability[entry.side] || 0) > 0) sources.push(entry.side);
      }
      missingUnits.push({ id: `${resource}-${index}`, resource, sources, availability });
    }
  }
  return missingUnits;
}

function summarizeResourceCounts(resourceCounts = {}) {
  return Object.entries(resourceCounts)
    .filter(([, count]) => count > 0)
    .map(([resource, count]) => count > 1 ? `${resource}×${count}` : resource)
    .join("、");
}

function getUnpurchasableResourceCounts(missingUnits = []) {
  return missingUnits.reduce((counts, unit) => {
    if (unit.sources.length) return counts;
    counts[unit.resource] = (counts[unit.resource] || 0) + 1;
    return counts;
  }, {});
}

function buildTradeFailureResult({
  player,
  coinCost = 0,
  tradeCost = 0,
  rebate = 0,
  purchases = {},
  sideCost = {},
  purchaseDetails = [],
  unpurchasableResources = {}
}) {
  const hasUnavailable = Object.keys(unpurchasableResources).length > 0;
  const netTradeCost = Math.max(0, tradeCost - rebate);
  const total = coinCost + netTradeCost;
  const coinShortage = player.coins < total;
  let reason = "unavailable";
  if (hasUnavailable && coinShortage) reason = "mixed";
  else if (!hasUnavailable && coinShortage) reason = "coinShortage";
  const parts = [];
  if (hasUnavailable) {
    parts.push(`缺少 ${summarizeResourceCounts(unpurchasableResources)} 资源，可交易对象均无法提供`);
  }
  if (coinShortage) {
    parts.push(
      hasUnavailable
        ? `购买其余资源需花费 ${netTradeCost} 铜钱，铜钱不足`
        : `购买需花费 ${netTradeCost} 铜钱，铜钱不足`
    );
  }
  return {
    ok: false,
    reason,
    unpurchasableResources,
    tradeCost,
    rebate,
    netTradeCost,
    total,
    purchases,
    sideCost,
    purchaseDetails,
    message: `${parts.join("；")}。`
  };
}

function formatTradeFailureForTarget(targetLabel, player, plan = {}) {
  const missingText = Object.keys(plan.unpurchasableResources || {}).length
    ? summarizeResourceCounts(plan.unpurchasableResources)
    : "";
  if (plan.reason === "coinShortage") {
    const shortage = Math.max(0, (plan.total || 0) - (player?.coins || 0));
    return shortage > 0
      ? `无法${targetLabel}：买不起，还差 ${shortage} 铜钱。`
      : `无法${targetLabel}：买不起，铜钱不足。`;
  }
  if (plan.reason === "unavailable" || plan.reason === "mixed" || plan.reason === "selection") {
    return missingText
      ? `无法${targetLabel}：缺少 ${missingText}，可交易对象也无法提供。`
      : `无法${targetLabel}：可交易对象无法提供所需资源。`;
  }
  return plan.message || `无法${targetLabel}。`;
}

function buildTradeOptions(card, currentPlayer, leftPlayer, rightPlayer) {
  const isWonder = card?.purpose === "wonder";
  const targetCard = isWonder ? card.card : card;
  const baseCostSource = isWonder ? (card.cost || {}) : (targetCard.cost || []);
  const buildDiscountUsed = !isWonder ? resolveBuildDiscount(currentPlayer, targetCard, baseCostSource) : null;
  const costSource = buildDiscountUsed ? applyBuildDiscountToCost(baseCostSource, buildDiscountUsed) : baseCostSource;
  if (!isWonder && currentPlayer.built.some((built) => built.name === targetCard.name)) {
    return { ok: false, requiresTrade: false, message: "不能重复建造同名卡牌。" };
  }
  if (!isWonder && canUseChainBuild(currentPlayer, targetCard)) {
    return {
      ok: true,
      requiresTrade: false,
      purpose: "card",
      action: "build",
      card: targetCard,
      cardId: targetCard.id,
      cost: countCost(baseCostSource),
      payment: null,
      chainFreeBuildUsed: true
    };
  }
  const cost = countCost(costSource);
  const coinCost = cost.coins || 0;
  const targetLabel = isWonder ? "建设区域板" : `建造《${targetCard.name}》`;
  if (currentPlayer.coins < coinCost) {
    return { ok: false, requiresTrade: false, message: `无法${targetLabel}：买不起，铜钱不足。` };
  }
  const freeResourceMap = {};
  const ownResources = getPlayerResources(currentPlayer);
  const tradeNeighbors = getTradeNeighbors(currentPlayer, leftPlayer, rightPlayer);
  const rawMissing = getMissingResourcesForPlayer(currentPlayer, cost, ownResources, tradeNeighbors);
  const resourceChoiceCoverage = applyResourceChoiceCoverage(rawMissing, getResourceChoices(currentPlayer));
  const wildBasicCoverage = applyWildBasicResourceCoverage(currentPlayer, resourceChoiceCoverage.remaining, tradeNeighbors);
  const missing = wildBasicCoverage.remaining;
  const missingUnits = buildMissingTradeUnits(missing, tradeNeighbors);
  if (!missingUnits.length) {
    const emptyPurchases = Object.fromEntries(tradeNeighbors.map((entry) => [entry.side, {}]));
    return {
      ok: true,
      requiresTrade: false,
      purpose: isWonder ? "wonder" : "card",
      action: isWonder ? "wonder" : "build",
      card: targetCard,
      cardId: isWonder ? card.cardId : targetCard.id,
      stageIndex: isWonder ? card.stageIndex : null,
      stageName: isWonder ? card.stageName : "",
      boardName: isWonder ? card.boardName : "",
      cost,
      buildDiscountUsed,
      freeResourceMap,
      resourceChoiceUsage: resourceChoiceCoverage.usage,
      wildBasicUsage: wildBasicCoverage.usage,
      payment: { coinCost, tradeCost: 0, total: coinCost, purchases: emptyPurchases }
    };
  }
  const defaultSelections = chooseDefaultTradeSelections(currentPlayer, missingUnits, tradeNeighbors, coinCost);
  const plan = calculateTradePlan(currentPlayer, missingUnits, defaultSelections, tradeNeighbors, coinCost);
  if (!plan.ok) {
    return {
      ok: false,
      requiresTrade: false,
      purpose: isWonder ? "wonder" : "card",
      action: isWonder ? "wonder" : "build",
      card: targetCard,
      cardId: isWonder ? card.cardId : targetCard.id,
      stageIndex: isWonder ? card.stageIndex : null,
      stageName: isWonder ? card.stageName : "",
      boardName: isWonder ? card.boardName : "",
      cost,
      buildDiscountUsed,
      coinCost,
      ownResources,
      freeResourceMap,
      resourceChoiceUsage: resourceChoiceCoverage.usage,
      wildBasicUsage: wildBasicCoverage.usage,
      missing,
      missingUnits,
      selections: defaultSelections,
      plan,
      reason: plan.reason || null,
      unpurchasableResources: plan.unpurchasableResources || {},
      tradeCost: plan.tradeCost || 0,
      message: formatTradeFailureForTarget(targetLabel, currentPlayer, plan)
    };
  }
  return {
    ok: plan.ok,
    requiresTrade: true,
    purpose: isWonder ? "wonder" : "card",
    action: isWonder ? "wonder" : "build",
    card: targetCard,
    cardId: isWonder ? card.cardId : targetCard.id,
    stageIndex: isWonder ? card.stageIndex : null,
    stageName: isWonder ? card.stageName : "",
    boardName: isWonder ? card.boardName : "",
    player: currentPlayer,
    leftPlayer,
    rightPlayer,
    tradeNeighbors,
    cost,
    buildDiscountUsed,
    coinCost,
    ownResources,
    freeResourceMap,
    resourceChoiceUsage: resourceChoiceCoverage.usage,
    wildBasicUsage: wildBasicCoverage.usage,
    missing,
    missingUnits,
    selections: defaultSelections,
    plan,
    reason: plan.reason || null,
    unpurchasableResources: plan.unpurchasableResources || {},
    tradeCost: plan.tradeCost || 0,
    message: plan.message
  };
}

function chooseDefaultTradeSelections(player, missingUnits, tradeNeighbors, coinCost = 0) {
  const orderedUnits = [...missingUnits].sort((a, b) => {
    const sourceDiff = a.sources.length - b.sources.length;
    if (sourceDiff !== 0) return sourceDiff;
    return RESOURCE_NAMES.indexOf(a.resource) - RESOURCE_NAMES.indexOf(b.resource);
  });
  const usedBySide = Object.fromEntries(tradeNeighbors.map((entry) => [entry.side, {}]));
  let bestSelections = null;
  let bestTotal = Number.POSITIVE_INFINITY;
  let cheapestSelections = null;
  let cheapestTotal = Number.POSITIVE_INFINITY;

  function visit(index, selections) {
    if (index >= orderedUnits.length) {
      const plan = calculateTradePlan(player, missingUnits, selections, tradeNeighbors, coinCost);
      if ((plan.reason === "coinShortage" || plan.ok) && plan.total < cheapestTotal) {
        cheapestTotal = plan.total;
        cheapestSelections = { ...selections };
      }
      if (plan.ok && plan.total < bestTotal) {
        bestTotal = plan.total;
        bestSelections = { ...selections };
      }
      return;
    }

    const unit = orderedUnits[index];
    if (!unit.sources.length) return;

    for (const side of unit.sources) {
      const neighbor = tradeNeighbors.find((entry) => entry.side === side)?.player;
      if (!neighbor) continue;
      const previousPurchases = usedBySide[side] || {};
      const nextPurchases = {
        ...previousPurchases,
        [unit.resource]: (previousPurchases[unit.resource] || 0) + 1
      };
      if (!canPlayerProvideTradePurchases(neighbor, nextPurchases)) continue;
      usedBySide[side] = nextPurchases;
      selections[unit.id] = side;
      visit(index + 1, selections);
      usedBySide[side] = previousPurchases;
      delete selections[unit.id];
    }
  }

  visit(0, {});
  const selected = bestSelections || cheapestSelections;
  return Object.fromEntries(missingUnits.map((unit) => [unit.id, selected?.[unit.id] || ""]));
}

function calculateTradePlan(player, missingUnits, selections, tradeNeighbors, coinCost = 0) {
  const purchases = Object.fromEntries(tradeNeighbors.map((entry) => [entry.side, {}]));
  const sideCost = Object.fromEntries(tradeNeighbors.map((entry) => [entry.side, 0]));
  const purchaseDetails = [];
  const unpurchasableResources = getUnpurchasableResourceCounts(missingUnits);
  for (const unit of missingUnits) {
    if (!unit.sources.length) continue;
    const side = selections[unit.id];
    const neighbor = tradeNeighbors.find((entry) => entry.side === side)?.player;
    if (!neighbor) {
      return {
        ok: false,
        reason: "selection",
        purchases,
        sideCost,
        purchaseDetails,
        tradeCost: Object.values(sideCost).reduce((total, value) => total + value, 0),
        rebate: 0,
        total: coinCost,
        message: "请选择每项资源的购买来源。"
      };
    }
    purchases[side][unit.resource] = (purchases[side][unit.resource] || 0) + 1;
    if (!canPlayerProvideTradePurchases(neighbor, purchases[side])) {
      return { ok: false, message: `${tradeSideLabel(side)}没有足够的 ${unit.resource}。`, purchases, sideCost, purchaseDetails, tradeCost: 0, total: coinCost };
    }
    const price = getTradePriceDetails(player, side, unit.resource);
    sideCost[side] += price.unitPrice;
    purchaseDetails.push({
      fromPlayerId: neighbor.id,
      side,
      distance: price.distance,
      resource: unit.resource,
      amount: 1,
      unitPrice: price.unitPrice,
      totalCost: price.unitPrice,
      discountSource: price.discountSource
    });
  }
  const tradeCost = Object.values(sideCost).reduce((total, value) => total + value, 0);
  const rebate = tradeCost > 0 ? Math.min(getTradeRebate(player), tradeCost) : 0;
  if (Object.keys(unpurchasableResources).length || player.coins < coinCost + tradeCost - rebate) {
    return buildTradeFailureResult({
      player,
      coinCost,
      tradeCost,
      rebate,
      purchases,
      sideCost,
      purchaseDetails,
      unpurchasableResources
    });
  }
  return {
    ok: true,
    purchases,
    sideCost,
    purchaseDetails,
    tradeCost,
    rebate,
    netTradeCost: tradeCost - rebate,
    total: coinCost + tradeCost - rebate,
    coinCost
  };
}

function showTradeDialog(options) {
  state.tradeContext = options;
  $("tradeDialogTitle").textContent = options.purpose === "wonder"
    ? "购买资源以建设区域板"
    : `购买资源以建造《${options.card.name}》`;
  $("tradeConfirmButton").textContent = options.purpose === "wonder"
    ? "确认购买并选择建设区域板"
    : "确认购买并选择建造";
  renderTradeDialog();
  $("tradeDialog").showModal();
}

function renderTradeDialog() {
  const context = state.tradeContext;
  if (!context) return;
  const selections = context.selections || {};
  const plan = calculateTradePlan(
    context.player,
    context.missingUnits,
    selections,
    context.tradeNeighbors || getTradeNeighbors(context.player, context.leftPlayer, context.rightPlayer),
    context.coinCost
  );
  context.plan = plan;
  const missingText = formatIconMap(context.missing);
  const freeResourceText = "";
  const header = context.purpose === "wonder"
    ? `
      <p>当前区域：${context.boardName}</p>
      <p>当前阶段：第 ${Number(context.stageIndex) + 1} 阶段${context.stageName ? `｜${context.stageName}` : ""}</p>
      <p>阶段成本：${formatCost(Object.entries(context.cost).flatMap(([resource, count]) => Array.from({ length: count }, () => resource)))}</p>
      ${freeResourceText}
    `
    : `<p>建造卡牌：${context.card.name}</p>${freeResourceText}`;
  const rows = context.missingUnits.map((unit) => {
    const sources = unit.sources.length ? unit.sources : [];
    const options = sources.map((side) => {
      const neighbor = (context.tradeNeighbors || []).find((entry) => entry.side === side)?.player;
      const price = getTradePriceDetails(context.player, side, unit.resource);
      const label = side === "overseas"
        ? `${tradeSideLabel(side)}（${neighbor?.name || "未知"}，价格${formatIconText("铜钱", price.unitPrice)}）`
        : price.discountSource
          ? `${tradeSideLabel(side)}（${neighbor?.name || "未知"}，距离${price.distance}，基础${price.basePrice}，优惠后${formatIconText("铜钱", price.unitPrice)}，优惠来源：${price.discountSource}）`
          : `${tradeSideLabel(side)}（${neighbor?.name || "未知"}，距离${price.distance}，价格${formatIconText("铜钱", price.unitPrice)}）`;
      return `<option value="${side}" ${selections[unit.id] === side ? "selected" : ""}>${label}</option>`;
    }).join("");
    return `
      <div class="trade-row">
        <label>
          <strong>${formatIconLabel(unit.resource)}</strong>
          <select data-trade-unit="${unit.id}" ${sources.length ? "" : "disabled"}>
            ${sources.length ? options : "<option>可购买邻国均无法提供</option>"}
          </select>
        </label>
      </div>
    `;
  }).join("");
  $("tradeDialogBody").innerHTML = `
    ${header}
    <p>缺少资源：${missingText}</p>
    ${rows}
    <div class="trade-summary">
      <p>当前${compactIcon("铜钱")}：${context.player.coins}</p>
      <p>本次购买总费用：${compactIcon("铜钱")} ×${plan.tradeCost || 0}</p>
      ${(plan.rebate || 0) > 0 ? `<p>商业减免：-${compactIcon("铜钱")} ×${plan.rebate}</p>` : ""}
      <p>购买后剩余${compactIcon("铜钱")}：${context.player.coins - (plan.total || context.coinCost || 0)}</p>
      ${(context.tradeNeighbors || []).map((entry) => `<p>${tradeSideLabel(entry.side)}获得：${compactIcon("铜钱")} ×${plan.sideCost?.[entry.side] || 0}</p>`).join("")}
      ${plan.ok ? "" : `<p class="toast">${plan.message}</p>`}
    </div>
  `;
  $("tradeConfirmButton").disabled = !plan.ok;
  document.querySelectorAll("[data-trade-unit]").forEach((select) => {
    select.addEventListener("change", () => {
      context.selections[select.dataset.tradeUnit] = select.value;
      renderTradeDialog();
    });
  });
}

function confirmTradePlan() {
  const context = state.tradeContext;
  if (!context || !context.plan?.ok) return;
  const player = currentPlayer();
  if (!player || player.id !== context.player.id) return;
  const tradePlan = {
    ...context.plan.purchases,
    purchases: context.plan.purchaseDetails || [],
    sideCosts: context.plan.sideCost || {},
    totalCost: context.plan.tradeCost,
    coinCost: context.plan.coinCost || 0,
    total: context.plan.total
  };
  const payment = {
    coinCost: tradePlan.coinCost,
    tradeCost: tradePlan.totalCost,
    total: tradePlan.total,
    purchases: context.plan.purchases,
    purchaseDetails: context.plan.purchaseDetails || []
  };
  setPendingChoice(player, {
    cardId: context.cardId || context.card.id,
    action: context.action || "build",
    type: context.action || "build",
    stageIndex: context.stageIndex ?? null,
    cost: context.cost || null,
    payment,
    tradePlan
  });
  state.tradeContext = null;
  $("tradeDialog").close();
}

function cancelTradePlan() {
  clearPendingChoiceUI(currentPlayer(), { render: false });
  $("tradeDialog").close();
  renderGame();
}

function canPay(player, cost = {}) {
  cost = normalizeCost(cost);
  const coinCost = cost.coins || 0;
  const resourceCost = {};
  for (const resource of RESOURCE_NAMES) {
    if (cost[resource]) resourceCost[resource] = cost[resource];
  }
  if (player.coins < coinCost) return { ok: false, message: "铜钱不足。" };

  const ownResources = getResources(player);
  const tradeNeighbors = getTradeNeighbors(player);
  const remaining = getMissingResourcesForPlayer(player, resourceCost, ownResources, tradeNeighbors);
  const resourceChoiceCoverage = applyResourceChoiceCoverage(remaining, getResourceChoices(player));
  const wildBasicCoverage = applyWildBasicResourceCoverage(player, resourceChoiceCoverage.remaining, tradeNeighbors);
  const adjustedRemaining = wildBasicCoverage.remaining;
  const missingUnits = buildMissingTradeUnits(adjustedRemaining, tradeNeighbors);
  if (!missingUnits.length) {
    return { ok: true, coinCost, tradeCost: 0, total: coinCost, purchases: Object.fromEntries(tradeNeighbors.map((entry) => [entry.side, {}])) };
  }
  const selections = chooseDefaultTradeSelections(player, missingUnits, tradeNeighbors, coinCost);
  const plan = calculateTradePlan(player, missingUnits, selections, tradeNeighbors, coinCost);
  return plan.ok ? plan : { ok: false, message: plan.message, reason: plan.reason, unpurchasableResources: plan.unpurchasableResources, tradeCost: plan.tradeCost };
}

function normalizeCost(cost = {}) {
  if (!Array.isArray(cost)) return cost || {};
  const normalized = {};
  for (const item of cost) {
    const resource = normalizeCostItem(item);
    if (!resource) continue;
    const amount = typeof item === "string" ? 1 : item?.amount || 1;
    normalized[resource] = (normalized[resource] || 0) + amount;
  }
  return normalized;
}

function tradePrice(player, side, resource) {
  return getTradePriceDetails(player, side, resource).unitPrice;
}

function getTradeRebate(player) {
  return [...player.built, ...builtStages(player)]
    .reduce((total, source) => total + (source.effects?.tradeRebate || source.tradeRebate || 0), 0);
}

function getBuildDiscountPool(player) {
  if (!Array.isArray(player.temporaryBuildDiscounts)) player.temporaryBuildDiscounts = [];
  return player.temporaryBuildDiscounts;
}

function resolveBuildDiscount(player, card, costSource) {
  if (!card || !costSource) return null;
  const available = getBuildDiscountPool(player);
  const discountIndex = available.findIndex((discount) => discount?.cardColor === card.color);
  if (discountIndex < 0) return null;
  if (Array.isArray(costSource)) {
    const resourceIndex = costSource.findIndex((item) => typeof item === "string" && RESOURCE_NAMES.includes(item));
    if (resourceIndex < 0) return null;
    return {
      discountIndex,
      cardColor: card.color,
      resource: costSource[resourceIndex],
      amount: 1
    };
  }
  for (const resource of RESOURCE_NAMES) {
    if ((costSource[resource] || 0) > 0) {
      return {
        discountIndex,
        cardColor: card.color,
        resource,
        amount: 1
      };
    }
  }
  return null;
}

function applyBuildDiscountToCost(costSource, discount) {
  if (!discount) return costSource;
  if (Array.isArray(costSource)) {
    let skipped = false;
    return costSource.filter((item) => {
      if (!skipped && item === discount.resource) {
        skipped = true;
        return false;
      }
      return true;
    });
  }
  const adjusted = { ...(costSource || {}) };
  adjusted[discount.resource] = Math.max(0, (adjusted[discount.resource] || 0) - (discount.amount || 1));
  return adjusted;
}

function consumeBuildDiscount(player, discountInfo) {
  if (!discountInfo) return;
  const discounts = getBuildDiscountPool(player);
  if (typeof discountInfo.discountIndex === "number" && discounts[discountInfo.discountIndex]) {
    discounts.splice(discountInfo.discountIndex, 1);
    return;
  }
  const fallbackIndex = discounts.findIndex((discount) => discount?.cardColor === discountInfo.cardColor);
  if (fallbackIndex >= 0) discounts.splice(fallbackIndex, 1);
}

function hasTwoPointDefense(player) {
  return ["jiangnan", "bashu", "lingnan"].includes(player?.board?.id);
}

function leftNeighborOf(players, player) {
  const index = players.findIndex((item) => item.id === player.id);
  return players[(index - 1 + players.length) % players.length];
}

function rightNeighborOf(players, player) {
  const index = players.findIndex((item) => item.id === player.id);
  return players[(index + 1) % players.length];
}

function ensureLiaodongState(player) {
  if (!player) return;
  if (!player.liaodongGuardByAge || typeof player.liaodongGuardByAge !== "object") player.liaodongGuardByAge = {};
  if (!player.liaodongNoDefeatAges || typeof player.liaodongNoDefeatAges !== "object") player.liaodongNoDefeatAges = {};
}

function guardedLiaodongSides(player, age = state.age) {
  if (player?.board?.id !== "liaodong") return [];
  if (hasBuiltStageEffect(player, "guardBothNeighbors")) return ["left", "right"];
  ensureLiaodongState(player);
  const selected = player.liaodongGuardByAge?.[String(age)] || player.liaodongGuardByAge?.[age];
  return ["left", "right"].includes(selected) ? [selected] : [];
}

function militaryDefeatThreshold(defender, attacker) {
  let threshold = hasTwoPointDefense(defender) ? 2 : 1;
  if (defender?.board?.id === "liaodong" && attacker) {
    const leftNeighbor = getLeftNeighbor(defender);
    const rightNeighbor = getRightNeighbor(defender);
    const side = leftNeighbor?.id === attacker.id ? "left" : rightNeighbor?.id === attacker.id ? "right" : "";
    if (guardedLiaodongSides(defender).includes(side)) {
      threshold = Math.max(threshold, 3);
    }
  }
  return threshold;
}

function beatsInMilitary(attacker, defender) {
  const attackerShields = getMilitary(attacker);
  const defenderShields = getMilitary(defender);
  return attackerShields >= defenderShields + militaryDefeatThreshold(defender, attacker);
}

function calculateMobeiPlunderAmount(neighbor) {
  const coins = Math.max(0, neighbor?.coins || 0);
  if (coins <= 0) return 0;
  return Math.min(coins, Math.min(5, Math.max(1, Math.floor(coins / 2))));
}

function applyMobeiPlunder(player, neighbor) {
  if (!player || !neighbor) return 0;
  const amount = calculateMobeiPlunderAmount(neighbor);
  if (amount <= 0) return 0;
  neighbor.coins -= amount;
  player.coins += amount;
  addCoinLog(player, {
    type: "gain",
    sourceType: "board",
    sourceName: "漠北区域特质",
    coins: amount,
    description: `漠北技能：战胜${neighbor.name}，夺取${amount}枚铜钱。`
  });
  addCoinLog(neighbor, {
    type: "spend",
    sourceType: "board",
    sourceName: "漠北区域特质",
    coins: amount,
    description: `被${player.name}的漠北技能夺取${amount}枚铜钱。`
  });
  log(`漠北技能：${player.name}战胜${neighbor.name}，夺取${amount}枚铜钱。`);
  return amount;
}

function getTradeDiscounts(player) {
  const discounts = { left: new Set(), right: new Set() };
  for (const source of [...player.built, ...builtStages(player)]) {
    const tradeDiscount = source.effects?.tradeDiscount || source.tradeDiscount;
    if (!tradeDiscount) continue;
    for (const side of ["left", "right"]) {
      for (const resource of tradeDiscount[side] || []) discounts[side].add(resource);
    }
  }
  return discounts;
}

function getResources(player) {
  let resources = { ...player.board.startResource };
  for (const card of player.built) {
    if (resolveCardResourceChoice(card).length) continue;
    resources = sumObjects(resources, producesToResourceMap(card.produces || [], card.resource));
  }
  for (const stage of builtStages(player)) {
    if (stage.effects?.resource) resources = sumObjects(resources, stage.effects.resource);
  }
  return resources;
}

function hasFreeFirstCardEachAgeAbility(player) {
  return hasBuiltStageEffect(player, "freeFirstCardEachAge");
}

function getFreeFirstCardUsage(player) {
  if (!player.freeFirstCardUsedByAge || typeof player.freeFirstCardUsedByAge !== "object") {
    player.freeFirstCardUsedByAge = {};
  }
  return player.freeFirstCardUsedByAge;
}

function builtCardCountForAge(player, age = state.age) {
  return player.built.filter((card) => Number(card.builtAge) === Number(age)).length;
}

function canUseFreeFirstCardBuild(player, age = state.age) {
  if (!hasFreeFirstCardEachAgeAbility(player)) return false;
  const usage = getFreeFirstCardUsage(player);
  return !usage[String(age)] && builtCardCountForAge(player, age) === 0;
}

function freeFirstCardStatusText(player, age = state.age) {
  if (!hasFreeFirstCardEachAgeAbility(player)) return "";
  return canUseFreeFirstCardBuild(player, age)
    ? "每个时代第一张卡牌免费建造（本时代可用）"
    : "每个时代第一张卡牌免费建造（本时代已使用）";
}

function expireTemporaryBoardEffects(currentAge) {
  state.players.forEach((player) => {
    player.temporaryBuildDiscounts = (player.temporaryBuildDiscounts || [])
      .filter((discount) => !discount.age || discount.age === currentAge);
  });
}

function producesToResourceMap(produces = [], legacyResource = null) {
  const produced = {};
  for (const item of produces) {
    const resource = typeof item === "string" ? item : item?.["resource"];
    const amount = typeof item === "string" ? 1 : item?.["amount"] || 1;
    if (!resource) continue;
    produced[resource] = (produced[resource] || 0) + amount;
  }
  return Object.keys(produced).length ? produced : legacyResource || {};
}

function builtStages(player) {
  return player.board.stages.slice(0, player.stagesBuilt);
}

function hasBuiltStageEffect(player, effectName) {
  return builtStages(player).some((stage) => stage.effects?.effect === effectName);
}

function ensureExtraCoinsFirstGainUsage(player) {
  if (!player || typeof player !== "object") return {};
  if (!player.extraCoinsFirstGainUsedByRound || typeof player.extraCoinsFirstGainUsedByRound !== "object" || Array.isArray(player.extraCoinsFirstGainUsedByRound)) {
    player.extraCoinsFirstGainUsedByRound = {};
  }
  return player.extraCoinsFirstGainUsedByRound;
}

function currentAgeTurnKey() {
  return `${state.age}-${state.turn}`;
}

function hasBashuExtraCoinsAbility(player) {
  return player?.board?.id === "bashu" && hasBuiltStageEffect(player, "extraCoinsFirstGainEachTurn");
}

function shouldTriggerBashuExtraCoins(player, options = {}) {
  const { allowBashuBonus = false, suppressBashuBonus = false } = options;
  if (!allowBashuBonus || suppressBashuBonus) return false;
  if (!hasBashuExtraCoinsAbility(player)) return false;
  const usage = ensureExtraCoinsFirstGainUsage(player);
  return !usage[currentAgeTurnKey()];
}

function triggerBashuExtraCoins(player) {
  const usage = ensureExtraCoinsFirstGainUsage(player);
  usage[currentAgeTurnKey()] = true;
  player.coins += 2;
  addCoinLog(player, {
    type: "gain",
    sourceType: "wonder",
    sourceName: "蜀道商旅",
    coins: 2,
    description: "巴蜀蜀道商旅：本轮第一次获得铜钱，额外获得 2 铜钱。"
  });
  log("巴蜀蜀道商旅：本轮第一次获得铜钱，额外获得 2 铜钱。");
  return 2;
}

function grantCoins(player, coins, entry = {}, options = {}) {
  if (!player || !coins || coins <= 0) return 0;
  player.coins += coins;
  addCoinLog(player, { ...entry, coins });
  if (shouldTriggerBashuExtraCoins(player, options)) {
    return coins + triggerBashuExtraCoins(player);
  }
  return coins;
}

function createGuanzhongResourceCard(player, age, index, resource) {
  return {
    id: `guanzhong-resource-${player.id}-${age}-${index}-${resource}`,
    name: GUANZHONG_RESOURCE_CARD_NAMES[resource] || `军功${resource}`,
    color: "brown",
    type: "resource",
    age,
    builtAge: age,
    cost: [],
    produces: [resource],
    resource: { [resource]: 1 },
    points: 0,
    shields: 0,
    coins: 0,
    effect: null,
    description: `关中技能获得：${resource}`
  };
}

function addGuanzhongResourceCard(player, resource, age = state.age, index = 0) {
  if (!player || !BASIC_RESOURCES.includes(resource)) return null;
  const card = createGuanzhongResourceCard(player, age, index, resource);
  if (!getBuiltCards(player).some((builtCard) => builtCard.id === card.id)) {
    player.built.push(card);
  }
  return card;
}

function chooseGuanzhongResourceForAI(player) {
  const resources = getPlayerResources(player);
  const priority = ["铁矿", "石料", "粮食", "木材"];
  return priority.find((resource) => !resources[resource]) || priority[0];
}

function chooseLiaodongResourceForAI(player) {
  return chooseGuanzhongResourceForAI(player);
}

function createLiaodongResourceCard(player, age, resource) {
  return ensureResolvedEffectFields({
    id: `liaodong-resource-${player.id}-${age}-${resource}-${Date.now()}`,
    name: `屯垦${resource}`,
    color: "brown",
    type: "resource",
    age,
    cost: [],
    produces: [resource],
    resource: { [resource]: 1 },
    points: 0,
    shields: 0,
    coins: 0,
    effect: null,
    description: `辽东屯垦获得：${resource}`
  });
}

function addLiaodongResourceCard(player, resource, age) {
  const card = createLiaodongResourceCard(player, age, resource);
  if (!getBuiltCards(player).some((builtCard) => builtCard.id === card.id)) {
    player.built.push(card);
  }
  return card;
}

function chooseLiaodongGuardSideForAI(player, players = state.players) {
  const left = leftNeighborOf(players, player);
  const right = rightNeighborOf(players, player);
  const leftMilitary = getMilitary(left);
  const rightMilitary = getMilitary(right);
  if (leftMilitary === rightMilitary) return Math.random() < 0.5 ? "left" : "right";
  return leftMilitary > rightMilitary ? "left" : "right";
}

function pendingLiaodongGuardChoicePlayers() {
  return state.players.filter((player) => player.pendingLiaodongGuardChoice && !isAI(player));
}

function currentLiaodongGuardChoicePlayer() {
  if (state.phase !== "liaodong-guard-choice") return null;
  if (state.mode === "online") {
    const localPlayer = state.players.find((player) => player.id === getLocalPlayerId());
    return localPlayer?.pendingLiaodongGuardChoice ? localPlayer : null;
  }
  return pendingLiaodongGuardChoicePlayers()[0] || null;
}

function canLocalPlayerChooseLiaodongGuard(player = currentLiaodongGuardChoicePlayer()) {
  if (!player || !player.pendingLiaodongGuardChoice || isAI(player)) return false;
  if (state.mode === "online") return player.id === getLocalPlayerId();
  return true;
}

function prepareLiaodongGuardChoices(players = state.players, age = state.age, options = {}) {
  const pendingPlayers = [];
  const includeLogs = options.includeLogs !== false;
  for (const player of players) {
    if (player.board?.id !== "liaodong") continue;
    ensureLiaodongState(player);
    if (hasBuiltStageEffect(player, "guardBothNeighbors")) {
      player.liaodongGuardByAge[String(age)] = "both";
      delete player.pendingLiaodongGuardChoice;
      if (includeLogs) log(`辽东技能：${player.name}本时代已双向警戒左右邻国。`);
      continue;
    }
    if (isAI(player)) {
      const side = chooseLiaodongGuardSideForAI(player, players);
      player.liaodongGuardByAge[String(age)] = side;
      delete player.pendingLiaodongGuardChoice;
      if (includeLogs) log(`辽东技能：${player.name}本时代警戒${side === "left" ? "左邻" : "右邻"}。`);
      continue;
    }
    player.pendingLiaodongGuardChoice = { age };
    pendingPlayers.push(player);
  }
  return pendingPlayers;
}

function startLiaodongGuardChoicePhase(shouldRender = true) {
  const pendingPlayers = pendingLiaodongGuardChoicePlayers();
  if (!pendingPlayers.length) return false;
  state.phase = "liaodong-guard-choice";
  state.selected = {};
  state.pendingChoice = {};
  state.liaodongGuardChoice = {
    age: state.age,
    pendingPlayerIds: pendingPlayers.map((player) => player.id)
  };
  if (state.mode !== "online") {
    state.seatCursor = Math.max(0, state.players.findIndex((player) => player.id === pendingPlayers[0].id));
  }
  if (shouldRender) {
    showView("game");
    renderGame();
  }
  return true;
}

function setLiaodongGuardSide(player, side) {
  if (!player || !["left", "right"].includes(side)) return false;
  ensureLiaodongState(player);
  player.liaodongGuardByAge[String(state.age)] = side;
  delete player.pendingLiaodongGuardChoice;
  log(`辽东技能：${player.name}本时代警戒${side === "left" ? "左邻" : "右邻"}。`);
  return true;
}

function pendingLiaodongResourceChoicePlayers() {
  return state.players.filter((player) => player.pendingLiaodongResourceChoice && !isAI(player));
}

function currentLiaodongResourceChoicePlayer() {
  if (state.phase !== "liaodong-resource-choice") return null;
  if (state.mode === "online") {
    const localPlayer = state.players.find((player) => player.id === getLocalPlayerId());
    return localPlayer?.pendingLiaodongResourceChoice ? localPlayer : null;
  }
  return pendingLiaodongResourceChoicePlayers()[0] || null;
}

function canLocalPlayerChooseLiaodongResource(player = currentLiaodongResourceChoicePlayer()) {
  if (!player || !player.pendingLiaodongResourceChoice || isAI(player)) return false;
  if (state.mode === "online") return player.id === getLocalPlayerId();
  return true;
}

function prepareLiaodongResourceChoices(results = []) {
  for (const result of results) {
    const player = state.players.find((item) => item.id === result.playerId);
    if (!player || player.board?.id !== "liaodong" || state.age >= 3) continue;
    ensureLiaodongState(player);
    if (result.safeThisAge) {
      player.liaodongNoDefeatAges[String(state.age)] = true;
      if (isAI(player)) {
        const resource = chooseLiaodongResourceForAI(player);
        addLiaodongResourceCard(player, resource, state.age);
        log(`辽东技能：${player.name}本时代未获得战败标记，获得${resource}资源牌。`);
        continue;
      }
      player.pendingLiaodongResourceChoice = { age: state.age, choice: "" };
      continue;
    }
    player.liaodongNoDefeatAges[String(state.age)] = false;
    delete player.pendingLiaodongResourceChoice;
  }
}

function startLiaodongResourceChoicePhase(shouldRender = true) {
  const pendingPlayers = pendingLiaodongResourceChoicePlayers();
  if (!pendingPlayers.length) return false;
  state.phase = "liaodong-resource-choice";
  state.selected = {};
  state.pendingChoice = {};
  state.liaodongResourceChoice = {
    age: state.age,
    pendingPlayerIds: pendingPlayers.map((player) => player.id)
  };
  if (state.mode !== "online") {
    state.seatCursor = Math.max(0, state.players.findIndex((player) => player.id === pendingPlayers[0].id));
  }
  if (shouldRender) {
    showView("game");
    renderGame();
  }
  return true;
}

function finalizeLiaodongResourceChoicesForPlayer(player) {
  const pending = player?.pendingLiaodongResourceChoice;
  if (!player || !pending || pending.age !== state.age || !BASIC_RESOURCES.includes(pending.choice)) return null;
  addLiaodongResourceCard(player, pending.choice, pending.age);
  delete player.pendingLiaodongResourceChoice;
  log(`辽东技能：${player.name}本时代未获得战败标记，获得${pending.choice}资源牌。`);
  return pending.choice;
}

function guanzhongChoiceState(player) {
  const pending = player?.pendingGuanzhongResourceChoices;
  if (!pending || pending.age !== state.age || !pending.count) return null;
  const choices = Array.isArray(pending.choices) ? pending.choices.filter((resource) => BASIC_RESOURCES.includes(resource)) : [];
  return { ...pending, choices };
}

function needsGuanzhongResourceChoice(player) {
  const pending = guanzhongChoiceState(player);
  return Boolean(pending && pending.choices.length < pending.count);
}

function hasPendingGuanzhongResourceChoice(player) {
  return Boolean(guanzhongChoiceState(player));
}

function pendingGuanzhongResourceChoicePlayers() {
  return state.players.filter((player) => hasPendingGuanzhongResourceChoice(player) && !isAI(player));
}

function recoverStaleGuanzhongResourceChoicePhase(shouldRender = true) {
  if (state.phase !== "guanzhong-resource-choice") return false;
  if (pendingGuanzhongResourceChoicePlayers().length) return false;
  const currentAge = Number(state.age);
  const stalePlayers = state.players.filter((player) => {
    const pending = player?.pendingGuanzhongResourceChoices;
    return pending && Number(pending.age) < currentAge;
  });
  const stalePhase = state.guanzhongResourceChoice && Number(state.guanzhongResourceChoice.age) < currentAge;
  if (!stalePlayers.length && !stalePhase) return false;
  stalePlayers.forEach((player) => {
    delete player.pendingGuanzhongResourceChoices;
  });
  state.guanzhongResourceChoice = null;
  state.phase = "game";
  if (state.mode === "online" && state.online?.isHost) {
    void syncRoom("game");
  }
  if (shouldRender) renderGame();
  return true;
}

function requestOnlineGuanzhongResourceChoiceResolution() {
  if (state.mode !== "online" || !state.online?.isHost || state.phase !== "guanzhong-resource-choice") return;
  if (state.online.resolving) {
    setTimeout(() => {
      if (state.phase === "guanzhong-resource-choice") void maybeResolveOnlineGuanzhongResourceChoicePhase();
    }, 0);
    return;
  }
  void maybeResolveOnlineGuanzhongResourceChoicePhase();
}

function currentGuanzhongResourceChoicePlayer() {
  if (state.phase !== "guanzhong-resource-choice") return null;
  if (state.mode === "online") {
    const localPlayer = state.players.find((player) => player.id === getLocalPlayerId());
    if (hasPendingGuanzhongResourceChoice(localPlayer)) return localPlayer;
    return null;
  }
  return pendingGuanzhongResourceChoicePlayers()[0] || null;
}

function canLocalPlayerChooseGuanzhongResource(player = currentGuanzhongResourceChoicePlayer()) {
  if (!player || !hasPendingGuanzhongResourceChoice(player) || isAI(player)) return false;
  if (state.mode === "online") return player.id === getLocalPlayerId();
  return true;
}

function prepareGuanzhongResourceChoices(results = []) {
  const pendingPlayers = [];
  let autoResolved = false;
  for (const result of results) {
    const player = state.players.find((item) => item.id === result.playerId);
    const count = Math.max(0, Number(result.winCount || 0));
    if (!player || player.board?.id !== "guanzhong" || state.age >= 3 || count <= 0) continue;
    if (isAI(player)) {
      const choices = [];
      for (let index = 0; index < count; index += 1) {
        const resource = chooseGuanzhongResourceForAI(player);
        addGuanzhongResourceCard(player, resource, state.age, index);
        choices.push(resource);
      }
      log(`关中技能：${player.name}因战胜${count}方，获得${choices.join("、")}资源牌。`);
      autoResolved = true;
      continue;
    }
    player.pendingGuanzhongResourceChoices = {
      age: state.age,
      count,
      choices: []
    };
    pendingPlayers.push(player);
  }
  return { pendingPlayers, autoResolved };
}

function startGuanzhongResourceChoicePhase(results = [], shouldRender = true) {
  const { pendingPlayers } = prepareGuanzhongResourceChoices(results);
  if (!pendingPlayers.length) return false;
  state.phase = "guanzhong-resource-choice";
  state.selected = {};
  state.pendingChoice = {};
  state.guanzhongResourceChoice = {
    age: state.age,
    pendingPlayerIds: pendingPlayers.map((player) => player.id)
  };
  if (state.mode !== "online") {
    state.seatCursor = Math.max(0, state.players.findIndex((player) => player.id === pendingPlayers[0].id));
  }
  if (shouldRender) {
    showView("game");
    renderGame();
  }
  return true;
}

function finalizeGuanzhongResourceChoicesForPlayer(player) {
  const pending = guanzhongChoiceState(player);
  if (!pending || pending.choices.length < pending.count) return [];
  const choices = pending.choices.slice(0, pending.count);
  choices.forEach((resource, index) => addGuanzhongResourceCard(player, resource, pending.age, index));
  delete player.pendingGuanzhongResourceChoices;
  log(`关中技能：${player.name}因战胜${pending.count}方，获得${choices.join("、")}资源牌。`);
  return choices;
}

function continueAfterGuanzhongResourceChoices(shouldRender = true) {
  const pendingPlayers = pendingGuanzhongResourceChoicePlayers();
  if (pendingPlayers.length) {
    const nextPlayer = pendingPlayers[0];
    state.seatCursor = Math.max(0, state.players.findIndex((player) => player.id === nextPlayer.id));
    if (shouldRender) renderGame();
    return;
  }
  state.guanzhongResourceChoice = null;
  if (startLiaodongResourceChoicePhase(shouldRender)) return;
  advanceAfterMilitaryResolution(shouldRender);
}

function chooseGuanzhongResource(slotIndex, resource) {
  const player = currentGuanzhongResourceChoicePlayer();
  if (!player || !canLocalPlayerChooseGuanzhongResource(player) || !BASIC_RESOURCES.includes(resource)) return;
  const pending = guanzhongChoiceState(player);
  if (!pending || slotIndex < 0 || slotIndex >= pending.count) return;
  pending.choices[slotIndex] = resource;
  player.pendingGuanzhongResourceChoices = pending;
  renderGame();
}

async function syncGuanzhongResourceChoice(player) {
  if (state.mode !== "online" || !state.online.roomRef || !player) return;
  const now = Date.now();
  await firebaseUpdate(state.online.roomRef, {
    [`players/${player.id}/built`]: player.built,
    [`players/${player.id}/pendingGuanzhongResourceChoices`]: null,
    [`game/players/${player.id}/built`]: player.built,
    [`game/players/${player.id}/pendingGuanzhongResourceChoices`]: null,
    ...roomLeasePayload(now)
  });
}

async function confirmGuanzhongResourceChoices() {
  const player = currentGuanzhongResourceChoicePlayer();
  if (!player || !canLocalPlayerChooseGuanzhongResource(player)) return;
  const choices = finalizeGuanzhongResourceChoicesForPlayer(player);
  if (!choices.length) return;
  if (state.mode === "online") {
    await syncGuanzhongResourceChoice(player);
    renderGame();
    if (state.online.isHost) await maybeResolveOnlineGuanzhongResourceChoicePhase();
    return;
  }
  continueAfterGuanzhongResourceChoices(true);
}

async function maybeResolveOnlineGuanzhongResourceChoicePhase() {
  if (state.mode !== "online" || !state.online.isHost || state.online.resolving || state.phase !== "guanzhong-resource-choice") return;
  state.online.resolving = true;
  try {
    let autoResolved = false;
    for (const player of state.players.filter((item) => needsGuanzhongResourceChoice(item) && isAI(item))) {
      const pending = guanzhongChoiceState(player);
      const choices = [];
      for (let index = 0; index < pending.count; index += 1) {
        const resource = chooseGuanzhongResourceForAI(player);
        addGuanzhongResourceCard(player, resource, pending.age, index);
        choices.push(resource);
      }
      delete player.pendingGuanzhongResourceChoices;
      log(`关中技能：${player.name}因战胜${pending.count}方，获得${choices.join("、")}资源牌。`);
      autoResolved = true;
    }
    const unresolved = pendingGuanzhongResourceChoicePlayers();
    if (unresolved.length) {
      await syncRoom("guanzhong-resource-choice");
      renderCurrentOnlinePhase();
      return;
    }
    continueAfterGuanzhongResourceChoices(false);
    await syncRoom(state.phase);
    renderCurrentOnlinePhase();
  } catch (error) {
    showOnlineError(error);
  } finally {
    state.online.resolving = false;
  }
}

function advanceAfterMilitaryResolution(shouldRender = true) {
  state.liaodongResourceChoice = null;
  if (state.age >= 3) {
    if (startEndGameScienceChoicePhase(shouldRender)) return;
    state.phase = "score";
    if (shouldRender) {
      renderScores();
      showView("score");
    }
    return;
  }
  state.phase = "game";
  startAge(state.age + 1, shouldRender);
}

function continueAfterLiaodongGuardChoices(shouldRender = true) {
  const pendingPlayers = pendingLiaodongGuardChoicePlayers();
  if (pendingPlayers.length) {
    const nextPlayer = pendingPlayers[0];
    state.seatCursor = Math.max(0, state.players.findIndex((player) => player.id === nextPlayer.id));
    if (shouldRender) renderGame();
    return;
  }
  state.liaodongGuardChoice = null;
  state.phase = "game";
  if (shouldRender) renderGame();
}

async function syncLiaodongGuardChoice(player) {
  if (state.mode !== "online" || !state.online.roomRef || !player) return;
  const now = Date.now();
  await firebaseUpdate(state.online.roomRef, {
    [`players/${player.id}/liaodongGuardByAge`]: player.liaodongGuardByAge || {},
    [`players/${player.id}/pendingLiaodongGuardChoice`]: null,
    [`game/players/${player.id}/liaodongGuardByAge`]: player.liaodongGuardByAge || {},
    [`game/players/${player.id}/pendingLiaodongGuardChoice`]: null,
    log: state.logs,
    "game/logs": state.logs,
    ...roomLeasePayload(now)
  });
}

function chooseLiaodongGuardSide(side) {
  const player = currentLiaodongGuardChoicePlayer();
  if (!player || !canLocalPlayerChooseLiaodongGuard(player) || !["left", "right"].includes(side)) return;
  if (!setLiaodongGuardSide(player, side)) return;
  if (state.mode === "online") {
    void (async () => {
      await syncLiaodongGuardChoice(player);
      renderGame();
      if (state.online.isHost) await maybeResolveOnlineLiaodongGuardChoicePhase();
    })();
    return;
  }
  continueAfterLiaodongGuardChoices(true);
}

async function maybeResolveOnlineLiaodongGuardChoicePhase() {
  if (state.mode !== "online" || !state.online.isHost || state.online.resolving || state.phase !== "liaodong-guard-choice") return;
  state.online.resolving = true;
  try {
    for (const player of state.players.filter((item) => item.pendingLiaodongGuardChoice && isAI(item))) {
      const side = chooseLiaodongGuardSideForAI(player);
      setLiaodongGuardSide(player, side);
    }
    const unresolved = pendingLiaodongGuardChoicePlayers();
    if (unresolved.length) {
      await syncRoom("liaodong-guard-choice");
      renderCurrentOnlinePhase();
      return;
    }
    continueAfterLiaodongGuardChoices(false);
    await syncRoom(state.phase);
    renderCurrentOnlinePhase();
  } catch (error) {
    showOnlineError(error);
  } finally {
    state.online.resolving = false;
  }
}

function continueAfterLiaodongResourceChoices(shouldRender = true) {
  const pendingPlayers = pendingLiaodongResourceChoicePlayers();
  if (pendingPlayers.length) {
    const nextPlayer = pendingPlayers[0];
    state.seatCursor = Math.max(0, state.players.findIndex((player) => player.id === nextPlayer.id));
    if (shouldRender) renderGame();
    return;
  }
  advanceAfterMilitaryResolution(shouldRender);
}

async function syncLiaodongResourceChoice(player) {
  if (state.mode !== "online" || !state.online.roomRef || !player) return;
  const now = Date.now();
  await firebaseUpdate(state.online.roomRef, {
    [`players/${player.id}/built`]: player.built,
    [`players/${player.id}/pendingLiaodongResourceChoice`]: null,
    [`players/${player.id}/liaodongNoDefeatAges`]: player.liaodongNoDefeatAges || {},
    [`game/players/${player.id}/built`]: player.built,
    [`game/players/${player.id}/pendingLiaodongResourceChoice`]: null,
    [`game/players/${player.id}/liaodongNoDefeatAges`]: player.liaodongNoDefeatAges || {},
    log: state.logs,
    "game/logs": state.logs,
    ...roomLeasePayload(now)
  });
}

function chooseLiaodongResource(resource) {
  const player = currentLiaodongResourceChoicePlayer();
  if (!player || !canLocalPlayerChooseLiaodongResource(player) || !BASIC_RESOURCES.includes(resource)) return;
  player.pendingLiaodongResourceChoice.choice = resource;
  renderGame();
}

async function confirmLiaodongResourceChoice() {
  const player = currentLiaodongResourceChoicePlayer();
  if (!player || !canLocalPlayerChooseLiaodongResource(player)) return;
  const choice = finalizeLiaodongResourceChoicesForPlayer(player);
  if (!choice) return;
  if (state.mode === "online") {
    await syncLiaodongResourceChoice(player);
    renderGame();
    if (state.online.isHost) await maybeResolveOnlineLiaodongResourceChoicePhase();
    return;
  }
  continueAfterLiaodongResourceChoices(true);
}

async function maybeResolveOnlineLiaodongResourceChoicePhase() {
  if (state.mode !== "online" || !state.online.isHost || state.online.resolving || state.phase !== "liaodong-resource-choice") return;
  state.online.resolving = true;
  try {
    for (const player of state.players.filter((item) => item.pendingLiaodongResourceChoice && isAI(item))) {
      player.pendingLiaodongResourceChoice.choice = chooseLiaodongResourceForAI(player);
      finalizeLiaodongResourceChoicesForPlayer(player);
    }
    const unresolved = pendingLiaodongResourceChoicePlayers();
    if (unresolved.length) {
      await syncRoom("liaodong-resource-choice");
      renderCurrentOnlinePhase();
      return;
    }
    continueAfterLiaodongResourceChoices(false);
    await syncRoom(state.phase);
    renderCurrentOnlinePhase();
  } catch (error) {
    showOnlineError(error);
  } finally {
    state.online.resolving = false;
  }
}

function pendingHedongDiscardBuildChoicePlayers() {
  return state.players.filter((player) => (
    player.pendingHedongDiscardBuildChoice
    && !isHedongDiscardBuildChoiceResolved(player)
  ));
}

function hedongDiscardBuildRoundKey(player) {
  if (!player?.id) return "";
  return `${state.age}-${state.turn}-${player.id}-hedong-discard`;
}

function isHedongDiscardBuildChoiceResolved(player) {
  const key = hedongDiscardBuildRoundKey(player);
  return Boolean(key && state.resolvedSpecialEffects?.[key]);
}

function markHedongDiscardBuildChoiceResolved(player) {
  const key = hedongDiscardBuildRoundKey(player);
  if (!key) return "";
  if (!state.resolvedSpecialEffects || typeof state.resolvedSpecialEffects !== "object") {
    state.resolvedSpecialEffects = {};
  }
  state.resolvedSpecialEffects[key] = true;
  if (state.hedongDiscardChoice?.pendingPlayerIds) {
    state.hedongDiscardChoice.pendingPlayerIds = state.hedongDiscardChoice.pendingPlayerIds.filter((playerId) => playerId !== player.id);
  }
  return key;
}

function currentHedongDiscardBuildChoicePlayer() {
  if (state.phase !== "hedong-discard-choice") return null;
  if (state.mode === "online") {
    const localPlayer = state.players.find((player) => player.id === getLocalPlayerId());
    return localPlayer?.pendingHedongDiscardBuildChoice ? localPlayer : null;
  }
  return pendingHedongDiscardBuildChoicePlayers().find((player) => !isAI(player)) || null;
}

function canLocalPlayerChooseHedongDiscardBuild(player = currentHedongDiscardBuildChoicePlayer()) {
  if (!player || !player.pendingHedongDiscardBuildChoice || isAI(player)) return false;
  if (state.mode === "online") return player.id === getLocalPlayerId();
  return true;
}

function scoreDiscardPileCardForAI(player, card) {
  let score = Number(card.points || 0) * 4 + Number(card.resolvedPoints || 0) * 3 + Number(card.coins || 0) * 1.4;
  if (card.color === "purple") score += 18;
  if (card.color === "blue") score += 12 + Number(card.points || 0) * 2;
  if (card.color === "brown" || card.color === "gray") {
    const resources = getPlayerResources(player);
    const produced = Array.isArray(card.produces) ? card.produces : Object.keys(card.resource || {});
    score += 10 + produced.filter((resource) => !resources[resource]).length * 8;
  }
  if (card.color === "red") score += Number(card.shields || 0) * 7;
  if (card.color === "green") score += 10;
  if (card.color === "yellow") score += 8;
  return score;
}

function chooseBestDiscardPileCardForAI(player) {
  return normalizeDiscardPile(state.discardPile || [])
    .filter((card) => canBuildCardFromDiscardPile(player, card).ok)
    .sort((a, b) => scoreDiscardPileCardForAI(player, b) - scoreDiscardPileCardForAI(player, a))[0] || null;
}

function resolveHedongDiscardBuildChoicesForAI() {
  for (const player of pendingHedongDiscardBuildChoicePlayers().filter((item) => isAI(item))) {
    resolveHedongDiscardBuildChoiceForAI(player);
  }
}

function startHedongDiscardBuildChoicePhase(shouldRender = true) {
  resolveHedongDiscardBuildChoicesForAI();
  const pendingPlayers = pendingHedongDiscardBuildChoicePlayers();
  if (!pendingPlayers.length) return false;
  const discardPile = normalizeDiscardPile(state.discardPile || []);
  if (!discardPile.length) {
    for (const player of pendingPlayers) {
      finalizeHedongDiscardBuildChoice(player, "", { emptyPile: true });
    }
    return false;
  }
  state.phase = "hedong-discard-choice";
  state.selected = {};
  state.pendingChoice = {};
  state.hedongDiscardChoice = {
    age: state.age,
    turn: state.turn,
    pendingPlayerIds: pendingPlayers.map((player) => player.id),
    openedRoundKeys: {}
  };
  if (state.mode !== "online") {
    const nextHuman = pendingPlayers.find((player) => !isAI(player)) || pendingPlayers[0];
    state.seatCursor = Math.max(0, state.players.findIndex((player) => player.id === nextHuman.id));
  }
  if (shouldRender) {
    showView("game");
    renderGame();
  }
  return true;
}

function finalizeHedongDiscardBuildChoice(player, cardId = "", options = {}) {
  if (!player || !player.pendingHedongDiscardBuildChoice) return null;
  let result = null;
  if (cardId) {
    result = buildCardFromDiscardPile(player, cardId, {
      sourceName: "盐铁官营",
      render: false,
      skipSync: true,
      silentLog: true
    });
    if (!result?.ok) return result;
    log(`河东从弃牌堆取回《${result.card.name}》。`);
  } else if (options.emptyPile) {
    log("弃牌堆为空，河东奖励未触发。");
  } else {
    log(`河东技能：${player.name}的盐铁官营没有可建造的弃牌，跳过。`);
  }
  delete player.pendingHedongDiscardBuildChoice;
  markHedongDiscardBuildChoiceResolved(player);
  return result || { ok: true, skipped: true };
}

function resolveHedongDiscardBuildChoiceForAI(player) {
  const choice = chooseBestDiscardPileCardForAI(player);
  if (!choice) return finalizeHedongDiscardBuildChoice(player, "");
  return finalizeHedongDiscardBuildChoice(player, choice.id);
}

function continueAfterHedongDiscardBuildChoices(shouldRender = true) {
  resolveHedongDiscardBuildChoicesForAI();
  const pendingPlayers = pendingHedongDiscardBuildChoicePlayers();
  if (pendingPlayers.length) {
    const nextPlayer = pendingPlayers.find((player) => !isAI(player)) || pendingPlayers[0];
    state.seatCursor = Math.max(0, state.players.findIndex((player) => player.id === nextPlayer.id));
    if (shouldRender) renderGame();
    return;
  }
  state.hedongDiscardChoice = null;
  state.discardPilePicker = null;
  state.phase = "game";
  if (startOverseasTradeChoicePhase(shouldRender)) return;
  if (state.turn >= 6) {
    if (startSeventhCardStage(shouldRender)) return;
    finishAgeAfterLastCard(shouldRender);
    return;
  }
  passHands();
  state.turn += 1;
  state.seatCursor = nextUnselectedSeat(0);
  if (shouldRender) renderGame();
}

async function syncHedongDiscardBuildChoice(player) {
  if (state.mode !== "online" || !state.online.roomRef || !player) return;
  const now = Date.now();
  await firebaseUpdate(state.online.roomRef, {
    [`players/${player.id}/built`]: player.built,
    [`players/${player.id}/builtCards`]: player.built,
    [`players/${player.id}/coins`]: player.coins,
    [`players/${player.id}/pendingHedongDiscardBuildChoice`]: null,
    [`game/players/${player.id}/built`]: player.built,
    [`game/players/${player.id}/builtCards`]: player.built,
    [`game/players/${player.id}/coins`]: player.coins,
    [`game/players/${player.id}/pendingHedongDiscardBuildChoice`]: null,
    hedongDiscardChoice: state.hedongDiscardChoice,
    "game/hedongDiscardChoice": state.hedongDiscardChoice,
    resolvedSpecialEffects: state.resolvedSpecialEffects,
    "game/resolvedSpecialEffects": state.resolvedSpecialEffects,
    discardPile: state.discardPile,
    "game/discardPile": state.discardPile,
    log: state.logs,
    "game/logs": state.logs,
    ...roomLeasePayload(now)
  });
}

async function confirmHedongDiscardBuildChoice(cardId = "") {
  const player = currentHedongDiscardBuildChoicePlayer();
  if (!player || !canLocalPlayerChooseHedongDiscardBuild(player)) return;
  const result = finalizeHedongDiscardBuildChoice(player, cardId);
  if (!result?.ok) {
    renderGame();
    return;
  }
  closeDiscardPileDialog();
  if (state.mode === "online") {
    await syncHedongDiscardBuildChoice(player);
    if (state.online.isHost) await maybeResolveOnlineHedongDiscardBuildChoicePhase();
    else renderGame();
    return;
  }
  continueAfterHedongDiscardBuildChoices(true);
}

async function maybeResolveOnlineHedongDiscardBuildChoicePhase() {
  if (state.mode !== "online" || !state.online.isHost || state.online.resolving || state.phase !== "hedong-discard-choice") return;
  state.online.resolving = true;
  try {
    resolveHedongDiscardBuildChoicesForAI();
    const unresolved = pendingHedongDiscardBuildChoicePlayers();
    if (unresolved.length) {
      await syncRoom("hedong-discard-choice");
      renderCurrentOnlinePhase();
      return;
    }
    continueAfterHedongDiscardBuildChoices(false);
    await syncRoom(state.phase);
    renderCurrentOnlinePhase();
  } catch (error) {
    showOnlineError(error);
  } finally {
    state.online.resolving = false;
  }
}

function pendingOverseasTradeChoicePlayers() {
  return state.players.filter((player) => player.pendingOverseasTradeChoice && getLingnanTradeCandidates(player).length > 0);
}

function currentOverseasTradeChoicePlayer() {
  if (state.mode === "online") {
    const localPlayerId = localStorage.getItem("playerId") || localStorage.getItem("jiuzhou.playerId") || state.online.localPlayerId;
    return pendingOverseasTradeChoicePlayers().find((player) => player.id === localPlayerId) || null;
  }
  return pendingOverseasTradeChoicePlayers()[0] || null;
}

function chooseLingnanTradePartnerForAI(player) {
  const candidates = getLingnanTradeCandidates(player);
  if (!candidates.length) return "";
  const owned = getPlayerResources(player);
  const scoreCandidate = (candidate) => {
    const resources = getPlayerResources(candidate);
    const uniqueHelp = RESOURCE_NAMES.reduce((total, resource) => total + ((owned[resource] || 0) ? 0 : Math.min(1, resources[resource] || 0)), 0);
    const totalSupply = Object.values(resources).reduce((total, amount) => total + (amount || 0), 0);
    return uniqueHelp * 10 + totalSupply;
  };
  return candidates
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate) }))
    .sort((a, b) => b.score - a.score)[0]?.candidate?.id || candidates[0].id;
}

function setLingnanOverseasTradePartner(player, partnerId) {
  const partner = getLingnanTradeCandidates(player).find((item) => item.id === partnerId);
  if (!player || !partner) return false;
  player.overseasTradePartnerId = partner.id;
  delete player.pendingOverseasTradeChoice;
  log(`岭南开通海上贸易通道，与【${partner.name}】建立贸易关系。`);
  return true;
}

function resolveOverseasTradeChoicesForAI() {
  let resolved = false;
  for (const player of state.players.filter((item) => item.pendingOverseasTradeChoice && isAI(item))) {
    const partnerId = chooseLingnanTradePartnerForAI(player);
    if (partnerId) {
      resolved = setLingnanOverseasTradePartner(player, partnerId) || resolved;
    } else {
      delete player.pendingOverseasTradeChoice;
      log(`岭南海上贸易：${player.name}没有合法贸易对象，跳过。`);
      resolved = true;
    }
  }
  for (const player of state.players.filter((item) => item.pendingOverseasTradeChoice && !getLingnanTradeCandidates(item).length)) {
    delete player.pendingOverseasTradeChoice;
    log(`岭南海上贸易：${player.name}没有合法贸易对象，跳过。`);
    resolved = true;
  }
  return resolved;
}

function startOverseasTradeChoicePhase(shouldRender = true) {
  resolveOverseasTradeChoicesForAI();
  const pendingPlayers = pendingOverseasTradeChoicePlayers();
  if (!pendingPlayers.length) return false;
  state.phase = "overseas-trade-choice";
  state.overseasTradeChoice = {
    age: state.age,
    turn: state.turn,
    pendingPlayerIds: pendingPlayers.map((player) => player.id),
    selectedPartnerId: ""
  };
  state.seatCursor = Math.max(0, state.players.findIndex((player) => player.id === pendingPlayers[0].id));
  if (shouldRender) renderGame();
  return true;
}

function finalizeOverseasTradeChoicePhase(shouldRender = true) {
  state.players.forEach((player) => {
    delete player.pendingOverseasTradeChoice;
  });
  state.overseasTradeChoice = null;
  state.phase = "game";
  if (state.turn >= 6) {
    if (startSeventhCardStage(shouldRender)) return;
    finishAgeAfterLastCard(shouldRender);
    return;
  }
  passHands();
  state.turn += 1;
  state.seatCursor = nextUnselectedSeat(0);
  if (shouldRender) renderGame();
}

function canUseHeluoSeventhCard(player) {
  return player?.board?.id === "heluo"
    && hasBuiltStageEffect(player, "useSeventhCard")
    && player.hand.length === 1;
}

function startSeventhCardStage(shouldRender = true) {
  const eligiblePlayers = state.players.filter((player) => canUseHeluoSeventhCard(player));
  if (!eligiblePlayers.length) return false;
  const eligibleIds = eligiblePlayers.map((player) => player.id);
  for (const player of state.players) {
    if (!eligibleIds.includes(player.id) && player.hand.length === 1) {
      const [discardedCard] = player.hand.splice(0, 1);
      addToDiscardPile(discardedCard, player, "ageEnd");
    }
  }
  state.phase = "seventh-card";
  state.selected = {};
  state.pendingChoice = {};
  state.seventhCardPlayers = eligibleIds;
  state.seventhCard = {
    age: state.age,
    pendingPlayerIds: [...eligibleIds],
    resolvedPlayerIds: [],
    choices: {},
    processed: false
  };
  state.seatCursor = state.players.findIndex((player) => player.id === state.seventhCardPlayers[0]);
  log(`河洛第二阶段生效：${eligiblePlayers.map((player) => player.name).join("、")}可以使用本时代最后一张牌。`);
  if (shouldRender) renderGame();
  return true;
}

function finishAgeAfterLastCard(shouldRender = true, usedPlayers = []) {
  discardLastCards(usedPlayers);
  state.seventhCard = null;
  state.seventhCardPlayers = [];
  state.players.forEach((player) => {
    delete player.confirmedAction;
    delete player.pendingAction;
  });
  const { guanzhongResults, liaodongResults } = resolveMilitary();
  prepareLiaodongResourceChoices(liaodongResults);
  if (state.age < 3 && startGuanzhongResourceChoicePhase(guanzhongResults, shouldRender)) return;
  if (state.age < 3 && startLiaodongResourceChoicePhase(shouldRender)) return;
  advanceAfterMilitaryResolution(shouldRender);
}

function resolveSeventhCardTurn(shouldRender = true) {
  const pendingPlayerIds = state.seventhCard?.pendingPlayerIds || state.seventhCardPlayers;
  assertResolvableSelections(pendingPlayerIds);
  const usedDescriptions = [];
  for (const playerId of pendingPlayerIds) {
    const player = state.players.find((item) => item.id === playerId);
    const choice = state.selected[playerId];
    if (!player || !choice) continue;
    const cardIndex = player.hand.findIndex((card) => card.id === choice.cardId);
    if (cardIndex < 0) continue;
    const [card] = player.hand.splice(cardIndex, 1);
    applyConfirmedAction(player, card, choice);
    usedDescriptions.push(`${player.name}${{ build: "建造", sell: "卖掉", wonder: "建设区域板" }[choice.action]}《${card.name}》`);
  }
  if (usedDescriptions.length) {
    log(`河洛第七张牌：${usedDescriptions.join("；")}。`);
  }
  state.seventhCard = null;
  state.selected = {};
  state.pendingChoice = {};
  finishAgeAfterLastCard(shouldRender, pendingPlayerIds.slice());
}

function assertResolvableSelections(playerIds = []) {
  for (const playerId of playerIds) {
    const player = state.players.find((item) => item.id === playerId);
    const choice = state.selected[playerId];
    if (!player || !choice) {
      throw new Error(`联机同步异常：${player?.name || playerId || "玩家"} 的已确认行动缺失。`);
    }
    const cardIndex = normalizeHand(player.hand).findIndex((card) => card.id === choice.cardId);
    if (cardIndex < 0) {
      throw new Error(`联机同步异常：${player.name} 选择的卡牌已不在当前手牌中，已阻止错误结算。`);
    }
  }
}

function resolveTurn(shouldRender = true) {
  assertResolvableSelections(state.players.map((player) => player.id));
  for (const player of state.players) {
    const choice = state.selected[player.id];
    const cardIndex = player.hand.findIndex((card) => card.id === choice.cardId);
    const [card] = player.hand.splice(cardIndex, 1);
    applyConfirmedAction(player, card, choice);
  }

  const actions = state.players.map((player) => {
    const choice = state.selected[player.id];
    const verbs = { build: "建造", sell: "卖掉", wonder: "建设区域板" };
    return `${player.name}${verbs[choice.action]}《${findCardName(choice.cardId)}》`;
  });
  log(actions.join("；"));

  state.selected = {};
  state.pendingChoice = {};
  state.players.forEach((player) => {
    delete player.confirmedAction;
    delete player.pendingAction;
  });
  if (startHedongDiscardBuildChoicePhase(shouldRender)) {
    saveHotseatGame();
    return;
  }
  if (startOverseasTradeChoicePhase(shouldRender)) {
    saveHotseatGame();
    return;
  }
  if (state.turn >= 6) {
    if (startSeventhCardStage(shouldRender)) {
      saveHotseatGame();
      return;
    }
    finishAgeAfterLastCard(shouldRender);
    saveHotseatGame();
    return;
  }

  passHands();
  state.turn += 1;
  state.seatCursor = nextUnselectedSeat(0);
  if (shouldRender) renderGame();
  saveHotseatGame();
}

function findCardName(cardId) {
  for (const age of Object.values(state.cards.ages)) {
    const card = age.find((item) => item.id === cardId);
    if (card) return card.name;
  }
  return "卡牌";
}

function sellCoinValue(player) {
  return player?.board?.id === "hedong" ? 5 : 3;
}

function getHedongSoldCardBonus(player) {
  if (player?.board?.id !== "hedong") return 0;
  return Math.min(6, Math.floor(Number(player.soldCardCount || 0) / 2));
}

function getLiaodongPerfectDefenseBonus(player) {
  if (player?.board?.id !== "liaodong") return 0;
  return [1, 2, 3].every((age) => player.liaodongNoDefeatAges?.[String(age)]) ? 6 : 0;
}

function executeAction(player, card, choice) {
  if (choice.action === "sell") {
    const coins = sellCoinValue(player);
    grantCoins(player, coins, {
      type: "gain",
      sourceType: "card",
      sourceName: "卖牌",
      coins,
      description: `卖掉《${card.name}》，获得 ${coins} 铜钱`
    }, { allowBashuBonus: true });
    player.soldCardCount = Number(player.soldCardCount || 0) + 1;
    addToDiscardPile(card, player, "sell");
    if (player.board?.id === "hedong") {
      log(`河东技能：${player.name}卖掉《${card.name}》，获得${coins}铜钱，该牌进入弃牌堆。`);
    } else {
      log(`${player.name}卖掉《${card.name}》，获得${coins}铜钱，该牌进入弃牌堆。`);
    }
    return;
  }

  pay(player, choice.payment);
  if (choice.action === "wonder") {
    const stage = player.board.stages[player.stagesBuilt];
    player.tucked.push({ card, stageName: stage.name });
    const stageEffectSource = {
      ...stage.effects,
      sourceType: "wonderStage",
      sourceName: stage.name,
      description: `${stage.name}获得铜钱`
    };
    const isBashuTradeStage = player.board.id === "bashu" && stage.effects?.effect === "extraCoinsFirstGainEachTurn";
    if (isBashuTradeStage) {
      applyEffects(player, stageEffectSource, { allowBashuBonus: false, suppressBashuBonus: true });
      player.stagesBuilt += 1;
      log("巴蜀建成蜀道商旅，获得 6 铜钱，并解锁商旅收益。");
    } else {
      player.stagesBuilt += 1;
      applyEffects(player, stageEffectSource, { allowBashuBonus: true });
    }
    if (shouldOpenLingnanOverseasTrade(player, stage)) {
      player.pendingOverseasTradeChoice = true;
    }
    if (player.board.id === "jiangnan") {
      grantCoins(player, 2, {
        type: "gain",
        sourceType: "wonder",
        sourceName: "江南区域特质",
        coins: 2,
        description: "建设区域获得 +2 铜钱"
      });
    }
    if (stage.effects?.effect === "freeFirstCardEachAge") {
      const usage = getFreeFirstCardUsage(player);
      if (builtCardCountForAge(player, state.age) > 0) usage[String(state.age)] = true;
    }
    if (stage.effects?.effect === "peekIncomingHandThisAge") {
      player.peekIncomingHandAge = state.age;
      log(`${player.name}建成楚巫占策，本时代剩余时间内可查看来牌上家的当前手牌。`);
    }
    if (stage.effects?.effect === "buildFromDiscardPile") {
      player.pendingHedongDiscardBuildChoice = true;
      log(`${player.name}建成盐铁官营，可以从公开弃牌堆中选择 1 张牌免费建造。`);
    }
    return;
  }

  if (choice.buildDiscountUsed) consumeBuildDiscount(player, choice.buildDiscountUsed);
  const builtCard = ensureResolvedEffectFields(clone(card));
  builtCard.builtAge = state.age;
  player.built.push(builtCard);
  if (choice.freeFirstCardEachAgeUsed) {
    const usage = getFreeFirstCardUsage(player);
    usage[String(state.age)] = true;
  }
  resolveBuiltCardSettlement(player, builtCard);
  if (player.board.id === "lingnan" && builtCard.color === "yellow") {
    grantCoins(player, 2, {
      type: "gain",
      sourceType: "board",
      sourceName: "岭南海贸",
      coins: 2,
      description: "岭南海贸：建造黄牌，获得 2 铜钱。"
    });
    log("岭南海贸：建造黄牌，获得 2 铜钱。");
  }
}

function applyConfirmedAction(player, card, action) {
  executeAction(player, card, action);
}

function ensurePlayerLogCollections(player) {
  const legacyCoinLogs = Array.isArray(player.coinLogs) ? player.coinLogs : [];
  const ledger = Array.isArray(player.coinLedger) ? player.coinLedger : [];
  player.coinLedger = ledger.length ? ledger : [...legacyCoinLogs];
  player.coinLogs = player.coinLedger;
  if (!Array.isArray(player.specialScoreLogs)) player.specialScoreLogs = [];
  ensureExtraCoinsFirstGainUsage(player);
}

function addCoinLog(player, entry) {
  if (!player || !entry?.coins) return;
  ensurePlayerLogCollections(player);
  player.coinLedger.push({
    type: entry.type || "gain",
    amount: entry.coins,
    sourceType: entry.sourceType || "wonder",
    sourceName: entry.sourceName || "未知来源",
    description: entry.description || `${entry.type === "spend" ? "花费" : "获得"} ${entry.coins} 铜钱`,
    age: entry.age ?? state.age ?? null,
    turn: entry.turn ?? state.turn ?? null
  });
}

function addSpecialScoreLog(player, entry) {
  if (!player || !entry?.points) return;
  ensurePlayerLogCollections(player);
  player.specialScoreLogs.push({
    sourceType: entry.sourceType || "wonder",
    sourceName: entry.sourceName || "未知来源",
    points: entry.points,
    description: entry.description || `额外 +${entry.points} 分`
  });
}

function pay(player, payment) {
  if (!payment) return;
  const purchaseDetails = Array.isArray(payment.purchaseDetails) ? payment.purchaseDetails : [];
  player.coins -= payment.total;
  if (payment.total > 0) {
    const spendDetails = [];
    if (payment.coinCost > 0) spendDetails.push(`支付建造成本 ${payment.coinCost} 铜钱`);
    for (const purchase of purchaseDetails) {
      const amount = purchase.amount || 1;
      spendDetails.push(`向${tradeSideLabel(purchase.side)}购买 ${purchase.resource}×${amount}，花费 ${purchase.totalCost} 铜钱`);
    }
    if (payment.tradeCost > 0 && !purchaseDetails.length) {
      spendDetails.push(`购买资源，花费 ${payment.tradeCost} 铜钱`);
    }
    addCoinLog(player, {
      type: "spend",
      sourceType: payment.tradeCost > 0 ? "trade" : "system",
      sourceName: payment.tradeCost > 0 ? "购买资源" : "支付成本",
      coins: payment.total,
      description: spendDetails.join("；")
    });
  }
  if (purchaseDetails.length) {
    for (const purchase of purchaseDetails) {
      const neighbor = state.players.find((item) => item.id === purchase.fromPlayerId) || getTradeNeighbor(player, purchase.side);
      if (!neighbor) continue;
      neighbor.coins += purchase.totalCost;
      addCoinLog(neighbor, {
        type: "gain",
        sourceType: "trade",
        sourceName: "出售资源",
        coins: purchase.totalCost,
        description: `${player.name} 购买你的 ${purchase.resource}×${purchase.amount || 1}，你获得 ${purchase.totalCost} 铜钱`
      });
    }
    return;
  }
  for (const side of Object.keys(payment.purchases || {})) {
    const neighbor = getTradeNeighbor(player, side);
    const income = neighborPurchaseTotal(player, payment, side);
    if (neighbor && income > 0) {
      neighbor.coins += income;
      addCoinLog(neighbor, {
        type: "gain",
        sourceType: "trade",
        sourceName: "出售资源",
        coins: income,
        description: `${player.name} 购买你的资源，你获得 ${income} 铜钱`
      });
    }
  }
}

function ensureResolvedEffectFields(card) {
  if (!card) return card;
  if (card.effectResolved === undefined) card.effectResolved = false;
  if (card.resolvedCoins === undefined) card.resolvedCoins = 0;
  if (card.resolvedPoints === undefined) card.resolvedPoints = 0;
  if (card.resolvedReason === undefined) card.resolvedReason = "";
  if (card.scoringType === undefined) {
    if (card.guildScore || card.commerceScore) card.scoringType = "final";
    else if (card.tradeDiscount || card.tradeRebate || card.oneTimeBuildDiscount) card.scoringType = "ongoing";
    else if (card.coins > 0 || card.points > 0 || card.perColorCoins || card.perNeighborColorCoins || card.perResourceCoins || card.perWonderStageCoins) card.scoringType = "instant";
    else card.scoringType = null;
  }
  if (card.effectType === undefined) {
    if (card.tradeDiscount || card.tradeRebate || card.oneTimeBuildDiscount) card.effectType = "discount";
    else if (card.coins > 0 || card.perColorCoins || card.perNeighborColorCoins || card.perResourceCoins || card.perWonderStageCoins) card.effectType = "instantCoins";
    else if (card.points > 0) card.effectType = "instantPoints";
    else if (card.guildScore || card.commerceScore) card.effectType = "finalScore";
    else card.effectType = null;
  }
  return card;
}

function describeResolvedReason(player, card) {
  if (!card) return "";
  if (card.perNeighborColorCoins) {
    const [color, amount] = Object.entries(card.perNeighborColorCoins)[0] || [];
    const count = countSelfAndNeighborColor(player, color);
    return `自己和左右邻${shortColorLabel(color)}共 ${count} 张，按每张 ${amount} 铜钱结算。`;
  }
  if (card.perColorCoins) {
    const [color, amount] = Object.entries(card.perColorCoins)[0] || [];
    const count = countColor(player, color);
    return `自己当前${shortColorLabel(color)} ${count} 张，按每张 ${amount} 铜钱结算。`;
  }
  if (card.perResourceCoins) {
    const [resource, amount] = Object.entries(card.perResourceCoins)[0] || [];
    const count = summarizePlayerResources(player)[resource] || 0;
    return `自己当前${resource}资源 ${count} 个，按每个 ${amount} 铜钱结算。`;
  }
  if (card.perWonderStageCoins) {
    return `自己当前已建区域板 ${player.stagesBuilt || 0} 段，按每段 ${card.perWonderStageCoins} 铜钱结算。`;
  }
  if (card.coins > 0) return "建成时直接获得铜钱。";
  if (card.points > 0) return "建成后立即记录该牌固定分值。";
  return "";
}

function resolveBuiltCardSettlement(player, builtCard) {
  ensureResolvedEffectFields(builtCard);
  const beforeCoins = player.coins;
  applyEffects(player, builtCard, { allowBashuBonus: true });
  builtCard.resolvedCoins = Math.max(0, player.coins - beforeCoins);
  const fixedPoints = Number(builtCard.points || 0);
  builtCard.resolvedPoints = builtCard.scoringType === "instant" && fixedPoints > 0 ? fixedPoints : 0;
  builtCard.effectResolved = builtCard.resolvedCoins > 0
    || builtCard.resolvedPoints > 0
    || builtCard.effectType === "discount";
  builtCard.resolvedReason = describeResolvedReason(player, builtCard);
}

function neighborPurchaseTotal(player, payment, side) {
  let total = 0;
  for (const [resource, count] of Object.entries(payment.purchases?.[side] || {})) {
    total += count * tradePrice(player, side, resource);
  }
  return total;
}

function applyEffects(player, effectSource, options = {}) {
  const { allowBashuBonus = false, suppressBashuBonus = false } = options;
  const effects = effectSource.effects || effectSource;
  if (effects.coins) {
    grantCoins(player, effects.coins, {
      sourceType: effectSource.sourceType || "effect",
      sourceName: effectSource.sourceName || effectSource.name || "效果奖励",
      coins: effects.coins,
      description: effectSource.description || `${effectSource.sourceName || effectSource.name || "效果奖励"}：获得 +${effects.coins} 铜钱`
    }, { allowBashuBonus, suppressBashuBonus });
  }
  if (effects.perColorCoins) {
    for (const [color, amount] of Object.entries(effects.perColorCoins)) {
      const coins = countColor(player, color) * amount;
      if (coins > 0) {
        grantCoins(player, coins, {
          sourceType: effectSource.sourceType || "effect",
          sourceName: effectSource.sourceName || effectSource.name || "效果奖励",
          coins,
          description: `${effectSource.sourceName || effectSource.name || "效果奖励"}：按${shortColorLabel(color)}结算 +${coins} 铜钱`
        }, { allowBashuBonus, suppressBashuBonus });
      }
    }
  }
  if (effects.perNeighborColorCoins) {
    for (const [color, amount] of Object.entries(effects.perNeighborColorCoins)) {
      const coins = countSelfAndNeighborColor(player, color) * amount;
      if (coins > 0) {
        grantCoins(player, coins, {
          sourceType: effectSource.sourceType || "effect",
          sourceName: effectSource.sourceName || effectSource.name || "效果奖励",
          coins,
          description: `${effectSource.sourceName || effectSource.name || "效果奖励"}：按自己和左右邻${shortColorLabel(color)}结算 +${coins} 铜钱`
        }, { allowBashuBonus, suppressBashuBonus });
      }
    }
  }
  if (effects.perResourceCoins) {
    const resources = summarizePlayerResources(player);
    for (const [resource, amount] of Object.entries(effects.perResourceCoins)) {
      const coins = (resources[resource] || 0) * amount;
      if (coins > 0) {
        grantCoins(player, coins, {
          sourceType: effectSource.sourceType || "effect",
          sourceName: effectSource.sourceName || effectSource.name || "效果奖励",
          coins,
          description: `${effectSource.sourceName || effectSource.name || "效果奖励"}：按${resource}结算 +${coins} 铜钱`
        }, { allowBashuBonus, suppressBashuBonus });
      }
    }
  }
  if (effects.perWonderStageCoins) {
    const coins = (player.stagesBuilt || 0) * effects.perWonderStageCoins;
    if (coins > 0) {
      grantCoins(player, coins, {
        sourceType: effectSource.sourceType || "effect",
        sourceName: effectSource.sourceName || effectSource.name || "效果奖励",
        coins,
        description: `${effectSource.sourceName || effectSource.name || "效果奖励"}：按已建区域板结算 +${coins} 铜钱`
      }, { allowBashuBonus, suppressBashuBonus });
    }
  }
  if (effects.oneTimeBuildDiscount) {
    getBuildDiscountPool(player).push({
      cardColor: effects.oneTimeBuildDiscount.cardColor,
      amount: effects.oneTimeBuildDiscount.amount || 1
    });
  }
}

function passHands() {
  const hands = state.players.map((player) => player.hand);
  const direction = AGE_CONFIG[state.age].direction;
  state.players.forEach((player, index) => {
    if (direction === "left") {
      player.hand = hands[(index + 1) % state.players.length];
    } else {
      player.hand = hands[(index - 1 + state.players.length) % state.players.length];
    }
  });
  log(`剩余手牌${direction === "left" ? "向左" : "向右"}传递。`);
}

function discardLastCards(usedPlayers = []) {
  let discardCount = 0;
  const discardedPlayers = [];
  state.players.forEach((player) => {
    const remainingCards = normalizeHand(player.hand);
    if (remainingCards.length) {
      discardedPlayers.push(player.name);
      remainingCards.forEach((card) => {
        if (addToDiscardPile(card, player, "ageEnd")) discardCount += 1;
      });
    }
    player.hand = [];
  });
  if (usedPlayers.length) {
    const usedNames = usedPlayers
      .map((playerId) => state.players.find((player) => player.id === playerId)?.name)
      .filter(Boolean);
    if (discardCount > 0) {
      log(`${discardAgeLabel(state.age)} 结束，最后手牌弃置，共有 ${discardCount} 张牌进入弃牌堆；${usedNames.join("、")}改为使用第七张牌。`);
      return;
    }
    log(`${discardAgeLabel(state.age)} 最后一张牌已由${usedNames.join("、")}改为使用。`);
    return;
  }
  log(`${discardAgeLabel(state.age)} 结束，最后手牌弃置，共有 ${discardCount} 张牌进入弃牌堆。`);
}

function resolveMilitary() {
  const winValue = AGE_CONFIG[state.age].militaryWin;
  const messages = [];
  const guanzhongResults = [];
  const liaodongResults = [];
  state.players.forEach((player) => {
    const leftNeighbor = getLeftNeighbor(player);
    const rightNeighbor = getRightNeighbor(player);
    const leftWin = beatsInMilitary(player, leftNeighbor);
    const rightWin = beatsInMilitary(player, rightNeighbor);
    const leftLoss = beatsInMilitary(leftNeighbor, player);
    const rightLoss = beatsInMilitary(rightNeighbor, player);
    for (const neighbor of [leftNeighbor, rightNeighbor]) {
      if (beatsInMilitary(player, neighbor)) {
        player.militaryTokens.push(winValue);
      } else if (beatsInMilitary(neighbor, player)) {
        player.militaryTokens.push(-1);
      }
    }
    const yanzhaoBonus = player.board.id === "yanzhao"
      ? (leftWin && rightWin ? { points: 3, coins: 3 } : (leftWin || rightWin ? { points: 1, coins: 1 } : { points: 0, coins: 0 }))
      : { points: 0, coins: 0 };
    if (yanzhaoBonus.coins > 0) {
      grantCoins(player, yanzhaoBonus.coins, {
        sourceType: "wonder",
        sourceName: "燕赵区域特质",
        coins: yanzhaoBonus.coins,
        description: `战争结算额外 +${yanzhaoBonus.coins} 铜钱`
      });
    }
    if (yanzhaoBonus.points > 0) {
      addSpecialScoreLog(player, {
        sourceType: "wonder",
        sourceName: "燕赵区域特质",
        points: yanzhaoBonus.points,
        description: `战争结算额外 +${yanzhaoBonus.points} 分`
      });
    }
    const guanzhongWins = player.board.id === "guanzhong" && state.age < 3
      ? Number(leftWin) + Number(rightWin)
      : 0;
    if (guanzhongWins > 0) {
      guanzhongResults.push({ playerId: player.id, winCount: guanzhongWins });
    }
    const guanzhongMessage = guanzhongWins > 0 ? `，关中技能待选择 ${guanzhongWins} 张基础资源牌` : "";
    let liaodongMessage = "";
    if (player.board.id === "liaodong") {
      ensureLiaodongState(player);
      const safeThisAge = !leftLoss && !rightLoss;
      player.liaodongNoDefeatAges[String(state.age)] = safeThisAge;
      liaodongResults.push({ playerId: player.id, safeThisAge });
      if (state.age < 3 && safeThisAge) {
        liaodongMessage = "，辽东屯垦待选择 1 张基础资源牌";
      }
    }
    const mobeiPlunders = [];
    if (player.board.id === "mobei") {
      if (leftWin) {
        const amount = applyMobeiPlunder(player, leftNeighbor);
        if (amount > 0) mobeiPlunders.push(`${leftNeighbor.name} ${amount}枚铜钱`);
      }
      if (rightWin) {
        const amount = applyMobeiPlunder(player, rightNeighbor);
        if (amount > 0) mobeiPlunders.push(`${rightNeighbor.name} ${amount}枚铜钱`);
      }
    }
    const mobeiMessage = mobeiPlunders.length ? `，漠北技能夺取 ${mobeiPlunders.join("、")}` : "";
    messages.push(`${player.name}军事 ${sum(player.militaryTokens)} 分${yanzhaoBonus.points > 0 || yanzhaoBonus.coins > 0 ? `，燕赵技能 +${yanzhaoBonus.points} 分、+${yanzhaoBonus.coins} 铜钱` : ""}${guanzhongMessage}${liaodongMessage}${mobeiMessage}`);
  });
  log(`${AGE_CONFIG[state.age].label} 军事结算：${messages.join("，")}。`);
  return { guanzhongResults, liaodongResults };
}

function getLeftNeighbor(player) {
  return leftNeighborOf(state.players, player);
}

function getRightNeighbor(player) {
  return rightNeighborOf(state.players, player);
}

function getMilitary(player) {
  return player.built.reduce((total, card) => total + (card.shields || card.military || 0), 0)
    + builtStages(player).reduce((total, stage) => total + (stage.effects?.military || 0), 0);
}

function getScience(player, options = {}) {
  const includeEndGameChoice = options.includeEndGameChoice !== false;
  const symbols = { "经学": 0, "工学": 0, "史学": 0 };
  const greenCards = getBuiltCards(player).filter((card) => card.color === "green" && card.scienceSymbol);
  for (const card of greenCards) {
    if (card.scienceSymbol === "任选") {
      for (const symbol of SCIENCE_NAMES) symbols[symbol] += 1;
    } else {
      symbols[card.scienceSymbol] = (symbols[card.scienceSymbol] || 0) + 1;
    }
  }
  for (const stage of builtStages(player)) {
    for (const [symbol, count] of Object.entries(stage.effects?.science || {})) {
      symbols[symbol] = (symbols[symbol] || 0) + count;
    }
  }
  const endGameScienceChoices = includeEndGameChoice ? getEndGameScienceChoices(player) : [];
  for (const endGameScienceChoice of endGameScienceChoices) {
    symbols[endGameScienceChoice] = (symbols[endGameScienceChoice] || 0) + 1;
  }
  console.log("[SCIENCE_COUNT] playerName", player.name);
  console.log("[SCIENCE_COUNT] green card names", greenCards.map((card) => card.name));
  console.log("[SCIENCE_COUNT] symbols", greenCards.map((card) => card.scienceSymbol));
  console.log("[SCIENCE_COUNT] result", symbols);
  return symbols;
}

function normalizeScienceChoice(choice) {
  return SCIENCE_NAMES.includes(choice) ? choice : null;
}

function normalizeScienceChoiceList(choices) {
  if (Array.isArray(choices)) return choices.map((choice) => normalizeScienceChoice(choice)).filter(Boolean);
  const single = normalizeScienceChoice(choices);
  return single ? [single] : [];
}

function getEndGameScienceChoices(player) {
  if (!player || typeof player !== "object") return [];
  const normalized = normalizeScienceChoiceList(player.endGameScienceChoices);
  if (normalized.length) return normalized;
  const legacy = normalizeScienceChoice(player.endGameScienceChoice);
  return legacy ? [legacy] : [];
}

function setEndGameScienceChoices(player, choices = []) {
  if (!player || typeof player !== "object") return [];
  const normalized = normalizeScienceChoiceList(choices);
  if (normalized.length) {
    player.endGameScienceChoices = [...normalized];
    player.endGameScienceChoice = normalized[0];
  } else {
    delete player.endGameScienceChoices;
    delete player.endGameScienceChoice;
  }
  return normalized;
}

function appendEndGameScienceChoice(player, choice) {
  const normalizedChoice = normalizeScienceChoice(choice);
  if (!normalizedChoice) return getEndGameScienceChoices(player);
  const choices = [...getEndGameScienceChoices(player), normalizedChoice];
  return setEndGameScienceChoices(player, choices);
}

function canLocalPlayerChooseOverseasTrade(player = currentOverseasTradeChoicePlayer()) {
  if (!player || !player.pendingOverseasTradeChoice || isAI(player)) return false;
  if (state.mode === "online") {
    const localPlayerId = localStorage.getItem("playerId") || localStorage.getItem("jiuzhou.playerId") || state.online.localPlayerId;
    return player.id === localPlayerId;
  }
  return true;
}

function overseasTradeDialogBody(player) {
  const candidates = getLingnanTradeCandidates(player);
  const selectedPartnerId = state.overseasTradeChoice?.selectedPartnerId || "";
  return `
    <div class="overseas-choice-toolbar">
      <div>
        <p class="eyebrow">岭南海上贸易</p>
        <h3>选择一名非左右邻国玩家</h3>
        <p class="hint">点击玩家卡片选中，再点击确认选择。</p>
      </div>
      <button id="confirmOverseasTradePartnerButton" class="primary overseas-choice-confirm" ${selectedPartnerId ? "" : "disabled"} onclick="confirmOverseasTradePartner()">确认选择</button>
    </div>
    <p><strong>当前玩家：${player.name}</strong></p>
    <div class="detail-list overseas-choice-grid">
      ${candidates.map((candidate) => `
        <button type="button" class="detail-item overseas-choice-card ${candidate.id === selectedPartnerId ? "is-selected" : ""}" onclick="chooseOverseasTradeCandidate('${candidate.id}')" aria-pressed="${candidate.id === selectedPartnerId ? "true" : "false"}">
          <p><strong>${candidate.name}</strong>（${candidate.board.name}）</p>
          <p>资源：${formatOverviewResourceSummary(candidate) || "无"}</p>
          ${candidate.id === selectedPartnerId ? '<span class="overseas-choice-badge">已选中</span>' : ""}
        </button>
      `).join("")}
    </div>
    <p class="hint">海上贸易只增加一个额外交易对象，不视为邻国，黄牌购买优惠对其无效。</p>
  `;
}

function renderOverseasTradeDialog(player) {
  if (!player) return;
  $("overseasTradeDialogTitle").textContent = "岭南海上贸易通道";
  $("overseasTradeDialogBody").innerHTML = overseasTradeDialogBody(player);
  document.body.classList.add("dialog-open");
  if (!$("overseasTradeDialog").open) $("overseasTradeDialog").showModal();
}

function chooseOverseasTradeCandidate(partnerId) {
  const player = currentOverseasTradeChoicePlayer();
  if (!player || !canLocalPlayerChooseOverseasTrade(player)) return;
  if (!getLingnanTradeCandidates(player).some((candidate) => candidate.id === partnerId)) return;
  if (!state.overseasTradeChoice || typeof state.overseasTradeChoice !== "object") {
    state.overseasTradeChoice = { age: state.age, turn: state.turn, pendingPlayerIds: [player.id] };
  }
  state.overseasTradeChoice.selectedPartnerId = partnerId;
  renderOverseasTradeDialog(player);
}

function confirmOverseasTradePartner() {
  const partnerId = state.overseasTradeChoice?.selectedPartnerId || "";
  if (!partnerId) return;
  void chooseOverseasTradePartner(partnerId);
}

async function chooseOverseasTradePartner(partnerId) {
  const player = currentOverseasTradeChoicePlayer();
  if (!player || !partnerId) return;
  if (!setLingnanOverseasTradePartner(player, partnerId)) return;
  if ($("overseasTradeDialog")?.open) $("overseasTradeDialog").close();
  if (state.mode === "online") {
    if (state.online.roomRef) {
      const now = Date.now();
      await firebaseUpdate(state.online.roomRef, {
        [`players/${player.id}/overseasTradePartnerId`]: player.overseasTradePartnerId,
        [`game/players/${player.id}/overseasTradePartnerId`]: player.overseasTradePartnerId,
        [`players/${player.id}/pendingOverseasTradeChoice`]: false,
        [`game/players/${player.id}/pendingOverseasTradeChoice`]: false,
        ...roomLeasePayload(now)
      });
    }
    if (state.online.isHost) {
      await maybeResolveOnlineOverseasTradeChoicePhase();
    } else {
      renderGame();
    }
    return;
  }
  finalizeOverseasTradeChoicePhase(true);
}

async function maybeResolveOnlineOverseasTradeChoicePhase() {
  if (state.mode !== "online" || !state.online.isHost || !state.online.roomRef) return;
  resolveOverseasTradeChoicesForAI();
  const unresolved = pendingOverseasTradeChoicePlayers();
  if (unresolved.length) {
    await syncRoom("overseas-trade-choice");
    renderCurrentOnlinePhase();
    return;
  }
  finalizeOverseasTradeChoicePhase(false);
  await syncRoom(state.phase);
  renderCurrentOnlinePhase();
}

function hasChooseScienceAtEndStage(player) {
  return hasBuiltStageEffect(player, "chooseScienceAtEnd")
    || getBuiltCards(player).some((card) => card.guildScore === "chooseScienceAtEnd");
}

function getChooseScienceAtEndCount(player) {
  if (!player) return 0;
  const stageCount = builtStages(player).filter((stage) => stage.effects?.effect === "chooseScienceAtEnd").length;
  const guildCount = getBuiltCards(player).filter((card) => card.guildScore === "chooseScienceAtEnd").length;
  return stageCount + guildCount;
}

function getChooseScienceAtEndSourceText(player) {
  if (!player) {
    return {
      promptTitle: "终局学术效果：请选择 1 个学术符号",
      promptDescription: "选择完成后将继续终局结算。",
      waitingTitle: "等待玩家选择终局学术符号。"
    };
  }
  const stageSources = builtStages(player)
    .filter((stage) => stage.effects?.effect === "chooseScienceAtEnd")
    .map((stage) => `${player.board?.name || "区域板"}的${stage.name}`);
  const guildSources = getBuiltCards(player)
    .filter((card) => card.guildScore === "chooseScienceAtEnd")
    .map((card) => card.displayName || card.name || "紫卡");
  const sources = [...stageSources, ...guildSources];
  if (!sources.length) {
    return {
      promptTitle: "终局学术效果：请选择 1 个学术符号",
      promptDescription: "选择完成后将继续终局结算。",
      waitingTitle: "等待玩家选择终局学术符号。"
    };
  }
  if (sources.length === 1) {
    return {
      promptTitle: `${sources[0]}：请选择 1 个学术符号`,
      promptDescription: "选择完成后将继续终局结算。",
      waitingTitle: `等待玩家结算${sources[0]}的终局学术选择。`
    };
  }
  return {
    promptTitle: "终局学术效果：请选择 1 个学术符号",
    promptDescription: `来源：${sources.join("、")}。选择完成后将继续终局结算。`,
    waitingTitle: "等待玩家结算终局学术选择。"
  };
}

function scienceScoreFromSymbols(symbols) {
  const squareScore = SCIENCE_NAMES.reduce((total, symbol) => total + (symbols[symbol] || 0) ** 2, 0);
  const sets = Math.min(...SCIENCE_NAMES.map((symbol) => symbols[symbol] || 0));
  return {
    squareScore,
    sets,
    setBonus: sets * 7
  };
}

function calculateScienceBreakdown(player) {
  const symbols = getScience(player);
  const { squareScore, sets, setBonus } = scienceScoreFromSymbols(symbols);
  const qiluBonus = player.board.id === "qilu" ? sets * 2 : 0;
  return {
    symbols,
    squareScore,
    sets,
    setBonus,
    baseScience: squareScore + setBonus,
    qiluBonus,
    totalScience: squareScore + setBonus + qiluBonus
  };
}

function chooseBestScienceSymbolForPlayer(player) {
  let bestSymbol = SCIENCE_NAMES[0];
  let bestScore = -Infinity;
  const baseSymbols = getScience(player);
  for (const symbol of SCIENCE_NAMES) {
    const previewSymbols = { ...baseSymbols, [symbol]: (baseSymbols[symbol] || 0) + 1 };
    const { squareScore, sets, setBonus } = scienceScoreFromSymbols(previewSymbols);
    const qiluBonus = player.board.id === "qilu" ? sets * 2 : 0;
    const totalScience = squareScore + setBonus + qiluBonus;
    if (totalScience > bestScore) {
      bestScore = totalScience;
      bestSymbol = symbol;
    }
  }
  return bestSymbol;
}

function needsEndGameScienceChoice(player) {
  return getChooseScienceAtEndCount(player) > getEndGameScienceChoices(player).length;
}

function prepareEndGameScienceChoices() {
  let autoResolved = false;
  const pendingPlayers = [];
  for (const player of state.players) {
    if (!hasChooseScienceAtEndStage(player)) {
      setEndGameScienceChoices(player, []);
      continue;
    }
    const remainingChoices = getChooseScienceAtEndCount(player) - getEndGameScienceChoices(player).length;
    if (remainingChoices <= 0) continue;
    if (isAI(player)) {
      for (let i = 0; i < remainingChoices; i += 1) {
        const choice = chooseBestScienceSymbolForPlayer(player);
        appendEndGameScienceChoice(player, choice);
        log(`${player.name}在终局学术选择中选择了${choice}。`);
        autoResolved = true;
      }
      continue;
    }
    pendingPlayers.push(player);
  }
  return { pendingPlayers, autoResolved };
}

function pendingScienceChoicePlayers() {
  return state.players.filter((player) => needsEndGameScienceChoice(player) && !isAI(player));
}

function currentScienceChoicePlayer() {
  if (state.phase !== "end-science-choice") return null;
  if (state.mode === "online") {
    const localPlayer = currentPlayer();
    if (needsEndGameScienceChoice(localPlayer)) return localPlayer;
    return pendingScienceChoicePlayers()[0] || null;
  }
  const pending = pendingScienceChoicePlayers();
  return pending[0] || null;
}

function canLocalPlayerChooseScience(player = currentScienceChoicePlayer()) {
  if (!player || !needsEndGameScienceChoice(player) || isAI(player)) return false;
  if (state.mode === "online") {
    const localPlayerId = localStorage.getItem("playerId") || localStorage.getItem("jiuzhou.playerId") || state.online.localPlayerId;
    return player.id === localPlayerId;
  }
  return true;
}

function scienceChoiceDialogBody(player) {
  const symbols = getScience(player, { includeEndGameChoice: false });
  const chosen = getEndGameScienceChoices(player);
  const total = getChooseScienceAtEndCount(player);
  return `
    <p><strong>当前玩家：${player.name}</strong></p>
    <p>你拥有终局学术选择效果。请选择 1 个学术符号加入终局学术计分。</p>
    <p>当前已选择 ${chosen.length}/${total} 次${chosen.length ? `：${chosen.map((choice) => formatIconLabel(choice)).join("、")}` : ""}</p>
    <p><strong>当前学术：</strong></p>
    <p>${formatIconLabel("经学", symbols["经学"] || 0)}</p>
    <p>${formatIconLabel("工学", symbols["工学"] || 0)}</p>
    <p>${formatIconLabel("史学", symbols["史学"] || 0)}</p>
    <p class="hint">该选择只用于终局学术计分，不会生成实际卡牌。</p>
  `;
}

function renderScienceChoiceDialog(player) {
  if (!player) return;
  state.scienceChoiceContext = { playerId: player.id };
  $("scienceChoiceDialogTitle").textContent = "终局学术选择：选择一个学术符号";
  $("scienceChoiceDialogBody").innerHTML = scienceChoiceDialogBody(player);
  for (const [id, symbol] of [
    ["scienceChoiceJingButton", "经学"],
    ["scienceChoiceGongButton", "工学"],
    ["scienceChoiceShiButton", "史学"]
  ]) {
    $(id).textContent = `选择${symbol}`;
    $(id).disabled = false;
  }
  if (!$("scienceChoiceDialog").open) $("scienceChoiceDialog").showModal();
}

function closeScienceChoiceDialog() {
  state.scienceChoiceContext = null;
  if ($("scienceChoiceDialog")?.open) $("scienceChoiceDialog").close();
}

async function syncEndGameScienceChoice(playerId, choice) {
  if (state.mode !== "online" || !state.online.roomRef) return;
  const player = state.players.find((item) => item.id === playerId);
  const choices = getEndGameScienceChoices(player);
  const now = Date.now();
  await firebaseUpdate(state.online.roomRef, {
    [`players/${playerId}/endGameScienceChoice`]: choices[0] || choice,
    [`players/${playerId}/endGameScienceChoices`]: choices,
    [`game/players/${playerId}/endGameScienceChoice`]: choices[0] || choice,
    [`game/players/${playerId}/endGameScienceChoices`]: choices,
    ...roomLeasePayload(now)
  });
}

async function maybeResolveOnlineScienceChoicePhase() {
  if (state.mode !== "online" || !state.online.isHost || state.online.resolving || state.phase !== "end-science-choice") return;
  state.online.resolving = true;
  try {
    const { pendingPlayers, autoResolved } = prepareEndGameScienceChoices();
    if (autoResolved) {
      await syncRoom("end-science-choice");
    }
    if (!pendingPlayers.length) {
      await syncRoom("score");
      clearLocalTurnStateAfterRoundAdvance();
      renderCurrentOnlinePhase();
      return;
    }
    renderCurrentOnlinePhase();
  } catch (error) {
    showOnlineError(error);
  } finally {
    state.online.resolving = false;
  }
}

function continueHotseatScienceChoiceFlow(shouldRender = true) {
  const pendingPlayers = pendingScienceChoicePlayers();
  if (!pendingPlayers.length) {
    state.phase = "score";
    closeScienceChoiceDialog();
    if (shouldRender) {
      renderScores();
      showView("score");
    }
    return;
  }
  const nextPlayer = pendingPlayers[0];
  state.seatCursor = Math.max(0, state.players.findIndex((player) => player.id === nextPlayer.id));
  if (shouldRender) {
    showView("game");
    renderGame();
  }
}

function startEndGameScienceChoicePhase(shouldRender = true) {
  const { pendingPlayers } = prepareEndGameScienceChoices();
  if (!pendingPlayers.length) {
    state.phase = "score";
    closeScienceChoiceDialog();
    if (shouldRender) {
      renderScores();
      showView("score");
    }
    return false;
  }
  state.phase = "end-science-choice";
  state.selected = {};
  state.pendingChoice = {};
  if (state.mode !== "online") {
    state.seatCursor = Math.max(0, state.players.findIndex((player) => player.id === pendingPlayers[0].id));
  }
  if (shouldRender) {
    showView("game");
    renderGame();
  }
  return true;
}

async function chooseScienceChoice(choice) {
  const normalizedChoice = normalizeScienceChoice(choice);
  const player = currentScienceChoicePlayer();
  if (!normalizedChoice || !player || !canLocalPlayerChooseScience(player)) return;
  appendEndGameScienceChoice(player, normalizedChoice);
  log(`${player.name}在终局学术选择中选择了${normalizedChoice}。`);
  closeScienceChoiceDialog();
  if (state.mode === "online") {
    await syncEndGameScienceChoice(player.id, normalizedChoice);
    renderGame();
    if (state.online.isHost) await maybeResolveOnlineScienceChoicePhase();
    return;
  }
  continueHotseatScienceChoiceFlow(true);
}

function scienceScore(player) {
  return calculateScienceBreakdown(player).baseScience;
}

function getScienceSetCount(player) {
  return calculateScienceBreakdown(player).sets;
}

function getQiluBonus(player) {
  return calculateScienceBreakdown(player).qiluBonus;
}

function hasHeluoBlueBonus(player) {
  return player?.board?.id === "heluo" && player.stagesBuilt >= 2;
}

function getHeluoBonus(player) {
  return hasHeluoBlueBonus(player) ? countColor(player, "blue") : 0;
}

function getJiangnanBonus(player) {
  return player.board.id === "jiangnan" ? player.stagesBuilt : 0;
}

function getJingchuColorBonus(player) {
  if (player?.board?.id !== "jingchu") return 0;
  const colors = new Set(
    getBuiltCards(player)
      .map((card) => card.color)
      .filter((color) => ["brown", "gray", "blue", "red", "yellow", "green", "purple"].includes(color))
  );
  return Math.min(7, colors.size);
}

function hasActiveJingchuPeek(player) {
  return Boolean(
    player?.board?.id === "jingchu"
    && player.peekIncomingHandAge === state.age
    && state.phase === "game"
    && state.turn > 1
  );
}

function getJingchuIncomingPlayer(player) {
  if (!player || !state.players.length) return null;
  const index = state.players.findIndex((item) => item.id === player.id);
  if (index < 0) return null;
  const direction = AGE_CONFIG[state.age]?.direction;
  if (direction === "left") return state.players[(index + 1) % state.players.length];
  return state.players[(index - 1 + state.players.length) % state.players.length];
}

function canLocalPlayerUseJingchuPeek(player) {
  if (!hasActiveJingchuPeek(player) || isAI(player)) return false;
  if (state.mode === "online") return player.id === getLocalPlayerId();
  return currentPlayer()?.id === player.id;
}

function renderJingchuPeekButton(player) {
  if (!canLocalPlayerUseJingchuPeek(player)) return "";
  const incoming = getJingchuIncomingPlayer(player);
  if (!incoming) return "";
  return `
    <button type="button" class="ghost jingchu-peek-button" onclick="openJingchuPeekDialog('${player.id}')">
      查看来牌上家手牌：${incoming.name}
    </button>
  `;
}

function calculateRadarRawScores(player, scoreBreakdown) {
  const builtCards = getBuiltCards(player);
  const resources = summarizePlayerResources(player);
  const totalResourceOutput = RESOURCE_NAMES.reduce((total, resource) => total + (resources[resource] || 0), 0);
  const resourceVariety = RESOURCE_NAMES.filter((resource) => (resources[resource] || 0) > 0).length;
  const advancedResourceOutput = ADVANCED_RESOURCES.reduce((total, resource) => total + (resources[resource] || 0), 0);
  const wildBasicResourceCount = getWildBasicResourceCount(player);
  const stages = builtStages(player);
  const blueCards = builtCards.filter((card) => card.color === "blue");
  const blueCardPoints = blueCards.reduce((total, card) => total + (card.points || 0), 0);
  const stageDirectPoints = stages.reduce((total, stage) => total + (stage.effects?.points || 0), 0);
  const redCards = builtCards.filter((card) => card.color === "red");
  const greenCards = builtCards.filter((card) => card.color === "green");
  const yellowCards = builtCards.filter((card) => card.color === "yellow");
  const purpleCards = builtCards.filter((card) => card.color === "purple");
  const yellowImmediateCoins = yellowCards.reduce((total, card) => total + Math.max(0, Number(card.resolvedCoins || 0)), 0);
  const tradeDiscountValue = yellowCards.filter((card) => card.tradeDiscount).length * 4;
  const oneTimeBuildDiscountValue = yellowCards.filter((card) => card.oneTimeBuildDiscount).length * 3;
  const normalCoinScore = Math.floor((player.coins || 0) / 3);
  const ageThreeHighPointPoints = builtCards
    .filter((card) => Number(card.builtAge) === 3 && Number(card.points || 0) >= 4)
    .reduce((total, card) => total + (card.points || 0), 0);
  const rawScores = {
    resource: totalResourceOutput * 2
      + resourceVariety * 3
      + advancedResourceOutput
      + wildBasicResourceCount * 4,
    civilization: blueCardPoints
      + blueCards.length
      + stages.length * 6
      + stageDirectPoints,
    military: sum(player.militaryTokens || [])
      + getMilitary(player) * 2
      + redCards.length,
    science: Number(scoreBreakdown?.baseScience || 0)
      + greenCards.length,
    commerce: yellowCards.length * 3
      + yellowImmediateCoins
      + tradeDiscountValue
      + oneTimeBuildDiscountValue
      + Number(scoreBreakdown?.commerceBase || 0)
      + (player.coins || 0)
      + normalCoinScore * 3,
    endgame: Number(scoreBreakdown?.guild || 0)
      + purpleCards.length * 3
      + ageThreeHighPointPoints
  };
  for (const key of Object.keys(rawScores)) {
    rawScores[key] = Math.max(0, rawScores[key]);
  }
  return rawScores;
}

function normalizeRadarScores(playersRawScores) {
  const normalized = {};
  for (const playerId of Object.keys(playersRawScores || {})) {
    normalized[playerId] = {};
  }
  for (const { key } of RADAR_DIMENSIONS) {
    const maxRaw = Math.max(0, ...Object.values(playersRawScores || {}).map((scores) => Number(scores?.[key] || 0)));
    for (const playerId of Object.keys(playersRawScores || {})) {
      const raw = Number(playersRawScores[playerId]?.[key] || 0);
      normalized[playerId][key] = maxRaw <= 0 ? 0 : Math.round((raw / maxRaw) * 100);
    }
  }
  return normalized;
}

function radarSummary(scores) {
  const ranked = RADAR_DIMENSIONS
    .map((dimension) => ({ ...dimension, value: Number(scores?.[dimension.key] || 0) }))
    .sort((a, b) => b.value - a.value);
  const top = ranked[0];
  const second = ranked[1];
  if (!top || top.value < 45 || (second && top.value - second.value <= 6 && top.value < 80)) {
    return "本局特征：发展较为均衡。";
  }
  const primaryTexts = {
    resource: "本局特征：资源后勤扎实，建设基础雄厚。",
    civilization: "本局特征：文明建设突出，城邑与区域发展完整。",
    military: "本局特征：武备压制明显，邻国压力较大。",
    science: "本局特征：学术路线突出，组合得分较高。",
    commerce: "本局特征：商贸经济活跃，铜钱积累与转化能力突出。",
    endgame: "本局特征：终局规划突出，公会与后期爆分能力较强。"
  };
  const secondaryTexts = {
    resource: "资源后勤表现也较强",
    civilization: "文明建设表现也较强",
    military: "武备威慑表现也较强",
    science: "学术文化表现也较强",
    commerce: "商贸经济表现也较强",
    endgame: "终局规划表现也较强"
  };
  if (second && top.value >= 80 && top.value - second.value <= 12) {
    return `${primaryTexts[top.key].replace("。", "")}，${secondaryTexts[second.key]}。`;
  }
  return primaryTexts[top.key] || "本局特征：发展较为均衡。";
}

function radarPointAt(index, value, center = 110, maxRadius = 78) {
  const angle = ((-90 + index * 60) * Math.PI) / 180;
  const radius = maxRadius * (Math.max(0, Math.min(100, Number(value) || 0)) / 100);
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius
  };
}

function renderCivilizationRadarChart(scores, options = {}) {
  const viewBoxSize = options.viewBoxSize || 340;
  const center = options.center || 170;
  const maxRadius = options.maxRadius || 90;
  const rings = [20, 40, 60, 80, 100];
  const ringPolygons = rings.map((ring) => {
    const points = RADAR_DIMENSIONS
      .map((_, index) => {
        const point = radarPointAt(index, ring, center, maxRadius);
        return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
      })
      .join(" ");
    return `<polygon class="radar-grid" points="${points}"></polygon>`;
  }).join("");
  const axes = RADAR_DIMENSIONS.map((dimension, index) => {
    const point = radarPointAt(index, 100, center, maxRadius);
    return `<line class="radar-axis" x1="${center}" y1="${center}" x2="${point.x.toFixed(1)}" y2="${point.y.toFixed(1)}"></line>`;
  }).join("");
  const radarPoints = RADAR_DIMENSIONS.map((dimension, index) => radarPointAt(index, scores?.[dimension.key] || 0, center, maxRadius));
  const areaPoints = radarPoints.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const pointDots = radarPoints.map((point) => `<circle class="radar-point" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.2"></circle>`).join("");
  const labels = RADAR_DIMENSIONS.map((dimension, index) => {
    const point = radarPointAt(index, 100, center, maxRadius + 42);
    const anchor = Math.abs(point.x - center) < 10 ? "middle" : point.x > center ? "start" : "end";
    const dy = Math.abs(point.y - center) < 10 ? (point.y > center ? 14 : -8) : 4;
    return `<text class="radar-label" x="${point.x.toFixed(1)}" y="${(point.y + dy).toFixed(1)}" text-anchor="${anchor}">${dimension.label}</text>`;
  }).join("");
  return `
    <svg class="radar-chart" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" role="img" aria-label="文明六维图">
      ${ringPolygons}
      ${axes}
      <polygon class="radar-area" points="${areaPoints}"></polygon>
      ${pointDots}
      ${labels}
    </svg>
  `;
}

function renderRadarValues(scores) {
  return RADAR_DIMENSIONS.map((dimension) => `
    <span>${dimension.label} ${Math.round(Number(scores?.[dimension.key] || 0))}</span>
  `).join("");
}

function countColor(player, color) {
  return player.built.filter((card) => card.color === color).length;
}

function countSelfAndNeighborColor(player, color) {
  return countColor(player, color)
    + countColor(getLeftNeighbor(player), color)
    + countColor(getRightNeighbor(player), color);
}

function sum(numbers) {
  return numbers.reduce((total, number) => total + number, 0);
}

function scorePlayer(player) {
  const cardPoints = player.built.reduce((total, card) => total + (card.points || 0), 0);
  const boardPoints = builtStages(player).reduce((total, stage) => {
    if (isLingnanStageOne(stage, player) && isThreePlayerGame()) return total + 5;
    return total + (stage.effects?.points || 0);
  }, 0);
  const military = sum(player.militaryTokens);
  const scienceBreakdown = calculateScienceBreakdown(player);
  const baseScience = scienceBreakdown.baseScience;
  const qiluBonus = scienceBreakdown.qiluBonus;
  const science = baseScience;
  const lingnanCommerceBonus = getLingnanBuiltYellowBonus(player);
  const commerceBase = player.built.filter((card) => card.type === "commercial").reduce((total, card) => total + commercialScore(player, card), 0);
  const commerce = commerceBase + lingnanCommerceBonus;
  const guildResolved = player.built.filter((card) => card.type === "guild").reduce((total, card) => total + (card.resolvedPoints || 0), 0);
  const guildFinal = player.built.filter((card) => card.type === "guild").reduce((total, card) => total + calculatePurpleScore(player, card), 0);
  const guild = guildResolved + guildFinal;
  const coinDivisor = player.board.id === "bashu" ? 2 : 3;
  const coins = Math.floor(player.coins / coinDivisor);
  const coinRule = player.board.id === "bashu" ? `巴蜀技能：每 2 ${formatIconText("铜钱")} = 1 分` : `规则：每 3 ${formatIconText("铜钱")} = 1 分`;
  const jiangnanBonus = getJiangnanBonus(player);
  const heluoBonus = getHeluoBonus(player);
  const jingchuBonus = getJingchuColorBonus(player);
  const hedongBonus = getHedongSoldCardBonus(player);
  const liaodongBonus = getLiaodongPerfectDefenseBonus(player);
  ensurePlayerLogCollections(player);
  const specialMap = new Map();
  const pushSpecialEntry = (sourceName, points) => {
    if (!points) return;
    specialMap.set(sourceName, (specialMap.get(sourceName) || 0) + points);
  };
  pushSpecialEntry("齐鲁区域特质", qiluBonus);
  pushSpecialEntry("江南区域特质", jiangnanBonus);
  pushSpecialEntry("河洛区域特质", heluoBonus);
  pushSpecialEntry("荆楚区域特质", jingchuBonus);
  pushSpecialEntry("河东区域特质", hedongBonus);
  pushSpecialEntry("辽东区域特质", liaodongBonus);
  for (const entry of player.specialScoreLogs) {
    if (entry?.points) pushSpecialEntry(entry.sourceName || "特殊奖励", entry.points);
  }
  const specialEntries = Array.from(specialMap.entries()).map(([sourceName, points]) => ({ sourceName, points }));
  const special = specialEntries.reduce((total, entry) => total + (entry.points || 0), 0);
  const total = cardPoints + boardPoints + military + science + commerce + guild + coins + special;
  const scienceChoices = getEndGameScienceChoices(player);
  return {
    cardPoints,
    boardPoints,
    military,
    science,
    scienceChoice: scienceChoices[0] || null,
    scienceChoices,
    scienceSymbols: scienceBreakdown.symbols,
    scienceSets: scienceBreakdown.sets,
    baseScience,
    qiluBonus,
    commerce,
    commerceBase,
    lingnanCommerceBonus,
    guildResolved,
    guildFinal,
    guild,
    coins,
    coinDivisor,
    coinRule,
    rawCoins: player.coins,
    special,
    specialEntries,
    jiangnanBonus,
    heluoBonus,
    jingchuBonus,
    hedongBonus,
    liaodongBonus,
    soldCardCount: Number(player.soldCardCount || 0),
    total
  };
}

function commercialScore(player, card) {
  const rule = card.commerceScore;
  if (!rule) return 0;
  const left = getLeftNeighbor(player);
  const right = getRightNeighbor(player);
  if (rule.type === "yellow") return countColor(player, "yellow") * (rule.points || 0);
  if (rule.type === "resource") return (summarizePlayerResources(player)[rule.resource] || 0) * (rule.points || 0);
  if (rule.type === "coinsStep") return Math.floor(player.coins / (rule.coins || 1)) * (rule.points || 0);
  if (rule.type === "neighborColor") return (countColor(left, rule.color) + countColor(right, rule.color)) * (rule.points || 0);
  if (rule.type === "color") return countColor(player, rule.color) * (rule.points || 0);
  if (rule.type === "stages") return (player.stagesBuilt || 0) * (rule.points || 0);
  return 0;
}

function calculatePurpleScore(player, card) {
  if (!card) return 0;
  if (card.scoringType === "instant") return 0;
  if (card.guildScore) return guildScore(player, card);
  return 0;
}

function guildScore(player, card) {
  const left = getLeftNeighbor(player);
  const right = getRightNeighbor(player);
  if (card.guildScore === "stages") return player.stagesBuilt * 2;
  if (card.guildScore === "stagesOne") return player.stagesBuilt;
  if (card.guildScore === "stagesAll") return (player.stagesBuilt || 0) + (left.stagesBuilt || 0) + (right.stagesBuilt || 0);
  if (card.guildScore === "science") return countColor(player, "green");
  if (card.guildScore === "scienceAll") return countColor(player, "green") + countColor(left, "green") + countColor(right, "green");
  if (card.guildScore === "neighborGreen") return countColor(left, "green") + countColor(right, "green");
  if (card.guildScore === "scienceSymbols") return Object.values(getScience(player)).reduce((total, value) => total + value, 0);
  if (card.guildScore === "scienceDouble") return countColor(player, "green") * 2;
  if (card.guildScore === "commerce") return countColor(player, "yellow");
  if (card.guildScore === "neighborYellow") return countColor(left, "yellow") + countColor(right, "yellow");
  if (card.guildScore === "commerceResourceAll") {
    return (summarizePlayerResources(player)["布匹"] || 0)
      + (summarizePlayerResources(left)["布匹"] || 0)
      + (summarizePlayerResources(right)["布匹"] || 0);
  }
  if (card.guildScore === "neighborBrown") return countColor(left, "brown") + countColor(right, "brown");
  if (card.guildScore === "brown") return countColor(player, "brown");
  if (card.guildScore === "resources") return countColor(player, "brown") + countColor(player, "gray");
  if (card.guildScore === "neighborGrayDouble") return (countColor(left, "gray") + countColor(right, "gray")) * 2;
  if (card.guildScore === "selfBrownGrayPurple") return countColor(player, "brown") + countColor(player, "gray") + countColor(player, "purple");
  if (card.guildScore === "blue") return countColor(player, "blue");
  if (card.guildScore === "blueAll") return countColor(player, "blue") + countColor(left, "blue") + countColor(right, "blue");
  if (card.guildScore === "neighborBlue") return countColor(left, "blue") + countColor(right, "blue");
  if (card.guildScore === "military") return countColor(player, "red");
  if (card.guildScore === "militaryAll") return countColor(player, "red") + countColor(left, "red") + countColor(right, "red");
  if (card.guildScore === "neighborRed") return countColor(left, "red") + countColor(right, "red");
  if (card.guildScore === "defeats") return player.militaryTokens.filter((token) => token < 0).length;
  if (card.guildScore === "neighborDefeats") return left.militaryTokens.filter((token) => token < 0).length + right.militaryTokens.filter((token) => token < 0).length;
  if (card.guildScore === "chooseScienceAtEnd") return 0;
  if (card.guildScore === "coins") return Math.floor(player.coins / 3);
  if (card.guildScore === "grayAll") return countColor(player, "gray") + countColor(left, "gray") + countColor(right, "gray");
  if (card.guildScore === "neighborsBlue") return countColor(left, "blue") + countColor(right, "blue");
  if (card.guildScore === "yellow") return countColor(player, "yellow") + countColor(left, "yellow") + countColor(right, "yellow");
  if (card.guildScore === "uniqueColors") return new Set(getBuiltCards(player).map((builtCard) => builtCard.color)).size;
  return 0;
}

function boardBonus(player) {
  if (player.board.id === "qilu") return getQiluBonus(player);
  if (player.board.id === "heluo") return getHeluoBonus(player);
  if (player.board.id === "jiangnan") return getJiangnanBonus(player);
  return 0;
}

function renderGame() {
  document.body.dataset.gameMode = state.mode || "";
  refreshOnlineHostCloseButtons();
  const player = currentPlayer();
  if (!player) return;
  $("gameChatPanel").classList.toggle("hidden", state.mode !== "online");
  const seventhCardPendingIds = state.seventhCard?.pendingPlayerIds || state.seventhCardPlayers;
  const confirmedCount = state.phase === "seventh-card"
    ? seventhCardPendingIds.filter((playerId) => state.selected[playerId]).length
    : Object.keys(state.selected).length;
  $("ageLabel").textContent = `${player.name} · ${player.board.name}`;
  $("turnLabel").textContent = state.phase === "seventh-card"
      ? `${AGE_CONFIG[state.age].label} · 河洛第七张牌 · 已确认 ${confirmedCount}/${seventhCardPendingIds.length}`
      : state.phase === "end-science-choice"
        ? `${AGE_CONFIG[state.age].label} · 终局前学术选择`
      : state.phase === "overseas-trade-choice"
        ? `${AGE_CONFIG[state.age].label} · 岭南海上贸易对象选择`
      : state.phase === "liaodong-guard-choice"
        ? `${AGE_CONFIG[state.age].label} · 辽东警戒方向选择`
      : state.phase === "liaodong-resource-choice"
        ? `${AGE_CONFIG[state.age].label} · 辽东屯垦资源选择`
        : state.phase === "guanzhong-resource-choice"
          ? `${AGE_CONFIG[state.age].label} · 关中选择基础资源`
          : state.phase === "hedong-discard-choice"
            ? `${AGE_CONFIG[state.age].label} · 河东盐铁官营`
      : `${AGE_CONFIG[state.age].label} · 第 ${state.turn} 轮 · ${AGE_CONFIG[state.age].direction === "left" ? "传牌向左" : "传牌向右"} · 已确认 ${confirmedCount}/${state.players.length}`;
  $("seatModeLabel").textContent = "";
  $("seatModeLabel").classList.add("hidden");
  $("hotseatName").textContent = state.phase === "seventh-card" ? "第七张牌" : state.phase === "end-science-choice" ? "终局选择" : state.phase === "overseas-trade-choice" ? "贸易对象" : state.phase === "liaodong-guard-choice" ? "警戒方向" : state.phase === "liaodong-resource-choice" ? "屯垦资源" : state.phase === "guanzhong-resource-choice" ? "资源选择" : state.phase === "hedong-discard-choice" ? "盐铁官营" : "手牌";
  $("seatModeLabel").innerHTML = renderJingchuPeekButton(player);
  $("seatModeLabel").classList.toggle("hidden", !canLocalPlayerUseJingchuPeek(player));
  const hasPending = Boolean(state.pendingChoice[player.id]);
  const hasConfirmed = Boolean(state.selected[player.id]);
  const canAdvance = state.phase === "end-science-choice" || state.phase === "overseas-trade-choice" || state.phase === "liaodong-guard-choice" || state.phase === "liaodong-resource-choice" || state.phase === "guanzhong-resource-choice" || state.phase === "hedong-discard-choice"
    ? false
    : state.mode === "online"
      ? hasPending
      : (hasPending || hasConfirmed);
  $("nextSeatButton").classList.toggle("hidden", state.phase === "end-science-choice" || state.phase === "overseas-trade-choice" || state.phase === "liaodong-guard-choice" || state.phase === "liaodong-resource-choice" || state.phase === "guanzhong-resource-choice" || state.phase === "hedong-discard-choice");
  $("nextSeatButton").disabled = !canAdvance;
  $("nextSeatButton").classList.toggle("ready-to-confirm", canAdvance);
  $("nextSeatButton").textContent = state.mode === "online"
    ? (hasConfirmed ? "已确认" : "确认")
    : "确认并交给下一位";
  renderBuiltCardsZone(player);
  renderBoardZone(player);
  renderStats(player);
  renderAllPlayers();
  renderHand(player);
  renderDiscardPileEntry();
  renderOverseasTradeChoicePhaseUI(player);
  renderLiaodongGuardChoicePhaseUI(player);
  renderLiaodongResourceChoicePhaseUI(player);
  renderGuanzhongResourceChoicePhaseUI(player);
  renderHedongDiscardBuildChoicePhaseUI(player);
  renderScienceChoicePhaseUI(player);
  renderLogs();
  renderOnlineChatPanels();
  if (state.phase !== "end-science-choice" && state.phase !== "overseas-trade-choice" && state.phase !== "guanzhong-resource-choice") scheduleAIIfNeeded(player);
  saveHotseatGame();
}

function renderBuiltCardsZone(player) {
  const groups = [
    { color: "brown", title: "基础资源", cards: getBuiltCards(player).filter((card) => card.color === "brown") },
    { color: "gray", title: "高级资源", cards: getBuiltCards(player).filter((card) => card.color === "gray") },
    { color: "blue", title: "文明", cards: getBuiltCards(player).filter((card) => card.color === "blue") },
    { color: "red", title: "武备", cards: getBuiltCards(player).filter((card) => card.color === "red") },
    { color: "green", title: "学术", cards: getBuiltCards(player).filter((card) => card.color === "green") },
    { color: "yellow", title: "商业", cards: getBuiltCards(player).filter((card) => card.color === "yellow") },
    { color: "purple", title: "公会", cards: getBuiltCards(player).filter((card) => card.color === "purple") }
  ];
  $("builtCardsPanel").innerHTML = `
    <div class="section-heading compact-heading">
      <div>
        <h3>已建卡牌</h3>
      </div>
    </div>
    <div class="built-card-groups">
      ${groups.map((group) => `
        <section class="built-card-group built-card-group--${group.color}">
          <div class="built-card-stack">
            ${group.cards.length ? group.cards.map((card, index) => `
              <button
                class="built-mini-card built-mini-card--${group.color}"
                style="--stack-index:${index}"
                title="${builtCardDetail(card)}"
                onclick="openBuiltSlotDetail('${player.id}', '${group.color}')"
              >
                ${cardLinkBadges(card, "card-link-badges--mini")}
                <strong>${card.name}</strong>
                <span>${builtCardBrief(card)}</span>
              </button>
            `).join("") : `
              <button
                type="button"
                class="built-slot-placeholder built-slot-placeholder--${group.color}"
                onclick="openBuiltSlotDetail('${player.id}', '${group.color}')"
              >
                ${group.title}
              </button>
            `}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderBoardZone(player) {
  const overseasPartner = getLingnanOverseasPartner(player);
  const stages = player.board.stages.map((stage, index) => {
    const status = index < player.stagesBuilt ? "done" : index === player.stagesBuilt ? "current" : "pending";
    const statusLabel = status === "done" ? "已完成" : status === "current" ? "当前可建设" : "未完成";
    return `
      <div class="stage ${status}">
        <strong>${index + 1}. ${stage.name}</strong>
        <p>成本：${formatResourceMap(stage.cost)}</p>
        <p>奖励：${describeStage(stage)}</p>
        <p class="hint">${statusLabel}</p>
      </div>
    `;
  }).join("");
  $("boardPanel").innerHTML = `
    <div class="section-heading compact-heading">
      <div>
        <p class="eyebrow">${player.board.name}</p>
        <h3>区域建设</h3>
      </div>
      <span class="pill">${player.stagesBuilt}/${player.board.stages.length}</span>
    </div>
    <p class="hint"><strong class="board-meta-label">初始资源：</strong>${formatResourceMap(player.board.startResource)}</p>
    <p class="hint board-ability"><strong class="board-meta-label">区域特质：</strong>${formatBoardAbilityHtml(player.board.ability).replace(/^区域特质：/, "")}</p>
    ${player.board.id === "lingnan" ? `<p class="hint"><strong class="board-meta-label">海上贸易对象：</strong>${overseasPartner?.name || "未建立"}</p>` : ""}
    <div class="stage-list board-stage-list">${stages}</div>
  `;
}

function builtCardBrief(card) {
  const resourceChoice = resolveCardResourceChoice(card);
  if (resourceChoice.length) {
    return `<span class="built-choice-inline">${renderResourceChoiceInline(resourceChoice, "built-choice-icon")}</span>`;
  }
  if (card.produces?.length) return formatProduces(card.produces);
  if (card.points) return `${card.points}分`;
  if (card.shields || card.military) return `${formatIconLabel("武备")}+${card.shields || card.military}`;
  if (card.scienceSymbol) return formatIconLabel(card.scienceSymbol);
  if (card.coins) return `+${formatIconLabel("铜钱", card.coins)}`;
  if (card.color === "yellow") {
    if (card.tradeDiscount) return "优惠";
    if (card.tradeRebate) return "减免";
    if (card.oneTimeBuildDiscount) return "折扣";
    if (card.commerceScore) return "计分";
    return "商业";
  }
  return card.effect || "效果";
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, "");
}

function builtCardDetail(card) {
  return `${card.name}｜${stripHtml(cardText(card))}`;
}

function renderCurrentPlayer(player) {
  const overseasPartner = getLingnanOverseasPartner(player);
  const stages = player.board.stages.map((stage, index) => `
    <div class="stage ${index < player.stagesBuilt ? "done" : ""}">
      <strong>${index + 1}. ${stage.name}</strong>
      <p>成本：${formatResourceMap(stage.cost)}</p>
      <p>${index < player.stagesBuilt ? "已建成" : describeStage(stage)}</p>
    </div>
  `).join("");
  $("currentPlayerPanel").innerHTML = `
    <h3>${player.board.name}</h3>
    <p class="hint">${player.board.subtitle}</p>
    <p class="hint"><strong class="board-meta-label">初始资源：</strong>${formatResourceMap(player.board.startResource)}</p>
    <p class="hint board-ability"><strong class="board-meta-label">区域特质：</strong>${formatBoardAbilityHtml(player.board.ability).replace(/^区域特质：/, "")}</p>
    ${player.board.id === "lingnan" ? `<p class="hint"><strong class="board-meta-label">海上贸易对象：</strong>${overseasPartner?.name || "未建立"}</p>` : ""}
    <div class="stage-list">${stages}</div>
  `;
}

function describeStage(stage) {
  const effects = stage.effects || {};
  if (effects.effect === "openOverseasTradeRoute") {
    return isThreePlayerGame()
      ? "5分"
      : "开通海上贸易通道：选择一名非左右邻国作为贸易对象。";
  }
  if (effects.effect === "extraCoinsFirstGainEachTurn") {
    return `${effects.coins || 0}铜钱；之后你的行动中，每轮第一次获得铜钱时，额外获得2铜钱`;
  }
  if (effects.effect === "peekIncomingHandThisAge") {
    return "本时代剩余时间内，每轮开始时可以查看来牌上家的当前手牌";
  }
  if (effects.effect === "buildFromDiscardPile") {
    return "从弃牌堆选择1张牌免费建造";
  }
  if (effects.effect === "guardBothNeighbors") {
    return "之后每个时代可以同时警戒左右两方邻国";
  }
  const parts = [];
  if (effects.points) parts.push(`${effects.points}分`);
  if (effects.coins) parts.push(formatIconLabel("铜钱", effects.coins));
  if (effects.military) parts.push(`${formatIconLabel("武备")} +${effects.military}`);
  if (effects.resource) parts.push(`产出 ${formatResourceMap(effects.resource)}`);
  if (effects.wildBasicResource) parts.push(formatIconLabel("万能基础资源", effects.wildBasicResource));
  if (effects.science) parts.push(`学术 ${formatScienceMap(effects.science)}`);
  if (effects.effect === "chooseScienceAtEnd") parts.push("终局前选择 1 个学术符号");
  if (effects.effect === "useSeventhCard") parts.push("每个时代最后本应弃置的第七张牌，可以改为使用。");
  return parts.join("、") || "特殊能力";
}

function renderNeighbors(player) {
  const left = getLeftNeighbor(player);
  const right = getRightNeighbor(player);
  $("neighborsPanel").innerHTML = `
    <h3>邻居状态</h3>
    ${neighborBlock("左邻", left)}
    ${neighborBlock("右邻", right)}
  `;
}

function neighborBlock(label, player) {
  return `
    <div class="player-summary">
      <strong>${label}：${player.name}（${player.board.name}）</strong>
      <p>资源：${formatResourceMap(getResources(player))}</p>
      <p>${formatIconLabel("铜钱")} ${player.coins} · ${formatIconLabel("武备")} ${getMilitary(player)} · 已建 ${player.built.length} 张</p>
    </div>
  `;
}

function renderStats(player) {
  const resources = getResources(player);
  const science = getScience(player);
  const wildBasicResourceCount = getWildBasicResourceCount(player);
  const resourceChoiceGroups = summarizeResourceChoiceGroups(player);
  const basicChoiceGroups = filterResourceChoiceGroups(resourceChoiceGroups, BASIC_RESOURCES);
  const advancedChoiceGroups = filterResourceChoiceGroups(resourceChoiceGroups, ADVANCED_RESOURCES);
  $("statsPanel").innerHTML = `
    <div class="current-summary-panel">
      <div class="summary-head">
        <h3>当前摘要</h3>
      </div>
      <div class="summary-stat-grid">
        <button type="button" class="summary-stat-card summary-stat-card--clickable" onclick="openCoinLedgerDialog()" title="点击查看铜钱明细">
          <span class="summary-stat-icon" title="铜钱">${iconSvg("铜钱")}</span>
          <strong>${player.coins}</strong>
        </button>
        <div class="summary-stat-card">
          <span class="summary-stat-icon" title="武备">${iconSvg("武备")}</span>
          <strong>${getMilitary(player)}</strong>
        </div>
        <div class="summary-stat-card">
          <span>区域</span>
          <strong>${player.stagesBuilt}/${player.board.stages.length}</strong>
        </div>
      </div>
      <div class="summary-section">
        <h4>资源</h4>
        <div class="summary-resource-group">
          <div class="summary-chip-grid summary-chip-grid--basic-resources">
            ${BASIC_RESOURCES.map((resource) => `
              <div class="summary-chip">
                <span class="summary-chip-icon">${iconSvg(resource)}</span>
                <strong>×${resources[resource] || 0}</strong>
              </div>
            `).join("")}
            ${wildBasicResourceCount ? `
              <div class="summary-chip">
              <span class="summary-chip-icon">${iconSvg("万能基础资源")}</span>
                <strong>×${wildBasicResourceCount}</strong>
              </div>
            ` : ""}
          </div>
          ${basicChoiceGroups.length ? `
            <div class="summary-choice-row">
              ${basicChoiceGroups.map((group) => `
                <div class="summary-chip summary-chip--choice summary-chip--choice-inline">
                  <span class="summary-choice-icons summary-choice-icons--compact">
                    ${renderResourceChoiceInline(group.resources, "summary-choice-icon", { showSeparators: group.resources.length === 2 })}
                  </span>
                  <strong>×${group.count}</strong>
                </div>
              `).join("")}
            </div>
          ` : ""}
        </div>
        <div class="summary-resource-group">
          <div class="summary-chip-grid">
            ${ADVANCED_RESOURCES.map((resource) => `
              <div class="summary-chip">
                <span class="summary-chip-icon">${iconSvg(resource)}</span>
                <strong>×${resources[resource] || 0}</strong>
              </div>
            `).join("")}
          </div>
          ${advancedChoiceGroups.length ? `
            <div class="summary-choice-row">
              ${advancedChoiceGroups.map((group) => `
                <div class="summary-chip summary-chip--choice summary-chip--choice-inline">
                  <span class="summary-choice-icons summary-choice-icons--compact">
                    ${renderResourceChoiceInline(group.resources, "summary-choice-icon", { showSeparators: group.resources.length === 2 })}
                  </span>
                  <strong>×${group.count}</strong>
                </div>
              `).join("")}
            </div>
          ` : ""}
        </div>
      </div>
      <div class="summary-section">
        <h4>学术</h4>
        <div class="summary-chip-grid">
          ${SCIENCE_NAMES.map((symbol) => `
            <div class="summary-chip">
              <span class="summary-chip-icon">${iconSvg(symbol)}</span>
              <strong>×${science[symbol] || 0}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderAllPlayers() {
  const current = currentPlayer();
  if (!current) return;
  const orderedPlayers = orderedOverviewPlayers(current);
  $("allPlayersPanel").innerHTML = `
    <div class="overview-heading">
      <div class="overview-title-row">
        <h3>玩家总览</h3>
        <p class="hint">当前传牌：${AGE_CONFIG[state.age].direction === "left" ? "向左（上）" : "向右（下）"}</p>
      </div>
    </div>
    <div class="player-overview-list">
      <div class="player-overview-strip">
        ${orderedPlayers.map((player) => renderOverviewCard(player, current, state.inspectPlayerId)).join("")}
      </div>
    </div>
  `;
  setupCircularOverviewScroll();
}

function renderOverviewCard(player, current, inspectedId) {
  const colorCounts = summarizeBuiltColors(player);
  const tags = overviewTags(player, current, inspectedId);
  const classes = overviewCardClasses(player, current, inspectedId);
  const resourceText = formatOverviewResourceSummary(player);
  const freeFirstCardText = freeFirstCardStatusText(player);
  const overviewResourceLine = [resourceText, freeFirstCardText].filter(Boolean).join("｜");
  return `
    <button
      class="overview-card player-summary-card ${classes}"
      data-player-id="${player.id}"
      onclick="openPlayerOverview('${player.id}')"
    >
      <div class="overview-top">
        <strong>${player.name}｜${player.board.name}</strong>
        <div class="overview-tags">${tags.map((tag) => `
          <span class="pill role-pill ${tag.className || ""}">
            ${tag.isStatus ? `<span class="overview-status-dot" aria-hidden="true"></span>` : ""}
            ${tag.label}
          </span>
        `).join("")}</div>
      </div>
      <p class="overview-resources">${overviewResourceLine}</p>
      <div class="overview-metrics">
        <span>${formatIconText("铜钱")}${player.coins}</span>
        <span>${formatIconText("武备")}${getMilitary(player)}</span>
        <span>区域${player.stagesBuilt}/${player.board.stages.length}</span>
      </div>
      <p class="overview-colors">${renderColorSummary(colorCounts)}</p>
    </button>
  `;
}

function renderPlayerDetail(player) {
  const builtCards = getBuiltCards(player);
  const builtStagesList = builtStages(player);
  const science = getScience(player);
  const freeFirstCardText = freeFirstCardStatusText(player);
  const resourceText = formatOverviewResourceSummary(player);
  const overseasPartner = getLingnanOverseasPartner(player);
  return `
    <div class="player-detail-heading">
      <div>
        <h4>${player.name}｜${player.board.name}</h4>
        <p class="hint">${formatIconLabel("铜钱")} ${player.coins}｜${formatIconLabel("武备")} ${getMilitary(player)}｜区域 ${player.stagesBuilt}/${player.board.stages.length}</p>
        <p class="hint">资源：${resourceText}${freeFirstCardText ? `｜${freeFirstCardText}` : ""}｜学术：${SCIENCE_NAMES.map((symbol) => formatIconLabel(symbol, science[symbol] || 0)).join(" ")}</p>
        <p class="hint board-ability"><strong class="board-meta-label">区域特质：</strong>${formatBoardAbilityHtml(player.board.ability).replace(/^区域特质：/, "")}</p>
        ${player.board.id === "lingnan" ? `<p class="hint">海上贸易对象：${overseasPartner?.name || "未建立"}</p>` : ""}
      </div>
    </div>
    <div class="detail-groups">
      <section class="detail-group">
        <h5>铜钱明细</h5>
        ${renderCoinLedgerList(player)}
      </section>
      <section class="detail-group">
        <h5>已建卡牌</h5>
        ${renderPlayerDetailBuiltCards(player, builtCards)}
      </section>
      <section class="detail-group">
        <h5>区域板</h5>
        <p class="hint">已完成阶段：${player.stagesBuilt}/${player.board.stages.length}</p>
        <div class="detail-list">
          ${builtStagesList.length ? builtStagesList.map((stage, index) => `
            <div class="detail-item">
              <strong>${index + 1}. ${stage.name}</strong>
              <p>${describeStage(stage)}</p>
            </div>
          `).join("") : `<p class="hint">暂无</p>`}
        </div>
      </section>
    </div>
  `;
}

function renderPlayerDetailBuiltCards(player, builtCards = []) {
  if (!builtCards.length) return `<p class="hint">暂无已建卡牌</p>`;
  const groups = [
    ["brown", "基础资源"],
    ["gray", "高级资源"],
    ["blue", "文明"],
    ["red", "武备"],
    ["green", "学术"],
    ["yellow", "商业"],
    ["purple", "公会"]
  ]
    .map(([color, title]) => ({
      color,
      title,
      cards: builtCards.filter((card) => card.color === color)
    }))
    .filter((group) => group.cards.length);
  return `
    <div class="detail-card-groups">
      ${groups.map((group) => `
        <section class="detail-card-group detail-card-group--${group.color}">
          <h6>${group.title}</h6>
          <div class="readonly-card-grid readonly-card-grid--detail">
            ${group.cards.map((card) => renderReadonlyCard(card, player)).join("")}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function detailGroup(title, cards, detailText) {
  return `
    <section class="detail-group">
      <h5>${title}</h5>
      <div class="detail-list">
        ${cards.length ? cards.map((card) => `
          <div class="detail-item">
            <strong>${card.name}</strong>
            <p>${detailText(card)}</p>
          </div>
        `).join("") : `<p class="hint">暂无</p>`}
      </div>
    </section>
  `;
}

function getBuiltCards(player) {
  return player.built || player.builtCards || player.playedCards || player.tableau || player.cardsBuilt || [];
}

function summarizePlayerResources(player) {
  return getPlayerResources(player);
}

function formatTwoChoiceResourceSummary(player) {
  const groups = getBuiltCards(player)
    .map((card) => ({ card, resourceChoice: resolveCardResourceChoice(card) }))
    .filter(({ resourceChoice }) => resourceChoice.length === 2)
    .reduce((result, { resourceChoice }) => {
      const resources = resourceChoice.slice().sort((a, b) => {
        if (BASIC_RESOURCES.includes(a) && BASIC_RESOURCES.includes(b)) {
          return BASIC_RESOURCES.indexOf(a) - BASIC_RESOURCES.indexOf(b);
        }
        if (ADVANCED_RESOURCES.includes(a) && ADVANCED_RESOURCES.includes(b)) {
          return ADVANCED_RESOURCES.indexOf(a) - ADVANCED_RESOURCES.indexOf(b);
        }
        return a.localeCompare(b, "zh-Hans-CN");
      });
      const key = resources.join("/");
      result[key] = result[key] || { resources, count: 0 };
      result[key].count += 1;
      return result;
    }, {});
  const items = Object.values(groups);
  if (!items.length) return "";
  return items
    .map(({ resources, count }) => `${resources.map((resource) => formatIconLabel(resource)).join(" / ")} ×${count}`)
    .join("、");
}

function formatTwoChoiceResourceSummaryCompact(player) {
  const groups = getBuiltCards(player)
    .map((card) => ({ card, resourceChoice: resolveCardResourceChoice(card) }))
    .filter(({ resourceChoice }) => resourceChoice.length === 2)
    .reduce((result, { resourceChoice }) => {
      const resources = resourceChoice.slice().sort((a, b) => {
        if (BASIC_RESOURCES.includes(a) && BASIC_RESOURCES.includes(b)) {
          return BASIC_RESOURCES.indexOf(a) - BASIC_RESOURCES.indexOf(b);
        }
        if (ADVANCED_RESOURCES.includes(a) && ADVANCED_RESOURCES.includes(b)) {
          return ADVANCED_RESOURCES.indexOf(a) - ADVANCED_RESOURCES.indexOf(b);
        }
        return a.localeCompare(b, "zh-Hans-CN");
      });
      const key = resources.join("/");
      result[key] = result[key] || { resources, count: 0 };
      result[key].count += 1;
      return result;
    }, {});
  return Object.values(groups)
    .map(({ resources, count }) => `${resources.map((resource) => iconOnly(resource, "overview-resource-icon")).join('<span class="resource-choice-separator" aria-hidden="true">/</span>')} <span class="icon-count">×${count}</span>`);
}

function formatOverviewResourceSummary(player) {
  const resources = summarizePlayerResources(player);
  const parts = RESOURCE_NAMES
    .filter((resource) => resources[resource])
    .map((resource) => formatIconOnlyAmount(resource, resources[resource]));
  parts.push(...formatTwoChoiceResourceSummaryCompact(player));
  const wildBasicResourceCount = getWildBasicResourceCount(player);
  if (wildBasicResourceCount) parts.push(formatIconOnlyAmount("万能基础资源", wildBasicResourceCount));
  return parts.join("、");
}

function summarizeResourceChoiceGroups(player) {
  const groups = getBuiltCards(player)
    .map((card) => ({ card, resourceChoice: resolveCardResourceChoice(card) }))
    .filter(({ resourceChoice }) => resourceChoice.length)
    .reduce((result, { resourceChoice }) => {
      const resources = resourceChoice.slice().sort((a, b) => {
        if (BASIC_RESOURCES.includes(a) && BASIC_RESOURCES.includes(b)) {
          return BASIC_RESOURCES.indexOf(a) - BASIC_RESOURCES.indexOf(b);
        }
        if (ADVANCED_RESOURCES.includes(a) && ADVANCED_RESOURCES.includes(b)) {
          return ADVANCED_RESOURCES.indexOf(a) - ADVANCED_RESOURCES.indexOf(b);
        }
        return a.localeCompare(b, "zh-Hans-CN");
      });
      const key = resources.join("/");
      result[key] = result[key] || { resources, count: 0 };
      result[key].count += 1;
      return result;
    }, {});
  return Object.values(groups);
}

function filterResourceChoiceGroups(groups, resourcePool = []) {
  return groups.filter((group) => group.resources.every((resource) => resourcePool.includes(resource)));
}

function summarizeBuiltColors(player) {
  const counts = { brown: 0, gray: 0, blue: 0, red: 0, green: 0, yellow: 0, purple: 0 };
  for (const card of getBuiltCards(player)) counts[card.color] = (counts[card.color] || 0) + 1;
  return counts;
}

function renderColorSummary(counts) {
  const items = [
    ["brown", "棕"],
    ["gray", "灰"],
    ["blue", "蓝"],
    ["red", "红"],
    ["green", "绿"],
    ["yellow", "黄"],
    ["purple", "紫"]
  ];
  return items
    .map(([key, label]) => `<span class="overview-color overview-color--${key}">${label}${counts[key] || 0}</span>`)
    .join(" ");
}

function overviewRoleLabel(player, current) {
  if (player.id === current.id) return "你";
  if (getLeftNeighbor(current)?.id === player.id) return "左邻居";
  if (getRightNeighbor(current)?.id === player.id) return "右邻居";
  return "";
}

function orderedOverviewPlayers(current) {
  const players = state.players.slice();
  const currentIndex = players.findIndex((player) => player.id === current.id);
  if (currentIndex === -1 || players.length <= 1) return players;
  const startIndex = (currentIndex - 1 + players.length) % players.length;
  return Array.from({ length: players.length }, (_, offset) => players[(startIndex + offset) % players.length]);
}

function setupCircularOverviewScroll() {
  const list = document.querySelector(".player-overview-list");
  if (!list) return;
  list.onscroll = null;
}

function isOverviewStatusPhase() {
  return state.mode === "online"
    && ["game", "seventh-card", "overseas-trade-choice", "liaodong-guard-choice", "liaodong-resource-choice", "guanzhong-resource-choice", "hedong-discard-choice", "end-science-choice"].includes(state.phase);
}

function isPlayerPendingOverviewChoice(player) {
  if (!player || !isOverviewStatusPhase()) return false;
  if (state.phase === "overseas-trade-choice") {
    return Boolean(player.pendingOverseasTradeChoice && getLingnanTradeCandidates(player).length);
  }
  if (state.phase === "liaodong-guard-choice") {
    return Boolean(player.pendingLiaodongGuardChoice);
  }
  if (state.phase === "liaodong-resource-choice") {
    return Boolean(player.pendingLiaodongResourceChoice);
  }
  if (state.phase === "guanzhong-resource-choice") {
    return Boolean(player.pendingGuanzhongResourceChoices);
  }
  if (state.phase === "hedong-discard-choice") {
    return Boolean(player.pendingHedongDiscardBuildChoice);
  }
  if (state.phase === "end-science-choice") {
    return needsEndGameScienceChoice(player);
  }
  return false;
}

function hasPlayerConfirmedOverviewAction(player) {
  if (!player || !isOverviewStatusPhase()) return false;
  if (state.phase === "overseas-trade-choice" || state.phase === "end-science-choice") {
    return !isPlayerPendingOverviewChoice(player);
  }
  return Boolean(
    state.selected[player.id]
    || state.online.roomData?.selected?.[player.id]
    || state.online.roomData?.game?.selected?.[player.id]
    || state.online.roomData?.players?.[player.id]?.confirmedAction
    || player.confirmedAction
  );
}

function overviewStatusTag(player) {
  if (!isOverviewStatusPhase()) return null;
  const isThinking = isPlayerPendingOverviewChoice(player) || !hasPlayerConfirmedOverviewAction(player);
  return {
    label: isThinking ? "思考中" : "已确认",
    className: isThinking ? "overview-status-pill overview-status-pill--thinking" : "overview-status-pill overview-status-pill--confirmed",
    isStatus: true
  };
}

function overviewTags(player, current, inspectedId) {
  const tags = [];
  const statusTag = overviewStatusTag(player);
  if (statusTag) tags.push(statusTag);
  if (player.id === current.id) tags.push({ label: "你" });
  if (getLeftNeighbor(current)?.id === player.id) tags.push({ label: "左邻" });
  if (getRightNeighbor(current)?.id === player.id) tags.push({ label: "右邻" });
  if (player.id === inspectedId) tags.push({ label: "正在查看" });
  return tags;
}

function overviewCardClasses(player, current, inspectedId) {
  const classes = [];
  if (player.id === current.id) classes.push("current", "player-summary-card--current");
  if (getLeftNeighbor(current)?.id === player.id) classes.push("player-summary-card--left-neighbor");
  if (getRightNeighbor(current)?.id === player.id) classes.push("player-summary-card--right-neighbor");
  if (player.id === inspectedId) classes.push("selected", "player-summary-card--selected");
  return classes.join(" ");
}

function openPlayerOverview(playerId) {
  state.inspectPlayerId = playerId;
  renderAllPlayers();
  openPlayerOverviewDialog(playerId);
}

function openPlayerOverviewDialog(playerId = state.inspectPlayerId) {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) return;
  state.inspectPlayerId = player.id;
  $("playerOverviewDialogTitle").textContent = `${player.name}｜${player.board.name}`;
  $("playerOverviewDialogBody").innerHTML = renderPlayerDetail(player);
  document.body.classList.add("dialog-open");
  $("playerOverviewDialog").showModal();
}

function closePlayerOverviewDialog() {
  $("playerOverviewDialog").close();
}

function handlePlayerOverviewDialogClose() {
  state.inspectPlayerId = "";
  document.body.classList.remove("dialog-open");
  renderAllPlayers();
}

function handlePlayerOverviewDialogBackdrop(event) {
  const dialog = $("playerOverviewDialog");
  const rect = dialog.getBoundingClientRect();
  const clickedInside = rect.top <= event.clientY
    && event.clientY <= rect.top + rect.height
    && rect.left <= event.clientX
    && event.clientX <= rect.left + rect.width;
  if (!clickedInside) closePlayerOverviewDialog();
}

function openBuiltSlotDetail(playerId, color) {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) return;
  const cards = getBuiltCards(player).filter((card) => card.color === color);
  $("builtSlotDialogTitle").textContent = "已建卡牌详情";
  $("builtSlotDialogBody").innerHTML = renderBuiltSlotSummary(player, color, cards);
  document.body.classList.add("dialog-open");
  $("builtSlotDialog").showModal();
}

function closeBuiltSlotDialog() {
  document.body.classList.remove("dialog-open");
  $("builtSlotDialog").close();
}

function getResourceChoiceCardsForGroup(player, relevantResources = []) {
  return getBuiltCards(player).filter((card) => {
    const resourceChoice = resolveCardResourceChoice(card);
    if (!resourceChoice.length) return false;
    return resourceChoice.some((resource) => relevantResources.includes(resource));
  });
}

function renderBuiltSlotSummary(player, color, cards) {
  const items = builtSlotSummaryItems(player, color, cards);
  const sources = builtSlotBonusSources(player, color);
  const emptyText = emptyBonusText(color);
  const sourceTitle = color === "yellow" ? "铜钱明细" : "额外加成来源";
  const detailCards = (color === "brown" || color === "gray")
    ? Array.from(
        new Map(
          [...cards, ...getResourceChoiceCardsForGroup(player, color === "brown" ? BASIC_RESOURCES : ADVANCED_RESOURCES)]
            .map((card) => [card.id || card.name, card])
        ).values()
      )
    : cards;
  const detailHtml = detailCards.length
    ? `<div class="readonly-card-grid">
        ${detailCards.map((card) => renderReadonlyCard(card, player)).join("")}
      </div>`
    : `<p class="hint">暂无已建卡牌</p>`;
  return `
    <section class="slot-summary">
      <h5>汇总</h5>
      <div class="slot-summary-grid">
        ${items.map((item) => `
          <div class="stat">
            <span>${item.labelHtml || item.label}</span>
            <strong>${item.value}</strong>
          </div>
        `).join("")}
      </div>
    </section>
    <section class="slot-summary">
      <h5>已建卡牌详情</h5>
      ${detailHtml}
    </section>
    <section class="slot-summary">
      <h5>${sourceTitle}</h5>
      <div class="detail-list">
        ${sources.length ? sources.map((source) => `
          <div class="detail-item">
            <p>${source}</p>
          </div>
        `).join("") : `<p class="hint">${emptyText}</p>`}
      </div>
    </section>
  `;
}

function builtSlotSummaryItems(player, color, cards) {
  if (color === "brown" || color === "gray") {
    const relevantResources = color === "brown" ? BASIC_RESOURCES : ADVANCED_RESOURCES;
    const resourceCounts = summarizeResourcesByGroup(player, relevantResources);
    const choiceItems = getResourceChoiceCardsForGroup(player, relevantResources)
      .reduce((groups, card) => {
        const resources = resolveCardResourceChoice(card)
          .filter((resource) => relevantResources.includes(resource))
          .slice()
          .sort((a, b) => relevantResources.indexOf(a) - relevantResources.indexOf(b));
        if (resources.length < 2) return groups;
        const key = resources.join("/");
        groups[key] = groups[key] || { label: key, value: 0 };
        groups[key].value += 1;
        return groups;
      }, {});
    return [
      ...relevantResources.map((resource) => ({ label: resource, value: resourceCounts[resource] || 0 })),
      ...Object.values(choiceItems)
    ];
  }
  if (color === "green") {
    const breakdown = calculateScienceBreakdown(player);
    const { symbols, sets, squareScore, setBonus, qiluBonus, totalScience } = breakdown;
    const items = [
      { label: "经学", value: symbols.经学 },
      { label: "工学", value: symbols.工学 },
      { label: "史学", value: symbols.史学 },
      { label: "成套", value: sets }
    ];
    if (player.board.id === "qilu") {
      items.push({ label: "基础学术分", value: squareScore + setBonus });
      items.push({ label: "齐鲁额外成套分", value: qiluBonus });
    }
    items.push({ label: "学术总分", value: totalScience });
    return items;
  }
  if (color === "red") {
    const cardMilitary = cards.reduce((total, card) => total + (card.shields || card.military || 0), 0);
    const totalMilitary = getMilitary(player);
    const militaryScore = sum(player.militaryTokens || []);
    return [
      { label: "武备牌数量", value: cardMilitary },
      { label: "当前武备总值", value: totalMilitary },
      { label: "当前军事得分", value: militaryScore }
    ];
  }
  if (color === "blue") {
    const cardPoints = cards.reduce((total, card) => total + (card.points || 0), 0);
    const boardPoints = builtStages(player).reduce((total, stage) => {
      if (isLingnanStageOne(stage, player) && isThreePlayerGame()) return total + 5;
      return total + (stage.effects?.points || 0);
    }, 0);
    const jiangnanBonus = getJiangnanBonus(player);
    const heluoBonus = getHeluoBonus(player);
    const items = [
      { label: "蓝牌数量", value: cards.length },
      { label: "蓝牌文明分", value: cardPoints },
      { label: "区域板分", value: boardPoints }
    ];
    if (player.board.id === "jiangnan") items.push({ label: "江南建设加成", value: jiangnanBonus });
    if (player.board.id === "heluo") items.push({ label: "河洛蓝牌加成", value: heluoBonus });
    items.push({ label: "文明相关总分", value: cardPoints + boardPoints + jiangnanBonus + heluoBonus });
    return items;
  }
  if (color === "yellow") {
    const directPoints = cards.reduce((total, card) => total + (card.points || 0), 0);
    const conditionalEffects = cards.filter((card) => card.effect || card.tradeDiscount || card.perColorCoins || card.perNeighborColorCoins || card.perResourceCoins || card.tradeRebate || card.commerceScore || card.oneTimeBuildDiscount).length;
    const commercePoints = cards.reduce((total, card) => total + commercialScore(player, card), 0);
    const settledPoints = cards.reduce((total, card) => total + (card.resolvedPoints || 0), 0);
    const activeDiscounts = cards.filter((card) => card.tradeDiscount || card.tradeRebate || card.oneTimeBuildDiscount).length;
    const lingnanBonus = getLingnanBuiltYellowBonus(player);
    return [
      { label: "商业牌数量", value: cards.length },
      { label: "商业牌加分", value: directPoints + settledPoints + commercePoints },
      ...(player.board.id === "lingnan" ? [{ label: "岭南商业牌加成", value: `+${lingnanBonus}` }] : []),
      { label: "当前铜钱", value: player.coins },
      { label: "铜钱终局分", value: scorePlayer(player).coins },
      { label: "持续优惠效果", value: activeDiscounts ? `${activeDiscounts} 项` : "暂无" },
      { label: "商业特殊效果", value: conditionalEffects ? `${conditionalEffects} 项` : "暂无" }
    ];
  }
  if (color === "purple") {
    const settledPoints = cards.reduce((total, card) => total + (card.resolvedPoints || 0), 0);
    const estimatedFinal = cards
      .filter((card) => card.guildScore)
      .reduce((total, card) => total + calculatePurpleScore(player, card), 0);
    return [
      { label: "公会牌数量", value: cards.length },
      { label: "公会牌加分", value: settledPoints + estimatedFinal }
    ];
  }
  return [{ label: "卡牌数量", value: cards.length }];
}

function builtSlotBonusSources(player, color) {
  if (color === "yellow") {
    return commercialBonusSources(player);
  }
  const sources = [];
  const stageSources = builtStageBonusSources(player, color);
  const boardSources = boardSpecificBonusSources(player, color);
  const tokenSources = color === "red" ? militaryTokenSources(player) : [];
  const miscSources = [];
  const scoreNotes = slotScoreNotes(player, color);
  return [...stageSources, ...boardSources, ...tokenSources, ...miscSources, ...scoreNotes]
    .filter(Boolean);
}

function summarizeResourcesByGroup(player, resourceGroup) {
  const allResources = summarizePlayerResources(player);
  return Object.fromEntries(resourceGroup.map((resource) => [resource, allResources[resource] || 0]));
}

function builtStageBonusSources(player, color) {
  return builtStages(player).flatMap((stage, index) => {
    const label = `区域板第 ${index + 1} 阶段`;
    const effects = stage.effects || {};
    const lines = [];
    if ((color === "brown" || color === "gray") && effects.resource) {
      const relevantResources = filterResourceMap(effects.resource, color === "brown" ? BASIC_RESOURCES : ADVANCED_RESOURCES);
      if (Object.keys(relevantResources).length) {
        lines.push(`${label}：提供 ${formatResourceMap(relevantResources)}`);
      }
    }
    if (color === "red" && effects.military) {
      lines.push(`${label}：${formatIconLabel("武备")} +${effects.military}`);
    }
    if (color === "green" && effects.science) {
      lines.push(`${label}：学术 ${formatScienceMap(effects.science)}`);
    }
    if (color === "blue" && effects.points) {
      lines.push(`${label}：文明相关固定分 +${effects.points}`);
    }
    if (color === "yellow" && effects.coins) {
      lines.push(`${label}：${formatIconLabel("铜钱")} +${effects.coins}`);
    }
    if ((color === "blue" || color === "yellow") && effects.effect === "openOverseasTradeRoute") {
      lines.push(`${label}：${isThreePlayerGame() ? "3人局改为 +5 分" : "开通海上贸易通道"}`);
    }
    if ((color === "blue" || color === "yellow") && effects.effect === "freeFirstCardEachAge") {
      lines.push(`${label}：每个时代第一张卡牌免费建造`);
    }
    if ((color === "yellow" || color === "purple") && effects.effect === "extraCoinsFirstGainEachTurn") {
      lines.push(`${label}：每轮第一次获得铜钱时，额外获得 2 铜钱`);
    }
    if ((color === "blue" || color === "yellow") && effects.effect === "chooseScienceAtEnd") {
      lines.push(`${label}：终局前选择 1 个学术符号`);
    }
    if ((color === "blue" || color === "yellow") && effects.effect === "guardBothNeighbors") {
      lines.push(`${label}：之后每个时代可以同时警戒左右两方邻国`);
    }
    if ((color === "yellow" || color === "purple") && effects.effect === "useSeventhCard") {
      lines.push(`${label}：每个时代最后本应弃置的第七张牌，可以改为使用`);
    }
    return lines;
  });
}

function boardSpecificBonusSources(player, color) {
  const sources = [];
  if ((color === "brown" || color === "gray") && player.board.startResource) {
    const relevantResources = filterResourceMap(
      player.board.startResource,
      color === "brown" ? BASIC_RESOURCES : ADVANCED_RESOURCES
    );
    if (Object.keys(relevantResources).length) {
      sources.push(`起始资源：${player.board.name}提供 ${formatResourceMap(relevantResources)}`);
    }
  }
  if (color === "blue" && hasHeluoBlueBonus(player)) {
    sources.push(`区域特质：${player.board.ability}（当前河洛蓝牌额外分 +${getHeluoBonus(player)}）`);
  }
  if (color === "blue" && player.board.id === "jiangnan" && player.stagesBuilt > 0) {
    sources.push(`区域特质：${player.board.ability}（当前江南建设加成 +${getJiangnanBonus(player)}）`);
  }
  if (color === "green" && player.board.id === "qilu") {
    sources.push(`区域特质：${player.board.ability}（当前齐鲁额外成套分 +${getQiluBonus(player)}）`);
  }
  if (color === "yellow" && player.board.id === "bashu") {
    sources.push(`区域特质：${player.board.ability}（当前铜钱终局分使用现有项目规则计算）`);
  }
  if (color === "yellow" && player.board.id === "lingnan") {
    sources.push(`区域特质：${player.board.ability}（当前岭南商业牌加成 +${getLingnanBuiltYellowBonus(player)}）`);
  }
  if (color === "yellow" && player.board.id === "jiangnan" && player.stagesBuilt > 0) {
    sources.push(`区域特质：${player.board.ability}（已完成 ${player.stagesBuilt} 个区域阶段，可追溯建设额外铜钱 ${player.stagesBuilt * 2}）`);
  }
  if (color === "red" && player.board.id === "yanzhao") {
    const yanzhaoPoints = (player.specialScoreLogs || [])
      .filter((entry) => entry.sourceName === "燕赵区域特质")
      .reduce((total, entry) => total + (entry.points || 0), 0);
    sources.push(`区域特质：${player.board.ability}${yanzhaoPoints ? `（当前战争额外分 +${yanzhaoPoints}）` : ""}`);
  }
  if (color === "red" && hasTwoPointDefense(player)) {
    sources.push("区域特质：邻国武备必须至少比你高 2 点，才算战胜你。");
  }
  return sources;
}

function filterResourceMap(resourceMap = {}, allowedResources = []) {
  return Object.fromEntries(
    Object.entries(resourceMap).filter(([resource, amount]) => allowedResources.includes(resource) && amount)
  );
}

function militaryTokenSources(player) {
  const tokens = player.militaryTokens || [];
  if (!tokens.length) return ["军事分：尚未结算或暂无记录。"];
  const counts = {};
  for (const token of tokens) counts[token] = (counts[token] || 0) + 1;
  const parts = Object.entries(counts)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([token, count]) => `${Number(token) > 0 ? "+" : ""}${token}×${count}`);
  return [`军事分记录：${parts.join("、")}｜当前军事总分 ${sum(tokens)}`];
}

function commercialBonusSources(player) {
  ensurePlayerLogCollections(player);
  return player.coinLedger.length
    ? player.coinLedger.slice().reverse().map((entry) => formatCoinLedgerEntry(entry))
    : [];
}

function slotScoreNotes(player, color) {
  if (color === "purple") {
    return getBuiltCards(player)
      .filter((card) => card.color === "purple")
      .map((card) => {
        if (card.resolvedPoints) {
          return `公会已结算：${card.name}｜已结算加分 ${card.resolvedPoints}`;
        }
        if (card.guildScore) {
          return `公会预计：${card.name}｜当前预计终局分 ${calculatePurpleScore(player, card)}`;
        }
        return `未自动计算：${card.name}：${card.effect || "暂无说明"}`;
      });
  }
  if (color === "yellow") {
    return [];
  }
  return [];
}

function formatScienceMap(science = {}) {
  return SCIENCE_NAMES
    .filter((symbol) => science[symbol])
    .map((symbol) => formatIconLabel(symbol, science[symbol]))
    .join("、") || "暂无";
}

function emptyBonusText(color) {
  return {
    brown: "暂无额外资源来源。",
    gray: "暂无额外资源来源。",
    red: "暂无额外武备来源。",
    green: "暂无额外学术来源。",
    blue: "暂无额外文明分来源。",
    yellow: "暂无铜钱明细。",
    purple: "暂无额外公会来源。"
  }[color] || "暂无额外加成来源。";
}

function renderCoinLedgerList(player) {
  ensurePlayerLogCollections(player);
  if (!player.coinLedger.length) return '<p class="hint">暂无铜钱明细</p>';
  return `
    <div class="detail-list">
      ${player.coinLedger.slice().reverse().map((entry) => `
        <div class="detail-item">
          <p>${formatCoinLedgerEntry(entry)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function openCoinLedgerDialog(playerId = currentPlayer()?.id) {
  const player = state.players.find((entry) => entry.id === playerId) || currentPlayer();
  if (!player) return;
  $("coinLedgerDialogTitle").textContent = `${player.name}｜铜钱明细`;
  $("coinLedgerDialogBody").innerHTML = `
    <div class="player-detail-heading">
      <div>
        <h4>${player.name}｜${player.board.name}</h4>
        <p class="hint">当前铜钱：${player.coins}｜总铜钱记录：${(player.coinLedger || []).length} 条</p>
      </div>
    </div>
    <section class="detail-group">
      <h5>铜钱明细</h5>
      ${renderCoinLedgerList(player)}
    </section>
  `;
  document.body.classList.add("dialog-open");
  $("coinLedgerDialog").showModal();
}

function closeCoinLedgerDialog() {
  if ($("coinLedgerDialog")?.open) $("coinLedgerDialog").close();
}

function handleCoinLedgerDialogBackdrop(event) {
  const dialog = $("coinLedgerDialog");
  const rect = dialog.getBoundingClientRect();
  const clickedInside = rect.top <= event.clientY
    && event.clientY <= rect.top + rect.height
    && rect.left <= event.clientX
    && event.clientX <= rect.left + rect.width;
  if (!clickedInside) closeCoinLedgerDialog();
}

function formatCoinLedgerEntry(entry) {
  if (!entry) return "";
  const sign = entry.type === "spend" ? "-" : "+";
  const amount = entry.amount ?? entry.coins ?? 0;
  const phaseLabel = entry.turn ? `Age ${entry.age} 第${entry.turn}轮` : entry.age ? `Age ${entry.age}` : "记录";
  return `${sign}${compactIcon("铜钱")} ×${amount}｜${phaseLabel}｜${entry.description}`;
}

function handleBuiltSlotDialogBackdrop(event) {
  const dialog = $("builtSlotDialog");
  const rect = dialog.getBoundingClientRect();
  const clickedInside = rect.top <= event.clientY
    && event.clientY <= rect.top + rect.height
    && rect.left <= event.clientX
    && event.clientX <= rect.left + rect.width;
  if (!clickedInside) closeBuiltSlotDialog();
}

function renderReadonlyCard(card, owner = null) {
  const holder = owner || currentPlayer() || state.players[0];
  const extra = [];
  if (card.color === "yellow") {
    if (card.resolvedCoins > 0) extra.push(`<p>已触发：+${formatIconLabel("铜钱", card.resolvedCoins)}</p>`);
    if (card.resolvedPoints > 0) extra.push(`<p>已结算分数：+${card.resolvedPoints}</p>`);
    if (card.resolvedReason) extra.push(`<p>触发条件：${card.resolvedReason}</p>`);
    if (card.commerceScore) extra.push(`<p>当前商业分：${commercialScore(holder, card)}</p>`);
  }
  if (card.color === "purple") {
    if (card.resolvedPoints > 0) extra.push(`<p>已结算加分：+${card.resolvedPoints}</p>`);
    if (card.resolvedCoins > 0) extra.push(`<p>已结算${formatIconLabel("铜钱")}：+${card.resolvedCoins}</p>`);
    if (card.guildScore) extra.push(`<p>当前预计终局分：+${calculatePurpleScore(holder, card)}</p>`);
    else if (!card.resolvedPoints && !card.resolvedCoins) extra.push(`<p>当前预计终局分：暂无法自动计算</p>`);
  }
  return `
    <article class="card readonly-card ${card.color}">
      ${renderCardCostRail(card)}
      ${renderCardChainIcons(card)}
      ${renderMobileCardSummary(card, holder)}
      <h4 class="card-name">${card.name}</h4>
      <div class="card-face">
        <div class="card-output-stage">
          ${renderCardMainOutput(card)}
        </div>
      </div>
      <div class="card-alerts readonly-card-extra">
        ${extra.join("")}
      </div>
    </article>
  `;
}

function renderDiscardPileEntry() {
  const entry = $("discardPileEntry");
  if (!entry) return;
  const count = Array.isArray(state.discardPile) ? state.discardPile.length : 0;
  entry.innerHTML = `
    <span class="discard-pile-entry__icon" aria-hidden="true">▤</span>
    <span class="discard-pile-entry__text">
      <strong>弃牌堆</strong>
      <small>${count} 张</small>
    </span>
  `;
  entry.setAttribute("aria-label", `查看弃牌堆，当前 ${count} 张`);
}

function discardPileSourceText(entry) {
  if (!entry) return "";
  if (entry.discardReason === "ageEnd") return `${discardAgeLabel(entry.discardedAge)} 时代末弃置`;
  const playerName = entry.discardedByPlayerName || "玩家";
  return `由 ${playerName} 售出`;
}

function discardCardMetaText(card) {
  const parts = [];
  if (card.age || card.discardedAge) parts.push(discardAgeLabel(card.age || card.discardedAge));
  if (card.color) parts.push(slotTitle(card.color));
  if (card.type) parts.push(card.type);
  return parts.join("｜") || "卡牌";
}

function renderDiscardPileCard(entry) {
  const picker = state.discardPilePicker;
  const player = picker?.playerId ? state.players.find((item) => item.id === picker.playerId) : null;
  const availability = picker ? canBuildCardFromDiscardPile(player, entry, picker.options || {}) : { ok: false, reason: "" };
  const cardKey = entry.discardPileId || entry.id;
  const isSelected = Boolean(picker && picker.selectedCardId === cardKey);
  const selectableClass = picker ? (availability.ok ? " selectable discard-choice-card" : " disabled discard-choice-card") : "";
  const choiceAttrs = picker && availability.ok
    ? `role="button" tabindex="0" aria-pressed="${isSelected ? "true" : "false"}" onclick="chooseDiscardPileCard('${cardKey}')" onkeydown="handleDiscardPileCardKeydown(event, '${cardKey}')"`
    : "";
  const action = picker && availability.ok
    ? (isSelected ? '<span class="discard-choice-selected-badge">已选中</span>' : "")
    : picker
      ? `<span class="discard-choice-disabled-reason">${escapeHtml(availability.reason || "不可选择")}</span>`
      : "";
  return `
    <article class="discard-pile-card ${entry.color || ""}${selectableClass}${isSelected ? " is-selected" : ""}" ${choiceAttrs}>
      <div class="discard-pile-mobile-card">
        ${renderMobileCardSummary(entry)}
      </div>
      <div class="discard-pile-card__meta">
        <span>${escapeHtml(discardCardMetaText(entry))}</span>
        <span>${formatCost(entry.cost || [])}</span>
      </div>
      ${renderReadonlyCard(entry, player || currentPlayer() || state.players[0])}
      <div class="discard-pile-card__source">
        <span>${escapeHtml(discardPileSourceText(entry))}</span>
        <span>${escapeHtml(discardReasonLabel(entry.discardReason))}</span>
      </div>
      ${action}
    </article>
  `;
}

function renderDiscardPileDialog() {
  const pile = normalizeDiscardPile(state.discardPile || [])
    .slice()
    .sort((a, b) => (b.discardedAt || 0) - (a.discardedAt || 0));
  const picker = state.discardPilePicker;
  if ($("discardPileDialogTitle")) {
    $("discardPileDialogTitle").textContent = picker?.title || "公开弃牌堆";
  }
  const selectedEntry = picker?.selectedCardId
    ? pile.find((entry) => entry.id === picker.selectedCardId || entry.discardPileId === picker.selectedCardId)
    : null;
  const confirmButtonHtml = picker
    ? `
      <div class="discard-choice-toolbar">
        <div>
          <p class="eyebrow">河东弃牌堆选择</p>
          <h3>${escapeHtml(picker.title || "从弃牌堆选择卡牌")}</h3>
          <p class="hint">${escapeHtml(picker.options?.description || "点击一张牌选中，再点击确认。")}</p>
        </div>
        <button id="discardChoiceConfirmButton" class="primary discard-choice-confirm" ${selectedEntry ? "" : "disabled"} onclick="confirmDiscardPilePickerSelection()">${escapeHtml(picker.options?.confirmLabel || "确认选择")}</button>
      </div>
    `
    : "";
  const bodyHtml = `
    ${confirmButtonHtml}
    <div class="discard-pile-dialog-intro">
      <div class="discard-pile-scroll-icon" aria-hidden="true">▤</div>
      <div>
        <p class="eyebrow">${picker ? "选择模式" : "公开信息"}</p>
        <h3>${pile.length} 张卡牌</h3>
        <p class="hint">${picker ? "可选择的卡牌会高亮；不可选择的卡牌会说明原因。" : "所有玩家都可以随时查看，最新进入弃牌堆的卡牌排在最前。"}</p>
      </div>
    </div>
    ${pile.length
      ? `<div class="discard-pile-grid${picker ? " discard-choice-grid" : ""}">${pile.map((entry) => renderDiscardPileCard(entry)).join("")}</div>`
      : '<p class="discard-pile-empty">弃牌堆暂无卡牌。</p>'}
  `;
  if ($("discardPileDialogBody")) $("discardPileDialogBody").innerHTML = bodyHtml;
  return bodyHtml;
}

function openDiscardPileDialog() {
  state.discardPilePicker = null;
  renderDiscardPileDialog();
  document.body.classList.add("dialog-open");
  $("discardPileDialog").showModal();
}

function openDiscardPilePicker(player, options = {}) {
  if (!player) return;
  state.discardPilePicker = {
    playerId: player.id,
    title: options.title || "从弃牌堆选择卡牌",
    selectedCardId: "",
    options
  };
  renderDiscardPileDialog();
  document.body.classList.add("dialog-open");
  $("discardPileDialog").showModal();
}

function closeDiscardPileDialog() {
  if ($("discardPileDialog")?.open) $("discardPileDialog").close();
}

function handleDiscardPileDialogBackdrop(event) {
  const dialog = $("discardPileDialog");
  const rect = dialog.getBoundingClientRect();
  const clickedInside = rect.top <= event.clientY
    && event.clientY <= rect.top + rect.height
    && rect.left <= event.clientX
    && event.clientX <= rect.left + rect.width;
  if (!clickedInside) closeDiscardPileDialog();
}

function chooseDiscardPileCard(cardId) {
  const picker = state.discardPilePicker;
  if (!picker) return;
  const player = state.players.find((item) => item.id === picker.playerId);
  const entry = state.discardPile.find((card) => card.id === cardId || card.discardPileId === cardId);
  const availability = canBuildCardFromDiscardPile(player, entry, picker.options || {});
  if (!availability.ok) {
    renderDiscardPileDialog();
    return;
  }
  picker.selectedCardId = entry.discardPileId || entry.id;
  renderDiscardPileDialog();
}

function handleDiscardPileCardKeydown(event, cardId) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  chooseDiscardPileCard(cardId);
}

async function confirmDiscardPilePickerSelection() {
  const picker = state.discardPilePicker;
  if (!picker?.selectedCardId) return;
  const player = state.players.find((item) => item.id === picker.playerId);
  const entry = state.discardPile.find((card) => card.id === picker.selectedCardId || card.discardPileId === picker.selectedCardId);
  const availability = canBuildCardFromDiscardPile(player, entry, picker.options || {});
  if (!availability.ok) {
    renderDiscardPileDialog();
    return;
  }
  if (typeof picker.options?.onConfirm === "function") {
    await picker.options.onConfirm(entry, player);
    return;
  }
  if (typeof picker.options?.onSelect === "function") {
    await picker.options.onSelect(entry, player);
    return;
  }
  const result = buildCardFromDiscardPile(player, picker.selectedCardId, picker.options || {});
  if (result.ok) closeDiscardPileDialog();
  else renderDiscardPileDialog();
}

function selectDiscardPileCard(cardId) {
  chooseDiscardPileCard(cardId);
}

function slotTitle(color) {
  return {
    brown: "基础资源",
    gray: "高级资源",
    blue: "文明",
    red: "武备",
    green: "学术",
    yellow: "商业",
    purple: "公会"
  }[color] || "卡牌";
}

function mobileCardShortOutput(card) {
  const resourceChoice = resolveCardResourceChoice(card);
  if (resourceChoice.length) {
    return `${resourceChoice.map((resource) => formatIconOnlyAmount(resource, 1)).join('<span class="mobile-card-separator">/</span>')} <span class="mobile-card-note">${resourceChoice.length}选一</span>`;
  }
  const produces = summarizeProduces(card.produces);
  if (produces.length) {
    return produces.map((item) => formatIconOnlyAmount(item.name, item.amount)).join("");
  }
  const shields = card.shields || card.military || 0;
  const parts = [];
  if (card.points > 0) parts.push(`${formatIconOnlyAmount("计分")}<span class="mobile-card-note">+${card.points}文明分</span>`);
  if (card.coins > 0) parts.push(`${formatIconOnlyAmount("铜钱")}<span class="mobile-card-note">+${card.coins}</span>`);
  if (shields > 0) parts.push(`${formatIconOnlyAmount("武备")}<span class="mobile-card-note">+${shields}</span>`);
  if (card.scienceSymbol) parts.push(`${formatIconOnlyAmount(card.scienceSymbol)}<span class="mobile-card-note">${card.scienceSymbol}</span>`);
  if (parts.length) return parts.join("");
  const label = cardOutputLabel(card).replace(/^effect:\s*/i, "");
  return `<span class="mobile-card-effect">${label}</span>`;
}

function renderMobileCardChainLinks(card) {
  if (!hasPreviousCardLink(card) && !hasNextCardLink(card)) return "";
  return `
    <div class="mobile-card-line mobile-card-chain-row">
      <span class="mobile-card-label">链接</span>
      <span class="mobile-card-value mobile-card-chain-value">
        ${hasPreviousCardLink(card) ? `
          <span class="mobile-card-chain-group mobile-card-chain-group--from" aria-label="前置链接">
            <span class="mobile-card-chain-text">前置</span>
            ${cardLinkBadges(card, "card-link-badges--inline", "prev")}
          </span>
        ` : ""}
        ${hasNextCardLink(card) ? `
          <span class="mobile-card-chain-group mobile-card-chain-group--to" aria-label="后续链接">
            <span class="mobile-card-chain-text">后续</span>
            ${cardLinkBadges(card, "card-link-badges--inline", "next")}
          </span>
        ` : ""}
      </span>
    </div>
  `;
}

function renderMobileChainBuildCostMarker(card) {
  return hasPreviousCardLink(card) ? cardLinkBadges(card, "card-link-badges--inline", "prev") : "";
}

function renderMobileCardSummary(card, player = currentPlayer()) {
  return `
    <div class="mobile-card-summary">
      <div class="mobile-card-head">
        <h4 class="mobile-card-name">${card.name}</h4>
        <span class="mobile-card-meta"><span class="mobile-card-type">${slotTitle(card.color)}</span></span>
      </div>
      <div class="mobile-card-line">
        <span class="mobile-card-label">成本</span>
        <span class="mobile-card-value mobile-card-value--cost">${formatCost(card.cost)}</span>
      </div>
      ${renderMobileCardChainLinks(card)}
      <div class="mobile-card-line">
        <span class="mobile-card-label">收益</span>
        <span class="mobile-card-value">${mobileCardShortOutput(card)}</span>
      </div>
    </div>
  `;
}

function renderHand(player) {
  if ($("current-hand")) $("current-hand").innerHTML = "";
  if ($("handCards")) $("handCards").innerHTML = "";
  renderDiscardPileEntry();
  const localPlayerId = localStorage.getItem("playerId") || localStorage.getItem("jiuzhou.playerId") || state.online.localPlayerId;
  const roomPlayers = state.online.roomData?.players || {};
  const matchedRoomPlayer = roomPlayers[localPlayerId] || null;
  const matchedGamePlayer = state.online.roomData?.game?.players?.[localPlayerId] || null;
  const roomIsBehindLocal = state.mode === "online"
    && state.online.roomData
    && compareTurnState(onlineRoomTurnState(), currentTurnState()) < 0;
  const rawHand = state.mode === "online"
    ? (roomIsBehindLocal
      ? player.hand
      : matchedRoomPlayer && Object.prototype.hasOwnProperty.call(matchedRoomPlayer, "hand")
      ? matchedRoomPlayer.hand
      : matchedGamePlayer?.hand)
    : player.hand;
  const normalizedHand = normalizeHand(rawHand);
  if (state.mode === "online") {
    if (isDebugEnabled("online")) {
      console.log("[RENDER_HAND] localPlayerId", localPlayerId);
      console.log("[RENDER_HAND] raw hand", rawHand);
      console.log("[RENDER_HAND] normalized hand array", normalizedHand);
      console.log("[RENDER_HAND] hand length", normalizedHand.length);
    }
    const debugPanel = $("multiplayerDebugPanel");
    if (debugPanel) {
      debugPanel.textContent = "";
      debugPanel.classList.add("hidden");
    }
  }
  player.hand = normalizedHand;
  const seventhCardPendingIds = state.seventhCard?.pendingPlayerIds || state.seventhCardPlayers || [];
  const inSeventhCardStage = state.phase === "seventh-card";
  const isSeventhCardPlayer = inSeventhCardStage && seventhCardPendingIds.includes(player.id);
  if (state.phase === "overseas-trade-choice") {
    if ($("current-hand")) $("current-hand").innerHTML = "";
    $("handCards").innerHTML = "";
    return;
  }
  if (state.phase === "liaodong-guard-choice") {
    if ($("current-hand")) $("current-hand").innerHTML = "";
    $("handCards").innerHTML = "";
    return;
  }
  if (state.phase === "liaodong-resource-choice") {
    if ($("current-hand")) $("current-hand").innerHTML = "";
    $("handCards").innerHTML = "";
    return;
  }
  if (state.phase === "guanzhong-resource-choice") {
    if ($("current-hand")) $("current-hand").innerHTML = "";
    $("handCards").innerHTML = "";
    return;
  }
  if (state.phase === "hedong-discard-choice") {
    if ($("current-hand")) $("current-hand").innerHTML = "";
    $("handCards").innerHTML = "";
    return;
  }
  if (state.mode === "online" && inSeventhCardStage && !isSeventhCardPlayer) {
    renderActionMessage("等待河洛玩家处理第七张牌……", false);
    if ($("current-hand")) $("current-hand").innerHTML = "";
    $("handCards").innerHTML = "";
    return;
  }
  if (state.mode === "online" && state.phase === "game" && normalizedHand.length === 0) {
    diagnoseMissingOnlineHand(player);
    renderActionMessage("未找到你的手牌，请刷新或重新加入房间", true);
    if ($("current-hand")) $("current-hand").innerHTML = "";
    $("handCards").innerHTML = "";
    return;
  }
  const chosen = state.selected[player.id];
  const pending = state.pendingChoice[player.id];
  const aiTurn = state.mode === "hotseat" && isAI(player);
  $("actionArea").innerHTML = "";
  $("actionArea").classList.add("compact");

  const handHtml = normalizedHand.map((card) => {
    const build = canUseFreeFirstCardBuild(player, state.age)
      ? { ok: true, requiresTrade: false, message: "" }
      : buildTradeOptions(card, player, getLeftNeighbor(player), getRightNeighbor(player));
    const wonderStage = player.board.stages[player.stagesBuilt];
    const wonderComplete = !wonderStage;
    const wonder = wonderStage
      ? buildTradeOptions({
            purpose: "wonder",
            action: "wonder",
            card,
            cardId: card.id,
            stageIndex: player.stagesBuilt,
            stageName: wonderStage.name,
            boardName: player.board.name,
            cost: wonderStage.cost || {}
          }, player, getLeftNeighbor(player), getRightNeighbor(player))
      : { ok: false, requiresTrade: false, message: "区域已全部建成。" };
    const selected = (chosen || pending)?.cardId === card.id;
    const activeAction = selected ? (chosen || pending)?.action : "";
    const cardLocked = Boolean(chosen) || aiTurn;
    const buildDisabled = cardLocked;
    const wonderDisabled = cardLocked;
    return `
      <article class="card ${card.color} ${selected ? "selected" : ""}">
        ${renderCardCostRail(card)}
        ${renderCardChainIcons(card)}
        ${renderMobileCardSummary(card, player)}
        <h4 class="card-name">${card.name}</h4>
        <div class="card-face">
          <div class="card-output-stage">
            ${renderCardMainOutput(card)}
          </div>
        </div>
        <div class="action-buttons">
          <button class="${activeAction === "build" ? "active" : ""}" ${buildDisabled ? "disabled" : ""} onclick="chooseAction('${card.id}', 'build')">建造</button>
          <button class="${activeAction === "sell" ? "active" : ""}" ${cardLocked ? "disabled" : ""} onclick="chooseAction('${card.id}', 'sell')">售出</button>
          <button class="${activeAction === "wonder" ? "active" : ""}" ${wonderDisabled ? "disabled" : ""} onclick="chooseAction('${card.id}', 'wonder')">建区域</button>
        </div>
      </article>
    `;
  }).join("");
  if ($("current-hand")) {
    $("current-hand").innerHTML = handHtml;
    $("current-hand").classList.toggle("hidden", state.mode !== "online");
  }
  $("handCards").innerHTML = state.mode === "online" ? "" : handHtml;
  if (state.mode === "online" && isDebugEnabled()) {
    console.log("[HAND_APPLY] rendered hand ids", normalizedHand.map((card) => card?.id).filter(Boolean));
  }
  if (state.mode === "online" && inSeventhCardStage) {
    if (chosen) renderActionMessage("已确认第七张牌行动，等待其他玩家。", false);
    else renderActionMessage("河洛能力：你可以使用本时代最后一张牌。", false);
  }
}

function renderPendingChoice(player, choice) {
  const cardName = findCardName(choice.cardId);
  const textByAction = {
    build: `当前选择：建造《${cardName}》`,
    sell: `当前选择：卖掉《${cardName}》换 ${formatIconLabel("铜钱", 3)}`,
    wonder: `当前选择：用《${cardName}》建设区域板`
  };
  $("actionArea").innerHTML = `
    <div class="pending-choice">
      <strong>${textByAction[choice.action] || "当前选择"}</strong>
      ${choice.freeFirstCardEachAgeUsed ? "<p>阶段效果：本时代第一张卡牌免费建造。</p>" : ""}
      ${choice.tradePlan ? `<p>${tradePlanText(choice.tradePlan)}</p>` : ""}
      <div class="pending-actions">
        <button class="primary" onclick="confirmPendingChoice()">确认行动</button>
        <button class="ghost" onclick="cancelPendingChoice()">取消选择</button>
      </div>
    </div>
  `;
}

function renderScienceChoicePhaseUI(player) {
  if (state.phase !== "end-science-choice") {
    closeScienceChoiceDialog();
    return;
  }
  const pendingPlayers = pendingScienceChoicePlayers();
  const currentChoicePlayer = currentScienceChoicePlayer();
  const sourceText = getChooseScienceAtEndSourceText(currentChoicePlayer);
  if (!pendingPlayers.length || !currentChoicePlayer) {
    closeScienceChoiceDialog();
    return;
  }
  if (canLocalPlayerChooseScience(currentChoicePlayer)) {
    $("actionArea").classList.remove("compact");
    $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>${sourceText.promptTitle}</strong>
        <p>${sourceText.promptDescription}</p>
      </div>
    `;
    renderScienceChoiceDialog(currentChoicePlayer);
    return;
  }
  closeScienceChoiceDialog();
  $("actionArea").classList.remove("compact");
  $("actionArea").innerHTML = `
    <div class="pending-choice">
      <strong>${sourceText.waitingTitle}</strong>
      <p>${currentChoicePlayer.name} 完成选择后，将继续终局结算。</p>
    </div>
  `;
}

function renderLiaodongGuardChoicePhaseUI(player) {
  if (state.phase !== "liaodong-guard-choice") return;
  const currentChoicePlayer = currentLiaodongGuardChoicePlayer();
  if (!currentChoicePlayer) {
    $("actionArea").classList.remove("compact");
    $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>等待辽东玩家选择本时代警戒方向。</strong>
        <p>选择完成后，将进入本时代选牌。</p>
      </div>
    `;
    return;
  }
  $("actionArea").classList.remove("compact");
  if (!canLocalPlayerChooseLiaodongGuard(currentChoicePlayer)) {
    $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>等待辽东玩家选择本时代警戒方向。</strong>
        <p>${currentChoicePlayer.name} 需要先选择警戒左邻或右邻。</p>
      </div>
    `;
    return;
  }
  $("actionArea").innerHTML = `
    <div class="pending-choice">
      <strong>辽东技能：请选择本时代警戒方向</strong>
      <p>警戒方向上的邻国必须武备至少比你高 3 点，才算战胜辽东。</p>
      <div class="pending-actions">
        <button class="primary" onclick="chooseLiaodongGuardSide('left')">警戒左邻</button>
        <button class="primary" onclick="chooseLiaodongGuardSide('right')">警戒右邻</button>
      </div>
    </div>
  `;
}

function renderLiaodongResourceChoicePhaseUI(player) {
  if (state.phase !== "liaodong-resource-choice") return;
  const currentChoicePlayer = currentLiaodongResourceChoicePlayer();
  if (!currentChoicePlayer) {
    $("actionArea").classList.remove("compact");
    $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>等待辽东玩家选择屯垦资源。</strong>
        <p>选择完成后，将继续下一阶段。</p>
      </div>
    `;
    return;
  }
  $("actionArea").classList.remove("compact");
  if (!canLocalPlayerChooseLiaodongResource(currentChoicePlayer)) {
    $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>等待辽东玩家选择屯垦资源。</strong>
        <p>${currentChoicePlayer.name} 本时代未获得战败标记，可获得 1 张基础资源牌。</p>
      </div>
    `;
    return;
  }
  const chosen = currentChoicePlayer.pendingLiaodongResourceChoice?.choice || "";
  $("actionArea").innerHTML = `
    <div class="pending-choice">
      <strong>辽东技能：本时代未获得战败标记，选择 1 张基础资源牌</strong>
      <p>所选资源牌会永久加入基础资源卡槽，可与之后的建造一起使用。</p>
      <div class="resource-choice-buttons">
        ${BASIC_RESOURCES.map((resource) => `
          <button type="button" class="${chosen === resource ? "active" : ""}" onclick="chooseLiaodongResource('${resource}')">
            ${formatIconLabel(resource)}
          </button>
        `).join("")}
      </div>
      <div class="pending-actions">
        <button class="primary" ${BASIC_RESOURCES.includes(chosen) ? "" : "disabled"} onclick="confirmLiaodongResourceChoice()">确认获得资源牌</button>
      </div>
    </div>
  `;
}

function renderGuanzhongResourceChoicePhaseUI(player) {
  if (state.phase !== "guanzhong-resource-choice") return;
  if (recoverStaleGuanzhongResourceChoicePhase(false)) {
    $("actionArea").classList.remove("compact");
    $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>关中资源选择已完成。</strong>
        <p>正在进入当前时代。</p>
      </div>
    `;
    setTimeout(() => renderGame(), 0);
    return;
  }
  const pendingPlayers = pendingGuanzhongResourceChoicePlayers();
  if (!pendingPlayers.length) {
    $("actionArea").classList.remove("compact");
    $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>关中资源选择已完成。</strong>
        <p>正在同步进入下一阶段。</p>
      </div>
    `;
    requestOnlineGuanzhongResourceChoiceResolution();
    return;
  }
  const currentChoicePlayer = currentGuanzhongResourceChoicePlayer();
  if (!currentChoicePlayer) {
    $("actionArea").classList.remove("compact");
    $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>等待关中玩家选择基础资源。</strong>
        <p>选择完成后，将进入下一时代。</p>
      </div>
    `;
    return;
  }
  const pending = guanzhongChoiceState(currentChoicePlayer);
  if (!pending) return;
  $("actionArea").classList.remove("compact");
  if (!canLocalPlayerChooseGuanzhongResource(currentChoicePlayer)) {
    $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>等待关中玩家选择基础资源。</strong>
        <p>${currentChoicePlayer.name} 需要选择 ${pending.count} 张基础资源牌。</p>
      </div>
    `;
    return;
  }
  const choiceRows = Array.from({ length: pending.count }, (_, index) => {
    const chosen = pending.choices[index] || "";
    return `
      <div class="guanzhong-choice-row">
        <strong>第 ${index + 1} 张资源牌${chosen ? `：${formatIconLabel(chosen)}` : ""}</strong>
        <div class="resource-choice-buttons">
          ${BASIC_RESOURCES.map((resource) => `
            <button type="button" class="${chosen === resource ? "active" : ""}" onclick="chooseGuanzhongResource(${index}, '${resource}')">
              ${formatIconLabel(resource)}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
  const ready = pending.choices.length >= pending.count && pending.choices.slice(0, pending.count).every((resource) => BASIC_RESOURCES.includes(resource));
  $("actionArea").innerHTML = `
    <div class="pending-choice">
      <strong>关中技能：战胜 ${pending.count} 方邻国，选择 ${pending.count} 张基础资源牌</strong>
      <p>可以重复选择，确认后会加入基础资源卡槽。</p>
      <div class="guanzhong-choice-list">${choiceRows}</div>
      <div class="pending-actions">
        <button class="primary" ${ready ? "" : "disabled"} onclick="confirmGuanzhongResourceChoices()">确认获得资源牌</button>
      </div>
    </div>
  `;
}

function renderHedongDiscardBuildChoicePhaseUI(player) {
  if (state.phase !== "hedong-discard-choice") return;
  const currentChoicePlayer = currentHedongDiscardBuildChoicePlayer();
  if (!currentChoicePlayer) {
    $("actionArea").classList.remove("compact");
    $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>等待河东玩家处理盐铁官营。</strong>
        <p>选择完成后，将继续正常流程。</p>
      </div>
    `;
    return;
  }
  $("actionArea").classList.remove("compact");
  const legalCards = normalizeDiscardPile(state.discardPile || [])
    .filter((card) => canBuildCardFromDiscardPile(currentChoicePlayer, card).ok);
  const emptyText = !state.discardPile?.length
    ? "弃牌堆暂无可建造卡牌。"
    : !legalCards.length
      ? "弃牌堆中暂无可合法建造的卡牌。"
      : "";
  if (!canLocalPlayerChooseHedongDiscardBuild(currentChoicePlayer)) {
    $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>等待河东玩家从弃牌堆免费建造。</strong>
        <p>${currentChoicePlayer.name} 完成盐铁官营后，将继续游戏。</p>
      </div>
    `;
    return;
  }
  $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>盐铁官营：从公开弃牌堆选择 1 张牌免费建造。</strong>
      <p>${emptyText || "点击一张弃牌堆卡牌选中，再点击确认选择。"}</p>
      <div class="pending-actions">
        <button class="primary" onclick="openHedongDiscardBuildPicker()">打开弃牌堆</button>
        <button class="ghost" onclick="confirmHedongDiscardBuildChoice('')">跳过并继续</button>
      </div>
    </div>
  `;
  const roundKey = hedongDiscardBuildRoundKey(currentChoicePlayer);
  if (roundKey && !state.hedongDiscardChoice?.openedRoundKeys?.[roundKey] && !$("discardPileDialog")?.open) {
    if (!state.hedongDiscardChoice || typeof state.hedongDiscardChoice !== "object") state.hedongDiscardChoice = {};
    if (!state.hedongDiscardChoice.openedRoundKeys || typeof state.hedongDiscardChoice.openedRoundKeys !== "object") {
      state.hedongDiscardChoice.openedRoundKeys = {};
    }
    state.hedongDiscardChoice.openedRoundKeys[roundKey] = true;
    openHedongDiscardBuildPicker();
  }
}

function openHedongDiscardBuildPicker() {
  const player = currentHedongDiscardBuildChoicePlayer();
  if (!player || !canLocalPlayerChooseHedongDiscardBuild(player)) return;
  openDiscardPilePicker(player, {
    title: "河东 · 从弃牌堆选择一张牌",
    description: "点击一张牌选中，再点击确认。",
    confirmLabel: "确认选择",
    onConfirm: (entry) => confirmHedongDiscardBuildChoice(entry.id)
  });
}

function renderOverseasTradeChoicePhaseUI(player) {
  if (state.phase !== "overseas-trade-choice") {
    if ($("overseasTradeDialog")?.open) $("overseasTradeDialog").close();
    return;
  }
  const currentChoicePlayer = currentOverseasTradeChoicePlayer();
  if (!currentChoicePlayer) {
    if ($("overseasTradeDialog")?.open) $("overseasTradeDialog").close();
    return;
  }
  if (canLocalPlayerChooseOverseasTrade(currentChoicePlayer)) {
    $("actionArea").classList.remove("compact");
    $("actionArea").innerHTML = `
      <div class="pending-choice">
        <strong>岭南第一阶段已完成：请选择海上贸易对象</strong>
        <p>选择完成后，本局双方可按普通规则互相购买资源，但黄牌购买优惠不适用于这条海上贸易。</p>
      </div>
    `;
    renderOverseasTradeDialog(currentChoicePlayer);
    return;
  }
  if ($("overseasTradeDialog")?.open) $("overseasTradeDialog").close();
  $("actionArea").classList.remove("compact");
  $("actionArea").innerHTML = `
    <div class="pending-choice">
      <strong>等待岭南玩家选择海上贸易对象。</strong>
      <p>${currentChoicePlayer.name} 完成选择后，将继续本轮流程。</p>
    </div>
  `;
}

function tradePlanText(tradePlan) {
  const parts = [];
  const groupedSides = Object.keys(tradePlan)
    .filter((key) => ["left", "right", "overseas"].includes(key));
  for (const side of groupedSides) {
    const resources = tradePlan[side] || {};
    if (!Object.keys(resources).length) continue;
    const formatted = formatResourceMap(resources);
    parts.push(`从${tradeSideLabel(side)}购买：${formatted}`);
  }
  const details = (tradePlan.purchases || []).map((item) => {
    const priceText = item.side === "overseas"
      ? `${formatIconLabel(item.resource, item.amount)}｜${formatIconLabel("铜钱", item.unitPrice)}`
      : item.discountSource
        ? `${formatIconLabel(item.resource, item.amount)}｜距离${item.distance}｜${formatIconLabel("铜钱", item.unitPrice)}｜优惠来源：${item.discountSource}`
        : `${formatIconLabel(item.resource, item.amount)}｜距离${item.distance}｜${formatIconLabel("铜钱", item.unitPrice)}`;
    return `${tradeSideLabel(item.side)}：${priceText}`;
  });
  if (details.length) parts.push(...details);
  const sideCostText = groupedSides
    .filter((side) => (tradePlan.sideCosts?.[side] || 0) > 0)
    .map((side) => `${tradeSideLabel(side)}获得 ${formatIconLabel("铜钱", tradePlan.sideCosts?.[side] || 0)}`)
    .join("，");
  parts.push(`交易费用：${formatIconLabel("铜钱", tradePlan.totalCost)}${sideCostText ? `，${sideCostText}` : ""}`);
  return parts.join("；");
}

function cardsForAge(age, playerCount) {
  const ageCards = state.cards?.ages?.[String(age)] || [];
  const expected = playerCount * 7;
  if (Number(age) === 3) {
    const nonGuild = ageCards.filter((card) => Number(card.age || age) === 3 && !card.guild && card.type !== "guild");
    const guilds = ageCards.filter((card) => Number(card.age || age) === 3 && (card.guild || card.type === "guild"));
    const baseDeck = nonGuild.filter((card) => card.minPlayers <= playerCount);
    const guildCount = Math.min(guilds.length, playerCount + (state.cards?.guildSelection?.countOffset || 2));
    const selectedGuilds = shuffle(guilds).slice(0, guildCount);
    const deck = [...baseDeck, ...selectedGuilds];
    if (deck.length < expected) {
      const selectedIds = new Set(deck.map((card) => card.id));
      const fillers = nonGuild
        .filter((card) => !selectedIds.has(card.id))
        .sort((a, b) => a.minPlayers - b.minPlayers || String(a.sourceId).localeCompare(String(b.sourceId)))
        .slice(0, expected - deck.length);
      deck.push(...fillers);
    }
    if (deck.length !== expected) {
      throw new Error(`固定牌库数量不足，请检查 cards.js。Age ${age} 的 ${playerCount} 人局需要 ${expected} 张，实际 ${deck.length} 张。`);
    }
    return deck;
  }
  const deck = ageCards.filter((card) => Number(card.age || age) === Number(age) && card.minPlayers <= playerCount);
  if (deck.length !== expected) {
    throw new Error(`固定牌库数量不足，请检查 cards.js。Age ${age} 的 ${playerCount} 人局需要 ${expected} 张，实际 ${deck.length} 张。`);
  }
  return deck;
}

function validateDeckConfig() {
  for (const age of [1, 2, 3]) {
    for (const playerCount of [3, 4, 5, 6, 7]) {
      const deck = cardsForAge(age, playerCount);
      const colors = {};
      for (const card of deck) colors[card.color] = (colors[card.color] || 0) + 1;
      console.log(`Age ${age} ${playerCount}人局：${deck.length}/${playerCount * 7}，颜色分布`, colors);
    }
  }
}

function validateUniqueCards() {
  const ids = new Set();
  const requiredFields = ["cost", "produces", "points", "shields", "scienceSymbol", "tradeDiscount", "effect"];
  const numberedGeneratedNamePattern = /\d+-\d+$/;
  const forbiddenGeneratedNamePattern = /(史馆1-|票号1-|边堡1-|绿牌学术|红牌军事|蓝牌文明|棕牌资源)/;
  for (const [ageKey, cards] of Object.entries(state.cards?.ages || {})) {
    const greenSymbols = new Set();
    for (const card of cards) {
      if (ids.has(card.id)) throw new Error(`Duplicate card id: ${card.id}`);
      ids.add(card.id);
      if (numberedGeneratedNamePattern.test(card.name) || forbiddenGeneratedNamePattern.test(card.name)) {
        throw new Error(`发现模板编号牌名：${card.name}。固定牌库数量不足，请检查 cards.js。`);
      }
      if (!card.sourceId || !/^A[123]-\d{3}$/.test(card.sourceId)) {
        throw new Error(`Card ${card.id} is missing sourceId from fixed deck list`);
      }
      for (const field of requiredFields) {
        if (!(field in card)) throw new Error(`Card ${card.id} missing required field: ${field}`);
      }
      assertNoUndefined(card, card.id);
      if (!Array.isArray(card.cost)) throw new Error(`Card ${card.id} cost must be an array`);
      if (!Array.isArray(card.produces)) throw new Error(`Card ${card.id} produces must be an array`);
      if (card.produces.some((resource) => ADVANCED_RESOURCES.includes(resource)) && card.color !== "gray") {
        console.warn("[CARD_COLOR_WARNING]", card.id, card.name, "advanced resource should be gray");
      }
      if (card.produces.some((resource) => BASIC_RESOURCES.includes(resource)) && card.color !== "brown") {
        console.warn("[CARD_COLOR_WARNING]", card.id, card.name, "basic resource should be brown");
      }
      if ((card.color === "brown" || card.color === "gray") && card.cost.some((resource) => card.produces.includes(resource))) {
        console.warn("[CARD_COST_WARNING]", card.id, card.name, "cost overlaps produces:", card.cost.filter((resource) => card.produces.includes(resource)));
      }
      if ((card.color === "brown" || card.color === "gray") && !card.produces.length) {
        throw new Error(`资源牌 ${card.name} produces 为空`);
      }
      if (card.color !== "brown" && card.color !== "gray" && card.produces.length) {
        throw new Error(`Non-resource card ${card.id} must not produce resources`);
      }
      if (card.color === "green") {
        if (!card.scienceSymbol) throw new Error(`绿牌 ${card.name} scienceSymbol 为空`);
        greenSymbols.add(card.scienceSymbol);
      }
      if (card.color !== "green" && card.scienceSymbol !== null) {
        throw new Error(`Non-science card ${card.id} must have scienceSymbol null`);
      }
      if (card.color !== "red" && card.shields !== 0) {
        throw new Error(`Non-military card ${card.id} must have shields 0`);
      }
      if (Number(ageKey) === 3 && (card.color === "brown" || card.color === "gray")) {
        throw new Error(`Age III must not contain resource card ${card.id}`);
      }
    }
    if (greenSymbols.size <= 1) throw new Error(`Age ${ageKey} 绿牌 scienceSymbol 全部相同`);
  }
  console.log("[DECK_VALIDATION] fixed unique card deck ok", ids.size);
}

function assertNoUndefined(value, path) {
  if (value === undefined) throw new Error(`Undefined value in card data: ${path}`);
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) assertNoUndefined(child, `${path}.${key}`);
}

function scheduleAIIfNeeded(player) {
  if (state.aiTimer) {
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
  }
  if (state.view !== "game" || state.mode !== "hotseat" || !isAI(player) || state.selected[player.id]) return;
  state.aiTimer = setTimeout(() => playAITurn(player.id), 450);
}

function playAITurn(playerId) {
  const player = state.players.find((item) => item.id === playerId);
  if (!player || currentPlayer()?.id !== player.id || state.selected[player.id]) return;
  const choice = pickAIChoice(player);
  if (!choice) return;
  if (choice.action === "build" && !choice.payment && canUseFreeFirstCardBuild(player, state.age)) {
    choice.freeFirstCardEachAgeUsed = true;
  }
  console.log(`[AI] ${player.name} difficulty=${player.aiDifficulty || "normal"}`);
  console.log(`[AI] selected ${choice.action} 《${findCardName(choice.cardId)}》 score=${choice.score} reason=${choice.reason}`);
  state.selected[player.id] = choice;
  log(`${player.name}（AI）选择${actionLabel(choice.action)}《${findCardName(choice.cardId)}》。`);
  const next = nextUnselectedSeat(state.seatCursor + 1);
  if (next === -1) {
    if (state.phase === "seventh-card") resolveSeventhCardTurn(true);
    else resolveTurn(true);
  } else {
    state.seatCursor = next;
    renderGame();
  }
}

function pickAIChoice(player) {
  const difficulty = player.aiDifficulty || "normal";
  const options = [];
  for (const card of player.hand) {
    const build = validateAction(player, card, "build");
    if (build.ok) {
      options.push(scoreAiCandidate({
        player,
        card,
        action: "build",
        payment: build.payment,
        difficulty
      }));
    }
    const wonder = validateAction(player, card, "wonder");
    if (wonder.ok) {
      options.push(scoreAiCandidate({
        player,
        card,
        action: "wonder",
        payment: wonder.payment,
        difficulty
      }));
    }
    options.push(scoreAiCandidate({
      player,
      card,
      action: "sell",
      payment: null,
      difficulty
    }));
  }
  options.sort((a, b) => b.score - a.score);
  const best = pickAiCandidate(options, difficulty);
  if (!best) return null;
  return { cardId: best.cardId, action: best.action, payment: best.payment || null, score: best.score, reason: best.reason };
}

function aiLabel(difficulty) {
  return AI_DIFFICULTIES[difficulty] || AI_DIFFICULTIES.normal;
}

function aiRandomNoise(difficulty) {
  if (difficulty === "easy") return Math.random() * 10;
  if (difficulty === "normal") return Math.random() * 4;
  if (difficulty === "hard") return Math.random() * 1.2;
  return Math.random() * 0.2;
}

function scoreAiCandidate({ player, card, action, payment, difficulty }) {
  if (action === "build") {
    const score = scoreCardForAI(player, card, payment, difficulty);
    return {
      cardId: card.id,
      action,
      payment,
      estimatedCost: payment?.total || 0,
      score: roundAiScore(score),
      reason: explainAiBuild(card, player, difficulty)
    };
  }
  if (action === "wonder") {
    const score = scoreWonderForAI(player, payment, difficulty);
    return {
      cardId: card.id,
      action,
      payment,
      estimatedCost: payment?.total || 0,
      score: roundAiScore(score),
      reason: explainAiWonder(player, difficulty)
    };
  }
  const score = scoreSellForAI(player, difficulty);
  return {
    cardId: card.id,
    action,
    payment: null,
    estimatedCost: 0,
    score: roundAiScore(score),
    reason: player.coins <= 2 ? "need coins" : "fallback sell"
  };
}

function roundAiScore(score) {
  return Math.round(score * 10) / 10;
}

function pickAiCandidate(options, difficulty) {
  if (!options.length) return null;
  if (difficulty === "inferno") return options[0];
  if (difficulty === "hard") {
    return Math.random() < 0.95 ? options[0] : options[Math.min(options.length - 1, Math.floor(Math.random() * Math.min(3, options.length)))];
  }
  if (difficulty === "easy") {
    const pool = options.slice(0, Math.max(1, Math.ceil(options.length * 0.5)));
    return Math.random() < 0.7 ? pool[Math.floor(Math.random() * pool.length)] : options[Math.floor(Math.random() * options.length)];
  }
  return Math.random() < 0.85 ? options[0] : options[Math.min(options.length - 1, Math.floor(Math.random() * Math.min(3, options.length)))];
}

function scoreCardForAI(player, card, payment, difficulty = "normal") {
  const militaryValue = card.shields || card.military || 0;
  const resourceMap = producesToResourceMap(card.produces || [], card.resource);
  const resourceCount = Object.values(resourceMap).reduce((total, value) => total + value, 0);
  const scienceValue = card.science || card.scienceSymbol ? 1 : 0;
  let score = 10;

  if (card.points) score += card.points * (difficulty === "easy" ? 2 : 3.2);
  if (resourceCount) score += resourceCount * ageResourceWeight(difficulty);
  if (militaryValue) score += militaryValue * militaryWeightForAI(player, difficulty);
  if (scienceValue) score += scienceWeightForAI(player, card, difficulty);
  if (card.coins) score += card.coins * (difficulty === "easy" ? 1 : 1.5);
  if (card.perColorCoins) score += difficulty === "easy" ? 3 : 6;
  if (card.perNeighborColorCoins) score += difficulty === "easy" ? 3 : 7;
  if (card.perResourceCoins) score += difficulty === "easy" ? 2 : 6;
  if (card.tradeDiscount) score += difficulty === "easy" ? 2 : 5;
  if (card.tradeRebate) score += difficulty === "easy" ? 2 : 5;
  if (card.oneTimeBuildDiscount) score += difficulty === "easy" ? 2 : 5;
  if (card.commerceScore) score += difficulty === "easy" ? 4 : 10;
  if (card.type === "guild") score += difficulty === "inferno" ? 20 : 12;

  score += boardPreferenceBonus(player, card, difficulty);
  score -= payment?.total || 0;
  score += aiRandomNoise(difficulty);
  return score;
}

function scoreWonderForAI(player, payment, difficulty = "normal") {
  const stage = player.board.stages[player.stagesBuilt];
  if (!stage) return -Infinity;
  const effects = stage.effects || {};
  let score = difficulty === "easy" ? 3 : 6;
  if (effects.points) score += effects.points * (difficulty === "easy" ? 3 : 8);
  if (effects.effect === "openOverseasTradeRoute") {
    score += isThreePlayerGame()
      ? (difficulty === "easy" ? 10 : 22)
      : (difficulty === "easy" ? 4 : 12);
  }
  if (effects.military) score += effects.military * militaryWeightForAI(player, difficulty);
  if (effects.science) score += difficulty === "easy" ? 8 : 13;
  if (effects.resource) score += Object.values(effects.resource).reduce((total, value) => total + value, 0) * (state.age === 1 ? 14 : 8);
  if (effects.coins) score += effects.coins * (difficulty === "easy" ? 1.5 : 2);
  if (effects.tradeDiscount) score += difficulty === "easy" ? 2 : 5;
  if (effects.effect === "extraCoinsFirstGainEachTurn") score += difficulty === "easy" ? 3 : 8;
  score += wonderBoardBias(player, difficulty);
  score -= payment?.total || 0;
  score += aiRandomNoise(difficulty);
  return score;
}

function scoreSellForAI(player, difficulty = "normal") {
  let base = player.coins <= 2 ? 8 : 5;
  if (hasBashuExtraCoinsAbility(player)) base += difficulty === "easy" ? 1 : 2;
  return base + (difficulty === "easy" ? aiRandomNoise(difficulty) : 0);
}

function ageResourceWeight(difficulty) {
  if (state.age === 1) return difficulty === "easy" ? 8 : 14;
  if (state.age === 2) return difficulty === "easy" ? 5 : 8;
  return difficulty === "easy" ? 2 : 3;
}

function militaryWeightForAI(player, difficulty) {
  const leftGap = getMilitary(player) - getMilitary(getLeftNeighbor(player));
  const rightGap = getMilitary(player) - getMilitary(getRightNeighbor(player));
  const nearThreshold = (leftGap >= -1 && leftGap <= 1) || (rightGap >= -1 && rightGap <= 1);
  let weight = state.age * 4 + 2;
  if (difficulty === "easy") weight = 1;
  if (difficulty === "normal" && nearThreshold) weight += 3;
  if ((difficulty === "hard" || difficulty === "inferno") && nearThreshold) weight += 6;
  if (player.board.id === "yanzhao" && difficulty !== "easy") weight += 4;
  if (player.board.id === "guanzhong" && difficulty !== "easy") weight += 4;
  return weight;
}

function scienceWeightForAI(player, card, difficulty) {
  const symbol = card.scienceSymbol;
  if (!symbol) return difficulty === "easy" ? 2 : 8;
  const current = getScience(player);
  const setsBefore = Math.min(current.经学, current.工学, current.史学);
  const after = { ...current, [symbol]: (current[symbol] || 0) + 1 };
  const setsAfter = Math.min(after.经学, after.工学, after.史学);
  let weight = difficulty === "easy" ? 2 : 8 + (after[symbol] ** 2 - current[symbol] ** 2) * 2;
  if (setsAfter > setsBefore) weight += difficulty === "easy" ? 3 : 10;
  if (player.board.id === "qilu" && setsAfter > setsBefore) weight += difficulty === "inferno" ? 6 : 4;
  return weight;
}

function boardPreferenceBonus(player, card, difficulty) {
  let bonus = 0;
  if (hasHeluoBlueBonus(player) && card.color === "blue") bonus += difficulty === "easy" ? 2 : 7;
  if (player.board.id === "qilu" && card.color === "green") bonus += difficulty === "easy" ? 2 : 6;
  if (player.board.id === "bashu" && card.coins) bonus += difficulty === "easy" ? 2 : 5;
  if (player.board.id === "lingnan" && card.color === "yellow") bonus += difficulty === "easy" ? 3 : 8;
  if (hasBashuExtraCoinsAbility(player) && player.board.id === "bashu" && (card.coins || card.perColorCoins || card.perNeighborColorCoins || card.perResourceCoins)) {
    bonus += difficulty === "easy" ? 1 : 3;
  }
  if (player.board.id === "lingnan" && card.commerceScore) {
    bonus += difficulty === "easy" ? 2 : 5;
  }
  return bonus;
}

function wonderBoardBias(player, difficulty) {
  if (player.board.id === "jiangnan") return difficulty === "easy" ? 3 : 10;
  return difficulty === "easy" ? 0 : 2;
}

function explainAiBuild(card, player, difficulty) {
  if (card.points) return "high points";
  if (card.color === "brown" || card.color === "gray") return state.age === 1 ? "resource foundation" : "resource support";
  if (card.color === "green" && player.board.id === "qilu") return "science combo";
  if (card.color === "blue" && player.board.id === "heluo") return "board synergy";
  if (card.color === "red" && (player.board.id === "yanzhao" || player.board.id === "guanzhong")) return "military tempo";
  return difficulty === "easy" ? "simple value" : "best build value";
}

function explainAiWonder(player, difficulty) {
  if (player.board.id === "jiangnan") return "wonder stage reward";
  return difficulty === "easy" ? "easy wonder" : "wonder stage reward";
}

function renderActionMessage(message, isError) {
  $("actionArea").classList.remove("compact");
  $("actionArea").innerHTML = "";
  const note = document.createElement("p");
  note.className = isError ? "toast" : "hint";
  note.textContent = message;
  note.dataset.messageId = String(Date.now());
  $("actionArea").append(note);
}

function actionLabel(action) {
  return { build: "建造", sell: "卖掉", wonder: "建设区域板" }[action];
}

function colorLabel(color) {
  return {
    brown: "棕牌资源",
    gray: "灰牌高级资源",
    blue: "蓝牌文明",
    red: "红牌军事",
    yellow: "黄牌商业",
    green: "绿牌学术",
    purple: "紫牌公会"
  }[color] || color;
}

function shortColorLabel(color) {
  return {
    brown: "棕牌",
    gray: "灰牌",
    blue: "蓝牌",
    red: "红牌",
    yellow: "黄牌",
    green: "绿牌",
    purple: "紫牌"
  }[color] || color;
}

function renderLogs() {
  $("logList").innerHTML = state.logs.map((entry) => `<div class="log-entry">${entry}</div>`).join("");
}

function renderScoreDetailContent(item, index) {
  const boardName = item.player.board?.name || item.player.region || "未知区域";
  const scienceChoiceText = item.score.scienceChoices?.length
    ? `｜终局选择${item.score.scienceChoices.map((choice) => formatIconLabel(choice)).join("、")}`
    : item.score.scienceChoice
    ? `｜终局选择${formatIconLabel(item.score.scienceChoice)}`
    : "";
  return `
    <div class="score-detail-summary">
      <span class="score-detail-rank">第 ${index + 1} 名</span>
      <strong>${item.player.name}</strong>
      <span>${boardName}</span>
      <b>${item.score.total} 分</b>
    </div>
    <div class="score-detail-grid">
      <span>文明</span><strong>${item.score.cardPoints}</strong>
      <span>区域</span><strong>${item.score.boardPoints}</strong>
      <span>军事</span><strong>${item.score.military}</strong>
      <span>学术</span><strong>${item.score.science}${item.score.qiluBonus ? `｜齐鲁特质${item.score.qiluBonus}` : ""}${scienceChoiceText}</strong>
      <span>商业</span><strong>${item.score.commerce}</strong>
      <span>公会</span><strong>${item.score.guild}${item.score.guildResolved || item.score.guildFinal ? `｜已结算${item.score.guildResolved}｜终局${item.score.guildFinal}` : ""}</strong>
      <span>铜钱</span><strong>${formatIconLabel("铜钱")} ${item.score.rawCoins}｜铜钱分 ${item.score.coins}｜${item.score.coinRule}</strong>
      <span>特殊</span><strong>${formatSpecialScoreText(item.score)}</strong>
    </div>
  `;
}

function openScoreDetail(playerId) {
  const detail = state.scoreDetails?.[playerId];
  if (!detail) return;
  $("scoreDetailDialogTitle").textContent = `${detail.item.player.name}｜计分详情`;
  $("scoreDetailDialogBody").innerHTML = renderScoreDetailContent(detail.item, detail.index);
  document.body.classList.add("dialog-open");
  $("scoreDetailDialog").showModal();
}

function closeScoreDetailDialog() {
  if ($("scoreDetailDialog")?.open) $("scoreDetailDialog").close();
}

function handleScoreDetailDialogBackdrop(event) {
  const dialog = $("scoreDetailDialog");
  const rect = dialog.getBoundingClientRect();
  const clickedInside = rect.top <= event.clientY
    && event.clientY <= rect.top + rect.height
    && rect.left <= event.clientX
    && event.clientX <= rect.left + rect.width;
  if (!clickedInside) closeScoreDetailDialog();
}

function renderScores() {
  clearLocalTurnStateAfterRoundAdvance();
  const localPlayerId = getLocalPlayerId();
  const radarPlayerId = getScoreRadarPlayerId();
  const scored = state.players.map((player) => ({ player, score: scorePlayer(player) }))
    .sort((a, b) => b.score.total - a.score.total || b.player.coins - a.player.coins);
  const radarRawScores = Object.fromEntries(scored.map((item) => [
    item.player.id,
    calculateRadarRawScores(item.player, item.score)
  ]));
  const normalizedRadarScores = normalizeRadarScores(radarRawScores);
  const localRadarEntry = scored.find((item) => item.player.id === radarPlayerId) || null;
  state.scoreDetails = Object.fromEntries(scored.map((item, index) => [item.player.id, { item, index }]));
  $("returnRoomButton").classList.toggle("hidden", state.mode !== "online");
  refreshOnlineHostCloseButtons();
  $("scoreTable").innerHTML = scored.map((item, index) => `
    <article class="score-card ${item.player.id === radarPlayerId ? "self-score-card" : ""}">
      <button type="button" class="score-row-button" onclick="openScoreDetail('${item.player.id}')">
        <span class="score-row-rank">${index + 1}</span>
        <span class="score-row-player">
          <strong>${item.player.name}${item.player.id === radarPlayerId ? '<span class="self-score-badge">你</span>' : ""}</strong>
          <small>${item.player.board?.name || item.player.region || "未知区域"}</small>
        </span>
        <span class="score-row-total">${item.score.total}</span>
        <span class="score-row-more">详情</span>
      </button>
      <div class="score-line score-line--desktop">
        <strong>${index + 1}. ${item.player.name}（${item.player.board?.name || item.player.region || "未知区域"}）${item.player.id === radarPlayerId ? '<span class="self-score-badge">你</span>' : ""}</strong>
        <span>文明 ${item.score.cardPoints}</span>
        <span>区域 ${item.score.boardPoints}</span>
        <span>军事 ${item.score.military}</span>
        <span>学术 ${item.score.science}${item.score.qiluBonus ? `｜齐鲁特质${item.score.qiluBonus}` : ""}${item.score.scienceChoices?.length ? `｜终局选择${item.score.scienceChoices.map((choice) => formatIconLabel(choice)).join("、")}` : item.score.scienceChoice ? `｜终局选择${formatIconLabel(item.score.scienceChoice)}` : ""}</span>
        <span>商业 ${item.score.commerce}</span>
        <span>公会 ${item.score.guild}${item.score.guildResolved || item.score.guildFinal ? `｜已结算${item.score.guildResolved}｜终局${item.score.guildFinal}` : ""}</span>
        <span>${formatIconLabel("铜钱")}：${item.score.rawCoins}｜铜钱分：${item.score.coins}｜${item.score.coinRule}</span>
        <span>${formatSpecialScoreText(item.score)}</span>
        <span><strong>${item.score.total}</strong></span>
      </div>
    </article>
  `).join("") + (localRadarEntry ? `
    <article class="score-card self-score-card">
      <div class="score-radar">
        <h4>文明六维图</h4>
        <div class="score-radar__body">
          <div class="score-radar__chart-wrap">
            ${renderCivilizationRadarChart(normalizedRadarScores[localRadarEntry.player.id])}
          </div>
          <div class="score-radar__details">
            <div class="radar-values">
              ${renderRadarValues(normalizedRadarScores[localRadarEntry.player.id])}
            </div>
            <p class="radar-summary">${radarSummary(normalizedRadarScores[localRadarEntry.player.id])}</p>
          </div>
        </div>
      </div>
    </article>
  ` : "");
  saveHotseatGame();
}

function formatSpecialScoreText(score) {
  const parts = (score.specialEntries || []).map((entry) => {
    if (entry.sourceName === "荆楚区域特质") {
      return `荆楚技能：已建卡牌包含 ${entry.points} 种颜色，获得 ${entry.points} 分`;
    }
    if (entry.sourceName === "河东区域特质") {
      return `河东技能：卖掉 ${score.soldCardCount || 0} 张牌，获得 ${entry.points} 分`;
    }
    if (entry.sourceName === "辽东区域特质") {
      return `辽东技能：三时代未获战败标记，获得 ${entry.points} 分`;
    }
    return `${entry.sourceName} +${entry.points}`;
  });
  return parts.length ? `特殊奖励 ${parts.join("｜")}` : "特殊奖励 0";
}

window.chooseAction = chooseAction;
window.confirmPendingChoice = confirmPendingChoice;
window.cancelPendingChoice = cancelPendingChoice;
window.removeOnlineAIPlayer = removeOnlineAIPlayer;
window.setOnlineRandomBoard = setOnlineRandomBoard;
window.handleLobbyBoardChange = handleLobbyBoardChange;
window.updateOnlineAiDifficulty = updateOnlineAiDifficulty;
window.kickOnlinePlayer = kickOnlinePlayer;
window.openPlayerOverview = openPlayerOverview;
window.openPlayerOverviewDialog = openPlayerOverviewDialog;
window.openBuiltSlotDetail = openBuiltSlotDetail;
window.openScoreDetail = openScoreDetail;
window.chooseOverseasTradeCandidate = chooseOverseasTradeCandidate;
window.confirmOverseasTradePartner = confirmOverseasTradePartner;
window.chooseOverseasTradePartner = chooseOverseasTradePartner;
window.chooseLiaodongGuardSide = chooseLiaodongGuardSide;
window.chooseLiaodongResource = chooseLiaodongResource;
window.confirmLiaodongResourceChoice = confirmLiaodongResourceChoice;
window.chooseGuanzhongResource = chooseGuanzhongResource;
window.confirmGuanzhongResourceChoices = confirmGuanzhongResourceChoices;
window.chooseDiscardPileCard = chooseDiscardPileCard;
window.handleDiscardPileCardKeydown = handleDiscardPileCardKeydown;
window.confirmDiscardPilePickerSelection = confirmDiscardPilePickerSelection;
window.selectDiscardPileCard = selectDiscardPileCard;
window.openHedongDiscardBuildPicker = openHedongDiscardBuildPicker;
window.confirmHedongDiscardBuildChoice = confirmHedongDiscardBuildChoice;
window.openBoardDetail = openBoardDetail;
window.openJingchuPeekDialog = openJingchuPeekDialog;

if (["127.0.0.1", "localhost"].includes(location.hostname)) {
  window.__JIUZHOU_TEST_API__ = {
    state,
    renderGame,
    showView,
    startHedongDiscardBuildChoicePhase,
    continueAfterHedongDiscardBuildChoices,
    finalizeHedongDiscardBuildChoice,
    openHedongDiscardBuildPicker,
    confirmHedongDiscardBuildChoice,
    normalizeDiscardPile
  };
}

loadData()
  .then(async () => {
    setupEvents();
    const handledInvite = await handleInviteLinkOnLoad();
    updateContinueGameControls();
  })
  .catch((error) => {
    document.body.innerHTML = `<main class="shell"><div class="panel" style="padding:20px"><h1>数据加载失败</h1><p>${error.message}</p><p>请通过本地静态服务器运行，而不是直接双击打开 HTML。</p></div></main>`;
  });
