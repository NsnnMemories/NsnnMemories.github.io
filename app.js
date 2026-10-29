import { observeFades, fmtDate, loaderHTML, seasonOf, currentSeason, seasonLabel } from "./theme.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
let tab = 'memory', items = [], db = null, fs = null, season = null;

/* ---------- UI first, so tabs and the form work even if Firebase fails ---------- */
function render(){
  if (tab === 'poty') return renderPoty();
  const box = $('list'); box.innerHTML = '';
  const mine = items.filter(i => i.type === tab), cur = currentSeason();
  const seasons = [...new Set([cur, ...mine.map(i => seasonOf(i.createdAt))])].sort((x, y) => y - x);
  if (season === null || !seasons.includes(season)) season = cur;
  const bar = document.createElement('div'); bar.className = 'folders';
  seasons.forEach(y => {
    const b = document.createElement('button'); b.className = 'folder' + (y === season ? ' active' : '');
    b.textContent = '📁 ' + seasonLabel(y) + ' · ' + mine.filter(i => seasonOf(i.createdAt) === y).length;
    b.onclick = () => { season = y; render(); }; bar.append(b);
  });
  box.append(bar);
  const list = mine.filter(i => seasonOf(i.createdAt) === season);
  if (!list.length){ const p = document.createElement('p'); p.className = 'empty pop'; p.textContent = 'Nothing in this folder yet — be the first! ✨'; box.append(p); return; }
  const grid = document.createElement('div'); grid.className = 'grid';
  list.forEach(i => {
    const el = document.createElement('div'); el.className = 'item fade';
    if (i.type === 'memory'){ const im = document.createElement('img'); im.src = i.image; im.alt = 'Memory by ' + i.name; el.append(im); }
    else { const q = document.createElement('p'); q.className = 'quote'; q.textContent = i.text; el.append(q); }
    const s = document.createElement('div'); s.className = 'sig';
    s.innerHTML = '<b></b><span></span>'; s.firstChild.textContent = '— ' + i.name; s.lastChild.textContent = fmtDate(i.createdAt);
    el.append(s); grid.append(el);
  });
  box.append(grid); observeFades(box);
}

function renderPoty(){
  const box = $('list'); box.innerHTML = '';
  const list = items.filter(i => i.type === 'memory' && i.featuredYear).sort((x, y) => y.featuredYear - x.featuredYear);
  if (!list.length){ box.innerHTML = '<p class="empty pop">The first Photo of the Year is on its way ✨</p>'; return; }
  list.forEach(i => {
    const sec = document.createElement('section'); sec.className = 'poty fade';
    const k = document.createElement('p'); k.className = 'kicker'; k.textContent = 'Photo of the Year';
    const h = document.createElement('h2'); h.className = 'pop grad'; h.textContent = seasonLabel(i.featuredYear);
    const fr = document.createElement('div'); fr.className = 'frame';
    const im = document.createElement('img'); im.src = i.image; im.alt = 'Photo of the Year ' + seasonLabel(i.featuredYear); fr.append(im);
    const s = document.createElement('div'); s.className = 'sig'; s.innerHTML = '<b></b><span></span>';
    s.firstChild.textContent = '— ' + i.name; s.lastChild.textContent = fmtDate(i.createdAt);
    sec.append(k, h, fr, s); box.append(sec);
  });
  observeFades(box);
}

document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b));
  tab = b.dataset.t; $('add').hidden = tab === 'poty';
  $('add').textContent = tab === 'memory' ? 'Add a memory' : 'Add a quote'; render();
});

const openModal = () => {
  $('mtitle').textContent = tab === 'memory' ? 'Share a memory' : 'Share a quote';
  $('imgBox').hidden = tab !== 'memory'; $('qBox').hidden = tab !== 'quote';
  $('file').required = tab === 'memory'; $('text').required = tab === 'quote';
  $('modal').classList.add('open');
};
const closeModal = () => { $('modal').classList.remove('open'); $('form').reset(); $('prev').style.display = 'none'; };
$('add').onclick = openModal; $('cancel').onclick = closeModal;
$('modal').onclick = e => { if (e.target === $('modal')) closeModal(); };

function compress(file, max = 1000){
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = img.width * k; c.height = img.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', .72));
    };
    img.onerror = rej; img.src = url;
  });
}
$('file').onchange = async e => { const f = e.target.files[0]; if (!f) return; $('prev').src = await compress(f, 500); $('prev').style.display = 'block'; };

const toast = m => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 3800); };

$('form').onsubmit = async e => {
  e.preventDefault();
  if (!db) return toast('Not connected to Firebase yet. Check firebase-config.js');
  $('send').disabled = true; $('send').textContent = '✨ Sending…';
  try {
    const data = { type: tab, name: $('name').value.trim(), status: 'pending', createdAt: fs.serverTimestamp() };
    if (tab === 'memory') data.image = await compress($('file').files[0]); else data.text = $('text').value.trim();
    await fs.addDoc(fs.collection(db, 'submissions'), data);
    closeModal(); toast('Sent! It will show up once approved 💙');
  } catch (err) { toast('Could not send: ' + (err.code || err.message)); console.error(err); }
  $('send').disabled = false; $('send').textContent = 'Send';
};

/* ---------- Firebase (loaded after the UI is alive) ---------- */
$('list').innerHTML = loaderHTML;
try {
  const V = "https://www.gstatic.com/firebasejs/10.12.2/";
  const { initializeApp } = await import(V + "firebase-app.js");
  fs = await import(V + "firebase-firestore.js");
  db = fs.getFirestore(initializeApp(firebaseConfig));
  fs.onSnapshot(fs.query(fs.collection(db, 'submissions'), fs.where('status', '==', 'approved')), snap => {
    items = snap.docs.map(d => d.data()).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    render();
  }, err => { console.error(err); $('list').innerHTML = `<p class="empty">Could not load: ${err.code || err.message}<br>Check the Firestore database and rules.</p>`; });
} catch (err) {
  console.error(err);
  $('list').innerHTML = `<p class="empty">Firebase failed to load: ${err.message}</p>`;
}
