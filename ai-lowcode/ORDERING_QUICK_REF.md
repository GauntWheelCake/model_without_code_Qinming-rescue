# 新排序系统 - 快速参考

## 一句话总结
用**拓扑排序+创建顺序**打破并列，保证依赖先后，同层稳定输出，有环报错列出节点。

## 关键概念

| 概念         | 含义                                      |
| ------------ | ----------------------------------------- |
| `creationId` | 节点自增编号(1,2,3…)，用于同层排序稳定键  |
| 层级         | 节点的距离等级：入度=0→层0，依赖层k→层k+1 |
| 入度         | 指向节点的连线数（上游依赖个数）          |
| 同层         | 多个节点有相同层级（如A→C, B→C时A和B同层) |
| 孤立节点     | 没有任何连线的节点，排到末尾              |

## 代码快速定位

### 新增的排序函数
```
src/utils/connection-manager.ts:
  • getOrderedNodesByTopology()      → 主排序，返回有序列表或环错误
  • detectCycle()                    → 检测环中节点
  • getNodeLevels()                  → 返回层级映射
```

### 改动的节点创建逻辑
```
src/components/workspace/WorkspaceCanvas.vue:
  • handleDrop()                     → +creationId分配
  • duplicateNode()                  → +creationId重新分配
  • onMounted()                      → +恢复creationIdCounter
  • arrangeNodes()                   → 改用新排序
```

## 使用示例

### 自动排列（已实现）
```typescript
const result = connectionManager.getOrderedNodesByTopology()

if (result.hasCycle) {
  ElMessage.error(`环路：${result.cycleNodes?.join(', ')}`)
  return
}

// 按有序节点列表做网格布置
result.ordered.forEach((node, idx) => {
  node.position = { x: idx % cols * 220, y: ... }
})
```

### 代码生成（建议集成）
```typescript
const { ordered } = connectionManager.getOrderedNodesByTopology()
ordered.forEach(node => {
  // 生成代码，依赖已在前面处理
})
```

## 排序规则

1. **环检测** → 有环则报错，列出环中节点名称
2. **层级计算** → 按入度0逐层推进
3. **同层排序** → 按 creationId 升序（打破并列）
4. **孤立排到末** → 无连线节点按 creationId 追加

## 效果对比

### 改前
| 操作                       | 结果                     |
| -------------------------- | ------------------------ |
| 创建 1→2→3，拖拉拽顺序不同 | ❌ 排列顺序随机漂移       |
| 代码生成                   | ❌ 可能前向引用未定义变量 |

### 改后
| 操作                       | 结果                         |
| -------------------------- | ---------------------------- |
| 创建 1→2→3，拖拉拽顺序不同 | ✅ 排列顺序总是 1,2,3         |
| 代码生成                   | ✅ 依赖先后保证，同层稳定     |
| 遇到环                     | ✅ 提示用户断开，列出涉及节点 |

## 常见问题

**Q: 为什么我复制节点后，排列顺序变了？**  
A: 复制时分配新的 creationId，相当于"重新创建"，所以排序位置改变。这是正确行为。

**Q: 同层节点按什么顺序排？**  
A: 按创建顺序（creationId升序）。先创建的先输出。

**Q: 有环时怎么处理？**  
A: 排序函数返回 `hasCycle=true` 和环中节点列表，调用者决定是提示用户还是强制执行。自动排列会提示并停止。

**Q: 孤立节点会排在哪？**  
A: 末尾。按 creationId 升序追加，不打断主链。

**Q: 多头注意力等多输入节点会怎样排？**  
A: 正常处理。入度=3的节点要等所有3个上游完成才进队，自动排到更后面的层级。

## 性能考虑

- 排序时间复杂度: O(N + E)，N=节点数，E=连线数
- 无额外空间占用（除了计算过程中的临时数组）
- 若节点数<1000，性能不是瓶颈

## 下一步

- [ ] 代码生成集成 `getOrderedNodesByTopology()`
- [ ] UI中高亮环路节点
- [ ] 性能缓存拓扑结果

