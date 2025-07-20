const fs = require('fs');
const path = require('path');

const notesDir = path.join(__dirname, 'notes');
const settingsPath = path.join(__dirname, 'settings.json');

if (!fs.existsSync(notesDir)) fs.mkdirSync(notesDir);

let notes = [];
let selected = null;
let settings = { dark: true, fontSize: 18 };

// --- Settings ---
function loadSettings() {
    if (fs.existsSync(settingsPath)) {
        try {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        } catch {
            settings = { dark: true, fontSize: 18 };
        }
    }
}
function saveSettings() {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
}

// --- Notes ---
function sanitizeTitle(title) {
    return (title || 'untitled').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
}
function noteFilename(note) {
    const base = sanitizeTitle(note.title);
    const ts = note.updated ? note.updated.replace(/[^\d]/g, '') : Date.now();
    return `${base}_${ts}.json`;
}
function loadNotes() {
    notes = [];
    const files = fs.readdirSync(notesDir).filter(f => f.endsWith('.json'));
    files.forEach(file => {
        try {
            const content = fs.readFileSync(path.join(notesDir, file), 'utf-8');
            const note = JSON.parse(content);
            note._filename = file;
            notes.push(note);
        } catch {
            // skip corrupted files
        }
    });
}
function saveNoteToFile(note, filename = null) {
    const fname = filename || noteFilename(note);
    note._filename = fname;
    fs.writeFileSync(path.join(notesDir, fname), JSON.stringify(note, null, 2), 'utf-8');
    return fname;
}
function deleteNoteFile(note) {
    if (note._filename && fs.existsSync(path.join(notesDir, note._filename))) {
        fs.unlinkSync(path.join(notesDir, note._filename));
    }
}

// --- UI Logic ---
function saveCurrentNoteIfAny() {
    if (selected !== null && notes[selected]) {
        const title = document.getElementById("notes__title").value.trim();
        const body = document.getElementById("notes__body").value.trim();
        const tags = document.getElementById("notes__tags").value.split(',').map(t=>t.trim()).filter(Boolean);
        const now = new Date().toLocaleString();
        let note = notes[selected];
        const oldFilename = note._filename;
        note = { title, body, tags, updated: now };
        let newFilename = noteFilename(note);

        // If filename changed (title or updated changed), rename file
        if (oldFilename && oldFilename !== newFilename) {
            // Remove old file, save new
            deleteNoteFile({ _filename: oldFilename });
            saveNoteToFile(note, newFilename);
        } else {
            saveNoteToFile(note, oldFilename);
            newFilename = oldFilename;
        }
        note._filename = newFilename;
        notes[selected] = note;
        loadNotes();
        selected = notes.findIndex(n => n._filename === newFilename);
        renderNotesList(document.getElementById("searchInput").value);
    }
}
function renderNotesList(filter = "") {
    const container = document.getElementById("All_item_notes");
    let filtered = notes;

    // Tag filter
    const tagFilterRaw = document.getElementById("tagFilterInput")?.value || "";
    const tagFilters = tagFilterRaw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    if (tagFilters.length > 0) {
        filtered = filtered.filter(n =>
            n.tags && n.tags.some(tag => tagFilters.includes(tag.toLowerCase()))
        );
    }

    // Search filter
    if (filter) {
        const f = filter.toLowerCase();
        filtered = filtered.filter(n =>
            (n.title && n.title.toLowerCase().includes(f)) ||
            (n.body && n.body.toLowerCase().includes(f)) ||
            (n.tags && n.tags.join(',').toLowerCase().includes(f))
        );
    }

    if (!filtered.length) {
        container.innerHTML = `<div style="color:#888;text-align:center;">No Notes Currently</div>`;
        return;
    }
    container.innerHTML = filtered.map((note, idx) => `
        <div class="notes__list-item${selected === idx ? ' selected' : ''}">
            <div onclick="selectNote(${idx})" style="cursor:pointer;">
                <div class="notes__small-title">${note.title || '(Untitled)'}</div>
                <div class="notes__small-body">${note.body ? note.body.slice(0, 60) : ''}</div>
                <div class="notes__small-updated">
                    ${note.tags && note.tags.length ? note.tags.map(t=>`<span>${t}</span>`).join(' ') : ''}
                    <span style="float:right;">${note.updated || ''}</span>
                </div>
            </div>
            <button class="sidebar-delete-btn" data-idx="${idx}" style="margin-top:0.5em;background:linear-gradient(90deg,#ff5858 0%,#ffae53 100%);color:#fff;border:none;border-radius:6px;padding:0.2em 0.8em;font-weight:600;cursor:pointer;float:right;">🗑️</button>
        </div>
    `).join('');

    // Add event listeners for sidebar delete buttons
    Array.from(container.querySelectorAll('.sidebar-delete-btn')).forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const idx = parseInt(this.getAttribute('data-idx'), 10);
            deleteSpecificNote(idx);
        });
    });
}
function deleteSpecificNote(idx) {
    if (!notes[idx]) return;
    if (!confirm("Delete this note?")) return;
    deleteNoteFile(notes[idx]);
    notes.splice(idx, 1);
    if (selected === idx) {
        if (notes.length === 0) {
            selected = null;
            clearEditor();
        } else if (selected >= notes.length) {
            selected = notes.length - 1;
            selectNote(selected);
        } else {
            selectNote(selected);
        }
    } else if (selected > idx) {
        selected -= 1;
    }
    loadNotes();
    notesChanged();
}
function selectNote(idx) {
    saveCurrentNoteIfAny();
    selected = idx;
    const note = notes[idx];
    document.getElementById("notes__title").value = note.title || '';
    document.getElementById("notes__body").value = note.body || '';
    document.getElementById("notes__tags").value = note.tags ? note.tags.join(', ') : '';
    renderNotesList(document.getElementById("searchInput").value);
    updateStats();
    renderPreview();
}
function clearEditor() {
    if (selected !== null) saveCurrentNoteIfAny();
    document.getElementById("notes__title").value = '';
    document.getElementById("notes__body").value = '';
    document.getElementById("notes__tags").value = '';
    selected = null;
    renderNotesList(document.getElementById("searchInput").value);
    updateStats();
    renderPreview();
}
function updateStats() {
    const body = document.getElementById("notes__body").value;
    const words = body.trim().split(/\s+/).filter(Boolean).length;
    const chars = body.length;
    document.getElementById("noteStats").textContent = `Words: ${words} | Characters: ${chars}`;
}
function renderPreview() {
    const preview = document.getElementById("renderedPreview");
    let text = document.getElementById("notes__body").value;
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        lang = lang || 'javascript';
        return `<pre><code class="language-${lang}">${Prism.highlight(code, Prism.languages[lang] || Prism.languages.javascript, lang)}</code></pre>`;
    });
    text = text.replace(/`([^`]+)`/g, (m, code) => `<code>${code}</code>`);
    text = text.replace(/\$\$([^$]+)\$\$/g, (m, math) => {
        try { return katex.renderToString(math, {displayMode:true}); } catch { return m; }
    });
    text = text.replace(/\$([^$]+)\$/g, (m, math) => {
        try { return katex.renderToString(math, {displayMode:false}); } catch { return m; }
    });
    preview.innerHTML = text;
}



// --- Tag Dropdown ---
function getAllTags() {
    const tagSet = new Set();
    notes.forEach(note => {
        if (note.tags && Array.isArray(note.tags)) {
            note.tags.forEach(tag => tagSet.add(tag));
        }
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
}
function updateTagDropdown() {
    const dropdown = document.getElementById("tagDropdownList");
    const allTags = getAllTags();
    if (!allTags.length) {
        dropdown.innerHTML = `<div style="color:#888;">No tags defined</div>`;
        return;
    }
    dropdown.innerHTML = allTags.map(tag => `<div data-tag="${tag}">${tag}</div>`).join('');
}
const tagInput = document.getElementById("tagFilterInput");
const tagDropdown = document.getElementById("tagDropdownList");
tagInput.addEventListener("focus", () => {
    updateTagDropdown();
    tagDropdown.classList.add("show");
});
tagInput.addEventListener("blur", () => {
    setTimeout(() => tagDropdown.classList.remove("show"), 150);
});
tagDropdown.addEventListener("mousedown", (e) => {
    if (e.target && e.target.dataset.tag) {
        let current = tagInput.value.split(",").map(s => s.trim()).filter(Boolean);
        if (!current.map(t=>t.toLowerCase()).includes(e.target.dataset.tag.toLowerCase())) {
            current.push(e.target.dataset.tag);
            tagInput.value = current.join(", ");
            tagInput.dispatchEvent(new Event("input"));
        }
    }
});
function notesChanged() {
    updateTagDropdown();
    renderNotesList(document.getElementById("searchInput").value);
}

// --- Settings UI ---
function applySettings() {
    document.body.style.fontSize = settings.fontSize + 'px';
    document.getElementById('fontSizeValue').textContent = settings.fontSize;
    document.getElementById('toggleDarkMode').checked = settings.dark;
    document.getElementById('fontSizeSlider').value = settings.fontSize;
    if (settings.dark) {
        document.body.style.background = "#181A1B";
        document.body.style.color = "#F3F4F6";
    } else {
        document.body.style.background = "#f7f7f7";
        document.body.style.color = "#23272F";
    }
}

// --- Initial load ---
window.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    applySettings();
    loadNotes();
    renderNotesList();
    clearEditor();

    // Attach event listeners here to ensure DOM is loaded
    document.getElementById("notes__add").addEventListener("click", () => {
        const title = document.getElementById("notes__title").value.trim();
        const body = document.getElementById("notes__body").value.trim();
        const tags = document.getElementById("notes__tags").value.split(',').map(t=>t.trim()).filter(Boolean);
        if (!title && !body) {
            alert("Please enter a title or note body.");
            return;
        }
        const now = new Date().toLocaleString();
        if (selected !== null && notes[selected]) {
            let note = notes[selected];
            const oldFilename = note._filename;
            note = { title, body, tags, updated: now };
            let newFilename = noteFilename(note);
            if (oldFilename && oldFilename !== newFilename) {
                deleteNoteFile({ _filename: oldFilename });
                saveNoteToFile(note, newFilename);
            } else {
                saveNoteToFile(note, oldFilename);
                newFilename = oldFilename;
            }
            note._filename = newFilename;
            notes[selected] = note;
            loadNotes();
            selected = notes.findIndex(n => n._filename === newFilename);
        } else {
            let note = { title, body, tags, updated: now };
            const filename = saveNoteToFile(note);
            loadNotes();
            selected = notes.findIndex(n => n._filename === filename);
        }
        notesChanged();
        updateStats();
        renderPreview();
    });

    document.getElementById("notes__body").addEventListener("input", () => {
        updateStats();
        renderPreview();
    });
    document.getElementById("notes__title").addEventListener("input", updateStats);
    document.getElementById("notes__tags").addEventListener("input", updateStats);
    document.getElementById("searchInput").addEventListener("input", (e) => {
        renderNotesList(e.target.value);
    });
    document.getElementById("tagFilterInput").addEventListener("input", () => {
        renderNotesList(document.getElementById("searchInput").value);
    });
    document.getElementById("settingsBtn").addEventListener("click", () => {
        document.getElementById("settingsPanel").classList.remove("hidden");
        applySettings();
    });
    document.getElementById("closeSettings").addEventListener("click", () => {
        document.getElementById("settingsPanel").classList.add("hidden");
    });
    document.getElementById("toggleDarkMode").addEventListener("change", (e) => {
        settings.dark = e.target.checked;
        saveSettings();
        applySettings();
    });
    document.getElementById("fontSizeSlider").addEventListener("input", (e) => {
        settings.fontSize = parseInt(e.target.value, 10);
        saveSettings();
        applySettings();
    });
    window.addEventListener("keydown", function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            saveCurrentNoteIfAny();
        }
    });
    document.getElementById("notes__new").addEventListener("click", () => {
        saveCurrentNoteIfAny();
        document.getElementById("notes__title").value = '';
        document.getElementById("notes__body").value = '';
        document.getElementById("notes__tags").value = '';
        selected = null;
        updateStats();
        renderPreview();
        notesChanged();
    });
});

// --- Expose selectNote for sidebar click ---
window.selectNote = selectNote;