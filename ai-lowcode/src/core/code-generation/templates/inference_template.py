"""
Inference Script Template
This file contains the template for model inference.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision
import torchvision.transforms as transforms
from PIL import Image
from model import {{MODEL_NAME}}


# 类别名称映射（根据您的数据集修改）
# CIFAR-10 示例
CLASS_NAMES = [
    'airplane', 'automobile', 'bird', 'cat', 'deer',
    'dog', 'frog', 'horse', 'ship', 'truck'
]


def predict(model, input_tensor):
    """
    使用模型进行推理
    Args:
        model: 训练好的模型
        input_tensor: 输入张量，形状为 [batch_size, channels, height, width]
    Returns:
        predictions: 预测结果
        probabilities: 预测概率
    """
    # 设置为评估模式
    model.eval()
    
    # 设备配置
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    input_tensor = input_tensor.to(device)
    
    with torch.no_grad():
        # 前向传播
        outputs = model(input_tensor)
        
        # 获取预测结果
        if outputs.dim() > 1 and outputs.shape[1] > 1:
            # 分类任务
            probabilities = F.softmax(outputs, dim=1)
            _, predictions = outputs.max(1)
        else:
            # 回归任务
            predictions = outputs
            probabilities = None
    
    return predictions, probabilities


def load_pretrained_model(model_path, model_class={{MODEL_NAME}}):
    """
    加载预训练模型
    Args:
        model_path: 模型文件路径
        model_class: 模型类
    Returns:
        model: 加载的模型
        history: 训练历史
        config: 模型配置
    """
    checkpoint = torch.load(model_path, map_location='cpu')
    
    # 创建模型
    model = model_class()
    
    # 加载权重
    model.load_state_dict(checkpoint['model_state_dict'])
    
    # 获取其他信息
    history = checkpoint.get('history', {})
    config = checkpoint.get('config', {})
    
    return model, history, config


def inference_example(class_names=None):
    """
    单张图像推理示例
    Args:
        class_names: 类别名称列表，如果为 None 则使用默认的 CIFAR-10 类别
    """
    # 使用传入的类别名称或默认类别
    if class_names is None:
        class_names = CLASS_NAMES
    
    # 加载模型
    model, _, _ = load_pretrained_model('trained_model.pth')
    
    # 图像预处理
    transform = transforms.Compose([
        transforms.Resize((32, 32)),  # 调整到模型期望的输入大小
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])
    
    # 加载图像
    image_path = 'example.png'
    image = Image.open(image_path).convert('RGB')
    input_tensor = transform(image).unsqueeze(0)  # 添加批次维度
    
    # 进行推理
    predictions, probabilities = predict(model, input_tensor)
    
    # 输出结果
    pred_idx = predictions.item()
    print(f"Input image: {image_path}")
    print(f"Prediction: Class {pred_idx}")
    
    # 显示类别名称（如果有）
    if pred_idx < len(class_names):
        print(f"Predicted class name: {class_names[pred_idx]}")
    
    if probabilities is not None:
        print(f"\nTop-5 probabilities:")
        top5_probs, top5_classes = probabilities.topk(min(5, len(class_names)))
        for prob, cls in zip(top5_probs[0], top5_classes[0]):
            cls_idx = cls.item()
            cls_name = class_names[cls_idx] if cls_idx < len(class_names) else f"Class {cls_idx}"
            print(f"  {cls_name:15s} (Class {cls_idx}): {prob.item():.4f} ({prob.item()*100:.2f}%)")
    
    return predictions, probabilities


def batch_inference_example(class_names=None, show_details=False):
    """
    批量推理示例
    Args:
        class_names: 类别名称列表，如果为 None 则使用默认的 CIFAR-10 类别
        show_details: 是否显示每个样本的详细预测结果
    """
    # 使用传入的类别名称或默认类别
    if class_names is None:
        class_names = CLASS_NAMES
    
    # 数据加载
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])
    
    test_dataset = torchvision.datasets.CIFAR10(
        root='./data',
        train=False,
        download=True,
        transform=transform
    )
    
    test_loader = torch.utils.data.DataLoader(
        test_dataset,
        batch_size=32,
        shuffle=False
    )
    
    # 加载模型
    model, _, _ = load_pretrained_model('trained_model.pth')
    
    # 评估模型
    model.eval()
    correct = 0
    total = 0
    
    # 用于统计每个类别的准确率
    class_correct = [0] * len(class_names)
    class_total = [0] * len(class_names)
    
    with torch.no_grad():
        for batch_idx, (images, labels) in enumerate(test_loader):
            predictions, _ = predict(model, images)
            # 将标签移到与预测结果相同的设备，避免设备不一致错误
            labels = labels.to(predictions.device)
            total += labels.size(0)
            correct += (predictions == labels).sum().item()
            
            # 统计每个类别的准确率
            for pred, label in zip(predictions, labels):
                label_idx = label.item()
                if label_idx < len(class_names):
                    class_total[label_idx] += 1
                    if pred == label:
                        class_correct[label_idx] += 1
            
            # 可选：显示部分样本的详细预测结果
            if show_details and batch_idx == 0:
                print(f"\nSample predictions from first batch:")
                for i in range(min(5, len(predictions))):
                    pred_idx = predictions[i].item()
                    true_idx = labels[i].item()
                    pred_name = class_names[pred_idx] if pred_idx < len(class_names) else f"Class {pred_idx}"
                    true_name = class_names[true_idx] if true_idx < len(class_names) else f"Class {true_idx}"
                    status = "✓" if pred_idx == true_idx else "✗"
                    print(f"  {status} Predicted: {pred_name:15s} | True: {true_name:15s}")
    
    # 避免除以零错误
    if total > 0:
        accuracy = 100. * correct / total
    else:
        accuracy = 0.0
    
    print(f"\n{'='*60}")
    print(f"Overall Test Accuracy: {accuracy:.2f}% ({correct}/{total})")
    print(f"{'='*60}")
    
    # 显示每个类别的准确率
    print(f"\nPer-class Accuracy:")
    print(f"{'-'*60}")
    for idx, (name, correct_count, total_count) in enumerate(zip(class_names, class_correct, class_total)):
        if total_count > 0:
            class_acc = 100. * correct_count / total_count
            print(f"  {name:15s}: {class_acc:6.2f}% ({correct_count:4d}/{total_count:4d})")
        else:
            print(f"  {name:15s}: N/A (no samples)")
    print(f"{'-'*60}")
    
    return accuracy


if __name__ == '__main__':
    # 单张图像推理
    print("=" * 60)
    print("Single Image Inference Example")
    print("=" * 60)
    predictions, probabilities = inference_example()
    
    print("\n" + "=" * 60)
    print("Batch Inference Example")
    print("=" * 60)
    accuracy = batch_inference_example(show_details=True)
