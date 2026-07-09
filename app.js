const STORAGE_KEY = "visualTimer.sessions.v1";

const sampleData = [
  {
    id: crypto.randomUUID(),
    name: "Rehab session",
    blocks: [
      {
        id: crypto.randomUUID(),
        name: "Circuit A",
        repeatCount: 3,
        steps: [
          {
            id: crypto.randomUUID(),
            name: "Exercise 1",
            durationSeconds: 30,
            color: "#7dd3fc",
            sound: "beep",
            vibrate: true,
            note: "Slow and controlled.",
          },
          {
            id: crypto.randomUUID(),
            name: "Rest",
            durationSeconds: 5,
            color: "#94a3b8",
            sound: "soft",
            vibrate: false,
            note: "Reset position.",
          },
          {
            id: crypto.randomUUID(),
            name: "Exercise 2",
            durationSeconds: 30,
            color: "#7dd3fc",
            sound: "beep",
            vibrate: true,
            note: "Keep breathing.",
          },
        ],
      },
    ],
  },
];

const state = {
  sessions: normalizeSessions(loadSessions()),
  selectedSessionId: null,
  player: createPlayerState(),
};

const els = {
  sessionList: document.querySelector("#session-list"),
  sessionCount: document.querySelector("#session-count"),
  sessionName: document.querySelector("#session-name"),
  blockList: document.querySelector("#block-list"),
  flattenedPreview: document.querySelector("#flattened-preview"),
  playerStepName: document.querySelector("#player-step-name"),
  playerMeta: document.querySelector("#player-meta"),
  playerTime: document.querySelector("#player-time"),
  playerStatus: document.querySelector("#player-status"),
  playerProgress: document.querySelector("#player-progress"),
  playerStartBtn: document.querySelector("#player-start-btn"),
  playerPauseBtn: document.querySelector("#player-pause-btn"),
  playerNextBtn: document.querySelector("#player-next-btn"),
  playerPrevBtn: document.querySelector("#player-prev-btn"),
  playerResetBtn: document.querySelector("#player-reset-btn"),
  trainingOpenBtn: document.querySelector("#training-open-btn"),
  trainingMode: document.querySelector("#training-mode"),
  trainingSession: document.querySelector("#training-session"),
  trainingBlock: document.querySelector("#training-block"),
  trainingRound: document.querySelector("#training-round"),
  trainingStep: document.querySelector("#training-step"),
  trainingTime: document.querySelector("#training-time"),
  trainingNote: document.querySelector("#training-note"),
  trainingProgressFill: document.querySelector("#training-progress-fill"),
  trainingPrevStep: document.querySelector("#training-prev-step"),
  trainingNextStep: document.querySelector("#training-next-step"),
  trainingStatus: document.querySelector("#training-status"),
  trainingCloseBtn: document.querySelector("#training-close-btn"),
  trainingStartBtn: document.querySelector("#training-start-btn"),
  trainingPauseBtn: document.querySelector("#training-pause-btn"),
  trainingNextBtn: document.querySelector("#training-next-btn"),
  trainingPrevBtn: document.querySelector("#training-prev-btn"),
  trainingResetBtn: document.querySelector("#training-reset-btn"),
  newSessionBtn: document.querySelector("#new-session-btn"),
  addBlockBtn: document.querySelector("#add-block-btn"),
  saveBtn: document.querySelector("#save-btn"),
};

if (!state.sessions.length) {
  state.sessions = sampleData;
  persistSessions();
}

if (!state.selectedSessionId) {
  state.selectedSessionId = state.sessions[0]?.id ?? null;
}

bindEvents();
render();
registerServiceWorker();

function bindEvents() {
  els.newSessionBtn.addEventListener("click", createSession);
  els.addBlockBtn.addEventListener("click", addBlock);
  els.saveBtn.addEventListener("click", persistSessions);
  els.playerStartBtn.addEventListener("click", startTimer);
  els.playerPauseBtn.addEventListener("click", togglePauseTimer);
  els.playerNextBtn.addEventListener("click", () => advanceTimer(1, true));
  els.playerPrevBtn.addEventListener("click", () => advanceTimer(-1, true));
  els.playerResetBtn.addEventListener("click", resetTimer);
  els.trainingOpenBtn.addEventListener("click", openTrainingMode);
  els.trainingCloseBtn.addEventListener("click", closeTrainingMode);
  els.trainingStartBtn.addEventListener("click", startTimer);
  els.trainingPauseBtn.addEventListener("click", togglePauseTimer);
  els.trainingNextBtn.addEventListener("click", () => advanceTimer(1, true));
  els.trainingPrevBtn.addEventListener("click", () => advanceTimer(-1, true));
  els.trainingResetBtn.addEventListener("click", resetTimer);
  els.sessionName.addEventListener("input", (event) => {
    const session = getSelectedSession();
    if (!session) return;
    session.name = event.target.value;
    renderSessionList();
    renderFlattenedPreview();
    renderPlayer();
    renderTrainingMode();
    persistSessions();
  });
}

function render() {
  renderSessionList();
  renderEditor();
  renderFlattenedPreview();
  renderPlayer();
  renderTrainingMode();
}

function renderSessionList() {
  els.sessionList.innerHTML = "";
  els.sessionCount.textContent = `${state.sessions.length} saved`;

  state.sessions.forEach((session) => {
    const item = document.createElement("div");
    item.className = `session-item ${session.id === state.selectedSessionId ? "active" : ""}`;
    item.innerHTML = `
      <button class="session-select" type="button">
        <strong>${escapeHtml(session.name)}</strong>
        <span class="muted">${session.blocks.length} block${session.blocks.length === 1 ? "" : "s"}</span>
      </button>
      <button class="session-delete" type="button" aria-label="Delete ${escapeAttr(session.name)}">Delete</button>
    `;
    item.querySelector(".session-select").addEventListener("click", () => selectSession(session.id));
    item.querySelector(".session-delete").addEventListener("click", () => deleteSession(session.id));
    els.sessionList.appendChild(item);
  });
}

function renderEditor() {
  const session = getSelectedSession();
  if (!session) {
    els.sessionName.value = "";
    els.blockList.innerHTML = "<p class='muted'>No sessions yet.</p>";
    return;
  }

  els.sessionName.value = session.name;
  els.blockList.innerHTML = "";

  session.blocks.forEach((block, blockIndex) => {
    const blockEl = document.createElement("section");
    blockEl.className = "block-card";

    blockEl.innerHTML = `
      <div class="block-header">
        <div>
          <h3>Block ${blockIndex + 1}</h3>
          <div class="block-meta">
            <label class="field" style="min-width: 220px;">
              <span>Block name</span>
              <input data-action="edit-block-name" data-block-id="${block.id}" type="text" value="${escapeAttr(block.name)}" />
            </label>
            <label class="field" style="width: 150px;">
              <span>Repeat count</span>
              <input data-action="edit-repeat-count" data-block-id="${block.id}" type="number" min="1" step="1" value="${block.repeatCount}" />
            </label>
          </div>
        </div>
        <div class="step-actions">
          <button data-action="move-block-up" data-block-id="${block.id}" ${blockIndex === 0 ? "disabled" : ""}>Up</button>
          <button data-action="move-block-down" data-block-id="${block.id}" ${blockIndex === session.blocks.length - 1 ? "disabled" : ""}>Down</button>
          <button data-action="duplicate-block" data-block-id="${block.id}">Duplicate</button>
          <button data-action="remove-block" data-block-id="${block.id}">Remove</button>
          <button data-action="add-step" data-block-id="${block.id}">Add step</button>
        </div>
      </div>
      <div class="stack" data-role="steps"></div>
    `;

    const stepsContainer = blockEl.querySelector('[data-role="steps"]');
    block.steps.forEach((step, stepIndex) => {
      const stepEl = document.createElement("article");
      stepEl.className = "step-card";
      stepEl.innerHTML = `
        <div class="step-header">
          <strong>Step ${stepIndex + 1}</strong>
          <div class="step-actions">
            <button data-action="move-step-up" data-block-id="${block.id}" data-step-id="${step.id}" ${stepIndex === 0 ? "disabled" : ""}>Up</button>
            <button data-action="move-step-down" data-block-id="${block.id}" data-step-id="${step.id}" ${stepIndex === block.steps.length - 1 ? "disabled" : ""}>Down</button>
            <button data-action="duplicate-step" data-block-id="${block.id}" data-step-id="${step.id}">Duplicate</button>
            <button data-action="remove-step" data-block-id="${block.id}" data-step-id="${step.id}">Remove</button>
          </div>
        </div>
        <label class="field">
          <span>Name</span>
          <input data-action="edit-step-name" data-block-id="${block.id}" data-step-id="${step.id}" type="text" value="${escapeAttr(step.name)}" />
        </label>
        <div class="step-meta">
          <label class="field" style="width: 150px;">
            <span>Duration (sec)</span>
            <input data-action="edit-step-duration" data-block-id="${block.id}" data-step-id="${step.id}" type="number" min="1" step="1" value="${step.durationSeconds}" />
          </label>
          <label class="field" style="width: 150px;">
            <span>Color</span>
            <input data-action="edit-step-color" data-block-id="${block.id}" data-step-id="${step.id}" type="color" value="${step.color}" />
          </label>
          <label class="field" style="min-width: 160px;">
            <span>Sound</span>
            <select data-action="edit-step-sound" data-block-id="${block.id}" data-step-id="${step.id}">
              ${renderSoundOptions(step.sound)}
            </select>
          </label>
          <label class="field checkbox-field" style="min-width: 150px;">
            <span>Vibration</span>
            <span class="checkbox-row">
              <input data-action="edit-step-vibrate" data-block-id="${block.id}" data-step-id="${step.id}" type="checkbox" ${step.vibrate ? "checked" : ""} />
              <span>Vibrate</span>
            </span>
          </label>
          <label class="field" style="min-width: 160px;">
            <span>Note</span>
            <input data-action="edit-step-note" data-block-id="${block.id}" data-step-id="${step.id}" type="text" value="${escapeAttr(step.note ?? "")}" />
          </label>
        </div>
      `;
      stepsContainer.appendChild(stepEl);
    });

    els.blockList.appendChild(blockEl);
  });

  els.blockList.querySelectorAll("input, select").forEach((input) => {
    const eventName = input.matches('select, input[type="checkbox"]') ? "change" : "input";
    input.addEventListener(eventName, handleEditorInput);
  });
  els.blockList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", handleEditorClick);
  });
}

function renderFlattenedPreview() {
  const session = getSelectedSession();
  if (!session) {
    els.flattenedPreview.innerHTML = "<p class='muted'>Nothing to preview yet.</p>";
    return;
  }

  const rows = flattenSession(session);
  els.flattenedPreview.innerHTML = rows
    .map(
      (item, index) => `
        <div class="sequence-item">
          <strong>${index + 1}. ${escapeHtml(item.step.name)}</strong>
          <div class="muted">
            ${escapeHtml(item.block.name)} · round ${item.round}/${item.repeatCount} · ${item.step.durationSeconds}s
          </div>
        </div>
      `,
    )
    .join("");
}

function renderPlayer() {
  const details = getPlayerDetails();
  const { activeItem, queue, remainingMs, progress } = details;

  els.playerStepName.textContent = activeItem ? activeItem.step.name : "No step selected";
  els.playerMeta.textContent = activeItem
    ? `${activeItem.block.name} · round ${activeItem.round}/${activeItem.repeatCount}${activeItem.step.note ? ` · ${activeItem.step.note}` : ""}`
    : "Select a session and press Start.";
  els.playerTime.textContent = formatTime(Math.ceil(remainingMs / 1000));
  els.playerStatus.textContent = playerStatusLabel();
  els.playerProgress.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;

  const playable = queue.length > 0;
  els.playerStartBtn.disabled = !playable || state.player.status === "running";
  els.playerPauseBtn.disabled = state.player.status !== "running" && state.player.status !== "paused";
  els.playerPauseBtn.textContent = state.player.status === "paused" ? "Resume" : "Pause";
  els.playerNextBtn.disabled = !playable;
  els.playerPrevBtn.disabled = !playable;
  els.playerResetBtn.disabled = !playable;
  els.trainingOpenBtn.disabled = !playable;
}

function renderTrainingMode() {
  const session = getSelectedSession();
  const details = getPlayerDetails();
  const { activeItem, previousItem, nextItem, queue, remainingMs, progress } = details;
  const playable = queue.length > 0;

  els.trainingSession.textContent = session?.name ?? "visualTimer";
  els.trainingBlock.textContent = activeItem?.block.name ?? "No block selected";
  els.trainingRound.textContent = activeItem
    ? `Round ${activeItem.round} of ${activeItem.repeatCount} · step ${activeItem.index + 1} of ${queue.length}`
    : "Round 0 of 0";
  els.trainingStep.textContent = activeItem?.step.name ?? "No step selected";
  els.trainingTime.textContent = formatTime(Math.ceil(remainingMs / 1000));
  els.trainingNote.textContent = activeItem?.step.note || "No note for this step.";
  els.trainingProgressFill.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
  els.trainingPrevStep.textContent = previousItem?.step.name ?? "None";
  els.trainingNextStep.textContent = nextItem?.step.name ?? "None";
  els.trainingStatus.textContent = playerStatusLabel();

  els.trainingStartBtn.disabled = !playable || state.player.status === "running";
  els.trainingPauseBtn.disabled = state.player.status !== "running" && state.player.status !== "paused";
  els.trainingPauseBtn.textContent = state.player.status === "paused" ? "Resume" : "Pause";
  els.trainingNextBtn.disabled = !playable;
  els.trainingPrevBtn.disabled = !playable;
  els.trainingResetBtn.disabled = !playable;
}

function handleEditorInput(event) {
  const { action, blockId, stepId } = event.target.dataset;
  const session = getSelectedSession();
  if (!session) return;

  const block = session.blocks.find((entry) => entry.id === blockId);
  if (!block) return;

  if (action === "edit-block-name") {
    block.name = event.target.value;
  } else if (action === "edit-repeat-count") {
    block.repeatCount = Math.max(1, Number(event.target.value) || 1);
  } else {
    const step = block.steps.find((entry) => entry.id === stepId);
    if (!step) return;

    if (action === "edit-step-name") step.name = event.target.value;
    if (action === "edit-step-duration") step.durationSeconds = Math.max(1, Number(event.target.value) || 1);
    if (action === "edit-step-color") step.color = event.target.value;
    if (action === "edit-step-sound") step.sound = normalizeSound(event.target.value);
    if (action === "edit-step-vibrate") step.vibrate = event.target.checked;
    if (action === "edit-step-note") step.note = event.target.value;
  }

  syncPlayerAfterEdit();
  renderSessionList();
  renderFlattenedPreview();
  renderPlayer();
  renderTrainingMode();
  persistSessions();
}

function handleEditorClick(event) {
  const { action, blockId, stepId } = event.target.dataset;
  if (!action) return;

  if (action === "remove-block") removeBlock(blockId);
  if (action === "duplicate-block") duplicateBlock(blockId);
  if (action === "move-block-up") moveBlock(blockId, -1);
  if (action === "move-block-down") moveBlock(blockId, 1);
  if (action === "add-step") addStep(blockId);
  if (action === "remove-step") removeStep(blockId, stepId);
  if (action === "duplicate-step") duplicateStep(blockId, stepId);
  if (action === "move-step-up") moveStep(blockId, stepId, -1);
  if (action === "move-step-down") moveStep(blockId, stepId, 1);
}

function selectSession(sessionId) {
  if (state.player.status === "running" || state.player.status === "paused") {
    stopPlayerTick();
  }
  state.player = createPlayerState();
  state.selectedSessionId = sessionId;
  render();
}

function createSession() {
  const session = {
    id: crypto.randomUUID(),
    name: "New session",
    blocks: [],
  };
  state.sessions.unshift(session);
  selectSession(session.id);
  persistSessions();
}

function deleteSession(sessionId) {
  const session = state.sessions.find((entry) => entry.id === sessionId);
  if (!session) return;

  const confirmed = window.confirm(`Delete "${session.name}"? This cannot be undone.`);
  if (!confirmed) return;

  if (state.player.sessionId === sessionId) {
    stopPlayerTick();
    state.player = createPlayerState();
    closeTrainingMode();
  }

  state.sessions = state.sessions.filter((entry) => entry.id !== sessionId);

  if (state.selectedSessionId === sessionId) {
    state.selectedSessionId = state.sessions[0]?.id ?? null;
  }

  render();
  persistSessions();
}

function addBlock() {
  const session = getSelectedSession();
  if (!session) return;

  session.blocks.push({
    id: crypto.randomUUID(),
    name: `Block ${session.blocks.length + 1}`,
    repeatCount: 1,
    steps: [
      {
        id: crypto.randomUUID(),
        name: "Step",
        durationSeconds: 30,
        color: "#7dd3fc",
        sound: "beep",
        vibrate: false,
        note: "",
      },
    ],
  });

  syncPlayerAfterEdit();
  render();
  persistSessions();
}

function addStep(blockId) {
  const block = getSelectedSession()?.blocks.find((entry) => entry.id === blockId);
  if (!block) return;

  block.steps.push({
    id: crypto.randomUUID(),
    name: `Step ${block.steps.length + 1}`,
    durationSeconds: 30,
    color: "#7dd3fc",
    sound: "beep",
    vibrate: false,
    note: "",
  });

  syncPlayerAfterEdit();
  render();
  persistSessions();
}

function removeBlock(blockId) {
  const session = getSelectedSession();
  if (!session) return;
  session.blocks = session.blocks.filter((block) => block.id !== blockId);
  syncPlayerAfterEdit();
  render();
  persistSessions();
}

function duplicateBlock(blockId) {
  const session = getSelectedSession();
  if (!session) return;
  const block = session.blocks.find((entry) => entry.id === blockId);
  if (!block) return;

  session.blocks.push({
    ...cloneBlock(block),
    id: crypto.randomUUID(),
    steps: block.steps.map((step) => ({ ...step, id: crypto.randomUUID() })),
  });

  syncPlayerAfterEdit();
  render();
  persistSessions();
}

function moveBlock(blockId, direction) {
  const session = getSelectedSession();
  if (!session) return;

  const currentIndex = session.blocks.findIndex((block) => block.id === blockId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= session.blocks.length) return;

  const [block] = session.blocks.splice(currentIndex, 1);
  session.blocks.splice(nextIndex, 0, block);
  syncPlayerAfterEdit();
  render();
  persistSessions();
}

function removeStep(blockId, stepId) {
  const block = getSelectedSession()?.blocks.find((entry) => entry.id === blockId);
  if (!block) return;
  block.steps = block.steps.filter((step) => step.id !== stepId);
  syncPlayerAfterEdit();
  render();
  persistSessions();
}

function duplicateStep(blockId, stepId) {
  const block = getSelectedSession()?.blocks.find((entry) => entry.id === blockId);
  if (!block) return;
  const step = block.steps.find((entry) => entry.id === stepId);
  if (!step) return;

  block.steps.push({ ...step, id: crypto.randomUUID() });
  syncPlayerAfterEdit();
  render();
  persistSessions();
}

function moveStep(blockId, stepId, direction) {
  const block = getSelectedSession()?.blocks.find((entry) => entry.id === blockId);
  if (!block) return;

  const currentIndex = block.steps.findIndex((step) => step.id === stepId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= block.steps.length) return;

  const [step] = block.steps.splice(currentIndex, 1);
  block.steps.splice(nextIndex, 0, step);
  syncPlayerAfterEdit();
  render();
  persistSessions();
}

function startTimer() {
  const session = getSelectedSession();
  if (!session) return;

  const queue = getPlaybackQueue(session);
  if (!queue.length) return;

  state.player.sessionId = session.id;
  state.player.queue = queue;
  state.player.index = 0;
  state.player.status = "running";
  armCurrentStep();
  startPlayerTick();
  renderPlayer();
  renderTrainingMode();
}

function togglePauseTimer() {
  if (state.player.status === "running") {
    pauseTimer();
    return;
  }

  if (state.player.status === "paused") {
    resumeTimer();
  }
}

function pauseTimer() {
  if (state.player.status !== "running") return;
  state.player.remainingMs = getCurrentRemainingMs();
  state.player.status = "paused";
  stopPlayerTick();
  renderPlayer();
  renderTrainingMode();
}

function resumeTimer() {
  if (state.player.status !== "paused") return;
  state.player.status = "running";
  state.player.endsAt = Date.now() + state.player.remainingMs;
  startPlayerTick();
  renderPlayer();
  renderTrainingMode();
}

function resetTimer() {
  const session = getSelectedSession();
  if (!session) return;

  state.player.sessionId = session.id;
  state.player.queue = getPlaybackQueue(session);
  state.player.index = 0;
  state.player.status = "idle";
  state.player.remainingMs = state.player.queue[0]?.durationMs ?? 0;
  state.player.endsAt = 0;
  stopPlayerTick();
  renderPlayer();
  renderTrainingMode();
}

function advanceTimer(direction, manual = false) {
  const session = getSelectedSession();
  if (!session) return;

  const queue = getPlaybackQueue(session);
  if (!queue.length) return;

  state.player.sessionId = session.id;
  state.player.queue = queue;

  const previousStatus = state.player.status;
  const nextIndex = clampIndex(state.player.index + direction, queue.length);
  state.player.index = nextIndex;
  state.player.status = previousStatus === "paused" ? "paused" : "running";
  armCurrentStep();

  if (state.player.status === "running") {
    startPlayerTick();
  } else {
    stopPlayerTick();
  }

  renderPlayer();
  renderTrainingMode();
}

function armCurrentStep() {
  const current = state.player.queue[state.player.index];
  if (!current) {
    finishTimer();
    return;
  }

  state.player.remainingMs = current.durationMs;
  state.player.endsAt = Date.now() + current.durationMs;
  triggerStepCue(current);
}

function tickTimer() {
  if (state.player.status !== "running") return;

  const current = state.player.queue[state.player.index];
  if (!current) {
    finishTimer();
    return;
  }

  const remainingMs = getCurrentRemainingMs(current);
  state.player.remainingMs = remainingMs;

  if (remainingMs > 0) {
    renderPlayer();
    renderTrainingMode();
    return;
  }

  const nextIndex = state.player.index + 1;
  if (nextIndex >= state.player.queue.length) {
    finishTimer();
    return;
  }

  state.player.index = nextIndex;
  armCurrentStep();
  renderPlayer();
  renderTrainingMode();
}

function finishTimer() {
  stopPlayerTick();
  state.player.status = "finished";
  state.player.remainingMs = 0;
  state.player.endsAt = 0;
  renderPlayer();
  renderTrainingMode();
  triggerFinishCue();
}

function startPlayerTick() {
  stopPlayerTick();
  state.player.intervalId = window.setInterval(tickTimer, 100);
}

function stopPlayerTick() {
  if (state.player.intervalId !== null) {
    window.clearInterval(state.player.intervalId);
    state.player.intervalId = null;
  }
}

function syncPlayerAfterEdit() {
  if (!state.player.sessionId) return;

  const session = state.sessions.find((entry) => entry.id === state.player.sessionId);
  if (!session) return;

  const currentStepId = state.player.queue[state.player.index]?.step.id ?? null;
  state.player.queue = getPlaybackQueue(session);

  if (!state.player.queue.length) {
    state.player.index = 0;
    state.player.status = "idle";
    state.player.remainingMs = 0;
    stopPlayerTick();
    return;
  }

  const currentIndex = currentStepId ? state.player.queue.findIndex((entry) => entry.step.id === currentStepId) : 0;
  state.player.index = currentIndex >= 0 ? currentIndex : 0;
  state.player.remainingMs = state.player.queue[state.player.index]?.durationMs ?? 0;

  if (state.player.status === "running") {
    state.player.endsAt = Date.now() + state.player.remainingMs;
  }
}

function getPlaybackQueue(session) {
  if (!session) return [];

  return flattenSession(session).map((entry, index) => ({
    ...entry,
    index,
    durationMs: Math.max(1, entry.step.durationSeconds) * 1000,
  }));
}

function getPlayerDetails() {
  const session = getSelectedSession();
  const queue = getPlaybackQueue(session);
  const activeItem = queue[state.player.index] ?? null;
  const previousItem = queue[state.player.index - 1] ?? null;
  const nextItem = queue[state.player.index + 1] ?? null;
  const remainingMs = getCurrentRemainingMs(activeItem);
  const totalMs = activeItem?.durationMs ?? 0;
  const progress = totalMs > 0 ? 1 - remainingMs / totalMs : 0;

  return { activeItem, previousItem, nextItem, queue, remainingMs, progress };
}

function flattenSession(session) {
  const rows = [];
  session.blocks.forEach((block) => {
    for (let round = 1; round <= block.repeatCount; round += 1) {
      block.steps.forEach((step) => {
        rows.push({ block, step, round, repeatCount: block.repeatCount });
      });
    }
  });
  return rows;
}

function createPlayerState() {
  return {
    sessionId: null,
    queue: [],
    index: 0,
    status: "idle",
    remainingMs: 0,
    endsAt: 0,
    intervalId: null,
  };
}

function getSelectedSession() {
  return state.sessions.find((session) => session.id === state.selectedSessionId) ?? null;
}

function getCurrentRemainingMs(item = state.player.queue[state.player.index]) {
  if (!item) return 0;
  if (state.player.status === "paused") return state.player.remainingMs;
  if (state.player.status !== "running") return item.durationMs;
  return Math.max(0, state.player.endsAt - Date.now());
}

function playerStatusLabel() {
  if (state.player.status === "running") return "Running";
  if (state.player.status === "paused") return "Paused";
  if (state.player.status === "finished") return "Finished";
  return "Idle";
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function triggerStepCue(current) {
  if (!current) return;
  if (current.step.vibrate && "vibrate" in navigator) {
    navigator.vibrate([80, 40, 80]);
  }
  if (current.step.sound !== "none") {
    playTone(current.step.sound);
  }
}

function triggerFinishCue() {
  if ("vibrate" in navigator) {
    navigator.vibrate([120, 60, 120, 60, 220]);
  }
  playTone("finish");
}

function openTrainingMode() {
  els.trainingMode.classList.add("active");
  els.trainingMode.setAttribute("aria-hidden", "false");
  renderTrainingMode();
}

function closeTrainingMode() {
  els.trainingMode.classList.remove("active");
  els.trainingMode.setAttribute("aria-hidden", "true");
}

let audioContext = null;

function playTone(kind) {
  const frequencyMap = {
    beep: 880,
    soft: 660,
    finish: 523,
  };
  const frequency = frequencyMap[kind] ?? frequencyMap.beep;

  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = kind === "soft" ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.value = kind === "finish" ? 0.08 : 0.05;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + (kind === "finish" ? 0.28 : 0.16));
  } catch {
    // Audio is optional. Browsers can block it until a user gesture occurs.
  }
}

function renderSoundOptions(currentValue) {
  const current = normalizeSound(currentValue);
  return [
    ["none", "None"],
    ["soft", "Soft"],
    ["beep", "Beep"],
  ]
    .map(([value, label]) => `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`)
    .join("");
}

function normalizeSessions(sessions) {
  return sessions.map((session) => ({
    ...session,
    blocks: (session.blocks ?? []).map((block) => ({
      ...block,
      repeatCount: Math.max(1, Number(block.repeatCount) || 1),
      steps: (block.steps ?? []).map((step) => ({
        ...step,
        durationSeconds: Math.max(1, Number(step.durationSeconds) || 1),
        color: step.color || "#7dd3fc",
        sound: normalizeSound(step.sound),
        vibrate: Boolean(step.vibrate),
        note: step.note ?? "",
      })),
    })),
  }));
}

function normalizeSound(sound) {
  const value = String(sound ?? "beep").trim().toLowerCase();
  if (value === "none" || value === "silent" || value === "off") return "none";
  if (value === "soft" || value === "quiet") return "soft";
  if (value === "beep" || value === "default" || value === "finish") return "beep";
  return "beep";
}

function persistSessions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.sessions));
  } catch (error) {
    console.warn("Could not save sessions", error);
  }
  renderSessionList();
}

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cloneBlock(block) {
  return {
    name: block.name,
    repeatCount: block.repeatCount,
    steps: block.steps.map((step) => ({ ...step })),
  };
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("service-worker.js");
  } catch (error) {
    console.warn("Service worker registration failed", error);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function clampIndex(index, length) {
  if (length <= 0) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}
