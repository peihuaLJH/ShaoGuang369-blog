const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = 'mongodb://20232b5166_db_user:thjxJd2qPqvqSuT7@ac-juwlebk-shard-00-00.xrvgwgt.mongodb.net:27017,ac-juwlebk-shard-00-01.xrvgwgt.mongodb.net:27017,ac-juwlebk-shard-00-02.xrvgwgt.mongodb.net:27017/blog?ssl=true&replicaSet=atlas-juwlebk-shard-0&authSource=admin&retryWrites=true';

const dumpDir = 'C:\\Users\\ljh20\\Desktop\\blog-dump';
const cols = ['stats','comments','posts','messages','users','visitors','categories','friendlinks','sitesettings'];

async function run() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
  try {
    await client.connect();
    console.log('连接成功');
    const db = client.db('blog');
    for (const c of cols) {
      const file = path.join(dumpDir, c + '.json');
      const raw = fs.readFileSync(file, 'utf8').trim();
      if (!raw || raw === '[]') { console.log('跳过(空): ' + c); continue; }
      const docs = JSON.parse(raw);
      if (!docs.length) { console.log('跳过(空): ' + c); continue; }
      await db.collection(c).deleteMany({});
      const r = await db.collection(c).insertMany(docs);
      console.log('已导入: ' + c + ' (' + r.insertedCount + ' 条)');
    }
  } catch(e) {
    console.error('错误:', e.message);
  } finally {
    await client.close();
  }
}
run();
