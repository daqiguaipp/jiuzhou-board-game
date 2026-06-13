(function () {
  function hasFirebaseConfigValue() {
    const config = window.JIUZHOU_FIREBASE_CONFIG;
    return Boolean(config && config.apiKey && config.databaseURL && config.projectId && config.appId);
  }

  function currentRoomPlayer() {
    return state.online.roomData?.players?.[state.online.localPlayerId] || null;
  }

  if (typeof toggleOnlineReady === "function" && typeof leaveOnlineRoom === "function") {
    return;
  }

  async function setReady(value) {
    if (!state.online.roomRef || !state.online.localPlayerId) return;
    const clean = typeof sanitizeForFirebase === "function" ? sanitizeForFirebase : (item) => item;
    await state.online.roomRef.child(`players/${state.online.localPlayerId}/ready`).set(clean(value));
    await state.online.roomRef.child("updatedAt").set(clean(Date.now()));
  }

  async function leaveRoom() {
    const ref = state.online.roomRef;
    const room = state.online.roomData;
    const playerId = state.online.localPlayerId;
    if (ref) {
      ref.off();
      if (room?.phase === "lobby" && playerId) {
        try {
          if (room.hostId === playerId) {
            await ref.remove();
          } else {
            await ref.child(`players/${playerId}`).remove();
            const clean = typeof sanitizeForFirebase === "function" ? sanitizeForFirebase : (item) => item;
            await ref.child("updatedAt").set(clean(Date.now()));
          }
        } catch (error) {
          console.warn("Leave room failed", error);
        }
      }
    }
    Object.assign(state.online, {
      roomCode: "",
      localPlayerId: "",
      hostId: "",
      isHost: false,
      roomRef: null,
      roomData: null,
      resolving: false
    });
    state.mode = "hotseat";
    state.phase = "lobby";
    $("onlineEntry")?.classList.remove("hidden");
    $("onlineLobby")?.classList.add("hidden");
    if ($("onlineStatus")) $("onlineStatus").textContent = "未连接";
    showView("home");
  }

  const originalShowOnlineError = window.showOnlineError || showOnlineError;
  window.showOnlineError = function (error) {
    if (String(error.message || "").includes("firebase-config") || error.code === "firebase-not-configured") {
      $("onlineStatus").textContent = "联机未配置";
      return;
    }
    originalShowOnlineError(error);
  };
  showOnlineError = window.showOnlineError;

  const originalRenderOnlineLobby = renderOnlineLobby;
  renderOnlineLobby = function (room) {
    originalRenderOnlineLobby(room);
    const players = Object.values(room.players || {}).sort((a, b) => a.joinedAt - b.joinedAt);
    const allReady = players.length >= 3 && players.every((player) => player.ready);
    const localPlayer = currentRoomPlayer();

    document.querySelectorAll(".lobby-player").forEach((node, index) => {
      if (!players[index] || node.querySelector(".ready-state")) return;
      const badge = document.createElement("span");
      badge.className = `pill ready-state ${players[index].ready ? "ready" : ""}`;
      badge.textContent = players[index].ready ? "已准备" : "未准备";
      node.append(badge);
    });

    if ($("lobbyHint")) {
      $("lobbyHint").textContent = players.length < 3
        ? `还需要 ${3 - players.length} 名玩家才能开始。`
        : allReady
          ? "所有玩家已准备，房主可以开局。"
          : "人数已满足，等待所有玩家准备。";
    }

    if ($("readyOnlineButton")) {
      $("readyOnlineButton").textContent = localPlayer?.ready ? "取消准备" : "准备";
    }
    if ($("startOnlineGameButton")) {
      $("startOnlineGameButton").disabled = !allReady;
      $("startOnlineGameButton").classList.toggle("hidden", !state.online.isHost);
    }
  };

  document.addEventListener("click", async (event) => {
    if (event.target?.id === "readyOnlineButton") {
      const player = currentRoomPlayer();
      if (player) await setReady(!player.ready);
    }
    if (event.target?.id === "onlineBackButton") {
      await leaveRoom();
    }
  });

  $("startOnlineGameButton")?.addEventListener("click", (event) => {
    const players = Object.values(state.online.roomData?.players || {});
    if (players.length < 3 || !players.every((player) => player.ready)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      alert(players.length < 3 ? "至少需要 3 名玩家才能开局。" : "请等待所有玩家准备。");
    }
  }, true);

  $("onlineButton")?.addEventListener("click", () => {
    $("onlineStatus").textContent = hasFirebaseConfigValue() ? "准备联机" : "联机未配置";
  });
})();
