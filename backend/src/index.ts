import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API: 获取一个随机的令字
app.get('/api/v1/game/random-char', async (req, res) => {
    // 优化查询，只获取必要的数据
    const poems = await prisma.poem.findMany({
        select: {
            content: true
        },
        take: 1000 // 限制获取的诗歌数量以提高性能
    });
    
    if (poems.length === 0) {
        return res.status(404).json({ error: '诗词库为空' });
    }
    
    // 随机选择一首诗
    const randomPoem = poems[Math.floor(Math.random() * poems.length)];
    // 从诗的内容中随机选择一个字符
    const randomChar = randomPoem.content[Math.floor(Math.random() * randomPoem.content.length)];
    res.json({ char: randomChar });
});

// API: 验证用户诗句
app.post('/api/v1/game/verify', async (req, res) => {
    const { sentence, char, usedPoems } = req.body;

    if (!sentence || !char) {
        return res.status(400).json({ error: '缺少参数' });
    }

    if (!sentence.includes(char)) {
        return res.json({ valid: false, message: '诗句中不包含令字' });
    }

    if (usedPoems && usedPoems.includes(sentence)) {
        return res.json({ valid: false, message: '这句诗已经用过了' });
    }

    // 使用更精确的查询来验证诗句
    const poem = await prisma.poem.findFirst({
        where: { 
            content: { 
                contains: sentence
            }
        },
        select: {
            id: true,
            title: true,
            author: true
        }
    });

    if (poem) {
        res.json({ 
            valid: true, 
            message: '验证成功',
            poem: {
                id: poem.id,
                title: poem.title,
                author: poem.author
            }
        });
    } else {
        res.json({ valid: false, message: '诗词库中没有找到这句诗' });
    }
});

// API: AI 生成诗句
app.post('/api/v1/game/ai-turn', async (req, res) => {
    const { char, usedPoems } = req.body;

    // 构建查询条件
    const whereCondition: any = {
        content: {
            contains: char,
        }
    };

    // 如果有已使用的诗句，排除它们
    if (usedPoems && usedPoems.length > 0) {
        whereCondition.NOT = usedPoems.map((sentence: string) => ({
            content: {
                contains: sentence
            }
        }));
    }

    // 优化查询，限制结果数量并只选择必要的字段
    const poems = await prisma.poem.findMany({
        where: whereCondition,
        select: {
            content: true
        },
        take: 500 // 限制结果数量以提高性能
    });

    if (poems.length === 0) {
        return res.status(404).json({ error: 'AI也想不出来了' });
    }

    // 随机选择一首诗
    const randomPoem = poems[Math.floor(Math.random() * poems.length)];
    
    // 从包含令字的诗句中提取句子
    const sentences = randomPoem.content
        .split(/[，。！？；]/) // 使用多种标点符号分割
        .filter(s => s.includes(char) && s.length > 0); // 只保留包含令字且非空的句子
    
    // 如果没有找到包含令字的句子，返回整首诗的第一句
    const sentence = sentences.length > 0 
        ? sentences[0] 
        : randomPoem.content.split(/[，。！？；]/)[0] || randomPoem.content;
        
    res.json({ sentence: sentence });
});

// API: 搜索诗句（新增）
app.post('/api/v1/game/search-poems', async (req, res) => {
    const { char, limit = 20 } = req.body;

    if (!char) {
        return res.status(400).json({ error: '缺少令字参数' });
    }

    // 搜索包含指定字符的诗句
    const poems = await prisma.poem.findMany({
        where: {
            content: {
                contains: char
            }
        },
        select: {
            id: true,
            title: true,
            author: true,
            content: true
        },
        take: Math.min(limit, 100) // 限制返回数量
    });

    res.json({ poems });
});

// API: 获取诗人作品（新增）
app.get('/api/v1/poets/:author/poems', async (req, res) => {
    const { author } = req.params;
    const { limit = 20 } = req.query;

    if (!author) {
        return res.status(400).json({ error: '缺少诗人参数' });
    }

    // 搜索指定诗人的作品
    const poems = await prisma.poem.findMany({
        where: {
            author: {
                contains: author
            }
        },
        select: {
            id: true,
            title: true,
            author: true,
            content: true
        },
        take: Math.min(Number(limit), 100)
    });

    res.json({ poems });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});