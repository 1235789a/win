import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'data', 'intel.db');
console.log('📁 数据库路径:', dbPath);

const db = new Database(dbPath);

console.log('\n📊 数据库表结构:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables);

console.log('\n📈 opportunities 表记录数:');
const count = db.prepare('SELECT COUNT(*) as cnt FROM opportunities').get();
console.log(count);

console.log('\n📋 前20条opportunities记录:');
const opps = db.prepare('SELECT * FROM opportunities ORDER BY score DESC LIMIT 20').all();
console.log(JSON.stringify(opps, null, 2));

db.close();
