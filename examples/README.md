# 预训练模型使用指南

**核心定义**：AI拖拉拽开发平台是一套面向AI模型开发的可视化搭建工具，通过拖拽组件、连接节点并配置参数，自动生成可运行的PyTorch模型、训练和推理代码。

本指南将教你如何在拖拉拽开发平台的画布中使用 8 个预训练模型。

## 📚 目录

- [平台使用流程](#平台使用流程)
- [预训练模型列表](#预训练模型列表)
- [完整示例](#完整示例)
- [导出代码使用](#导出代码使用)

## 🎯 平台使用流程

### 1. 选择组件

从左侧组件面板中找到 **"预训练模型"** 分类（图标：`Tickets`，颜色：`#f39c12`）

### 2. 拖拽到画布

将需要的模型组件拖拽到画布中心区域

### 3. 配置参数

点击节点，在右侧属性面板中配置参数：
- **预训练权重**: 是否加载 ImageNet/预训练权重
- **分类数**: 修改输出层的类别数量
- **模型变体**: 选择不同的模型深度/版本

### 4. 添加配套组件

根据任务需求添加其他组件：
- **基础层**: Linear（线性层）、Flatten（展平层）
- **激活函数**: ReLU、Softmax
- **工具层**: Dropout、Reshape

### 5. 连接节点

- 点击源节点的输出点（右侧圆点）
- 拖动到目标节点的输入点（左侧圆点）
- 系统会自动验证连接是否合法（形状匹配）

### 6. 导出代码

点击顶部 **"生成代码"** 按钮，系统将生成：
- `model.py` - 模型定义文件
- `train.py` - 训练脚本
- `inference.py` - 推理脚本
- `requirements.txt` - 依赖清单

## 🧠 预训练模型列表

| 模型 | 类型 | 特点 | 典型应用 |
|------|------|------|----------|
| **ResNet** | 视觉 | 残差连接，深度可调 | 图像分类、特征提取 |
| **VGGNet** | 视觉 | 简单堆叠，易于理解 | 迁移学习、特征提取 |
| **MobileNet V2** | 视觉 | 轻量级，适合移动端 | 移动应用、边缘设备 |
| **EfficientNet** | 视觉 | 高效的复合缩放 | 高精度分类任务 |
| **DenseNet** | 视觉 | 密集连接，参数高效 | 图像分类、医学影像 |
| **BERT** | NLP | 双向编码器 | 文本分类、命名实体识别 |
| **GPT-2** | NLP | 自回归生成 | 文本生成、对话系统 |
| **Transformer** | NLP | 通用编码器-解码器 | 机器翻译、序列到序列 |

## 📋 完整示例

每个模型都有详细的配置示例：

1. [ResNet 图像分类](./canvas-configs/01_resnet_classification.md)
2. [VGG 迁移学习](./canvas-configs/02_vgg_transfer_learning.md)
3. [MobileNet 轻量级分类](./canvas-configs/03_mobilenet_classification.md)
4. [EfficientNet 高精度分类](./canvas-configs/04_efficientnet_classification.md)
5. [DenseNet 特征提取](./canvas-configs/05_densenet_feature_extraction.md)
6. [BERT 文本分类](./canvas-configs/06_bert_text_classification.md)
7. [GPT-2 文本生成](./canvas-configs/07_gpt2_text_generation.md)
8. [Transformer 序列到序列](./canvas-configs/08_transformer_seq2seq.md)

## 🚀 导出代码使用

### 安装依赖

```bash
pip install -r requirements.txt
```

### 训练模型

```bash
python train.py \
  --data_path ./data \
  --epochs 10 \
  --batch_size 32 \
  --lr 0.001
```

### 推理测试

```bash
python inference.py \
  --checkpoint ./checkpoints/best_model.pth \
  --input ./test_image.jpg
```

### 自定义数据集

修改 `train.py` 中的数据加载部分：

```python
# 替换为你的数据集
from torchvision import datasets, transforms

train_dataset = datasets.ImageFolder(
    root='your_data_path',
    transform=transforms.Compose([
        transforms.Resize(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                           [0.229, 0.224, 0.225])
    ])
)
```

## 📝 最佳实践

### 视觉模型

1. **输入尺寸**: 默认 `224×224`，可以调整但需要是 32 的倍数
2. **预训练权重**: 迁移学习时建议开启
3. **分类数**: 根据你的数据集类别数修改（默认 1000）
4. **微调策略**: 冻结特征层，只训练分类器

### NLP 模型

1. **序列长度**: BERT 默认 512，GPT-2 默认 1024
2. **预训练权重**: 从 Hugging Face 加载
3. **任务适配**: 添加任务特定的分类头
4. **分词器**: 使用与模型匹配的 tokenizer

## ⚠️ 常见问题

### Q1: 连接节点时提示形状不匹配？

**A**: 检查输出形状是否与输入形状兼容。例如：
- ResNet 输出: `[batch, num_classes]`
- Linear 输入: `[batch, in_features]`

需要确保 `num_classes == in_features` 或添加 `Flatten` 层。

### Q2: 如何修改分类数？

**A**: 点击模型节点，在右侧参数面板中找到 **"分类数"** 参数，修改为你需要的值。

### Q3: 预训练权重加载失败？

**A**: 检查：
1. 网络连接（会从官方源下载）
2. PyTorch/torchvision 版本是否符合要求
3. 对于 BERT/GPT-2，需要 `transformers>=4.0.0`

### Q4: 导出的代码如何修改？

**A**: 导出的代码是标准 PyTorch 代码，可以自由修改：
- `model.py`: 模型架构
- `train.py`: 训练逻辑、损失函数、优化器
- `inference.py`: 推理流程、后处理

## 🔗 相关资源

- [PyTorch 官方文档](https://pytorch.org/docs/)
- [torchvision 模型文档](https://pytorch.org/vision/stable/models.html)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers/)

## 📧 技术支持

如果遇到问题，请检查：
1. [常见问题](#常见问题)
2. [示例配置](./canvas-configs/)
3. 控制台的错误提示
