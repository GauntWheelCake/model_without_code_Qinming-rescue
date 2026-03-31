# ResNet 图像分类

## ✅ 测试环境

- torch: `2.9.1+cu128`
- torchvision: `0.24.1+cu128`
- torchaudio: `2.9.1+cu128`

## 📝 任务描述

使用 ResNet 进行图像分类任务，这是最简单的配置方式，仅需要一个 ResNet 节点即可。

## 🎨 画布配置

### 节点列表

仅需 1 个节点：**ResNet 模型节点**

### JSON 配置

```json
{
  "nodes": [
    {
      "id": "node_resnet_001",
      "name": "ResNet",
      "type": "resnet",
      "icon": "Tickets",
      "description": "残差神经网络",
      "category": "models",
      "position": { "x": 400, "y": 300 },
      "creationId": 1,
      "params": [
        {
          "key": "num_layers",
          "label": "层数",
          "type": "select",
          "value": "18",
          "options": [
            { "label": "ResNet-18", "value": "18" },
            { "label": "ResNet-34", "value": "34" },
            { "label": "ResNet-50", "value": "50" },
            { "label": "ResNet-101", "value": "101" },
            { "label": "ResNet-152", "value": "152" }
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
          "id": "input_resnet_001",
          "name": "input",
          "type": "input",
          "dataType": "tensor",
          "shape": [1, 3, 224, 224],
          "connectedTo": []
        }
      ],
      "outputs": [
        {
          "id": "output_resnet_001",
          "name": "output",
          "type": "output",
          "dataType": "tensor",
          "shape": [1, 10],
          "connectedTo": []
        }
      ],
      "metadata": {
        "framework": "pytorch",
        "layerType": "resnet",
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

| 参数            | 说明               | 推荐值 | 备注                                      |
| --------------- | ------------------ | ------ | ----------------------------------------- |
| **num_layers**  | ResNet 层数        | `"18"` | 层数越深，精度越高但速度越慢              |
| **pretrained**  | 是否使用预训练权重 | `true` | 迁移学习时建议开启                        |
| **num_classes** | 输出类别数         | `10`   | 根据数据集类别数设置（如 CIFAR-10 为 10） |

## 📊 输入输出

- **输入形状**: `[batch_size, 3, 224, 224]`
  - `batch_size`: 批次大小（训练时可调）
  - `3`: RGB 三通道
  - `224×224`: 图像尺寸

- **输出形状**: `[batch_size, num_classes]`
  - `batch_size`: 与输入相同
  - `num_classes`: 类别数（此例为 10）

## 💻 生成的 PyTorch 代码

### model.py

```python
import torch
import torch.nn as nn
import torchvision.models as models

class CustomModel(nn.Module):
    def __init__(self):
        super(CustomModel, self).__init__()

        # ResNet-18
        self.resnet = models.resnet18(pretrained=True)

        # 修改最后的全连接层以适应 num_classes
        num_ftrs = self.resnet.fc.in_features
        self.resnet.fc = nn.Linear(num_ftrs, 10)

    def forward(self, x):
        x = self.resnet(x)
        return x

if __name__ == '__main__':
    model = CustomModel()
    print(model)

    # 测试前向传播
    dummy_input = torch.randn(1, 3, 224, 224)
    output = model(dummy_input)
    print(f"Output shape: {output.shape}")  # torch.Size([1, 10])
```

### requirements.txt

```
torch>=1.9.0
torchvision>=0.10.0
```

## 🚀 使用步骤

### 1. 在画布中操作

1. 从左侧组件面板找到 **"预训练模型"** 分类
2. 拖拽 **ResNet** 组件到画布
3. 点击节点，在右侧参数面板配置：
   - 层数：选择 `ResNet-18`
   - 预训练权重：勾选 ✅
   - 分类数：输入 `10`

### 2. 导出代码

点击顶部 **"生成代码"** 按钮

### 3. 本地测试

```bash
# 安装依赖（推荐）
pip install -r requirements.txt

# 你的环境版本已满足要求，可直接测试
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

# 数据预处理
transform = transforms.Compose([
    transforms.Resize(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# 加载 CIFAR-10 数据集
train_dataset = datasets.CIFAR10(root='./data', train=True,
                                  download=True, transform=transform)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)

# 初始化模型
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = CustomModel().to(device)

# 损失函数和优化器
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 训练循环
model.train()
for epoch in range(5):
    running_loss = 0.0
    for inputs, labels in train_loader:
        inputs, labels = inputs.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()

    print(f'Epoch {epoch+1}, Loss: {running_loss/len(train_loader):.4f}')

# 保存模型
torch.save(model.state_dict(), 'resnet18_cifar10.pth')
```

## 🎯 最佳实践

### 微调策略

如果使用预训练权重进行迁移学习，建议：

```python
# 冻结特征提取层，只训练分类器
for param in model.resnet.parameters():
    param.requires_grad = False

# 只训练最后的 fc 层
for param in model.resnet.fc.parameters():
    param.requires_grad = True

# 优化器只优化需要训练的参数
optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=0.001)
```

### 选择合适的 ResNet 版本

| 版本       | 参数量 | 速度 | 精度 | 适用场景         |
| ---------- | ------ | ---- | ---- | ---------------- |
| ResNet-18  | 11.7M  | 快   | 中   | 快速原型、移动端 |
| ResNet-34  | 21.8M  | 中快 | 中高 | 平衡性能和速度   |
| ResNet-50  | 25.6M  | 中   | 高   | 生产环境推荐     |
| ResNet-101 | 44.5M  | 慢   | 很高 | 高精度需求       |
| ResNet-152 | 60.2M  | 很慢 | 极高 | 科研、竞赛       |

## ⚠️ 常见问题

### Q: 输入图像尺寸必须是 224×224 吗？

**A**: 不是必须的，但建议使用 224×224 或 32 的倍数（如 256×256）。预训练权重是在 224×224 上训练的，使用相同尺寸效果更好。

### Q: 如何处理不同大小的输入图像？

**A**: 使用 `transforms.Resize(224)` 在数据预处理时统一调整大小。

### Q: 预训练权重从哪里下载？

**A**: torchvision 会自动从 PyTorch 官方服务器下载权重到 `~/.cache/torch/hub/checkpoints/`。如果网络受限，可以手动下载后放到该目录。

## 📊 性能参考

在 CIFAR-10 数据集上的预期性能：

- **ImageNet 预训练 + 微调**: ~90-93% 准确率（5 epochs）
- **从头训练**: ~80-85% 准确率（50 epochs）
- **训练时间** (单 GPU GTX 1080 Ti):
  - ResNet-18: ~10 分钟/epoch
  - ResNet-50: ~20 分钟/epoch
