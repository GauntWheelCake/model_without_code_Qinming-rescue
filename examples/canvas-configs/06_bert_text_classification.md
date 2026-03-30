# BERT 文本分类

## ✅ 测试环境

- torch: `2.9.1+cu128`
- torchvision: `0.24.1+cu128`
- torchaudio: `2.9.1+cu128`

## 📝 任务描述

使用 BERT (Bidirectional Encoder Representations from Transformers) 进行文本分类任务，如情感分析、新闻分类等。

## 🎨 画布配置

### 节点列表

共 2 个节点：
1. **BERT** 编码器
2. **Linear** 分类层

### 节点连接

```
BERT → Linear
```

### JSON 配置

```json
{
  "nodes": [
    {
      "id": "node_bert_001",
      "name": "BERT",
      "type": "bert",
      "icon": "Document",
      "description": "双向编码器表示变换器",
      "category": "models",
      "position": { "x": 300, "y": 300 },
      "creationId": 1,
      "params": [
        {
          "key": "model_type",
          "label": "模型类型",
          "type": "select",
          "value": "base",
          "options": [
            { "label": "BERT-Base", "value": "base" },
            { "label": "BERT-Large", "value": "large" }
          ]
        },
        {
          "key": "pretrained",
          "label": "预训练权重",
          "type": "boolean",
          "value": true
        },
        {
          "key": "num_hidden_layers",
          "label": "隐藏层数",
          "type": "number",
          "value": 12,
          "min": 1,
          "max": 48,
          "step": 1
        },
        {
          "key": "num_attention_heads",
          "label": "注意力头数",
          "type": "number",
          "value": 12,
          "min": 1,
          "max": 64,
          "step": 1
        },
        {
          "key": "hidden_size",
          "label": "隐藏大小",
          "type": "number",
          "value": 768,
          "min": 128,
          "max": 4096,
          "step": 128
        }
      ],
      "inputs": [
        {
          "id": "input_bert_001",
          "name": "input",
          "type": "input",
          "dataType": "tensor",
          "shape": [1, 512],
          "connectedTo": []
        }
      ],
      "outputs": [
        {
          "id": "output_bert_001",
          "name": "output",
          "type": "output",
          "dataType": "tensor",
          "shape": [1, 512, 768],
          "connectedTo": ["input_linear_001"]
        }
      ],
      "metadata": {
        "framework": "pytorch",
        "layerType": "bert",
        "requiresTransformers": true,
        "defaultInputShape": [1, 512],
        "defaultOutputShape": [1, 512, 768]
      }
    },
    {
      "id": "node_linear_001",
      "name": "全连接层",
      "type": "linear",
      "icon": "Grid",
      "description": "分类层",
      "category": "basic_layers",
      "position": { "x": 600, "y": 300 },
      "creationId": 2,
      "params": [
        {
          "key": "in_features",
          "label": "输入特征数",
          "type": "number",
          "value": 768,
          "min": 1,
          "max": 100000,
          "step": 1
        },
        {
          "key": "out_features",
          "label": "输出特征数",
          "type": "number",
          "value": 2,
          "min": 1,
          "max": 100000,
          "step": 1
        },
        {
          "key": "bias",
          "label": "使用偏置",
          "type": "boolean",
          "value": true
        }
      ],
      "inputs": [
        {
          "id": "input_linear_001",
          "name": "input",
          "type": "input",
          "dataType": "tensor",
          "shape": [1, 768],
          "connectedTo": ["output_bert_001"]
        }
      ],
      "outputs": [
        {
          "id": "output_linear_001",
          "name": "output",
          "type": "output",
          "dataType": "tensor",
          "shape": [1, 2],
          "connectedTo": []
        }
      ],
      "metadata": {
        "framework": "pytorch",
        "layerType": "linear"
      }
    }
  ],
  "connections": [
    {
      "id": "conn_001",
      "source": {
        "nodeId": "node_bert_001",
        "pointId": "output_bert_001",
        "x": 0,
        "y": 0
      },
      "target": {
        "nodeId": "node_linear_001",
        "pointId": "input_linear_001",
        "x": 0,
        "y": 0
      },
      "style": {
        "color": "#409eff",
        "width": 2,
        "dashed": false,
        "arrowType": "filled"
      },
      "data": {
        "dataType": "tensor",
        "shape": [1, 768],
        "tensorName": "bert_cls_output"
      }
    }
  ]
}
```

## 🔧 参数说明

### BERT 参数

| 参数                    | 说明       | 推荐值   | 备注                   |
| ----------------------- | ---------- | -------- | ---------------------- |
| **model_type**          | 模型类型   | `"base"` | Base 适合大多数任务    |
| **pretrained**          | 预训练权重 | `true`   | 必须开启！             |
| **num_hidden_layers**   | 隐藏层数   | `12`     | Base: 12, Large: 24    |
| **num_attention_heads** | 注意力头数 | `12`     | Base: 12, Large: 16    |
| **hidden_size**         | 隐藏维度   | `768`    | Base: 768, Large: 1024 |

### BERT 版本对比

| 版本          | 层数   | 隐藏维度 | 注意力头 | 参数量   | 适用场景     |
| ------------- | ------ | -------- | -------- | -------- | ------------ |
| **BERT-Base** | **12** | **768**  | **12**   | **110M** | **标准任务** |
| BERT-Large    | 24     | 1024     | 16       | 340M     | 高精度需求   |

## 💻 生成的 PyTorch 代码

### model.py

```python
import torch
import torch.nn as nn
from transformers import BertModel, BertTokenizer

class BERTClassifier(nn.Module):
    def __init__(self, num_classes=2):
        super(BERTClassifier, self).__init__()

        # BERT-Base
        self.bert = BertModel.from_pretrained('bert-base-uncased')

        # 分类层
        self.classifier = nn.Linear(768, num_classes)

        # Dropout
        self.dropout = nn.Dropout(0.1)

    def forward(self, input_ids, attention_mask):
        # BERT 编码
        outputs = self.bert(
            input_ids=input_ids,
            attention_mask=attention_mask
        )

        # 取 [CLS] token 的输出（第一个 token）
        pooled_output = outputs.pooler_output  # [batch_size, 768]

        # Dropout
        pooled_output = self.dropout(pooled_output)

        # 分类
        logits = self.classifier(pooled_output)  # [batch_size, num_classes]

        return logits

if __name__ == '__main__':
    model = BERTClassifier(num_classes=2)
    tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

    # 测试
    text = "This is a great movie!"
    encoded = tokenizer(text, padding='max_length', max_length=512,
                       truncation=True, return_tensors='pt')

    with torch.no_grad():
        logits = model(encoded['input_ids'], encoded['attention_mask'])
        print(f"Logits shape: {logits.shape}")  # torch.Size([1, 2])
        predicted_class = torch.argmax(logits, dim=1)
        print(f"Predicted class: {predicted_class.item()}")
```

### requirements.txt

```
torch>=1.9.0
transformers>=4.0.0
```

## 🚀 使用步骤

### 1. 在画布中操作

1. 拖拽 **BERT** 到画布左侧
   - 模型类型：`BERT-Base`
   - 预训练权重：✅
   - 其他参数保持默认

2. 拖拽 **Linear** 到 BERT 右侧
   - 输入特征数：`768`
   - 输出特征数：`2`（二分类）

3. 连接：BERT 输出 → Linear 输入

### 2. 导出并安装

```bash
pip install -r requirements.txt
python model.py
```

## ⚠️ 当前版本说明（重要）

当前低代码平台导出的 NLP 项目中，`train.py` / `inference.py` 仍按视觉任务模板生成。
对于 BERT 任务，通常需要你手动改造输入为 `input_ids` 和 `attention_mask`（以及 tokenizer 预处理）后再训练与推理。

建议验证顺序：
1. 先验证 `model.py` 是否可实例化
2. 再按你的数据集改造 `train.py`
3. 最后改造 `inference.py`

## 📈 训练示例（情感分析）

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from transformers import BertTokenizer
from model import BERTClassifier

# 自定义数据集
class TextDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]

        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].squeeze(0),
            'attention_mask': encoding['attention_mask'].squeeze(0),
            'label': torch.tensor(label, dtype=torch.long)
        }

# 准备数据
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

train_texts = [
    "This movie is amazing!",
    "I hate this boring film.",
    "What a wonderful story!",
    "Terrible acting and plot."
]
train_labels = [1, 0, 1, 0]  # 1: positive, 0: negative

train_dataset = TextDataset(train_texts, train_labels, tokenizer)
train_loader = DataLoader(train_dataset, batch_size=2, shuffle=True)

# 初始化模型
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = BERTClassifier(num_classes=2).to(device)

# 损失函数和优化器
criterion = nn.CrossEntropyLoss()
optimizer = optim.AdamW(model.parameters(), lr=2e-5)  # BERT 用小学习率

# 训练循环
model.train()
for epoch in range(3):
    running_loss = 0.0
    correct = 0
    total = 0

    for batch in train_loader:
        input_ids = batch['input_ids'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        labels = batch['label'].to(device)

        optimizer.zero_grad()
        logits = model(input_ids, attention_mask)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        _, predicted = torch.max(logits, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

    epoch_loss = running_loss / len(train_loader)
    epoch_acc = 100. * correct / total
    print(f'Epoch {epoch+1}: Loss={epoch_loss:.4f}, Acc={epoch_acc:.2f}%')

# 保存模型
torch.save(model.state_dict(), 'bert_sentiment.pth')
```

## 🎯 最佳实践

### 1. 序列长度选择

| 任务类型                 | 推荐max_length | 备注        |
| ------------------------ | -------------- | ----------- |
| 短文本分类（标题、评论） | 64-128         | 速度快      |
| 中等文本（新闻、文章）   | 256-384        | 平衡        |
| 长文本（论文、文档）     | 512            | BERT 最大值 |

### 2. 学习率和优化器

```python
# BERT 微调推荐配置
optimizer = optim.AdamW([
    {'params': model.bert.parameters(), 'lr': 2e-5},      # BERT 层小学习率
    {'params': model.classifier.parameters(), 'lr': 1e-3}  # 分类器大学习率
], weight_decay=0.01)

# 学习率调度
from transformers import get_linear_schedule_with_warmup

scheduler = get_linear_schedule_with_warmup(
    optimizer,
    num_warmup_steps=100,
    num_training_steps=len(train_loader) * 3
)
```

### 3. 冻结 BERT 层（快速实验）

```python
# 冻结 BERT，只训练分类器
for param in model.bert.parameters():
    param.requires_grad = False

# 训练 2-3 epochs，速度快但精度略低
```

### 4. 多任务学习

```python
class BERTMultiTask(nn.Module):
    def __init__(self):
        super().__init__()
        self.bert = BertModel.from_pretrained('bert-base-uncased')
        self.sentiment_classifier = nn.Linear(768, 2)  # 情感分类
        self.topic_classifier = nn.Linear(768, 10)     # 主题分类

    def forward(self, input_ids, attention_mask, task='sentiment'):
        pooled = self.bert(input_ids, attention_mask).pooler_output
        if task == 'sentiment':
            return self.sentiment_classifier(pooled)
        else:
            return self.topic_classifier(pooled)
```

## ⚠️ 常见问题

### Q1: 为什么训练这么慢？

**A**: BERT 参数量大（110M），建议：
1. 使用 GPU (CUDA)
2. 减小 batch_size 和 max_length
3. 使用 DistilBERT（参数减少 40%，速度快 60%）

```python
from transformers import DistilBertModel
self.bert = DistilBertModel.from_pretrained('distilbert-base-uncased')
```

### Q2: 显存不足怎么办？

**A**:
```python
# 方案 1: 减小 batch_size
batch_size = 8  # 降到 8 或 4

# 方案 2: 梯度累积
accumulation_steps = 4
for i, batch in enumerate(train_loader):
    loss = loss / accumulation_steps
    loss.backward()
    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()

# 方案 3: 混合精度训练
from torch.cuda.amp import autocast, GradScaler
scaler = GradScaler()

with autocast():
    logits = model(input_ids, attention_mask)
    loss = criterion(logits, labels)

scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()
```

### Q3: 中文任务怎么办？

**A**: 使用中文 BERT 模型：

```python
from transformers import BertModel, BertTokenizer

# 中文 BERT-Base
model = BertModel.from_pretrained('bert-base-chinese')
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')

# 或者使用 RoBERTa 中文版（更好）
from transformers import BertForSequenceClassification
model = BertForSequenceClassification.from_pretrained('hfl/chinese-roberta-wwm-ext', num_labels=2)
```

### Q4: 如何处理长文本（>512）？

**A**:
```python
# 方案 1: 截断
text = text[:512]

# 方案 2: 滑动窗口
def sliding_window(text, window_size=512, stride=256):
    chunks = []
    for i in range(0, len(text), stride):
        chunks.append(text[i:i+window_size])
    return chunks

# 方案 3: 使用 Longformer（支持 4096）
from transformers import LongformerModel
model = LongformerModel.from_pretrained('allenai/longformer-base-4096')
```

## 📊 性能参考

### 情感分析（IMDB）

| 模型       | 准确率 | 参数量 | 训练时间           |
| ---------- | ------ | ------ | ------------------ |
| BERT-Base  | 93.2%  | 110M   | 30 min/epoch (GPU) |
| DistilBERT | 91.8%  | 66M    | 18 min/epoch       |
| LSTM       | 87.5%  | 2M     | 5 min/epoch        |

### 新闻分类（AG News）

| 模型       | 准确率 | F1-Score |
| ---------- | ------ | -------- |
| BERT-Base  | 94.6%  | 0.946    |
| BERT-Large | 95.1%  | 0.951    |
| FastText   | 91.5%  | 0.913    |

## 🔗 相关资源

- [BERT 论文](https://arxiv.org/abs/1810.04805)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers/)
- [BERT 预训练模型](https://huggingface.co/models?filter=bert)
- [中文 BERT 模型](https://github.com/ymcui/Chinese-BERT-wwm)
