// src/utils/pytorch-templates.ts
export class PyTorchTemplates {
  // 基础模板
  static MODEL_TEMPLATE = `import torch
import torch.nn as nn
import torch.nn.functional as F
{imports}

class {model_name}(nn.Module):
    def __init__(self, num_classes={num_classes}):
        super({model_name}, self).__init__()
        self.num_classes = num_classes
        {layers}
    
    def forward(self, x):
        {forward_logic}
        return x
    
    def summary(self):
        """打印模型摘要"""
        print("Model: {model_name}")
        print("=" * 60)
        {summary_content}
        print("=" * 60)
        total_params = sum(p.numel() for p in self.parameters())
        trainable_params = sum(p.numel() for p in self.parameters() if p.requires_grad)
        print(f"Total parameters: {{total_params:,}}")
        print(f"Trainable parameters: {{trainable_params:,}}")
        print(f"Non-trainable parameters: {{total_params - trainable_params:,}}")
`

  // 层模板映射
  static LAYER_TEMPLATES = {
    // 卷积层
    'conv1d': (params: any, name: string) => `self.${name} = nn.Conv1d(
    in_channels=${params.in_channels || 1},
    out_channels=${params.out_channels || 64},
    kernel_size=${params.kernel_size || 3},
    stride=${params.stride || 1},
    padding=${this.getPadding(params)},
    dilation=${params.dilation || 1},
    groups=${params.groups || 1},
    bias=${params.bias !== false}
)`,

    'conv2d': (params: any, name: string) => `self.${name} = nn.Conv2d(
    in_channels=${params.in_channels || 3},
    out_channels=${params.out_channels || 64},
    kernel_size=${params.kernel_size || 3},
    stride=${params.stride || 1},
    padding=${this.getPadding(params)},
    dilation=${params.dilation || 1},
    groups=${params.groups || 1},
    bias=${params.bias !== false}
)`,

    // 线性层
    'linear': (params: any, name: string) => `self.${name} = nn.Linear(
    in_features=${params.in_features || 512},
    out_features=${params.out_features || 256},
    bias=${params.bias !== false}
)`,

    // 批归一化
    'batchnorm2d': (params: any, name: string) => `self.${name} = nn.BatchNorm2d(
    num_features=${params.num_features || 64},
    eps=${params.eps || 1e-5},
    momentum=${params.momentum || 0.1},
    affine=${params.affine !== false},
    track_running_stats=${params.track_running_stats !== false}
)`,

    // LSTM
    'lstm': (params: any, name: string) => `self.${name} = nn.LSTM(
    input_size=${params.input_size || 128},
    hidden_size=${params.hidden_size || 256},
    num_layers=${params.num_layers || 1},
    batch_first=${params.batch_first || true},
    dropout=${params.dropout || 0},
    bidirectional=${params.bidirectional || false},
    bias=${params.bias !== false}
)`,

    // Dropout
    'dropout': (params: any, name: string) => `self.${name} = nn.Dropout(
    p=${params.p || 0.5},
    inplace=${params.inplace || false}
)`,

    // 多头注意力
    'multihead_attention': (params: any, name: string) => `self.${name} = nn.MultiheadAttention(
    embed_dim=${params.embed_dim || 512},
    num_heads=${params.num_heads || 8},
    dropout=${params.dropout || 0.1},
    bias=${params.bias !== false},
    add_bias_kv=${params.add_bias_kv || false},
    add_zero_attn=${params.add_zero_attn || false},
    kdim=${params.kdim ? params.kdim : 'None'},
    vdim=${params.vdim ? params.vdim : 'None'}
)`,

    // 更多模板...
  }

  // 前向传播模板
  static FORWARD_TEMPLATES = {
    'conv2d': (name: string) => `x = self.${name}(x)`,
    'batchnorm2d': (name: string) => `x = self.${name}(x)`,
    'relu': (name: string) => `x = F.relu(x)`,
    'maxpool2d': (name: string) => `x = self.${name}(x)`,
    'dropout': (name: string) => `x = self.${name}(x)`,
    'flatten': (name: string) => `x = x.view(x.size(0), -1)`,
    'linear': (name: string) => `x = self.${name}(x)`,
    'lstm': (name: string) => `x, _ = self.${name}(x)`,
    'multihead_attention': (name: string, node: any) => {
      const [batch, seq, features] = this.estimateShape(node)
      return `# 多头注意力
        # 输入形状: [batch_size=${batch}, seq_len=${seq}, features=${features}]
        # 需要转换为: [seq_len, batch_size, features]
        attn_input = x.permute(1, 0, 2) if x.dim() == 3 else x
        attn_output, attn_weights = self.${name}(attn_input, attn_input, attn_input)
        x = attn_output.permute(1, 0, 2) if x.dim() == 3 else attn_output`
    }
  }

  // 训练模板
  static TRAINING_TEMPLATE = `import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms, datasets
import numpy as np
import matplotlib.pyplot as plt
from tqdm import tqdm
import os
import time

class Trainer:
    def __init__(self, model, device='cuda' if torch.cuda.is_available() else 'cpu'):
        self.model = model.to(device)
        self.device = device
        self.history = {
            'train_loss': [], 'train_acc': [],
            'val_loss': [], 'val_acc': [],
            'learning_rates': []
        }
        
    def train_epoch(self, train_loader, criterion, optimizer, scheduler=None):
        self.model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        pbar = tqdm(train_loader, desc='Training')
        for batch_idx, (inputs, targets) in enumerate(pbar):
            inputs, targets = inputs.to(self.device), targets.to(self.device)
            
            optimizer.zero_grad()
            outputs = self.model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()
            
            pbar.set_postfix({
                'loss': f'{loss.item():.4f}',
                'acc': f'{100.*correct/total:.2f}%'
            })
        
        if scheduler:
            scheduler.step()
            self.history['learning_rates'].append(scheduler.get_last_lr()[0])
        
        epoch_loss = running_loss / len(train_loader)
        epoch_acc = 100. * correct / total
        return epoch_loss, epoch_acc
    
    def validate(self, val_loader, criterion):
        self.model.eval()
        running_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs, targets = inputs.to(self.device), targets.to(self.device)
                outputs = self.model(inputs)
                loss = criterion(outputs, targets)
                
                running_loss += loss.item()
                _, predicted = outputs.max(1)
                total += targets.size(0)
                correct += predicted.eq(targets).sum().item()
        
        epoch_loss = running_loss / len(val_loader)
        epoch_acc = 100. * correct / total
        return epoch_loss, epoch_acc
    
    def train(self, train_loader, val_loader, epochs=10, 
              lr=0.001, weight_decay=0.0001):
        
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.AdamW(self.model.parameters(), lr=lr, weight_decay=weight_decay)
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
        
        print(f"Training on {self.device}")
        print(f"Total parameters: {sum(p.numel() for p in self.model.parameters()):,}")
        
        for epoch in range(epochs):
            print(f"\\nEpoch {epoch+1}/{epochs}")
            print("-" * 50)
            
            # 训练
            train_loss, train_acc = self.train_epoch(train_loader, criterion, optimizer, scheduler)
            self.history['train_loss'].append(train_loss)
            self.history['train_acc'].append(train_acc)
            
            # 验证
            val_loss, val_acc = self.validate(val_loader, criterion)
            self.history['val_loss'].append(val_loss)
            self.history['val_acc'].append(val_acc)
            
            print(f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%")
            print(f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}%")
            print(f"LR: {scheduler.get_last_lr()[0]:.6f}")
            
            # 保存最佳模型
            if val_acc == max(self.history['val_acc']):
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': self.model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'val_acc': val_acc,
                }, 'best_model.pth')
        
        return self.history
    
    def plot_training_history(self):
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
        
        epochs = range(1, len(self.history['train_loss']) + 1)
        
        # 损失图
        ax1.plot(epochs, self.history['train_loss'], 'b-', label='Training Loss')
        ax1.plot(epochs, self.history['val_loss'], 'r-', label='Validation Loss')
        ax1.set_title('Training and Validation Loss')
        ax1.set_xlabel('Epochs')
        ax1.set_ylabel('Loss')
        ax1.legend()
        ax1.grid(True)
        
        # 准确率图
        ax2.plot(epochs, self.history['train_acc'], 'b-', label='Training Accuracy')
        ax2.plot(epochs, self.history['val_acc'], 'r-', label='Validation Accuracy')
        ax2.set_title('Training and Validation Accuracy')
        ax2.set_xlabel('Epochs')
        ax2.set_ylabel('Accuracy (%)')
        ax2.legend()
        ax2.grid(True)
        
        plt.tight_layout()
        plt.savefig('training_history.png', dpi=150)
        plt.show()

def prepare_cifar10_data(batch_size=32):
    """准备CIFAR-10数据集"""
    transform_train = transforms.Compose([
        transforms.RandomCrop(32, padding=4),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
    ])
    
    transform_test = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
    ])
    
    train_dataset = datasets.CIFAR10(
        root='./data', train=True, download=True, transform=transform_train
    )
    test_dataset = datasets.CIFAR10(
        root='./data', train=False, download=True, transform=transform_test
    )
    
    train_loader = DataLoader(
        train_dataset, batch_size=batch_size, shuffle=True, num_workers=2
    )
    test_loader = DataLoader(
        test_dataset, batch_size=batch_size, shuffle=False, num_workers=2
    )
    
    return train_loader, test_loader

def prepare_mnist_data(batch_size=32):
    """准备MNIST数据集"""
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])
    
    train_dataset = datasets.MNIST(
        root='./data', train=True, download=True, transform=transform
    )
    test_dataset = datasets.MNIST(
        root='./data', train=False, download=True, transform=transform
    )
    
    train_loader = DataLoader(
        train_dataset, batch_size=batch_size, shuffle=True, num_workers=2
    )
    test_loader = DataLoader(
        test_dataset, batch_size=batch_size, shuffle=False, num_workers=2
    )
    
    return train_loader, test_loader

if __name__ == '__main__':
    # 创建模型
    from model import {model_name}
    model = {model_name}(num_classes=10)
    
    # 准备数据
    print("Preparing data...")
    train_loader, test_loader = prepare_cifar10_data(batch_size=32)
    
    # 训练
    trainer = Trainer(model)
    history = trainer.train(
        train_loader=train_loader,
        val_loader=test_loader,
        epochs=50,
        lr=0.001,
        weight_decay=0.0001
    )
    
    # 绘制训练历史
    trainer.plot_training_history()
    
    # 保存最终模型
    torch.save({
        'model_state_dict': model.state_dict(),
        'history': history,
        'config': {}
    }, 'final_model.pth')
    print("Model saved to final_model.pth")
`

  // 推理模板
  static INFERENCE_TEMPLATE = `import torch
import torch.nn.functional as F
from PIL import Image
import torchvision.transforms as transforms
import numpy as np

class InferenceEngine:
    def __init__(self, model_path, model_class, device=None):
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = device
        
        # 加载模型
        self.model = self.load_model(model_path, model_class)
        self.model.eval()
        
        # 类别标签
        self.class_names = ['airplane', 'automobile', 'bird', 'cat', 'deer',
                           'dog', 'frog', 'horse', 'ship', 'truck']
    
    def load_model(self, model_path, model_class):
        """加载预训练模型"""
        checkpoint = torch.load(model_path, map_location=self.device)
        model = model_class()
        model.load_state_dict(checkpoint['model_state_dict'])
        return model.to(self.device)
    
    def preprocess_image(self, image_path, img_size=32):
        """预处理图像"""
        transform = transforms.Compose([
            transforms.Resize((img_size, img_size)),
            transforms.ToTensor(),
            transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
        ])
        
        image = Image.open(image_path).convert('RGB')
        input_tensor = transform(image).unsqueeze(0)  # 添加批次维度
        return input_tensor.to(self.device)
    
    def predict_single(self, image_path):
        """单张图像预测"""
        input_tensor = self.preprocess_image(image_path)
        
        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = F.softmax(outputs, dim=1)
            _, predicted = outputs.max(1)
        
        return {
            'predicted_class': predicted.item(),
            'class_name': self.class_names[predicted.item()],
            'confidence': probabilities[0][predicted.item()].item(),
            'all_probabilities': probabilities.cpu().numpy()[0]
        }
    
    def predict_batch(self, image_paths):
        """批量预测"""
        batch_tensors = []
        for img_path in image_paths:
            tensor = self.preprocess_image(img_path)
            batch_tensors.append(tensor)
        
        batch = torch.cat(batch_tensors, dim=0)
        
        with torch.no_grad():
            outputs = self.model(batch)
            probabilities = F.softmax(outputs, dim=1)
            _, predicted = outputs.max(1)
        
        results = []
        for i in range(len(image_paths)):
            results.append({
                'image_path': image_paths[i],
                'predicted_class': predicted[i].item(),
                'class_name': self.class_names[predicted[i].item()],
                'confidence': probabilities[i][predicted[i].item()].item()
            })
        
        return results
    
    def get_topk_predictions(self, image_path, k=5):
        """获取Top-K预测"""
        input_tensor = self.preprocess_image(image_path)
        
        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = F.softmax(outputs, dim=1)
            topk_probs, topk_indices = probabilities.topk(k, dim=1)
        
        topk_results = []
        for i in range(k):
            topk_results.append({
                'rank': i + 1,
                'class_index': topk_indices[0][i].item(),
                'class_name': self.class_names[topk_indices[0][i].item()],
                'probability': topk_probs[0][i].item()
            })
        
        return topk_results
    
    def visualize_attention(self, image_path, layer_name='attention'):
        """可视化注意力（如果模型有注意力层）"""
        # 这里需要模型支持注意力可视化
        pass

def run_inference_demo():
    """运行推理演示"""
    import matplotlib.pyplot as plt
    import glob
    
    # 初始化推理引擎
    from model import {model_name}
    engine = InferenceEngine('best_model.pth', {model_name})
    
    # 单张图像推理
    print("Single Image Inference:")
    print("-" * 40)
    
    # 使用示例图像或提示用户上传
    example_images = glob.glob('example_*.jpg')[:3]
    
    if example_images:
        for img_path in example_images:
            result = engine.predict_single(img_path)
            print(f"Image: {img_path}")
            print(f"Predicted: {result['class_name']} (confidence: {result['confidence']:.2%})")
            
            # 显示Top-3预测
            topk = engine.get_topk_predictions(img_path, k=3)
            print("Top-3 predictions:")
            for pred in topk:
                print(f"  {pred['rank']}. {pred['class_name']}: {pred['probability']:.2%}")
            print()
    else:
        print("No example images found. Please add some 'example_*.jpg' files.")
        print("Generating sample predictions with random data...")
        
        # 生成随机数据进行演示
        random_input = torch.randn(1, 3, 32, 32).to(engine.device)
        with torch.no_grad():
            outputs = engine.model(random_input)
            probabilities = F.softmax(outputs, dim=1)
            _, predicted = outputs.max(1)
        
        print(f"Random input prediction: {engine.class_names[predicted.item()]}")
        print(f"Confidence: {probabilities[0][predicted.item()].item():.2%}")
    
    # 批量推理示例
    print("\\nBatch Inference Example:")
    print("-" * 40)
    
    # 创建虚拟图像路径进行演示
    demo_paths = ['demo1.jpg', 'demo2.jpg', 'demo3.jpg']
    print(f"Would process {len(demo_paths)} images in batch mode")
    print("(Add real images to see actual predictions)")

if __name__ == '__main__':
    run_inference_demo()
`

  // 工具方法
  static getPadding(params: any): string {
    if (params.padding === 'same') {
      return "'same'"
    } else if (params.padding === 'valid') {
      return '0'
    } else {
      return params.padding || '0'
    }
  }

  static estimateShape(node: any): [number, number, number] {
    // 根据节点类型和参数估计形状
    switch (node.type) {
      case 'conv2d':
        return [32, 32, node.params.find((p: any) => p.key === 'out_channels')?.value || 64]
      case 'linear':
        return [1, 1, node.params.find((p: any) => p.key === 'out_features')?.value || 256]
      case 'lstm':
        return [32, 100, node.params.find((p: any) => p.key === 'hidden_size')?.value || 256]
      default:
        return [32, 32, 64]
    }
  }
}