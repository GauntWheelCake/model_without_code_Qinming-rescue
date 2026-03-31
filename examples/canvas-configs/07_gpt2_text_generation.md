# GPT-2 文本生成

## ✅ 测试环境

- torch: `2.9.1+cu128`
- torchvision: `0.24.1+cu128`
- torchaudio: `2.9.1+cu128`

## 📝 任务描述

使用 GPT-2 (Generative Pre-trained Transformer 2) 进行文本生成任务，如故事续写、对话生成、文本补全等。

## 🎨 画布配置

### 节点列表

仅需 1 个节点：**GPT-2 生成模型**

### JSON 配置

```json
{
  "nodes": [
    {
      "id": "node_gpt2_001",
      "name": "GPT-2",
      "type": "gpt2",
      "icon": "ChatLineRound",
      "description": "生成式预训练变换器2",
      "category": "models",
      "position": { "x": 400, "y": 300 },
      "creationId": 1,
      "params": [
        {
          "key": "model_type",
          "label": "模型大小",
          "type": "select",
          "value": "small",
          "options": [
            { "label": "GPT-2 Small", "value": "small" },
            { "label": "GPT-2 Medium", "value": "medium" },
            { "label": "GPT-2 Large", "value": "large" },
            { "label": "GPT-2 XL", "value": "xl" }
          ]
        },
        {
          "key": "pretrained",
          "label": "预训练权重",
          "type": "boolean",
          "value": true
        },
        {
          "key": "n_embd",
          "label": "嵌入维度",
          "type": "number",
          "value": 768,
          "min": 128,
          "max": 4096,
          "step": 128
        },
        {
          "key": "n_layer",
          "label": "层数",
          "type": "number",
          "value": 12,
          "min": 1,
          "max": 48,
          "step": 1
        },
        {
          "key": "n_head",
          "label": "注意力头数",
          "type": "number",
          "value": 12,
          "min": 1,
          "max": 64,
          "step": 1
        }
      ],
      "inputs": [
        {
          "id": "input_gpt2_001",
          "name": "input",
          "type": "input",
          "dataType": "tensor",
          "shape": [1, 1024],
          "connectedTo": []
        }
      ],
      "outputs": [
        {
          "id": "output_gpt2_001",
          "name": "output",
          "type": "output",
          "dataType": "tensor",
          "shape": [1, 1024, 768],
          "connectedTo": []
        }
      ],
      "metadata": {
        "framework": "pytorch",
        "layerType": "gpt2",
        "requiresTransformers": true,
        "defaultInputShape": [1, 1024],
        "defaultOutputShape": [1, 1024, 768]
      }
    }
  ],
  "connections": []
}
```

## 🔧 参数说明

| 参数           | 说明             | 推荐值    | 备注                     |
| -------------- | ---------------- | --------- | ------------------------ |
| **model_type** | 模型大小         | `"small"` | Small 适合大多数任务     |
| **pretrained** | 预训练权重       | `true`    | 必须开启！               |
| **n_embd**     | 嵌入维度         | `768`     | Small: 768, Medium: 1024 |
| **n_layer**    | Transformer 层数 | `12`      | Small: 12, XL: 48        |
| **n_head**     | 注意力头数       | `12`      | 与 n_embd 配套           |

### GPT-2 版本对比

| 版本      | 层数   | 嵌入维度 | 注意力头 | 参数量   | 最大长度 | 适用场景     |
| --------- | ------ | -------- | -------- | -------- | -------- | ------------ |
| **Small** | **12** | **768**  | **12**   | **117M** | **1024** | **标准任务** |
| Medium    | 24     | 1024     | 16       | 345M     | 1024     | 高质量生成   |
| Large     | 36     | 1280     | 20       | 774M     | 1024     | 专业应用     |
| XL        | 48     | 1600     | 25       | 1558M    | 1024     | 最高质量     |

## 💻 生成的 PyTorch 代码

### model.py

```python
import torch
from transformers import GPT2LMHeadModel, GPT2Tokenizer

class GPT2Generator:
    def __init__(self, model_name='gpt2'):
        """
        model_name: 'gpt2', 'gpt2-medium', 'gpt2-large', 'gpt2-xl'
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = GPT2LMHeadModel.from_pretrained(model_name).to(self.device)
        self.tokenizer = GPT2Tokenizer.from_pretrained(model_name)
        self.tokenizer.pad_token = self.tokenizer.eos_token

    def generate(self, prompt, max_length=100, temperature=1.0,
                 top_k=50, top_p=0.95, num_return_sequences=1):
        """
        生成文本
        Args:
            prompt: 输入提示
            max_length: 最大生成长度
            temperature: 温度（越高越随机）
            top_k: Top-K 采样
            top_p: Nucleus 采样
            num_return_sequences: 生成数量
        """
        input_ids = self.tokenizer.encode(prompt, return_tensors='pt').to(self.device)

        with torch.no_grad():
            output = self.model.generate(
                input_ids,
                max_length=max_length,
                temperature=temperature,
                top_k=top_k,
                top_p=top_p,
                num_return_sequences=num_return_sequences,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )

        generated_texts = [self.tokenizer.decode(seq, skip_special_tokens=True)
                          for seq in output]
        return generated_texts

if __name__ == '__main__':
    generator = GPT2Generator('gpt2')

    # 测试生成
    prompt = "Once upon a time"
    generated = generator.generate(prompt, max_length=50, temperature=0.8)

    print("Prompt:", prompt)
    print("\nGenerated:")
    for i, text in enumerate(generated, 1):
        print(f"{i}. {text}\n")
```

### requirements.txt

```
torch>=1.9.0
transformers>=4.0.0
```

## 🚀 使用步骤

### 1. 在画布中操作

1. 从组件面板拖拽 **GPT-2** 到画布
2. 配置参数：
   - 模型大小：`GPT-2 Small`
   - 预训练权重：✅
   - 其他参数保持默认

### 2. 导出并测试

```bash
pip install -r requirements.txt
python model.py
```

## ⚠️ 当前版本说明（重要）

当前低代码平台导出的 NLP 项目中，`train.py` / `inference.py` 仍按视觉任务模板生成。
对于 GPT-2 任务，通常需要你手动改造为 tokenizer + 自回归生成/训练流程后再使用。

建议验证顺序：
1. 先验证 `model.py` 是否可实例化
2. 再按你的数据集改造 `train.py`
3. 最后改造 `inference.py`

## 📈 训练示例（微调）

```python
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import GPT2LMHeadModel, GPT2Tokenizer, AdamW

# 自定义数据集
class TextDataset(Dataset):
    def __init__(self, texts, tokenizer, max_length=512):
        self.examples = []
        for text in texts:
            inputs = tokenizer(text, max_length=max_length,
                             padding='max_length', truncation=True,
                             return_tensors='pt')
            self.examples.append(inputs)

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, idx):
        return self.examples[idx]

# 准备数据
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
tokenizer.pad_token = tokenizer.eos_token

train_texts = [
    "The quick brown fox jumps over the lazy dog.",
    "A journey of a thousand miles begins with a single step.",
    "To be or not to be, that is the question."
]

train_dataset = TextDataset(train_texts, tokenizer)
train_loader = DataLoader(train_dataset, batch_size=2, shuffle=True)

# 初始化模型
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = GPT2LMHeadModel.from_pretrained('gpt2').to(device)

# 优化器
optimizer = AdamW(model.parameters(), lr=5e-5)

# 训练循环
model.train()
for epoch in range(3):
    running_loss = 0.0

    for batch in train_loader:
        input_ids = batch['input_ids'].squeeze(1).to(device)
        attention_mask = batch['attention_mask'].squeeze(1).to(device)

        optimizer.zero_grad()

        # GPT-2 自回归训练
        outputs = model(input_ids=input_ids,
                       attention_mask=attention_mask,
                       labels=input_ids)

        loss = outputs.loss
        loss.backward()
        optimizer.step()

        running_loss += loss.item()

    epoch_loss = running_loss / len(train_loader)
    print(f'Epoch {epoch+1}: Loss={epoch_loss:.4f}')

# 保存模型
model.save_pretrained('./gpt2_finetuned')
tokenizer.save_pretrained('./gpt2_finetuned')
```

## 🎯 最佳实践

### 1. 生成策略

#### Greedy 解码（确定性）

```python
output = model.generate(
    input_ids,
    max_length=100,
    do_sample=False  # 贪婪解码
)
```

#### Top-K 采样（多样性）

```python
output = model.generate(
    input_ids,
    max_length=100,
    do_sample=True,
    top_k=50,  # 从概率最高的 50 个词中采样
    temperature=0.8  # 温度：越高越随机
)
```

#### Nucleus (Top-P) 采样（平衡）

```python
output = model.generate(
    input_ids,
    max_length=100,
    do_sample=True,
    top_p=0.95,  # 累积概率达到 95% 的词集合
    temperature=0.7
)
```

#### Beam Search（质量优先）

```python
output = model.generate(
    input_ids,
    max_length=100,
    num_beams=5,  # 束搜索宽度
    early_stopping=True,
    no_repeat_ngram_size=2  # 避免重复
)
```

### 2. 温度参数效果

| Temperature | 效果             | 适用场景             |
| ----------- | ---------------- | -------------------- |
| 0.1-0.5     | 保守、一致       | 客服机器人、技术文档 |
| 0.6-0.8     | **平衡（推荐）** | 故事生成、对话       |
| 0.9-1.2     | 创意、多样       | 诗歌、创意写作       |
| >1.5        | 混乱、不连贯     | 不推荐               |

### 3. 提示工程 (Prompt Engineering)

```python
# 故事续写
prompt = "In a distant galaxy, there was a brave astronaut named"

# 对话生成
prompt = """Human: What's the weather like today?
AI:"""

# 代码生成
prompt = """# Python function to calculate factorial
def factorial(n):"""

# 翻译
prompt = "Translate English to French:\nHello → Bonjour\nGoodbye →"
```

### 4. 防止重复

```python
output = model.generate(
    input_ids,
    max_length=100,
    no_repeat_ngram_size=3,  # 不重复 3-gram
    repetition_penalty=1.2,   # 惩罚重复
)
```

## ⚠️ 常见问题

### Q1: 生成的文本不连贯？

**A**: 调整生成参数：
```python
# 更保守的生成
output = model.generate(
    input_ids,
    max_length=100,
    temperature=0.7,  # 降低温度
    top_p=0.9,        # 减小 top_p
    repetition_penalty=1.2
)
```

### Q2: 如何控制生成长度？

**A**:
```python
# 方案 1: 固定长度
output = model.generate(input_ids, max_length=100)

# 方案 2: 遇到 EOS 停止
output = model.generate(input_ids, max_length=100, early_stopping=True)

# 方案 3: 最小长度
output = model.generate(input_ids, min_length=50, max_length=100)
```

### Q3: 中文文本生成？

**A**: 使用中文 GPT 模型：

```python
from transformers import BertTokenizer, GPT2LMHeadModel

# 使用中文 GPT-2
model_name = 'uer/gpt2-chinese-cluecorpussmall'
model = GPT2LMHeadModel.from_pretrained(model_name)
tokenizer = BertTokenizer.from_pretrained(model_name)

# 或者使用 GPT-Neo 中文版
# model_name = 'IDEA-CCNL/Wenzhong-GPT2-110M'
```

### Q4: 显存不足？

**A**:
```python
# 方案 1: 使用更小的模型
model = GPT2LMHeadModel.from_pretrained('gpt2')  # 117M 参数

# 方案 2: 减小 batch size
train_loader = DataLoader(dataset, batch_size=1)

# 方案 3: 梯度累积
accumulation_steps = 4

# 方案 4: 8-bit 量化
model = GPT2LMHeadModel.from_pretrained('gpt2', load_in_8bit=True)
```

## 📊 性能对比

### 生成质量（人工评分）

| 模型         | 流畅度 | 连贯性 | 创意性 | 参数量 |
| ------------ | ------ | ------ | ------ | ------ |
| GPT-2 Small  | 7.5/10 | 7.0/10 | 6.8/10 | 117M   |
| GPT-2 Medium | 8.2/10 | 8.0/10 | 7.5/10 | 345M   |
| GPT-2 Large  | 8.8/10 | 8.5/10 | 8.2/10 | 774M   |
| GPT-2 XL     | 9.1/10 | 9.0/10 | 8.7/10 | 1558M  |

### 生成速度（CPU）

| 模型         | 100 tokens 耗时 | 内存占用 |
| ------------ | --------------- | -------- |
| GPT-2 Small  | ~5 秒           | 500 MB   |
| GPT-2 Medium | ~12 秒          | 1.4 GB   |
| GPT-2 Large  | ~25 秒          | 3.1 GB   |
| GPT-2 XL     | ~50 秒          | 6.2 GB   |

*GPU (RTX 3090) 速度快 10-20 倍*

## 🎨 应用场景

### 1. 故事生成

```python
prompt = "In a world where magic is real, a young wizard discovers"
story = generator.generate(prompt, max_length=200, temperature=0.8)
```

### 2. 对话机器人

```python
conversation_history = "User: Hello!\nBot: Hi there! How can I help?\nUser: Tell me a joke\nBot:"
response = generator.generate(conversation_history, max_length=50, stop_token="\n")
```

### 3. 代码生成

```python
prompt = "# Python function to reverse a string\ndef reverse_string(s):\n    "
code = generator.generate(prompt, max_length=50, temperature=0.3)
```

### 4. 文本补全

```python
prompt = "The best way to learn programming is"
completion = generator.generate(prompt, max_length=30, num_return_sequences=3)
```

## 🔗 相关资源

- [GPT-2 论文](https://d4mucfpksywv.cloudfront.net/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)
- [Hugging Face GPT-2](https://huggingface.co/gpt2)
- [中文 GPT 模型](https://huggingface.co/uer/gpt2-chinese-cluecorpussmall)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
