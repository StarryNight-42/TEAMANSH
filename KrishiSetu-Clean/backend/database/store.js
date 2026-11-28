const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const file = process.env.SQLITE_FILE || path.join(__dirname, 'krishisetu.sqlite');
const sql = new DatabaseSync(file);
sql.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
sql.exec(fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8'));
const tables = ['users','products','orders','messages','tickets','demands'];
const quote = s => '"'+s.replaceAll('"','""')+'"';
const columns = Object.fromEntries(tables.map(t=>[t,sql.prepare(`PRAGMA table_info(${t})`).all().map(c=>c.name)]));
const db = {};
function reload(){for(const t of tables) db[t]=sql.prepare(`SELECT * FROM ${t}`).all().map(r=>({...r}));}
reload();
// Existing route handlers use arrays. Commit their changes as one SQLite transaction.
// Intended for a single Node process; no concurrent external database writers.
function save(afterWrite){
  sql.exec('BEGIN IMMEDIATE');
  try {
    for(const t of [...tables].reverse()) sql.exec(`DELETE FROM ${t}`);
    for(const t of tables){
      const c=columns[t];
      const stmt=sql.prepare(`INSERT INTO ${t} (${c.map(quote).join(',')}) VALUES (${c.map(()=>'?').join(',')})`);
      for(const row of db[t]) stmt.run(...c.map(k=>row[k]??null));
    }
    if(afterWrite) afterWrite();
    sql.exec('COMMIT');
  } catch(e){sql.exec('ROLLBACK');reload();throw e;}
}
const legacy=process.env.DATA_FILE||path.join(__dirname,'data.json');
if(fs.existsSync(legacy)&&!sql.prepare("SELECT value FROM metadata WHERE key='legacy_import'").get()&&tables.every(t=>db[t].length===0)){
  const old=JSON.parse(fs.readFileSync(legacy,'utf8'));
  for(const t of tables) db[t]=old[t]||[];
  save();
  sql.prepare('INSERT INTO metadata VALUES (?,?)').run('legacy_import',new Date().toISOString());
}
module.exports={db,save,sql};
