// src/core/components/test-registry.ts
import { ComponentRegistry } from './index'

const registry = ComponentRegistry.getInstance()

console.log('=== Component Registry Test ===')
console.log(`Total categories: ${registry.getAllCategories().length}`)
console.log(`Total components: ${registry.getAllComponents().length}`)

registry.getAllCategories().forEach(category => {
  const components = registry.getComponentsByCategory(category)
  console.log(`\nCategory: ${category} (${components.length} components)`)
  components.forEach(comp => {
    console.log(`  - ${comp.name} (${comp.id})`)
  })
})