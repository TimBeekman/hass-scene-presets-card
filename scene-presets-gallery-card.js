class ScenePresetsGalleryCard extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign(
      {
        title: "Scene Presets",
        service: "scene_presets.start_dynamic_scene",  // or scene_presets.apply_preset
        service_data: { preset_id: "{{id}}" },
        include_categories: null,   // array of category NAMES to include (after id→name mapping)
        columns: null,              // integer for fixed columns; default auto-fill
        show_controls: true,        // show sliders/toggle header
        show_background: true,      // remove ha-card background/border/shadow when false
        haptic_feedback: false,     // NEW: light haptic on tile tap when true
        id: undefined,              // optional: stable id to scope localStorage
        // initial defaults (override in YAML)
        default_transition: 2,
        default_interval: 60,
        default_brightness: 200,
        default_custom_brightness: false,
        debug: false,
      },
      config || {}
    );
  }

  static getStubConfig() {
    return {
      title: "Dynamic scenes",
      service: "scene_presets.start_dynamic_scene",
      service_data: { preset_id: "{{id}}" },
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._root) {
      this._root = this.attachShadow({ mode: "open" });
      this._root.innerHTML = `
        <ha-card>
          <div class="header"></div>
          <div class="controls" style="display:none"></div>
          <div id="content" class="grid"></div>
        </ha-card>
        <style>
          /* remove background/border/shadow when .no-bg is applied to ha-card */
          ha-card.no-bg {
            background: none !important;
            box-shadow: none !important;
            border: none !important;
          }

          .header {
            font-weight: 600;
            padding: 12px 16px 0 16px;
          }
          .header.hidden { display: none; }

          /* --- controls: stacked label + full-width slider + value at right --- */
          .controls { padding: 8px 16px 0 16px; display: grid; gap: 8px; }
          .switchRow { display: flex; align-items: center; gap: 8px; }
          .switchRow label { font-weight: 600; opacity: .9; }
          .group { display: grid; gap: 4px; }
          .group .lbl { opacity: .85; }
          .group .track {
            display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px;
          }
          .group input[type="range"] { width: 100%; }
          .group .val {
            min-width: 3ch; text-align: right; opacity: .8; font-variant-numeric: tabular-nums;
          }

          /* --- gallery --- */
          .grid {
            display: grid; gap: 12px;
            padding: 12px 16px 16px 16px;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
          :host([columns]) .grid { grid-template-columns: repeat(var(--spgc-columns), 1fr); }
          .category { grid-column: 1 / -1; font-weight: 600; opacity: .85; margin-top: 6px; }

          .tile {
            position: relative;
            border-radius: var(--ha-card-border-radius, 12px);
            overflow: hidden;
            cursor: pointer;
            border: 1px solid var(--divider-color);
            transition: transform .06s ease;
          }
          .tile:active { transform: scale(.98); }
          .tile img, .tile .ph {
            display: block;
            width: 100%;
            aspect-ratio: 16/9;
            object-fit: cover;
            background: var(--secondary-background-color);
            border-radius: inherit;
          }

          /* bottom gradient (sits under text) */
          .tile::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.0) 60%);
            pointer-events: none;
            z-index: 0;
          }

          /* title: white, no blur; extra inner padding for left gap */
          .label {
            position: absolute;
            left: 8px;
            right: 8px;
            bottom: 8px;
            padding-left: 8px;
            padding-bottom: 8px;
            font-size: 0.9em;
            font-weight: 600;
            color: #fff;
            text-shadow: 0 0 3px rgba(0,0,0,0.6);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            z-index: 1;
          }
          
          .empty { grid-column: 1/-1; opacity: .7; padding: 4px 0 8px; }
          .error { grid-column: 1/-1; color: var(--error-color); }

          .header {
            font-weight: 600;
            padding: 12px 16px 0 16px;
          }
    
          /* normalize control label weights */
          .switchRow label {
            font-weight: normal;   /* match other text */
            opacity: .9;
          }
    
          .group label {
            font-weight: normal;   /* ensure consistent font style */
            opacity: .9;
          }
        </style>
      `;

      // columns override
      if (this._config.columns) {
        this.setAttribute("columns", "");
        this._root.host.style.setProperty("--spgc-columns", this._config.columns);
      }

      // apply background choice
      const card = this._root.querySelector("ha-card");
      if (this._config.show_background === false) {
        card.classList.add("no-bg");
      }

      this._state = this._loadState();
      this._renderHeader();
      this._renderControls();
      this._load();
    }
  }

  /* ---------- state persistence ---------- */
  _storageKey() {
    const base = this._config.id || this._config.title || "default";
    return `spgc:${base}`;
  }
  _loadState() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(this._storageKey()) || "{}"); } catch {}
    return {
      transition: saved.transition ?? this._config.default_transition,
      interval: saved.interval ?? this._config.default_interval,
      brightness: saved.brightness ?? this._config.default_brightness,
      customBrightness: saved.customBrightness ?? this._config.default_custom_brightness,
    };
  }
  _saveState() {
    try { localStorage.setItem(this._storageKey(), JSON.stringify(this._state)); } catch {}
  }

  _renderHeader() {
    const el = this._root.querySelector(".header");
    const hasTitle =
      this._config.title !== null &&
      this._config.title !== undefined &&
      String(this._config.title).trim() !== "";
    if (hasTitle) {
      el.textContent = this._config.title;
      el.classList.remove("hidden");
    } else {
      el.textContent = "";
      el.classList.add("hidden");
    }
  }

  _renderControls() {
    const ctr = this._root.querySelector(".controls");
    if (!this._config.show_controls) { ctr.style.display = "none"; return; }
    ctr.style.display = "block";

    ctr.innerHTML = `
      <div class="switchRow">
        <label>Custom Brightness</label>
        <input id="cb" type="checkbox" ${this._state.customBrightness ? "checked" : ""}>
      </div>

      <div class="group" id="bGroup" style="${this._state.customBrightness ? "" : "display:none"}">
        <div class="track">
          <input id="b" type="range" min="0" max="255" step="1" value="${this._state.brightness}">
          <div class="val" id="bVal">${this._state.brightness}</div>
        </div>
      </div>

      <div class="group">
        <div class="lbl">Transition</div>
        <div class="track">
          <input id="t" type="range" min="0" max="300" step="1" value="${this._state.transition}">
          <div class="val" id="tVal">${this._state.transition}s</div>
        </div>
      </div>

      <div class="group">
        <div class="lbl">Interval</div>
        <div class="track">
          <input id="i" type="range" min="0" max="300" step="1" value="${this._state.interval}">
          <div class="val" id="iVal">${this._state.interval}s</div>
        </div>
      </div>
    `;

    const $ = (id) => this._root.getElementById(id);

    $("cb").addEventListener("change", (e) => {
      this._state.customBrightness = !!e.target.checked;
      this._root.getElementById("bGroup").style.display = this._state.customBrightness ? "" : "none";
      this._saveState();
    });
    $("b")?.addEventListener("input", (e) => {
      this._state.brightness = Number(e.target.value);
      this._root.getElementById("bVal").textContent = this._state.brightness;
      this._saveState();
    });
    $("t").addEventListener("input", (e) => {
      this._state.transition = Number(e.target.value);
      this._root.getElementById("tVal").textContent = `${this._state.transition}s`;
      this._saveState();
    });
    $("i").addEventListener("input", (e) => {
      this._state.interval = Number(e.target.value);
      this._root.getElementById("iVal").textContent = `${this._state.interval}s`;
      this._saveState();
    });
  }

  _log(...a){ if (this._config.debug) console.debug("[sp-gallery]", ...a); }

  /* ---------- data loading + rendering ---------- */
  async _load() {
    const content = this._root.querySelector("#content");
    content.innerHTML = `<div class="empty">Loading…</div>`;
    try {
      // served at /assets/scene_presets/scene_presets.json as { result: PRESET_DATA }
      const res = await fetch("/assets/scene_presets/scene_presets.json");
      const raw = await res.json();
      const data = raw?.result ?? raw;

      const presets = Array.isArray(data?.presets) ? data.presets : [];
      const catNameForPreset = this._buildCategoryResolver(data);

      const groups = {};
      for (const p of presets) {
        const cat = catNameForPreset(p) || "Other";
        if (this._config.include_categories && !this._config.include_categories.includes(cat)) continue;
        (groups[cat] ||= []).push(p);
      }

      content.innerHTML = "";
      const cats = Object.keys(groups).sort();
      if (!cats.length) { content.innerHTML = `<div class="empty">No presets found.</div>`; return; }
      for (const cat of cats) {
        const catEl = document.createElement("div");
        catEl.className = "category";
        catEl.textContent = cat;
        content.appendChild(catEl);

        for (const p of groups[cat]) content.appendChild(this._makeTile(p));
      }
    } catch (e) {
      content.innerHTML = `<div class="error">Failed to load presets: ${e}</div>`;
    }
  }

  _buildCategoryResolver(data) {
    const categories = Array.isArray(data?.categories) ? data.categories : [];
    const map = new Map();
    for (const c of categories) {
      if (c && typeof c === "object") {
        const id = c.id ?? c.category_id ?? c.categoryId ?? c.key ?? c.slug ?? c.value;
        const name = c.name ?? c.label ?? c.title ?? c.text ?? String(id ?? "");
        if (id != null) map.set(String(id), String(name));
        if (name != null) map.set(String(name), String(name));
      } else if (typeof c === "string") {
        map.set(c, c);
      }
    }
    return (p) => {
      let raw = p.category ?? p.category_id ?? p.categoryId ?? p.cat ?? null;
      if (raw && typeof raw === "object") {
        const id = raw.id ?? raw.category_id ?? raw.categoryId ?? raw.key ?? raw.slug;
        const name = raw.name ?? raw.label ?? raw.title ?? raw.text;
        if (name) return String(name);
        if (id != null && map.has(String(id))) return map.get(String(id));
        if (id != null) return String(id);
      }
      if (raw != null) {
        const key = String(raw);
        if (map.has(key)) return map.get(key);
        return key;
      }
      return "Other";
    };
  }

  _makeTile(preset) {
    const tile = document.createElement("div");
    tile.className = "tile";
    const imgUrl = preset.img ? `/assets/scene_presets/${preset.img}` : null;
    tile.innerHTML = `
      ${imgUrl ? `<img loading="lazy" src="${imgUrl}" alt="">` : `<div class="ph"></div>`}
      <div class="label" title="${preset.name || preset.id}">${preset.name || preset.id}</div>
    `;
    tile.addEventListener("click", () => {
      if (this._config.haptic_feedback) this._haptic("light");
      this._invokeService(preset);
    });
    return tile;
  }

  /* ---------- service call ---------- */
  _invokeService(preset) {
    const svc = (this._config.service || "").trim();
    const [domain, service] = svc.split(".");
    if (!domain || !service || !this._hass) return;

    // Expand simple placeholders in service_data
    const expand = (val) => {
      if (typeof val === "string") {
        return val
          .replaceAll("{{id}}", preset.id ?? "")
          .replaceAll("{{name}}", preset.name ?? "")
          .replaceAll("{{category}}", preset.category ?? preset.category_id ?? preset.categoryId ?? preset.cat ?? "")
          .replaceAll("{{img}}", preset.img ?? "")
          .replaceAll("{{custom}}", String(!!preset.custom));
      }
      if (Array.isArray(val)) return val.map(expand);
      if (val && typeof val === "object") { const o={}; for (const [k,v] of Object.entries(val)) o[k]=expand(v); return o; }
      return val;
    };
    const data = expand(this._config.service_data || {});

    // Inject control values
    data.transition = this._state.transition;
    data.interval = this._state.interval;
    if (this._state.customBrightness) {
      data.brightness = this._state.brightness;
    } else if ("brightness" in data) {
      delete data.brightness;
    }

    this._hass.callService(domain, service, data);
  }

  /* ---------- haptics ---------- */
  _haptic(kind = "light") {
    // 0) Home Assistant native helper (preferred in HA iOS/Android apps)
    try {
      if (this._hass && typeof this._hass.haptic === "function") {
        this._hass.haptic(kind);
      }
    } catch {}

    // 1) Global 'haptic' events (some HA app versions listen here)
    try {
      // Common payload used by HA core: { haptic: "light" }
      const evtObj = new CustomEvent("haptic", {
        bubbles: true,
        composed: true,
        detail: { haptic: kind },
      });
      // Some builds expect detail to be just the string "light"
      const evtStr = new CustomEvent("haptic", {
        bubbles: true,
        composed: true,
        detail: kind,
      });
      // As a last-ditch, a plain Event (no detail)
      const evtPlain = new Event("haptic", { bubbles: true, composed: true });

      // Dispatch on all likely targets
      const targets = [
        this,                  // this element
        this._root?.host,      // shadow host
        document.body,         // body
        document,              // document
        window,                // window
      ].filter(Boolean);

      for (const t of targets) {
        try { t.dispatchEvent(evtObj); } catch {}
        try { t.dispatchEvent(evtStr); } catch {}
        try { t.dispatchEvent(evtPlain); } catch {}
      }
    } catch {}

    // 2) Android/web fallback (no effect on iOS)
    try {
      if (navigator && navigator.vibrate) navigator.vibrate(10);
    } catch {}
  }
}
customElements.define("scene-presets-gallery-card", ScenePresetsGalleryCard);
