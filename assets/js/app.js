// ===== NAVIGATION =====
let previousView = null;

function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  const titles = {
    dashboard: 'Dashboard',
    poids: 'Poids & Mensurations',
    macros: 'Macros & Nutrition',
    seances: 'Séances & Exercices'
  };
  document.getElementById('page-title').textContent = titles[view];
  const navIndex = { dashboard: 0, poids: 1, macros: 2, seances: 3 };
  document.querySelectorAll('.nav-btn')[navIndex[view]].classList.add('active');
  document.getElementById('back-btn').style.display = 'none';
  if (view === 'poids') initPoids();
  if (view === 'seances') initSeances();
  if (view === 'dashboard') updateDashboard();
}

function goBack() {
  if (previousView === 'seance-detail') {
    showSeancesList();
  }
}

// ===== DASHBOARD =====
function updateDashboard() {
  const entries = getEntries();
  if (entries.length > 0) {
    const last = entries[entries.length - 1];
    document.getElementById('dash-poids').textContent = last.poids + ' kg';
  }
  const log = getSeancesLog();
  document.getElementById('dash-seances').textContent = log.length + ' séances';
}

// ===== STORAGE POIDS =====
function getConfig() { return JSON.parse(localStorage.getItem('poidsConfig') || 'null'); }
function saveConfig(c) { localStorage.setItem('poidsConfig', JSON.stringify(c)); }
function getEntries() { return JSON.parse(localStorage.getItem('poidsEntries') || '[]'); }
function saveEntries(e) { localStorage.setItem('poidsEntries', JSON.stringify(e)); }

// ===== STORAGE SÉANCES =====
function getProgramme() {
  const def = defaultProgramme();
  return JSON.parse(localStorage.getItem('programme') || JSON.stringify(def));
}
function saveProgramme(p) { localStorage.setItem('programme', JSON.stringify(p)); }
function getSeancesLog() { return JSON.parse(localStorage.getItem('seancesLog') || '[]'); }
function saveSeancesLog(l) { localStorage.setItem('seancesLog', JSON.stringify(l)); }

// ===== PROGRAMME PAR DÉFAUT =====
function defaultProgramme() {
  return [
    {
      id: 'push',
      nom: 'PUSH',
      type: 'push',
      muscles: 'Pecs · Épaules · Triceps',
      exercices: [
        { id: 'e1', nom: 'Pompes écartées', series: 3, reps: 15, charge: 0, reposSeries: 120, reposExo: 180, comment: '' },
        { id: 'e2', nom: 'Dips pieds surélevés 30cm', series: 3, reps: 15, charge: 6, reposSeries: 120, reposExo: 180, comment: '' },
        { id: 'e3', nom: 'Élévations latérales', series: 3, reps: 15, charge: 5, reposSeries: 120, reposExo: 180, comment: '' },
        { id: 'e4', nom: 'Pompes', series: 3, reps: 15, charge: 0, reposSeries: 120, reposExo: 180, comment: '' },
        { id: 'e5', nom: 'Extension triceps', series: 3, reps: 15, charge: 7.5, reposSeries: 120, reposExo: 180, comment: '' },
      ]
    },
    {
      id: 'pull',
      nom: 'PULL',
      type: 'pull',
      muscles: 'Dos · Biceps · Trapèzes',
      exercices: [
        { id: 'e6', nom: 'Rowing bûcheron', series: 3, reps: 15, charge: 7.5, reposSeries: 120, reposExo: 180, comment: '' },
        { id: 'e7', nom: 'Pullover', series: 3, reps: 15, charge: 8.75, reposSeries: 120, reposExo: 180, comment: '' },
        { id: 'e8', nom: 'Curls', series: 3, reps: 15, charge: 3.75, reposSeries: 120, reposExo: 180, comment: '' },
        { id: 'e9', nom: 'Rowing coudes ouverts', series: 3, reps: 15, charge: 3.75, reposSeries: 120, reposExo: 180, comment: '' },
        { id: 'e10', nom: 'Oiseau / élévation arrière', series: 3, reps: 15, charge: 1.75, reposSeries: 120, reposExo: 180, comment: '' },
      ]
    },
    {
      id: 'legs',
      nom: 'LEGS',
      type: 'legs',
      muscles: 'Quadriceps · Ischios · Fessiers',
      exercices: [
        { id: 'e11', nom: 'Fentes bulgares', series: 3, reps: 15, charge: 0, reposSeries: 120, reposExo: 180, comment: '' },
      ]
    }
  ];
}

// ===== INIT SÉANCES =====
let currentSeanceId = null;

function initSeances() {
  showSeancesList();
}

function showSeancesList() {
  document.getElementById('seances-list-view').style.display = 'block';
  document.getElementById('seance-detail-view').style.display = 'none';
  document.getElementById('back-btn').style.display = 'none';
  document.getElementById('page-title').textContent = 'Séances & Exercices';
  renderSeancesCards();
  renderCalendar();
}

function renderSeancesCards() {
  const programme = getProgramme();
  const log = getSeancesLog();
  const container = document.getElementById('seances-cards');

  container.innerHTML = programme.map(seance => {
    const derniere = [...log].reverse().find(l => l.seanceId === seance.id);
    const derniereDate = derniere ? formatDate(derniere.date) : 'Jamais effectuée';
    const pillsHTML = seance.exercices.map(e =>
      `<span class="exo-pill">${e.nom}</span>`
    ).join('');

    return `
      <div class="seance-card ${seance.type}" onclick="openSeance('${seance.id}')">
        <div class="seance-card-title">
          <span class="seance-card-dot"></span>${seance.nom} — ${seance.muscles}
        </div>
        <div class="seance-card-subtitle">Dernière séance : ${derniereDate}</div>
        <div class="seance-card-exos">${pillsHTML}</div>
      </div>`;
  }).join('');
}

// ===== DÉTAIL SÉANCE =====
function openSeance(seanceId) {
  currentSeanceId = seanceId;
  previousView = 'seance-detail';
  document.getElementById('seances-list-view').style.display = 'none';
  document.getElementById('seance-detail-view').style.display = 'block';
  document.getElementById('back-btn').style.display = 'block';
  renderSeanceDetail(seanceId);
}

function renderSeanceDetail(seanceId, editMode = false) {
  const programme = getProgramme();
  const seance = programme.find(s => s.id === seanceId);
  if (!seance) return;

  document.getElementById('page-title').textContent = seance.nom;

  const colors = { push: '#ff4757', pull: '#2ed573', legs: '#5352ed' };
  const color = colors[seance.type];

  // Temps de repos entre exos (on prend le premier exo comme référence)
  const reposExoRef = seance.exercices[0] ? seance.exercices[0].reposExo : 180;

  // Header
  document.getElementById('seance-detail-header').innerHTML = `
    <div class="seance-header-top">
      <div>
        <h2 style="color:${color}">${seance.nom}</h2>
        <p>${seance.muscles}</p>
      </div>
      <button class="btn-edit-mode ${editMode ? 'active' : ''}" onclick="renderSeanceDetail('${seanceId}', ${!editMode})">
        ${editMode ? '✅ Terminer' : '✏️ Éditer'}
      </button>
    </div>
    <div class="seance-header-stats">
      <div class="seance-header-stat">
        <span class="seance-header-stat-value">${seance.exercices.length}</span>
        <span class="seance-header-stat-label">Exercices</span>
      </div>
      <div class="seance-header-stat">
        <span class="seance-header-stat-value">${seance.exercices.reduce((a, e) => a + e.series, 0)}</span>
        <span class="seance-header-stat-label">Séries totales</span>
      </div>
      <div class="seance-header-stat">
        <span class="seance-header-stat-value">${reposExoRef}s</span>
        <span class="seance-header-stat-label">Repos / exo</span>
      </div>
    </div>
  `;

  // Liste exercices
  document.getElementById('seance-exercices-list').innerHTML = seance.exercices.map((e, idx) => `
    <div class="exercice-card" id="exo-card-${e.id}">
      <div class="exercice-card-header">
        <span class="exercice-nom">${idx + 1}. ${e.nom}</span>
        ${editMode ? `
        <div class="exercice-actions">
          <button class="btn-icon" onclick="moveExo('${seanceId}', '${e.id}', -1)">↑</button>
          <button class="btn-icon" onclick="moveExo('${seanceId}', '${e.id}', 1)">↓</button>
          <button class="btn-icon" onclick="toggleEditExo('${e.id}')">✏️</button>
          <button class="btn-icon danger" onclick="deleteExo('${seanceId}', '${e.id}')">🗑</button>
        </div>` : ''}
      </div>
      <div class="exercice-stats">
        <div class="exercice-stat">
          <span class="exercice-stat-value">${e.series}</span>
          <span class="exercice-stat-label">Séries</span>
        </div>
        <div class="exercice-stat">
          <span class="exercice-stat-value">${e.reps}</span>
          <span class="exercice-stat-label">Reps</span>
        </div>
        <div class="exercice-stat">
          <span class="exercice-stat-value">${e.charge > 0 ? e.charge + ' kg' : 'PDC'}</span>
          <span class="exercice-stat-label">Charge</span>
        </div>
      </div>
      <div class="exercice-repos">
        <span>⏱ ${e.reposSeries}s entre séries</span>
        <span>·</span>
        <span>⏱ ${e.reposExo}s entre exercices</span>
      </div>
      ${e.comment ? `<div class="exercice-comment">💬 ${e.comment}</div>` : ''}
      ${editMode ? `
      <div class="exercice-edit-form" id="edit-form-${e.id}">
        <div class="edit-row">
          <input type="text" id="edit-nom-${e.id}" value="${e.nom}" placeholder="Nom" />
          <input type="number" id="edit-charge-${e.id}" value="${e.charge}" placeholder="Charge (kg)" step="0.25" />
        </div>
        <div class="edit-row">
          <input type="number" id="edit-series-${e.id}" value="${e.series}" placeholder="Séries" />
          <input type="number" id="edit-reps-${e.id}" value="${e.reps}" placeholder="Reps" />
        </div>
        <div class="edit-row">
          <input type="number" id="edit-repos-series-${e.id}" value="${e.reposSeries}" placeholder="Repos séries (s)" />
          <input type="number" id="edit-repos-exo-${e.id}" value="${e.reposExo}" placeholder="Repos exo (s)" />
        </div>
        <input type="text" id="edit-comment-${e.id}" value="${e.comment}" placeholder="Commentaire (optionnel)" />
        <div class="edit-row">
          <button class="btn-primary" style="margin:0" onclick="saveEditExo('${seanceId}', '${e.id}')">Sauvegarder</button>
          <button class="btn-ghost" onclick="toggleEditExo('${e.id}')">Annuler</button>
        </div>
      </div>` : ''}
    </div>
  `).join('');

  // Bouton ajout (edit) ou lancer (normal)
  document.getElementById('add-exercice-form').style.display = 'none';
  document.getElementById('seance-bottom-btn').innerHTML = editMode
    ? `<button class="btn-primary" onclick="showAddExerciceForm()">+ Ajouter un exercice</button>`
    : `<button class="btn-launch" onclick="lancerSeance('${seanceId}')">🏋️ Lancer la séance</button>`;
}
function lancerSeance(seanceId) {
  // On enregistre la séance dans le log
  const log = getSeancesLog();
  log.push({ seanceId, date: today() });
  saveSeancesLog(log);
  alert('Séance enregistrée ! 💪');
  updateDashboard();
  renderCalendar();
}
// ===== ACTIONS EXERCICES =====
function toggleEditExo(exoId) {
  const form = document.getElementById('edit-form-' + exoId);
  form.classList.toggle('open');
}

function saveEditExo(seanceId, exoId) {
  const programme = getProgramme();
  const seance = programme.find(s => s.id === seanceId);
  const exo = seance.exercices.find(e => e.id === exoId);
  exo.nom = document.getElementById('edit-nom-' + exoId).value;
  exo.charge = parseFloat(document.getElementById('edit-charge-' + exoId).value) || 0;
  exo.series = parseInt(document.getElementById('edit-series-' + exoId).value) || 3;
  exo.reps = parseInt(document.getElementById('edit-reps-' + exoId).value) || 15;
  exo.reposSeries = parseInt(document.getElementById('edit-repos-series-' + exoId).value) || 120;
  exo.reposExo = parseInt(document.getElementById('edit-repos-exo-' + exoId).value) || 180;
  exo.comment = document.getElementById('edit-comment-' + exoId).value;
  saveProgramme(programme);
  renderSeanceDetail(seanceId);
}

function deleteExo(seanceId, exoId) {
  if (!confirm('Supprimer cet exercice ?')) return;
  const programme = getProgramme();
  const seance = programme.find(s => s.id === seanceId);
  seance.exercices = seance.exercices.filter(e => e.id !== exoId);
  saveProgramme(programme);
  renderSeanceDetail(seanceId);
}

function moveExo(seanceId, exoId, direction) {
  const programme = getProgramme();
  const seance = programme.find(s => s.id === seanceId);
  const idx = seance.exercices.findIndex(e => e.id === exoId);
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= seance.exercices.length) return;
  const tmp = seance.exercices[idx];
  seance.exercices[idx] = seance.exercices[newIdx];
  seance.exercices[newIdx] = tmp;
  saveProgramme(programme);
  renderSeanceDetail(seanceId);
}

function showAddExerciceForm() {
  document.getElementById('add-exercice-form').style.display = 'block';
}

function hideAddExerciceForm() {
  document.getElementById('add-exercice-form').style.display = 'none';
}

function saveNewExercice() {
  const nom = document.getElementById('new-exo-nom').value.trim();
  if (!nom) { alert('Merci de renseigner un nom.'); return; }
  const programme = getProgramme();
  const seance = programme.find(s => s.id === currentSeanceId);
  const newExo = {
    id: 'e' + Date.now(),
    nom,
    series: parseInt(document.getElementById('new-exo-series').value) || 3,
    reps: parseInt(document.getElementById('new-exo-reps').value) || 15,
    charge: parseFloat(document.getElementById('new-exo-charge').value) || 0,
    reposSeries: parseInt(document.getElementById('new-exo-repos-series').value) || 120,
    reposExo: parseInt(document.getElementById('new-exo-repos-exo').value) || 180,
    comment: document.getElementById('new-exo-comment').value
  };
  seance.exercices.push(newExo);
  saveProgramme(programme);
  hideAddExerciceForm();
  renderSeanceDetail(currentSeanceId);
}

// ===== CALENDRIER =====
function renderCalendar() {
  const log = getSeancesLog();
  const container = document.getElementById('seances-calendar');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayNum = now.getDate();
  const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Map des séances par date
  const seancesByDate = {};
  log.forEach(l => {
    const d = new Date(l.date + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      seancesByDate[d.getDate()] = l.seanceId;
    }
  });

  const jours = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  let html = `<p style="text-align:center;font-size:13px;color:var(--text-muted);margin-bottom:8px">${monthName}</p>`;
  html += '<div class="calendar-grid">';
  jours.forEach(j => html += `<div class="calendar-day-header">${j}</div>`);

  // Décalage (lundi = 0)
  const offset = (firstDay + 6) % 7;
  for (let i = 0; i < offset; i++) html += '<div class="calendar-day empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const seanceType = seancesByDate[d];
    const isToday = d === todayNum;
    let cls = 'calendar-day';
    if (isToday) cls += ' today';
    if (seanceType) cls += ` has-${seanceType}`;
    html += `<div class="${cls}">${d}</div>`;
  }

  html += '</div>';
  html += `
    <div class="calendar-legend">
      <div class="legend-item"><div class="legend-dot" style="background:#ff4757"></div>Push</div>
      <div class="legend-item"><div class="legend-dot" style="background:#2ed573"></div>Pull</div>
      <div class="legend-item"><div class="legend-dot" style="background:#5352ed"></div>Legs</div>
    </div>`;

  container.innerHTML = html;
}

// ===== POIDS =====
function saveSetup() {
  const taille = parseFloat(document.getElementById('setup-taille').value);
  const poidsDepart = parseFloat(document.getElementById('setup-poids-depart').value);
  const dateDepart = document.getElementById('setup-date-depart').value;
  const poidsCible = parseFloat(document.getElementById('setup-poids-cible').value);
  const dateCible = document.getElementById('setup-date-cible').value;
  if (!taille || !poidsDepart || !dateDepart || !poidsCible || !dateCible) { alert('Merci de remplir tous les champs.'); return; }
  saveConfig({ taille, poidsDepart, dateDepart, poidsCible, dateCible });
  saveEntries([{ date: dateDepart, poids: poidsDepart }]);
  initPoids();
}

function resetSetup() {
  if (!confirm('Réinitialiser toutes les données de poids ?')) return;
  localStorage.removeItem('poidsConfig');
  localStorage.removeItem('poidsEntries');
  initPoids();
}

let poidsChart = null;
let currentFilter = 'ALL';

function initPoids() {
  const config = getConfig();
  if (!config) {
    document.getElementById('poids-setup').style.display = 'block';
    document.getElementById('poids-content').style.display = 'none';
    document.getElementById('setup-date-depart').value = today();
    return;
  }
  document.getElementById('poids-setup').style.display = 'none';
  document.getElementById('poids-content').style.display = 'block';
  document.getElementById('new-date').value = today();
  renderStats(config);
  renderChart(config, currentFilter);
  renderHistory();
}

function today() { return new Date().toISOString().split('T')[0]; }

function calcIMC(poids, taille) { return (poids / ((taille / 100) ** 2)).toFixed(1); }
function imcLabel(imc) {
  if (imc < 18.5) return 'Sous-poids';
  if (imc < 25) return 'Normal';
  if (imc < 30) return 'Surpoids';
  return 'Obésité';
}
function calcGraisse(imc) { return Math.max(0, (1.2 * imc) + (0.23 * 30) - (10.8 * 1) - 5.4).toFixed(1); }
function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function daysBetween(d1, d2) { return Math.round((new Date(d2) - new Date(d1)) / 864e5); }

function renderStats(config) {
  const entries = getEntries();
  const last = entries[entries.length - 1];
  const poidsActuel = last ? last.poids : config.poidsDepart;
  const imcDepart = calcIMC(config.poidsDepart, config.taille);
  const imcActuel = calcIMC(poidsActuel, config.taille);
  const imcCible = calcIMC(config.poidsCible, config.taille);

  document.getElementById('info-poids-depart').textContent = config.poidsDepart + ' kg';
  document.getElementById('info-imc-depart').textContent = 'IMC ' + imcDepart;
  document.getElementById('info-date-depart').textContent = formatDate(config.dateDepart);
  document.getElementById('info-poids-actuel').textContent = poidsActuel + ' kg';
  document.getElementById('info-imc-actuel').textContent = 'IMC ' + imcActuel;
  document.getElementById('info-poids-cible').textContent = config.poidsCible + ' kg';
  document.getElementById('info-imc-cible').textContent = 'IMC ' + imcCible;
  document.getElementById('info-date-cible').textContent = formatDate(config.dateCible);

  const totalPoids = config.poidsCible - config.poidsDepart;
  const faitPoids = poidsActuel - config.poidsDepart;
  const pctPoids = totalPoids === 0 ? 0 : Math.min(100, Math.max(0, (faitPoids / totalPoids) * 100));
  document.getElementById('pct-poids').textContent = pctPoids.toFixed(0) + '%';
  document.getElementById('bar-poids').style.width = pctPoids + '%';

  const totalJours = daysBetween(config.dateDepart, config.dateCible);
  const joursEcoules = daysBetween(config.dateDepart, today());
  const pctDuree = totalJours === 0 ? 0 : Math.min(100, Math.max(0, (joursEcoules / totalJours) * 100));
  document.getElementById('pct-duree').textContent = pctDuree.toFixed(0) + '%';
  document.getElementById('bar-duree').style.width = pctDuree + '%';

  document.getElementById('stat-graisse').textContent = calcGraisse(parseFloat(imcActuel)) + '%';
  const prisPoids = (poidsActuel - config.poidsDepart).toFixed(1);
  document.getElementById('stat-pris').textContent = (prisPoids > 0 ? '+' : '') + prisPoids + ' kg';
  document.getElementById('stat-restant').textContent = (config.poidsCible - poidsActuel).toFixed(1) + ' kg';
  document.getElementById('stat-imc').textContent = imcActuel;
  document.getElementById('stat-imc-label').textContent = imcLabel(parseFloat(imcActuel));

  const joursReels = daysBetween(config.dateDepart, last ? last.date : today());
  if (joursReels > 0 && entries.length > 1) {
    const gainTotal = (poidsActuel - config.poidsDepart) * 1000;
    document.getElementById('stat-gain-jour').textContent = (gainTotal / joursReels).toFixed(0) + ' g';
    document.getElementById('stat-gain-sem').textContent = (gainTotal / joursReels * 7).toFixed(0) + ' g';
  }

  const bmr = 10 * poidsActuel + 6.25 * config.taille - 5 * 30 + 5;
  document.getElementById('stat-calories').textContent = (Math.round(bmr * 1.55) + 300) + ' kcal';
}

function addPoids() {
  const poids = parseFloat(document.getElementById('new-poids').value);
  const date = document.getElementById('new-date').value;
  if (!poids || !date) { alert('Merci de remplir le poids et la date.'); return; }
  const entries = getEntries();
  const exists = entries.findIndex(e => e.date === date);
  if (exists >= 0) {
    if (!confirm('Une entrée existe déjà pour cette date. La remplacer ?')) return;
    entries[exists].poids = poids;
  } else {
    entries.push({ date, poids });
    entries.sort((a, b) => a.date.localeCompare(b.date));
  }
  saveEntries(entries);
  document.getElementById('new-poids').value = '';
  initPoids();
}

function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderChart(getConfig(), filter);
}

function filterEntries(entries, filter) {
  const now = new Date();
  const days = { '1S': 7, '2S': 14, '1M': 30, '3M': 90, '6M': 180 };
  if (!days[filter]) return entries;
  const cutoff = new Date(now - days[filter] * 864e5);
  return entries.filter(e => new Date(e.date + 'T00:00:00') >= cutoff);
}

function renderChart(config, filter) {
  const entries = filterEntries(getEntries(), filter);
  const labels = entries.map(e => new Date(e.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
  const data = entries.map(e => e.poids);
  const objectifData = entries.map(e => {
    const t = daysBetween(config.dateDepart, e.date);
    const total = daysBetween(config.dateDepart, config.dateCible);
    return total === 0 ? config.poidsDepart : parseFloat((config.poidsDepart + (config.poidsCible - config.poidsDepart) * (t / total)).toFixed(2));
  });
  const tendanceData = linearRegression(entries);
  const ctx = document.getElementById('poidsChart').getContext('2d');
  if (poidsChart) poidsChart.destroy();
  poidsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Poids réel', data, borderColor: '#e8ff47', backgroundColor: 'rgba(232,255,71,0.08)', borderWidth: 2.5, pointBackgroundColor: '#e8ff47', pointRadius: 4, tension: 0.3, fill: true },
        { label: 'Objectif', data: objectifData, borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0, tension: 0, fill: false },
        { label: 'Tendance', data: tendanceData, borderColor: '#2ed573', borderWidth: 1.5, borderDash: [3, 3], pointRadius: 0, tension: 0, fill: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#888', font: { size: 11 }, boxWidth: 20 } },
        tooltip: { backgroundColor: '#1a1a1a', borderColor: '#333', borderWidth: 1, titleColor: '#fff', bodyColor: '#aaa' }
      },
      scales: {
        x: { ticks: { color: '#666', font: { size: 10 } }, grid: { color: '#1e1e1e' } },
        y: { ticks: { color: '#666', font: { size: 10 }, callback: v => v + ' kg' }, grid: { color: '#1e1e1e' } }
      }
    }
  });
}

function linearRegression(entries) {
  if (entries.length < 2) return entries.map(e => e.poids);
  const n = entries.length;
  const xs = entries.map((_, i) => i);
  const ys = entries.map(e => e.poids);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return xs.map(x => parseFloat((slope * x + intercept).toFixed(2)));
}

function renderHistory() {
  const entries = getEntries();
  const container = document.getElementById('poids-list');
  if (entries.length === 0) { container.innerHTML = '<p style="color:#666;font-size:14px;">Aucune entrée pour le moment.</p>'; return; }
  const reversed = [...entries].reverse();
  container.innerHTML = reversed.map((e, i) => {
    const prev = reversed[i + 1];
    let badge = '<span class="history-badge badge-same">→</span>';
    if (prev) {
      const diff = e.poids - prev.poids;
      if (diff > 0.05) badge = `<span class="history-badge badge-up">+${diff.toFixed(1)} kg</span>`;
      else if (diff < -0.05) badge = `<span class="history-badge badge-down">${diff.toFixed(1)} kg</span>`;
    }
    return `<div class="history-item"><span class="history-date">${formatDate(e.date)}</span><span class="history-poids">${e.poids} kg</span>${badge}</div>`;
  }).join('');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateDashboard();
});