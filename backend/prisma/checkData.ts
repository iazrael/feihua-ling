import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 获取诗歌总数
  const count = await prisma.poem.count();
  console.log(`Total poems in database: ${count}`);
  
  // 获取前5首诗歌
  const poems = await prisma.poem.findMany({
    take: 5,
    orderBy: {
      id: 'asc'
    }
  });
  
  console.log('\nFirst 5 poems:');
  poems.forEach(poem => {
    console.log(`ID: ${poem.id}`);
    console.log(`Title: ${poem.title}`);
    console.log(`Author: ${poem.author}`);
    console.log(`Content: ${poem.content}`);
    console.log('---');
  });
  
  // 获取特定作者的诗歌数量
  const authorCount = await prisma.poem.groupBy({
    by: ['author'],
    _count: {
      author: true
    },
    orderBy: {
      _count: {
        author: 'desc'
      }
    },
    take: 5
  });
  
  console.log('\nTop 5 authors by poem count:');
  authorCount.forEach(item => {
    console.log(`${item.author}: ${item._count.author} poems`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });