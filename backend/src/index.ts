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

    // 优化查询，限制结果数量并选择必要的字段
    const poems = await prisma.poem.findMany({
        where: whereCondition,
        select: {
            id: true,
            title: true,
            author: true,
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
        
    res.json({ 
        sentence: sentence,
        title: randomPoem.title,
        author: randomPoem.author
    });
});

// API: 开始游戏 - 验证关键字并返回AI首句
app.post('/api/v1/game/start', async (req, res) => {
    const { keyword } = req.body;

    if (!keyword || keyword.length !== 1) {
        return res.status(400).json({ error: '请提供一个有效的汉字作为关键字' });
    }

    // 查找包含该关键字的诗句
    const poems = await prisma.poem.findMany({
        where: {
            content: {
                contains: keyword
            }
        },
        select: {
            id: true,
            title: true,
            author: true,
            content: true
        },
        take: 500
    });

    if (poems.length === 0) {
        return res.status(404).json({ error: '诗词库中没有包含该字的诗句，请换一个字试试' });
    }

    // 随机选择一首诗作为AI的首句
    const randomPoem = poems[Math.floor(Math.random() * poems.length)];
    const sentences = randomPoem.content
        .split(/[，。！？；]/)
        .filter(s => s.includes(keyword) && s.length > 0);
    
    const sentence = sentences.length > 0 
        ? sentences[0] 
        : randomPoem.content.split(/[，。！？；]/)[0] || randomPoem.content;

    res.json({
        success: true,
        keyword: keyword,
        firstSentence: {
            content: sentence,
            title: randomPoem.title,
            author: randomPoem.author
        }
    });
});

// API: 获取提示
app.post('/api/v1/game/hint', async (req, res) => {
    const { keyword, hintLevel } = req.body;

    if (!keyword) {
        return res.status(400).json({ error: '缺少关键字参数' });
    }

    // 查找一首包含关键字的诗
    const poem = await prisma.poem.findFirst({
        where: {
            content: {
                contains: keyword
            }
        },
        select: {
            title: true,
            author: true,
            content: true
        }
    });

    if (!poem) {
        return res.status(404).json({ error: '找不到提示' });
    }

    // 根据提示级别返回不同的提示
    let hint = '';
    const sentences = poem.content.split(/[，。！？；]/).filter(s => s.includes(keyword) && s.length > 0);
    const targetSentence = sentences[0] || '';

    switch (hintLevel) {
        case 1:
            hint = `提示：这句诗的作者是${poem.author}`;
            break;
        case 2:
            hint = `提示：这句诗出自《${poem.title}》`;
            break;
        case 3:
            // 显示诗句的第一个字
            hint = `提示：诗句开头是"${targetSentence.charAt(0)}"字`;
            break;
        default:
            hint = '继续加油！';
    }

    res.json({ hint, sentence: targetSentence });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});