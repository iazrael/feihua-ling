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
    const poems = await prisma.poem.findMany();
    if (poems.length === 0) {
        return res.status(404).json({ error: '诗词库为空' });
    }
    const randomPoem = poems[Math.floor(Math.random() * poems.length)];
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

    if (usedPoems.includes(sentence)) {
        return res.json({ valid: false, message: '这句诗已经用过了' });
    }

    const poem = await prisma.poem.findFirst({
        where: { content: { contains: sentence } },
    });

    if (poem) {
        res.json({ valid: true, message: '验证成功' });
    } else {
        res.json({ valid: false, message: '诗词库中没有找到这句诗' });
    }
});

// API: AI 生成诗句 (模拟)
app.post('/api/v1/game/ai-turn', async (req, res) => {
    const { char, usedPoems } = req.body;

    const poems = await prisma.poem.findMany({
        where: {
            content: {
                contains: char,
            },
        },
    });

    const availablePoems = poems.filter(p => !usedPoems.some(up => p.content.includes(up)));

    if (availablePoems.length === 0) {
        return res.status(404).json({ error: 'AI也想不出来了' });
    }

    const randomPoem = availablePoems[Math.floor(Math.random() * availablePoems.length)];
    // 简单返回包含令字的句子部分
    const sentences = randomPoem.content.split('，').filter(s => s.includes(char));
    res.json({ sentence: sentences[0] || randomPoem.content });
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
