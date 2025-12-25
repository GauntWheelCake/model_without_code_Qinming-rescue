/**
 * Template Loader
 * 负责加载和处理 Python 模板文件
 */

// 导入模板文件
import modelTemplate from './templates/model_template.py?raw'
import trainTemplate from './templates/train_template.py?raw'
import inferenceTemplate from './templates/inference_template.py?raw'

export interface TemplateVariables {
    [key: string]: string
}

export class TemplateLoader {
    private static templates: Map<string, string> = new Map([
        ['model', modelTemplate],
        ['train', trainTemplate],
        ['inference', inferenceTemplate]
    ])

    /**
     * 获取指定的模板
     * @param templateName 模板名称 ('model' | 'train' | 'inference')
     * @returns 模板字符串
     */
    static getTemplate(templateName: string): string {
        const template = this.templates.get(templateName)
        if (!template) {
            throw new Error(`Template '${templateName}' not found`)
        }
        return template
    }

    /**
     * 替换模板中的变量
     * @param template 模板字符串
     * @param variables 变量对象，key 为变量名，value 为替换值
     * @returns 处理后的字符串
     */
    static replaceVariables(template: string, variables: TemplateVariables): string {
        let result = template

        // 替换所有 {{VARIABLE_NAME}} 格式的占位符
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`
            // 使用全局替换
            result = result.split(placeholder).join(value)
        })

        return result
    }

    /**
     * 加载并处理模板
     * @param templateName 模板名称
     * @param variables 变量对象
     * @returns 处理后的字符串
     */
    static loadAndProcess(templateName: string, variables: TemplateVariables): string {
        const template = this.getTemplate(templateName)
        return this.replaceVariables(template, variables)
    }

    /**
     * 验证模板中的所有占位符是否都被替换
     * @param code 处理后的代码
     * @returns 如果还有未替换的占位符，返回它们的列表
     */
    static validateReplacement(code: string): string[] {
        const placeholderPattern = /\{\{([A-Z_]+)\}\}/g
        const matches = code.match(placeholderPattern)
        return matches || []
    }

    /**
     * 获取模板中的所有占位符
     * @param templateName 模板名称
     * @returns 占位符列表
     */
    static getTemplatePlaceholders(templateName: string): string[] {
        const template = this.getTemplate(templateName)
        const placeholderPattern = /\{\{([A-Z_]+)\}\}/g
        const placeholders = new Set<string>()

        let match
        while ((match = placeholderPattern.exec(template)) !== null) {
            placeholders.add(match[1])
        }

        return Array.from(placeholders)
    }
}
