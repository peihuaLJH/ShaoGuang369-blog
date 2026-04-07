const { MongoClient } = require('mongodb');

const atlasPassword = process.env.ATLAS_PASSWORD;
const localUri = process.env.LOCAL_URI || 'mongodb://127.0.0.1:27017/blog';

if (!atlasPassword && !process.env.ATLAS_URI) {
  throw new Error('缺少 ATLAS_PASSWORD 或 ATLAS_URI 环境变量');
}

const uri = process.env.ATLAS_URI ||
  `mongodb://20232b5166_db_user:${encodeURIComponent(atlasPassword)}@ac-juwlebk-shard-00-00.xrvgwgt.mongodb.net:27017,ac-juwlebk-shard-00-01.xrvgwgt.mongodb.net:27017,ac-juwlebk-shard-00-02.xrvgwgt.mongodb.net:27017/blog?tls=true&authSource=admin&replicaSet=atlas-eas2al-shard-0&retryWrites=true&w=majority`;

const cols = ['stats','comments','posts','messages','users','visitors','categories','friendlinks','sitesettings'];

async function run() {
  const localClient = new MongoClient(localUri, {
    serverSelectionTimeoutMS: 10000
  });
  const atlasClient = new MongoClient(uri, {
    family: 4,
    serverSelectionTimeoutMS: 20000,
    tls: true
  });

  try {
    await localClient.connect();
    await atlasClient.connect();
    console.log('本地与 Atlas 连接成功');

    const sourceDb = localClient.db('blog');
    const targetDb = atlasClient.db('blog');

    for (const c of cols) {
      const docs = await sourceDb.collection(c).find({}).toArray();

      await targetDb.collection(c).deleteMany({});

      if (!docs.length) {
        console.log('已清空空集合: ' + c);
        continue;
      }

      const result = await targetDb.collection(c).insertMany(docs, { ordered: true });
      console.log('已导入: ' + c + ' (' + result.insertedCount + ' 条)');
    }
  } catch(e) {
    console.error('错误:', e.message);
    process.exitCode = 1;
  } finally {
    await Promise.allSettled([
      localClient.close(),
      atlasClient.close()
    ]);
  }
}
run();
