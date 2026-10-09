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
    `ALTER TABLE names ADD COLUMN password_hash TEXT`,
    `CREATE TABLE IF NOT EXISTS role_assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE COLLATE NOCASE, role_name TEXT NOT NULL, prefix TEXT NOT NULL, color_start TEXT NOT NULL DEFAULT '#8b5cf6', color_end TEXT NOT NULL DEFAULT '#ec4899', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS private_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT NOT NULL, recipient TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS support_tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, subject TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS support_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, ticket_id INTEGER NOT NULL, sender TEXT NOT NULL, sender_type TEXT NOT NULL, message TEXT NOT NULL, attachment_name TEXT, attachment_type TEXT, attachment_data TEXT, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS sup_applications (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open')`,
    `CREATE TABLE IF NOT EXISTS maintenance (id INTEGER PRIMARY KEY CHECK(id=1), enabled_until TEXT, started_at TEXT, started_by TEXT, show_pc INTEGER NOT NULL DEFAULT 1, show_mobile INTEGER NOT NULL DEFAULT 1, reason TEXT DEFAULT '')`,
    `CREATE TABLE IF NOT EXISTS forum_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Allgemein', created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, caption TEXT NOT NULL, image_data TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS friends (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, friend_name TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(name,friend_name))`,
    `CREATE TABLE IF NOT EXISTS friend_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT NOT NULL, recipient TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(sender,recipient))`,
    `CREATE TABLE IF NOT EXISTS online_presence (name TEXT PRIMARY KEY COLLATE NOCASE, last_seen TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL, details TEXT DEFAULT '', created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS poll_votes (id INTEGER PRIMARY KEY AUTOINCREMENT, poll_key TEXT NOT NULL, name TEXT NOT NULL, choice TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(poll_key,name))`,
    `CREATE TABLE IF NOT EXISTS event_signups (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(event_id,name))`,
    `CREATE TABLE IF NOT EXISTS reactions (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, name TEXT NOT NULL, emoji TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(chat_id,name,emoji))`,
    `CREATE TABLE IF NOT EXISTS staff_schedule (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, available_at TEXT NOT NULL, note TEXT DEFAULT '', created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS changelog (id INTEGER PRIMARY KEY AUTOINCREMENT, version TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL)` ,
    `CREATE TABLE IF NOT EXISTS clans (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE COLLATE NOCASE, tag TEXT NOT NULL UNIQUE COLLATE NOCASE, description TEXT NOT NULL DEFAULT '', leader TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS clan_members (id INTEGER PRIMARY KEY AUTOINCREMENT, clan_id INTEGER NOT NULL, name TEXT NOT NULL UNIQUE COLLATE NOCASE, role TEXT NOT NULL DEFAULT 'member', joined_at TEXT NOT NULL, UNIQUE(clan_id,name))`,
    `CREATE TABLE IF NOT EXISTS clan_invites (id INTEGER PRIMARY KEY AUTOINCREMENT, clan_id INTEGER NOT NULL, inviter TEXT NOT NULL, invitee TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(clan_id,invitee))`,
    `ALTER TABLE maintenance ADD COLUMN show_pc INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE maintenance ADD COLUMN show_mobile INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE maintenance ADD COLUMN reason TEXT DEFAULT ''`
  ];
  for (const q of sql) { try { await env.DB.prepare(q).run(); } catch (e) { if (!/duplicate column name/i.test(e?.message || '')) throw e; } }
  try { const c=await env.DB.prepare('SELECT COUNT(*) AS n FROM changelog').first(); if(!c?.n) await env.DB.prepare('INSERT INTO changelog(version,title,content,created_at) VALUES(?,?,?,?)').bind('v18','LukSMP Clans','Clan erstellen, beitreten, Einladungen, Mitgliederverwaltung und Clan-Leitung.','2026-10-09T00:00:00.000Z').run(); const v=await env.DB.prepare("SELECT id FROM changelog WHERE version='v19' LIMIT 1").first(); if(!v) await env.DB.prepare('INSERT INTO changelog(version,title,content,created_at) VALUES(?,?,?,?)').bind('v19','Online-Status & Freundschaftsanfragen','Online-Anzeige, gegenseitige Freundschaftsanfragen sowie Admin-only Dienstplan und Logs.','2026-10-09T00:00:00.000Z').run(); const v21=await env.DB.prepare("SELECT id FROM changelog WHERE version='v21' LIMIT 1").first();if(!v21)await env.DB.prepare('INSERT INTO changelog(version,title,content,created_at) VALUES(?,?,?,?)').bind('v21','Konten, Quiz & Rollen','Passwortkonten, 20-Fragen-Regelquiz, Ticket-Schließen und farbige Rollen-Prefixe.','2026-10-09T00:00:00.000Z').run(); } catch {}
}

const reserved = /(^|[^a-z])(owner|admin|administrator|mod|moderator|sup|supervisor|staff|team|developer|dev|support|manager|leitung|inhaber|besitzer)([^a-z]|$)/i;
function validName(name){return typeof name==='string' && name.trim().length>=2 && name.trim().length<=24 && !reserved.test(name.trim());}
function clean(s,max){return typeof s==='string' ? s.trim().slice(0,max) : '';}
function tokenFor(name){return crypto.randomUUID()+'-'+crypto.randomUUID();}
async function nameByToken(env,token){if(!token)return null; const r=await env.DB.prepare('SELECT name,token FROM names WHERE token=? LIMIT 1').bind(token).first(); return r||null;}
async function writeLog(env,actor,action,details=''){try{await env.DB.prepare('INSERT INTO audit_logs(actor,action,details,created_at) VALUES(?,?,?,?)').bind(clean(actor,24)||'System',clean(action,100),clean(details,500),new Date().toISOString()).run()}catch{}}
async function passwordHash(password,salt=crypto.randomUUID()){const enc=new TextEncoder();const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:150000,hash:'SHA-256'},key,256);const hex=[...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,'0')).join('');return salt+'$'+hex;}
async function passwordMatches(password,stored){if(!stored||!stored.includes('$'))return false;const salt=stored.split('$')[0];return (await passwordHash(password,salt))===stored;}
function validHexColor(v){return /^#[0-9a-f]{6}$/i.test(String(v||''));}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null,{headers:cors});
    try {
      await ensureSchema(env);
      const u = new URL(req.url);
      const path = u.pathname;
      if (path === '/api/register-account' && req.method === 'POST') {
        const b=await req.json(), name=clean(b.name,24), password=typeof b.password==='string'?b.password:'';
        if(!validName(name))return bad('Dieser Spielername ist ungültig oder reserviert.');
        if(password.length<8||password.length>128)return bad('Das Passwort muss mindestens 8 Zeichen lang sein.');
        const existing=await env.DB.prepare('SELECT name,password_hash FROM names WHERE lower(name)=lower(?) LIMIT 1').bind(name).first();
        if(existing){if(existing.password_hash)return json({error:'Dieser Name ist bereits registriert. Melde dich an.'},409);return json({error:'Dieser Name existiert schon ohne Passwort. Melde dich auf dem Gerät an, auf dem du bisher angemeldet bist, und lege im Profil ein Passwort fest.'},409);}
        const token=tokenFor(name), hash=await passwordHash(password);
        await env.DB.prepare('INSERT INTO names(name,token,created_at,password_hash) VALUES(?,?,?,?)').bind(name,token,new Date().toISOString(),hash).run();
        await writeLog(env,name,'Konto erstellt','');return json({name,token});
      }
      if (path === '/api/login-account' && req.method === 'POST') {
        const b=await req.json(),name=clean(b.name,24),password=typeof b.password==='string'?b.password:'';
        const user=await env.DB.prepare('SELECT name,token,password_hash FROM names WHERE lower(name)=lower(?) LIMIT 1').bind(name).first();
        if(!user||!await passwordMatches(password,user.password_hash))return json({error:'Name oder Passwort stimmt nicht.'},401);
        await env.DB.prepare('INSERT INTO online_presence(name,last_seen) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET last_seen=excluded.last_seen').bind(user.name,new Date().toISOString()).run();
        return json({name:user.name,token:user.token});
      }
      if (path === '/api/set-account-password' && req.method === 'POST') {
        const b=await req.json(),owner=await nameByToken(env,b.token),password=typeof b.password==='string'?b.password:'';
        if(!owner)return json({error:'Bitte melde dich auf deinem bisherigen Gerät an.'},401);
        if(password.length<8||password.length>128)return bad('Das Passwort muss mindestens 8 Zeichen lang sein.');
        await env.DB.prepare('UPDATE names SET password_hash=? WHERE token=?').bind(await passwordHash(password),owner.token).run();
        await writeLog(env,owner.name,'Kontopasswort festgelegt','');return json({ok:true});
      }
      if (path === '/api/register-name' && req.method === 'POST') { return json({error:'Bitte nutze die Registrierung mit Name und Passwort.'},410); }
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
        const r=await env.DB.prepare('SELECT c.id,c.name,c.message,c.created_at,ra.role_name,ra.prefix,ra.color_start,ra.color_end FROM chat c LEFT JOIN role_assignments ra ON lower(ra.name)=lower(c.name) ORDER BY c.id DESC LIMIT 100').all();
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
        const [n,e,no,m]=await Promise.all([
          env.DB.prepare('SELECT * FROM news ORDER BY id DESC LIMIT 10').all(),
          env.DB.prepare('SELECT * FROM events WHERE event_at >= ? ORDER BY event_at ASC LIMIT 20').bind(new Date().toISOString()).all(),
          env.DB.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT 10').all(),
          env.DB.prepare('SELECT * FROM maintenance WHERE id=1').first()
        ]);
        return json({news:n.results,events:e.results,notifications:no.results,maintenance:m||null});
      }
      if (path === '/api/reports' && req.method === 'POST') {
        const b=await req.json(); const name=clean(b.name,24), player=clean(b.player,24), reason=clean(b.reason,100), details=clean(b.details,1000);
        const owner=await nameByToken(env,b.token); if(!owner || owner.name!==name) return json({error:'Bitte zuerst einen festen Namen festlegen.'},401);
        if(!validName(name)||!player||!reason) return bad('Bitte Name, Spieler und Grund ausfüllen.');
        await env.DB.prepare('INSERT INTO reports(name,player,reason,details,created_at) VALUES(?,?,?,?,?)').bind(name,player,reason,details,new Date().toISOString()).run(); return json({ok:true});
      }
      if (path === '/api/support/tickets' && req.method === 'POST') {
        const b=await req.json(); const name=clean(b.name,24), subject=clean(b.subject,100), message=clean(b.message,2000);
        const owner=await nameByToken(env,b.token); if(!owner || owner.name!==name) return json({error:'Bitte zuerst einen festen Namen festlegen.'},401);
        if(!validName(name)||!subject||!message) return bad('Bitte Betreff und Nachricht ausfüllen.');
        const now=new Date().toISOString();
        const r=await env.DB.prepare('INSERT INTO support_tickets(name,subject,status,created_at,updated_at) VALUES(?,?,?,?,?)').bind(name,subject,'open',now,now).run();
        const id=r.meta.last_row_id;
        await env.DB.prepare('INSERT INTO support_messages(ticket_id,sender,sender_type,message,created_at) VALUES(?,?,?,?,?)').bind(id,name,'player',message,now).run();
        return json({ok:true,ticketId:id});
      }
      if (path === '/api/support/tickets' && req.method === 'GET') {
        const token=u.searchParams.get('token'); const owner=await nameByToken(env,token); if(!owner) return json({error:'Nicht autorisiert.'},401);
        const tickets=await env.DB.prepare("SELECT * FROM support_tickets WHERE name=? AND status!='closed' ORDER BY id DESC LIMIT 50").bind(owner.name).all();
        const out=[]; for(const t of tickets.results){const msgs=await env.DB.prepare('SELECT * FROM support_messages WHERE ticket_id=? ORDER BY id ASC').bind(t.id).all(); out.push({...t,messages:msgs.results});}
        return json({tickets:out});
      }
      if (path === '/api/support/tickets/close' && req.method === 'POST') {
        const b=await req.json(); const id=Number(b.ticketId),owner=await nameByToken(env,b.token); if(!id) return bad('Ticket fehlt.'); if(!owner)return json({error:'Nicht autorisiert.'},401);
        const t=await env.DB.prepare('SELECT * FROM support_tickets WHERE id=? AND name=?').bind(id,owner.name).first(); if(!t) return json({error:'Ticket nicht gefunden.'},404);
        await env.DB.prepare('UPDATE support_tickets SET status=?,updated_at=? WHERE id=?').bind('closed',new Date().toISOString(),id).run(); await writeLog(env,owner.name,'Support-Ticket geschlossen','#'+id+' · '+t.subject); return json({ok:true});
      }
      if (path === '/api/support/tickets/message' && req.method === 'POST') {
        const b=await req.json(); const token=b.token, owner=await nameByToken(env,token); if(!owner) return json({error:'Nicht autorisiert.'},401);
        const id=Number(b.ticketId), message=clean(b.message,2000); if(!id||!message) return bad('Nachricht fehlt.');
        const t=await env.DB.prepare('SELECT * FROM support_tickets WHERE id=? AND name=?').bind(id,owner.name).first(); if(!t) return json({error:'Ticket nicht gefunden.'},404); if(t.status==='closed')return bad('Dieses Ticket ist geschlossen.');
        const now=new Date().toISOString(); await env.DB.prepare('INSERT INTO support_messages(ticket_id,sender,sender_type,message,created_at) VALUES(?,?,?,?,?)').bind(id,owner.name,'player',message,now).run(); await env.DB.prepare('UPDATE support_tickets SET updated_at=?,status=? WHERE id=?').bind(now,'open',id).run(); return json({ok:true});
      }
      if (path === '/api/support/tickets/attachment' && req.method === 'POST') {
        const b=await req.json(); const owner=await nameByToken(env,b.token); if(!owner) return json({error:'Nicht autorisiert.'},401);
        const id=Number(b.ticketId), name=clean(b.name,120), type=clean(b.type,100), data=typeof b.data==='string'?b.data:'';
        if(!id||!name||!data) return bad('Datei fehlt.'); if(data.length>420000) return bad('Datei zu groß. Maximal ca. 300 KB.');
        const t=await env.DB.prepare('SELECT * FROM support_tickets WHERE id=? AND name=?').bind(id,owner.name).first(); if(!t) return json({error:'Ticket nicht gefunden.'},404); if(t.status==='closed')return bad('Dieses Ticket ist geschlossen.');
        const now=new Date().toISOString(); await env.DB.prepare('INSERT INTO support_messages(ticket_id,sender,sender_type,message,attachment_name,attachment_type,attachment_data,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,owner.name,'player','📎 Beweis/Datei: '+name,name,type,data,now).run(); await env.DB.prepare('UPDATE support_tickets SET updated_at=?,status=? WHERE id=?').bind(now,'open',id).run(); return json({ok:true});
      }
      if (path === '/api/sup-application' && req.method === 'POST') {
        const b=await req.json(); const name=clean(b.name,24), text=clean(b.text,3000); const owner=await nameByToken(env,b.token); if(!owner||owner.name!==name) return json({error:'Bitte zuerst einen festen Namen festlegen.'},401); if(!text) return bad('Bewerbung fehlt.');
        await env.DB.prepare('INSERT INTO sup_applications(name,text,created_at,status) VALUES(?,?,?,?)').bind(name,text,new Date().toISOString(),'open').run(); return json({ok:true});
      }
      if (path === '/api/my-tickets' && req.method === 'GET') {
        const token=u.searchParams.get('token'); const owner=await nameByToken(env,token); if(!owner) return json({error:'Nicht autorisiert.'},401); return json({applications:(await env.DB.prepare('SELECT * FROM sup_applications WHERE name=? ORDER BY id DESC LIMIT 20').bind(owner.name).all()).results});
      }
      if (path === '/api/support' && req.method === 'POST') {
        const b=await req.json(); const name=clean(b.name,24), subject=clean(b.subject,100), message=clean(b.message,1200);
        const owner=await nameByToken(env,b.token); if(!owner || owner.name!==name) return json({error:'Bitte zuerst einen festen Namen festlegen.'},401);
        if(!validName(name)||!subject||!message) return bad('Bitte alle Felder ausfüllen.');
        await env.DB.prepare('INSERT INTO support(name,subject,message,created_at) VALUES(?,?,?,?)').bind(name,subject,message,new Date().toISOString()).run(); return json({ok:true});
      }
      if (path === '/api/admin/login' && req.method === 'POST') {
        const b=await req.json(); if(b.password!==ADMIN_PASSWORD) return json({error:'Falsches Admin-Passwort.'},401); await writeLog(env,'Admin','Admin-Login','Dashboard geöffnet'); return json({ok:true,token:ADMIN_PASSWORD});
      }
      if (path === '/api/admin/maintenance' && req.method === 'POST') {
        if(!auth(req)) return json({error:'Nicht autorisiert.'},401);
        const b=await req.json(); const minutes=Number(b.minutes); const mode=String(b.mode||'start');
        if(mode==='off'){await env.DB.prepare('INSERT INTO maintenance(id,enabled_until,started_at,started_by,show_pc,show_mobile,reason) VALUES(1,NULL,NULL,?,1,1,?) ON CONFLICT(id) DO UPDATE SET enabled_until=NULL,started_at=NULL,started_by=?,show_pc=1,show_mobile=1,reason=?').bind('admin','', 'admin','').run(); await writeLog(env,'Admin','Wartung beendet',''); return json({ok:true,maintenance:null});}
        if(!Number.isFinite(minutes)||minutes<1||minutes>10080) return bad('Dauer muss zwischen 1 und 10080 Minuten liegen.');
        const until=new Date(Date.now()+minutes*60000).toISOString(), now=new Date().toISOString();
        const showPc=b.showPc===false?0:1, showMobile=b.showMobile===false?0:1, reason=clean(b.reason,300)||'Die Website wird gerade gewartet.';
        if(!showPc && !showMobile) return bad('Wähle mindestens PC oder Handy aus.');
        await env.DB.prepare('INSERT INTO maintenance(id,enabled_until,started_at,started_by,show_pc,show_mobile,reason) VALUES(1,?,?,?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET enabled_until=?,started_at=?,started_by=?,show_pc=?,show_mobile=?,reason=?').bind(until,now,'admin',showPc,showMobile,reason,until,now,'admin',showPc,showMobile,reason).run();
        await writeLog(env,'Admin','Wartung gestartet',reason+' · bis '+until); return json({ok:true,maintenance:{enabled_until:until,started_at:now,show_pc:showPc,show_mobile:showMobile,reason}});
      }
      if (path === '/api/admin/maintenance/status' && req.method === 'GET') { const m=await env.DB.prepare('SELECT * FROM maintenance WHERE id=1').first(); return json({maintenance:m||null}); }
      if (path === '/api/admin/support/tickets' && req.method === 'GET') {
        if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const ts=await env.DB.prepare("SELECT * FROM support_tickets WHERE status!='closed' ORDER BY updated_at DESC LIMIT 300").all(); const out=[]; for(const t of ts.results){const msgs=await env.DB.prepare('SELECT * FROM support_messages WHERE ticket_id=? ORDER BY id ASC').bind(t.id).all(); out.push({...t,messages:msgs.results});} return json({tickets:out});
      }
      if (path === '/api/admin/support/reply' && req.method === 'POST') {
        if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); const id=Number(b.ticketId), message=clean(b.message,2000); if(!id||!message)return bad('Nachricht fehlt.'); const t=await env.DB.prepare('SELECT * FROM support_tickets WHERE id=?').bind(id).first(); if(!t)return json({error:'Ticket nicht gefunden.'},404); if(t.status==='closed')return bad('Dieses Ticket ist geschlossen.'); const now=new Date().toISOString(); await env.DB.prepare('INSERT INTO support_messages(ticket_id,sender,sender_type,message,created_at) VALUES(?,?,?,?,?)').bind(id,'LukSMP Support','staff',message,now).run(); await env.DB.prepare('UPDATE support_tickets SET updated_at=?,status=? WHERE id=?').bind(now,'staff_replied',id).run(); return json({ok:true});
      }
      if (path === '/api/admin/support/reopen' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('UPDATE support_tickets SET status=?,updated_at=? WHERE id=?').bind('open',new Date().toISOString(),Number(b.ticketId)).run(); return json({ok:true}); }
      if (path === '/api/admin/support/close' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('UPDATE support_tickets SET status=? WHERE id=?').bind('closed',Number(b.ticketId)).run(); return json({ok:true}); }
      if (path === '/api/admin/roles' && req.method === 'GET') {
        if(!auth(req))return json({error:'Nicht autorisiert.'},401);
        const r=await env.DB.prepare('SELECT * FROM role_assignments ORDER BY role_name COLLATE NOCASE,name COLLATE NOCASE').all();return json({roles:r.results});
      }
      if (path === '/api/admin/roles/assign' && req.method === 'POST') {
        if(!auth(req))return json({error:'Nicht autorisiert.'},401);
        const b=await req.json(),name=clean(b.name,24),roleName=clean(b.roleName,32),prefix=clean(b.prefix,24),c1=String(b.colorStart||''),c2=String(b.colorEnd||'');
        if(!name||!roleName||!prefix)return bad('Spieler, Rollenname und Prefix sind Pflicht.');
        if(!validHexColor(c1)||!validHexColor(c2))return bad('Bitte gültige Farben auswählen.');
        const player=await env.DB.prepare('SELECT name FROM names WHERE lower(name)=lower(?)').bind(name).first();if(!player)return bad('Dieser Spieler hat noch kein Konto.');
        const now=new Date().toISOString();
        await env.DB.prepare('INSERT INTO role_assignments(name,role_name,prefix,color_start,color_end,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(name) DO UPDATE SET role_name=excluded.role_name,prefix=excluded.prefix,color_start=excluded.color_start,color_end=excluded.color_end,updated_at=excluded.updated_at').bind(player.name,roleName,prefix,c1,c2,now,now).run();
        await writeLog(env,'Admin','Rolle zugewiesen',player.name+' → '+roleName+' '+prefix);return json({ok:true});
      }
      if (path === '/api/admin/roles/remove' && req.method === 'POST') {
        if(!auth(req))return json({error:'Nicht autorisiert.'},401);const b=await req.json(),name=clean(b.name,24);if(!name)return bad('Spielername fehlt.');await env.DB.prepare('DELETE FROM role_assignments WHERE name=? COLLATE NOCASE').bind(name).run();await writeLog(env,'Admin','Rolle entfernt',name);return json({ok:true});
      }
      if (path === '/api/admin/data' && req.method === 'GET') {
        if(!auth(req)) return json({error:'Nicht autorisiert.'},401);
        const [i,c,r,s,n,e,no,pm,apps,m]=await Promise.all([
          env.DB.prepare('SELECT * FROM ideas ORDER BY id DESC LIMIT 300').all(), env.DB.prepare('SELECT * FROM chat ORDER BY id DESC LIMIT 300').all(),
          env.DB.prepare('SELECT * FROM reports ORDER BY id DESC LIMIT 300').all(), env.DB.prepare('SELECT * FROM support ORDER BY id DESC LIMIT 300').all(),
          env.DB.prepare('SELECT * FROM news ORDER BY id DESC LIMIT 100').all(), env.DB.prepare('SELECT * FROM events ORDER BY event_at ASC LIMIT 100').all(), env.DB.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT 100').all(), env.DB.prepare('SELECT * FROM private_messages ORDER BY id DESC LIMIT 300').all(), env.DB.prepare('SELECT * FROM sup_applications ORDER BY id DESC LIMIT 200').all(), env.DB.prepare('SELECT * FROM maintenance WHERE id=1').first()
        ]);
        return json({ideas:i.results,messages:c.results,reports:r.results,support:s.results,news:n.results,events:e.results,notifications:no.results,privateMessages:pm.results,applications:apps.results,maintenance:m||null});
      }
      if (path === '/api/admin/clear-chat' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); await env.DB.prepare('DELETE FROM chat').run(); return json({ok:true}); }
      if (path === '/api/admin/delete-chat-message' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); const id=Number(b.id); if(!id) return bad('Nachrichten-ID fehlt.'); await env.DB.prepare('DELETE FROM chat WHERE id=?').bind(id).run(); return json({ok:true}); }
      if (path === '/api/admin/delete-idea' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('DELETE FROM ideas WHERE id=?').bind(Number(b.id)).run(); return json({ok:true}); }
      if (path === '/api/admin/delete-report' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('DELETE FROM reports WHERE id=?').bind(Number(b.id)).run(); return json({ok:true}); }
      if (path === '/api/admin/delete-support' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('DELETE FROM support WHERE id=?').bind(Number(b.id)).run(); return json({ok:true}); }
      if (path === '/api/admin/news' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); const t=clean(b.title,120),c=clean(b.content,1500); if(!t||!c)return bad('Titel und Inhalt fehlen.'); await env.DB.prepare('INSERT INTO news(title,content,created_at) VALUES(?,?,?)').bind(t,c,new Date().toISOString()).run(); await writeLog(env,'Admin','News veröffentlicht',t); return json({ok:true}); }
      if (path === '/api/admin/event' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); const t=clean(b.title,120),d=clean(b.description,1000),at=clean(b.event_at,60); if(!t||!at)return bad('Titel und Termin fehlen.'); await env.DB.prepare('INSERT INTO events(title,description,event_at,created_at) VALUES(?,?,?,?)').bind(t,d,at,new Date().toISOString()).run(); await writeLog(env,'Admin','Event erstellt',t+' · '+at); return json({ok:true}); }
      if (path === '/api/admin/notification' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); const t=clean(b.title,120),m=clean(b.message,1000); if(!t||!m)return bad('Titel und Nachricht fehlen.'); await env.DB.prepare('INSERT INTO notifications(title,message,created_at) VALUES(?,?,?)').bind(t,m,new Date().toISOString()).run(); await writeLog(env,'Admin','Benachrichtigung veröffentlicht',t); return json({ok:true}); }
      if (path === '/api/admin/delete-news' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('DELETE FROM news WHERE id=?').bind(Number(b.id)).run(); return json({ok:true}); }
      if (path === '/api/admin/delete-event' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('DELETE FROM events WHERE id=?').bind(Number(b.id)).run(); return json({ok:true}); }
      if (path === '/api/admin/delete-notification' && req.method === 'POST') { if(!auth(req)) return json({error:'Nicht autorisiert.'},401); const b=await req.json(); await env.DB.prepare('DELETE FROM notifications WHERE id=?').bind(Number(b.id)).run(); return json({ok:true}); }
      if (path === '/api/clans' && req.method === 'GET') {
        const owner=await nameByToken(env,u.searchParams.get('token'));
        const clans=(await env.DB.prepare(`SELECT c.id,c.name,c.tag,c.description,c.leader,c.created_at,(SELECT COUNT(*) FROM clan_members m WHERE m.clan_id=c.id) AS member_count FROM clans c ORDER BY c.id DESC`).all()).results;
        let myClan=null,invites=[];
        if(owner){const membership=await env.DB.prepare('SELECT clan_id,role FROM clan_members WHERE name=? COLLATE NOCASE').bind(owner.name).first();if(membership){const c=await env.DB.prepare('SELECT * FROM clans WHERE id=?').bind(membership.clan_id).first();if(c){const members=(await env.DB.prepare("SELECT name,role,joined_at FROM clan_members WHERE clan_id=? ORDER BY CASE role WHEN 'leader' THEN 0 ELSE 1 END, name COLLATE NOCASE").bind(c.id).all()).results;myClan={...c,member_count:members.length,members,isLeader:membership.role==='leader'};}} invites=(await env.DB.prepare('SELECT i.id,i.clan_id,i.inviter,c.name,c.tag,c.leader FROM clan_invites i JOIN clans c ON c.id=i.clan_id WHERE i.invitee=? COLLATE NOCASE ORDER BY i.id DESC').bind(owner.name).all()).results;}
        return json({clans,myClan,invites});
      }
      if (path === '/api/clans/create' && req.method === 'POST') {
        const b=await req.json(),owner=await nameByToken(env,b.token),name=clean(b.name,24),tag=clean(b.tag,6).toUpperCase(),description=clean(b.description,240);
        if(!owner)return json({error:'Bitte zuerst deinen festen Namen festlegen.'},401);
        if(!/^[\p{L}0-9 _-]{3,24}$/u.test(name))return bad('Clanname: 3–24 Zeichen, nur Buchstaben, Zahlen, Leerzeichen, _ und - .');
        if(!/^[A-Z0-9]{2,6}$/.test(tag))return bad('Clan-Tag muss 2–6 Zeichen haben (Buchstaben/Zahlen).');
        if(await env.DB.prepare('SELECT id FROM clan_members WHERE name=? COLLATE NOCASE').bind(owner.name).first())return bad('Du bist bereits in einem Clan.');
        try{const r=await env.DB.prepare('INSERT INTO clans(name,tag,description,leader,created_at) VALUES(?,?,?,?,?)').bind(name,tag,description,owner.name,new Date().toISOString()).run();await env.DB.prepare("INSERT INTO clan_members(clan_id,name,role,joined_at) VALUES(?,?,'leader',?)").bind(r.meta.last_row_id,owner.name,new Date().toISOString()).run();return json({ok:true,id:r.meta.last_row_id});}catch(e){return bad('Clanname oder Tag ist bereits vergeben.');}
      }
      if (path === '/api/clans/join' && req.method === 'POST') {
        const b=await req.json(),owner=await nameByToken(env,b.token),id=Number(b.clanId);if(!owner)return json({error:'Bitte zuerst deinen festen Namen festlegen.'},401);if(!id)return bad('Clan nicht gefunden.');if(await env.DB.prepare('SELECT id FROM clan_members WHERE name=? COLLATE NOCASE').bind(owner.name).first())return bad('Du bist bereits in einem Clan.');const c=await env.DB.prepare('SELECT id FROM clans WHERE id=?').bind(id).first();if(!c)return bad('Dieser Clan existiert nicht.');try{await env.DB.prepare("INSERT INTO clan_members(clan_id,name,role,joined_at) VALUES(?,?,'member',?)").bind(id,owner.name,new Date().toISOString()).run();await env.DB.prepare('DELETE FROM clan_invites WHERE invitee=? COLLATE NOCASE').bind(owner.name).run();return json({ok:true});}catch{return bad('Beitritt fehlgeschlagen.');}
      }
      if (path === '/api/clans/leave' && req.method === 'POST') {
        const b=await req.json(),owner=await nameByToken(env,b.token);if(!owner)return json({error:'Nicht autorisiert.'},401);const m=await env.DB.prepare('SELECT clan_id,role FROM clan_members WHERE name=? COLLATE NOCASE').bind(owner.name).first();if(!m)return bad('Du bist in keinem Clan.');if(m.role==='leader')return bad('Als Clan-Leiter musst du den Clan löschen oder die Leitung übergeben.');await env.DB.prepare('DELETE FROM clan_members WHERE name=? COLLATE NOCASE').bind(owner.name).run();return json({ok:true});
      }
      if (path === '/api/clans/invite' && req.method === 'POST') {
        const b=await req.json(),owner=await nameByToken(env,b.token),target=clean(b.target,24);if(!owner)return json({error:'Nicht autorisiert.'},401);const m=await env.DB.prepare("SELECT clan_id FROM clan_members WHERE name=? COLLATE NOCASE AND role='leader'").bind(owner.name).first();if(!m)return json({error:'Nur Clan-Leiter können einladen.'},403);if(!target||target.toLowerCase()===owner.name.toLowerCase())return bad('Ungültiger Spielername.');const t=await env.DB.prepare('SELECT name FROM names WHERE name=? COLLATE NOCASE').bind(target).first();if(!t)return bad('Dieser Spieler hat noch keinen festen Namen registriert.');if(await env.DB.prepare('SELECT id FROM clan_members WHERE name=? COLLATE NOCASE').bind(t.name).first())return bad('Dieser Spieler ist bereits in einem Clan.');try{await env.DB.prepare('INSERT INTO clan_invites(clan_id,inviter,invitee,created_at) VALUES(?,?,?,?)').bind(m.clan_id,owner.name,t.name,new Date().toISOString()).run();return json({ok:true});}catch{return bad('Für diesen Spieler besteht bereits eine Einladung.');}
      }
      if (path === '/api/clans/invites/respond' && req.method === 'POST') {
        const b=await req.json(),owner=await nameByToken(env,b.token),id=Number(b.inviteId);if(!owner)return json({error:'Nicht autorisiert.'},401);const inv=await env.DB.prepare('SELECT * FROM clan_invites WHERE id=? AND invitee=? COLLATE NOCASE').bind(id,owner.name).first();if(!inv)return bad('Einladung nicht gefunden.');if(b.action==='accept'){if(await env.DB.prepare('SELECT id FROM clan_members WHERE name=? COLLATE NOCASE').bind(owner.name).first())return bad('Du bist bereits in einem Clan.');try{await env.DB.prepare("INSERT INTO clan_members(clan_id,name,role,joined_at) VALUES(?,?,'member',?)").bind(inv.clan_id,owner.name,new Date().toISOString()).run();}catch{return bad('Du konntest dem Clan nicht beitreten.');}}await env.DB.prepare('DELETE FROM clan_invites WHERE id=?').bind(id).run();return json({ok:true});
      }
      if (path === '/api/clans/kick' && req.method === 'POST') {
        const b=await req.json(),owner=await nameByToken(env,b.token),target=clean(b.target,24);if(!owner)return json({error:'Nicht autorisiert.'},401);const m=await env.DB.prepare("SELECT clan_id FROM clan_members WHERE name=? COLLATE NOCASE AND role='leader'").bind(owner.name).first();if(!m)return json({error:'Nur Clan-Leiter können Mitglieder entfernen.'},403);const victim=await env.DB.prepare("SELECT id FROM clan_members WHERE clan_id=? AND name=? COLLATE NOCASE AND role!='leader'").bind(m.clan_id,target).first();if(!victim)return bad('Mitglied nicht gefunden oder es ist der Clan-Leiter.');await env.DB.prepare('DELETE FROM clan_members WHERE id=?').bind(victim.id).run();return json({ok:true});
      }
      if (path === '/api/clans/delete' && req.method === 'POST') {
        const b=await req.json(),owner=await nameByToken(env,b.token);if(!owner)return json({error:'Nicht autorisiert.'},401);const c=await env.DB.prepare("SELECT id FROM clans WHERE leader=? COLLATE NOCASE").bind(owner.name).first();if(!c)return json({error:'Nur der Clan-Leiter kann den Clan löschen.'},403);await env.DB.prepare('DELETE FROM clan_invites WHERE clan_id=?').bind(c.id).run();await env.DB.prepare('DELETE FROM clan_members WHERE clan_id=?').bind(c.id).run();await env.DB.prepare('DELETE FROM clans WHERE id=?').bind(c.id).run();return json({ok:true});
      }
      if (path === '/api/extras' && req.method === 'GET') {
        const [f,g,polls,ch,ev,cl]=await Promise.all([
          env.DB.prepare('SELECT * FROM forum_posts ORDER BY id DESC LIMIT 100').all(),
          env.DB.prepare('SELECT id,name,caption,created_at FROM gallery ORDER BY id DESC LIMIT 40').all(),
          env.DB.prepare('SELECT poll_key,choice,COUNT(*) AS votes FROM poll_votes GROUP BY poll_key,choice').all(),
          env.DB.prepare('SELECT id,version,title,content,created_at FROM changelog ORDER BY id DESC LIMIT 20').all(),
          env.DB.prepare('SELECT id,title,event_at FROM events WHERE event_at >= ? ORDER BY event_at ASC LIMIT 30').bind(new Date().toISOString()).all(),
          env.DB.prepare('SELECT COUNT(*) AS n FROM names').first()
        ]);
        const votes={}; for(const v of polls.results){(votes[v.poll_key]??={})[v.choice]=v.votes;}
        return json({forum:f.results,gallery:g.results,changelog:ch.results,events:ev.results,votes,registered:cl?.n||0});
      }
      if (path === '/api/forum' && req.method === 'POST') {
        const b=await req.json(), owner=await nameByToken(env,b.token), title=clean(b.title,100), body=clean(b.body,1200), category=clean(b.category,30)||'Allgemein';
        if(!owner) return json({error:'Bitte zuerst deinen festen Namen festlegen.'},401); if(!title||!body)return bad('Titel und Beitrag fehlen.');
        await env.DB.prepare('INSERT INTO forum_posts(name,title,body,category,created_at) VALUES(?,?,?,?,?)').bind(owner.name,title,body,category,new Date().toISOString()).run(); return json({ok:true});
      }
      if (path === '/api/gallery' && req.method === 'POST') {
        const b=await req.json(), owner=await nameByToken(env,b.token), caption=clean(b.caption,150), data=typeof b.image==='string'?b.image:'';
        if(!owner)return json({error:'Bitte zuerst deinen festen Namen festlegen.'},401); if(!data.startsWith('data:image/'))return bad('Bitte ein Bild auswählen.'); if(data.length>400000)return bad('Bild zu groß. Maximal etwa 300 KB.');
        await env.DB.prepare('INSERT INTO gallery(name,caption,image_data,created_at) VALUES(?,?,?,?)').bind(owner.name,caption,data,new Date().toISOString()).run(); return json({ok:true});
      }
      if (path === '/api/gallery/images' && req.method === 'GET') { const r=await env.DB.prepare('SELECT * FROM gallery ORDER BY id DESC LIMIT 40').all(); return json({gallery:r.results}); }
      if (path === '/api/presence' && req.method === 'POST') { const b=await req.json(),owner=await nameByToken(env,b.token); if(!owner)return json({error:'Nicht autorisiert.'},401); await env.DB.prepare('INSERT INTO online_presence(name,last_seen) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET last_seen=excluded.last_seen').bind(owner.name,new Date().toISOString()).run(); return json({ok:true}); }
      if (path === '/api/presence' && req.method === 'GET') { const cutoff=new Date(Date.now()-90000).toISOString(); const r=await env.DB.prepare('SELECT p.name,p.last_seen,ra.role_name,ra.prefix,ra.color_start,ra.color_end FROM online_presence p LEFT JOIN role_assignments ra ON lower(ra.name)=lower(p.name) WHERE p.last_seen>=? ORDER BY p.name COLLATE NOCASE').bind(cutoff).all(); return json({players:r.results}); }
      if (path === '/api/friend-requests' && req.method === 'POST') { const b=await req.json(),owner=await nameByToken(env,b.token),target=clean(b.target,24); if(!owner)return json({error:'Bitte zuerst deinen festen Namen festlegen.'},401); if(!target||target.toLowerCase()===owner.name.toLowerCase())return bad('Ungültiger Spielername.'); const exists=await env.DB.prepare('SELECT name FROM names WHERE lower(name)=lower(?)').bind(target).first(); if(!exists)return bad('Dieser Spieler hat noch keinen festen Namen registriert.'); if(await env.DB.prepare('SELECT id FROM friends WHERE name=? AND friend_name=? COLLATE NOCASE').bind(owner.name,exists.name).first())return bad('Ihr seid bereits befreundet.'); try{await env.DB.prepare('INSERT INTO friend_requests(sender,recipient,created_at) VALUES(?,?,?)').bind(owner.name,exists.name,new Date().toISOString()).run();return json({ok:true})}catch{return bad('Eine Anfrage zwischen euch besteht bereits.')}}
      if (path === '/api/friend-requests' && req.method === 'GET') { const owner=await nameByToken(env,u.searchParams.get('token')); if(!owner)return json({error:'Nicht autorisiert.'},401); const r=await env.DB.prepare('SELECT id,sender,created_at FROM friend_requests WHERE recipient=? COLLATE NOCASE ORDER BY id DESC').bind(owner.name).all(); return json({requests:r.results}); }
      if (path === '/api/friend-requests/respond' && req.method === 'POST') { const b=await req.json(),owner=await nameByToken(env,b.token),id=Number(b.requestId); if(!owner)return json({error:'Nicht autorisiert.'},401); const r=await env.DB.prepare('SELECT * FROM friend_requests WHERE id=? AND recipient=? COLLATE NOCASE').bind(id,owner.name).first(); if(!r)return bad('Anfrage nicht gefunden.'); if(b.action==='accept'){const now=new Date().toISOString(); try{await env.DB.prepare('INSERT INTO friends(name,friend_name,created_at) VALUES(?,?,?)').bind(owner.name,r.sender,now).run()}catch{} try{await env.DB.prepare('INSERT INTO friends(name,friend_name,created_at) VALUES(?,?,?)').bind(r.sender,owner.name,now).run()}catch{}} await env.DB.prepare('DELETE FROM friend_requests WHERE id=?').bind(id).run(); return json({ok:true}); }
      if (path === '/api/friends' && req.method === 'POST') {
        const b=await req.json(), owner=await nameByToken(env,b.token), target=clean(b.friend,24); if(!owner)return json({error:'Bitte zuerst deinen festen Namen festlegen.'},401); if(!target||target.toLowerCase()===owner.name.toLowerCase())return bad('Ungültiger Freundesname.');
        const exists=await env.DB.prepare('SELECT name FROM names WHERE lower(name)=lower(?)').bind(target).first(); if(!exists)return bad('Dieser Spieler hat noch keinen Namen registriert.');
        try{await env.DB.prepare('INSERT INTO friends(name,friend_name,created_at) VALUES(?,?,?)').bind(owner.name,exists.name,new Date().toISOString()).run();}catch{} return json({ok:true});
      }
      if (path === '/api/friends' && req.method === 'GET') { const owner=await nameByToken(env,u.searchParams.get('token')); if(!owner)return json({error:'Nicht autorisiert.'},401); const cutoff=new Date(Date.now()-90000).toISOString(); const r=await env.DB.prepare('SELECT f.friend_name,f.created_at,CASE WHEN p.last_seen>=? THEN 1 ELSE 0 END AS online FROM friends f LEFT JOIN online_presence p ON lower(p.name)=lower(f.friend_name) WHERE f.name=? ORDER BY f.id DESC').bind(cutoff,owner.name).all(); return json({friends:r.results}); }
      if (path === '/api/polls/vote' && req.method === 'POST') {
        const b=await req.json(), owner=await nameByToken(env,b.token), key=clean(b.pollKey,40), choice=clean(b.choice,50); if(!owner)return json({error:'Bitte zuerst deinen festen Namen festlegen.'},401); if(!key||!choice)return bad('Abstimmung und Antwort fehlen.');
        try{await env.DB.prepare('INSERT INTO poll_votes(poll_key,name,choice,created_at) VALUES(?,?,?,?)').bind(key,owner.name,choice,new Date().toISOString()).run();}catch{return bad('Du hast bei dieser Abstimmung bereits abgestimmt.');} return json({ok:true});
      }
      if (path === '/api/events/signup' && req.method === 'POST') {
        const b=await req.json(), owner=await nameByToken(env,b.token), id=Number(b.eventId); if(!owner)return json({error:'Bitte zuerst deinen festen Namen festlegen.'},401); if(!id)return bad('Event fehlt.');
        try{await env.DB.prepare('INSERT INTO event_signups(event_id,name,created_at) VALUES(?,?,?)').bind(id,owner.name,new Date().toISOString()).run();}catch{return bad('Du bist für dieses Event bereits angemeldet.');} return json({ok:true});
      }
      if (path === '/api/staff-schedule' && req.method === 'POST') return json({error:'Der Dienstplan ist nur im Admin-Dashboard verfügbar.'},403);
      if (path === '/api/admin/staff-schedule' && req.method === 'POST') { if(!auth(req))return json({error:'Nicht autorisiert.'},401); const b=await req.json(),name=clean(b.name,24),at=clean(b.availableAt,60),note=clean(b.note,200); if(!name||!at)return bad('Name und Zeitpunkt sind erforderlich.'); if(Number.isNaN(Date.parse(at)))return bad('Ungültiger Zeitpunkt. Bitte Datum und Uhrzeit erneut auswählen.'); await env.DB.prepare('INSERT INTO staff_schedule(name,available_at,note,created_at) VALUES(?,?,?,?)').bind(name,new Date(at).toISOString(),note,new Date().toISOString()).run(); await writeLog(env,'Admin','Dienstplan geändert',name+' · '+at); return json({ok:true}); }
      if (path === '/api/admin/staff-schedule/delete' && req.method === 'POST') { if(!auth(req))return json({error:'Nicht autorisiert.'},401); const b=await req.json(),id=Number(b.id); if(!Number.isInteger(id)||id<1)return bad('Ungültiger Eintrag.'); const r=await env.DB.prepare('DELETE FROM staff_schedule WHERE id=?').bind(id).run(); if(!r.meta?.changes)return json({error:'Eintrag nicht gefunden.'},404); await writeLog(env,'Admin','Dienstplan-Eintrag gelöscht','ID '+id); return json({ok:true}); }
      if (path === '/api/admin/logs' && req.method === 'GET') { if(!auth(req))return json({error:'Nicht autorisiert.'},401); const r=await env.DB.prepare('SELECT id,actor,action,details,created_at FROM audit_logs ORDER BY id DESC LIMIT 200').all(); return json({logs:r.results}); }
      if (path === '/api/admin/extras' && req.method === 'GET') { if(!auth(req))return json({error:'Nicht autorisiert.'},401); const [signups,schedule,users,posts]=await Promise.all([env.DB.prepare('SELECT * FROM event_signups ORDER BY id DESC LIMIT 300').all(),env.DB.prepare('SELECT * FROM staff_schedule ORDER BY available_at ASC LIMIT 200').all(),env.DB.prepare('SELECT name,created_at FROM names ORDER BY id DESC LIMIT 500').all(),env.DB.prepare('SELECT * FROM forum_posts ORDER BY id DESC LIMIT 200').all()]); return json({signups:signups.results,schedule:schedule.results,users:users.results,posts:posts.results}); }
      if (path.startsWith('/api/')) return json({error:'Nicht gefunden.'},404);
      if (env.ASSETS) return env.ASSETS.fetch(req);
      return new Response('LukSMP App', {headers:{'Content-Type':'text/plain'}});
    } catch(e) { return json({error:e?.message || 'Serverfehler'},500); }
  }
};
