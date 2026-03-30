# EfficientNet 高精度分类

## ✅ 测试环境

- torch: `2.9.1+cu128`
- torchvision: `0.24.1+cu128`
- torchaudio: `2.9.1+cu128`

## 📝 任务描述

使用 EfficientNet 实现高精度图像分类。EfficientNet 通过复合缩放达到最佳的精度-效率平衡。

## 🎨 画布配置

### 节点列表

仅需 1 个节点：**EfficientNet 模型节点**

### JSON 配置

```json
{
  "nodes": [
    {
      "id": "node_efficientnet_001",
      "name": "EfficientNet",
      "type": "efficientnet",
      "icon": "Lightning",
      "description": "高效的卷积神经网络",
      "category": "models",
      "position": { "x": 400, "y": 300 },
      "creationId": 1,
      "params": [
        {
          "key": "variant",
          "label": "变体",
          "type": "select",
          "value": "b0",
          "options": [
            { "label": "EfficientNet-B0", "value": "b0" },
            { "label": "EfficientNet-B1", "value": "b1" },
            { "label": "EfficientNet-B2", "value": "b2" },
            { "label": "EfficientNet-B3", "value": "b3" },
            { "label": "EfficientNet-B4", "value": "b4" },
            { "label": "EfficientNet-B5", "value": "b5" },
            { "label": "EfficientNet-B6", "value": "b6" },
            { "label": "EfficientNet-B7", "value": "b7" }
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
          "id": "input_efficientnet_001",
          "name": "input",
          "type": "input",
          "dataType": "tensor",
          "shape": [1, 3, 224, 224],
          "connectedTo": []
        }
      ],
      "outputs": [
        {
          "id": "output_efficientnet_001",
          "name": "output",
          "type": "output",
          "dataType": "tensor",
          "shape": [1, 10],
          "connectedTo": []
        }
      ],
      "metadata": {
        "framework": "pytorch",
        "layerType": "efficientnet",
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

| 参数            | 说明              | 推荐值 | 备注                |
| --------------- | ----------------- | ------ | ------------------- |
| **variant**     | EfficientNet 变体 | `"b0"` | B0-B7，越大精度越高 |
| **pretrained**  | 预训练权重        | `true` | 强烈建议开启        |
| **num_classes** | 分类数            | `10`   | 根据数据集设置      |

### 变体选择指南

| 变体   | 参数量   | 输入尺寸    | ImageNet Top-1 | 推理时间 | 适用场景     |
| ------ | -------- | ----------- | -------------- | -------- | ------------ |
| **B0** | **5.3M** | **224×224** | **77.1%**      | **10ms** | **标准配置** |
| B1     | 7.8M     | 240×240     | 79.1%          | 15ms     | 平衡性能     |
| B2     | 9.2M     | 260×260     | 80.1%          | 20ms     | 高精度需求   |
| B3     | 12M      | 300×300     | 81.6%          | 30ms     | 生产环境     |
| B4     | 19M      | 380×380     | 82.9%          | 50ms     | 科研应用     |
| B5     | 30M      | 456×456     | 83.6%          | 80ms     | 竞赛         |
| B6     | 43M      | 528×528     | 84.0%          | 120ms    | 顶级精度     |
| B7     | 66M      | 600×600     | 84.3%          | 180ms    | 极限性能     |

## 💻 生成的 PyTorch 代码

### model.py

```python
import torch
import torch.nn as nn
import torchvision.models as models

class CustomModel(nn.Module):
    def __init__(self):
        super(CustomModel, self).__init__()

        # EfficientNet-B0
        self.efficientnet = models.efficientnet_b0(pretrained=True)

        # 修改分类器
        num_ftrs = self.efficientnet.classifier[1].in_features
        self.efficientnet.classifier[1] = nn.Linear(num_ftrs, 10)

    def forward(self, x):
        x = self.efficientnet(x)
        return x

if __name__ == '__main__':
    model = CustomModel()
    print(f"参数量: {sum(p.numel() for p in model.parameters()) / 1e6:.2f}M")

    # 测试
    dummy_input = torch.randn(1, 3, 224, 224)
    output = model(dummy_input)
    print(f"Output shape: {output.shape}")  # torch.Size([1, 10])
```

### requirements.txt

```
torch>=1.9.0
torchvision>=0.11.0
```

**注意**: EfficientNet 需要 `torchvision>=0.11.0`！

## 🚀 使用步骤

### 1. 在画布中操作

1. 拖拽 **EfficientNet** 到画布
2. 配置参数：
   - 变体：`EfficientNet-B0`
   - 预训练权重：✅
   - 分类数：`10`

### 2. 导出并测试

```bash
pip install -r requirements.txt
python model.py
```

## 📈 训练示例

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from model import CustomModel

# 数据预处理 (使用 AutoAugment)
transform_train = transforms.Compose([
    transforms.Resize(224),
    transforms.RandomHorizontalFlip(),
    transforms.AutoAugment(transforms.AutoAugmentPolicy.CIFAR10),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# 加载数据
train_dataset = datasets.CIFAR10(root='./data', train=True,
                                  download=True, transform=transform_train)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=4)

# 初始化模型
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = CustomModel().to(device)

# 损失函数和优化器
criterion = nn.CrossEntropyLoss(label_smoothing=0.1)  # Label smoothing
optimizer = optim.Adam(model.parameters(), lr=0.001)
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=10)

# 训练循环
for epoch in range(10):
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

    scheduler.step()

    epoch_loss = running_loss / len(train_loader)
    epoch_acc = 100. * correct / total
    print(f'Epoch {epoch+1}: Loss={epoch_loss:.4f}, Acc={epoch_acc:.2f}%')

# 保存模型
torch.save(model.state_dict(), 'efficientnet_b0_cifar10.pth')
```

## 🎯 最佳实践

### 1. 复合缩放原理

EfficientNet 的核心是**复合缩放**，同时缩放：
- **深度** (层数)
- **宽度** (通道数)
- **分辨率** (输入尺寸)

不同变体已经过优化，直接使用即可。

### 2. 数据增强

EfficientNet 在训练时使用了强大的数据增强：

```python
transforms.Compose([
    transforms.Resize(224),
    transforms.RandomHorizontalFlip(),
    transforms.AutoAugment(transforms.AutoAugmentPolicy.IMAGENET),  # 自动增强
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])
```

### 3. 不同输入尺寸

不同变体需要不同的输入尺寸：

```python
# B0: 224×224
transform = transforms.Resize(224)

# B1: 240×240
transform = transforms.Resize(240)

# B3: 300×300
transform = transforms.Resize(300)

# 以此类推...
```

### 4. 特征金字塔网络 (FPN)

```python
# 提取多尺度特征
class EfficientNetFPN(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = models.efficientnet_b0(pretrained=True).features

    def forward(self, x):
        features = []
        for i, layer in enumerate(self.backbone):
            x = layer(x)
            if i in [3, 5, 7]:  # 提取不同层的特征
                features.append(x)
        return features
```

## ⚠️ 常见问题

### Q1: 为什么 EfficientNet 需要更高版本的 torchvision？

**A**: EfficientNet 在 torchvision 0.11.0 中引入，使用了新的 API。

### Q2: B0-B7 如何选择？

**A**:
- **快速原型**: B0
- **生产环境**: B0/B1
- **高精度需求**: B3/B4
- **科研竞赛**: B5-B7

### Q3: EfficientNet 比 ResNet 好在哪里？

**A**:
- **参数效率**: 同等精度下参数量更少
- **推理速度**: 更快（针对移动端优化）
- **精度**: ImageNet 上 B7 达到 84.3% (ResNet-152: 78.3%)

### Q4: 如何处理显存不足？

**A**:
1. 使用更小的变体 (B0/B1)
2. 减小 batch_size
3. 使用梯度累积
4. 启用混合精度训练 (AMP)

```python
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()

for inputs, labels in train_loader:
    with autocast():
        outputs = model(inputs)
        loss = criterion(outputs, labels)

    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

## 📊 性能对比

### CIFAR-10 数据集

| 模型            | 准确率 | 参数量 | 推理时间 |
| --------------- | ------ | ------ | -------- |
| EfficientNet-B0 | 92.3%  | 5.3M   | 10ms     |
| EfficientNet-B1 | 93.1%  | 7.8M   | 15ms     |
| ResNet-50       | 91.8%  | 25.6M  | 25ms     |
| MobileNet V2    | 91.2%  | 3.5M   | 8ms      |

### 模型对比（ImageNet）

| 模型               | Top-1 精度 | 参数量 | FLOPs |
| ------------------ | ---------- | ------ | ----- |
| EfficientNet-B0    | 77.1%      | 5.3M   | 0.39B |
| ResNet-50          | 76.2%      | 25.6M  | 4.1B  |
| MobileNet V2 (1.4) | 74.7%      | 6.1M   | 0.58B |

EfficientNet-B0 用更少的参数和计算量达到更高的精度！

## 🔗 相关资源

- [EfficientNet 论文](https://arxiv.org/abs/1905.11946)
- [torchvision EfficientNet](https://pytorch.org/vision/stable/models/efficientnet.html)
- [AutoAugment](https://pytorch.org/vision/stable/transforms.html#torchvision.transforms.AutoAugment)
