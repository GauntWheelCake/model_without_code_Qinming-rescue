import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const RL_ALGORITHMS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'ppo',
    'PPO',
    '近端策略优化算法（Proximal Policy Optimization）',
    'TrendCharts',
    'model',
    'reinforcement_learning',
    [
      { key: 'state_dim', label: '状态维度', type: 'number', value: 4, min: 1, max: 10000, step: 1 },
      { key: 'action_dim', label: '动作维度', type: 'number', value: 2, min: 1, max: 10000, step: 1 },
      { key: 'hidden_dim', label: '隐藏层维度', type: 'number', value: 64, min: 16, max: 2048, step: 16 },
      { key: 'lr_actor', label: 'Actor学习率', type: 'range', value: 0.0003, min: 0.00001, max: 0.01, step: 0.00001 },
      { key: 'lr_critic', label: 'Critic学习率', type: 'range', value: 0.001, min: 0.00001, max: 0.01, step: 0.00001 },
      { key: 'gamma', label: '折扣因子', type: 'range', value: 0.99, min: 0, max: 1, step: 0.01 },
      { key: 'clip_epsilon', label: '裁剪系数', type: 'range', value: 0.2, min: 0.05, max: 0.5, step: 0.05 },
      { key: 'epochs', label: '更新轮数', type: 'number', value: 10, min: 1, max: 100, step: 1 },
      { key: 'continuous', label: '连续动作空间', type: 'boolean', value: false }
    ],
    [{ name: 'state', dataType: 'tensor', shape: [1, 4] }],
    [{ name: 'action', dataType: 'tensor', shape: [1, 2] }],
    {
      layerType: 'ppo',
      defaultInputShape: [1, 4],
      defaultOutputShape: [1, 2]
    }
  ),

  ComponentBuilder.createComponent(
    'qmix',
    'QMIX',
    '多智能体值分解混合网络（QMIX）',
    'Aim',
    'model',
    'reinforcement_learning',
    [
      { key: 'n_agents', label: '智能体数量', type: 'number', value: 3, min: 2, max: 100, step: 1 },
      { key: 'state_dim', label: '全局状态维度', type: 'number', value: 48, min: 1, max: 10000, step: 1 },
      { key: 'obs_dim', label: '局部观测维度', type: 'number', value: 16, min: 1, max: 10000, step: 1 },
      { key: 'action_dim', label: '动作维度', type: 'number', value: 5, min: 1, max: 1000, step: 1 },
      { key: 'hidden_dim', label: '智能体网络隐藏维度', type: 'number', value: 64, min: 16, max: 2048, step: 16 },
      { key: 'mixing_hidden_dim', label: '混合网络隐藏维度', type: 'number', value: 32, min: 16, max: 1024, step: 16 },
      { key: 'gamma', label: '折扣因子', type: 'range', value: 0.99, min: 0, max: 1, step: 0.01 },
      { key: 'lr', label: '学习率', type: 'range', value: 0.0005, min: 0.00001, max: 0.01, step: 0.00001 }
    ],
    [{ name: 'observations', dataType: 'tensor', shape: [1, 3, 16] }],
    [{ name: 'q_total', dataType: 'tensor', shape: [1, 1] }],
    {
      layerType: 'qmix',
      defaultInputShape: [1, 3, 16],
      defaultOutputShape: [1, 1]
    }
  )
]
