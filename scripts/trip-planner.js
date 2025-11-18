/* PtTransit demo trip planner — corrected labels + precise directions
   NOTE: This uses a simplified subset of stops for clarity in a class project.
   For full accuracy, load the city's GTFS feed or call Google/Transit APIs.
   Sources (route naming / high-level description):
   - City of Peterborough Transit "Routes & Schedules" and Route 2 page.
*/

/* ─────────────── Stops used in this demo (autocomplete) ─────────────── */
const STOPS = [
  "Downtown Terminal",
  "George & Simcoe",
  "Charlotte & Park",
  "Trent University (Symons)",      // Trent Bata area (north end)
  "PRHC Hospital",
  "Lansdowne Place",
  "Fleming College (Sutherland)",
  "Chemong & Milroy",
  "Ashburnham & Maria",
  "Rogers Cove"
];

/* ─────────────── Routes (simplified sequences) ───────────────
 * Each route lists stops in its 'forward' direction (index 0 -> last).
 * 'cardinals' describe forward/backward headings.
 * 'headsigns' define the terminal shown on the bus for each direction.
 */
const ROUTES = [
  {
    id: "2",
    name: "Route 2 — Chemong",
    stops: [
      "Downtown Terminal",
      "George & Simcoe",
      "Charlotte & Park",
      "Trent University (Symons)"
    ],
    cardinals: { forward: "Northbound", backward: "Southbound" },
    headsigns: { forward: "Trent University – Bata", backward: "Peterborough Terminal" }
  },
  {
    id: "6",
    name: "Route 6 — Sherbrooke",
    stops: [
      "Downtown Terminal",
      "George & Simcoe",
      "Charlotte & Park",
      "PRHC Hospital"
    ],
    cardinals: { forward: "Westbound", backward: "Eastbound" },
    headsigns: { forward: "PRHC (Sherbrooke)", backward: "Peterborough Terminal" }
  },
  {
    id: "7",
    name: "Route 7 — Lansdowne",
    stops: [
      "Downtown Terminal",
      "Lansdowne Place",
      "Fleming College (Sutherland)"
    ],
    cardinals: { forward: "Southwest", backward: "Northeast" },
    headsigns: { forward: "Fleming College", backward: "Peterborough Terminal" }
  },
  {
    id: "8",
    name: "Route 8 — Monaghan",
    stops: [
      "Downtown Terminal",
      "Charlotte & Park",
      "PRHC Hospital",
      "Fleming College (Sutherland)"
    ],
    cardinals: { forward: "Southbound", backward: "Northbound" },
    headsigns: { forward: "Fleming College", backward: "Peterborough Terminal" }
  },
  {
    id: "11",
    name: "Route 11 — Water",
    stops: [
      "Downtown Terminal",
      "Ashburnham & Maria",
      "Rogers Cove"
    ],
    cardinals: { forward: "Eastbound", backward: "Westbound" },
    headsigns: { forward: "Rogers Cove", backward: "Peterborough Terminal" }
  },
  {
    id: "12",
    name: "Route 12 — Otonabee",
    stops: [
      "Downtown Terminal",
      "Chemong & Milroy"
    ],
    cardinals: { forward: "Northbound", backward: "Southbound" },
    headsigns: { forward: "Chemong & Milroy", backward: "Peterborough Terminal" }
  }
];

/* ─────────────── helpers ─────────────── */
const $ = (id) => document.getElementById(id);

function injectStops() {
  $("stops").innerHTML = STOPS.map(s => `<option value="${s}">`).join("");
}

/* Build a label like:
 * "Route 6 — Sherbrooke (Westbound) toward PRHC (Sherbrooke)"
 */
function directionLabel(route, forward) {
  const cardinal = forward ? route.cardinals.forward : route.cardinals.backward;
  const headsign = forward ? route.headsigns.forward : route.headsigns.backward;
  return `${route.name} (${cardinal}) toward ${headsign}`;
}

/* Find direct routes that include FROM and TO (either direction) */
function findDirectRoutes(from, to) {
  const matches = [];
  for (const r of ROUTES) {
    const iFrom = r.stops.indexOf(from);
    const iTo   = r.stops.indexOf(to);
    if (iFrom !== -1 && iTo !== -1 && iFrom !== iTo) {
      const forward = iFrom < iTo;
      const label = directionLabel(r, forward);
      const between = r.stops.slice(Math.min(iFrom, iTo), Math.max(iFrom, iTo) + 1); // includes endpoints
      const passStops = between.slice(1, -1); // only intermediate stops (MAIN stops only in this demo)
      matches.push({
        route: r,
        label,
        start: from,
        end: to,
        between,
        passStops
      });
    }
  }
  return matches;
}

/* If not direct, try a two-leg trip via Downtown Terminal (hub) */
function findTransferViaDowntown(from, to) {
  const HUB = "Downtown Terminal";
  if (from === HUB || to === HUB) return null;
  const leg1 = findDirectRoutes(from, HUB)[0];
  const leg2 = findDirectRoutes(HUB, to)[0];
  if (leg1 && leg2) return { hub: HUB, leg1, leg2 };
  return null;
}

/* ─────────────── renderers ─────────────── */
function renderDirect(list) {
  const container = $("results");
  for (const m of list) {
    const passCount = m.passStops.length;

    const el = document.createElement("article");
    el.className = "result-card";
    el.innerHTML = `
      <h3 class="result-title">${m.route.name}</h3>
      <p class="result-meta"><span class="badge">Direct</span> ${m.label} — <em>main stops only</em></p>
      <ol class="steps">
        <li>At <strong>${m.start}</strong>, board <strong>${m.route.name}</strong> — <em>${m.label}</em>.</li>
        ${
          passCount > 0
            ? `<li>Pass <strong>${passCount}</strong> <em>main</em> stop${passCount > 1 ? "s" : ""}: ${m.passStops.join(" → ")}.</li>`
            : `<li>No intermediate <em>main</em> stops.</li>`
        }
        <li>Alight at <strong>${m.end}</strong>.</li>
      </ol>
    `;
    container.appendChild(el);
  }
}

function renderTransfer(obj) {
  const { hub, leg1, leg2 } = obj;
  const p1 = leg1.passStops.length;
  const p2 = leg2.passStops.length;

  const el = document.createElement("article");
  el.className = "result-card";
  el.innerHTML = `
    <h3 class="result-title">Two-leg trip (transfer at ${hub})</h3>
    <p class="result-meta"><em>main stops only</em></p>
    <ol class="steps">
      <li>From <strong>${leg1.start}</strong>, board <strong>${leg1.route.name}</strong> — <em>${leg1.label}</em>.</li>
      ${
        p1 > 0
          ? `<li>Pass <strong>${p1}</strong> <em>main</em> stop${p1 > 1 ? "s" : ""}: ${leg1.passStops.join(" → ")}.</li>`
          : `<li>No intermediate <em>main</em> stops before <strong>${hub}</strong>.</li>`
      }
      <li>Alight / transfer at <strong>${hub}</strong>.</li>
      <li>Then board <strong>${leg2.route.name}</strong> — <em>${leg2.label}</em>.</li>
      ${
        p2 > 0
          ? `<li>Pass <strong>${p2}</strong> <em>main</em> stop${p2 > 1 ? "s" : ""}: ${leg2.passStops.join(" → ")}.</li>`
          : `<li>No intermediate <em>main</em> stops.</li>`
      }
      <li>Alight at <strong>${leg2.end}</strong>.</li>
    </ol>
  `;
  $("results").appendChild(el);
}

/* ─────────────── wire up the form ─────────────── */
function setupForm() {
  const form = $("plannerForm");
  const fromEl = $("fromStop");
  const toEl = $("toStop");
  const results = $("results");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    results.innerHTML = "";

    const from = fromEl.value.trim();
    const to   = toEl.value.trim();

    if (!from || !to) {
      results.innerHTML = `<div class="result-card">Please enter both <strong>From</strong> and <strong>To</strong> stops.</div>`;
      return;
    }
    if (!STOPS.includes(from) || !STOPS.includes(to)) {
      results.innerHTML = `<div class="result-card">Unknown stop. Please choose from the suggestions.</div>`;
      return;
    }
    if (from === to) {
      results.innerHTML = `<div class="result-card">From and To are the same. Pick a different destination.</div>`;
      return;
    }

    const direct = findDirectRoutes(from, to);
    if (direct.length) {
      renderDirect(direct);
    } else {
      const transfer = findTransferViaDowntown(from, to);
      if (transfer) renderTransfer(transfer);
      else results.innerHTML = `<div class="result-card">No route found in this demo dataset. Try another pair.</div>`;
    }
  });
}

/* init */
injectStops();
setupForm();

(() => {
  if (!("speechSynthesis" in window)) {
    const s = document.getElementById("tts-status");
    if (s) s.textContent = "Text-to-speech not supported in this browser.";
    return;
  }

  const btnPlay   = document.getElementById("ttsPlay");
  const btnStop   = document.getElementById("ttsStop");
  const statusEl  = document.getElementById("tts-status");
  const resultsEl = document.getElementById("results");

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
    console.log("[TTS]", msg);
  }

  function getDirectionsText() {
    if (!resultsEl) return "";
    const text = resultsEl.innerText || resultsEl.textContent || "";
    return text.trim();
  }

  // Chunk long text so some platforms don’t cut off mid-sentence
  function chunkText(text, size = 180) {
    const out = [];
    let i = 0;
    while (i < text.length) {
      let end = Math.min(i + size, text.length);
      const p = text.lastIndexOf(".", end);
      if (p > i + 40) end = p + 1;
      out.push(text.slice(i, end).trim());
      i = end;
    }
    return out.filter(Boolean);
  }

  function speakDirections() {
    const text = getDirectionsText();
    if (!text) {
      setStatus("No directions to read yet. Plan a trip first.");
      return;
    }

    // Cancel any existing speech
    speechSynthesis.cancel();

    const chunks = chunkText(text);

    function speakNext() {
      if (!chunks.length) {
        setStatus("Finished.");
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks.shift());
      u.onstart = () => setStatus("Speaking…");
      u.onend   = speakNext;
      u.onerror = () => {
        setStatus("Error speaking; continuing…");
        speakNext();
      };
      speechSynthesis.speak(u);
    }

    speakNext();
  }

  btnPlay?.addEventListener("click", speakDirections);
  btnStop?.addEventListener("click", () => {
    speechSynthesis.cancel();
    setStatus("Stopped.");
  });

  // Optional shortcuts: Enter = Play, Esc = Stop (when not typing in inputs)
  document.addEventListener("keydown", (e) => {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === "Enter") {
      e.preventDefault();
      speakDirections();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      speechSynthesis.cancel();
      setStatus("Stopped.");
    }
  });
})();