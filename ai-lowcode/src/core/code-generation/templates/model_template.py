"""
AI Model Template
This file contains the template for generating PyTorch model code.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
{{TORCHVISION_IMPORT}}

class {{MODEL_NAME}}(nn.Module):
    def __init__(self):
        super({{MODEL_NAME}}, self).__init__()
{{LAYERS}}
    
    def forward(self, x):
{{FORWARD_CODE}}
    
    def summary(self):
        """打印模型结构"""
        print("Model Architecture:")
        print("=" * 60)
{{MODEL_SUMMARY}}
        print("=" * 60)
        total_params = sum(p.numel() for p in self.parameters())
        trainable_params = sum(p.numel() for p in self.parameters() if p.requires_grad)
        print(f"Total parameters: {total_params:,}")
        print(f"Trainable parameters: {trainable_params:,}")
        print(f"Non-trainable parameters: {total_params - trainable_params:,}")
