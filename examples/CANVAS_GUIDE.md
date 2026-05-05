# 拖拉拽开发平台画布使用指南 - 预训练模型操作手册

**核心定义**：AI拖拉拽开发平台是一套面向AI模型开发的可视化搭建工具，通过拖拽组件、连接节点并配置参数，自动生成可运行的PyTorch模型、训练和推理代码。

## 📌 核心问题解答

### Q1: 预训练模型应该在画布上如何添加？

预训练模型在拖拉拽开发平台中位于 **"模型 (Models)"** 组件分类下。以下是详细操作步骤：

#### 步骤 1：打开拖拉拽开发平台
1. 启动前端项目（`npm run dev`）
2. 在浏览器中打开平台界面
3. 看到左侧工具箱（Toolbox）

#### 步骤 2：找到预训练模型组件
在工具箱中找到 **"模型 (Models)"** 分类，其中包含 8 个预训练模型：

**视觉模型（5个）：**
- 🎯 ResNet - 残差神经网络
- 🔍 VGGNet - 牛津视觉几何组网络
- 📱 MobileNet V2 - 轻量级卷积神经网络
- ⚡ EfficientNet - 高效卷积神经网络
- 🔗 DenseNet - 密集连接卷积网络

**语言模型（3个）：**
- 📄 BERT - 双向编码器表示变换器
- 💬 GPT-2 - 生成式预训练变换器
- 🔁 Transformer - 通用 Transformer 编码器

#### 步骤 3：拖拽预训练模型到画布
1. **单击模型组件** 并拖拽到中心画布区域
2. 组件会自动创建带有输入/输出端口的节点
3. 双击节点可打开配置面板

#### 步骤 4：配置模型参数
打开配置面板后，可以看到每个模型的可配置参数：

**ResNet 配置示例：**
```
┌─────────────────────────┐
│   ResNet 配置面板       │
├─────────────────────────┤
│ 层数: [18▼]            │  ← 下拉选择 18/34/50/101/152
│ 预训练权重: [✓]        │  ← 是否使用 ImageNet 预训练权重
│ 分类数: [1000]         │  ← 输出类别数（可改为 10 做 CIFAR-10）
├─────────────────────────┤
│ 输入: [1, 3, 224, 224]  │
│ 输出: [1, 1000]         │
└─────────────────────────┘
```

**BERT 配置示例：**
```
┌─────────────────────────┐
│   BERT 配置面板         │
├─────────────────────────┤
│ 模型类型: [base▼]      │  ← 选择 base 或 large
│ 预训练权重: [✓]        │  ← 默认开启
│ 隐藏层数: [12]         │
│ 注意力头数: [12]       │
│ 隐藏大小: [768]        │
└─────────────────────────┘
```

---

### Q2: 还需要添加其他组件吗？

**是的！** 预训练模型本身只是特征提取器或编码器，通常需要与其他组件组合才能完成完整任务。以下是常见的组合方式：

## 🎨 画布典型工作流

### 场景 1：图像分类（迁移学习）

```
[输入层 Input]
     ↓
[ResNet/VGGNet/EfficientNet]  ← 预训练模型（冻结权重）
     ↓
[Flatten 展平层]               ← 将特征扁平化
     ↓
[Dropout]                       ← 可选：防止过拟合
     ↓
[Linear 全连接层]              ← 分类头（output_dim = 10）
     ↓
[Softmax 激活]
     ↓
[输出层 Output]
```

**需要的组件：**
| 组件 | 分类 | 作用 |
|------|------|------|
| Input | 基础层 | 定义输入形状 `[batch, 3, 224, 224]` |
| ResNet | 模型 | 特征提取（使用 `pretrained=True`） |
| Flatten | 工具层 | 展平为 `[batch, 2048]` |
| Linear | 基础层 | 分类头 `Linear(2048, 10)` |
| Softmax | 激活函数 | 输出概率分布 |

**画布操作：**
1. 拖拽 **Input** 节点 → 配置 `shape=[1, 3, 224, 224]`
2. 拖拽 **ResNet** 节点 → 配置 `num_layers=18, pretrained=True, num_classes=10`
3. **连接** Input 的输出端口到 ResNet 的输入端口
4. 点击 **"生成代码"** 按钮

**生成的代码示例：**
```python
class AIModel(nn.Module):
    def __init__(self):
        super(AIModel, self).__init__()
        self.resnet1 = models.resnet18(pretrained=True)
        if 10 != 1000:
            self.resnet1.fc = nn.Linear(self.resnet1.fc.in_features, 10)

    def forward(self, x):
        x = self.resnet1(x)
        return x
```

---

### 场景 2：特征提取 + 自定义分类头

```
[输入层 Input]
     ↓
[ResNet]                        ← 只使用 features 部分
     ↓
[Global Average Pooling]        ← 池化为固定大小向量
     ↓
[Linear 512]                    ← 自定义中间层
     ↓
[ReLU]
     ↓
[Dropout 0.5]
     ↓
[Linear 10]                     ← 最终分类层
     ↓
[Output]
```

**需要的额外组件：**
- **AdaptiveAvgPool2d** (池化层)
- **Flatten** (工具层)
- **Linear** × 2 (基础层)
- **ReLU** (激活函数)
- **Dropout** (工具层)

---

### 场景 3：文本分类（BERT + 分类头）

```
[文本输入 Text Input]           ← input_ids + attention_mask
     ↓
[BERT]                          ← 预训练模型
     ↓
[取 [CLS] token]                ← 提取句子表示
     ↓
[Dropout 0.1]
     ↓
[Linear 2]                      ← 二分类
     ↓
[Softmax]
     ↓
[输出 Output]
```

**注意事项：**
- BERT 通常不需要额外组件，因为 `BertForSequenceClassification` 自带分类头
- 如果使用 `BertModel`（无分类头），需要手动添加 Linear 层

---

### 场景 4：序列到序列（Transformer Encoder-Decoder）

```
[源序列输入 src]
     ↓
[Embedding + Positional Encoding]
     ↓
     ├─────────────────────────┐
     │                         ↓
[Transformer]  ← src & tgt  [目标序列输入 tgt]
     │                         ↑
     ├─────────────────────────┘
     ↓
[Linear]                        ← 投影到词汇表大小
     ↓
[Softmax]
     ↓
[输出 Output]
```

**需要的额外组件：**
- **Embedding** (基础层) × 2
- **Transformer** (模型)
- **Linear** (输出投影)

---

## 🔧 完整操作示例演示

### 例子：ResNet-18 迁移学习到 CIFAR-10

#### 第 1 步：创建输入节点
1. 在工具箱找到 **"基础层 (Basic Layers)" → Input**
2. 拖拽到画布左侧
3. 双击配置：
   - **name**: `input_image`
   - **shape**: `[1, 3, 224, 224]`
   - **dtype**: `float32`

#### 第 2 步：添加 ResNet
1. 在工具箱找到 **"模型 (Models)" → ResNet**
2. 拖拽到 Input 右侧
3. 双击配置：
   - **num_layers**: `18`
   - **pretrained**: `True` ✓
   - **num_classes**: `10`  ← 改为 10（CIFAR-10 类别数）

#### 第 3 步：连接节点
1. 将鼠标悬停在 Input 节点的 **输出端口**（右侧圆点）
2. 按住并拖拽到 ResNet 节点的 **输入端口**（左侧圆点）
3. 看到连线出现，表示连接成功

#### 第 4 步：生成代码
1. 点击顶部菜单栏的 **"生成代码"** 按钮
2. 在右侧代码预览面板看到生成的 PyTorch 代码
3. 点击 **"下载代码"** 获取3个文件：
   - `model.py` - 模型定义
   - `train.py` - 训练脚本
   - `inference.py` - 推理脚本

#### 第 5 步：本地测试
```bash
# 1. 保存生成的代码到项目目录
cd my_project
# 将3个文件放入此处

# 2. 运行训练
python train.py

# 3. 运行推理
python inference.py
```

---

## 🛠️ 常见组合模式速查表

| 任务类型 | 预训练模型 | 必需的其他组件 | 可选组件 |
|---------|-----------|---------------|---------|
| **图像分类** | ResNet/VGG/EfficientNet | Input, Flatten, Linear, Softmax | Dropout, BatchNorm |
| **图像特征提取** | ResNet/DenseNet | Input, AdaptiveAvgPool2d, Flatten | - |
| **小模型部署** | MobileNet V2 | Input, Linear | Dropout |
| **文本分类** | BERT | - (自带分类头) | Dropout |
| **文本生成** | GPT-2 | - (自带 LM head) | - |
| **Seq2Seq 翻译** | Transformer | Embedding × 2, Linear, Preprocessing | Attention Mask |

---

## ⚙️ 关键参数配置建议

### 迁移学习模式（推荐）
```yaml
预训练模型:
  pretrained: True      # 使用 ImageNet/预训练权重
  num_classes: 10       # 改为目标数据集类别数

自定义分类头:
  - Flatten
  - Dropout(p=0.5)      # 防止过拟合
  - Linear(in=2048, out=10)
  - Softmax
```

### 从头训练模式（不推荐，除非有大量数据）
```yaml
预训练模型:
  pretrained: False     # 不使用预训练权重
  num_classes: 10

训练设置:
  epochs: 100+          # 需要更多训练轮数
  learning_rate: 0.01   # 更大的学习率
  data_augmentation: True
```

---

## 🔍 故障排查

### 问题 1：节点连接失败
**症状：** 拖拽连线时无法连接到目标节点

**解决方案：**
1. 检查端口数据类型是否匹配（如都是 `tensor`）
2. 检查输出形状与输入形状是否兼容
   - ResNet 输出: `[1, 1000]`
   - Linear 输入: 需要 `[1, 1000]` 或先 Flatten

### 问题 2：生成的代码报错
**症状：** 下载代码后运行 `python model.py` 报错

**解决方案：**
1. 检查 `requirements.txt`：
   ```bash
   pip install torch>=1.9.0 torchvision>=0.10.0
   ```
2. 如果使用 BERT/GPT-2，额外安装：
   ```bash
   pip install transformers>=4.0.0
   ```
3. 如果使用 EfficientNet，确保：
   ```bash
   pip install torchvision>=0.11.0
   ```

### 问题 3：模型输出形状不匹配
**症状：**
```
RuntimeError: mat1 and mat2 shapes cannot be multiplied (1x2048 and 512x10)
```

**解决方案：**
1. 在 ResNet 和 Linear 之间添加 **Flatten** 层
2. 调整 Linear 层的 `in_features` 参数匹配上一层输出

---

## 📚 下一步学习

1. **阅读测试文档**：`examples/README.md` - 了解如何本地测试生成的代码
2. **运行示例代码**：`python examples/01_resnet_example.py` - 看实际效果
3. **查看架构文档**：`PROJECT_ARCHITECTURE.md` - 了解平台底层实现
4. **浏览组件库**：在平台中探索 **9 大分类** 的所有组件

---

**祝您使用愉快！** 🎉

如有任何问题，请检查：
- 📖 测试文档：`examples/README.md`
- 🏗️ 架构文档：`PROJECT_ARCHITECTURE.md`
- 📂 案例代码：`examples/01_resnet_example.py` ~ `08_transformer_example.py`
