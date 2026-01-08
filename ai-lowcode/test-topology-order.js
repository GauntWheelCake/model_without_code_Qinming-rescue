// 在浏览器控制台运行这个脚本来验证排序

// 1. 检查所有节点的 creationId
console.log('=== 节点信息 ===')
const projectData = JSON.parse(localStorage.getItem('ai-model-project'))
projectData.nodes.forEach(node => {
    console.log(`${node.name}: id=${node.id}, creationId=${node.creationId}`)
})

// 2. 模拟 Kahn 算法计算层级
console.log('\n=== 层级计算 ===')
const nodes = projectData.nodes
const connections = projectData.connections

const inDegree = {}
const graph = {}
nodes.forEach(node => {
    inDegree[node.id] = 0
    graph[node.id] = []
})

connections.forEach(conn => {
    graph[conn.source.nodeId].push(conn.target.nodeId)
    inDegree[conn.target.nodeId]++
})

const nodeLevel = {}
const queue = []
nodes.forEach(node => {
    if (inDegree[node.id] === 0) {
        queue.push({ nodeId: node.id, level: 0 })
    }
})

while (queue.length > 0) {
    const { nodeId, level } = queue.shift()
    nodeLevel[nodeId] = level

    graph[nodeId].forEach(neighborId => {
        inDegree[neighborId]--
        if (inDegree[neighborId] === 0) {
            queue.push({ nodeId: neighborId, level: level + 1 })
        }
    })
}

nodes.forEach(node => {
    const level = nodeLevel[node.id]
    console.log(`${node.name}: level=${level}`)
})

// 3. 按层级分组并排序
console.log('\n=== 最终排序结果 ===')
const levelGroups = {}
nodes.forEach(node => {
    const level = nodeLevel[node.id]
    if (!levelGroups[level]) levelGroups[level] = []
    levelGroups[level].push(node)
})

Object.keys(levelGroups).forEach(level => {
    levelGroups[parseInt(level)].sort((a, b) => (a.creationId || 0) - (b.creationId || 0))
})

const ordered = []
Object.keys(levelGroups)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach(level => {
        ordered.push(...levelGroups[level])
    })

ordered.forEach((node, idx) => {
    console.log(`${idx}: ${node.name}`)
})

// 4. 检查是否与代码生成的顺序一致
console.log('\n✅ 如果上述顺序与生成的代码顺序一致，说明排序系统工作正常')
