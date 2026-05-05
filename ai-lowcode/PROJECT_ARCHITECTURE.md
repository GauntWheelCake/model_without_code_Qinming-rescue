# AI拖拉拽开发平台 - 项目结构与架构文档

**最后更新**: 2026年1月5日  
**项目版本**: 2.0 (含拓扑排序与智能缓存系统)

## 📋 项目概述

**核心定义**：AI拖拉拽开发平台是一套面向AI模型开发的可视化搭建工具，通过拖拽组件、连接节点并配置参数，自动生成可运行的PyTorch模型、训练和推理代码。

这是一个基于 **Vue 3 + Vite + TypeScript** 的AI神经网络拖拉拽开发平台，围绕“可视化搭建、组件连接、自动生成代码”组织完整工作流：用户在画布上拖拽预训练模型、神经网络层、激活函数和工具组件，通过输入/输出端口连接数据流，平台自动完成连接校验、拓扑排序和PyTorch代码生成。

**核心特性**:
- 🎨 可视化拖拽构建模型
- 🔗 智能连接验证（8层规则）
- 📊 自动拓扑排序（Kahn算法 + creationId）
- 💾 项目自动保存与加载
- 🧹 一键清除缓存
- 🤖 自动PyTorch代码生成
- ✅ 实时模型验证

---

## 🏗️ 整体架构

```
AI拖拉拽开发平台
├── 组件库 (Component Registry)
│   ├── 神经网络层 (Layers)
│   ├── 激活函数 (Activations)
│   ├── 预训练模型 (Pre-trained Models)
│   └── 工具组件 (Utilities)
│
├── 工作区引擎 (Workspace Engine)
│   ├── 节点管理 (Node Management)
│   ├── 连接管理 (Connection Manager - 1232 行)
│   ├── 拖拽系统 (Drag & Drop)
│   ├── 拓扑排序引擎 (Topology Ordering - Kahn算法)
│   └── 画布渲染 (Canvas Rendering)
│
├── 代码生成引擎 (Code Generation)
│   ├── PyTorch模板 (PyTorch Templates)
│   ├── 代码生成器 (Code Generator - 1468 行)
│   └── 拓扑排序集成 (使用ConnectionManager)
│
├── 数据持久化层 (Data Persistence)
│   ├── LocalStorage 存储
│   ├── 缓存清除系统
│   └── CreationId 管理
│
└── 数据验证层 (Validation Layer)
    ├── 拓扑验证 (Topology Validation)
    ├── 连接规则验证 (Connection Rules - 8层)
    └── 维度兼容性检查 (Dimension Compatibility)
```

---

## 📂 核心目录结构详解

### 1. **src/core/components/** - 组件注册系统

组件库的核心，定义所有可用的AI组件。

```
core/components/
├── index.ts                    # ComponentRegistry 类 - 组件注册中心
├── base.ts                     # 基础组件定义
├── builder.ts                  # 组件构建器
├── categories.ts               # 组件分类定义
├── layers/                     # 神经网络层
│   ├── basic.ts               # 全连接层、Embedding等
│   ├── convolutional.ts       # Conv1D/2D/3D、Transposed Conv等
│   ├── pooling.ts             # MaxPool、AvgPool等
│   ├── normalization.ts       # BatchNorm、LayerNorm、GroupNorm等
│   ├── recurrent.ts           # LSTM、GRU、RNN等
│   ├── attention.ts           # MultiheadAttention等
│   └── index.ts               # 导出所有层组件
├── activations/               # 激活函数
│   ├── basic.ts               # ReLU、Sigmoid、Tanh等
│   ├── advanced.ts            # GELU、Mish、Swish等
│   └── index.ts               # 导出所有激活函数
├── models/                    # 预训练模型
│   ├── vision.ts              # ResNet、VGG、MobileNet等
│   ├── transformers.ts        # BERT、GPT等
│   └── index.ts               # 导出所有模型
└── utilities/                 # 工具组件
    ├── components.ts          # Flatten、Reshape、Dropout等
    └── index.ts               # 导出所有工具
```

**关键类 - ComponentRegistry**
```typescript
// 单例模式，集中管理所有组件
class ComponentRegistry {
  // 获取单个组件定义
  getComponent(id: string): ComponentDefinition
  
  // 按分类获取组件
  getComponentsByCategory(category: string): ComponentDefinition[]
  
  // 获取所有分类
  getAllCategories(): string[]
  
  // 获取所有组件
  getAllComponents(): ComponentDefinition[]
}
```

### 2. **src/components/workspace/** - 工作区UI组件

用户交互和画布渲染的核心部分。

```
workspace/
├── WorkspaceCanvas.vue        # 主画布组件 (2100+ 行)
│   ├── 节点管理和渲染
│   ├── 连接线管理
│   ├── 拖拽放置逻辑
│   ├── 右键菜单
│   └── 项目保存/加载
│
├── Toolbox.vue                # 组件工具箱 (591 行)
│   ├── 组件分类浏览
│   ├── 搜索功能
│   ├── 视图切换 (紧凑/详细)
│   ├── 最近使用追踪
│   └── 拖拽启动
│
├── NodeEditor.vue             # 节点参数编辑器 (317 行)
│   ├── 节点名称和描述编辑
│   ├── 参数配置面板
│   │   ├── 数字输入
│   │   ├── 滑动条
│   │   ├── 文本输入
│   │   ├── 开关
│   │   ├── 下拉选择
│   │   └── 参数说明
│   └── 参数验证
│
├── ConnectionLine.vue         # 连接线视图 (254 行)
│   ├── 连接线渲染
│   ├── 交互区域（可选中/删除）
│   ├── 连接标签显示
│   └── 悬停效果
│
└── (common/icons/*.vue)       # UI图标和可复用组件
```

**WorkspaceCanvas 的核心方法**

| 方法                                | 功能               |
| ----------------------------------- | ------------------ |
| `handleDrop()`                      | 处理组件拖拽到画布 |
| `handleDragOver()`                  | 处理拖拽悬停       |
| `startConnectionDrag()`             | 开始拖拽连接       |
| `findNodeAtPosition()`              | 找到鼠标位置的节点 |
| `findNearestConnectionPoint()`      | 找到最近的连接点   |
| `startNodeDrag()`                   | 开始拖拽节点       |
| `selectNode() / selectConnection()` | 选择节点/连接      |
| `removeNode() / deleteConnection()` | 删除节点/连接      |
| `duplicateNode()`                   | 复制节点           |
| `arrangeNodes()`                    | 自动排列节点       |
| `validateModel()`                   | 验证模型有效性     |

### 3. **src/utils/connection-manager.ts** - 连接管理核心 (1232 行)

这是整个项目中**最复杂的业务逻辑**，管理节点间的连接规则验证和拓扑排序。

#### A. 连接规则的8层验证体系

```typescript
// Layer 0: 基础约束
✓ 检查节点存在性
✓ 检查自连接
✓ 检查连接重复
✓ 检查循环依赖 (使用 DFS 检测)
✓ 检查输入点占用

// Layer 1: 类别兼容性规则
✓ 类别连接矩阵 (9x9 矩阵)
✓ Flatten 自动插入提示
✓ 维度转换建议

// Layer 2: 类内冗余检查
✓ 激活函数 → 激活函数 (冗余)
✓ 池化层 → 池化层 (冗余)
✓ 归一化层 → 归一化层 (冗余)
✓ 模型 → 模型 (不允许)

// Layer 3: 维度一致性验证
✓ 全连接层: out_features == in_features
✓ 卷积层: out_channels == in_channels
✓ 嵌入层: embedding_dim == input_size
✓ 注意力: embed_dim % num_heads == 0
✓ 张量操作: Add/Multiply 的两输入维度一致

// Layer 4: 上游连接检查
✓ 激活函数、池化、归一化等"纯变换层"必须有输入
✓ 错误提示: "激活函数只做数值变换，不产生数据"

// Layer 5: 多输入节点检查
✓ Add/Multiply/Concat 至少需要2个输入
✓ 错误提示: "需要至少2个输入才能进行运算"

// Layer 6: 预训练模型入口限制
✓ ResNet/VGG/MobileNet等不应接收外部输入
✓ 应作为网络起点

// Layer 7: 卷积维度一致性
✓ Conv1D/Conv2D/Conv3D 不能混用
✓ BatchNorm1D/2D/3D 必须与卷积维度匹配

// Layer 8: BatchNorm维度匹配
✓ BN1D → Linear/Embedding
✓ BN2D → Conv2D
✓ BN3D → Conv3D
```

#### B. 拓扑排序系统 (新增)

**实现方式**: Kahn算法 + CreationId 稳定排序

```typescript
public getOrderedNodesByTopology() {
  // Step 1: 检测环路
  const cycleNodes = this.detectCycle()
  if (cycleNodes.length > 0) {
    return { ordered: [], hasCycle: true, cycleNodes }
  }

  // Step 2: 初始化入度和构建图
  const inDegree: Record<string, number> = {}
  const graph: Record<string, string[]> = {}
  const nodeLevel: Record<string, number> = {}
  
  // Step 3: Kahn算法计算层级
  const queue: Array<{ nodeId: string; level: number }> = []
  this.nodes.forEach(node => {
    if (inDegree[node.id] === 0) {
      queue.push({ nodeId: node.id, level: 0 })
    }
  })

  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!
    nodeLevel[nodeId] = level

    // 处理下游节点
    graph[nodeId].forEach(neighborId => {
      inDegree[neighborId]--
      if (inDegree[neighborId] === 0) {
        queue.push({ nodeId: neighborId, level: level + 1 })
      }
    })
  }

  // Step 4: 按层级分组，同层按creationId升序排序
  const levelGroups: Record<number, CanvasNode[]> = {}
  
  this.nodes.forEach(node => {
    const level = nodeLevel[node.id]
    if (!levelGroups[level]) {
      levelGroups[level] = []
    }
    levelGroups[level].push(node)
  })

  // Step 5: 同层按creationId升序排列
  Object.keys(levelGroups).forEach(level => {
    levelGroups[parseInt(level)].sort((a, b) => 
      (a.creationId || 0) - (b.creationId || 0)
    )
  })

  // Step 6: 合并所有层级
  const ordered: CanvasNode[] = []
  const sortedLevels = Object.keys(levelGroups)
    .map(Number)
    .sort((a, b) => a - b)

  sortedLevels.forEach(level => {
    ordered.push(...levelGroups[level])
  })

  return { ordered, hasCycle: false }
}
```

**关键特性**:
- ✅ 依赖关系尊重：严格按拓扑顺序排列
- ✅ 稳定排序：同层节点按创建顺序排列
- ✅ 孤立节点支持：独立节点放在末尾
- ✅ 环路检测：自动检测并报告循环依赖

**排序示例**:
```
输入连接: Conv2D(id=1) → ReLU(id=2) → MaxPool(id=3) → Flatten(id=4) → Linear(id=5)

Kahn算法计算层级:
  Conv2D:  入度=0, 层级=0
  ReLU:    入度=1, 层级=1
  MaxPool: 入度=1, 层级=2
  Flatten: 入度=1, 层级=3
  Linear:  入度=1, 层级=4

最终排序结果:
  [Conv2D, ReLU, MaxPool, Flatten, Linear]
```

#### C. CreationId 管理系统

在 `src/components/workspace/WorkspaceCanvas.vue` 中实现：

```typescript
// 全局计数器
let creationIdCounter = 0

// 新建节点时自动递增分配
const newNode = {
  id: generateUUID(),
  creationId: ++creationIdCounter,  // 自动分配ID
  // ... 其他属性
}

// 复制节点时分配新ID
const duplicateNode = (node: CanvasNode) => {
  const copy = {
    ...node,
    creationId: ++creationIdCounter,  // 复制后获得新ID
  }
  // ...
}

// 加载项目时恢复计数器
onMounted(() => {
  const savedData = localStorage.getItem('ai-model-project')
  if (savedData) {
    const projectData = JSON.parse(savedData)
    nodes.push(...projectData.nodes)
    
    // 恢复计数器
    creationIdCounter = Math.max(...nodes.map(n => n.creationId || 0))
    
    // 为缺失creationId的旧节点分配新值
    nodes.forEach(node => {
      if (!node.creationId || node.creationId === 0) {
        node.creationId = ++creationIdCounter
      }
    })
  }
})
```

**作用**:
- 📌 唯一标识节点的创建顺序
- 🔄 用于同层节点的稳定排序
- 💾 在跨会话中保持一致性
- 🛠️ 支持节点复制和旧项目升级

#### D. 类别连接矩阵

```typescript
const CATEGORY_CONNECTION_MATRIX: Record<ComponentCategory, Set<ComponentCategory>> = {
  basic_layers: new Set(['basic_layers', 'recurrent_layers', 'attention_layers', 'activations', 'utilities']),
  conv_layers: new Set(['conv_layers', 'pooling_layers', 'normalization_layers', 'activations', 'utilities']),
  pooling_layers: new Set(['conv_layers', 'normalization_layers', 'activations', 'utilities']),
  normalization_layers: new Set(['conv_layers', 'pooling_layers', 'activations', 'utilities']),
  recurrent_layers: new Set(['basic_layers', 'recurrent_layers', 'attention_layers', 'activations', 'utilities']),
  attention_layers: new Set(['basic_layers', 'recurrent_layers', 'attention_layers', 'activations', 'utilities']),
  activations: new Set(['basic_layers', 'conv_layers', 'pooling_layers', 'normalization_layers', 'recurrent_layers', 'attention_layers', 'utilities']),
  models: new Set(['activations', 'utilities']),
  utilities: new Set(['basic_layers', 'conv_layers', 'pooling_layers', 'normalization_layers', 'recurrent_layers', 'attention_layers', 'activations', 'utilities']),
  unknown: new Set()
}
```

#### E. 连接管理的关键方法

| 方法                                 | 功能           |
| ------------------------------------ | -------------- |
| `validateConnection()`               | 8层验证        |
| `createConnection()`                 | 创建合法连接   |
| `deleteConnection()`                 | 删除连接       |
| `wouldCreateCycle()`                 | 循环检测       |
| `getOrderedNodesByTopology()`        | **拓扑排序**   |
| `detectCycle()`                      | 环路检测       |
| `checkSourceHasUpstream()`           | 检查输入       |
| `checkCategoryConnection()`          | 类别规则       |
| `checkDimensionCompatibility()`      | 维度匹配       |
| `calculateConnectionPointPosition()` | 计算连接点坐标 |
| `generateTopology()`                 | 生成拓扑结构   |

---

## 🤖 代码生成引擎详解

### 4. **src/core/code-generation/pytorch-code-generator.ts** (1468 行)

PyTorch代码自动生成的核心模块，支持模型、训练和推理代码的完整生成。

#### A. 生成流程

```
PyTorchCodeGenerator.generate()
├─ Step 1: 获取拓扑排序的节点
│  └─ connectionManager.getOrderedNodesByTopology()
│     返回按拓扑顺序排列的节点列表
│
├─ Step 2: 生成模型类代码
│  ├─ __init__(): 初始化各层
│  │  ├─ 遍历拓扑排序的节点
│  │  └─ 根据节点参数生成 self.xxx = nn.Layer(...)
│  │
│  └─ forward(): 前向计算
│     ├─ 遍历拓扑排序的节点
│     ├─ 计算每个节点的输入
│     ├─ 处理多输入节点 (Add, Concat等)
│     └─ 串联所有层
│
├─ Step 3: 生成训练代码
│  ├─ 数据加载
│  ├─ 优化器初始化
│  ├─ 训练循环
│  └─ 验证循环
│
├─ Step 4: 生成推理代码
│  ├─ 模型加载
│  ├─ 单样本推理
│  └─ 批量推理
│
└─ Step 5: 生成配置
   ├─ 依赖列表 (requirements.txt)
   └─ 模型摘要 (layer总数, 参数量等)
```

#### B. 关键方法

| 方法                          | 功能                           |
| ----------------------------- | ------------------------------ |
| `generate()`                  | 生成完整代码                   |
| `generateModelClass()`        | 生成模型类                     |
| `generateLayers()`            | 生成层定义 (使用拓扑排序)      |
| `generateForwardCode()`       | 生成forward方法 (使用拓扑排序) |
| `getTopologicalSortedNodes()` | 获取排序后的节点               |
| `generateLayerCode(node)`     | 生成单个层的代码               |
| `generateTrainingCode()`      | 生成训练脚本                   |
| `generateInferenceCode()`     | 生成推理脚本                   |
| `generateRequirements()`      | 生成依赖列表                   |
| `generateModelSummary()`      | 生成模型摘要                   |

#### C. 拓扑排序集成

```typescript
private generateLayers(): string {
  const layers: string[] = []
  
  // 👇 使用拓扑排序的节点列表
  const topoSortedNodes = this.getTopologicalSortedNodes()
  
  // 遍历排序后的节点，按顺序生成代码
  topoSortedNodes.forEach((node, index) => {
    const layerCode = this.generateLayerCode(node, index + 1)
    if (layerCode) {
      layers.push(layerCode)
    }
  })
  
  return layers.join('\n')
}

private generateForwardCode(): string {
  const topoSortedNodes = this.getTopologicalSortedNodes()
  const forwardSteps: string[] = []
  const nodeOutputVar = new Map<string, string>()
  
  // 按拓扑顺序遍历节点
  topoSortedNodes.forEach((node, index) => {
    const layerName = this.getLayerName(node, index + 1)
    
    // 获取上游连接
    const upstreamConnections = this.connections.filter(
      conn => conn.target.nodeId === node.id
    )
    
    // ... 生成该层的forward代码 ...
  })
  
  return forwardSteps.join('\n')
}

// getTopologicalSortedNodes() 的实现
private getTopologicalSortedNodes(): CanvasNode[] {
  const result = this.connectionManager.getOrderedNodesByTopology()
  
  if (result.hasCycle) {
    throw new Error(
      `无法生成代码：检测到循环依赖。涉及节点：${result.cycleNodes?.join(', ')}`
    )
  }
  
  // 返回已连接的节点（排除孤立节点）
  const connectedNodeIds = new Set<string>()
  this.connections.forEach(conn => {
    connectedNodeIds.add(conn.source.nodeId)
    connectedNodeIds.add(conn.target.nodeId)
  })
  
  return result.ordered.filter(node => connectedNodeIds.has(node.id))
}
```

#### D. 生成代码示例

**输入模型**: Conv2D → ReLU → MaxPool2D → Flatten → Linear

**生成的代码**:
```python
class MyModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv2d_1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.relu_2 = nn.ReLU()
        self.maxpool2d_3 = nn.MaxPool2d(kernel_size=2, stride=2)
        self.flatten_4 = nn.Flatten()
        self.linear_5 = nn.Linear(32 * 112 * 112, 10)
    
    def forward(self, x):
        x = self.conv2d_1(x)
        x = self.relu_2(x)
        x = self.maxpool2d_3(x)
        x = self.flatten_4(x)
        x = self.linear_5(x)
        return x
```

**关键点**:
- ✅ 层的顺序与拓扑排序完全一致
- ✅ forward方法中执行顺序正确
- ✅ 参数按节点配置生成
- ✅ 支持多输入层 (Add, Concat)

---

## 💾 数据持久化与缓存管理

### 5. 项目保存与加载

#### A. 保存机制

```typescript
// src/components/workspace/WorkspaceCanvas.vue

const saveProject = () => {
  const projectData = {
    nodes: nodes,
    connections: connections,
    timestamp: new Date().toISOString()
  }
  localStorage.setItem('ai-model-project', JSON.stringify(projectData))
  ElMessage.success('项目已保存')
}
```

**保存内容**:
- 所有节点（包括位置、参数、creationId）
- 所有连接信息
- 时间戳

#### B. 加载机制

```typescript
onMounted(() => {
  const savedData = localStorage.getItem('ai-model-project')
  if (savedData) {
    try {
      const projectData = JSON.parse(savedData)
      nodes.push(...projectData.nodes)
      connections.push(...projectData.connections)
      
      // 恢复 creationIdCounter
      if (nodes.length > 0) {
        creationIdCounter = Math.max(...nodes.map(n => n.creationId || 0))
        
        // 为缺失 creationId 的旧节点分配新值
        nodes.forEach(node => {
          if (!node.creationId || node.creationId === 0) {
            node.creationId = ++creationIdCounter
          }
        })
      }
      
      ElMessage.success('已加载上次保存的项目')
    } catch (error) {
      console.error('加载项目失败:', error)
    }
  }
})
```

**关键特性**:
- ✅ 自动恢复上次会话
- ✅ CreationId 自动升级
- ✅ 错误处理机制

### 6. 缓存清除系统 (新增)

#### A. UI 中的清除按钮

```vue
<!-- src/components/workspace/WorkspaceCanvas.vue -->
<el-button size="small" @click="clearCacheAndReload" type="warning">
  <el-icon><Delete /></el-icon>
  清除缓存
</el-button>
```

#### B. 清除函数实现

```typescript
const clearCacheAndReload = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有缓存并重新加载吗？\n\n将删除：\n- 项目数据\n- 最近使用的组件\n- 所有浏览器缓存',
      '清除缓存',
      {
        confirmButtonText: '确定清除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 清除所有 localStorage 数据
    localStorage.clear()
    
    // 清除 Service Worker 缓存
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    }
    
    ElMessage.success('缓存已清除，3秒后重新加载页面...')
    
    // 延迟 3 秒后刷新页面
    setTimeout(() => {
      window.location.reload()
    }, 3000)
  } catch {
    // 用户取消
  }
}
```

#### C. 清除的内容

| 清除项              | 说明                |
| ------------------- | ------------------- |
| `ai-model-project`  | 保存的项目数据      |
| `recent_components` | 最近使用的组件列表  |
| Service Worker 缓存 | 离线支持缓存        |
| 浏览器缓存          | HTML/JS/CSS静态资源 |

#### D. 其他清除方法

**方法1: 浏览器开发者工具**
- F12 → Application → Local Storage → 清除

**方法2: 浏览器菜单**
- Ctrl+Shift+Delete → 清除缓存数据

**方法3: 控制台命令**
```javascript
localStorage.clear()
window.location.reload()
```

**方法4: 无痕模式**
- 打开无痕窗口，自动隔离数据

---

### 拖拽系统详解

#### 完整拖拽流程

```
1️⃣ 组件库拖拽 (Toolbox.vue)
   ├─ @dragstart: 开始拖拽
   ├─ getData('component'): 获取组件JSON定义
   └─ 拖拽光标跟随

2️⃣ 画布接收 (WorkspaceCanvas.vue)
   ├─ @dragover: e.preventDefault() 允许drop
   └─ @drop: handleDrop() 处理放置
      ├─ 提取组件数据和坐标
      ├─ 生成新 CanvasNode (含creationId)
      ├─ 自动生成输入/输出连接点
      └─ nodes.push() → UI响应式更新

3️⃣ 连接点拖拽
   ├─ @mousedown: startConnectionDrag()
   ├─ 创建临时连接线 (tempConnection)
   ├─ @mousemove: 实时验证 & 坐标更新
   │  ├─ findNodeAtPosition(): 检测目标节点
   │  ├─ findNearestConnectionPoint(): 找最近点
   │  └─ connectionManager.validateConnection(): 8层验证
   ├─ 显示绿色(有效)/红色(无效)反馈
   └─ @mouseup: createConnection() 或取消

4️⃣ 节点拖拽
   ├─ @mousedown: startNodeDrag()
   ├─ @mousemove: 更新 node.position
   ├─ updateConnectionPositions(): 更新连接线坐标
   └─ @mouseup: 结束拖拽
```

#### 坐标计算关键公式

```typescript
// 1. 组件放置到画布
const canvasRect = canvasRef.value?.getBoundingClientRect()
const x = e.clientX - canvasRect.left - 100
const y = e.clientY - canvasRect.top - 30

// 2. 节点命中检测 (含扩展区)
const HIT_EXTEND_X = 50
if (clientX >= nodeLeft - HIT_EXTEND_X && 
    clientX <= nodeRight + HIT_EXTEND_X) {
  // 节点命中
}

// 3. 连接点命中检测 (半径40px)
const HIT_RADIUS = 40
const distance = Math.sqrt(
  Math.pow(mouseX - pointX, 2) + 
  Math.pow(mouseY - pointY, 2)
)
if (distance < HIT_RADIUS) {
  // 连接点命中
}

// 4. 连接点坐标计算 (关键!)
const NODE_WIDTH = 200
const NODE_HEIGHT = 170
const GAP = 12  // CSS布局偏移
const verticalSpacing = NODE_HEIGHT / (points.length + 1)

const x = type === 'input' 
  ? node.position.x - GAP
  : node.position.x + NODE_WIDTH + GAP
const y = node.position.y + verticalSpacing * (index + 1)
```

---

## 🔗 连接点坐标计算

```typescript
public calculateConnectionPointPosition(
  node: CanvasNode,
  pointId: string,
  type: 'input' | 'output'
): { x: number; y: number } {
  
  const NODE_WIDTH = 200
  const NODE_TOTAL_HEIGHT = 170
  const GAP = 12  // CSS转换偏移
  
  const points = type === 'input' ? node.inputs : node.outputs
  const pointIndex = points.findIndex(p => p.id === pointId)
  
  // 均匀垂直分布
  const verticalSpacing = NODE_TOTAL_HEIGHT / (points.length + 1)
  const y = node.position.y + verticalSpacing * (pointIndex + 1)
  
  const x = type === 'input' 
    ? node.position.x - GAP
    : node.position.x + NODE_WIDTH + GAP
  
  return { x, y }
}
```

---

## 📊 核心数据结构

```typescript
// CanvasNode - 画布节点
interface CanvasNode {
  id: string                    // UUID
  name: string                  // 节点名称
  type: string                  // 组件类型 (conv2d, linear等)
  category: string              // 分类
  position: { x: number; y: number }  // 画布坐标
  creationId: number            // ✨ 创建顺序ID (用于排序)
  params: NodeParam[]           // 配置参数
  inputs: ConnectionPoint[]     // 输入连接点
  outputs: ConnectionPoint[]    // 输出连接点
  metadata?: ComponentMetadata   // 元数据
}

// Connection - 连接线
interface Connection {
  id: string
  source: {
    nodeId: string
    pointId: string
    x: number; y: number
  }
  target: {
    nodeId: string
    pointId: string
    x: number; y: number
  }
  style: {
    color: string
    width: number
    dashed: boolean
    arrowType: 'filled' | 'hollow' | 'default'
  }
  data: {
    dataType?: string
    shape?: number[]
    tensorName?: string
  }
}
```

### 状态管理流程

```
用户操作
   ↓
WorkspaceCanvas.vue (响应式数据)
  - nodes[]
  - connections[]
  - selectedNodeId
  - tempConnection
   ↓
ConnectionManager (业务逻辑)
  - validateConnection() [8层]
  - getOrderedNodesByTopology() [Kahn算法]
  - detectCycle()
   ↓
Python代码生成

---

## 📦 类型定义层

**src/types/node.ts** 定义了所有核心类型

```typescript
// 组件定义 (from 组件库)
interface ComponentDefinition {
  id: string                    // "conv2d", "linear" 等
  name: string                  // "卷积层 (2D)"
  description: string
  category: string              // "conv_layers", "basic_layers" 等
  type: 'layer' | 'activation' | 'model' | 'utility'
  params: NodeParam[]           // 可配置参数
  inputs: Array<{               // 输入连接点定义
    name: string
    dataType?: string
    shape?: number[]
  }>
  outputs: Array<{              // 输出连接点定义
    name: string
    dataType?: string
    shape?: number[]
  }>
}

// 节点参数
interface NodeParam {
  key: string                   // "out_channels"
  label: string                 // "输出通道数"
  type: 'number' | 'string' | 'boolean' | 'select' | 'range'
  value: any                    // 当前值
  options?: Array<{label, value}>  // 下拉选项
  min?: number; max?: number    // 范围
  step?: number                 // 步长
  placeholder?: string
}
```

---

## 💾 数据持久化

```typescript
// WorkspaceCanvas.vue 中的保存机制

// 保存到 LocalStorage
const saveProject = () => {
  const projectData = {
    nodes: nodes,
    connections: connections,
    timestamp: new Date().toISOString()
  }
  localStorage.setItem('ai-model-project', JSON.stringify(projectData))
}

// 加载保存的项目 (onMounted)
onMounted(() => {
  const savedData = localStorage.getItem('ai-model-project')
  if (savedData) {
    const projectData = JSON.parse(savedData)
    nodes.push(...projectData.nodes)
    connections.push(...projectData.connections)
  }
})

// 未保存状态跟踪
const isUnsaved = ref(false)  // 监听任何修改
const lastSavedState = ref<string>('')  // 上次保存的状态
```

---

## 🎨 可视化渲染

### SVG 连接线渲染

```vue
<!-- WorkspaceCanvas.vue -->
<svg class="connections-layer">
  <!-- 贝塞尔曲线连接 -->
  <path
    :d="getConnectionPath(connection)"
    :stroke="connection.style.color"
    :stroke-width="connection.style.width"
    marker-end="url(#arrowhead-default)"
  />
  
  <!-- 交互区域 (透明，更宽) -->
  <path
    :d="getConnectionPath(connection)"
    stroke="transparent"
    stroke-width="12"
  />
</svg>

// 贝塞尔曲线公式
const getConnectionPath = (connection: Connection): string => {
  const { source, target } = connection
  const offsetX = Math.abs(target.x - source.x) * 0.3
  
  return `
    M ${source.x} ${source.y}
    C ${source.x + offsetX} ${source.y},
---

### SVG 连接线渲染

```vue
<!-- WorkspaceCanvas.vue -->
<svg class="connections-layer">
  <!-- 贝塞尔曲线连接 -->
  <path
    :d="getConnectionPath(connection)"
    :stroke="connection.style.color"
    :stroke-width="connection.style.width"
    marker-end="url(#arrowhead-default)"
  />
</svg>

// 贝塞尔曲线公式
const getConnectionPath = (connection) => {
  const { source, target } = connection
  const offsetX = Math.abs(target.x - source.x) * 0.3
  
  return `
    M ${source.x} ${source.y}
    C ${source.x + offsetX} ${source.y},
      ${target.x - offsetX} ${target.y},
      ${target.x} ${target.y}
  `
}
```

### CSS 节点与连接点布局

```scss
// 节点：200px × 170px (固定尺寸)
.canvas-node {
  width: 200px;
  height: 170px;
  position: absolute;
}

// 输入点在左侧
.input-points {
  position: absolute;
  left: -60px;  // 节点左侧60px外
  
  .point-indicator {
    position: absolute;
    left: 48px;   // 相对左侧12px
  }
}

// 输出点在右侧
.output-points {
  position: absolute;
  right: -60px;  // 节点右侧60px外
  
  .point-indicator {
    position: absolute;
    right: 48px;  // 相对右侧12px
  }
}
```
  - 对每条 source → target 的连接
  - target的入度 += 1

Step 2: 初始化队列
  - 将所有入度为0的节点加入队列
  - 这些是"源节点"，没有依赖

Step 3: 逐层处理
  - 取出队列中的节点 → 分配当前层级 level
  - 处理该节点的所有下游节点
  - 下游节点的入度 -= 1
  - 如果下游节点的入度变为0 → 加入队列，level+1

Step 4: 重复直到队列为空
  - 所有节点都被处理
  - 所有节点都有层级分配

Step 5: 检测环路
  - 如果还有节点未被处理 → 存在环路
  - 返回参与环路的节点名称

Time Complexity: O(V + E)
Space Complexity: O(V)


### CreationId 在稳定排序中的作用

场景: 多个节点处于同一层级

例如: 
  Layer 0: Node A (id=1), Node B (id=3), Node C (id=2)
  
按 creationId 排序:
  按升序: 1, 2, 3
  结果: Node A, Node C, Node B
  
优势:
  ✓ 同层节点总是按创建顺序排列
  ✓ 排序结果稳定可预测
  ✓ 用户看到的顺序符合预期
  ✓ 支持复制节点后的正确排序

### 连接验证的8层体系

规则验证按顺序执行，遇到错误立即返回：

Layer 0 ✓ 基础约束
  - 节点存在?
  - 自连接?
  - 连接重复?
  - 循环依赖?
  
Layer 1 ✓ 类别兼容性
  - 查询 CATEGORY_CONNECTION_MATRIX
  - 源类别允许连接到目标类别?
  
Layer 2 ✓ 类内冗余检查
  - 激活→激活?
  - 池化→池化?
  
Layer 3 ✓ 维度一致性
  - 输入维度 == 输出维度?
  - 通道数匹配?
  
Layer 4 ✓ 上游连接检查
  - 纯变换层有输入?
  
Layer 5 ✓ 多输入检查
  - Add/Concat 有足够输入?
  
Layer 6 ✓ 预训练模型检查
  - ResNet不应有外部输入?
  
Layer 7 ✓ 卷积维度一致
  - Conv1D/2D/3D不混用?
  
Layer 8 ✓ BatchNorm维度
  - BN维度与卷积匹配?

---

## 🛠️ 开发与调试指南

### 修改连接规则

```typescript
// src/utils/connection-manager.ts

// 修改类别连接矩阵
const CATEGORY_CONNECTION_MATRIX: Record<ComponentCategory, Set<ComponentCategory>> = {
  basic_layers: new Set([
    'basic_layers', 
    'recurrent_layers', 
    'attention_layers', 
    'activations', 
    'utilities'
  ]),
  // ... 其他规则
}

// 修改后自动生效，无需重启
```

### 添加新组件

```typescript
// src/core/components/layers/custom.ts

const customComponentDefinition: ComponentDefinition = {
  id: 'custom_layer',
  name: '自定义层',
  category: 'basic_layers',
  type: 'layer',
  params: [
    { key: 'out_features', label: '输出特征数', type: 'number', value: 64 }
  ],
  inputs: [{ name: '输入', dataType: 'tensor' }],
  outputs: [{ name: '输出', dataType: 'tensor' }]
}

// 在 index.ts 中导出
export const CUSTOM_COMPONENTS = [customComponentDefinition]
```

### 调试拓扑排序

```javascript
// 浏览器控制台运行

// 获取拓扑排序结果
const result = connectionManager.getOrderedNodesByTopology()
console.log('节点顺序:', result.ordered.map(n => ({ name: n.name, creationId: n.creationId })))
console.log('有环?', result.hasCycle)

// 检查缓存
console.log('LocalStorage项目数据:', localStorage.getItem('ai-model-project'))

// 检查creationId分布
JSON.parse(localStorage.getItem('ai-model-project')).nodes.forEach(n => {
  console.log(`${n.name}: creationId=${n.creationId}`)
})
```

### 常见问题解决

| 问题               | 原因                           | 解决                       |
| ------------------ | ------------------------------ | -------------------------- |
| 代码生成顺序错误   | creationId未分配或环路检测失败 | 清除缓存 → 重新加载        |
| 无法连接节点       | 触发了8层验证规则              | 检查错误提示，调整模型结构 |
| 画布加载旧项目     | localStorage缓存问题           | 点击"清除缓存"按钮         |
| 复制节点后顺序混乱 | creationId冲突                 | 刷新页面，系统自动修复     |
| 拖拽连接不精确     | 命中半径太小                   | 调整 HIT_RADIUS = 40px     |

---

## 📊 性能指标

| 指标             | 数值   | 说明                |
| ---------------- | ------ | ------------------- |
| 最大节点数       | 100+   | 建议不超过100个节点 |
| 代码生成速度     | <100ms | 防抖500ms           |
| 连接验证延迟     | <10ms  | 实时反馈            |
| localStorage大小 | <5MB   | 浏览器限制          |
| Kahn算法复杂度   | O(V+E) | 线性时间            |

---

## 📚 相关文件索引

| 文件                                                 | 行数     | 功能                   |
| ---------------------------------------------------- | -------- | ---------------------- |
| `src/types/node.ts`                                  | 200+     | 类型定义               |
| `src/utils/connection-manager.ts`                    | 1232     | 连接管理 + 拓扑排序    |
| `src/components/workspace/WorkspaceCanvas.vue`       | 2131     | 画布UI + 项目保存/加载 |
| `src/components/workspace/Toolbox.vue`               | 591      | 组件工具箱             |
| `src/core/code-generation/pytorch-code-generator.ts` | 1468     | 代码生成               |
| `src/core/components/layers/`                        | 多文件   | 组件库定义             |
| `CACHE_CLEAR_SOLUTION.md`                            | 完整教程 | 缓存清除方法           |

---

## ✨ 关键创新点

1. **拓扑排序 + CreationId 混合排序**
   - 尊重依赖关系（拓扑序）
   - 保证稳定排序（CreationId）
   - 自动升级旧项目（无缺失）

2. **8层连接验证体系**
   - 从基础约束到特殊场景
   - 友好的错误提示
   - 防止用户误操作

3. **自动代码生成 + 实时预览**
   - 防抖机制避免频繁生成
   - 使用拓扑排序保证代码正确性
   - 支持完整的模型+训练+推理代码

4. **数据持久化 + 智能缓存清除**
   - 自动保存到LocalStorage
   - 一键清除缓存
   - 支持无痕模式隔离

5. **可视化拖拽系统**
   - 精确的连接点计算
   - 容错机制（40px命中半径）
   - 贝塞尔曲线连接线

---

## 🚀 快速开始开发

### 修改连接规则

编辑 `src/utils/connection-manager.ts` 中的 `CATEGORY_CONNECTION_MATRIX`：

```typescript
const CATEGORY_CONNECTION_MATRIX: Record<ComponentCategory, Set<ComponentCategory>> = {
  basic_layers: new Set(['basic_layers', 'recurrent_layers', 'attention_layers', 'activations', 'utilities']),
  conv_layers: new Set(['conv_layers', 'pooling_layers', 'normalization_layers', 'activations', 'utilities']),
  // ... 根据需要修改
}
```

修改立即生效，无需重启应用。

### 添加新组件

在 `src/core/components/` 中创建新组件定义：

```typescript
const customComponent: ComponentDefinition = {
  id: 'custom_layer',
  name: '自定义层',
  category: 'basic_layers',
  type: 'layer',
  params: [{ key: 'out_features', label: '输出特征数', type: 'number', value: 64 }],
  inputs: [{ name: '输入', dataType: 'tensor' }],
  outputs: [{ name: '输出', dataType: 'tensor' }]
}
```

### 调试拓扑排序

在浏览器控制台运行：

```javascript
// 获取拓扑排序结果
const result = connectionManager.getOrderedNodesByTopology()
console.log('排序:', result.ordered.map(n => n.name))
console.log('有环:', result.hasCycle)

// 验证creationId
JSON.parse(localStorage.getItem('ai-model-project'))
  .nodes.forEach(n => console.log(`${n.name}: creationId=${n.creationId}`))
```

---

## 📞 常见问题

| 问题             | 解决方案                      |
| ---------------- | ----------------------------- |
| 代码生成顺序错误 | 清除缓存 → 重新加载项目       |
| 无法连接节点     | 检查错误提示，查看8层验证规则 |
| 画布加载旧项目   | 点击"清除缓存"按钮            |
| 拖拽连接不精确   | 调整 HIT_RADIUS (命中半径)    |

---

## 📊 项目统计

| 组件                 | 行数      | 功能                |
| -------------------- | --------- | ------------------- |
| ConnectionManager    | 1232      | 连接管理 + 拓扑排序 |
| PyTorchCodeGenerator | 1468      | 代码生成            |
| WorkspaceCanvas      | 2131      | 画布UI              |
| Toolbox              | 591       | 组件工具箱          |
| **总计**             | **5422+** | 完整拖拉拽开发平台      |

---

**最后更新**: 2026年1月5日  
**维护者**: GauntCat
````

