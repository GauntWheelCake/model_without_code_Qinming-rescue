# VGG 迁移学习

## ✅ 测试环境

- torch: `2.9.1+cu128`
- torchvision: `0.24.1+cu128`
- torchaudio: `2.9.1+cu128`

## 📝 任务描述

使用 VGG 进行迁移学习，展示如何添加自定义分类头。这个配置比 ResNet 稍复杂，包含 VGG + Dropout + Linear 三个节点。

## 🎨 画布配置

### 节点列表

共 3 个节点：
1. **VGG-16** 模型节点
2. **Dropout** 防止过拟合
3. **Linear** 自定义分类层

### 节点连接

```
VGG-16 → Dropout → Linear
```

### JSON 配置

```json
{
  "nodes": [
    {
      "id": "node_vgg_001",
      "name": "VGGNet",
      "type": "vgg",
      "icon": "Filter",
      "description": "牛津视觉几何组网络",
      "category": "models",
      "position": { "x": 300, "y": 300 },
      "creationId": 1,
      "params": [
        {
          "key": "version",
          "label": "版本",
          "type": "select",
          "value": "16",
          "options": [
            { "label": "VGG-11", "value": "11" },
            { "label": "VGG-13", "value": "13" },
            { "label": "VGG-16", "value": "16" },
            { "label": "VGG-19", "value": "19" }
          ]
        },
        {
          "key": "batch_norm",
          "label": "批归一化",
          "type": "boolean",
          "value": false
        },
        {
          "key": "pretrained",
          "label": "预训练权重",
          "type": "boolean",
          "value": true
        },
        {
          "key": "num_classes",
          "label": "分类数",
          "type": "number",
          "value": 1000,
          "min": 1,
          "max": 10000,
          "step": 1
        }
      ],
      "inputs": [
        {
          "id": "input_vgg_001",
          "name": "input",
          "type": "input",
          "dataType": "tensor",
          "shape": [1, 3, 224, 224],
          "connectedTo": []
        }
      ],
      "outputs": [
        {
          "id": "output_vgg_001",
          "name": "output",
          "type": "output",
          "dataType": "tensor",
          "shape": [1, 1000],
          "connectedTo": ["input_dropout_001"]
        }
      ],
      "metadata": {
        "framework": "pytorch",
        "layerType": "vgg",
        "requiresTorchvision": true,
        "defaultInputShape": [1, 3, 224, 224],
        "defaultOutputShape": [1, 1000]
      }
    },
    {
      "id": "node_dropout_001",
      "name": "Dropout层",
      "type": "dropout",
      "icon": "MagicStick",
      "description": "随机丢弃神经元",
      "category": "utilities",
      "position": { "x": 550, "y": 300 },
      "creationId": 2,
      "params": [
        {
          "key": "p",
          "label": "丢弃概率",
          "type": "range",
          "value": 0.5,
          "min": 0,
          "max": 1,
          "step": 0.05
        }
      ],
      "inputs": [
        {
          "id": "input_dropout_001",
          "name": "input",
          "type": "input",
          "dataType": "tensor",
          "shape": [1, 1000],
          "connectedTo": ["output_vgg_001"]
        }
      ],
      "outputs": [
        {
          "id": "output_dropout_001",
          "name": "output",
          "type": "output",
          "dataType": "tensor",
          "shape": [1, 1000],
          "connectedTo": ["input_linear_001"]
        }
      ],
      "metadata": {
        "framework": "pytorch",
        "layerType": "dropout"
      }
    },
    {
      "id": "node_linear_001",
      "name": "全连接层",
      "type": "linear",
      "icon": "Grid",
      "description": "全连接层",
      "category": "basic_layers",
      "position": { "x": 800, "y": 300 },
      "creationId": 3,
      "params": [
        {
          "key": "in_features",
          "label": "输入特征数",
          "type": "number",
          "value": 1000,
          "min": 1,
          "max": 100000,
          "step": 1
        },
        {
          "key": "out_features",
          "label": "输出特征数",
          "type": "number",
          "value": 10,
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
          "shape": [1, 1000],
          "connectedTo": ["output_dropout_001"]
        }
      ],
      "outputs": [
        {
          "id": "output_linear_001",
          "name": "output",
          "type": "output",
          "dataType": "tensor",
          "shape": [1, 10],
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
        "nodeId": "node_vgg_001",
        "pointId": "output_vgg_001",
        "x": 0,
        "y": 0
      },
      "target": {
        "nodeId": "node_dropout_001",
        "pointId": "input_dropout_001",
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
        "shape": [1, 1000],
        "tensorName": "vgg_output"
      }
    },
    {
      "id": "conn_002",
      "source": {
        "nodeId": "node_dropout_001",
        "pointId": "output_dropout_001",
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
        "shape": [1, 1000],
        "tensorName": "dropout_output"
      }
    }
  ]
}
```

## 🔧 参数说明

### VGG-16 参数

| 参数            | 说明             | 推荐值  | 备注                       |
| --------------- | ---------------- | ------- | -------------------------- |
| **version**     | VGG 版本         | `"16"`  | VGG-16 是最常用版本        |
| **batch_norm**  | 是否使用批归一化 | `false` | 预训练权重不包含 BN        |
| **pretrained**  | 使用预训练权重   | `true`  | 迁移学习必开               |
| **num_classes** | 输出类别数       | `1000`  | 保持原始分类器，后面自定义 |

### Dropout 参数

| 参数  | 说明     | 推荐值 |
| ----- | -------- | ------ |
| **p** | 丢弃概率 | `0.5`  |

### Linear 参数

| 参数             | 说明       | 推荐值 |
| ---------------- | ---------- | ------ |
| **in_features**  | 输入特征数 | `1000` |
| **out_features** | 输出特征数 | `10`   |
| **bias**         | 使用偏置   | `true` |

## 💻 生成的 PyTorch 代码

### model.py

```python
import torch
import torch.nn as nn
import torchvision.models as models

class CustomModel(nn.Module):
    def __init__(self):
        super(CustomModel, self).__init__()

        # VGG-16 (预训练)
        self.vgg = models.vgg16(pretrained=True)

        # Dropout
        self.dropout = nn.Dropout(p=0.5)

        # 自定义分类头
        self.fc = nn.Linear(in_features=1000, out_features=10)

    def forward(self, x):
        # VGG-16 特征提取
        x = self.vgg(x)  # [batch, 1000]

        # Dropout 正则化
        x = self.dropout(x)  # [batch, 1000]

        # 最终分类
        x = self.fc(x)  # [batch, 10]

        return x

if __name__ == '__main__':
    model = CustomModel()
    print(model)

    # 测试前向传播
    dummy_input = torch.randn(2, 3, 224, 224)
    output = model(dummy_input)
    print(f"Output shape: {output.shape}")  # torch.Size([2, 10])
```

### requirements.txt

```
torch>=1.9.0
torchvision>=0.10.0
```

## 🚀 使用步骤

### 1. 在画布中操作

1. 拖拽 **VGG** 组件到画布左侧
   - 版本：`VGG-16`
   - 批归一化：❌
   - 预训练权重：✅
   - 分类数：`1000`（保持不变）

2. 拖拽 **Dropout** 组件到 VGG 右侧
   - 丢弃概率：`0.5`

3. 拖拽 **Linear** 组件到 Dropout 右侧
   - 输入特征数：`1000`
   - 输出特征数：`10`

4. **连接节点**:
   - VGG 的输出点 → Dropout 的输入点
   - Dropout 的输出点 → Linear 的输入点

### 2. 导出代码

点击顶部 **"生成代码"** 按钮

### 3. 本地测试

```bash
pip install -r requirements.txt
python model.py
```

## 📈 训练示例（迁移学习）

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from model import CustomModel

# 数据预处理
transform_train = transforms.Compose([
    transforms.Resize(224),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# 加载 CIFAR-10
train_dataset = datasets.CIFAR10(root='./data', train=True,
                                  download=True, transform=transform_train)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=2)

# 初始化模型
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = CustomModel().to(device)

# 冻结 VGG 特征层，只训练分类头
for param in model.vgg.features.parameters():
    param.requires_grad = False

# 损失函数和优化器（只优化分类器）
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam([
    {'params': model.dropout.parameters()},
    {'params': model.fc.parameters()}
], lr=0.001)

# 训练循环
model.train()
for epoch in range(5):
    running_loss = 0.0
    correct = 0
    total = 0

    for inputs, labels in train_loader:
        inputs, labels = inputs.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    epoch_loss = running_loss / len(train_loader)
    epoch_acc = 100. * correct / total
    print(f'Epoch {epoch+1}: Loss={epoch_loss:.4f}, Acc={epoch_acc:.2f}%')

# 保存模型
torch.save(model.state_dict(), 'vgg16_cifar10_transfer.pth')
```

## 🎯 最佳实践

### 1. 为什么不直接修改 VGG 的分类数？

虽然可以直接设置 `num_classes=10`，但在迁移学习中，**保留 VGG 的原始分类器 + 添加自定义层**有以下优势：

- ✅ 灵活添加 Dropout、BatchNorm 等正则化层
- ✅ 可以堆叠多个 Linear 层形成深度分类头
- ✅ 更容易冻结/解冻特定层
- ✅ 便于实验不同的分类头架构

### 2. 冻结策略

```python
# 策略 1: 冻结所有特征层（推荐用于小数据集）
for param in model.vgg.features.parameters():
    param.requires_grad = False

# 策略 2: 只冻结前几层
for i, param in enumerate(model.vgg.features.parameters()):
    if i < 10:  # 冻结前 10 层
        param.requires_grad = False

# 策略 3: 全部解冻微调（需要大数据集）
for param in model.parameters():
    param.requires_grad = True
```

### 3. VGG 版本选择

| 版本   | 卷积层数 | 参数量 | 速度 | 推荐场景   |
| ------ | -------- | ------ | ---- | ---------- |
| VGG-11 | 8        | 133M   | 快   | 快速实验   |
| VGG-13 | 10       | 133M   | 中快 | 平衡选择   |
| VGG-16 | 13       | 138M   | 中   | **最常用** |
| VGG-19 | 16       | 144M   | 慢   | 高精度需求 |

### 4. 是否使用 Batch Normalization？

- **不使用 BN** (`batch_norm=false`):
  - ✅ 可以加载 ImageNet 预训练权重
  - ✅ 适合迁移学习

- **使用 BN** (`batch_norm=true`):
  - ❌ 预训练权重不可用（需要从头训练）
  - ✅ 训练更稳定
  - ✅ 收敛更快

**建议**: 迁移学习时使用 `batch_norm=false`

## ⚠️ 常见问题

### Q1: 为什么 VGG 比 ResNet 慢很多？

**A**: VGG 使用简单的卷积堆叠，没有残差连接和瓶颈结构，参数量更大。VGG-16 有 138M 参数，ResNet-18 只有 11.7M。

### Q2: 连接 Dropout 和 Linear 时提示形状不匹配？

**A**: 检查:
- VGG 的 `num_classes` 必须 = Linear 的 `in_features`
- 此例中都是 1000

### Q3: 训练时显存不足？

**A**: 尝试：
1. 减小 batch_size（如 32 → 16）
2. 使用更小的 VGG 版本（VGG-11）
3. 冻结更多层（减少梯度存储）

### Q4: 如何提取特征向量？

**A**:

```python
# 只使用 VGG 的特征提取部分
features = model.vgg.features  # 卷积层
avgpool = model.vgg.avgpool    # 自适应平均池化
flatten = nn.Flatten()

# 提取特征
x = features(input_image)     # [batch, 512, 7, 7]
x = avgpool(x)                # [batch, 512, 1, 1]
x = flatten(x)                # [batch, 512]
```

## 📊 性能参考

在 CIFAR-10 数据集上：

- **迁移学习** (冻结特征层):
  - 准确率: ~88-91% (5 epochs)
  - 训练时间: ~15 分钟/epoch (单 GPU)

- **全网络微调**:
  - 准确率: ~91-94% (30 epochs)
  - 训练时间: ~20 分钟/epoch

- **从头训练**:
  - 准确率: ~85-88% (100 epochs)
  - 不推荐（数据量要求高）
