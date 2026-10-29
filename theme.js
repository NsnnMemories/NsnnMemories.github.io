// October = month 9. Pink theme switches on by itself every year.
if (new Date().getMonth() === 9) document.documentElement.classList.add('october');
// fade-in on scroll
export const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.1});
export const observeFades = (root=document) => root.querySelectorAll('.fade:not(.in)').forEach(el => io.observe(el));
export const fmtDate = ts => (ts?.toDate ? ts.toDate() : new Date()).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
export const loaderHTML = '<div class="loader"><span>✨</span><span>✨</span><span>✨</span></div>';

// School year = September to September. Sep 2025 .. Aug 2026 -> season 2025 -> "2025/2026". Works for every future year.
export const seasonOf = ts => { const d = ts?.toDate ? ts.toDate() : new Date(); return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; };
export const currentSeason = () => seasonOf(null);
export const seasonLabel = y => y + '/' + (y + 1);
