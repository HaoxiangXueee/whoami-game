# 剧本生成脚本

## 文件结构

```
scripts/
├── README.md                    # 本文件
├── generate-scenario.ts         # 剧本生成主脚本
├── batch-generate.ts           # 批量生成脚本
└── emperors/                   # 皇帝输入配置目录
    ├── qin_shihuang.json
    ├── han_wudi.json
    └── ...
```

## 使用方法

### 1. 单个剧本生成

```bash
npx ts-node scripts/generate-scenario.ts <emperor-id>
```

示例：
```bash
npx ts-node scripts/generate-scenario.ts qin_shihuang
```

### 2. 批量生成

```bash
npx ts-node scripts/batch-generate.ts
```

## 皇帝输入配置格式

```json
{
  "id": "qin_shihuang",
  "name": "秦始皇",
  "title": "始皇帝",
  "dynasty": "秦",
  "time": "公元前221年",
  "location": "咸阳宫",
  "difficulty": "medium",
  "scenarioType": "founding",
  "keyEvents": ["统一六国", "称帝建制", "焚书坑儒"],
  "personality": "雄才大略，刚愎自用，追求永生",
  "crisis": "六国遗民反抗，求仙问道耗竭国力",
  "npcTypes": ["loyal", "schemer", "eunuch", "general"]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | string | 唯一标识符，用于文件名 |
| name | string | 皇帝姓名 |
| title | string | 称号/庙号 |
| dynasty | string | 朝代名 |
| time | string | 时间描述 |
| location | string | 地点 |
| difficulty | "easy" \| "medium" \| "hard" | 难度 |
| scenarioType | string | 场景类型 |
| keyEvents | string[] | 关键事件 |
| personality | string | 性格描述 |
| crisis | string | 当前危机 |
| npcTypes | string[] | NPC类型列表 |

### scenarioType 枚举

- `founding`: 开国场景（回合较多，资源充足）
- `expansion`: 扩张场景（回合适中，处于上升期）
- `crisis`: 危机场景（回合较少，局势紧张）
- `decline`: 衰落场景（回合很少，王朝末期）
- `survival`: 生存场景（回合适中，四面受敌）

### npcTypes 枚举

- `loyal`: 忠臣
- `schemer`: 权臣/谋士
- `eunuch`: 宦官
- `general`: 武将
- `scholar`: 文臣
- `hostile`: 敌对势力

## 输出

生成的剧本将保存在 `public/scenarios/` 目录下：

- `{emperor-id}.json`: 剧本文件
- `index.json`: 索引文件（自动生成）
