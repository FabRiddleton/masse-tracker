// ===== NAVIGATION =====
let previousView = null;

function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');

  const titles = {
    poids: 'Poids & Mensurations',
    macros: 'Macros & Nutrition',
    seances: 'Séances & Exercices'
  };
  const titleEl = document.getElementById('page-title');
if (titleEl) titleEl.textContent = titles[view] || '';

  const navMap = { poids: 'nav-poids', macros: 'nav-macros', seances: 'nav-seances' };
  if (navMap[view]) document.getElementById(navMap[view]).classList.add('active');

  document.getElementById('back-btn').style.display = 'none';
  if (view === 'poids') { initPoids(); renderFAB(); }
  if (view === 'macros') initMacros();
  if (view === 'seances') initSeances();

  // Cacher FAB si on quitte poids
const fab = document.getElementById('fab-poids');
if (fab) fab.style.display = view === 'poids' ? 'flex' : 'none';
}


function goBack() {
  if (previousView === 'seance-detail') {
    showSeancesList();
  } else if (previousView === 'workout') {
    if (confirm('Abandonner la séance en cours ?')) {
      clearCountdown();
      document.getElementById('bottom-nav').style.display = 'flex';
      navigate('seances');
    }
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
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = 'Séances & Exercices';
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
// ===== WORKOUT STATE =====
let workoutSeanceId = null;
let workoutExos = [];
let workoutExoIndex = 0;
let workoutSeriesCompleted = 0;
let workoutStartTime = null;
let countdownInterval = null;
let countdownRemaining = 0;
let countdownTotal = 0;

const RING_C = 2 * Math.PI * 54; // circonférence SVG r=54

function lancerSeance(seanceId) {
  const programme = getProgramme();
  const seance = programme.find(s => s.id === seanceId);
  if (!seance || seance.exercices.length === 0) {
    alert('Aucun exercice dans cette séance.');
    return;
  }

  workoutSeanceId = seanceId;
  workoutExos = seance.exercices;
  workoutExoIndex = 0;
  workoutSeriesCompleted = 0;
  workoutStartTime = Date.now();

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-workout').classList.add('active');
  document.getElementById('page-title').textContent = seance.nom;
  document.getElementById('back-btn').style.display = 'block';
  document.getElementById('bottom-nav').style.display = 'none';
  previousView = 'workout';

  renderWorkoutExercice();
}

function renderWorkoutExercice() {
  const exo = workoutExos[workoutExoIndex];

  document.getElementById('workout-exercice-screen').style.display = 'flex';
  document.getElementById('workout-rest-screen').style.display = 'none';
  document.getElementById('workout-rest-series-screen').style.display = 'none';
  document.getElementById('workout-done-screen').style.display = 'none';

  document.getElementById('workout-seance-nom').textContent =
    document.getElementById('page-title').textContent;
  document.getElementById('workout-progress').textContent =
    `${workoutExoIndex + 1} / ${workoutExos.length}`;

  document.getElementById('workout-exo-numero').textContent =
    `Exercice ${workoutExoIndex + 1}`;
  document.getElementById('workout-exo-nom').textContent = exo.nom;
  document.getElementById('workout-series').textContent = exo.series;
  document.getElementById('workout-reps').textContent = exo.reps;
  document.getElementById('workout-charge').textContent =
    exo.charge > 0 ? exo.charge + ' kg' : 'PDC';

  // Dots séries
  const dotsEl = document.getElementById('workout-series-dots');
  dotsEl.innerHTML = '';
  for (let i = 0; i < exo.series; i++) {
    const d = document.createElement('div');
    d.className = 'series-dot' + (i < workoutSeriesCompleted ? ' done' : '');
    dotsEl.appendChild(d);
  }

  // Bouton repos visible seulement si des séries restent
  const btnRest = document.getElementById('btn-rest');
  btnRest.style.display = workoutSeriesCompleted < exo.series ? 'flex' : 'none';

  // Libellé bouton suivant
  const btnNext = document.querySelector('.btn-next-exo');
  btnNext.textContent = workoutExoIndex === workoutExos.length - 1
    ? 'Terminer la séance ✓'
    : 'Exercice suivant →';
}

function startRestSeries() {
  workoutSeriesCompleted++;
  renderWorkoutExercice(); // met à jour les dots et cache btn-rest si besoin

  const exo = workoutExos[workoutExoIndex];
  document.getElementById('workout-exercice-screen').style.display = 'none';
  document.getElementById('workout-rest-series-screen').style.display = 'flex';

  startCountdown(exo.reposSeries, 'rest-series-countdown', 'ring-fill-series', () => {
    document.getElementById('workout-rest-series-screen').style.display = 'none';
    renderWorkoutExercice();
  });
}

function skipRestSeries() {
  clearCountdown();
  document.getElementById('workout-rest-series-screen').style.display = 'none';
  renderWorkoutExercice();
}

function nextExercice() {
  clearCountdown();
  workoutSeriesCompleted = workoutExos[workoutExoIndex].series;

  if (workoutExoIndex >= workoutExos.length - 1) {
    showWorkoutDone();
    return;
  }

  const exo = workoutExos[workoutExoIndex];
  const nextExo = workoutExos[workoutExoIndex + 1];

  document.getElementById('workout-exercice-screen').style.display = 'none';
  document.getElementById('workout-rest-screen').style.display = 'flex';

  document.getElementById('rest-next-nom').textContent = nextExo.nom;
  document.getElementById('rest-next-stats').innerHTML =
    `<span>${nextExo.series} séries</span><span>·</span>` +
    `<span>${nextExo.reps} reps</span><span>·</span>` +
    `<span>${nextExo.charge > 0 ? nextExo.charge + ' kg' : 'PDC'}</span>`;

  startCountdown(exo.reposExo, 'rest-countdown', 'ring-fill', () => {
    advanceToNextExo();
  });
}

function skipRest() {
  clearCountdown();
  advanceToNextExo();
}

function advanceToNextExo() {
  workoutExoIndex++;
  workoutSeriesCompleted = 0;
  document.getElementById('workout-rest-screen').style.display = 'none';
  renderWorkoutExercice();
}

function showWorkoutDone() {
  document.getElementById('workout-exercice-screen').style.display = 'none';
  document.getElementById('workout-rest-screen').style.display = 'none';
  document.getElementById('workout-rest-series-screen').style.display = 'none';
  document.getElementById('workout-done-screen').style.display = 'flex';

  const elapsed = Math.round((Date.now() - workoutStartTime) / 60000);
  const seance = getProgramme().find(s => s.id === workoutSeanceId);
  const totalSeries = seance.exercices.reduce((a, e) => a + e.series, 0);
  document.getElementById('done-recap').textContent =
    `${seance.exercices.length} exercices · ${totalSeries} séries · ${elapsed} min`;

  const log = getSeancesLog();
  log.push({ seanceId: workoutSeanceId, date: today() });
  saveSeancesLog(log);
  updateDashboard();
}

function finishWorkout() {
  clearCountdown();
  document.getElementById('bottom-nav').style.display = 'flex';
  navigate('seances');
}

// ===== COUNTDOWN =====
function startCountdown(seconds, countdownId, ringId, onFinish) {
  clearCountdown();
  countdownRemaining = seconds;
  countdownTotal = seconds;

  const countdownEl = document.getElementById(countdownId);
  const ringEl = document.getElementById(ringId);

  if (ringEl) {
    ringEl.setAttribute('stroke-dasharray', RING_C);
    ringEl.setAttribute('stroke-dashoffset', 0);
  }

  function tick() {
    if (countdownEl) countdownEl.textContent = countdownRemaining;
    if (ringEl) {
      ringEl.setAttribute('stroke-dashoffset',
        RING_C * (1 - countdownRemaining / countdownTotal));
    }
    if (countdownRemaining <= 0) {
      clearCountdown();
      if (onFinish) onFinish();
      return;
    }
    countdownRemaining--;
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

function clearCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
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
let currentFilter = '1S';

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

  // Hero
  document.getElementById('hero-poids').textContent = poidsActuel.toString().replace('.', ',');
  document.getElementById('hero-date').textContent = last ? formatDate(last.date) : formatDate(config.dateDepart);
  document.getElementById('hero-imc').textContent = 'IMC ' + imcActuel + ' · ' + imcLabel(parseFloat(imcActuel));

  // Départ / Objectif
  document.getElementById('info-poids-depart').innerHTML = config.poidsDepart + ' <span>kg</span>';
  document.getElementById('info-imc-depart').textContent = 'IMC ' + imcDepart;
  document.getElementById('info-date-depart').textContent = formatDate(config.dateDepart);
  document.getElementById('info-poids-cible').innerHTML = config.poidsCible + ' <span>kg</span>';
  document.getElementById('info-imc-cible').textContent = 'IMC ' + imcCible;
  document.getElementById('info-date-cible').textContent = formatDate(config.dateCible);

  // Progression poids
  const totalPoids = config.poidsCible - config.poidsDepart;
  const faitPoids = poidsActuel - config.poidsDepart;
  const pctPoids = totalPoids === 0 ? 0 : Math.min(100, Math.max(0, (faitPoids / totalPoids) * 100));
  document.getElementById('pct-poids').textContent = pctPoids.toFixed(0) + '%';
  document.getElementById('bar-poids').style.width = pctPoids + '%';

  // Progression durée
  const totalJours = daysBetween(config.dateDepart, config.dateCible);
  const joursEcoules = daysBetween(config.dateDepart, today());
  const pctDuree = totalJours === 0 ? 0 : Math.min(100, Math.max(0, (joursEcoules / totalJours) * 100));
  document.getElementById('pct-duree').textContent = pctDuree.toFixed(0) + '%';
  document.getElementById('bar-duree').style.width = pctDuree + '%';

  // Stats
  const prisPoids = (poidsActuel - config.poidsDepart).toFixed(1);
  document.getElementById('stat-pris').textContent = (prisPoids > 0 ? '+' : '') + prisPoids + ' kg';
  document.getElementById('stat-restant').textContent = (config.poidsCible - poidsActuel).toFixed(1) + ' kg';
  document.getElementById('stat-graisse').textContent = calcGraisse(parseFloat(imcActuel)) + '%';
  const bmr = 10 * poidsActuel + 6.25 * config.taille - 5 * 30 + 5;
  document.getElementById('stat-calories').textContent = (Math.round(bmr * 1.55) + 300) + ' kcal';

  // Historique preview (3 dernières)
  renderHistoriquePreview(entries);
}

function renderHistoriquePreview(entries) {
  const container = document.getElementById('poids-list-preview');
  if (!container) return;
  if (!entries.length) {
    container.innerHTML = '<p style="color:#666;font-size:14px">Aucune entrée.</p>';
    return;
  }
  const reversed = [...entries].reverse().slice(0, 3);
  container.innerHTML = reversed.map((e, i) => {
    const prev = [...entries].reverse()[i + 1];
    let badgeClass = 'badge-new-same';
    let badgeIcon = '→';
    if (prev) {
      const diff = e.poids - prev.poids;
      if (diff > 0.05) { badgeClass = 'badge-new-up'; badgeIcon = '↑'; }
      else if (diff < -0.05) { badgeClass = 'badge-new-down'; badgeIcon = '↓'; }
    }
    const d = new Date(e.date + 'T00:00:00');
    const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    return `
      <div class="history-item-new">
        <div class="history-item-new-left">
          <div class="history-item-new-date">${dateStr}</div>
        </div>
        <div class="history-item-new-right">
          <div class="history-badge-new ${badgeClass}">${badgeIcon}</div>
          <div class="history-item-new-poids">${e.poids} <span>kg</span></div>
        </div>
      </div>`;
  }).join('');
}

function openHistorique() {
  const entries = getEntries();
  const reversed = [...entries].reverse();
  const container = document.getElementById('historique-complet-list');
  container.innerHTML = reversed.map((e, i) => {
    const prev = reversed[i + 1];
    let badgeClass = 'badge-new-same';
    let badgeIcon = '→';
    if (prev) {
      const diff = e.poids - prev.poids;
      if (diff > 0.05) { badgeClass = 'badge-new-up'; badgeIcon = '↑'; }
      else if (diff < -0.05) { badgeClass = 'badge-new-down'; badgeIcon = '↓'; }
    }
    const d = new Date(e.date + 'T00:00:00');
    const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    return `
      <div class="history-item-new">
        <div class="history-item-new-left">
          <div class="history-item-new-date">${dateStr}</div>
        </div>
        <div class="history-item-new-right">
          <div class="history-badge-new ${badgeClass}">${badgeIcon}</div>
          <div class="history-item-new-poids">${e.poids} <span>kg</span></div>
        </div>
      </div>`;
  }).join('');
  document.getElementById('historique-overlay').style.display = 'flex';
  document.getElementById('historique-overlay').style.flexDirection = 'column';
  document.getElementById('historique-overlay').style.overflowY = 'auto';
}

function closeHistorique() {
  document.getElementById('historique-overlay').style.display = 'none';
}

// ===== GRAPHIQUE DÉTAILLÉ =====
let detailChart = null;
let detailFilter = '1S';

function openGraphDetail() {
  document.getElementById('graph-detail-overlay').style.display = 'flex';
  document.getElementById('graph-detail-overlay').style.flexDirection = 'column';
  document.querySelectorAll('.graph-detail-filters .filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.graph-detail-filters .filter-btn').classList.add('active');
  renderDetailChart(detailFilter);
  initDetailTouch();
}

function closeGraphDetail() {
  document.getElementById('graph-detail-overlay').style.display = 'none';
}

function setDetailFilter(filter, btn) {
  detailFilter = filter;
  document.querySelectorAll('.graph-detail-filters .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDetailChart(filter);
}

function renderDetailChart(filter) {
  const config = getConfig();
  const entries = filterEntries(getEntries(), filter);
  const labels = entries.map(e => new Date(e.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
  const data = entries.map(e => e.poids);
  const objectifData = entries.map(e => {
    const t = daysBetween(config.dateDepart, e.date);
    const total = daysBetween(config.dateDepart, config.dateCible);
    return total === 0 ? config.poidsDepart : parseFloat((config.poidsDepart + (config.poidsCible - config.poidsDepart) * (t / total)).toFixed(2));
  });
  const tendanceData = linearRegression(entries);
  const ctx = document.getElementById('poidsChartDetail').getContext('2d');
  if (detailChart) detailChart.destroy();
  detailChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Poids réel',
          data,
          borderColor: '#e8ff47',
          backgroundColor: 'rgba(232,255,71,0.06)',
          borderWidth: 2.5,
          pointBackgroundColor: '#e8ff47',
          pointRadius: 4,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Objectif',
          data: objectifData,
          borderColor: '#2ed573',
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          tension: 0,
          fill: false,
        },
        {
          label: 'Tendance',
          data: tendanceData,
          borderColor: '#ff6b35',
          borderWidth: 1.5,
          borderDash: [3, 3],
          pointRadius: 0,
          tension: 0,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
  legend: {
    labels: {
      color: '#888',
      font: { size: 11 },
      boxWidth: 20,
      boxHeight: 1,
      usePointStyle: true,
      pointStyle: 'line',
    }
  },
  tooltip: { enabled: false }
},
      scales: {
        x: { ticks: { color: '#666', font: { size: 10 } }, grid: { color: '#1e1e1e' } },
        y: { ticks: { color: '#666', font: { size: 10 }, callback: v => v + ' kg' }, grid: { color: '#1e1e1e' } }
      }
    }
  });
}

function initDetailTouch() {
  const canvas = document.getElementById('poidsChartDetail');
  const tooltip = document.getElementById('graph-tooltip');
  const tooltipDate = document.getElementById('tooltip-date');
  const tooltipPoids = document.getElementById('tooltip-poids');

  function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    if (!detailChart) return;
    const points = detailChart.getElementsAtEventForMode(
      { clientX: touch.clientX, clientY: touch.clientY },
      'index', { intersect: false }, false
    );
    if (points.length) {
      const idx = points[0].index;
      const label = detailChart.data.labels[idx];
      const val = detailChart.data.datasets[0].data[idx];
      tooltipDate.textContent = label;
      tooltipPoids.textContent = val + ' kg';
      tooltip.style.display = 'flex';
    }
  }

  canvas.addEventListener('touchmove', handleTouch, { passive: false });
  canvas.addEventListener('touchstart', handleTouch, { passive: false });
  canvas.addEventListener('mousemove', handleTouch);
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
  legend: {
    labels: {
      color: '#888',
      font: { size: 11 },
      boxWidth: 20,
      boxHeight: 1,
      usePointStyle: true,
      pointStyle: 'line',
    }
  },
  tooltip: { enabled: false }
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
  renderHistoriquePreview(getEntries());
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    navigate('poids');
    initPoids();
  }, 100);
});

// ===== MACROS =====

const MACRO_PROFILES = {
  repos: { kcal: 2800, prot: 160, gluc: 330, lip: 80 },
  push: { kcal: 3000, prot: 175, gluc: 370, lip: 85 },
  pull: { kcal: 3000, prot: 175, gluc: 370, lip: 85 },
  legs: { kcal: 3100, prot: 180, gluc: 390, lip: 88 }
};

const DAY_TYPE_LABELS = {
  repos: '⚪ Jour Repos',
  push: '🔴 Jour Push',
  pull: '🟢 Jour Pull',
  legs: '🔵 Jour Legs'
};

// Storage
function getMacrosLog() { return JSON.parse(localStorage.getItem('macrosLog') || '{}'); }
function saveMacrosLog(l) { localStorage.setItem('macrosLog', JSON.stringify(l)); }
function getBiblio() { return JSON.parse(localStorage.getItem('macroBiblio') || '[]'); }
function saveBiblio(b) { localStorage.setItem('macroBiblio', JSON.stringify(b)); }

function getTodayMacros() {
  const log = getMacrosLog();
  const t = today();
  if (!log[t]) log[t] = { type: 'repos', meals: [] };
  return log[t];
}

function saveTodayMacros(data) {
  const log = getMacrosLog();
  log[today()] = data;
  saveMacrosLog(log);
}

// Init
let macroChart = null;

function initMacros() {
  const data = getTodayMacros();

  // Date et type du jour
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('macro-day-date').textContent = dateStr;
  document.getElementById('macro-day-type').textContent = DAY_TYPE_LABELS[data.type];

  // Boutons type actifs
  document.querySelectorAll('.macro-day-btn').forEach(b => {
    b.className = 'macro-day-btn';
    if (b.getAttribute('onclick').includes(data.type)) {
      b.classList.add('active-' + data.type);
    }
  });

  renderMacroRings(data);
  renderMealsList(data);
  renderMacroChart();
  renderBiblio();
}

// Changer type de jour
function changeDayType(type) {
  const data = getTodayMacros();
  data.type = type;
  saveTodayMacros(data);
  initMacros();
}

// Rings
function renderMacroRings(data) {
  const profile = MACRO_PROFILES[data.type];
  const totals = calcTotals(data.meals);
  const circumference = 213.6;

  const rings = [
    { id: 'kcal', val: totals.kcal, target: profile.kcal, unit: 'kcal' },
    { id: 'prot', val: totals.prot, target: profile.prot, unit: 'g' },
    { id: 'gluc', val: totals.gluc, target: profile.gluc, unit: 'g' },
    { id: 'lip', val: totals.lip, target: profile.lip, unit: 'g' },
  ];

  rings.forEach(r => {
    const pct = Math.min(1, r.val / r.target);
    const offset = circumference - pct * circumference;
    document.getElementById('ring-' + r.id).style.strokeDashoffset = offset;
    document.getElementById('ring-val-' + r.id).textContent = Math.round(r.val);
    document.getElementById('ring-target-' + r.id).textContent = '/ ' + r.target + ' ' + r.unit;
  });
}

function calcTotals(meals) {
  return meals.reduce((acc, m) => ({
    kcal: acc.kcal + (m.kcal || 0),
    prot: acc.prot + (m.prot || 0),
    gluc: acc.gluc + (m.gluc || 0),
    lip: acc.lip + (m.lip || 0),
  }), { kcal: 0, prot: 0, gluc: 0, lip: 0 });
}

// Meals list
function renderMealsList(data) {
  const container = document.getElementById('macro-meals-list');
  if (!data.meals.length) {
    container.innerHTML = '<p style="color:#666;font-size:14px">Aucun repas enregistré aujourd\'hui.</p>';
    return;
  }
  container.innerHTML = data.meals.map((m, i) => `
    <div class="meal-item">
      <div>
        <div class="meal-nom">${m.nom}</div>
        <div class="meal-macros">P: ${m.prot}g · G: ${m.gluc}g · L: ${m.lip}g</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="meal-kcal">${m.kcal} kcal</span>
        <button class="meal-delete" onclick="deleteMeal(${i})">🗑</button>
      </div>
    </div>
  `).join('');
}

function deleteMeal(idx) {
  const data = getTodayMacros();
  data.meals.splice(idx, 1);
  saveTodayMacros(data);
  initMacros();
}

// Tabs
function switchMacroTab(tab, btn) {
  document.querySelectorAll('.macro-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.macro-tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('macro-tab-' + tab).classList.add('active');
}

// ===== SAISIE MANUELLE =====
function addManualMacros() {
  const nom = document.getElementById('manual-nom').value.trim() || 'Repas';
  const kcal = parseFloat(document.getElementById('manual-kcal').value) || 0;
  const prot = parseFloat(document.getElementById('manual-prot').value) || 0;
  const gluc = parseFloat(document.getElementById('manual-gluc').value) || 0;
  const lip = parseFloat(document.getElementById('manual-lip').value) || 0;

  if (!kcal && !prot && !gluc && !lip) { alert('Renseigne au moins une valeur.'); return; }

  const data = getTodayMacros();
  data.meals.push({ nom, kcal, prot, gluc, lip });
  saveTodayMacros(data);

  // Reset
  ['manual-nom', 'manual-kcal', 'manual-prot', 'manual-gluc', 'manual-lip'].forEach(id => {
    document.getElementById(id).value = '';
  });

  initMacros();
}

// ===== BIBLIOTHÈQUE =====
function renderBiblio() {
  const biblio = getBiblio();
  const container = document.getElementById('biblio-list');
  if (!biblio.length) {
    container.innerHTML = '<p style="color:#666;font-size:14px;margin-bottom:8px">Aucun aliment sauvegardé.</p>';
    return;
  }
  container.innerHTML = biblio.map((item, i) => `
    <div class="biblio-item">
      <div>
        <div class="biblio-item-nom">${item.nom}</div>
        <div class="biblio-item-macros">${item.kcal} kcal · P: ${item.prot}g · G: ${item.gluc}g · L: ${item.lip}g</div>
      </div>
      <div class="biblio-item-actions">
        <button class="btn-icon" onclick="addFromBiblio(${i})" title="Ajouter">+</button>
        <button class="btn-icon danger" onclick="deleteBiblioItem(${i})" title="Supprimer">🗑</button>
      </div>
    </div>
  `).join('');
}

function addFromBiblio(idx) {
  const item = getBiblio()[idx];
  const data = getTodayMacros();
  data.meals.push({ ...item });
  saveTodayMacros(data);
  initMacros();
}

function showAddBiblioForm() { document.getElementById('biblio-add-form').style.display = 'block'; }
function hideAddBiblioForm() { document.getElementById('biblio-add-form').style.display = 'none'; }

function saveBiblioItem() {
  const nom = document.getElementById('biblio-nom').value.trim();
  if (!nom) { alert('Renseigne un nom.'); return; }
  const item = {
    nom,
    kcal: parseFloat(document.getElementById('biblio-kcal').value) || 0,
    prot: parseFloat(document.getElementById('biblio-prot').value) || 0,
    gluc: parseFloat(document.getElementById('biblio-gluc').value) || 0,
    lip: parseFloat(document.getElementById('biblio-lip').value) || 0,
  };
  const biblio = getBiblio();
  biblio.push(item);
  saveBiblio(biblio);
  hideAddBiblioForm();
  ['biblio-nom', 'biblio-kcal', 'biblio-prot', 'biblio-gluc', 'biblio-lip'].forEach(id => {
    document.getElementById(id).value = '';
  });
  renderBiblio();
}

function deleteBiblioItem(idx) {
  if (!confirm('Supprimer cet aliment ?')) return;
  const biblio = getBiblio();
  biblio.splice(idx, 1);
  saveBiblio(biblio);
  renderBiblio();
}

// ===== VOCAL =====
let recognition = null;
let isRecording = false;
let pendingVocalMacros = null;

function toggleVoice() {
  if (isRecording) {
    stopVoice();
  } else {
    startVoice();
  }
}

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('La reconnaissance vocale n\'est pas supportée sur ce navigateur. Utilise Chrome.');
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = 'fr-FR';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isRecording = true;
    document.getElementById('btn-mic').classList.add('recording');
    document.getElementById('macro-vocal-text').textContent = 'En écoute... Parle !';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById('macro-vocal-text').textContent = '"' + transcript + '"';
    analyzeWithClaude(transcript);
  };

  recognition.onerror = () => {
    stopVoice();
    document.getElementById('macro-vocal-text').textContent = 'Erreur. Réessaie.';
  };

  recognition.onend = () => { stopVoice(); };
  recognition.start();
}

function stopVoice() {
  isRecording = false;
  document.getElementById('btn-mic').classList.remove('recording');
  if (recognition) recognition.stop();
}

async function analyzeWithClaude(transcript) {
  document.getElementById('macro-vocal-loading').style.display = 'flex';
  document.getElementById('macro-vocal-result').style.display = 'none';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyse ce repas et retourne UNIQUEMENT un JSON valide sans markdown ni backticks :
{"nom":"nom du repas","kcal":0,"prot":0,"gluc":0,"lip":0,"detail":"description courte des aliments"}

Repas décrit : "${transcript}"

Utilise des valeurs nutritionnelles moyennes françaises. Sois précis.`
        }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text.trim();
    const parsed = JSON.parse(text);
    pendingVocalMacros = parsed;

    document.getElementById('macro-vocal-loading').style.display = 'none';
    document.getElementById('macro-vocal-result').style.display = 'block';
    document.getElementById('macro-vocal-parsed').innerHTML = `
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:10px">${parsed.detail}</p>
      <div class="workout-exo-stats" style="margin:0">
        <div class="workout-stat"><span class="workout-stat-value">${parsed.kcal}</span><span class="workout-stat-label">kcal</span></div>
        <div class="workout-stat"><span class="workout-stat-value">${parsed.prot}g</span><span class="workout-stat-label">Protéines</span></div>
        <div class="workout-stat"><span class="workout-stat-value">${parsed.gluc}g</span><span class="workout-stat-label">Glucides</span></div>
        <div class="workout-stat"><span class="workout-stat-value">${parsed.lip}g</span><span class="workout-stat-label">Lipides</span></div>
      </div>
    `;
  } catch (e) {
    document.getElementById('macro-vocal-loading').style.display = 'none';
    document.getElementById('macro-vocal-text').textContent = 'Erreur d\'analyse. Réessaie ou utilise la saisie manuelle.';
  }
}

function confirmVocalMacros() {
  if (!pendingVocalMacros) return;
  const data = getTodayMacros();
  data.meals.push(pendingVocalMacros);
  saveTodayMacros(data);
  pendingVocalMacros = null;
  document.getElementById('macro-vocal-result').style.display = 'none';
  document.getElementById('macro-vocal-text').textContent = 'Appuie pour parler...';
  initMacros();
}

function cancelVocalMacros() {
  pendingVocalMacros = null;
  document.getElementById('macro-vocal-result').style.display = 'none';
  document.getElementById('macro-vocal-text').textContent = 'Appuie pour parler...';
}

// ===== GRAPHE HEBDO =====
function renderMacroChart() {
  const log = getMacrosLog();
  const labels = [];
  const kcalData = [];
  const protData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dayData = log[key];
    labels.push(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
    const totals = dayData ? calcTotals(dayData.meals) : { kcal: 0, prot: 0 };
    kcalData.push(totals.kcal);
    protData.push(totals.prot);
  }

  const ctx = document.getElementById('macroChart').getContext('2d');
  if (macroChart) macroChart.destroy();

  macroChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Calories',
          data: kcalData,
          backgroundColor: 'rgba(232,255,71,0.3)',
          borderColor: '#e8ff47',
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Protéines (g)',
          data: protData,
          backgroundColor: 'rgba(255,71,87,0.3)',
          borderColor: '#ff4757',
          borderWidth: 2,
          borderRadius: 6,
          type: 'line',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#888', font: { size: 11 }, boxWidth: 16 } },
        tooltip: { backgroundColor: '#1a1a1a', borderColor: '#333', borderWidth: 1, titleColor: '#fff', bodyColor: '#aaa' }
      },
      scales: {
        x: { ticks: { color: '#666', font: { size: 10 } }, grid: { color: '#1e1e1e' } },
        y: { ticks: { color: '#666', font: { size: 10 } }, grid: { color: '#1e1e1e' }, position: 'left' },
        y1: { ticks: { color: '#666', font: { size: 10 } }, grid: { display: false }, position: 'right' }
      }
    }
  });
}

// ===== SETTINGS =====
function openSettings() {
  const config = getConfig();
  if (config) {
    document.getElementById('settings-taille').textContent = config.taille + ' cm';
    document.getElementById('settings-poids-depart').textContent = config.poidsDepart + ' kg';
    document.getElementById('settings-poids-cible').textContent = config.poidsCible + ' kg';
    document.getElementById('settings-date-cible').textContent = formatDate(config.dateCible);
  }
  document.getElementById('settings-overlay').style.display = 'flex';
  document.getElementById('settings-overlay').style.flexDirection = 'column';
  document.getElementById('settings-btn').style.display = 'none';
}

function closeSettings() {
  document.getElementById('settings-overlay').style.display = 'none';
  document.getElementById('settings-btn').style.display = 'flex';
}

// ===== FAB + BOTTOMSHEET POIDS =====
function openPoidsBottomsheet() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('bottomsheet-date').textContent = dateStr;

  // Génère les valeurs de 30 à 150 kg par 0.1
  const picker = document.getElementById('poids-picker');
  picker.innerHTML = '';
  const entries = getEntries();
  const last = entries.length ? entries[entries.length - 1].poids : 70;
  const values = [];
  for (let v = 30; v <= 150; v += 0.1) {
    values.push(parseFloat(v.toFixed(1)));
  }

  values.forEach(v => {
    const item = document.createElement('div');
    item.className = 'poids-picker-item';
    item.textContent = v.toFixed(1) + ' kg';
    item.dataset.value = v;
    picker.appendChild(item);
  });

  // Scroll vers le dernier poids connu
  const targetIdx = values.findIndex(v => Math.abs(v - last) < 0.05);
  const itemHeight = 40;
  picker.scrollTop = targetIdx * itemHeight;
  updatePickerSelected(picker);

  // Overlay + animation
  document.getElementById('poids-bottomsheet-overlay').style.display = 'block';
  requestAnimationFrame(() => {
    document.getElementById('poids-bottomsheet').classList.add('open');
  });

  // Écoute le scroll
  picker.addEventListener('scroll', () => updatePickerSelected(picker), { passive: true });
}

function updatePickerSelected(picker) {
  const itemHeight = 40;
  const scrollTop = picker.scrollTop;
  const centerIdx = Math.round(scrollTop / itemHeight);
  const items = picker.querySelectorAll('.poids-picker-item');

  items.forEach((item, i) => {
    item.classList.toggle('selected', i === centerIdx);
  });

  const selectedItem = items[centerIdx];
  if (selectedItem) {
    document.getElementById('poids-picker-selected').textContent = selectedItem.dataset.value + ' kg';
  }
}

function closePoidsBottomsheet() {
  document.getElementById('poids-bottomsheet').classList.remove('open');
  setTimeout(() => {
    document.getElementById('poids-bottomsheet-overlay').style.display = 'none';
  }, 350);
}

function confirmPoidsBottomsheet() {
  const valStr = document.getElementById('poids-picker-selected').textContent.replace(' kg', '');
  const poids = parseFloat(valStr);
  if (!poids) return;

  const date = today();
  const entries = getEntries();
  const exists = entries.findIndex(e => e.date === date);

  if (exists >= 0) {
    if (!confirm('Une entrée existe déjà pour aujourd\'hui. La remplacer ?')) return;
    entries[exists].poids = poids;
  } else {
    entries.push({ date, poids });
    entries.sort((a, b) => a.date.localeCompare(b.date));
  }

  saveEntries(entries);
  closePoidsBottomsheet();
  initPoids();
}

// ===== MISE À JOUR initPoids POUR FAB =====
function renderFAB() {
  // Supprime l'ancien FAB s'il existe
  const old = document.getElementById('fab-poids');
  if (old) old.remove();

  const fab = document.createElement('button');
  fab.id = 'fab-poids';
  fab.className = 'fab-add';
  fab.innerHTML = '+';
  fab.onclick = openPoidsBottomsheet;
  document.getElementById('app').appendChild(fab);
}