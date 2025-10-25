// ./scripts/script.js — minimal TTS: Play + Stop only

(() => {
  if (!('speechSynthesis' in window)) {
    const s = document.getElementById('tts-status');
    if (s) s.textContent = 'Text-to-speech not supported in this browser.';
    return;
  }

  const btnPlay  = document.getElementById('ttsPlay');
  const btnStop  = document.getElementById('ttsStop');
  const statusEl = document.getElementById('tts-status');

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
    console.log('[TTS]', msg);
  }


function getSelectedText() {
  const checked = Array.from(document.querySelectorAll(
    'input[type="checkbox"][name^="south-"]:checked, input[type="checkbox"][name^="north-"]:checked'
  ));
  if (!checked.length) return '';

  const groups = { south: [], north: [] };

  checked.forEach(cb => {
    const label = cb.closest('label');
    const labelText = label ? label.innerText.trim().replace(/\s+/g, ' ') : cb.name;

    // The status div was inserted right after the label in your code
    const statusDiv = label && label.nextElementSibling && label.nextElementSibling.classList?.contains('route-status')
      ? label.nextElementSibling
      : null;

    const statusText = statusDiv ? statusDiv.textContent.trim().replace(/\s+/g, ' ') : '';

    // Combine: "Route X – Name (Direction). Now at: ... • Last updated: ..."
    const combined = statusText ? `${labelText}. ${statusText}` : labelText;

    const dir = cb.name.startsWith('south-') ? 'south' : 'north';
    groups[dir].push(combined);
  });

  const parts = [];
  if (groups.south.length) parts.push(`Southbound selected: ${groups.south.join(' ')}`);
  if (groups.north.length) parts.push(`Northbound selected: ${groups.north.join(' ')}`);

  return parts.join('. ') + '.';
}

  // Chunk long text so some platforms don’t cut off
  function chunkText(text, size = 180) {
    const out = [];
    let i = 0;
    while (i < text.length) {
      let end = Math.min(i + size, text.length);
      const p = text.lastIndexOf('.', end);
      if (p > i + 40) end = p + 1;
      out.push(text.slice(i, end).trim());
      i = end;
    }
    return out.filter(Boolean);
  }

  function speakSelected() {
    const text = getSelectedText();
    if (!text) { setStatus('No routes selected.'); return; }

    // cancel anything currently speaking
    speechSynthesis.cancel();

    const chunks = chunkText(text);
    function speakNext() {
      if (!chunks.length) { setStatus('Finished.'); return; }
      const u = new SpeechSynthesisUtterance(chunks.shift());
      u.onstart = () => setStatus('Speaking…');
      u.onend   = speakNext;
      u.onerror = () => { setStatus('Error speaking; continuing…'); speakNext(); };
      speechSynthesis.speak(u);
    }
    speakNext();
  }

  btnPlay?.addEventListener('click', speakSelected);   // user gesture required on mobile
  btnStop?.addEventListener('click', () => {
    speechSynthesis.cancel();
    setStatus('Stopped.');
  });

  // Optional shortcuts: Enter = Play, Esc = Stop
  document.addEventListener('keydown', (e) => {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'Enter') { e.preventDefault(); speakSelected(); }
    if (e.key === 'Escape') { e.preventDefault(); speechSynthesis.cancel(); setStatus('Stopped.'); }
  });
})();

window.addEventListener("DOMContentLoaded", () => {
  // Pre-made fake data (you can change text anytime)
  const busData = {
    "south-2": { where: "Chemong & Towerhill Plaza", updated: "10:30 AM" },
    "south-3": { where: "Park & Charlotte Street", updated: "10:32 AM" },
    "south-4": { where: "Weller & Hilliard", updated: "10:29 AM" },
    "south-6": { where: "Sherbrooke & Monaghan", updated: "10:28 AM" },
    "south-8": { where: "Monaghan & Lansdowne", updated: "10:31 AM" },

    "north-2": { where: "Downtown Terminal (Chemong)", updated: "10:25 AM" },
    "north-3": { where: "Parkhill & Reid", updated: "10:27 AM" },
    "north-4": { where: "Water & Hunter", updated: "10:26 AM" },
    "north-6": { where: "Sherbrooke & Goodfellow", updated: "10:29 AM" },
    "north-8": { where: "Monaghan & Weller", updated: "10:24 AM" }
  };

  // Attach behavior to each checkbox
  document.querySelectorAll('.section form input[type="checkbox"]').forEach(cb => {
    const label = cb.closest('label');

    // Create status line once
    let status = label.querySelector('.route-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'route-status';
      status.style.fontSize = '0.9rem';
      status.style.margin = '4px 0 8px 26px';
      label.after(status);
    }

    cb.addEventListener('change', () => {
      if (cb.checked) {
        const data = busData[cb.name];
        if (data) {
          status.textContent = `Now at: ${data.where} • Last updated: ${data.updated}`;
        } else {
          status.textContent = "No data available for this route.";
        }
      } else {
        status.textContent = "";
      }
    });
  });
});