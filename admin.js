import { observeFades, fmtDate, loaderHTML } from "./theme.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
let view = 'pending', all = [], unsub = null, db, auth, fs, au;

const toast = m => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 6000); };
const fail = e => {
  console.error(e);
  toast(e.code === 'permission-denied'
    ? 'Permission denied. The admin email in firestore.rules must be exactly: ' + (auth?.currentUser?.email || '?') + ' (then Publish the rules)'
    : 'Error: ' + (e.code || e.message));
};
const act = fn => async () => { try { await fn(); toast('Done ✨'); } catch (e) { fail(e); } };

$('login').onsubmit = async e => {
  e.preventDefault(); $('err').textContent = '';
  if (!auth) { $('err').textContent = 'Firebase is not loaded yet.'; return; }
  try { await au.signInWithEmailAndPassword(auth, $('email').value.trim(), $('pass').value); }
  catch (er) { $('err').textContent = 'Login failed: ' + (er.code || er.message); }
};
$('out').onclick = () => auth && au.signOut(auth);

document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b)); view = b.dataset.s; render();
});

function render(){
  $('cp').textContent = '(' + all.filter(i => i.status === 'pending').length + ')';
  const list = all.filter(i => i.status === view), box = $('list'); box.innerHTML = '';
  if (!list.length){ box.innerHTML = '<p class="empty pop">All clear ✨</p>'; return; }
  const grid = document.createElement('div'); grid.className = 'grid';
  list.forEach(i => {
    const ref = () => fs.doc(db, 'submissions', i.id);
    const el = document.createElement('div'); el.className = 'item admin-card fade';
    if (i.type === 'memory'){ const im = document.createElement('img'); im.src = i.image; el.append(im); }
    else { const q = document.createElement('p'); q.className = 'quote'; q.textContent = i.text; el.append(q); }
    const s = document.createElement('div'); s.className = 'sig'; s.innerHTML = '<b></b><span></span>';
    s.firstChild.textContent = '— ' + i.name + ' · ' + i.type; s.lastChild.textContent = fmtDate(i.createdAt); el.append(s);
    if (i.featuredYear){ const b = document.createElement('span'); b.className = 'badge'; b.textContent = '🏆 Photo of ' + i.featuredYear; el.append(b); }
    const r = document.createElement('div'); r.className = 'row';
    const btn = (cls, txt, fn) => { const x = document.createElement('button'); x.className = cls; x.textContent = txt; x.onclick = act(fn); r.append(x); };
    if (i.status === 'pending') btn('btn sm', 'Accept', () => fs.updateDoc(ref(), { status: 'approved' }));
    if (i.status === 'approved' && i.type === 'memory'){
      const yr = i.createdAt?.toDate ? i.createdAt.toDate().getFullYear() : new Date().getFullYear();
      btn('btn ghost sm', i.featuredYear ? 'Remove from Photo of the Year' : 'Photo of ' + yr, async () => {
        const batch = fs.writeBatch(db);
        if (i.featuredYear) batch.update(ref(), { featuredYear: fs.deleteField() });
        else {
          all.filter(x => x.featuredYear === yr).forEach(x => batch.update(fs.doc(db, 'submissions', x.id), { featuredYear: fs.deleteField() }));
          batch.update(ref(), { featuredYear: yr });
        }
        await batch.commit();
      });
    }
    const del = document.createElement('button'); del.className = 'btn danger sm'; del.textContent = i.status === 'pending' ? 'Deny' : 'Delete';
    del.onclick = async () => { if (!confirm('Delete this for good?')) return; try { await fs.deleteDoc(ref()); toast('Deleted'); } catch (e) { fail(e); } };
    r.append(del); el.append(r); grid.append(el);
  });
  box.append(grid); observeFades(box);
}

try {
  const V = "https://www.gstatic.com/firebasejs/10.12.2/";
  const { initializeApp } = await import(V + "firebase-app.js");
  fs = await import(V + "firebase-firestore.js");
  au = await import(V + "firebase-auth.js");
  const app = initializeApp(firebaseConfig); db = fs.getFirestore(app); auth = au.getAuth(app);
  au.onAuthStateChanged(auth, user => {
    $('login').hidden = !!user; $('panel').hidden = !user;
    if (unsub) unsub();
    if (!user) return;
    $('who').textContent = 'Logged in as ' + user.email;
    $('list').innerHTML = loaderHTML;
    unsub = fs.onSnapshot(fs.collection(db, 'submissions'), snap => {
      all = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      render();
    }, e => { console.error(e); $('list').innerHTML = '<p class="empty">Cannot read submissions (' + (e.code || e.message) + ').<br>Logged in as ' + user.email + '. This must match the email inside firestore.rules. Publish the rules again.</p>'; });
  });
} catch (e) { console.error(e); $('err').textContent = 'Firebase failed to load: ' + e.message; }
