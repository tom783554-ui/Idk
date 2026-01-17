const DEFAULT_VITALS = {
  HR: "--",
  BP: "--",
  MAP: "--",
  RR: "--",
  SpO2: "--",
  Temp: "--",
};

const ORDER_BUTTONS = [
  { id: "fluids_bolus", label: "Fluids bolus" },
  { id: "start_norepi", label: "Start norepi" },
  { id: "intubate", label: "Intubate" },
  { id: "defib", label: "Defib" },
  { id: "amiodarone", label: "Amiodarone" },
];

const SCENARIOS = [
  { id: "shock", label: "Shock" },
  { id: "resp_failure", label: "Resp failure" },
  { id: "arrhythmia", label: "Arrhythmia" },
];

export class UI {
  constructor(root) {
    this.root = root;
    this.vitalFields = {};
    this.logLines = [];
    this.maxLogLines = 200;
    this.waveformCanvas = null;
    this.waveformCtx = null;
    this.waveformSize = { width: 0, height: 0 };
    this.statusLine = null;
    this.logPanel = null;
    this.callbacks = {};
    this.resizeWaveform = this.resizeWaveform.bind(this);
  }

  init({
    onStart,
    onPause,
    onReset,
    onSpeed,
    onSound,
    onScenarioSelect,
    onOrder,
    onLogRequest,
    on3D,
  }) {
    this.callbacks = {
      onStart,
      onPause,
      onReset,
      onSpeed,
      onSound,
      onScenarioSelect,
      onOrder,
      onLogRequest,
      on3D,
    };

    if (!this.root) {
      return;
    }

    this.root.innerHTML = "";
    this.root.append(
      this.buildTopControls(),
      this.buildScenarioPanel(),
      this.buildVitalsPanel(),
      this.buildWaveformPanel(),
      this.buildOrdersPanel(),
      this.buildLogPanel(),
      this.buildThreeDPanel()
    );

    this.setVitals(null);
    this.setWaveformFrame(null);
    this.setStatus("Idle");
    window.addEventListener("resize", this.resizeWaveform);
    this.resizeWaveform();
  }

  buildTopControls() {
    const panel = this.createPanel("Simulation");
    const grid = document.createElement("div");
    grid.className = "controls-grid";

    const startButton = this.createButton("Start", "btn");
    const pauseButton = this.createButton("Pause", "btn secondary");
    const resetButton = this.createButton("Reset", "btn tertiary");

    startButton.addEventListener("click", () => this.callbacks.onStart?.());
    pauseButton.addEventListener("click", () => this.callbacks.onPause?.());
    resetButton.addEventListener("click", () => this.callbacks.onReset?.());

    grid.append(startButton, pauseButton, resetButton);

    const row = document.createElement("div");
    row.className = "control-row";

    const speedLabel = document.createElement("label");
    speedLabel.textContent = "Speed";
    speedLabel.className = "status-line";
    const speedSelect = document.createElement("select");
    speedSelect.className = "select";
    ["0.5x", "1x", "2x"].forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      if (value === "1x") {
        option.selected = true;
      }
      speedSelect.appendChild(option);
    });
    speedSelect.addEventListener("change", () =>
      this.callbacks.onSpeed?.(speedSelect.value)
    );

    const soundWrapper = document.createElement("label");
    soundWrapper.className = "toggle";
    const soundToggle = document.createElement("input");
    soundToggle.type = "checkbox";
    soundToggle.checked = true;
    const soundText = document.createElement("span");
    soundText.textContent = "Sound";
    soundWrapper.append(soundToggle, soundText);
    soundToggle.addEventListener("change", () =>
      this.callbacks.onSound?.(soundToggle.checked)
    );

    row.append(speedLabel, speedSelect, soundWrapper);

    panel.append(grid, row);
    return panel;
  }

  buildScenarioPanel() {
    const panel = this.createPanel("Scenario");
    const select = document.createElement("select");
    select.className = "select";
    SCENARIOS.forEach((scenario) => {
      const option = document.createElement("option");
      option.value = scenario.id;
      option.textContent = scenario.label;
      select.appendChild(option);
    });
    select.addEventListener("change", () =>
      this.callbacks.onScenarioSelect?.(select.value)
    );
    panel.appendChild(select);
    return panel;
  }

  buildVitalsPanel() {
    const panel = this.createPanel("Vitals");
    const grid = document.createElement("div");
    grid.className = "field-row";

    Object.keys(DEFAULT_VITALS).forEach((label) => {
      const field = document.createElement("div");
      field.className = "field";
      const title = document.createElement("span");
      title.textContent = label;
      const value = document.createElement("strong");
      value.textContent = DEFAULT_VITALS[label];
      field.append(title, value);
      grid.appendChild(field);
      this.vitalFields[label] = value;
    });

    panel.appendChild(grid);
    return panel;
  }

  buildWaveformPanel() {
    const panel = this.createPanel("Waveforms");
    const canvas = document.createElement("canvas");
    canvas.className = "waveform";
    canvas.setAttribute("aria-label", "Waveform monitor");
    panel.appendChild(canvas);
    this.waveformCanvas = canvas;
    this.waveformCtx = canvas.getContext("2d");
    return panel;
  }

  buildOrdersPanel() {
    const panel = this.createPanel("Orders");
    const grid = document.createElement("div");
    grid.className = "orders-grid";

    ORDER_BUTTONS.forEach((order) => {
      const button = this.createButton(order.label, "btn light");
      button.addEventListener("click", () => {
        this.log(`Order: ${order.label}`, "action");
        this.callbacks.onOrder?.(order.id);
      });
      grid.appendChild(button);
    });

    panel.appendChild(grid);
    return panel;
  }

  buildLogPanel() {
    const panel = this.createPanel("Log");
    const logPanel = document.createElement("div");
    logPanel.className = "log-panel";
    panel.appendChild(logPanel);
    const statusLine = document.createElement("div");
    statusLine.className = "status-line";
    statusLine.textContent = "Status: --";
    panel.appendChild(statusLine);
    this.logPanel = logPanel;
    this.statusLine = statusLine;
    return panel;
  }

  buildThreeDPanel() {
    const panel = this.createPanel("3D Controls");
    const grid = document.createElement("div");
    grid.className = "controls-grid";

    const resetButton = this.createButton("Reset Camera", "btn");
    resetButton.addEventListener("click", () =>
      this.callbacks.on3D?.("reset_camera")
    );

    const lightButton = this.createButton("Toggle Light", "btn secondary");
    lightButton.addEventListener("click", () =>
      this.callbacks.on3D?.("toggle_light")
    );

    const colorButton = this.createButton("Randomize Color", "btn tertiary");
    colorButton.addEventListener("click", () =>
      this.callbacks.on3D?.("randomize_color")
    );

    grid.append(resetButton, lightButton, colorButton);
    panel.appendChild(grid);
    return panel;
  }

  createPanel(title) {
    const panel = document.createElement("section");
    panel.className = "panel";
    const heading = document.createElement("h2");
    heading.textContent = title;
    panel.appendChild(heading);
    return panel;
  }

  createButton(label, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    return button;
  }

  resizeWaveform() {
    if (!this.waveformCanvas || !this.waveformCtx) {
      return;
    }
    const rect = this.waveformCanvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    this.waveformCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
    this.waveformCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
    this.waveformCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.waveformSize = { width: rect.width, height: rect.height };
    this.setWaveformFrame(null);
  }

  setVitals(vitals) {
    const data = vitals ? { ...DEFAULT_VITALS, ...vitals } : DEFAULT_VITALS;
    Object.entries(this.vitalFields).forEach(([label, node]) => {
      node.textContent = data[label] ?? "--";
    });
  }

  setWaveformFrame(frame) {
    if (!this.waveformCtx || !this.waveformCanvas) {
      return;
    }
    const { width, height } = this.waveformSize;
    this.waveformCtx.clearRect(0, 0, width, height);
    if (!frame) {
      return;
    }

    const points = Array.isArray(frame)
      ? frame
      : Array.isArray(frame?.points)
        ? frame.points
        : null;

    if (!points || points.length === 0) {
      return;
    }

    this.waveformCtx.strokeStyle = "#38bdf8";
    this.waveformCtx.lineWidth = 2;
    this.waveformCtx.beginPath();
    points.forEach((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - value * height;
      if (index === 0) {
        this.waveformCtx.moveTo(x, y);
      } else {
        this.waveformCtx.lineTo(x, y);
      }
    });
    this.waveformCtx.stroke();
  }

  log(line, level = "info") {
    if (!this.logPanel) {
      return;
    }
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const entry = document.createElement("div");
    entry.className = `log-line log-${level}`;
    entry.innerHTML = `<strong>${timestamp}</strong>${line}`;
    this.logPanel.appendChild(entry);
    this.logLines.push(entry);

    if (this.logLines.length > this.maxLogLines) {
      const removed = this.logLines.shift();
      removed?.remove();
    }

    this.logPanel.scrollTop = this.logPanel.scrollHeight;
  }

  setStatus(text) {
    if (this.statusLine) {
      this.statusLine.textContent = `Status: ${text}`;
    }
  }
}
