// src/core/components/builder.ts
import type { ComponentDefinition, ComponentMetadata } from '../../types/node'
import { DEFAULT_METADATA } from './base'

export class ComponentBuilder {
  /**
   * 创建标准化的组件定义
   */
  static createComponent(
    id: string,
    name: string,
    description: string,
    icon: string,
    type: 'layer' | 'activation' | 'model' | 'utility',
    category: string,
    params: any[] = [],
    inputs: any[] = [{ name: 'input', dataType: 'tensor' }],
    outputs: any[] = [{ name: 'output', dataType: 'tensor' }],
    metadata: Partial<ComponentMetadata> = {}
  ): ComponentDefinition {
    // 合并元数据
    const fullMetadata: ComponentMetadata = {
      ...DEFAULT_METADATA,
      ...metadata,
      layerType: metadata.layerType || id
    }
    
    // 标准化参数
    const standardizedParams = params.map(param => ({
      ...param,
      value: param.value ?? this.getDefaultParamValue(param.type)
    }))
    
    // 标准化输入输出
    const standardizedInputs = inputs.map((input, index) => ({
      ...input,
      name: input.name || `input_${index}`
    }))
    
    const standardizedOutputs = outputs.map((output, index) => ({
      ...output,
      name: output.name || `output_${index}`
    }))
    
    return {
      id,
      name,
      description,
      icon,
      type,
      category,
      params: standardizedParams,
      inputs: standardizedInputs,
      outputs: standardizedOutputs,
      metadata: fullMetadata
    }
  }
  
  /**
   * 获取参数默认值
   */
  private static getDefaultParamValue(type: string): any {
    switch (type) {
      case 'number':
        return 0
      case 'string':
        return ''
      case 'boolean':
        return false
      case 'select':
        return null
      case 'range':
        return 0.5
      default:
        return null
    }
  }
  
  /**
   * 验证组件定义
   */
  static validate(component: any): component is ComponentDefinition {
    if (!component) return false
    
    const requiredProps = ['id', 'name', 'description', 'icon', 'type', 'category']
    
    for (const prop of requiredProps) {
      if (!(prop in component)) {
        console.warn(`Component missing required property: ${prop}`, component)
        return false
      }
    }
    
    // 验证类型
    const validTypes = ['layer', 'activation', 'model', 'utility']
    if (!validTypes.includes(component.type)) {
      console.warn(`Invalid component type: ${component.type}`)
      return false
    }
    
    // 验证参数
    if (!Array.isArray(component.params)) {
      console.warn('Component params must be an array')
      return false
    }
    
    return true
  }
}