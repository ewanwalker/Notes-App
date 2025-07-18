let notes = JSON.parse(localStorage.getItem("notes")) || [];
let selected = null;
let settings = JSON.parse(localStorage.getItem("settings")) || { dark: true, fontSize: 18 };

function saveNotes() {
    localStorage.setItem("notes", JSON.stringify(notes));
}
function saveSettings() {
    localStorage.setItem("settings", JSON.stringify(settings));
}

function saveCurrentNoteIfAny() {
    if (selected !== null && notes[selected]) {
        const title = document.getElementById("notes__title").value.trim();
        const body = document.getElementById("notes__body").value.trim();
        const tags = document.getElementById("notes__tags").value.split(',').map(t=>t.trim()).filter(Boolean);
        const now = new Date().toLocaleString();
        notes[selected] = { title, body, tags, updated: now };
        saveNotes();
        renderNotesList(document.getElementById("searchInput").value);
    }
}

function renderNotesList(filter = "") {
    const container = document.getElementById("All_item_notes");
    let filtered = notes;

    // Tag filter (case-insensitive, comma separated)
    const tagFilterRaw = document.getElementById("tagFilterInput")?.value || "";
    const tagFilters = tagFilterRaw
        .split(",")
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

    if (tagFilters.length > 0) {
        filtered = filtered.filter(n =>
            n.tags && n.tags.some(tag => tagFilters.includes(tag.toLowerCase()))
        );
    }

    // Search filter (case-insensitive)
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
        <div class="notes__list-item${selected === idx ? ' selected' : ''}" onclick="selectNote(${idx})">
            <div class="notes__small-title">${note.title || '(Untitled)'}</div>
            <div class="notes__small-body">${note.body ? note.body.slice(0, 60) : ''}</div>
            <div class="notes__small-updated">
                ${note.tags && note.tags.length ? note.tags.map(t=>`<span>${t}</span>`).join(' ') : ''}
                <span style="float:right;">${note.updated || ''}</span>
            </div>
        </div>
    `).join('');
}

function selectNote(idx) {
    saveCurrentNoteIfAny(); // Save previous note before switching
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

    // Render code blocks (markdown style)
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        lang = lang || 'javascript';
        return `<pre><code class="language-${lang}">${Prism.highlight(code, Prism.languages[lang] || Prism.languages.javascript, lang)}</code></pre>`;
    });

    // Render inline code
    text = text.replace(/`([^`]+)`/g, (m, code) => `<code>${code}</code>`);

    // Render LaTeX math ($...$ or $$...$$)
    text = text.replace(/\$\$([^$]+)\$\$/g, (m, math) => {
        try { return katex.renderToString(math, {displayMode:true}); } catch { return m; }
    });
    text = text.replace(/\$([^$]+)\$/g, (m, math) => {
        try { return katex.renderToString(math, {displayMode:false}); } catch { return m; }
    });

    preview.innerHTML = text;
}

// Save or update note
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
        notes[selected] = { title, body, tags, updated: now };
    } else {
        notes.unshift({ title, body, tags, updated: now });
        selected = 0;
    }
    saveNotes();
    notesChanged();
    updateStats();
    renderPreview();
});

// Delete note
document.getElementById("notes__delete").addEventListener("click", () => {
    if (selected === null) {
        alert("No note selected.");
        return;
    }
    if (!confirm("Delete this note?")) return;
    notes.splice(selected, 1);
    clearEditor();
    saveNotes();
    notesChanged();
});

// Live update stats and preview
document.getElementById("notes__body").addEventListener("input", () => {
    updateStats();
    renderPreview();
});
document.getElementById("notes__title").addEventListener("input", updateStats);
document.getElementById("notes__tags").addEventListener("input", updateStats);

// Search
document.getElementById("searchInput").addEventListener("input", (e) => {
    renderNotesList(e.target.value);
});
document.getElementById("tagFilterInput").addEventListener("input", () => {
    renderNotesList(document.getElementById("searchInput").value);
});

// Settings
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

// Ctrl+S to save
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

// Show/hide dropdown on focus/blur
const tagInput = document.getElementById("tagFilterInput");
const tagDropdown = document.getElementById("tagDropdownList");

tagInput.addEventListener("focus", () => {
    updateTagDropdown();
    tagDropdown.classList.add("show");
});
tagInput.addEventListener("blur", () => {
    setTimeout(() => tagDropdown.classList.remove("show"), 150); // allow click
});

// Add tag to input when clicked
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

// Update dropdown when notes change
function notesChanged() {
    updateTagDropdown();
    renderNotesList(document.getElementById("searchInput").value);
}

// Replace all renderNotesList(...) calls after note changes with notesChanged();
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
        notes[selected] = { title, body, tags, updated: now };
    } else {
        notes.unshift({ title, body, tags, updated: now });
        selected = 0;
    }
    saveNotes();
    notesChanged();
    updateStats();
    renderPreview();
});

document.getElementById("notes__delete").addEventListener("click", () => {
    if (selected === null) {
        alert("No note selected.");
        return;
    }
    if (!confirm("Delete this note?")) return;
    notes.splice(selected, 1);
    clearEditor();
    saveNotes();
    notesChanged();
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
window.selectNote = selectNote;

applySettings();
renderNotesList();
clearEditor();