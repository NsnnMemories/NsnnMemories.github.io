import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, deleteField } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
import { observeFades, fmtDate, loaderHTML } from "./theme.js";

const app = initializeApp(firebaseConfig), db = getFirestore(app), auth = getAuth(app);
const $ = id => document.getElementById(id);
let view = 'pending', all = [], unsub = null;

$('login').onsubmit = async e => {
  e.preventDefault(); $('err').textContent = '';
  try { await signInWithEmailAndPassword(auth, $('email').value, $('pass').value); }
  catch { $('err').textContent = 'Wrong email or password.'; }
};
$('out').onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  $('login').hidden = !!user; $('panel').hidden = !user;
  if (unsub) unsub();
  if (!user) return;
  $('list').innerHTML = loaderHTML;
  unsub = onSnapshot(collection(db,'submissions'), snap => {
    all = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
    render();
  }, () => { $('list').innerHTML = '<p class="empty">No access. Check the admin email in firestore.rules.</p>'; });
});

document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b)); view = b.dataset.s; render();
});

function render(){
  $('cp').textContent = '(' + all.filter(i => i.status === 'pending').length + ')';
  const list = all.filter(i => i.status === view), box = $('list'); box.innerHTML = '';
  if (!list.length){ box.innerHTML = '<p class="empty pop">All clear ✨</p>'; return; }
  const grid = document.createElement('div'); grid.className = 'grid';
  list.forEach(i => {
    const el = document.createElement('div'); el.className = 'item admin-card fade';
    if (i.type === 'memory'){ const im = document.createElement('img'); im.src = i.image; el.append(im); }
    else { const q = document.createElement('p'); q.className = 'quote'; q.textContent = i.text; el.append(q); }
    const s = document.createElement('div'); s.className = 'sig'; s.innerHTML = '<b></b><span></span>';
    s.firstChild.textContent = '— ' + i.name + ' · ' + i.type; s.lastChild.textContent = fmtDate(i.createdAt); el.append(s);
    const r = document.createElement('div'); r.className = 'row';
    if (i.status === 'pending'){
      const ok = Object.assign(document.createElement('button'), { className:'btn sm', textContent:'Accept' });
      ok.onclick = () => updateDoc(doc(db,'submissions',i.id), { status:'approved' });
      r.append(ok);
    }
    if (i.status === 'approved' && i.type === 'memory'){
      const yr = i.createdAt?.toDate ? i.createdAt.toDate().getFullYear() : new Date().getFullYear();
      if (i.featuredYear){
        const b = document.createElement('span'); b.className = 'badge'; b.textContent = '🏆 Photo of ' + i.featuredYear; el.insertBefore(b, r);
      }
      const star = Object.assign(document.createElement('button'), { className:'btn ghost sm', textContent: i.featuredYear ? 'Remove from Photo of the Year' : 'Photo of ' + yr });
      star.onclick = async () => {
        const batch = writeBatch(db);
        if (i.featuredYear) batch.update(doc(db,'submissions',i.id), { featuredYear: deleteField() });
        else {
          all.filter(x => x.featuredYear === yr).forEach(x => batch.update(doc(db,'submissions',x.id), { featuredYear: deleteField() }));
          batch.update(doc(db,'submissions',i.id), { featuredYear: yr });
        }
        await batch.commit();
      };
      r.append(star);
    }
    const no = Object.assign(document.createElement('button'), { className:'btn danger sm', textContent: i.status === 'pending' ? 'Deny' : 'Delete' });
    no.onclick = () => confirm('Delete this for good?') && deleteDoc(doc(db,'submissions',i.id));
    r.append(no); el.append(r); grid.append(el);
  });
  box.append(grid); observeFades(box);
}
