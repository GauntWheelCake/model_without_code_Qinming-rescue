# PyTorch 代码生成模板系统

## 概述

本目录包含用于生成 PyTorch 代码的模板系统。Python 代码不再嵌入在 TypeScript 文件中,而是存储在独立的 `.py` 模板文件中,便于维护和编辑。

## 目录结构

```
code-generation/
├── templates/                    # Python 模板文件
│   ├── model_template.py        # 模型类模板
│   ├── train_template.py        # 训练代码模板
│   └── inference_template.py    # 推理代码模板
├── template-loader.ts           # 模板加载和处理工具
├── pytorch-code-generator.ts   # PyTorch 代码生成器(主要逻辑)
└── README.md                    # 本文件
```

## 模板系统

### 模板占位符

模板使用 `{{VARIABLE_NAME}}` 格式的占位符,在代码生成时会被实际值替换。

### 可用模板

#### 1. model_template.py

生成 PyTorch 模型类的模板。

**占位符:**
- `{{MODEL_NAME}}` - 模型类名(默认: AIModel)
- `{{LAYERS}}` - 层定义代码
- `{{FORWARD_CODE}}` - forward 方法实现
- `{{MODEL_SUMMARY}}` - 模型摘要输出
- `{{TORCHVISION_IMPORT}}` - 可选的 torchvision 导入

**示例:**
```python
class {{MODEL_NAME}}(nn.Module):
    def __init__(self):
        super({{MODEL_NAME}}, self).__init__()
{{LAYERS}}
    
    def forward(self, x):
{{FORWARD_CODE}}
```

#### 2. train_template.py

生成训练代码的模板。

**占位符:**
- `{{MODEL_NAME}}` - 模型类名

**功能:**
- train_model() - 完整的训练循环
- prepare_data() - 数据准备函数
- 主脚本 - 训练入口

#### 3. inference_template.py

生成推理代码的模板。

**占位符:**
- `{{MODEL_NAME}}` - 模型类名

**功能:**
- predict() - 推理函数
- load_pretrained_model() - 加载模型
- inference_example() - 单张图像推理
- batch_inference_example() - 批量推理

## 使用方法

### 在 TypeScript 中使用

```typescript
import { TemplateLoader } from './template-loader'

// 加载并处理模板
const code = TemplateLoader.loadAndProcess('model', {
  MODEL_NAME: 'MyCustomModel',
  LAYERS: '    self.fc1 = nn.Linear(784, 128)',
  FORWARD_CODE: '    return self.fc1(x)',
  MODEL_SUMMARY: '    print("FC1: Linear(784, 128)")',
  TORCHVISION_IMPORT: ''
})

console.log(code)  // 完整的 Python 代码
```

### TemplateLoader API

#### `getTemplate(templateName: string): string`

获取原始模板字符串。

**参数:**
- `templateName` - 模板名称 ('model' | 'train' | 'inference')

**返回:** 模板字符串

#### `replaceVariables(template: string, variables: TemplateVariables): string`

替换模板中的占位符。

**参数:**
- `template` - 模板字符串
- `variables` - 变量对象 `{ PLACEHOLDER_NAME: 'value' }`

**返回:** 处理后的字符串

#### `loadAndProcess(templateName: string, variables: TemplateVariables): string`

加载模板并替换变量(快捷方法)。

**参数:**
- `templateName` - 模板名称
- `variables` - 变量对象

**返回:** 处理后的代码

#### `validateReplacement(code: string): string[]`

验证是否还有未替换的占位符。

**参数:**
- `code` - 处理后的代码

**返回:** 未替换的占位符数组(空数组表示全部替换完成)

#### `getTemplatePlaceholders(templateName: string): string[]`

获取模板中的所有占位符列表。

**参数:**
- `templateName` - 模板名称

**返回:** 占位符名称数组

## 添加新模板

1. 在 `templates/` 目录下创建新的 `.py` 文件
2. 使用 `{{PLACEHOLDER_NAME}}` 格式定义占位符
3. 在 `template-loader.ts` 中注册模板:

```typescript
import newTemplate from './templates/new_template.py?raw'

private static templates: Map<string, string> = new Map([
  ['model', modelTemplate],
  ['train', trainTemplate],
  ['inference', inferenceTemplate],
  ['new', newTemplate]  // 添加新模板
])
```

4. 在 `pytorch-code-generator.ts` 中使用:

```typescript
const code = TemplateLoader.loadAndProcess('new', {
  PLACEHOLDER_NAME: value
})
```

## 配置

### vite.config.js

确保配置了 `.py` 文件的导入支持:

```javascript
export default defineConfig({
  // ...
  assetsInclude: ['**/*.py']
})
```

### tsconfig.json / vite-env.d.ts

确保有类型声明:

```typescript
declare module '*.py?raw' {
  const content: string
  export default content
}
```

## 优势

1. **可维护性** - Python 代码独立于 TypeScript,易于编辑和调试
2. **语法高亮** - IDE 可以正确识别 Python 语法
3. **版本控制** - 代码变更更清晰可见
4. **重用性** - 模板可以在多个地方使用
5. **测试** - 可以单独测试模板内容

## 注意事项

1. 模板文件中的 `{{PLACEHOLDER}}` 会被 Python linter 标记为错误,这是正常的
2. 确保所有占位符在使用时都被替换,可使用 `validateReplacement()` 检查
3. 占位符名称应使用大写字母和下划线(如 `MODEL_NAME`)
4. 生成的代码需要保持正确的缩进

## 示例完整流程

```typescript
// 1. 准备变量
const variables = {
  MODEL_NAME: 'MyNet',
  LAYERS: this.generateLayers(),
  FORWARD_CODE: this.generateForward(),
  MODEL_SUMMARY: this.generateSummary(),
  TORCHVISION_IMPORT: ''
}

// 2. 生成代码
const modelCode = TemplateLoader.loadAndProcess('model', variables)
const trainCode = TemplateLoader.loadAndProcess('train', { MODEL_NAME: 'MyNet' })
const inferenceCode = TemplateLoader.loadAndProcess('inference', { MODEL_NAME: 'MyNet' })

// 3. 验证(可选)
const unreplaced = TemplateLoader.validateReplacement(modelCode)
if (unreplaced.length > 0) {
  console.warn('未替换的占位符:', unreplaced)
}

// 4. 使用生成的代码
console.log(modelCode)
```

## 相关文件

- [pytorch-code-generator.ts](./pytorch-code-generator.ts) - 代码生成器主类
- [template-loader.ts](./template-loader.ts) - 模板加载工具
- [templates/](./templates/) - Python 模板目录
