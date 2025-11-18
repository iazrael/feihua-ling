import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const poems = [
  {
    author: '李白',
    title: '静夜思',
    paragraphs: ['床前明月光，', '疑是地上霜。', '举头望明月，', '低头思故乡。'],
  },
  {
    author: '杜甫',
    title: '春望',
    paragraphs: ['国破山河在，', '城春草木深。', '感时花溅泪，', '恨别鸟惊心。', '烽火连三月，', '家书抵万金。', '白头搔更短，', '浑欲不胜簪。'],
  },
  {
    author: '王之涣',
    title: '登鹳雀楼',
    paragraphs: ['白日依山尽，', '黄河入海流。', '欲穷千里目，', '更上一层楼。'],
  },
  {
    author: '孟浩然',
    title: '春晓',
    paragraphs: ['春眠不觉晓，', '处处闻啼鸟。', '夜来风雨声，', '花落知多少。'],
  },
];

async function main() {
  console.log(`Start seeding ...`);
  await prisma.poem.deleteMany({}); // Clear existing data

  const formattedPoems = poems.map(p => ({
    title: p.title,
    author: p.author,
    content: p.paragraphs.join(''),
  }));

  await prisma.poem.createMany({
    data: formattedPoems,
  });

  console.log(`Seeding finished.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
