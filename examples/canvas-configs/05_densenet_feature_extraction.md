# DenseNet 特征提取

## ✅ 测试环境

- torch: `2.9.1+cu128`
- torchvision: `0.24.1+cu128`
- torchaudio: `2.9.1+cu128`

## 📝 任务描述

使用 DenseNet 进行特征提取和分类。DenseNet 通过密集连接实现特征复用，适合医学影像等领域。

## 🎨 画布配置

### 节点列表

仅需 1 个节点：**DenseNet 模型节点**

### JSON 配置

```json
{
  "nodes": [
    {
      "id": "node_densenet_001",
      "name": "DenseNet",
      "type": "densenet",
      "icon": "Connection",
      "description": "密集连接卷积网络",
      "category": "models",
      "position": { "x": 400, "y": 300 },
      "creationId": 1,
      "params": [
        {
          "key": "num_layers",
          "label": "层数",
          "type": "select",
          "value": "121",
          "options": [
            { "label": "DenseNet-121", "value": "121" },
            { "label": "DenseNet-161", "value": "161" },
            { "label": "DenseNet-169", "value": "169" },
            { "label": "DenseNet-201", "value": "201" }
          ]
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
          "value": 10,
          "min": 1,
          "max": 10000,
          "step": 1
        }
      ],
      "inputs": [
        {
          "id": "input_densenet_001",
          "name": "input",
          "type": "input",
          "dataType": "tensor",
          "shape": [1, 3, 224, 224],
          "connectedTo": []
        }
      ],
      "outputs": [
        {
          "id": "output_densenet_001",
          "name": "output",
          "type": "output",
          "dataType": "tensor",
          "shape": [1, 10],
          "connectedTo": []
        }
      ],
      "metadata": {
        "framework": "pytorch",
        "layerType": "densenet",
        "requiresTorchvision": true,
        "defaultInputShape": [1, 3, 224, 224],
        "defaultOutputShape": [1, 10]
      }
    }
  ],
  "connections": []
}
```

## 🔧 参数说明

| 参数            | 说明          | 推荐值  | 备注           |
| --------------- | ------------- | ------- | -------------- |
| **num_layers**  | DenseNet 层数 | `"121"` | 层数越多越精确 |
| **pretrained**  | 预训练权重    | `true`  | 强烈推荐       |
| **num_classes** | 分类数        | `10`    | 根据任务设置   |

### 版本选择

| 版本             | 参数量   | 深度    | Growth Rate | ImageNet Top-1 | 适用场景     |
| ---------------- | -------- | ------- | ----------- | -------------- | ------------ |
| **DenseNet-121** | **8.0M** | **121** | **32**      | **74.4%**      | **标准配置** |
| DenseNet-161     | 28.7M    | 161     | 48          | 77.1%          | 高精度需求   |
| DenseNet-169     | 14.1M    | 169     | 32          | 75.6%          | 平衡选择     |
| DenseNet-201     | 20.0M    | 201     | 32          | 76.9%          | 深度模型     |

## 💻 生成的 PyTorch 代码

### model.py

```python
import torch
import torch.nn as nn
import torchvision.models as models

class CustomModel(nn.Module):
    def __init__(self):
        super(CustomModel, self).__init__()

        # DenseNet-121
        self.densenet = models.densenet121(pretrained=True)

        # 修改分类器
        num_ftrs = self.densenet.classifier.in_features
        self.densenet.classifier = nn.Linear(num_ftrs, 10)

    def forward(self, x):
        x = self.densenet(x)
        return x

    def extract_features(self, x):
        """提取特征向量（不经过分类器）"""
        features = self.densenet.features(x)
        out = nn.functional.relu(features, inplace=True)
        out = nn.functional.adaptive_avg_pool2d(out, (1, 1))
        out = torch.flatten(out, 1)
        return out

if __name__ == '__main__':
    model = CustomModel()
    print(f"参数量: {sum(p.numel() for p in model.parameters()) / 1e6:.2f}M")

    # 测试分类
    dummy_input = torch.randn(1, 3, 224, 224)
    output = model(dummy_input)
    print(f"分类输出: {output.shape}")  # torch.Size([1, 10])

    # 测试特征提取
    features = model.extract_features(dummy_input)
    print(f"特征向量: {features.shape}")  # torch.Size([1, 1024])
```

### requirements.txt

```
torch>=1.9.0
torchvision>=0.10.0
```

## 🚀 使用步骤

### 1. 在画布中操作

1. 拖拽 **Dense** 到画布
2. 配置参数：
   - 层数：`DenseNet-121`
   - 预训练权重：✅
   - 分类数：`10`

### 2. 导出并测试

```bash
pip install -r requirements.txt
python model.py
```

## 📈 训练示例（医学影像分类）

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from model import CustomModel

# 数据预处理（医学影像增强）
transform_train = transforms.Compose([
    transforms.Resize(224),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),  # 医学影像可以垂直翻转
    transforms.RandomRotation(15),     # 旋转增强
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# 加载数据
train_dataset = datasets.ImageFolder(root='./medical_data/train', transform=transform_train)
train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True, num_workers=4)

# 初始化模型
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = CustomModel().to(device)

# 类别不平衡问题：使用加权损失
class_weights = torch.tensor([1.0, 2.5, 1.5, ...]).to(device)  # 根据数据集调整
criterion = nn.CrossEntropyLoss(weight=class_weights)

# 优化器：使用不同学习率
optimizer = optim.Adam([
    {'params': model.densenet.features.parameters(), 'lr': 1e-4},  # 特征层小学习率
    {'params': model.densenet.classifier.parameters(), 'lr': 1e-3}  # 分类器大学习率
], weight_decay=1e-4)

# 训练循环
for epoch in range(20):
    model.train()
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
torch.save(model.state_dict(), 'densenet121_medical.pth')
```

## 🎯 最佳实践

### 1. 密集连接的优势

DenseNet 的密集连接：
- ✅ 缓解梯度消失
- ✅ 特征复用，参数高效
- ✅ 适合小数据集（医学影像常见）

### 2. 特征提取用于下游任务

```python
# 提取特征用于相似度检索
model.eval()
features_list = []

with torch.no_grad():
    for images, _ in dataloader:
        features = model.extract_features(images.to(device))
        features_list.append(features.cpu().numpy())

# 计算相似度
from sklearn.metrics.pairwise import cosine_similarity
similarity_matrix = cosine_similarity(features_list)
```

### 3. 渐进式微调

```python
# 阶段 1: 冻结特征层，只训练分类器
for param in model.densenet.features.parameters():
    param.requires_grad = False

# 训练 5 epochs...

# 阶段 2: 解冻最后几个 DenseBlock
for name, param in model.densenet.features.named_parameters():
    if 'denseblock4' in name or 'transition3' in name:
        param.requires_grad = True

# 继续训练 10 epochs...
```

### 4. 医学影像最佳配置

```python
# 推荐配置
config = {
    "num_layers": "121",      # DenseNet-121 参数量适中
    "pretrained": True,       # 即使是医学影像也建议用预训练
    "num_classes": 2-10,      # 医学影像通常是少类别
    "batch_size": 16,         # 显存允许尽量大
    "img_size": 224,          # 标准尺寸
    "data_augmentation": [    # 强数据增强
        "RandomHorizontalFlip",
        "RandomVerticalFlip",
        "RandomRotation(15)",
        "ColorJitter"
    ]
}
```

## ⚠️ 常见问题

### Q1: DenseNet 比 ResNet 好在哪里？

**A**:
- **参数效率**: DenseNet-121 (8M) 精度高于 ResNet-50 (25.6M)
- **特征复用**: 每层都能访问所有前层特征
- **梯度流**: 密集连接缓解梯度消失

但 DenseNet 显存占用更大（需要保存所有中间特征）。

### Q2: 为什么适合医学影像？

**A**:
1. 医学数据集通常较小，DenseNet 参数高效不易过拟合
2. 密集连接保留细节特征，适合病灶检测
3. 特征提取能力强，适合少样本学习

### Q3: 显存不足怎么办？

**A**:
```python
# 启用内存高效模式
model = models.densenet121(pretrained=True, memory_efficient=True)

# 或减小 batch_size
train_loader = DataLoader(dataset, batch_size=8)  # 降低到 8

# 或使用梯度检查点
from torch.utils.checkpoint import checkpoint
```

### Q4: 如何可视化密集连接？

**A**:
```python
# 查看 DenseNet 结构
print(model.densenet.features)

# DenseNet 由多个 DenseBlock 和 Transition 层组成
# DenseBlock: 密集连接的卷积层
# Transition: 降维和下采样
```

## 📊 性能对比

### CIFAR-10 数据集

| 模型            | 准确率 | 参数量 | 显存占用 | 训练时间     |
| --------------- | ------ | ------ | -------- | ------------ |
| DenseNet-121    | 92.5%  | 8.0M   | 3.2GB    | 18 min/epoch |
| ResNet-50       | 91.8%  | 25.6M  | 2.8GB    | 20 min/epoch |
| EfficientNet-B0 | 92.3%  | 5.3M   | 2.5GB    | 15 min/epoch |

### 医学影像数据集（ChestX-ray14）

| 模型         | AUC   | 参数量 | 备注          |
| ------------ | ----- | ------ | ------------- |
| DenseNet-121 | 0.841 | 8.0M   | 官方 baseline |
| ResNet-50    | 0.822 | 25.6M  | 较低          |
| Inception-V3 | 0.813 | 23.8M  | 较低          |

DenseNet-121 在医学影像任务上表现优异！

### 小数据集（1000 张图）

| 模型         | 准确率 | 过拟合程度 |
| ------------ | ------ | ---------- |
| DenseNet-121 | 85.2%  | 低         |
| ResNet-50    | 81.5%  | 中         |
| VGG-16       | 78.3%  | 高         |

## 🔗 相关资源

- [DenseNet 论文](https://arxiv.org/abs/1608.06993)
- [医学影像应用](https://arxiv.org/abs/1711.05225)
- [Memory-Efficient DenseNet](https://arxiv.org/abs/1707.06990)
