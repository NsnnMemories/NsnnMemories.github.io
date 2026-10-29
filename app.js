import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { observeFades, fmtDate, loaderHTML } from "./theme.js";

const db = getFirestore(initializeApp(firebaseConfig));
const $ = id => document.getElementById(id);
let tab = 'memory', items = [];

onSnapshot(query(collection(db,'submissions'), where('status','==','approved')), snap => {
  items = snap.docs.map(d => d.data()).sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
  render();
}, () => { $('list').innerHTML = '<p class="empty">Could not load. Check firebase-config.js ✨</p>'; });

$('list').innerHTML = loaderHTML;

function render(){
  if (tab === 'poty') return renderPoty();
  const list = items.filter(i => i.type === tab), box = $('list');
  box.innerHTML = '';
  if (!list.length){ box.innerHTML = `<p class="empty pop">Nothing here yet — be the first! ✨</p>`; return; }
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

document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b));
  tab = b.dataset.t; $('add').hidden = tab === 'poty'; $('add').textContent = tab === 'memory' ? 'Add a memory' : 'Add a quote'; render();
});

const open = () => {
  $('mtitle').textContent = tab === 'memory' ? 'Share a memory' : 'Share a quote';
  $('imgBox').hidden = tab !== 'memory'; $('qBox').hidden = tab !== 'quote';
  $('file').required = tab === 'memory'; $('text').required = tab === 'quote';
  $('modal').classList.add('open');
};
const close = () => { $('modal').classList.remove('open'); $('form').reset(); $('prev').style.display = 'none'; };
$('add').onclick = open; $('cancel').onclick = close;
$('modal').onclick = e => { if (e.target === $('modal')) close(); };

// shrink the photo so it fits free Firestore (no paid Storage needed)
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

const toast = m => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 3200); };

$('form').onsubmit = async e => {
  e.preventDefault(); $('send').disabled = true; $('send').textContent = '✨ Sending…';
  try {
    const data = { type: tab, name: $('name').value.trim(), status: 'pending', createdAt: serverTimestamp() };
    if (tab === 'memory') data.image = await compress($('file').files[0]); else data.text = $('text').value.trim();
    await addDoc(collection(db,'submissions'), data);
    close(); toast('Sent! It will show up once approved 💙');
  } catch (err) { toast('Something went wrong. Try a smaller picture.'); console.error(err); }
  $('send').disabled = false; $('send').textContent = 'Send';
};

// Photo of the Year: one winner per year, picked by the admin
function renderPoty(){
  const box = $('list'); box.innerHTML = '';
  const list = items.filter(i => i.type === 'memory' && i.featuredYear).sort((a,b) => b.featuredYear - a.featuredYear);
  if (!list.length){ box.innerHTML = '<p class="empty pop">The first Photo of the Year is on its way ✨</p>'; return; }
  list.forEach(i => {
    const sec = document.createElement('section'); sec.className = 'poty fade';
    const h = document.createElement('h2'); h.className = 'pop grad'; h.textContent = i.featuredYear;
    const fr = document.createElement('div'); fr.className = 'frame';
    const im = document.createElement('img'); im.src = i.image; im.alt = 'Photo of the Year ' + i.featuredYear; fr.append(im);
    const s = document.createElement('div'); s.className = 'sig'; s.innerHTML = '<b></b><span></span>';
    s.firstChild.textContent = '— ' + i.name; s.lastChild.textContent = fmtDate(i.createdAt);
    sec.append(h, fr, s); box.append(sec);
  });
  observeFades(box);
}
