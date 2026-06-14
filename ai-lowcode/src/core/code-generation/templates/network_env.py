import socket
import struct
import datetime
import itertools
import time
import threading
import os
import json
from collections import deque
from typing import Any, Dict, List, Tuple
from datetime import timedelta

import requests

Vector3 = Tuple[float, float, float]
Vector4 = Tuple[float, float, float, float]
Vector6 = Tuple[float, float, float, float, float, float]


class LargeStructParser:
    FORMAT_LIST: List[str] = []

    def __init__(self):
        self.expected_bytes_list: List[int] = []
        if not hasattr(self.__class__, "FORMAT_LIST"):
            raise RuntimeError("The parser must define a class variable FORMAT_LIST.")
        format_list = self.__class__.FORMAT_LIST
        if not isinstance(format_list, (list, tuple)) or len(format_list) == 0:
            raise RuntimeError("The parser must define a non-empty list of format strings in FORMAT_LIST.")
        for fmt in format_list:
            self.expected_bytes_list.append(struct.calcsize(fmt))

    def get_offset_after_parsing(self, mesg: bytes, offset: int = 0) -> int:
        offset_after_parsing = offset + sum(self.expected_bytes_list)
        if offset_after_parsing > len(mesg):
            raise OverflowError("The remaining length is too short to parse.")
        return offset_after_parsing


class LargeStruct:
    def format_datetime(self, dt: datetime.datetime) -> str:
        if dt is None:
            return "None"
        return dt.strftime("%Y-%m-%d %H:%M:%S")

    def format_representation(self, attr_repr_list: List[str]) -> str:
        separator = "\n    "
        mesg_head = [f"{self.__class__.__name__}:"]
        return separator.join(itertools.chain(mesg_head, attr_repr_list))


class ZzxdbsParam(LargeStruct):
    def __init__(self, *, zzxdbs: str = None):
        self.zzxdbs = zzxdbs

    def __repr__(self) -> str:
        return self.format_representation([f"{self.zzxdbs = !s}"])


class ZzxdbsParamParser(LargeStructParser):
    FORMAT_LIST = ["<i64s"]

    def parse_struct_ZzxdbsParam(self, mesg: bytes, offset: int = 0) -> Tuple[ZzxdbsParam, int]:
        offset_after_parsing = self.get_offset_after_parsing(mesg, offset)
        expected_bytes = self.expected_bytes_list[0]
        parsed = struct.unpack_from(self.FORMAT_LIST[0], mesg[offset:offset + expected_bytes])
        length, byte_string = parsed
        result = byte_string.decode("utf-8")[:length]
        return ZzxdbsParam(zzxdbs=result), offset_after_parsing


class CEntityHead28(LargeStruct):
    def __init__(self, *, mesg_type: int, num_entity: int, bjt: datetime.datetime, batch_id: int, zzxdbs: str = None):
        self.mesg_type = mesg_type
        self.num_entity = num_entity
        self.bjt = bjt
        self.batch_id = batch_id
        self.zzxdbs = zzxdbs

    def __repr__(self) -> str:
        return self.format_representation([
            f"{self.mesg_type = !s}",
            f"{self.num_entity = !s}",
            f"self.bjt = {self.format_datetime(self.bjt):s}",
            f"{self.batch_id = !s}",
        ])


class CEntityHead28Parser(LargeStructParser):
    FORMAT_LIST = ["<ii6dq"]

    def parse_struct_CEntityHead28(self, mesg: bytes, offset: int = 0) -> Tuple[CEntityHead28, int]:
        offset_after_parsing = self.get_offset_after_parsing(mesg, offset)
        expected_bytes = self.expected_bytes_list[0]
        parsed = struct.unpack_from(self.FORMAT_LIST[0], mesg[offset:offset + expected_bytes])

        mesg_type = parsed[0]
        num_entity = parsed[1]
        batch_id = parsed[8]

        if mesg_type == -1:
            bjt = None
        else:
            bjt = datetime.datetime(
                int(parsed[2]), int(parsed[3]), int(parsed[4]),
                hour=int(parsed[5]), minute=int(parsed[6]), second=int(parsed[7]),
            )

        return CEntityHead28(
            mesg_type=mesg_type,
            num_entity=num_entity,
            bjt=bjt,
            batch_id=batch_id,
        ), offset_after_parsing


class SatePlatParam(LargeStruct):
    def __init__(self,
                 *,
                 sate_id: int,
                 sate_name: str,
                 bjt: datetime.datetime,
                 available: bool,
                 side: int,
                 gx_pos: Vector3,
                 gx_vel: Vector3,
                 wjg_pos: Vector3,
                 track_params: Vector6,
                 quaternion: Vector4,
                 direction: Vector3,
                 cn_id: int,
                 usa_id: int,
                 international_id: str,
                 ):
        self.sate_id = sate_id
        self.sate_name = sate_name
        self.bjt = bjt
        self.available = available
        self.side = side
        self.gx_pos = gx_pos
        self.gx_vel = gx_vel
        self.wjg_pos = wjg_pos
        self.track_params = track_params
        self.quaternion = quaternion
        self.direction = direction
        self.cn_id = cn_id
        self.usa_id = usa_id
        self.international_id = international_id

    def __repr__(self) -> str:
        return self.format_representation([
            f"{self.sate_id = !s}",
            f"{self.sate_name = !s}",
            f"self.bjt = {self.format_datetime(self.bjt):s}",
            f"{self.available = !s}",
            f"{self.side = !s}",
            f"{self.gx_pos = !s}",
            f"{self.gx_vel = !s}",
            f"{self.wjg_pos = !s}",
            f"{self.track_params = !s}",
            f"{self.quaternion = !s}",
            f"{self.direction = !s}",
            f"{self.cn_id = !s}",
            f"{self.usa_id = !s}",
            f"{self.international_id = !s}",
        ])


class SatePlatParamParser(LargeStructParser):
    FORMAT_LIST = [
        "<i255s6d",
        "<?16d",
        "<16d",
        "<II32s",
    ]

    def parse_struct_SatePlatParam(self, mesg: bytes, offset: int = 0) -> Tuple[SatePlatParam, int]:
        offset_after_parsing = self.get_offset_after_parsing(mesg, offset)

        # Segment 0: sate_id, sate_name, bjt(year..second)
        expected = self.expected_bytes_list[0]
        parsed = struct.unpack_from(self.FORMAT_LIST[0], mesg, offset)
        offset += expected
        sate_id = parsed[0]
        sate_name = parsed[1].decode("utf-8").strip("\0").strip()
        bjt = datetime.datetime(
            int(parsed[2]), int(parsed[3]), int(parsed[4]),
            hour=int(parsed[5]), minute=int(parsed[6]), second=int(parsed[7]),
        )

        # Segment 1: available, side, gx_pos, gx_vel
        expected = self.expected_bytes_list[1]
        parsed = struct.unpack_from(self.FORMAT_LIST[1], mesg, offset)
        offset += expected
        available = parsed[0]
        side = parsed[1]
        gx_pos = parsed[2:5]
        gx_vel = parsed[5:]

        # Segment 2: wjg_pos, track_params, quaternion, direction
        expected = self.expected_bytes_list[2]
        parsed = struct.unpack_from(self.FORMAT_LIST[2], mesg, offset)
        offset += expected
        wjg_pos = parsed[:3]
        track_params = parsed[3:9]
        quaternion = parsed[9:13]
        direction = parsed[13:]

        # Segment 3: cn_id, usa_id, international_id
        expected = self.expected_bytes_list[3]
        parsed = struct.unpack_from(self.FORMAT_LIST[3], mesg, offset)
        offset += expected
        cn_id = parsed[0]
        usa_id = parsed[1]
        international_id = parsed[2].decode("utf-8").strip("\0").strip()

    def parse_struct_SatePlatParam_safe(self, mesg: bytes, offset: int = 0) -> Tuple[SatePlatParam, int]:
        """
        兼容解析：优先按完整字段解析；若剩余字节不足，则尝试解析前两段，
        仅提取训练所需的最小字段（sate_id、gx_pos、gx_vel），其余字段置默认值。
        """
        try:
            return self.parse_struct_SatePlatParam(mesg, offset)
        except OverflowError:
            # 最小可解析长度 = 第0段 + 第1段
            min_expected = self.expected_bytes_list[0] + self.expected_bytes_list[1]
            if offset + min_expected > len(mesg):
                raise

            # Segment 0: sate_id, sate_name, bjt
            expected = self.expected_bytes_list[0]
            parsed = struct.unpack_from(self.FORMAT_LIST[0], mesg, offset)
            offset += expected
            sate_id = parsed[0]
            sate_name = parsed[1].decode("utf-8").strip("\0").strip()
            bjt = datetime.datetime(
                int(parsed[2]), int(parsed[3]), int(parsed[4]),
                hour=int(parsed[5]), minute=int(parsed[6]), second=int(parsed[7]),
            )

            # Segment 1: available, side, gx_pos, gx_vel
            expected = self.expected_bytes_list[1]
            parsed = struct.unpack_from(self.FORMAT_LIST[1], mesg, offset)
            offset += expected
            available = parsed[0]
            side = parsed[1]
            gx_pos = parsed[2:5]
            gx_vel = parsed[5:]

            return SatePlatParam(
                sate_id=sate_id,
                sate_name=sate_name,
                bjt=bjt,
                available=available,
                side=side,
                gx_pos=gx_pos,
                gx_vel=gx_vel,
                wjg_pos=(0.0, 0.0, 0.0),
                track_params=(0.0,) * 6,
                quaternion=(0.0, 0.0, 0.0, 0.0),
                direction=(0.0, 0.0, 0.0),
                cn_id=0,
                usa_id=0,
                international_id="",
            ), offset


class ByteStreamParser:
    """基础字节流解析器：负责消息头解析与想定文件 HTTP 下载。"""

    def __init__(self, receive_type, http_url: str = None, save_path: str = "./received_data"):
        self.receive_type = receive_type
        self.mesg_type_all = [
            mesg_type
            for mesg_type_list in self.receive_type.values()
            for mesg_type in mesg_type_list
        ]
        self.ceh28_parser = CEntityHead28Parser()
        self.xd_parser = ZzxdbsParamParser()
        self.spp_parser = SatePlatParamParser()
        self.get_bfcsts_url = http_url or "http://172.18.218.12:8086/dtkz-frame/hfXdzbJbxx/getXdById"
        self.save_path = save_path
        self.all_plat_load = []
        # batch_id 由 TCP 线程在收到想定触发消息后设置，UDP 线程用它过滤无关数据
        self.batch_id = 0

    def parser_head(self, byte_stream):
        mesg_type = int.from_bytes(byte_stream[:4], byteorder="little", signed=False)
        return mesg_type

    def http_get_bfcsts(self, batch_id, zzxdbs):
        print("=" * 30, "GET XD VIA HTTP", "=" * 30)
        print("get bfcsts via http")

        post_json_data = {
            "zzxdbs": zzxdbs,
            "fzyqbs": batch_id,
            "bs": "1"
        }
        self.batch_id = batch_id
        print("post json data:", post_json_data)

        try:
            response = requests.post(url=self.get_bfcsts_url, json=post_json_data)
            print(f"HTTP response status code: {response.status_code}")

            if response.status_code == 200:
                bfcsts = response.json()
                # 保存想定文件到本地
                os.makedirs(self.save_path, exist_ok=True)
                save_file = os.path.join(self.save_path, f"bfcsts_{batch_id}.json")
                with open(save_file, "w", encoding="utf-8") as f:
                    json.dump(bfcsts, f, ensure_ascii=False, indent=2)
                print(f"想定文件已保存至: {save_file}")
                self.get_all_plat_load(bfcsts)
                # 通知主线程想定文件已就绪，可以开始训练
                self.scenario_ready.set()
            else:
                print(f"Failed to get bfcsts, status code: {response.status_code}")
        except Exception as e:
            print(f"HTTP request failed: {e}")
            import traceback
            traceback.print_exc()

    @staticmethod
    def _append_zh(zh_list: List[Dict[str, str]], source):
        for item in source:
            zh_list.append({"zh_name": str(item["ZWMC"]), "zh_id": str(item["ZHNM"])})

    def get_all_plat_load(self, bfcsts):
        print(f"想定文件:{bfcsts}")
        for data in bfcsts["data"]:
            for hfwx in data["HFWX"]:
                zh_list = []
                zh_data = hfwx["ZH"]
                self._append_zh(zh_list, zh_data["WXZZZH"])
                self._append_zh(zh_list, zh_data["ZNBYJSZH"])
                self._append_zh(zh_list, zh_data["TJJGZH"])
                self.all_plat_load.append({
                    "hf_plat_name": str(hfwx["ZWMC"]),
                    "bf_plant_id": str(hfwx["ZBNM"]),
                    "all_zh": zh_list
                })

            for lfwx in data["LFWX"]:
                zh_list = []
                zh_data = lfwx["ZH"]
                self._append_zh(zh_list, zh_data["WXZZZH"])
                self._append_zh(zh_list, zh_data["WXTXZH501"])
                self.all_plat_load.append({
                    "lf_plat_name": str(lfwx["ZWMC"]),
                    "lf_plant_id": str(lfwx["ZBNM"]),
                    "all_zh": zh_list
                })
        print(f"所有卫星列表:{self.all_plat_load}")


class EnhancedByteStreamParser(ByteStreamParser):
    """增强解析器：在基础解析器之上增加数据缓冲与想定就绪通知，供强化学习训练使用。"""

    def __init__(self, message_type, http_url: str = None, save_path: str = "./received_data",
                 max_buffer_size: int = 1000, max_data_age_seconds: float = 30.0):
        super().__init__(message_type, http_url, save_path)
        # 数据缓冲区：线程安全deque，支持最大数量和最大存活时间双重限制
        self.buffer = deque(maxlen=max_buffer_size)
        self.buffer_lock = threading.Lock()
        self.max_data_age_seconds = max_data_age_seconds
        # 预发送数据缓存（预留扩展，当前未启用）
        self.pre_send_data: Dict[int, Any] = dict()
        # 主线程通过此事件等待 TCP 接收想定文件
        self.scenario_ready = threading.Event()

    def put_data(self, data):
        """将数据放入缓冲区，超出数量限制时自动丢弃最旧数据，超过时间限制的数据也会被清理。"""
        with self.buffer_lock:
            now = time.time()
            if self.max_data_age_seconds is not None:
                # 先清理已超时的旧数据
                while self.buffer and (now - self.buffer[0][0]) > self.max_data_age_seconds:
                    self.buffer.popleft()
                self.buffer.append((now, data))
            else:
                self.buffer.append(data)

    def get_data(self):
        """从缓冲区取出一个数据；如果缓冲区为空或数据已超时，返回 None。"""
        with self.buffer_lock:
            if not self.buffer:
                return None
            if self.max_data_age_seconds is not None:
                now = time.time()
                while self.buffer and (now - self.buffer[0][0]) > self.max_data_age_seconds:
                    self.buffer.popleft()
                if not self.buffer:
                    return None
                _, data = self.buffer.popleft()
                return data
            return self.buffer.popleft()


def tcp_server(
    parser: EnhancedByteStreamParser = None,
    host='0.0.0.0',
    port=3331,
    buffer_size=20480,
):
    """
    TCP 服务器：接收想定触发消息，解析批次号与想定标识后，通过 HTTP 下载完整想定文件。
    想定就绪后会设置 parser.scenario_ready，通知主线程开始训练。
    """
    tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    with tcp_socket as s:
        s.bind((host, port))
        s.listen()
        print("=" * 30, "TCP server", "=" * 30)
        print(f"TCP服务器正在监听 {host}:{port}...")
        while True:
            conn, addr = s.accept()
            is_print = 0
            with conn:
                print(f"连接来自 {addr}")
                while True:
                    mesg_bytes = conn.recv(buffer_size)
                    if not mesg_bytes:
                        print(f"Closed TCP")
                        break
                    print(f"接收到数据: {mesg_bytes}")
                    offset = 0
                    ceh28, offset = parser.ceh28_parser.parse_struct_CEntityHead28(mesg_bytes, offset)
                    xd, offset = parser.xd_parser.parse_struct_ZzxdbsParam(mesg_bytes, offset)
                    parser.http_get_bfcsts(ceh28.batch_id, xd.zzxdbs)
                    if is_print == 0:
                        print(f"ceh28-batch_id: {ceh28.batch_id}, parser_id: {parser.batch_id}")
                        is_print += 1
                    conn.sendall(mesg_bytes)  # 回传接收到的数据


def udp_server(
    parser: EnhancedByteStreamParser = None,
    host='0.0.0.0',
    port=4444,
    buffer_size=10240,
):
    """
    UDP 服务器：接收环境实时数据，按消息类型与时间间隔过滤后，将解析结果放入缓冲区。
    当前仅处理 plat（平台）类型消息；其他类型可按需扩展 put_data 入队逻辑。
    """
    udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    with udp_socket as s:
        s.bind((host, port))
        print("=" * 30, "UDP server", "=" * 30)
        print(f"UDP服务器正在监听 {host}:{port}...")

        receive_num = 0
        is_first = True
        handle_num = 0
        plat_num = 0
        load_num = 0
        parse_error_num = 0
        last_output_time = time.time()
        while True:
            offset = 0
            mesg_bytes, addr = s.recvfrom(buffer_size)
            mesg_type = parser.parser_head(mesg_bytes)
            receive_num += 1
            if mesg_type in parser.mesg_type_all:
                try:
                    ceh28, offset = parser.ceh28_parser.parse_struct_CEntityHead28(mesg_bytes, offset)
                except (IndexError, ValueError, OverflowError) as e:
                    parse_error_num += 1
                    continue
                if is_first:
                    last_receive_data_time = ceh28.bjt
                    is_first = False
                if str(parser.batch_id) == "0":
                    print("没有接收到想定，不知道如何处理数据")
                    continue
                if ceh28.bjt == last_receive_data_time or (ceh28.bjt - last_receive_data_time) >= timedelta(seconds=parser.interval):
                    last_receive_data_time = ceh28.bjt
                    for _ in range(ceh28.num_entity):
                        if ceh28.mesg_type in parser.receive_type["plat"] and ceh28.batch_id == int(parser.batch_id):
                            handle_num += 1
                            plat_num += 1
                            try:
                                sxp, offset = parser.spp_parser.parse_struct_SatePlatParam_safe(mesg_bytes, offset)
                                parser.put_data(sxp)  # 将解析后的平台数据放入队列
                            except (IndexError, ValueError, UnicodeDecodeError, AttributeError, TypeError, OverflowError) as e:
                                parse_error_num += 1
                                break  # 当前实体解析失败，跳过后续实体，避免死循环
            s.sendto(mesg_bytes, addr)  # 回传接收到的数据

            current_time = time.time()
            refresh_time = 5
            if current_time - last_output_time >= refresh_time:
                print("=" * 30, "UDP server status", "=" * 30)
                print(f"每隔{parser.interval}秒处理一次数据")
                print(f"{refresh_time}秒内接收数据条数: {receive_num}")
                print(f"{refresh_time}秒内处理数据条数: {handle_num}")
                print(f"{refresh_time}秒内处理卫星数量: {plat_num}")
                print(f"{refresh_time}秒内获取想定数量: {load_num}")
                if parse_error_num > 0:
                    print(f"{refresh_time}秒内解析失败次数: {parse_error_num}")
                last_output_time = current_time
                receive_num = 0
                handle_num = 0
                plat_num = 0
                load_num = 0
                parse_error_num = 0
