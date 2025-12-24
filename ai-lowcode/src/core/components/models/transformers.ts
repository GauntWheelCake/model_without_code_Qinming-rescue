// src/core/components/models/transformers.ts
import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const TRANSFORMER_MODELS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'bert',
    'BERT',
    '双向编码器表示变换器',
    'Document',
    'model',
    'models',
    [
      { key: 'model_type', label: '模型类型', type: 'select', value: 'base', options: [
        { label: 'BERT-Base', value: 'base' },
        { label: 'BERT-Large', value: 'large' }
      ]},
      { key: 'pretrained', label: '预训练权重', type: 'boolean', value: true },
      { key: 'num_hidden_layers', label: '隐藏层数', type: 'number', value: 12, min: 1, max: 48, step: 1 },
      { key: 'num_attention_heads', label: '注意力头数', type: 'number', value: 12, min: 1, max: 64, step: 1 },
      { key: 'hidden_size', label: '隐藏大小', type: 'number', value: 768, min: 128, max: 4096, step: 128 }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [1, 512] }],
    [{ name: 'output', dataType: 'tensor', shape: [1, 512, 768] }],
    { 
      layerType: 'bert',
      requiresTransformers: true,
      defaultInputShape: [1, 512],
      defaultOutputShape: [1, 512, 768]
    }
  ),

  ComponentBuilder.createComponent(
    'gpt2',
    'GPT-2',
    '生成式预训练变换器2',
    'ChatLineRound',
    'model',
    'models',
    [
      { key: 'model_type', label: '模型大小', type: 'select', value: 'small', options: [
        { label: 'GPT-2 Small', value: 'small' },
        { label: 'GPT-2 Medium', value: 'medium' },
        { label: 'GPT-2 Large', value: 'large' },
        { label: 'GPT-2 XL', value: 'xl' }
      ]},
      { key: 'pretrained', label: '预训练权重', type: 'boolean', value: true },
      { key: 'n_embd', label: '嵌入维度', type: 'number', value: 768, min: 128, max: 4096, step: 128 },
      { key: 'n_layer', label: '层数', type: 'number', value: 12, min: 1, max: 48, step: 1 },
      { key: 'n_head', label: '注意力头数', type: 'number', value: 12, min: 1, max: 64, step: 1 }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [1, 1024] }],
    [{ name: 'output', dataType: 'tensor', shape: [1, 1024, 768] }],
    { 
      layerType: 'gpt2',
      requiresTransformers: true,
      defaultInputShape: [1, 1024],
      defaultOutputShape: [1, 1024, 768]
    }
  ),

  ComponentBuilder.createComponent(
    'transformer',
    'Transformer',
    '通用Transformer编码器',
    'Collection',
    'model',
    'models',
    [
      { key: 'd_model', label: '模型维度', type: 'number', value: 512, min: 64, max: 4096, step: 64 },
      { key: 'nhead', label: '注意力头数', type: 'number', value: 8, min: 1, max: 64, step: 1 },
      { key: 'num_encoder_layers', label: '编码器层数', type: 'number', value: 6, min: 1, max: 24, step: 1 },
      { key: 'num_decoder_layers', label: '解码器层数', type: 'number', value: 6, min: 0, max: 24, step: 1 },
      { key: 'dim_feedforward', label: '前馈网络维度', type: 'number', value: 2048, min: 128, max: 8192, step: 128 },
      { key: 'dropout', label: 'Dropout率', type: 'range', value: 0.1, min: 0, max: 1, step: 0.05 }
    ],
    [
      { name: 'src', dataType: 'tensor', shape: [32, 10, 512] },
      { name: 'tgt', dataType: 'tensor', shape: [32, 10, 512] }
    ],
    [{ name: 'output', dataType: 'tensor', shape: [32, 10, 512] }],
    { 
      layerType: 'transformer',
      defaultInputShape: [32, 10, 512],
      defaultOutputShape: [32, 10, 512]
    }
  )
]