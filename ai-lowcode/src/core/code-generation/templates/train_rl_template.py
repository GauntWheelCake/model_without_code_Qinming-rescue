import torch
import torch.nn as nn
import os
import threading
import time

from model import {{MODEL_NAME}}
from network_env import EnhancedByteStreamParser, tcp_server, udp_server

# 强化学习环境配置
HTTP_URL = "{{RL_HTTP_URL}}"
TCP_PORT = {{RL_TCP_PORT}}
UDP_PORT = {{RL_UDP_PORT}}
SAVE_PATH = "{{RL_SAVE_PATH}}"
INTERVAL = {{RL_INTERVAL}}
RL_ALGORITHM = "{{RL_ALGORITHM}}"
STATE_DIM = {{RL_STATE_DIM}}
ACTION_DIM = {{RL_ACTION_DIM}}
N_AGENTS = {{RL_N_AGENTS}}
OBS_DIM = {{RL_OBS_DIM}}

# 环境数据缓冲区配置
MAX_BUFFER_SIZE = 1000          # 最多保留最近 N 条数据
MAX_DATA_AGE_SECONDS = 30.0     # 数据超过 N 秒未消费则丢弃（None 表示不限制时间）

# 消息类型配置：UDP 线程根据消息头匹配对应类型，仅处理列表中定义的类型
# 可根据实际环境协议扩展，例如添加新的平台、载荷或关键输出类型
MESSAGE_TYPE = {
    "plat": [301, 601],
    "zzload": [585, 885],
    "djload": [501, 801],
    "jsload": [587, 887],
    "zz_key_output": [1158, 1159],
    "dj_key_output": [952, 953],
    "js_key_output": [992, 1992]
}


def train_rl():
    """
    强化学习主训练函数。
    用户可在此函数中编写具体的训练逻辑。
    """
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"训练设备: {device}")

    # 创建模型并迁移到 GPU/CPU；强化学习模式下网络结构由画布上的 PPO/QMIX 节点决定
    model = {{MODEL_NAME}}().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    print(f"模型参数数量: {sum(p.numel() for p in model.parameters()):,}")

    # 初始化环境数据解析器：负责 TCP 想定接收、UDP 数据解析与缓冲
    parser = EnhancedByteStreamParser(
        MESSAGE_TYPE,
        http_url=HTTP_URL,
        save_path=SAVE_PATH,
        max_buffer_size=MAX_BUFFER_SIZE,
        max_data_age_seconds=MAX_DATA_AGE_SECONDS
    )
    # INTERVAL 控制 UDP 数据按时间间隔聚合，避免同一时刻的重复数据刷屏
    parser.interval = INTERVAL

    # 启动 TCP/UDP 服务器线程：TCP 负责接收想定触发消息，UDP 负责接收环境实时数据
    # 两者均为守护线程，主线程结束时自动退出
    tcp_thread = threading.Thread(target=tcp_server, args=(parser,), kwargs={'port': TCP_PORT})
    udp_thread = threading.Thread(target=udp_server, args=(parser,), kwargs={'port': UDP_PORT})
    tcp_thread.daemon = True
    udp_thread.daemon = True
    tcp_thread.start()
    udp_thread.start()

    print("=" * 30, "RL Training", "=" * 30)
    print(f"算法: {RL_ALGORITHM}")
    print("TCP/UDP 服务器已启动，等待环境数据...")

    # 主线程阻塞等待 TCP 接收到想定文件；UDP 线程在此期间仍并行接收环境数据
    # 使用超时轮询，让 Ctrl+C 可以中断等待
    print("等待接收想定文件，按 Ctrl+C 可取消...")
    try:
        while not parser.scenario_ready.wait(timeout=0.5):
            pass
    except KeyboardInterrupt:
        print("\n训练被手动中断。")
        return
    print("想定文件已接收，开始训练...")

    # ============================================================
    # 最简 UDP 数据处理训练循环：只保证模型能接收 UDP 数据并做简单计算
    # ============================================================
    print(f"{RL_ALGORITHM} 训练循环开始...")
    step = 0
    try:
        while True:
            data = parser.get_data()
            if data is None:
                time.sleep(0.01)
                continue

            # 从环境数据提取一个简单状态向量
            raw_state = torch.FloatTensor([data.sate_id] + list(data.gx_pos) + list(data.gx_vel)).to(device)

            # 根据算法对齐输入维度
            if RL_ALGORITHM == 'ppo':
                target_dim = STATE_DIM
            else:  # qmix
                target_dim = OBS_DIM

            if raw_state.shape[0] < target_dim:
                raw_state = torch.nn.functional.pad(raw_state, (0, target_dim - raw_state.shape[0]))
            elif raw_state.shape[0] > target_dim:
                raw_state = raw_state[:target_dim]

            if RL_ALGORITHM == 'ppo':
                output = model(raw_state.unsqueeze(0))
            else:  # qmix
                # QMIX 期望输入 [batch, n_agents, obs_dim]
                state = raw_state.unsqueeze(0).unsqueeze(0).repeat(1, N_AGENTS, 1)
                output = model(state)

            # 最简单的损失：让模型输出均值尽量接近 0（仅为演示反向传播）
            loss = output[0].mean() if isinstance(output, tuple) else output.mean()

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            step += 1
            if step % 10 == 0:
                print(f"Step {step}: loss={loss.item():.4f}")
    except KeyboardInterrupt:
        print("训练被手动中断。")

    print("训练结束。")


if __name__ == "__main__":
    train_rl()
