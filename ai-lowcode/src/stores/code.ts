import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { PyTorchCodeGenerator, type GeneratedCode } from '../core/code-generation/pytorch-code-generator'
import type { CanvasNode, Connection } from '../types/node'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export const useCodeStore = defineStore('code', () => {
  // 生成的代码
  const generatedCode = ref<GeneratedCode | null>(null)

  // 代码选项卡
  const activeTab = ref('model')

  // 是否自动生成代码
  const autoGenerate = ref(true)

  // 代码生成历史
  const generationHistory = ref<string[]>([])

  /**
   * 生成PyTorch代码
   */
  const generatePyTorchCode = (nodes: CanvasNode[], connections: Connection[]) => {
    if (!autoGenerate.value) return

    try {
      const generator = new PyTorchCodeGenerator(nodes, connections)
      const code = generator.generate()
      generatedCode.value = code

      // 保存到历史记录
      const timestamp = new Date().toLocaleTimeString()
      generationHistory.value.unshift(`Generated at ${timestamp}`)

      // 限制历史记录长度
      if (generationHistory.value.length > 10) {
        generationHistory.value.pop()
      }

      return code
    } catch (error) {
      console.error('Code generation failed:', error)
      throw error
    }
  }

  /**
   * 手动触发代码生成
   */
  const manualGenerateCode = (nodes: CanvasNode[], connections: Connection[]) => {
    return generatePyTorchCode(nodes, connections)
  }

  /**
   * 更新自动生成设置
   */
  const updateAutoGenerate = (value: boolean) => {
    autoGenerate.value = value
  }

  /**
   * 切换代码选项卡
   */
  const setActiveTab = (tab: string) => {
    activeTab.value = tab
  }

  /**
   * 获取当前显示的代码
   */
  const currentCode = computed(() => {
    if (!generatedCode.value) return ''

    switch (activeTab.value) {
      case 'model':
        return generatedCode.value.modelCode
      case 'training':
        return generatedCode.value.trainingCode
      case 'inference':
        return generatedCode.value.inferenceCode
      case 'summary':
        return generatedCode.value.modelSummary
      case 'requirements':
        return generatedCode.value.requirements.join('\n')
      default:
        return generatedCode.value.modelCode
    }
  })

  /**
   * 获取当前选项卡标题
   */
  const currentTabTitle = computed(() => {
    const titles: Record<string, string> = {
      'model': '模型定义',
      'training': '训练代码',
      'inference': '推理代码',
      'summary': '模型摘要',
      'requirements': '依赖项'
    }
    return titles[activeTab.value] || '代码'
  })

  /**
   * 复制代码到剪贴板
   */
  const copyCode = async () => {
    if (!currentCode.value) return false

    try {
      await navigator.clipboard.writeText(currentCode.value)
      return true
    } catch (error) {
      console.error('Copy failed:', error)
      return false
    }
  }

  /**
   * 下载代码文件
   */
  const downloadCode = () => {
    if (!generatedCode.value) return false

    try {
      // 根据当前选项卡决定文件名
      const extensions: Record<string, string> = {
        'model': 'model.py',
        'training': 'train.py',
        'inference': 'inference.py',
        'summary': 'model_summary.txt',
        'requirements': 'requirements.txt'
      }

      const extension = extensions[activeTab.value] || 'code.py'
      const filename = `ai_model_${extension}`

      // 创建Blob并下载
      const blob = new Blob([currentCode.value], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      return true
    } catch (error) {
      console.error('Download failed:', error)
      return false
    }
  }

  /**
   * 下载完整项目
   */
  const downloadFullProject = async () => {
    if (!generatedCode.value) {
      ElMessage.warning('没有可下载的项目')
      return false
    }

    try {
      const files = [
        { name: 'model.py', content: generatedCode.value.modelCode },
        { name: 'train.py', content: generatedCode.value.trainingCode },
        { name: 'inference.py', content: generatedCode.value.inferenceCode },
        { name: 'requirements.txt', content: generatedCode.value.requirements.join('\n') },
        { name: 'README.md', content: generateReadme() }, // 直接调用函数
        { name: 'config.yaml', content: generateConfig() } // 直接调用函数
      ]

      // 创建ZIP文件
      const zip = new JSZip()
      files.forEach(file => {
        zip.file(file.name, file.content)
      })

      // 生成ZIP并下载
      const content = await zip.generateAsync({ type: 'blob' })

      // 创建下载链接
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ai_model_project.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      ElMessage.success('项目文件已下载')
      return true
    } catch (error) {
      console.error('Project download failed:', error)
      ElMessage.error('项目下载失败')
      return false
    }
  }

  /**
 * 生成README文件
 */
  const generateReadme = (): string => {
    if (!generatedCode.value) return ''

    const modelName = 'AIModel'
    const modelSummary = generatedCode.value.modelSummary

    return `# AI Model Project

## 项目概述
此项目由AI低代码平台自动生成，包含完整的PyTorch模型定义、训练和推理代码。

## 模型结构
\`\`\`
${modelSummary}
\`\`\`

## 使用方法

### 1. 安装依赖
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 2. 训练模型
\`\`\`bash
python train.py
\`\`\`

### 3. 运行推理
\`\`\`bash
python inference.py
\`\`\`

### 4. 使用模型
\`\`\`python
import torch
from model import ${modelName}

# 创建模型实例
model = ${modelName}()

# 打印模型结构
model.summary()
\`\`\`

## 文件说明
- \`model.py\`: 模型定义
- \`train.py\`: 训练脚本
- \`inference.py\`: 推理脚本
- \`requirements.txt\`: 依赖项
- \`README.md\`: 项目说明
- \`config.yaml\`: 配置文件

## 模型特点
- 基于PyTorch框架
- 支持GPU训练
- 包含完整的训练和验证逻辑
- 提供模型保存和加载功能

## 注意事项
1. 请根据实际数据集调整数据加载和预处理逻辑
2. 训练参数可能需要根据具体任务进行调整
3. 确保有足够的GPU内存进行训练
4. 建议使用虚拟环境管理依赖

## 支持的深度学习任务
- 图像分类
- 目标检测
- 语义分割
- 时序预测

## 自定义修改
1. 修改\`model.py\`调整模型结构
2. 修改\`train.py\`调整训练参数
3. 修改\`inference.py\`调整推理逻辑

## 性能优化建议
1. 使用混合精度训练加速训练过程
2. 使用数据并行处理大规模数据
3. 使用模型剪枝和量化减小模型大小

## 故障排除
1. 如果遇到CUDA内存不足，请减小batch size
2. 如果训练不稳定，请调整学习率
3. 如果过拟合，请增加正则化或数据增强

## 支持
如有问题，请参考以下资源：
- [PyTorch官方文档](https://pytorch.org/docs/stable/index.html)
- [PyTorch教程](https://pytorch.org/tutorials/)
- [GitHub Issues](https://github.com/pytorch/pytorch/issues)

## 许可证
本项目基于MIT许可证开源。

## 更新日志
### v1.0.0
- 初始版本发布
- 支持基本的模型构建和代码生成
- 提供完整的训练和推理流程

---

*此项目由AI低代码平台自动生成，生成时间：${new Date().toLocaleString()}*
`
  }

  /**
   * 生成配置文件
   */
  const generateConfig = (): string => {
    return `# AI模型配置文件
# 由AI低代码平台自动生成

# 模型配置
model:
  name: "AIModel"
  framework: "pytorch"
  version: "1.0.0"
  
  # 输入配置
  input:
    shape: [1, 3, 224, 224]  # [batch_size, channels, height, width]
    dtype: "float32"
    normalization:
      mean: [0.485, 0.456, 0.406]
      std: [0.229, 0.224, 0.225]
  
  # 输出配置
  output:
    num_classes: 1000
    activation: "softmax"

# 训练配置
training:
  # 基础参数
  batch_size: 32
  num_epochs: 50
  learning_rate: 0.001
  weight_decay: 0.0001
  
  # 优化器
  optimizer:
    type: "adam"
    betas: [0.9, 0.999]
    eps: 1e-08
  
  # 学习率调度
  scheduler:
    type: "step"
    step_size: 10
    gamma: 0.1
  
  # 损失函数
  loss:
    type: "cross_entropy"
    reduction: "mean"
  
  # 早停策略
  early_stopping:
    enabled: true
    patience: 10
    min_delta: 0.001
  
  # 检查点保存
  checkpoint:
    save_best_only: true
    save_freq: 1  # 每个epoch保存一次
    monitor: "val_loss"
    mode: "min"

# 数据配置
data:
  # 数据集
  dataset:
    name: "custom"
    path: "./data"
    train_split: 0.8
    val_split: 0.1
    test_split: 0.1
  
  # 数据增强
  augmentation:
    train:
      - name: "random_crop"
        size: [224, 224]
      - name: "random_horizontal_flip"
        probability: 0.5
      - name: "random_rotation"
        degrees: 15
      - name: "color_jitter"
        brightness: 0.2
        contrast: 0.2
        saturation: 0.2
        hue: 0.1
    
    val:
      - name: "center_crop"
        size: [224, 224]
      - name: "resize"
        size: [256, 256]
  
  # 数据加载器
  dataloader:
    num_workers: 4
    pin_memory: true
    persistent_workers: true
    prefetch_factor: 2

# 推理配置
inference:
  # 批处理
  batch_size: 1
  device: "auto"  # auto, cuda, cpu
  
  # 后处理
  postprocessing:
    threshold: 0.5
    top_k: 5
    nms_threshold: 0.5
  
  # 输出格式
  output_format: "json"

# 硬件配置
hardware:
  # GPU配置
  gpu:
    enabled: true
    device_ids: [0]
    allow_multiple_gpus: false
  
  # 混合精度训练
  mixed_precision:
    enabled: true
    opt_level: "O1"
  
  # 分布式训练
  distributed:
    enabled: false
    backend: "nccl"
    init_method: "env://"

# 日志配置
logging:
  # 日志级别
  level: "INFO"
  
  # 日志文件
  file:
    enabled: true
    path: "./logs"
    max_size: "10MB"
    backup_count: 5
  
  # TensorBoard
  tensorboard:
    enabled: true
    log_dir: "./runs"
    update_freq: 100
  
  # 控制台输出
  console:
    enabled: true
    format: "%(asctime)s - %(levelname)s - %(message)s"

# 保存配置
save:
  # 模型保存
  model:
    format: "pth"  # pth, onnx, torchscript
    path: "./saved_models"
    include_optimizer: false
    include_scheduler: false
  
  # 检查点保存
  checkpoint:
    path: "./checkpoints"
    keep_best: 3
    keep_last: 5
  
  # 预测结果保存
  predictions:
    path: "./predictions"
    format: "csv"  # csv, json, numpy

# 验证配置
validation:
  # 验证频率
  freq: 1  # 每个epoch验证一次
  
  # 验证指标
  metrics:
    - "accuracy"
    - "precision"
    - "recall"
    - "f1_score"
    - "confusion_matrix"
  
  # 可视化
  visualization:
    enabled: true
    save_figures: true
    show_progress: true

# 实验跟踪
experiment:
  # MLflow
  mlflow:
    enabled: false
    tracking_uri: "http://localhost:5000"
    experiment_name: "ai_model_experiment"
  
  # Weights & Biases
  wandb:
    enabled: false
    project: "ai_model_project"
    entity: null

# 部署配置
deployment:
  # ONNX导出
  onnx:
    enabled: false
    opset_version: 11
    dynamic_axes:
      input: [0]
      output: [0]
  
  # TensorRT优化
  tensorrt:
    enabled: false
    precision: "FP16"
    max_batch_size: 32
  
  # 服务化
  serving:
    framework: "torchserve"
    model_store: "./model_store"
    workers: 1

# 环境配置
environment:
  # Python环境
  python:
    version: "3.8"
    requirements: "./requirements.txt"
  
  # 容器化
  docker:
    enabled: false
    base_image: "pytorch/pytorch:1.9.0-cuda11.1-cudnn8-runtime"
    build_args: {}
    ports: ["8080:8080"]

# 版本控制
version_control:
  git:
    enabled: true
    commit_message: "Update AI model configuration"
    auto_commit: false

---
# 配置说明
# 1. 修改模型输入形状以匹配你的数据
# 2. 调整训练参数以优化性能
# 3. 根据硬件配置启用GPU加速
# 4. 配置日志记录以跟踪训练过程
# 5. 设置检查点保存以防止训练中断

# 生成信息
generated_by: "AI Low-code Platform"
generation_time: "${new Date().toISOString()}"
config_version: "1.0"`
  }

  return {
    // 状态
    generatedCode,
    activeTab,
    autoGenerate,
    generationHistory,

    // 计算属性
    currentCode,
    currentTabTitle,

    // 方法
    generatePyTorchCode,
    manualGenerateCode,
    updateAutoGenerate,
    setActiveTab,
    copyCode,
    downloadCode,
    downloadFullProject
  }
})