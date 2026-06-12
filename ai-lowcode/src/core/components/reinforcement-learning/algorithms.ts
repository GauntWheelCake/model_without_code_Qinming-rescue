import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const RL_ALGORITHMS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'ppo',
    'PPO',
    '近端策略优化算法（Proximal Policy Optimization）',
    'TrendCharts',
    'model',
    'rl_models',
    [
      { key: 'state_dim', label: '状态维度', type: 'number', value: 4, defaultValue: 4, min: 1, max: 10000, step: 1 },
      { key: 'action_dim', label: '动作维度', type: 'number', value: 2, defaultValue: 2, min: 1, max: 10000, step: 1 },
      { key: 'hidden_dim', label: '隐藏层维度', type: 'number', value: 64, defaultValue: 64, min: 16, max: 2048, step: 16 },
      { key: 'lr_actor', label: 'Actor学习率', type: 'range', value: 0.0003, defaultValue: 0.0003, min: 0.00001, max: 0.01, step: 0.00001, precision: 5 },
      { key: 'lr_critic', label: 'Critic学习率', type: 'range', value: 0.001, defaultValue: 0.001, min: 0.00001, max: 0.01, step: 0.00001, precision: 5 },
      { key: 'gamma', label: '折扣因子', type: 'range', value: 0.99, defaultValue: 0.99, min: 0.8, max: 1, step: 0.001, precision: 3 },
      { key: 'clip_epsilon', label: '裁剪系数', type: 'range', value: 0.2, defaultValue: 0.2, min: 0.05, max: 0.5, step: 0.01, precision: 2 },
      { key: 'epochs', label: '更新轮数', type: 'number', value: 10, defaultValue: 10, min: 1, max: 100, step: 1 },
      { key: 'continuous', label: '连续动作空间', type: 'boolean', value: false, defaultValue: false }
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
    'rl_models',
    [
      { key: 'n_agents', label: '智能体数量', type: 'number', value: 3, defaultValue: 3, min: 2, max: 100, step: 1 },
      { key: 'state_dim', label: '全局状态维度', type: 'number', value: 48, defaultValue: 48, min: 1, max: 10000, step: 1 },
      { key: 'obs_dim', label: '局部观测维度', type: 'number', value: 16, defaultValue: 16, min: 1, max: 10000, step: 1 },
      { key: 'action_dim', label: '动作维度', type: 'number', value: 5, defaultValue: 5, min: 1, max: 1000, step: 1 },
      { key: 'hidden_dim', label: '智能体网络隐藏维度', type: 'number', value: 64, defaultValue: 64, min: 16, max: 2048, step: 16 },
      { key: 'mixing_hidden_dim', label: '混合网络隐藏维度', type: 'number', value: 32, defaultValue: 32, min: 16, max: 1024, step: 16 },
      { key: 'gamma', label: '折扣因子', type: 'range', value: 0.99, defaultValue: 0.99, min: 0.8, max: 1, step: 0.001, precision: 3 },
      { key: 'lr', label: '学习率', type: 'range', value: 0.0005, defaultValue: 0.0005, min: 0.00001, max: 0.01, step: 0.00001, precision: 5 }
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

// 可拖拽组合的强化学习组件：用于通过拖拉拽构建完整 PPO 智能体
export const RL_COMPOSABLE: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'rl_state_input',
    '状态输入',
    '定义智能体观测的状态维度',
    'Promotion',
    'utility',
    'rl_components',
    [
      { key: 'state_dim', label: '状态维度', type: 'number', value: 4, defaultValue: 4, min: 1, max: 10000, step: 1 }
    ],
    [],
    [{ name: 'state', dataType: 'tensor', shape: [1, 4] }],
    { layerType: 'rl_state_input' }
  ),

  ComponentBuilder.createComponent(
    'rl_policy_network',
    '策略网络',
    'Actor 策略网络，输出动作分布',
    'Aim',
    'utility',
    'rl_components',
    [
      { key: 'hidden_dim', label: '隐藏层维度', type: 'number', value: 64, defaultValue: 64, min: 16, max: 2048, step: 16 },
      { key: 'hidden_layers', label: '隐藏层数量', type: 'number', value: 2, defaultValue: 2, min: 1, max: 5, step: 1 },
      { key: 'activation', label: '激活函数', type: 'select', value: 'tanh', defaultValue: 'tanh', options: [
        { label: 'Tanh', value: 'tanh' },
        { label: 'ReLU', value: 'relu' },
        { label: 'LeakyReLU', value: 'leaky_relu' }
      ]}
    ],
    [{ name: 'state', dataType: 'tensor', shape: [1, 4] }],
    [{ name: 'action_logits', dataType: 'tensor' }],
    { layerType: 'rl_policy_network' }
  ),

  ComponentBuilder.createComponent(
    'rl_value_network',
    '值网络',
    'Critic 值网络，输出状态价值',
    'DataAnalysis',
    'utility',
    'rl_components',
    [
      { key: 'hidden_dim', label: '隐藏层维度', type: 'number', value: 64, defaultValue: 64, min: 16, max: 2048, step: 16 },
      { key: 'hidden_layers', label: '隐藏层数量', type: 'number', value: 2, defaultValue: 2, min: 1, max: 5, step: 1 },
      { key: 'activation', label: '激活函数', type: 'select', value: 'tanh', defaultValue: 'tanh', options: [
        { label: 'Tanh', value: 'tanh' },
        { label: 'ReLU', value: 'relu' },
        { label: 'LeakyReLU', value: 'leaky_relu' }
      ]}
    ],
    [{ name: 'state', dataType: 'tensor', shape: [1, 4] }],
    [{ name: 'state_value', dataType: 'tensor', shape: [1, 1] }],
    { layerType: 'rl_value_network' }
  ),

  ComponentBuilder.createComponent(
    'rl_action_output',
    '动作输出',
    '定义动作空间并输出动作',
    'SwitchButton',
    'utility',
    'rl_components',
    [
      { key: 'action_dim', label: '动作维度', type: 'number', value: 2, defaultValue: 2, min: 1, max: 10000, step: 1 },
      { key: 'continuous', label: '连续动作空间', type: 'boolean', value: false, defaultValue: false }
    ],
    [{ name: 'action_logits', dataType: 'tensor' }],
    [{ name: 'action', dataType: 'tensor', shape: [1, 2] }],
    { layerType: 'rl_action_output' }
  ),

  ComponentBuilder.createComponent(
    'rl_ppo_agent',
    'PPO智能体',
    'PPO 训练循环封装，连接策略、值函数与动作',
    'TrendCharts',
    'model',
    'rl_agents',
    [
      { key: 'lr_actor', label: 'Actor学习率', type: 'range', value: 0.0003, defaultValue: 0.0003, min: 0.00001, max: 0.01, step: 0.00001, precision: 5 },
      { key: 'lr_critic', label: 'Critic学习率', type: 'range', value: 0.001, defaultValue: 0.001, min: 0.00001, max: 0.01, step: 0.00001, precision: 5 },
      { key: 'gamma', label: '折扣因子', type: 'range', value: 0.99, defaultValue: 0.99, min: 0.8, max: 1, step: 0.001, precision: 3 },
      { key: 'clip_epsilon', label: '裁剪系数', type: 'range', value: 0.2, defaultValue: 0.2, min: 0.05, max: 0.5, step: 0.01, precision: 2 },
      { key: 'epochs', label: '更新轮数', type: 'number', value: 10, defaultValue: 10, min: 1, max: 100, step: 1 },
      { key: 'update_interval', label: '更新间隔', type: 'number', value: 2048, defaultValue: 2048, min: 128, max: 10000, step: 128 }
    ],
    [
      { name: 'action', dataType: 'tensor' },
      { name: 'state_value', dataType: 'tensor' }
    ],
    [{ name: 'agent', dataType: 'tensor' }],
    { layerType: 'rl_ppo_agent' }
  )
]
