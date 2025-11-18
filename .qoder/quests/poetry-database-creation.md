# 所有朝代诗词数据库建设方案

## 1. 背景与目标

### 1.1 当前状况
项目当前仅包含唐代诗词数据，存储在 SQLite 数据库的 `Poem` 表中。表结构包含以下字段：
- `id`: 整型，主键，自增
- `title`: 文本，诗词标题
- `author`: 文本，作者名
- `content`: 文本，诗词全文

### 1.2 需求说明
为丰富诗词库内容，需扩展至包含中国各个历史朝代的诗词作品，全部使用简体中文存储。

### 1.3 建设目标
- 构建覆盖中国主要历史朝代的诗词数据库
- 保持现有数据结构兼容性
- 支持按朝代分类检索功能
- 确保数据质量与准确性

## 2. 数据模型设计

### 2.1 扩展数据模型
为支持朝代信息，需对现有数据模型进行扩展：

```prisma
model Poem {
  id      Int     @id @default(autoincrement())
  title   String
  author  String
  content String
  dynasty String? // 新增字段，可为空以保持向后兼容
}
```

### 2.2 朝代表模型（可选）
为进一步规范化数据，可考虑新增朝代表：

```prisma
model Dynasty {
  id   Int    @id @default(autoincrement())
  name String // 朝代名称，如"唐代"、"宋代"
  poems Poem[]
}
```

然后将 `Poem` 模型中的 `dynasty` 字段修改为外键关联：

```prisma
model Poem {
  id       Int     @id @default(autoincrement())
  title    String
  author   String
  content  String
  dynastyId Int?
  dynasty   Dynasty? @relation(fields: [dynastyId], references: [id])
}
```

## 3. 数据源调研与获取

### 3.1 公开数据源
根据调研，存在多个可获取的公开古诗词数据源：
1. chinese-poetry 项目：包含唐宋时期近14000位诗人、30余万首诗词作品
2. 其他古诗词数据库：包含唐诗、宋诗、宋词等，数据量达数十万首

### 3.2 数据格式
大多数公开数据源提供以下格式：
- CSV 文件
- JSON 文件
- SQL 文件

### 3.3 数据字段
典型的数据字段包括：
- 标题 (title)
- 作者 (author)
- 朝代 (dynasty)
- 内容 (content)
- 作者简介 (author_bio，可选)
- 诗词注释 (notes，可选)

## 4. 数据处理与导入方案

### 4.1 数据预处理
1. 统一字符编码为 UTF-8
2. 转换为简体中文（如需要）
3. 清洗特殊字符和格式
4. 验证数据完整性

### 4.2 导入脚本设计
基于现有 `seedNew.ts` 脚本进行扩展：

```typescript
interface PoemData {
  title: string;
  dynasty: string;
  author: string;
  content: string;
}

// 解析CSV文件函数
function parseCSV(filePath: string): PoemData[] {
  // 实现CSV解析逻辑
  // 返回包含朝代信息的PoemData数组
}

async function main() {
  // 清空现有数据（可选）
  // await prisma.poem.deleteMany({});
  
  // 解析多个朝代的CSV文件
  const dynasties = ['唐', '宋', '元', '明', '清']; // 可扩展
  for (const dynasty of dynasties) {
    const csvPath = path.join(__dirname, `${dynasty}.csv`);
    if (fs.existsSync(csvPath)) {
      const csvData = parseCSV(csvPath);
      // 分批插入数据
      // ...
    }
  }
}
```

### 4.3 批量导入策略
1. 按朝代分别处理数据文件
2. 分批插入数据库（避免内存溢出）
3. 添加错误处理机制
4. 记录导入日志

## 5. 数据库迁移方案

### 5.1 迁移脚本
创建新的 Prisma 迁移脚本，添加 `dynasty` 字段：

```sql
ALTER TABLE "Poem" ADD COLUMN "dynasty" TEXT;
```

### 5.2 向后兼容性
新字段设置为可空，确保现有应用逻辑不受影响。

## 6. API 接口扩展

### 6.1 查询接口扩展
在现有 API 基础上扩展按朝代查询功能：

1. 按朝代获取诗词列表
```http
GET /api/v1/poems?dynasty=唐代
```

2. 获取所有朝代列表
```http
GET /api/v1/dynasties
```

### 6.2 现有接口兼容性
保持现有接口不变，新增朝代信息作为可选字段返回。

## 7. 部署与维护

### 7.1 数据初始化
扩展部署准备脚本 `deploy-prepare.sh`，支持导入多朝代数据：

```bash
# 导入多个朝代的诗词数据
for dynasty in 唐 宋 元 明 清; do
  if [ -f "backend/prisma/${dynasty}.csv" ]; then
    echo "导入${dynasty}诗词数据..."
    # 执行导入命令
  fi
done
```

### 7.2 数据更新机制
建立定期更新机制，同步开源数据源的更新内容。

## 8. 风险与应对措施

### 8.1 数据质量问题
- 风险：开源数据可能存在错误或不一致
- 应对：建立数据验证机制，人工抽查校验

### 8.2 版权问题
- 风险：部分数据可能存在版权问题
- 应对：优先使用明确声明开源的数据源

### 8.3 性能问题
- 风险：数据量增加可能影响查询性能
- 应对：建立适当的数据库索引，优化查询语句- 风险：数据量增加可能影响查询性能
