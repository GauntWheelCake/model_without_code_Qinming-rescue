# 新排序系统实现文档

## 概述

重新实现了节点排序逻辑，从旧的"按数组创建顺序"改为"**拓扑排序+创建序稳定并列**"。适用于画布自动排列和代码生成，确保顺序稳定可预测。

---

## 核心改动

### 1. CanvasNode 类型扩展

**文件**: `src/types/node.ts`

添加字段 `creationId: number`，记录节点创建的自增编号。

```typescript
interface CanvasNode {
  // ... 现有字段
  creationId: number  // 自增编号，用于稳定并列排序
}
```

### 2. WorkspaceCanvas.vue 节点创建

**文件**: `src/components/workspace/WorkspaceCanvas.vue`

#### 新增计数器

```typescript
let creationIdCounter = 0  // 全局计数器
```

#### handleDrop 分配 creationId

新节点创建时：
```typescript
const newNode: CanvasNode = {
  // ... 其他字段
  creationId: ++creationIdCounter,  // 自增分配
}
nodes.push(newNode)
```

#### duplicateNode 重新分配

复制节点时，副本获得**新的** creationId：
```typescript
const newNode: CanvasNode = {
  ...JSON.parse(JSON.stringify(node)),
  creationId: ++creationIdCounter,  // 重新分配
}
```

#### onMounted 恢复计数器

加载项目时，恢复 creationIdCounter 到当前最大值：
```typescript
if (nodes.length > 0) {
  creationIdCounter = Math.max(...nodes.map(n => n.creationId || 0))
}
```

### 3. ConnectionManager 新增排序方法

**文件**: `src/utils/connection-manager.ts`

#### `getOrderedNodesByTopology()` 主排序函数

返回有序节点列表或环路错误。

**算法步骤**：
1. **环检测** - 用 Kahn 算法检测环路，有环则返回环中节点列表并停止。
2. **入度计算** - 计算每个节点的入度（上游连线数）。
3. **层级计算** - 按入度为0递进计算层级：
   - 入度=0的节点 → 层级 0
   - 其他节点 → 层级 = max(所有上游层级) + 1
4. **分层分组** - 按层级将节点分组到 `levelGroups`。
5. **层内排序** - 同层节点按 `creationId` 升序排序（打破并列）。
6. **孤立处理** - 无连线的节点按 `creationId` 追加到末尾。
7. **合并输出** - 按层级递增遍历分组，输出最终有序列表。

**返回值**：
```typescript
{
  ordered: CanvasNode[];      // 有序节点列表（或空数组若有环）
  hasCycle: boolean;          // 是否存在环路
  cycleNodes?: string[];      // 环中涉及的节点 (name+id)
}
```

#### `detectCycle()` 环检测函数

检测图中所有在环路上的节点，返回节点名称列表。

**实现**: Kahn 算法，统计入度无法清零的节点。

#### `getNodeLevels()` 辅助函数

获取拓扑排序后的层级映射，可用于代码生成或其他排序需求。

---

## 使用场景

### 场景 1: 自动排列（arrangeNodes）

**文件**: `src/components/workspace/WorkspaceCanvas.vue#arrangeNodes()`

```typescript
const arrangeNodes = () => {
  // 获取有序节点列表
  const result = connectionManager.getOrderedNodesByTopology()
  
  // 检查环路
  if (result.hasCycle) {
    ElMessage.error(`检测到循环依赖：${result.cycleNodes?.join(', ')}`)
    return
  }
  
  // 按拓扑顺序做网格布置
  const orderedNodes = result.ordered
  orderedNodes.forEach((node, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    node.position = { x, y }
    connectionManager.updateConnectionPositions(node.id)
  })
}
```

**效果**：
- 依赖关系层级化布置（上游靠上，下游靠下）。
- 同层节点按创建顺序从左往右排列。
- 有环时提示用户断开。

### 场景 2: 代码生成

**文件**: `src/core/code-generation/pytorch-code-generator.ts`（建议集成）

```typescript
const orderedNodes = connectionManager.getOrderedNodesByTopology().ordered
orderedNodes.forEach(node => {
  // 生成该节点的代码，依赖已在前面处理
})
```

**效果**：
- 确保依赖项先被生成。
- 同层操作（并行分支）顺序稳定。
- 避免前向引用未定义的变量。

---

## 排序示例

### 示例 1: 线性链路

```
创建顺序: A(1) → B(2) → C(3) → D(4)
连线: A→B, B→C, C→D

层级:  A  B  C  D
       0  1  2  3

排序结果: A, B, C, D (保持线性顺序)
```

### 示例 2: 分支汇合

```
创建顺序: A(1), B(2), C(3), D(4), E(5)
连线: A→B, A→C, B→E, C→E

层级:  A  B  C  E  D
       0  1  1  2  ?
       
说明: B 和 C 都依赖 A (层级1)
      同层按 creationId: B(2) 先于 C(3)
      E 依赖 B 和 C (层级2)
      D 无连线 (孤立)

排序结果: A, B, C, E, D (D 末尾)
```

### 示例 3: 环路检测

```
创建顺序: A(1), B(2), C(3)
连线: A→B, B→C, C→A (形成环)

检测结果:
  hasCycle: true
  cycleNodes: ["A(node-xxx)", "B(node-yyy)", "C(node-zzz)"]
  ordered: [] (不返回顺序)

用户提示: "检测到循环依赖，涉及节点：A(node-xxx), B(node-yyy), C(node-zzz)。请先断开循环连接。"
```

### 示例 4: 多输入节点（多头注意力）

```
创建顺序: A(1), B(2), C(3), Attn(4)
连线: A→Attn, B→Attn, C→Attn (Attn 入度=3)

层级:  A  B  C  Attn
       0  0  0   1
       
说明: A, B, C 都在层0，按 creationId 排: A(1), B(2), C(3)
      Attn 入度=3，需等 A,B,C 都完成，层级=1

排序结果: A, B, C, Attn (多头注意力最后)
```

---

## 内部实现细节

### 入度计算与更新

```typescript
const inDegree: Record<string, number> = {}
this.connections.forEach(connection => {
  inDegree[connection.target.nodeId]++
})
```

### 分层遍历

```typescript
let currentLevel = 0
while (processed.size < this.nodes.length) {
  // 找出所有入度为0的未处理节点
  // 分配给 currentLevel
  // 减少其下游入度
  // currentLevel++
}
```

### 孤立节点识别

```typescript
const isolatedNodes = nodes.filter(
  node => nodeLevel[node.id] === undefined
)
```

---

## 与现有代码的兼容性

### 环检测保持不变

现有的 `wouldCreateCycle()` 在连接创建时仍然有效，防止用户连接时形成环。新增 `detectCycle()` 用于排序前的完整检查。

### 拓扑信息保留

`generateTopology()` 仍可用于获取 `inputNodes` / `outputNodes` 和 `hasCycles` 标志；新增的排序函数专注于**有序遍历**。

### 连接点坐标计算不变

`calculateConnectionPointPosition()` 和 `updateConnectionPositions()` 逻辑不变，只在排序后调用以更新布局。

---

## 迁移清单

- [x] 添加 `creationId` 到 CanvasNode 类型
- [x] 在 handleDrop 时分配 creationId
- [x] 在 duplicateNode 时重新分配 creationId
- [x] 在 onMounted 时恢复 creationIdCounter
- [x] 实现 `getOrderedNodesByTopology()` 排序函数
- [x] 实现 `detectCycle()` 环检测函数
- [x] 更新 `arrangeNodes()` 使用新排序
- [x] 代码编译无误

---

## 建议后续集成

1. **代码生成顺序** - 在 `pytorch-code-generator.ts` 中调用 `getOrderedNodesByTopology()`，替代现有 DFS 遍历（如有）。
2. **UI 优化** - 在环路提示中高亮相关节点，或提供"自动断开建议"。
3. **性能优化** - 缓存拓扑排序结果，仅在连接变化时重新计算。
4. **文档同步** - 更新项目架构文档，说明新的排序逻辑。

---

## 测试建议

1. **单链路**: 1→2→3→4，确保顺序不变。
2. **分支**: 1→2, 1→3, 2→4, 3→4，确保同层按 creationId 排序。
3. **并行**: 1→3, 2→3, 3→4，验证多输入节点位置。
4. **孤立**: 1→2, 3（无连线），确保 3 排到末尾。
5. **环路**: 1→2, 2→3, 3→1，验证检测并列出节点。
6. **复制**: 复制节点后，新旧 creationId 不同，排序顺序改变。

