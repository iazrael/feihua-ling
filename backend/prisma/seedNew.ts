import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 在ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// 定义诗歌数据类型
interface PoemData {
  title: string;
  dynasty: string;
  author: string;
  content: string;
}

// 读取CSV文件并解析数据
function parseCSV(filePath: string): PoemData[] {
  const data = fs.readFileSync(filePath, 'utf8');
  const lines = data.split('\n');
  const result: PoemData[] = [];
  
  // 跳过标题行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 简单的CSV解析，处理引号包围的字段
    const fields = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
    if (fields.length >= 4) {
      // 确保字段存在再访问
      const field0 = fields[0] || '""';
      const field1 = fields[1] || '""';
      const field2 = fields[2] || '""';
      const field3 = fields[3] || '""';
      
      result.push({
        title: field0.replace(/^"|"$/g, '').trim(),
        dynasty: field1.replace(/^"|"$/g, '').trim(),
        author: field2.replace(/^"|"$/g, '').trim(),
        content: field3.replace(/^"|"$/g, '').trim()
      });
    }
  }
  
  return result;
}

async function main() {
  console.log(`Start seeding ...`);
  
  // 清空现有数据
  await prisma.poem.deleteMany({});
  
  // 解析CSV数据
  const csvPath = path.join(__dirname, '唐.csv');
  const csvData = parseCSV(csvPath);
  
  console.log(`Parsed ${csvData.length} poems from CSV`);
  
  // 分批插入数据，避免一次性插入太多数据
  const batchSize = 100;
  for (let i = 0; i < csvData.length; i += batchSize) {
    const batch = csvData.slice(i, i + batchSize);
    const formattedPoems = batch.map(p => ({
      title: p.title,
      author: p.author,
      content: p.content
    }));
    
    await prisma.poem.createMany({
      data: formattedPoems
    });
    
    console.log(`Seeded batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(csvData.length/batchSize)}`);
  }
  
  console.log(`Seeding finished. Total poems: ${csvData.length}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });