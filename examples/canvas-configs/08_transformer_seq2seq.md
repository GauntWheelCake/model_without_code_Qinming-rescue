# Transformer 序列到序列

## ✅ 测试环境

- torch: `2.9.1+cu128`
- torchvision: `0.24.1+cu128`
- torchaudio: `2.9.1+cu128`

## 📝 任务描述

使用 Transformer 节点构建序列到序列模型（如机器翻译、文本摘要）。

## 🎨 画布配置

### 节点列表

仅需 1 个节点：Transformer 模型节点。

### JSON 配置

```json
{
  "nodes": [
    {
      "id": "node_transformer_001",
      "name": "Transformer",
      "type": "transformer",
      "icon": "Collection",
      "description": "通用Transformer编码器",
      "category": "models",
      "position": { "x": 420, "y": 300 },
      "creationId": 1,
      "params": [
        {
          "key": "d_model",
          "label": "模型维度",
          "type": "number",
          "value": 512,
          "min": 64,
          "max": 4096,
          "step": 64
        },
        {
          "key": "nhead",
          "label": "注意力头数",
          "type": "number",
          "value": 8,
          "min": 1,
          "max": 64,
          "step": 1
        },
        {
          "key": "num_encoder_layers",
          "label": "编码器层数",
          "type": "number",
          "value": 6,
          "min": 1,
          "max": 24,
          "step": 1
        },
        {
          "key": "num_decoder_layers",
          "label": "解码器层数",
          "type": "number",
          "value": 6,
          "min": 0,
          "max": 24,
          "step": 1
        },
        {
          "key": "dim_feedforward",
          "label": "前馈网络维度",
          "type": "number",
          "value": 2048,
          "min": 128,
          "max": 8192,
          "step": 128
        },
        {
          "key": "dropout",
          "label": "Dropout率",
          "type": "range",
          "value": 0.1,
          "min": 0,
          "max": 1,
          "step": 0.05
        }
      ],
      "inputs": [
        {
          "id": "input_transformer_src_001",
          "name": "src",
          "type": "input",
          "dataType": "tensor",
          "shape": [32, 10, 512],
          "connectedTo": []
        },
        {
          "id": "input_transformer_tgt_001",
          "name": "tgt",
          "type": "input",
          "dataType": "tensor",
          "shape": [32, 10, 512],
          "connectedTo": []
        }
      ],
      "outputs": [
        {
          "id": "output_transformer_001",
          "name": "output",
          "type": "output",
          "dataType": "tensor",
          "shape": [32, 10, 512],
          "connectedTo": []
        }
      ],
      "metadata": {
        "framework": "pytorch",
        "layerType": "transformer",
        "defaultInputShape": [32, 10, 512],
        "defaultOutputShape": [32, 10, 512]
      }
    }
  ],
  "connections": []
}
```

## 🔧 参数说明

| 参数               | 说明       | 推荐值 |
| ------------------ | ---------- | ------ |
| d_model            | 模型维度   | 512    |
| nhead              | 注意力头数 | 8      |
| num_encoder_layers | 编码器层数 | 6      |
| num_decoder_layers | 解码器层数 | 6      |
| dim_feedforward    | 前馈层维度 | 2048   |
| dropout            | Dropout 率 | 0.1    |

## 🚀 使用步骤

1. 在画布中拖入 Transformer 节点
2. 设置参数（建议默认值先跑通）
3. 点击生成代码
4. 点击下载完整项目

## ⚠️ 当前版本说明（重要）

Transformer 前向通常需要 `src` 与 `tgt` 两路输入。
当前低代码平台导出的默认训练/推理脚本仍偏向视觉任务模板，通常需要手工改造输入数据流后再用于 seq2seq 训练。

建议验证顺序：
1. 先验证 model.py 可实例化
2. 手工改造 train.py（准备 src/tgt）
3. 手工改造 inference.py（准备 src/tgt）

## 💻 本地测试

```bash
pip install -r requirements.txt
python model.py
```
