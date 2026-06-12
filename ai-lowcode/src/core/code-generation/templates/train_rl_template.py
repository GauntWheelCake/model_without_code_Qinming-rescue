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
    # 用户自定义训练循环区域
    # 以下仅为示例框架，请根据实际算法需求编写训练逻辑
    # ============================================================
    if RL_ALGORITHM == "ppo":
        print("PPO 训练循环开始...")
        # TODO: 用户自行实现 PPO 训练逻辑
        # 1. 从 parser.get_data() 获取环境状态
        # 2. model.actor(state) 选择动作
        # 3. 与环境交互获取 reward 和 next_state
        # 4. 计算 advantage 和 clip loss
        # 5. 更新 actor 和 critic
        # 训练循环：从缓冲区轮询环境数据，超时则继续等待；按 Ctrl+C 退出
        try:
            while True:
                data = parser.get_data()
                if data is None:
                    time.sleep(0.01)
                    continue
                # TODO: 替换为实际训练步骤
                print(f"收到环境数据: {data}")
        except KeyboardInterrupt:
            print("训练被手动中断。")

    elif RL_ALGORITHM == "qmix":
        print("QMIX 训练循环开始...")
        # TODO: 用户自行实现 QMIX 训练逻辑
        # 1. 从 parser.get_data() 获取多智能体观测
        # 2. 计算各智能体 Q 值
        # 3. 通过混合网络聚合
        # 4. 计算 TD Loss 并更新
        # 训练循环：从缓冲区轮询环境数据，超时则继续等待；按 Ctrl+C 退出
        try:
            while True:
                data = parser.get_data()
                if data is None:
                    time.sleep(0.01)
                    continue
                # TODO: 替换为实际训练步骤
                print(f"收到环境数据: {data}")
        except KeyboardInterrupt:
            print("训练被手动中断。")

    else:
        print("未知算法，请检查配置或自行实现训练逻辑。")

    print("训练结束。")


if __name__ == "__main__":
    train_rl()
