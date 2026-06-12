import type { CanvasNode, Connection, ConnectionValidation, ModelTopology, ConnectionPoint } from '../types/node'
import { getNodeFamily } from '../core/components/categories'

// 组件大类映射到连接规则使用的类别
type ComponentCategory =
  | 'basic_layers'
  | 'conv_layers'
  | 'pooling_layers'
  | 'normalization_layers'
  | 'recurrent_layers'
  | 'attention_layers'
  | 'activations'
  | 'models'
  | 'utilities'
  | 'rl_components'
  | 'rl_agents'
  | 'rl_models'
  | 'unknown'

// 类间连接矩阵：每个源类别允许的目标类别
const CATEGORY_CONNECTION_MATRIX: Record<ComponentCategory, Set<ComponentCategory>> = {
  basic_layers: new Set<ComponentCategory>(['basic_layers', 'recurrent_layers', 'attention_layers', 'activations', 'utilities']),
  conv_layers: new Set<ComponentCategory>(['conv_layers', 'pooling_layers', 'normalization_layers', 'activations', 'utilities']),
  pooling_layers: new Set<ComponentCategory>(['conv_layers', 'normalization_layers', 'activations', 'utilities']),
  normalization_layers: new Set<ComponentCategory>(['conv_layers', 'pooling_layers', 'activations', 'utilities']),
  recurrent_layers: new Set<ComponentCategory>(['basic_layers', 'recurrent_layers', 'attention_layers', 'activations', 'utilities']),
  attention_layers: new Set<ComponentCategory>(['basic_layers', 'recurrent_layers', 'attention_layers', 'activations', 'utilities']),
  activations: new Set<ComponentCategory>(['basic_layers', 'conv_layers', 'pooling_layers', 'normalization_layers', 'recurrent_layers', 'attention_layers', 'utilities']),
  models: new Set<ComponentCategory>(['activations', 'utilities']),
  utilities: new Set<ComponentCategory>(['basic_layers', 'conv_layers', 'pooling_layers', 'normalization_layers', 'recurrent_layers', 'attention_layers', 'activations', 'utilities']),
  rl_components: new Set<ComponentCategory>(['rl_components', 'rl_agents']),
  rl_agents: new Set<ComponentCategory>([]),
  rl_models: new Set<ComponentCategory>([]),
  unknown: new Set<ComponentCategory>()
}

// 从卷积/池化/归一化到基础层需要 Flatten 的提示
const NEEDS_FLATTEN_SOURCES = new Set<ComponentCategory>(['conv_layers', 'pooling_layers', 'normalization_layers'])
const NEEDS_FLATTEN_TARGETS = new Set<ComponentCategory>(['basic_layers'])

// 类内冗余：同类连续连接时阻止（如激活→激活、池化→池化）
const REDUNDANT_CATEGORIES = new Set<ComponentCategory>(['activations', 'pooling_layers', 'normalization_layers', 'models'])

// 必须有上游连接才能作为数据源的类别（纯变换层，不产生数据）
const REQUIRES_UPSTREAM = new Set<ComponentCategory>(['activations', 'pooling_layers', 'normalization_layers', 'utilities'])

// 需要多个输入的节点类型（至少2个输入才能正常工作）
const MULTI_INPUT_NODES = new Set<string>(['add', 'multiply', 'concat', 'concatenate'])

// 预训练模型节点类型（不应有外部输入）
const PRETRAINED_MODELS = new Set<string>(['resnet', 'vgg', 'mobilenet_v2', 'efficientnet', 'densenet', 'bert', 'gpt'])

// 卷积维度分组
const CONV_1D_TYPES = new Set<string>(['conv1d', 'batchnorm1d', 'maxpool1d', 'avgpool1d'])
const CONV_2D_TYPES = new Set<string>(['conv2d', 'batchnorm2d', 'maxpool2d', 'avgpool2d', 'instancenorm2d', 'depthwise_conv2d', 'transposed_conv2d'])
const CONV_3D_TYPES = new Set<string>(['conv3d', 'batchnorm3d', 'maxpool3d', 'avgpool3d'])

export class ConnectionManager {
  private nodes: CanvasNode[] = []
  private connections: Connection[] = []

  // 节点连接数缓存：nodeId -> { upstream, downstream }
  private connectionCountCache = new Map<string, { upstream: number; downstream: number }>()

  constructor(nodes: CanvasNode[], connections: Connection[]) {
    this.nodes = nodes
    this.connections = connections
    this.rebuildConnectionCountCache()
  }

  /**
   * 重建连接数缓存（批量操作后调用）
   */
  private rebuildConnectionCountCache(): void {
    this.connectionCountCache.clear()
    for (const node of this.nodes) {
      this.connectionCountCache.set(node.id, { upstream: 0, downstream: 0 })
    }
    for (const conn of this.connections) {
      const source = this.connectionCountCache.get(conn.source.nodeId)
      if (source) source.downstream++
      const target = this.connectionCountCache.get(conn.target.nodeId)
      if (target) target.upstream++
    }
  }

  /**
   * 获取节点上游连接数（O(1)）
   */
  getUpstreamCount(nodeId: string): number {
    return this.connectionCountCache.get(nodeId)?.upstream ?? 0
  }

  /**
   * 获取节点下游连接数（O(1)）
   */
  getDownstreamCount(nodeId: string): number {
    return this.connectionCountCache.get(nodeId)?.downstream ?? 0
  }

  /**
   * 更新节点引用（外部 nodes 数组变化时调用）
   */
  updateNodes(nodes: CanvasNode[]): void {
    this.nodes = nodes
    this.rebuildConnectionCountCache()
  }

  /**
   * 更新连接引用（外部 connections 数组变化时调用）
   */
  updateConnections(connections: Connection[]): void {
    this.connections = connections
    this.rebuildConnectionCountCache()
  }

  /**
   * 将节点的 category 映射到统一的组件大类
   */
  private mapCategory(node: CanvasNode): ComponentCategory {
    const category = (node.category || '').toLowerCase()

    // 兼容旧数据：旧的 reinforcement_learning 分类根据节点类型映射到新分类
    if (category === 'reinforcement_learning') {
      if (node.type === 'ppo' || node.type === 'qmix') return 'rl_models'
      if (node.type === 'rl_ppo_agent') return 'rl_agents'
      return 'rl_components'
    }

    // 精确匹配（优先）
    const exactMatch: Record<string, ComponentCategory> = {
      'basic_layers': 'basic_layers',
      'conv_layers': 'conv_layers',
      'pooling_layers': 'pooling_layers',
      'normalization_layers': 'normalization_layers',
      'recurrent_layers': 'recurrent_layers',
      'attention_layers': 'attention_layers',
      'activations': 'activations',
      'models': 'models',
      'utilities': 'utilities',
      'rl_components': 'rl_components',
      'rl_agents': 'rl_agents',
      'rl_models': 'rl_models'
    }
    if (exactMatch[category]) return exactMatch[category]

    // 模糊匹配（兼容旧数据）
    if (category.includes('basic')) return 'basic_layers'
    if (category.includes('conv')) return 'conv_layers'
    if (category.includes('pool')) return 'pooling_layers'
    if (category.includes('norm')) return 'normalization_layers'
    if (category.includes('recurrent')) return 'recurrent_layers'
    if (category.includes('attention')) return 'attention_layers'
    if (category.includes('activation')) return 'activations'
    if (category.includes('model')) return 'models'
    if (category.includes('util')) return 'utilities'

    // 兼容 type 字段值（'layer', 'activation', 'model', 'utility'）
    if (category === 'layer') return 'basic_layers'
    if (category === 'activation') return 'activations'
    if (category === 'model') return 'models'
    if (category === 'utility') return 'utilities'

    console.warn(`未知的组件类别: "${node.category}" (节点: ${node.name})`)
    return 'unknown'
  }

  /**
   * 创建新连接
   */
  createConnection(
    sourceNodeId: string,
    sourcePointId: string,
    targetNodeId: string,
    targetPointId: string
  ): ConnectionValidation {
    const validation = this.validateConnection(sourceNodeId, sourcePointId, targetNodeId, targetPointId)

    if (!validation.valid) {
      return validation
    }

    const sourceNode = this.nodes.find(n => n.id === sourceNodeId)
    const targetNode = this.nodes.find(n => n.id === targetNodeId)

    if (!sourceNode || !targetNode) {
      return {
        valid: false,
        errors: ['节点不存在'],
        message: '连接失败：节点不存在'
      }
    }

    // 计算连接点位置
    const sourcePosition = this.calculateConnectionPointPosition(sourceNode, sourcePointId, 'output')
    const targetPosition = this.calculateConnectionPointPosition(targetNode, targetPointId, 'input')

    const newConnection: Connection = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: {
        nodeId: sourceNodeId,
        pointId: sourcePointId,
        x: sourcePosition.x,
        y: sourcePosition.y
      },
      target: {
        nodeId: targetNodeId,
        pointId: targetPointId,
        x: targetPosition.x,
        y: targetPosition.y
      },
      style: {
        color: this.getConnectionColor(sourceNode.category),
        width: 2,
        dashed: false,
        arrowType: 'filled'
      },
      data: {
        dataType: 'tensor',
        shape: this.inferShape(sourceNode, targetNode)
      },
      path: this.computePath(sourcePosition.x, sourcePosition.y, targetPosition.x, targetPosition.y)
    }

    this.connections.push(newConnection)

    // 更新节点的连接状态
    this.updateNodeConnections(newConnection)

    // 增量更新连接数缓存
    const sourceCount = this.connectionCountCache.get(newConnection.source.nodeId)
    if (sourceCount) sourceCount.downstream++
    const targetCount = this.connectionCountCache.get(newConnection.target.nodeId)
    if (targetCount) targetCount.upstream++

    return {
      valid: true,
      errors: [],
      message: '连接创建成功'
    }
  }

  /**
   * 验证连接是否有效
   */
  validateConnection(
    sourceNodeId: string,
    sourcePointId: string,
    targetNodeId: string,
    targetPointId: string
  ): ConnectionValidation {
    // Layer 0: 基础约束（存在性、自连接、重复、循环、输入占用）
    const errors: string[] = []

    // 检查是否连接到自身
    if (sourceNodeId === targetNodeId) {
      errors.push('不能连接到自身')
    }

    // 检查节点是否存在
    const sourceNode = this.nodes.find(n => n.id === sourceNodeId)
    const targetNode = this.nodes.find(n => n.id === targetNodeId)

    if (!sourceNode) errors.push('源节点不存在')
    if (!targetNode) errors.push('目标节点不存在')

    // 检查是否已存在相同连接
    const existingConnection = this.connections.find(
      conn => conn.source.nodeId === sourceNodeId &&
        conn.source.pointId === sourcePointId &&
        conn.target.nodeId === targetNodeId &&
        conn.target.pointId === targetPointId
    )

    if (existingConnection) {
      errors.push('连接已存在')
    }

    // 检查是否会产生循环
    if (this.wouldCreateCycle(sourceNodeId, targetNodeId)) {
      errors.push('连接会产生循环依赖')
    }

    // 检查输入点是否已被占用（一个输入点只能有一个连接）
    const targetInputOccupied = this.connections.some(
      conn => conn.target.nodeId === targetNodeId && conn.target.pointId === targetPointId
    )

    if (targetInputOccupied) {
      errors.push('目标输入点已被占用')
    }
    // 类间规则
    if (sourceNode && targetNode) {
      // 【新增】深度学习与强化学习组件隔离：DL 只能连 DL，RL 只能连 RL
      const sourceFamily = getNodeFamily(sourceNode)
      const targetFamily = getNodeFamily(targetNode)
      if (sourceFamily && targetFamily && sourceFamily !== targetFamily) {
        const familyName = { dl: '深度学习', rl: '强化学习' }
        errors.push(`${familyName[sourceFamily]}组件「${sourceNode.name}」不能连接到${familyName[targetFamily]}组件「${targetNode.name}」`)
      }

      // 检查源节点是否缺少上游连接
      const upstreamResult = this.checkSourceHasUpstream(sourceNode)
      if (!upstreamResult.valid) {
        errors.push(...upstreamResult.errors)
      }

      // 【Layer 5】多输入节点检查
      const multiInputResult = this.checkMultiInputNode(sourceNode)
      if (!multiInputResult.valid) {
        errors.push(...multiInputResult.errors)
      }

      // 【Layer 6】预训练模型入口限制
      const pretrainedResult = this.checkPretrainedModelEntry(targetNode)
      if (!pretrainedResult.valid) {
        errors.push(...pretrainedResult.errors)
      }

      const categoryResult = this.checkCategoryConnection(sourceNode, targetNode)
      if (!categoryResult.valid) {
        errors.push(...categoryResult.errors)
      }

      // 类内冗余
      const redundancyResult = this.checkCategoryRedundancy(sourceNode, targetNode)
      if (!redundancyResult.valid) {
        errors.push(...redundancyResult.errors)
      }

      // 【Layer 7】卷积维度一致性
      const convDimResult = this.checkConvolutionDimensionConsistency(sourceNode, targetNode)
      if (!convDimResult.valid) {
        errors.push(...convDimResult.errors)
      }

      // 【Layer 8】BatchNorm 维度匹配
      const bnDimResult = this.checkBatchNormDimensionMatch(sourceNode, targetNode)
      if (!bnDimResult.valid) {
        errors.push(...bnDimResult.errors)
      }

      // 维度一致性
      const dimensionResult = this.checkDimensionCompatibility(sourceNode, targetNode)
      if (!dimensionResult.valid) {
        errors.push(...dimensionResult.errors)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? `连接无效: ${errors.join(', ')}` : '连接有效'
    }
  }

  /**
   * Layer 0: 检查是否会产生循环依赖
   */
  private wouldCreateCycle(sourceNodeId: string, targetNodeId: string): boolean {
    // 使用DFS检查从targetNode是否能到达sourceNode
    const visited = new Set<string>()
    const stack: string[] = [targetNodeId]

    while (stack.length > 0) {
      const currentNodeId = stack.pop()!

      if (currentNodeId === sourceNodeId) {
        return true // 发现循环
      }

      if (!visited.has(currentNodeId)) {
        visited.add(currentNodeId)

        // 获取当前节点的所有下游节点
        const downstreamNodes = this.connections
          .filter(conn => conn.source.nodeId === currentNodeId)
          .map(conn => conn.target.nodeId)

        stack.push(...downstreamNodes)
      }
    }

    return false
  }

  /**
   * Layer 4: 检查源节点是否需要上游连接但缺少上游连接
   * 激活函数、池化层、归一化层等"纯变换层"不产生数据，必须有输入才能输出
   */
  private checkSourceHasUpstream(sourceNode: CanvasNode): ConnectionValidation {
    const errors: string[] = []
    const sourceCat = this.mapCategory(sourceNode)

    // 如果源节点属于"需要上游连接"的类别
    if (REQUIRES_UPSTREAM.has(sourceCat)) {
      // 检查源节点是否有上游连接
      const hasUpstream = this.connections.some(
        conn => conn.target.nodeId === sourceNode.id
      )

      if (!hasUpstream) {
        const catName = this.CATEGORY_NAMES[sourceCat]
        const tips: Record<string, string> = {
          'activations': `「${sourceNode.name}」是激活函数，它只做数值变换，本身不产生数据。请先为它连接一个数据源（如全连接层、卷积层等）`,
          'pooling_layers': `「${sourceNode.name}」是池化层，需要有输入才能进行下采样。请先连接一个卷积层或其他产生特征图的层`,
          'normalization_layers': `「${sourceNode.name}」是归一化层，需要有输入数据才能进行归一化。请先连接上游层`,
          'utilities': `「${sourceNode.name}」是工具层，需要有输入数据才能处理。请先连接上游层`
        }
        errors.push(tips[sourceCat] || `${catName}「${sourceNode.name}」没有输入，无法作为数据源`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? errors[0] : '上游连接正常'
    }
  }

  /**
   * 【Layer 5】检查多输入节点是否有足够的输入
   * Add/Concat/Multiply 至少需要2个输入才能作为数据源
   */
  private checkMultiInputNode(sourceNode: CanvasNode): ConnectionValidation {
    const errors: string[] = []

    // 检查是否是多输入节点
    if (MULTI_INPUT_NODES.has(sourceNode.type)) {
      // 计算该节点当前的输入数量
      const inputCount = this.connections.filter(
        conn => conn.target.nodeId === sourceNode.id
      ).length

      if (inputCount < 2) {
        const nodeNames: Record<string, string> = {
          'add': 'Add（逐元素相加）',
          'multiply': 'Multiply（逐元素相乘）',
          'concat': 'Concat（张量拼接）',
          'concatenate': 'Concatenate（张量拼接）'
        }
        const displayName = nodeNames[sourceNode.type] || sourceNode.name
        errors.push(`「${displayName}」需要至少 2 个输入才能进行运算，当前只有 ${inputCount} 个输入。请先连接另一个数据源`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? errors[0] : '多输入检查通过'
    }
  }

  /**
   * 【Layer 6】检查预训练模型入口限制
   * 预训练模型（ResNet、VGG等）应该作为网络起点，不应接受外部输入
   */
  private checkPretrainedModelEntry(targetNode: CanvasNode): ConnectionValidation {
    const errors: string[] = []

    // 检查目标节点是否是预训练模型
    if (PRETRAINED_MODELS.has(targetNode.type)) {
      errors.push(`「${targetNode.name}」是预训练模型，已包含完整的特征提取网络，不应连接外部输入层。预训练模型应作为网络的起点`)
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? errors[0] : '预训练模型入口检查通过'
    }
  }

  /**
   * 【Layer 7】检查卷积维度一致性
   * Conv1D/Conv2D/Conv3D 以及对应的 BN、Pooling 不能混用
   */
  private checkConvolutionDimensionConsistency(sourceNode: CanvasNode, targetNode: CanvasNode): ConnectionValidation {
    const errors: string[] = []

    // 判断节点的卷积维度
    const getConvDimension = (node: CanvasNode): '1d' | '2d' | '3d' | null => {
      if (CONV_1D_TYPES.has(node.type)) return '1d'
      if (CONV_2D_TYPES.has(node.type)) return '2d'
      if (CONV_3D_TYPES.has(node.type)) return '3d'
      return null
    }

    const sourceDim = getConvDimension(sourceNode)
    const targetDim = getConvDimension(targetNode)

    // 如果两个节点都有卷积维度，且维度不同
    if (sourceDim && targetDim && sourceDim !== targetDim) {
      const dimNames = { '1d': '一维', '2d': '二维', '3d': '三维' }
      errors.push(`卷积维度不匹配：「${sourceNode.name}」是${dimNames[sourceDim]}(${sourceDim.toUpperCase()})，不能连接到${dimNames[targetDim]}的「${targetNode.name}」(${targetDim.toUpperCase()})`)
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? errors[0] : '卷积维度一致'
    }
  }

  /**
   * 【Layer 8】检查 BatchNorm 维度匹配
   * BN1d 用于 Linear/1D卷积，BN2d 用于 2D卷积，BN3d 用于 3D卷积
   */
  private checkBatchNormDimensionMatch(sourceNode: CanvasNode, targetNode: CanvasNode): ConnectionValidation {
    const errors: string[] = []

    // 检查 源→BN 的匹配
    if (targetNode.type.includes('batchnorm')) {
      const bnDim = targetNode.type.includes('1d') ? '1d' : targetNode.type.includes('2d') ? '2d' : targetNode.type.includes('3d') ? '3d' : null

      if (bnDim === '1d') {
        // BN1d 应该接 Linear 或 Conv1d
        if (!['linear', 'embedding'].includes(sourceNode.type) && !CONV_1D_TYPES.has(sourceNode.type)) {
          errors.push(`「${targetNode.name}」(BatchNorm1d) 用于一维数据，应接在全连接层或一维卷积后，不能接「${sourceNode.name}」`)
        }
      } else if (bnDim === '2d') {
        // BN2d 应该接 Conv2d
        if (!CONV_2D_TYPES.has(sourceNode.type)) {
          errors.push(`「${targetNode.name}」(BatchNorm2d) 用于二维特征图，应接在二维卷积层后，不能接「${sourceNode.name}」`)
        }
      } else if (bnDim === '3d') {
        // BN3d 应该接 Conv3d
        if (!CONV_3D_TYPES.has(sourceNode.type)) {
          errors.push(`「${targetNode.name}」(BatchNorm3d) 用于三维特征图，应接在三维卷积层后，不能接「${sourceNode.name}」`)
        }
      }
    }

    // 检查 BN→目标 的匹配（反向检查）
    if (sourceNode.type.includes('batchnorm')) {
      const bnDim = sourceNode.type.includes('1d') ? '1d' : sourceNode.type.includes('2d') ? '2d' : sourceNode.type.includes('3d') ? '3d' : null

      if (bnDim === '2d' && ['linear'].includes(targetNode.type)) {
        errors.push(`「${sourceNode.name}」(BatchNorm2d) 输出二维特征图，需要先用 Flatten 展平才能连接全连接层「${targetNode.name}」`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? errors[0] : 'BatchNorm 维度匹配'
    }
  }

  // 类别名称映射（用于友好的错误提示）
  private readonly CATEGORY_NAMES: Record<ComponentCategory, string> = {
    basic_layers: '基础层',
    conv_layers: '卷积层',
    pooling_layers: '池化层',
    normalization_layers: '归一化层',
    recurrent_layers: '循环层',
    attention_layers: '注意力层',
    activations: '激活函数',
    models: '预训练模型',
    utilities: '工具层',
    rl_components: '强化学习组件',
    rl_agents: '强化学习智能体',
    rl_models: '强化学习模型',
    unknown: '未知类别'
  }

  // 连接规则说明（用于详细错误提示）
  private readonly CONNECTION_RULES: Record<string, string> = {
    // 预训练模型相关
    'models→basic_layers': '预训练模型已包含完整网络结构，通常不需要连接额外的全连接层。若需要微调，请使用激活函数或工具层',
    'models→conv_layers': '预训练模型已包含卷积骨干网络，不能再连接卷积层',
    'models→pooling_layers': '预训练模型已包含池化层，不能再连接池化层',
    'models→normalization_layers': '预训练模型已包含归一化层，不能再连接归一化层',
    'models→recurrent_layers': '预训练模型（如 ResNet）输出固定特征，不适合直接连接循环层',
    'models→attention_layers': '预训练模型输出固定特征向量，不适合直接连接注意力层',
    'models→models': '不能将两个预训练模型直接串联',
    // 基础层相关
    'basic_layers→conv_layers': '全连接层输出一维向量，无法直接连接需要多维输入的卷积层。若需要，请先用 Reshape 重塑张量形状',
    'basic_layers→pooling_layers': '全连接层输出一维向量，无法直接连接需要多维输入的池化层',
    'basic_layers→normalization_layers': '全连接层应使用 BatchNorm1d 进行归一化，请确保选择正确的归一化类型',
    // 卷积层相关
    'conv_layers→basic_layers': '卷积层输出多维张量，需要先通过 Flatten 层展平才能连接全连接层',
    'conv_layers→recurrent_layers': '卷积层输出需要重塑后才能输入循环层，请使用 Reshape 或 Flatten + Linear 进行转换',
    'conv_layers→attention_layers': '卷积特征需要先展平或重塑为序列格式才能输入注意力层',
    // 池化层相关
    'pooling_layers→basic_layers': '池化层输出多维张量，需要先通过 Flatten 层展平才能连接全连接层',
    'pooling_layers→recurrent_layers': '池化层输出需要重塑后才能输入循环层',
    'pooling_layers→attention_layers': '池化层输出需要重塑为序列格式才能输入注意力层',
    // 归一化层相关
    'normalization_layers→basic_layers': '归一化层（2D/3D）输出多维张量，需要先 Flatten 展平才能连接全连接层',
    'normalization_layers→recurrent_layers': '归一化层输出需要重塑后才能输入循环层',
    'normalization_layers→attention_layers': '归一化层输出需要重塑为序列格式才能输入注意力层',
    // 未知类别
    'unknown→*': '源节点类别未识别，请检查组件配置',
    '*→unknown': '目标节点类别未识别，请检查组件配置'
  }

  /**
   * Layer 1: 类间连接规则——依据类别矩阵判断允许/禁止，以及是否需插入 Flatten。
   */
  private checkCategoryConnection(sourceNode: CanvasNode, targetNode: CanvasNode): ConnectionValidation {
    const errors: string[] = []
    const sourceCat = this.mapCategory(sourceNode)
    const targetCat = this.mapCategory(targetNode)

    // 未知类别特殊处理
    if (sourceCat === 'unknown' || targetCat === 'unknown') {
      const unknownNode = sourceCat === 'unknown' ? sourceNode : targetNode
      errors.push(`无法识别组件类别「${unknownNode.name}」，请检查组件是否正确配置`)
      return { valid: false, errors, message: errors[0] }
    }

    // 需要 Flatten 的特殊提示
    // 但如果目标正好是 Flatten 层，则允许连接（Flatten 就是用来做这个的）
    if (NEEDS_FLATTEN_SOURCES.has(sourceCat) && NEEDS_FLATTEN_TARGETS.has(targetCat)) {
      // 检查目标节点是否是 Flatten
      if (targetNode.type !== 'flatten') {
        errors.push(`${this.CATEGORY_NAMES[sourceCat]} → ${this.CATEGORY_NAMES[targetCat]}：需要先插入 Flatten 层将多维张量展平为一维向量`)
        return { valid: false, errors, message: errors[0] }
      }
      // 如果是 Flatten，则允许连接，跳过矩阵检查（Flatten 就是用来转换维度的）
      return {
        valid: true,
        errors: [],
        message: '类别兼容（Flatten 展平层）'
      }
    }

    // 针对常见误连场景给出更具体的报错，避免 Flatten 和 Linear 落到同一条池化提示
    if (targetCat === 'pooling_layers') {
      if (sourceNode.type === 'flatten') {
        errors.push('展平层输出已经是一维向量，池化层需要二维或更高维的特征图输入。请把池化层放在 Flatten 之前。')
        return { valid: false, errors, message: errors[0] }
      }

      if (sourceNode.type === 'linear') {
        errors.push('全连接层输出的是分类特征向量，池化层只能处理卷积特征图。请把池化层连接在卷积层或激活层之后。')
        return { valid: false, errors, message: errors[0] }
      }
    }

    const allowed = CATEGORY_CONNECTION_MATRIX[sourceCat]
    if (!allowed || !allowed.has(targetCat)) {
      const ruleKey = `${sourceCat}→${targetCat}`
      const reason = this.CONNECTION_RULES[ruleKey] ||
        `${this.CATEGORY_NAMES[sourceCat]} 不能直接连接到 ${this.CATEGORY_NAMES[targetCat]}`
      errors.push(reason)
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? errors[0] : '类别兼容'
    }
  }

  /**
   * Layer 2: 类内冗余规则——同类连续连接时阻止（如激活→激活、池化→池化、归一化→归一化、模型→模型）。
   */
  private checkCategoryRedundancy(sourceNode: CanvasNode, targetNode: CanvasNode): ConnectionValidation {
    const errors: string[] = []
    const sourceCat = this.mapCategory(sourceNode)
    const targetCat = this.mapCategory(targetNode)

    if (sourceCat === targetCat && REDUNDANT_CATEGORIES.has(sourceCat)) {
      const catName = this.CATEGORY_NAMES[sourceCat]
      const redundancyReasons: Record<string, string> = {
        'activations': `连续使用两个${catName}通常是冗余的，建议只保留一个`,
        'pooling_layers': `连续使用两个${catName}会过度下采样，可能丢失重要特征`,
        'normalization_layers': `连续使用两个${catName}没有额外效果，建议只保留一个`,
        'models': `两个${catName}不能直接串联，每个预训练模型都是完整的网络`
      }
      errors.push(redundancyReasons[sourceCat] || `${catName} → ${catName} 连接冗余`)
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? errors[0] : '无冗余'
    }
  }

  /**
   * Layer 3: 维度一致性校验——检查通道数、特征维度、形状是否匹配
   */
  private checkDimensionCompatibility(sourceNode: CanvasNode, targetNode: CanvasNode): ConnectionValidation {
    const errors: string[] = []

    // 1. 全连接层链路：out_features == in_features
    const sourceOutFeatures = this.getNodeOutputFeatureSize(sourceNode)
    const targetInFeatures = this.getNodeInputFeatureSize(targetNode)
    if (sourceOutFeatures != null && targetInFeatures != null && sourceOutFeatures !== targetInFeatures) {
      errors.push(`特征维度不匹配: 源输出 ${sourceOutFeatures} != 目标输入 ${targetInFeatures}`)
    }

    // 2. 卷积/归一化链路：out_channels == in_channels/num_features
    const sourceOutChannels = this.getNodeOutputChannels(sourceNode)
    const targetInChannels = this.getNodeInputChannels(targetNode)
    if (sourceOutChannels != null && targetInChannels != null && sourceOutChannels !== targetInChannels) {
      errors.push(`通道数不匹配: 源输出通道 ${sourceOutChannels} != 目标输入通道 ${targetInChannels}`)
    }

    // 3. 嵌入层 → RNN/GRU/LSTM：embedding_dim == input_size
    if (sourceNode.type === 'embedding' && ['lstm', 'gru', 'rnn'].includes(targetNode.type)) {
      const embDim = this.getParamAsNumber(sourceNode, 'embedding_dim')
      const rnnInputSize = this.getParamAsNumber(targetNode, 'input_size')
      if (embDim != null && rnnInputSize != null && embDim !== rnnInputSize) {
        errors.push(`嵌入维度不匹配: embedding_dim ${embDim} != RNN input_size ${rnnInputSize}`)
      }
    }

    // 4. 多头注意力：embed_dim 必须能被 num_heads 整除
    if (targetNode.type === 'multihead_attention') {
      const embedDim = this.getParamAsNumber(targetNode, 'embed_dim')
      const numHeads = this.getParamAsNumber(targetNode, 'num_heads')
      if (embedDim != null && numHeads != null && embedDim % numHeads !== 0) {
        errors.push(`注意力参数不合法: embed_dim ${embedDim} 不能被 num_heads ${numHeads} 整除`)
      }
      // 上游特征维度应等于 embed_dim
      if (sourceOutFeatures != null && embedDim != null && sourceOutFeatures !== embedDim) {
        errors.push(`注意力嵌入维度不匹配: 源特征 ${sourceOutFeatures} != embed_dim ${embedDim}`)
      }
    }

    // 5. 张量操作（Add/Multiply）：两输入特征或通道需一致
    if (['add', 'multiply'].includes(targetNode.type)) {
      const existingInputs = this.connections.filter(c => c.target.nodeId === targetNode.id)
      if (existingInputs.length > 0) {
        const otherSourceNode = this.nodes.find(n => n.id === existingInputs[0].source.nodeId)
        if (otherSourceNode) {
          const otherOutFeatures = this.getNodeOutputFeatureSize(otherSourceNode)
          const otherOutChannels = this.getNodeOutputChannels(otherSourceNode)

          if (sourceOutFeatures != null && otherOutFeatures != null && sourceOutFeatures !== otherOutFeatures) {
            errors.push(`逐元素操作维度不匹配: 两输入特征维度 ${sourceOutFeatures} 与 ${otherOutFeatures} 不一致`)
          } else if (sourceOutChannels != null && otherOutChannels != null && sourceOutChannels !== otherOutChannels) {
            errors.push(`逐元素操作通道不匹配: 两输入通道数 ${sourceOutChannels} 与 ${otherOutChannels} 不一致`)
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? errors.join('; ') : '维度兼容'
    }
  }

  // ==================== 维度提取辅助函数 ====================

  private getParamAsNumber(node: CanvasNode, key: string): number | null {
    const param = node.params?.find(p => p.key === key)
    if (!param) return null
    const value = typeof param.value === 'string' ? Number(param.value) : param.value
    return Number.isFinite(value) ? Number(value) : null
  }

  private getNodeOutputFeatureSize(node: CanvasNode): number | null {
    // 全连接层
    if (node.type === 'linear' || node.name === '全连接层') {
      return this.getParamAsNumber(node, 'out_features')
    }
    // 嵌入层
    if (node.type === 'embedding') {
      return this.getParamAsNumber(node, 'embedding_dim')
    }
    // 预训练分类模型
    if (['resnet', 'vggnet', 'mobilenet_v2', 'efficientnet', 'densenet'].includes(node.type)) {
      return this.getParamAsNumber(node, 'num_classes') ?? 1000
    }
    return null
  }

  private getNodeInputFeatureSize(node: CanvasNode): number | null {
    // 全连接层
    if (node.type === 'linear' || node.name === '全连接层') {
      return this.getParamAsNumber(node, 'in_features')
    }
    // RNN/GRU/LSTM
    if (['lstm', 'gru', 'rnn'].includes(node.type)) {
      return this.getParamAsNumber(node, 'input_size')
    }
    // 多头注意力
    if (node.type === 'multihead_attention') {
      return this.getParamAsNumber(node, 'embed_dim')
    }
    return null
  }

  private getNodeOutputChannels(node: CanvasNode): number | null {
    // 卷积类
    if (['conv1d', 'conv2d', 'conv3d', 'transposed_conv2d', 'depthwise_conv2d'].includes(node.type)) {
      return this.getParamAsNumber(node, 'out_channels')
    }
    // 归一化类
    if (['batchnorm1d', 'batchnorm2d', 'instancenorm2d'].includes(node.type)) {
      return this.getParamAsNumber(node, 'num_features')
    }
    if (node.type === 'groupnorm') {
      return this.getParamAsNumber(node, 'num_channels')
    }
    return null
  }

  private getNodeInputChannels(node: CanvasNode): number | null {
    // 卷积类
    if (['conv1d', 'conv2d', 'conv3d', 'transposed_conv2d', 'depthwise_conv2d'].includes(node.type)) {
      return this.getParamAsNumber(node, 'in_channels')
    }
    // 归一化类
    if (['batchnorm1d', 'batchnorm2d', 'instancenorm2d'].includes(node.type)) {
      return this.getParamAsNumber(node, 'num_features')
    }
    if (node.type === 'groupnorm') {
      return this.getParamAsNumber(node, 'num_channels')
    }
    return null
  }

  /**
   * 计算连接点位置（精确到画布坐标） - 修正版
   * 注意：此方法计算出的坐标必须与WorkspaceCanvas.vue中的CSS布局完全一致
   */
  public calculateConnectionPointPosition(
    node: CanvasNode,
    pointId: string,
    type: 'input' | 'output'
  ): { x: number; y: number } {

    const NODE_WIDTH = 200;
    const NODE_TOTAL_HEIGHT = 170;
    // 与 WorkspaceCanvas.vue 的 CSS 对齐：
    // .input-points { left: -60px } + .point-indicator-wrapper { left: 48px } => -12px
    // .output-points { right: -60px } + .point-indicator-wrapper { right: 48px } => +12px
    const GAP = 12;

    const points = type === 'input' ? node.inputs : node.outputs;
    const pointIndex = points.findIndex(p => p.id === pointId);

    const totalPoints = points.length;
    const verticalSpacing = NODE_TOTAL_HEIGHT / (totalPoints + 1);

    const y = node.position.y + verticalSpacing * (pointIndex + 1);

    let x;
    if (type === 'input') {
      // 输入点在节点左侧
      x = node.position.x - GAP;
    } else {
      // 输出点在节点右侧
      x = node.position.x + NODE_WIDTH + GAP;
    }

    return { x, y };
  }
  /**
 * 调试方法：打印节点所有连接点的计算坐标
 */
  public debugConnectionPoints(node: CanvasNode): void {
    console.group(`调试节点: ${node.name} (ID: ${node.id})`);
    console.log('节点位置:', node.position);

    node.inputs.forEach((point, idx) => {
      const pos = this.calculateConnectionPointPosition(node, point.id, 'input');
      console.log(`输入点 ${idx} (${point.name}):`, pos);
    });

    node.outputs.forEach((point, idx) => {
      const pos = this.calculateConnectionPointPosition(node, point.id, 'output');
      console.log(`输出点 ${idx} (${point.name}):`, pos);
    });

    console.groupEnd();
  }
  /**
   * 获取连接颜色
   */
  private getConnectionColor(category: string): string {
    const colors: Record<string, string> = {
      'layer': '#409eff',      // 蓝色
      'activation': '#67c23a', // 绿色
      'model': '#e6a23c',      // 橙色
      'loss': '#f56c6c',       // 红色
      'optimizer': '#909399'   // 灰色
    }
    return colors[category] || '#409eff'
  }

  /**
   * 推断形状
   */
  private inferShape(sourceNode: CanvasNode, targetNode: CanvasNode): number[] | undefined {
    // 简化的形状推断
    // 在实际应用中，这里应该根据节点参数计算形状

    if (sourceNode.type === 'conv2d' && targetNode.type === 'pooling') {
      // 假设卷积层输出形状
      return [64, 32, 32] // [channels, height, width]
    }

    return undefined
  }

  /**
   * 更新节点连接状态
   */
  private updateNodeConnections(connection: Connection): void {
    // 更新源节点的输出连接
    const sourceNode = this.nodes.find(n => n.id === connection.source.nodeId)
    if (sourceNode) {
      const outputPoint = sourceNode.outputs.find(p => p.id === connection.source.pointId)
      if (outputPoint) {
        if (!outputPoint.connectedTo) {
          outputPoint.connectedTo = []
        }
        outputPoint.connectedTo.push(connection.target.nodeId)
      }
    }

    // 更新目标节点的输入连接
    const targetNode = this.nodes.find(n => n.id === connection.target.nodeId)
    if (targetNode) {
      const inputPoint = targetNode.inputs.find(p => p.id === connection.target.pointId)
      if (inputPoint) {
        if (!inputPoint.connectedTo) {
          inputPoint.connectedTo = []
        }
        inputPoint.connectedTo.push(connection.source.nodeId)
      }
    }
  }

  /**
   * 删除连接
   */
  deleteConnection(connectionId: string): boolean {
    const index = this.connections.findIndex(c => c.id === connectionId)

    if (index === -1) {
      return false
    }

    const connection = this.connections[index]

    // 更新节点连接状态
    this.removeNodeConnection(connection)

    // 减量更新连接数缓存
    const sourceCount = this.connectionCountCache.get(connection.source.nodeId)
    if (sourceCount) sourceCount.downstream = Math.max(0, sourceCount.downstream - 1)
    const targetCount = this.connectionCountCache.get(connection.target.nodeId)
    if (targetCount) targetCount.upstream = Math.max(0, targetCount.upstream - 1)

    // 删除连接
    this.connections.splice(index, 1)

    return true
  }

  /**
   * 移除节点连接
   */
  private removeNodeConnection(connection: Connection): void {
    // 从源节点的输出连接中移除
    const sourceNode = this.nodes.find(n => n.id === connection.source.nodeId)
    if (sourceNode) {
      const outputPoint = sourceNode.outputs.find(p => p.id === connection.source.pointId)
      if (outputPoint && outputPoint.connectedTo) {
        outputPoint.connectedTo = outputPoint.connectedTo.filter(
          nodeId => nodeId !== connection.target.nodeId
        )
      }
    }

    // 从目标节点的输入连接中移除
    const targetNode = this.nodes.find(n => n.id === connection.target.nodeId)
    if (targetNode) {
      const inputPoint = targetNode.inputs.find(p => p.id === connection.target.pointId)
      if (inputPoint && inputPoint.connectedTo) {
        inputPoint.connectedTo = inputPoint.connectedTo.filter(
          nodeId => nodeId !== connection.source.nodeId
        )
      }
    }
  }

  /**
   * 获取节点的所有连接
   */
  getNodeConnections(nodeId: string): Connection[] {
    return this.connections.filter(
      conn => conn.source.nodeId === nodeId || conn.target.nodeId === nodeId
    )
  }

  /**
   * 获取节点的上游节点
   */
  getUpstreamNodes(nodeId: string): string[] {
    return this.connections
      .filter(conn => conn.target.nodeId === nodeId)
      .map(conn => conn.source.nodeId)
  }

  /**
   * 获取节点的下游节点
   */
  getDownstreamNodes(nodeId: string): string[] {
    return this.connections
      .filter(conn => conn.source.nodeId === nodeId)
      .map(conn => conn.target.nodeId)
  }

  /**
   * 计算 SVG path 字符串
   */
  private computePath(sx: number, sy: number, tx: number, ty: number): string {
    const offsetX = Math.abs(tx - sx) * 0.3
    return `M ${sx} ${sy} C ${sx + offsetX} ${sy}, ${tx - offsetX} ${ty}, ${tx} ${ty}`
  }

  /**
   * 更新连接位置（当节点移动时）
   * 优化：只更新与该节点相关的连接，并同时更新缓存的 path
   */
  updateConnectionPositions(nodeId: string): void {
    const node = this.nodes.find(n => n.id === nodeId)
    if (!node) return

    for (let i = 0; i < this.connections.length; i++) {
      const conn = this.connections[i]
      let changed = false

      if (conn.source.nodeId === nodeId) {
        const pos = this.calculateConnectionPointPosition(node, conn.source.pointId, 'output')
        conn.source.x = pos.x
        conn.source.y = pos.y
        changed = true
      }

      if (conn.target.nodeId === nodeId) {
        const pos = this.calculateConnectionPointPosition(node, conn.target.pointId, 'input')
        conn.target.x = pos.x
        conn.target.y = pos.y
        changed = true
      }

      if (changed) {
        conn.path = this.computePath(conn.source.x, conn.source.y, conn.target.x, conn.target.y)
      }
    }
  }

  /**
   * 生成模型拓扑结构
   */
  /**
   * 【废弃】旧的 generateTopology 方法
   * 改用 getOrderedNodesByTopology() 获取有序节点
   * 此方法保留以兼容现有代码，但逻辑已改为调用新排序
   */
  generateTopology(): ModelTopology {
    const inputNodes: string[] = []
    const outputNodes: string[] = []

    // 找出输入节点（没有上游连接的节点）
    this.nodes.forEach(node => {
      const upstreamNodes = this.getUpstreamNodes(node.id)
      if (upstreamNodes.length === 0) {
        inputNodes.push(node.id)
      }
    })

    // 找出输出节点（没有下游连接的节点）
    this.nodes.forEach(node => {
      const downstreamNodes = this.getDownstreamNodes(node.id)
      if (downstreamNodes.length === 0) {
        outputNodes.push(node.id)
      }
    })

    // 使用新的排序方法
    const orderResult = this.getOrderedNodesByTopology()
    const layers = orderResult.ordered.map(node => node.id)
    const hasCycles = orderResult.hasCycle

    return {
      nodes: this.nodes,
      connections: this.connections,
      layers,
      hasCycles,
      inputNodes,
      outputNodes
    }
  }

  /**
   * 【废弃】旧的 topologicalSort 方法
   * 已被 getOrderedNodesByTopology() 替代
   * 保留此方法以确保向后兼容性
   * @deprecated 使用 getOrderedNodesByTopology() 代替
   */
  private topologicalSort(): string[] {
    // 调用新的排序方法并返回节点ID列表
    const result = this.getOrderedNodesByTopology()
    return result.ordered.map(node => node.id)
  }

  /**
   * 获取连接的所有连接点
   */
  getConnectionPoints(node: CanvasNode): { inputs: ConnectionPoint[]; outputs: ConnectionPoint[] } {
    // 根据节点类型生成连接点
    const inputs: ConnectionPoint[] = []
    const outputs: ConnectionPoint[] = []

    // 默认连接点
    if (node.category === 'layer' || node.category === 'model') {
      inputs.push({
        id: `${node.id}-input-0`,
        name: '输入',
        type: 'input',
        dataType: 'tensor'
      })

      outputs.push({
        id: `${node.id}-output-0`,
        name: '输出',
        type: 'output',
        dataType: 'tensor'
      })
    } else if (node.category === 'activation') {
      inputs.push({
        id: `${node.id}-input-0`,
        name: '输入',
        type: 'input',
        dataType: 'tensor'
      })

      outputs.push({
        id: `${node.id}-output-0`,
        name: '输出',
        type: 'output',
        dataType: 'tensor'
      })
    }

    return { inputs, outputs }
  }

  /**
   * 【新排序方案】按层级+创建序排序
   * 返回有序节点列表，按以下规则排列：
   * 1. 检测环路，有环则返回错误
   * 2. 计算每个节点的层级（入度为0的节点层级=0，其他=max(上游层级)+1）
   * 3. 按层级递增，同层按creationId升序排列
   * 4. 孤立节点（无连线）放在末尾，按creationId升序
   */
  public getOrderedNodesByTopology(): {
    ordered: CanvasNode[];
    hasCycle: boolean;
    cycleNodes?: string[]
  } {
    // Step 1: 检测环路
    const cycleNodes = this.detectCycle()
    if (cycleNodes.length > 0) {
      return {
        ordered: [],
        hasCycle: true,
        cycleNodes
      }
    }

    // Step 2: 计算入度和构建图
    const inDegree: Record<string, number> = {}
    const graph: Record<string, string[]> = {}
    const nodeLevel: Record<string, number> = {}

    this.nodes.forEach(node => {
      inDegree[node.id] = 0
      graph[node.id] = []
      nodeLevel[node.id] = 0 // 初始化为0
    })

    this.connections.forEach(connection => {
      const sourceId = connection.source.nodeId
      const targetId = connection.target.nodeId
      graph[sourceId].push(targetId)
      inDegree[targetId]++
    })

    // Step 3: 用Kahn算法计算层级
    // 使用队列存储 {nodeId, level} 对，确保从低层到高层处理
    const queue: Array<{ nodeId: string; level: number }> = []

    // 初始化：入度为0的节点在第0层
    this.nodes.forEach(node => {
      if (inDegree[node.id] === 0) {
        queue.push({ nodeId: node.id, level: 0 })
      }
    })

    // Kahn算法遍历，同时计算层级
    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!
      nodeLevel[nodeId] = level

      // 处理该节点的所有下游节点
      graph[nodeId].forEach(neighborId => {
        inDegree[neighborId]--

        // 当入度变为0时，加入队列，层级为当前层+1
        if (inDegree[neighborId] === 0) {
          queue.push({ nodeId: neighborId, level: level + 1 })
        }
      })
    }

    // Step 4: 按层级分组
    const levelGroups: Record<number, CanvasNode[]> = {}
    const isolatedNodes: CanvasNode[] = []

    this.nodes.forEach(node => {
      const level = nodeLevel[node.id]

      // 判断是否为孤立节点（未参与任何连接）
      if (this.connections.some(conn =>
        conn.source.nodeId === node.id || conn.target.nodeId === node.id
      )) {
        // 已连接节点
        if (!levelGroups[level]) {
          levelGroups[level] = []
        }
        levelGroups[level].push(node)
      } else {
        // 孤立节点（未连线）
        isolatedNodes.push(node)
      }
    })

    // Step 5: 同层按creationId升序排序
    Object.keys(levelGroups).forEach(level => {
      levelGroups[parseInt(level)].sort((a, b) => {
        const aId = a.creationId || 0
        const bId = b.creationId || 0
        return aId - bId
      })
    })

    // Step 6: 孤立节点按creationId升序
    isolatedNodes.sort((a, b) => {
      const aId = a.creationId || 0
      const bId = b.creationId || 0
      return aId - bId
    })

    // Step 7: 合并结果（按层级递增）
    const ordered: CanvasNode[] = []
    const sortedLevels = Object.keys(levelGroups)
      .map(Number)
      .sort((a, b) => a - b)

    sortedLevels.forEach(level => {
      ordered.push(...levelGroups[level])
    })

    // 末尾追加孤立节点
    ordered.push(...isolatedNodes)

    return {
      ordered,
      hasCycle: false
    }
  }

  /**
   * 检测图中的环路，返回环中涉及的节点列表
   */
  private detectCycle(): string[] {
    const inDegree: Record<string, number> = {}
    const graph: Record<string, string[]> = {}

    this.nodes.forEach(node => {
      inDegree[node.id] = 0
      graph[node.id] = []
    })

    this.connections.forEach(connection => {
      const sourceId = connection.source.nodeId
      const targetId = connection.target.nodeId
      graph[sourceId].push(targetId)
      inDegree[targetId]++
    })

    // Kahn算法检测环
    const queue: string[] = []
    const processed = new Set<string>()

    this.nodes.forEach(node => {
      if (inDegree[node.id] === 0) {
        queue.push(node.id)
      }
    })

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      processed.add(nodeId)

      graph[nodeId].forEach(neighborId => {
        inDegree[neighborId]--
        if (inDegree[neighborId] === 0) {
          queue.push(neighborId)
        }
      })
    }

    // 如果没有处理所有节点，说明存在环
    const cycleNodes: string[] = []
    this.nodes.forEach(node => {
      if (!processed.has(node.id)) {
        cycleNodes.push(`${node.name}(${node.id})`)
      }
    })

    return cycleNodes
  }

  /**
   * 获取拓扑排序的层级映射（用于自动排列布局）
   */
  public getNodeLevels(): { levels: Record<string, number>; hasCycle: boolean } {
    const result = this.getOrderedNodesByTopology()

    if (result.hasCycle) {
      return { levels: {}, hasCycle: true }
    }

    const levels: Record<string, number> = {}
    result.ordered.forEach((node, index) => {
      levels[node.id] = index
    })

    return { levels, hasCycle: false }
  }
}
