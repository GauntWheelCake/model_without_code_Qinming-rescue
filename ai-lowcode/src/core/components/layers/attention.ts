// src/core/components/layers/attention.ts
import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const ATTENTION_LAYERS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'multihead_attention',
    '多头注意力',
    'Multi-head attention',
    'Aim',
    'layer',
    'attention_layers',
    [
      { key: 'embed_dim', label: '嵌入维度', type: 'number', value: 512, min: 1, max: 4096, step: 1 },
      { key: 'num_heads', label: '头数', type: 'number', value: 8, min: 1, max: 64, step: 1 },
      { key: 'dropout', label: 'Dropout率', type: 'range', value: 0.1, min: 0, max: 1, step: 0.05 },
      { key: 'bias', label: '使用偏置', type: 'boolean', value: true },
      { key: 'add_bias_kv', label: '添加KV偏置', type: 'boolean', value: false },
      { key: 'add_zero_attn', label: '添加零注意力', type: 'boolean', value: false },
      { key: 'kdim', label: 'K维度', type: 'number', value: null, min: 1, max: 4096, step: 1, placeholder: '可选' },
      { key: 'vdim', label: 'V维度', type: 'number', value: null, min: 1, max: 4096, step: 1, placeholder: '可选' }
    ],
    [
      { name: 'query', dataType: 'tensor', shape: [32, 100, 512] },
      { name: 'key', dataType: 'tensor', shape: [32, 100, 512] },
      { name: 'value', dataType: 'tensor', shape: [32, 100, 512] }
    ],
    [{ name: 'output', dataType: 'tensor', shape: [32, 100, 512] }],
    { layerType: 'multihead_attention' }
  ),

  ComponentBuilder.createComponent(
    'self_attention',
    '自注意力',
    'Self-attention mechanism',
    'Aim',
    'layer',
    'attention_layers',
    [
      { key: 'hidden_size', label: '隐藏大小', type: 'number', value: 512, min: 1, max: 4096, step: 1 },
      { key: 'num_attention_heads', label: '注意力头数', type: 'number', value: 8, min: 1, max: 64, step: 1 },
      { key: 'attention_dropout', label: '注意力Dropout', type: 'range', value: 0.1, min: 0, max: 1, step: 0.05 },
      { key: 'hidden_dropout', label: '隐藏层Dropout', type: 'range', value: 0.1, min: 0, max: 1, step: 0.05 }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [32, 100, 512] }],
    [{ name: 'output', dataType: 'tensor', shape: [32, 100, 512] }],
    { layerType: 'self_attention' }
  ),

  ComponentBuilder.createComponent(
    'scaled_dot_product_attention',
    '缩放点积注意力',
    'Scaled dot-product attention',
    'Aim',
    'layer',
    'attention_layers',
    [
      { key: 'dropout', label: 'Dropout率', type: 'range', value: 0.1, min: 0, max: 1, step: 0.05 },
      { key: 'scale', label: '缩放因子', type: 'number', value: null, min: 0.1, max: 10, step: 0.1, placeholder: '可选' }
    ],
    [
      { name: 'query', dataType: 'tensor', shape: [32, 100, 512] },
      { name: 'key', dataType: 'tensor', shape: [32, 100, 512] },
      { name: 'value', dataType: 'tensor', shape: [32, 100, 512] }
    ],
    [{ name: 'output', dataType: 'tensor', shape: [32, 100, 512] }],
    { layerType: 'scaled_dot_product_attention' }
  )
]