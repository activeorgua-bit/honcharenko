// Статичний знімок links.ppl.watch: відповіді API підставляються з window.STATIC (data/<uid>.js).
(function () {
  const S = window.STATIC || {};
  const json = o => Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  const miss = (what) => Promise.resolve(new Response(JSON.stringify({ detail: 'немає у статичній версії: ' + what }), { status: 404, headers: { 'Content-Type': 'application/json' } }));
  const egoKey = it => it.kind === 'company' ? 'company:' + it.edrpou : it.kind === 'go' ? 'go:' + it.ident : 'person:' + it.name_key;
  const orig = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    const u = typeof url === 'string' ? url : url.url;
    if (!u.startsWith('/api')) return orig(url, opts);
    const path = u.replace(/^\/api/, '');
    const method = ((opts || {}).method || 'GET').toUpperCase();
    if (method === 'POST' && path.startsWith('/ego/batch')) {
      const items = JSON.parse(opts.body).items || [];
      return json(items.map(it => (S.ego || {})[egoKey(it)] || { center: null, nodes: [], edges: [], truncated: { 'статична версія': 1 } }));
    }
    if (method !== 'GET') { alert('У статичній версії зміни не зберігаються.'); return miss(path); }
    if (path.startsWith('/person/uid/') && path.includes('/dossier')) return S.dossier ? json(S.dossier) : miss(path);
    if (path.startsWith('/reports')) return json(S.reports || []);
    if (path.startsWith('/feedback')) return json(S.feedback || { items: [] });
    if (path.startsWith('/chesno')) { const n = decodeURIComponent((path.match(/name=([^&]*)/) || [])[1] || ''); return json((S.chesno || {})[n] || { matches: [], others: [] }); }
    return miss(path);
  };
  // посилання на інші досьє: експортовані — локальні файли, решта — повідомлення
  const EXPORTED = new Set((S.exported || []).map(String));
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="/person/"]'); if (!a) return;
    const m = a.getAttribute('href').match(/^\/person\/(\d+)(?:\/report\/(\w+))?(#.*)?$/); if (!m) return;
    e.preventDefault();
    if (EXPORTED.has(m[1])) location.href = m[2] ? `${m[1]}-${m[2]}.html` : `${m[1]}.html${m[3] || ''}`;
    else alert('Досьє uid ' + m[1] + ' не входить у статичну версію.');
  }, true);
})();
