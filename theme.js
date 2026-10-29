// October = month 9. Pink theme switches on by itself every year.
if (new Date().getMonth() === 9) document.documentElement.classList.add('october');
// fade-in on scroll
export const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.1});
export const observeFades = (root=document) => root.querySelectorAll('.fade:not(.in)').forEach(el => io.observe(el));
export const fmtDate = ts => (ts?.toDate ? ts.toDate() : new Date()).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
export const loaderHTML = '<div class="loader"><span>✨</span><span>✨</span><span>✨</span></div>';
