import type { CanvasNode, Connection, ConnectionValidation, ModelTopology, ConnectionPoint } from '../types/node'

export class ConnectionManager {
  private nodes: CanvasNode[] = []
  private connections: Connection[] = []

  constructor(nodes: CanvasNode[], connections: Connection[]) {
    this.nodes = nodes
    this.connections = connections
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
      }
    }

    this.connections.push(newConnection)

    // 更新节点的连接状态
    this.updateNodeConnections(newConnection)

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

    // 检查类型兼容性（简化版）
    if (sourceNode && targetNode) {
      const compatibility = this.checkTypeCompatibility(sourceNode, targetNode)
      if (!compatibility.valid) {
        errors.push(...compatibility.errors)
      }

      // 检查关键维度兼容性（例如：全连接层 in/out_features）
      const featureCompat = this.checkFeatureCompatibility(sourceNode, targetNode)
      if (!featureCompat.valid) {
        errors.push(...featureCompat.errors)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? `连接无效: ${errors.join(', ')}` : '连接有效'
    }
  }

  /**
   * 检查是否会产生循环依赖
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
   * 检查类型兼容性
   */
  private checkTypeCompatibility(sourceNode: CanvasNode, targetNode: CanvasNode): ConnectionValidation {
    const errors: string[] = []

    // 简单的类型兼容性检查
    // 在实际应用中，这里可以检查数据类型、形状等

    // 示例：检查激活函数后面不能接某些层
    if (sourceNode.category === 'activation' && targetNode.type === 'dropout') {
      // 这通常是允许的，这里只是示例
    }

    // 检查输入输出形状是否兼容
    const sourceOutputShape = sourceNode.metadata?.outputShape
    const targetInputShape = targetNode.metadata?.inputShape

    if (sourceOutputShape && targetInputShape) {
      // 简化的形状兼容性检查
      if (sourceOutputShape.length !== targetInputShape.length) {
        errors.push(`形状不兼容: 源输出形状 ${sourceOutputShape.join('x')} 与目标输入形状 ${targetInputShape.join('x')}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? `类型不兼容: ${errors.join(', ')}` : '类型兼容'
    }
  }

  /**
   * 更“懂业务”的维度兼容性检查。
   * 目标：至少保证常见的 MLP（全连接链路）不会把 out_features 接到不匹配的 in_features 上。
   * - 若无法推断维度（例如卷积/展平混合、形状未知），则不阻止连接。
   */
  private checkFeatureCompatibility(sourceNode: CanvasNode, targetNode: CanvasNode): ConnectionValidation {
    const errors: string[] = []

    // 通用特征维度检查（线性、嵌入、注意力等）
    const sourceOut = this.getNodeOutputFeatureSize(sourceNode)
    const targetIn = this.getNodeInputFeatureSize(targetNode)

    if (sourceOut != null && targetIn != null && sourceOut !== targetIn) {
      errors.push(`特征维度不匹配: 源输出 ${sourceOut} != 目标输入 ${targetIn}`)
    }

    // 卷积/归一化/卷积链路通道数检查
    const sourceOutC = this.getNodeOutputChannels(sourceNode)
    const targetInC = this.getNodeInputChannels(targetNode)
    if (sourceOutC != null && targetInC != null && sourceOutC !== targetInC) {
      errors.push(`通道数不匹配: 源输出通道 ${sourceOutC} != 目标输入/特征通道 ${targetInC}`)
    }

    // 展平到线性：推断展平后的特征数是否匹配 Linear.in_features
    if (sourceNode.type === 'flatten' && targetNode.name === '全连接层') {
      const upstream = this.getImmediateUpstreamNode(sourceNode.id)
      const inFeatures = this.getParamAsNumber(targetNode, 'in_features')
      if (upstream && inFeatures != null) {
        const shape = this.getNodeOutputShape(upstream)
        if (shape && shape.length >= 2) {
          // 跳过 batch 维（通常是第 0 维），其余维相乘
          const dims = shape.slice(1).filter(d => d != null && d > 0)
          if (dims.length > 0) {
            const flattened = dims.reduce((acc, v) => acc * v, 1)
            if (flattened !== inFeatures) {
              errors.push(`展平到线性维度不匹配: 展平得到 ${flattened} != 线性层要求 ${inFeatures}`)
            }
          }
        }
      }
    }

    // 嵌入到RNN/GRU/LSTM：embedding_dim == input_size
    if (sourceNode.type === 'embedding' && ['lstm', 'gru', 'rnn'].includes(targetNode.type)) {
      const embDim = this.getParamAsNumber(sourceNode, 'embedding_dim')
      const rnnIn = this.getParamAsNumber(targetNode, 'input_size')
      if (embDim != null && rnnIn != null && embDim !== rnnIn) {
        errors.push(`嵌入维度不匹配: embedding_dim ${embDim} != RNN输入大小 ${rnnIn}`)
      }
    }

    // 线性到注意力（多头注意力）：最后特征维度 == embed_dim
    if (targetNode.type === 'multihead_attention') {
      const embedDim = this.getParamAsNumber(targetNode, 'embed_dim')
      if (embedDim != null && sourceOut != null && sourceOut !== embedDim) {
        errors.push(`注意力嵌入维度不匹配: 源特征 ${sourceOut} != 目标 embed_dim ${embedDim}`)
      }
      // 内部参数一致性：embed_dim 必须能被 num_heads 整除
      const numHeads = this.getParamAsNumber(targetNode, 'num_heads')
      if (embedDim != null && numHeads != null && embedDim % numHeads !== 0) {
        errors.push(`注意力参数不合法: embed_dim ${embedDim} 不能被 num_heads ${numHeads} 整除`)
      }
    }

    // 张量操作：add/multiply 要求输入形状/特征一致；concatenate允许按指定维度拼接
    if (['add', 'multiply', 'concatenate'].includes(targetNode.type)) {
      const existingInputs = this.connections.filter(c => c.target.nodeId === targetNode.id)
      if (existingInputs.length > 0) {
        const otherSource = this.nodes.find(n => n.id === existingInputs[0].source.nodeId)
        if (otherSource) {
          const aFeat = sourceOut
          const bFeat = this.getNodeOutputFeatureSize(otherSource)
          const aCh = sourceOutC
          const bCh = this.getNodeOutputChannels(otherSource)

          if (targetNode.type === 'add' || targetNode.type === 'multiply') {
            // 要求特征或通道相同（至少有一个维度可比且一致）
            const featureComparable = aFeat != null && bFeat != null
            const channelComparable = aCh != null && bCh != null
            if (featureComparable && aFeat !== bFeat) {
              errors.push(`逐元素操作维度不匹配: 两输入特征维度 ${aFeat} 与 ${bFeat} 不一致`)
            } else if (!featureComparable && channelComparable && aCh !== bCh) {
              errors.push(`逐元素操作通道不匹配: 两输入通道数 ${aCh} 与 ${bCh} 不一致`)
            }
          }
          // concatenate 默认允许通道不同（在通道维拼接），此处不强制检查
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? `维度不兼容: ${errors.join(', ')}` : '维度兼容'
    }
  }

  private getParamAsNumber(node: CanvasNode, key: string): number | null {
    const param = node.params?.find(p => p.key === key)
    if (!param) return null
    const value = typeof param.value === 'string' ? Number(param.value) : param.value
    return Number.isFinite(value) ? Number(value) : null
  }

  private isPrebuiltVisionModel(node: CanvasNode): boolean {
    return [
      'ResNet',
      'VGGNet',
      'MobileNet V2',
      'EfficientNet',
      'DenseNet'
    ].includes(node.name)
  }

  /**
   * 返回节点输出的“特征维度/类别数”（能确定就返回数字，否则返回 null）。
   */
  private getNodeOutputFeatureSize(node: CanvasNode): number | null {
    if (node.name === '全连接层') {
      return this.getParamAsNumber(node, 'out_features')
    }

    // 预训练分类模型：输出通常是 num_classes
    if (this.isPrebuiltVisionModel(node)) {
      return this.getParamAsNumber(node, 'num_classes') ?? 1000
    }

    // 嵌入层输出特征维度为 embedding_dim
    if (node.type === 'embedding') {
      return this.getParamAsNumber(node, 'embedding_dim')
    }

    return null
  }

  /**
   * 返回节点输入需要的“特征维度”。
   */
  private getNodeInputFeatureSize(node: CanvasNode): number | null {
    if (node.name === '全连接层') {
      return this.getParamAsNumber(node, 'in_features')
    }
    // RNN/GRU/LSTM 输入特征维度
    if (['lstm', 'gru', 'rnn'].includes(node.type)) {
      return this.getParamAsNumber(node, 'input_size')
    }
    // 多头注意力嵌入维度
    if (node.type === 'multihead_attention') {
      return this.getParamAsNumber(node, 'embed_dim')
    }
    return null
  }

  /**
   * 通道数提取（卷积/归一化家族）
   */
  private getNodeOutputChannels(node: CanvasNode): number | null {
    // 卷积/转置卷积/深度可分离卷积输出通道
    if (['conv1d', 'conv2d', 'conv3d', 'transposed_conv2d', 'depthwise_conv2d'].includes(node.type)) {
      return this.getParamAsNumber(node, 'out_channels')
    }
    // 归一化层输出通道与其特征数相同
    if (['batchnorm1d', 'batchnorm2d', 'instancenorm2d'].includes(node.type)) {
      return this.getParamAsNumber(node, 'num_features')
    }
    if (node.type === 'groupnorm') {
      return this.getParamAsNumber(node, 'num_channels')
    }
    // 其他默认未知
    return null
  }

  private getNodeInputChannels(node: CanvasNode): number | null {
    // 卷积类输入通道
    if (['conv1d', 'conv2d', 'conv3d', 'transposed_conv2d', 'depthwise_conv2d'].includes(node.type)) {
      return this.getParamAsNumber(node, 'in_channels')
    }
    // 归一化类特征/通道数
    if (['batchnorm1d', 'batchnorm2d', 'instancenorm2d'].includes(node.type)) {
      return this.getParamAsNumber(node, 'num_features')
    }
    if (node.type === 'groupnorm') {
      return this.getParamAsNumber(node, 'num_channels')
    }
    return null
  }

  /** 获取节点的输出形状（优先使用显式 outputs.shape，其次使用元数据默认形状） */
  private getNodeOutputShape(node: CanvasNode): number[] | null {
    const fromOutput = node.outputs && node.outputs.length > 0 ? node.outputs[0].shape : undefined
    if (fromOutput && Array.isArray(fromOutput)) return fromOutput
    const fromMeta = node.metadata?.outputShape || node.metadata?.defaultOutputShape
    if (fromMeta && Array.isArray(fromMeta)) return fromMeta
    return null
  }

  /** 获取某节点的直接上游（第一个输入连接的源） */
  private getImmediateUpstreamNode(nodeId: string): CanvasNode | null {
    const incoming = this.connections.find(c => c.target.nodeId === nodeId)
    if (!incoming) return null
    return this.nodes.find(n => n.id === incoming.source.nodeId) || null
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
   * 更新连接位置（当节点移动时）
   */
  updateConnectionPositions(nodeId: string): void {
    const node = this.nodes.find(n => n.id === nodeId)
    if (!node) return

    // 更新所有与该节点相关的连接
    this.connections.forEach(connection => {
      if (connection.source.nodeId === nodeId) {
        const position = this.calculateConnectionPointPosition(
          node,
          connection.source.pointId,
          'output'
        )
        connection.source.x = position.x
        connection.source.y = position.y
      }

      if (connection.target.nodeId === nodeId) {
        const position = this.calculateConnectionPointPosition(
          node,
          connection.target.pointId,
          'input'
        )
        connection.target.x = position.x
        connection.target.y = position.y
      }
    })
  }

  /**
   * 生成模型拓扑结构
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

    // 拓扑排序
    const layers = this.topologicalSort()
    const hasCycles = layers.length !== this.nodes.length

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
   * 拓扑排序（Kahn算法）
   */
  private topologicalSort(): string[] {
    const inDegree: Record<string, number> = {}
    const graph: Record<string, string[]> = {}

    // 初始化
    this.nodes.forEach(node => {
      inDegree[node.id] = 0
      graph[node.id] = []
    })

    // 构建图
    this.connections.forEach(connection => {
      const sourceId = connection.source.nodeId
      const targetId = connection.target.nodeId

      graph[sourceId].push(targetId)
      inDegree[targetId]++
    })

    // 找到所有入度为0的节点
    const queue: string[] = []
    Object.keys(inDegree).forEach(nodeId => {
      if (inDegree[nodeId] === 0) {
        queue.push(nodeId)
      }
    })

    // 拓扑排序
    const result: string[] = []
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      result.push(nodeId)

      graph[nodeId].forEach(neighborId => {
        inDegree[neighborId]--
        if (inDegree[neighborId] === 0) {
          queue.push(neighborId)
        }
      })
    }

    return result
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
}