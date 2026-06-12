import torch
import os
from multiprocessing import Queue
import threading

from model import {{MODEL_NAME}}
from network_env import EnhancedByteStreamParser, tcp_server, udp_server

# 强化学习环境配置
HTTP_URL = "{{RL_HTTP_URL}}"
TCP_PORT = {{RL_TCP_PORT}}
UDP_PORT = {{RL_UDP_PORT}}
SAVE_PATH = "{{RL_SAVE_PATH}}"
INTERVAL = {{RL_INTERVAL}}
RL_ALGORITHM = "{{RL_ALGORITHM}}"

# 消息类型配置
MESSAGE_TYPE = {
    "plat": [301, 601],
    "zzload": [585, 885],
    "djload": [501, 801],
    "jsload": [587, 887],
    "zz_key_output": [1158, 1159],
    "dj_key_output": [952, 953],
    "js_key_output": [992, 1992]
}


def deploy_rl():
    """
    强化学习部署运行脚本。
    加载训练好的模型，连接环境引擎，循环接收状态并选择动作。
    """
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"部署设备: {device}")

    # 加载模型
    model = {{MODEL_NAME}}().to(device)
    model_path = 'trained_model.pth'
    if os.path.exists(model_path):
        checkpoint = torch.load(model_path, map_location=device)
        model.load_state_dict(checkpoint.get('model_state_dict', checkpoint))
        print(f"已加载模型: {model_path}")
    else:
        print(f"警告: 未找到模型文件 {model_path}，将使用随机初始化的模型")

    model.eval()

    # 初始化环境数据解析器
    queue = Queue()
    parser = EnhancedByteStreamParser(
        MESSAGE_TYPE,
        queue,
        http_url=HTTP_URL,
        save_path=SAVE_PATH
    )
    parser.interval = INTERVAL

    # 启动TCP/UDP服务器线程
    tcp_thread = threading.Thread(target=tcp_server, args=(parser,), kwargs={'port': TCP_PORT})
    udp_thread = threading.Thread(target=udp_server, args=(parser,), kwargs={'port': UDP_PORT})
    tcp_thread.daemon = True
    udp_thread.daemon = True
    tcp_thread.start()
    udp_thread.start()

    print("=" * 30, "RL Deployment", "=" * 30)
    print("模型已加载，TCP/UDP 服务器已启动")
    print("等待环境数据，根据状态选择动作...")

    # ============================================================
    # 用户自定义部署逻辑区域
    # 以下仅为示例框架，请根据实际场景编写交互逻辑
    # ============================================================
    with torch.no_grad():
        while True:
            try:
                # TODO: 用户自行实现环境交互逻辑
                # 1. 从 queue 中获取环境状态
                # 2. state_tensor = torch.tensor(state, dtype=torch.float32).to(device)
                # 3. 根据 RL_ALGORITHM 选择动作:
                #    - ppo: action_probs = model.actor(state_tensor); action = torch.argmax(action_probs)
                #    - qmix: q_values = model.agent_net(state_tensor); action = torch.argmax(q_values)
                # 4. 发送动作回环境
                time.sleep(0.1)
            except KeyboardInterrupt:
                print("部署停止。")
                break


if __name__ == "__main__":
    deploy_rl()
