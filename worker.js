const ADMIN_PASSWORD = 'LukSMP-Admin-8264';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
};
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json; charset=utf-8', ...cors}});
const auth = req => req.headers.get('Authorization') === `Bearer ${ADMIN_PASSWORD}`;
const bad = msg => json({error:msg}, 400);

async function ensureSchema(env) {
  const sql = [
    `CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS ideas (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, idea TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS news (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, event_at TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, player TEXT NOT NULL, reason TEXT NOT NULL, details TEXT, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS support (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS names (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, token TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS private_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT NOT NULL, recipient TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL)`
  ];
  for (const q of sql) await env.DB.prepare(q).run();
}

const reserved = /(^|[^a-z])(owner|admin|administrator|mod|moderator|sup|supervisor|staff|team|developer|dev|support|manager|leitung|inhaber|besitzer)([^a-z]|$)/i;
function validName(name){return typeof name==='string' && name.trim().length>=2 && name.trim().length<=24 && !reserved.test(name.trim());}
function clean(s,max){return typeof s==='string' ? s.trim().slice(0,max) : '';}
function tokenFor(name){return crypto.randomUUID()+'-'+crypto.randomUUID();}
async function nameByToken(env,token){if(!token)return null; const r=await env.DB.prepare('SELECT name,token FROM names WHERE token=? LIMIT 1').bind(token).first(); return r||null;}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null,{headers:cors});
    try {
      await ensureSchema(env);
      const u = new URL(req.url);
      const path = u.pathname;
      if (path === '/api/register-name' && req.method === 'POST') {
        const b=await req.json(); const name=clean(b.name,24);
        if(!validName(name)) return bad('Dieser Name ist ungültig oder reserviert.');
        const existing=await env.DB.prepare('SELECT name,token FROM names WHERE lower(name)=lower(?) LIMIT 1').bind(name).first();
        if(existing) return json({name:existing.name,token:existing.token});
        const token=tokenFor(name);
        await env.DB.prepare('INSERT INTO names(name,token,created_at) VALUES(?,?,?)').bind(name,token,new Date().toISOString()).run();
        return json({name,token});
      }
      if (path === '/api/private-messages' && req.method === 'POST') {
        const b=await req.json(); const sender=clean(b.from,24), recipient=clean(b.to,24), message=clean(b.message,500);
        const owner=await nameByToken(env,b.token);
        if(!owner || owner.name!==sender) return json({error:'Dein fester Name konnte nicht bestätigt werden.'},401);
        if(!recipient || !message) return bad('Empfänger und Nachricht fehlen.');
        const target=await env.DB.prepare('SELECT name FROM names WHERE lower(name)=lower(?) LIMIT 1').bind(recipient).first();
        if(!target) return bad('Dieser Name wurde noch nicht registriert.');
        await env.DB.prepare('INSERT INTO private_messages(sender,recipient,message,created_at) VALUES(?,?,?,?)').bind(sender,target.name,message,new Date().toISOString()).run();
        return json({ok:true});
      }
      if (path === '/api/private-messages' && req.method === 'GET') {
        const token=u.searchParams.get('token'); const owner=await nameByToken(env,token);
        if(!owner) return json({error:'Nicht autorisiert.'},401);
        const r=await env.DB.prepare('SELECT * FROM private_messages WHERE sender=? OR recipient=? ORDER BY id DESC LIMIT 100').bind(owner.name,owner.name).all();
        return json({messages:r.results.reverse()});
      }
      if (path === '/api/messages' && req.method === 'GET') {
        const r=await env.DB.prepare('SELECT id,name,message,created_at FROM chat ORDER BY id DESC LIMIT 100').all();
        return json({messages:r.results.reverse()});
      }
      if (path === '/api/messages' && req.method === 'POST') {
        const b=await req.json(); const name=clean(b.name,24), message=clean(b.message,300);
        const owner=await nameByToken(env,b.token);
        if(!owner || owner.name!==name) return json({error:'Bitte zuerst einen festen Namen festlegen.'},401);
        if(!validName(name)) return bad('Dieser Name ist ungültig oder reserviert.');
        if(!message) return bad('Nachricht fehlt.');
        await env.DB.prepare('INSERT INTO chat(name,message,created_at) VALUES(?,?,?)').bind(name,message,new Date().toISOString()).run();
        return json({ok:true});
      }
      if (path === '/api/ideas' && req.method === 'GET') {
        if(!auth(req)) return json({error:'Nicht autorisiert.'},401);
        const r=await env.DB.prepare('SELECT * FROM ideas ORDER BY id DESC LIMIT 300').all(); return json({ideas:r.results});
      }
      if (path === '/api/ideas' && req.method === 'POST') {
        const b=await req.json(); const name=clean(b.name,24), idea=clean(b.idea,500);
        const owner=await nameByToken(env,b.token); if(!owner || owner.name!==name) return json({error:'Bitte zuerst einen festen Namen festlegen.'},401);
        if(!validName(name)) return bad('Dieser Name ist ungültig oder reserviert.'); if(!idea) return bad('Idee fehlt.');
        await env.DB.prepare('INSERT INTO ideas(name,idea,created_at) VALUES(?,?,?)').bind(name,idea,new Date().toISOString()).run(); return json({ok:true});
      }
      if (path === '/api/public' && req.method === 'GET') {
        const [n,e,no]=await Promise.all([
          env.DB.prepare('SELECT * FROM news ORDER BY id DESC LIMIT 10').all(),
          env.DB.prepare('SELECT * FROM events WHERE event_at >= ? ORDER BY event_at ASC LIMIT 20').bind(new Date().toISOString()).all(),
          env.DB.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT 10').all()
        ]);
        return json({news:n.results,events:e.results,notifications:no.results});
      }
      if (path === '/api/reports' && req.method === 'POST') {
        const b=await req.json(); const name=clean(b.name,24), player=clean(b.player,24), reason=clean(b.reason,100), details=clean(b.details,1000);
        const owner=await nameByToken(env,b.token); if(!owner || owner.name!==name) return json({error:'Bitte zuerst einen festen Namen festlegen.'},401);
        if(!validName(name)||!player||!reason) return bad('Bitte Name, Spieler und Grund ausfüllen.');
        await env.DB.prepare('INSERT INTO reports(name,player,reason,details,created_at) VALUES(?,?,?,?,?)').bind(name,player,reason,details,new Date().toISOString()).run(); return json({ok:true});
      }
      if (path === '/api/support' && req.method === 'POST') {
        const b=await req.json(); const name=clean(b.name,24), subject=clean(b.subject,100), message=clean(b.message,1200);
        const owner=await nameByToken(env,b.token); if(!owner || owner.name!==name) return json({error:'Bitte zuerst einen festen Namen festlegen.'},401);
        if(!validName(name)||!subject||!message) return bad('Bitte alle Felder ausfüllen.');
        await env.DB.prepare('INSERT INTO support(name,subject,message,created_at) VALUES(?,?,?,?)').bind(name,subject,message,new Date().toISOString()).run(); return json({ok:true});
      }
      if (path === '/api/admin/login' && req.method === 'POST') {
        const b=await req.json(); if(b.password!==ADMIN_PASSWORD) return json({error:'Falsches Admin-Passwort.'},401); return json({ok:true,token:ADMIN_PASSWORD});
      }
      if (path === '/api/admin/data' && req.method === 'GET') {
        if(!auth(req)) return json({error:'Nicht autorisiert.'},401);
        const [i,c,r,s,n,e,no,pm]=await Promise.all([
          env.DB.prepare('SELECT * FROM ideas ORDER BY id DESC LIMIT 300').all(), env.DB.prepare('SELECT * FROM chat ORDER BY id DESC LIMIT 300').all(),
          env.DB.prepare('SELECT * FROM reports ORDER BY id DESC LIMIT 300').all(), env.DB.prepare('SELECT * FROM support ORDER BY id DESC LIMIT 300').all(),
          env.DB.prepare('SELECT * FROM news ORDER BY id DESC LIMIT 100').all(), env.DB.prepare('SELECT * FROM events ORDER BY event_at ASC LIMIT 100').all(), env.DB.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT 100').all(), env.DB.prepare('SELECT * FROM private_messages ORDER BY id DESC LIMIT 300').all()
        ]);
        return json({ideas:i.results,messages:c.results,reports:r.results,support:s.results,news:n.results,events:e.results,notifications:no.results,privateMessages:pm.results});
      }
      if (path === '/api/admin/clear-chat' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); await env.DB.prepare('DELETE FROM chat').run(); return json({ok:true}); }
      if (path === '/api/admin/delete-idea' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('DELETE FROM ideas WHERE id=?').bind(Number(b.id)).run(); return json({ok:true}); }
      if (path === '/api/admin/delete-report' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('DELETE FROM reports WHERE id=?').bind(Number(b.id)).run(); return json({ok:true}); }
      if (path === '/api/admin/delete-support' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('DELETE FROM support WHERE id=?').bind(Number(b.id)).run(); return json({ok:true}); }
      if (path === '/api/admin/news' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); const t=clean(b.title,120),c=clean(b.content,1500); if(!t||!c)return bad('Titel und Inhalt fehlen.'); await env.DB.prepare('INSERT INTO news(title,content,created_at) VALUES(?,?,?)').bind(t,c,new Date().toISOString()).run(); return json({ok:true}); }
      if (path === '/api/admin/event' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); const t=clean(b.title,120),d=clean(b.description,1000),at=clean(b.event_at,60); if(!t||!at)return bad('Titel und Termin fehlen.'); await env.DB.prepare('INSERT INTO events(title,description,event_at,created_at) VALUES(?,?,?,?)').bind(t,d,at,new Date().toISOString()).run(); return json({ok:true}); }
      if (path === '/api/admin/notification' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); const t=clean(b.title,120),m=clean(b.message,1000); if(!t||!m)return bad('Titel und Nachricht fehlen.'); await env.DB.prepare('INSERT INTO notifications(title,message,created_at) VALUES(?,?,?)').bind(t,m,new Date().toISOString()).run(); return json({ok:true}); }
      if (path === '/api/admin/delete-news' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('DELETE FROM news WHERE id=?').bind(Number(b.id)).run(); return json({ok:true}); }
      if (path === '/api/admin/delete-event' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('DELETE FROM events WHERE id=?').bind(Number(b.id)).run(); return json({ok:true}); }
      if (path === '/api/admin/delete-notification' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('DELETE FROM notifications WHERE id=?').bind(Number(b.id)).run(); return json({ok:true}); }
      if (path.startsWith('/api/')) return json({error:'Nicht gefunden.'},404);
      if (env.ASSETS) return env.ASSETS.fetch(req);
      return new Response('LukSMP App', {headers:{'Content-Type':'text/plain'}});
    } catch(e) { return json({error:e?.message || 'Serverfehler'},500); }
  }
};
