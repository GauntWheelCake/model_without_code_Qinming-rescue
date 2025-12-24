// src/core/components/models/vision.ts
import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const VISION_MODELS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'resnet',
    'ResNet',
    '残差神经网络',
    'Tickets',
    'model',
    'models',
    [
      { key: 'num_layers', label: '层数', type: 'select', value: '18', options: [
        { label: 'ResNet-18', value: '18' },
        { label: 'ResNet-34', value: '34' },
        { label: 'ResNet-50', value: '50' },
        { label: 'ResNet-101', value: '101' },
        { label: 'ResNet-152', value: '152' }
      ]},
      { key: 'pretrained', label: '预训练权重', type: 'boolean', value: false },
      { key: 'num_classes', label: '分类数', type: 'number', value: 1000, min: 1, max: 10000, step: 1 }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [1, 3, 224, 224] }],
    [{ name: 'output', dataType: 'tensor', shape: [1, 1000] }],
    { 
      layerType: 'resnet',
      requiresTorchvision: true,
      defaultInputShape: [1, 3, 224, 224],
      defaultOutputShape: [1, 1000]
    }
  ),

  ComponentBuilder.createComponent(
    'vgg',
    'VGGNet',
    '牛津视觉几何组网络',
    'Filter',
    'model',
    'models',
    [
      { key: 'version', label: '版本', type: 'select', value: '16', options: [
        { label: 'VGG-11', value: '11' },
        { label: 'VGG-13', value: '13' },
        { label: 'VGG-16', value: '16' },
        { label: 'VGG-19', value: '19' }
      ]},
      { key: 'batch_norm', label: '批归一化', type: 'boolean', value: false },
      { key: 'pretrained', label: '预训练权重', type: 'boolean', value: false },
      { key: 'num_classes', label: '分类数', type: 'number', value: 1000, min: 1, max: 10000, step: 1 }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [1, 3, 224, 224] }],
    [{ name: 'output', dataType: 'tensor', shape: [1, 1000] }],
    { 
      layerType: 'vgg',
      requiresTorchvision: true,
      defaultInputShape: [1, 3, 224, 224],
      defaultOutputShape: [1, 1000]
    }
  ),

  ComponentBuilder.createComponent(
    'mobilenet_v2',
    'MobileNet V2',
    '轻量级卷积神经网络',
    'Mobile',
    'model',
    'models',
    [
      { key: 'pretrained', label: '预训练权重', type: 'boolean', value: false },
      { key: 'num_classes', label: '分类数', type: 'number', value: 1000, min: 1, max: 10000, step: 1 },
      { key: 'width_mult', label: '宽度乘数', type: 'number', value: 1.0, min: 0.1, max: 2.0, step: 0.1 }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [1, 3, 224, 224] }],
    [{ name: 'output', dataType: 'tensor', shape: [1, 1000] }],
    { 
      layerType: 'mobilenet_v2',
      requiresTorchvision: true,
      defaultInputShape: [1, 3, 224, 224],
      defaultOutputShape: [1, 1000]
    }
  ),

  ComponentBuilder.createComponent(
    'efficientnet',
    'EfficientNet',
    '高效的卷积神经网络',
    'Lightning',
    'model',
    'models',
    [
      { key: 'variant', label: '变体', type: 'select', value: 'b0', options: [
        { label: 'EfficientNet-B0', value: 'b0' },
        { label: 'EfficientNet-B1', value: 'b1' },
        { label: 'EfficientNet-B2', value: 'b2' },
        { label: 'EfficientNet-B3', value: 'b3' },
        { label: 'EfficientNet-B4', value: 'b4' },
        { label: 'EfficientNet-B5', value: 'b5' },
        { label: 'EfficientNet-B6', value: 'b6' },
        { label: 'EfficientNet-B7', value: 'b7' }
      ]},
      { key: 'pretrained', label: '预训练权重', type: 'boolean', value: false },
      { key: 'num_classes', label: '分类数', type: 'number', value: 1000, min: 1, max: 10000, step: 1 }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [1, 3, 224, 224] }],
    [{ name: 'output', dataType: 'tensor', shape: [1, 1000] }],
    { 
      layerType: 'efficientnet',
      requiresTorchvision: true,
      defaultInputShape: [1, 3, 224, 224],
      defaultOutputShape: [1, 1000]
    }
  ),

  ComponentBuilder.createComponent(
    'densenet',
    'DenseNet',
    '密集连接卷积网络',
    'Connection',
    'model',
    'models',
    [
      { key: 'num_layers', label: '层数', type: 'select', value: '121', options: [
        { label: 'DenseNet-121', value: '121' },
        { label: 'DenseNet-161', value: '161' },
        { label: 'DenseNet-169', value: '169' },
        { label: 'DenseNet-201', value: '201' }
      ]},
      { key: 'pretrained', label: '预训练权重', type: 'boolean', value: false },
      { key: 'num_classes', label: '分类数', type: 'number', value: 1000, min: 1, max: 10000, step: 1 }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [1, 3, 224, 224] }],
    [{ name: 'output', dataType: 'tensor', shape: [1, 1000] }],
    { 
      layerType: 'densenet',
      requiresTorchvision: true,
      defaultInputShape: [1, 3, 224, 224],
      defaultOutputShape: [1, 1000]
    }
  )
]