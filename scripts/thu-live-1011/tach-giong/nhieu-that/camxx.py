# CAM++ (WeSpeaker VoxCeleb, ONNX) trong Python — fbank Kaldi 80 dải chép đúng ma-nhan.mjs (cửa sổ povey, tiền nhấn 0,97, bỏ DC, log, trừ trung bình).
import numpy as np
import onnxruntime as ort

NB, NW, NF, HOP = 80, 400, 512, 160
_i = np.arange(NW)
CUA_SO = (0.5 - 0.5 * np.cos(2 * np.pi * _i / (NW - 1))) ** 0.85
def _mel(f): return 1127 * np.log(1 + f / 700)
_lo, _hi = _mel(20), _mel(8000)
_d = (_hi - _lo) / (NB + 1)
_m = _mel(np.arange(NF // 2 + 1) * 16000 / NF)
LOC = np.zeros((NB, NF // 2 + 1))
for b in range(NB):
    l = _lo + b * _d; c = l + _d; r = c + _d
    w = np.where((_m > l) & (_m < r), np.where(_m <= c, (_m - l) / (c - l), (r - _m) / (r - c)), 0)
    LOC[b] = w

def fbank(x):
    x = np.asarray(x, np.float64)
    T = 1 + (len(x) - NW) // HOP
    idx = np.arange(NW)[None, :] + HOP * np.arange(T)[:, None]
    f = x[idx]
    f = f - f.mean(axis=1, keepdims=True)
    g = f.copy()
    g[:, 1:] = f[:, 1:] - 0.97 * f[:, :-1]
    g[:, 0] = f[:, 0] - 0.97 * f[:, 0]
    g *= CUA_SO
    p = np.abs(np.fft.rfft(g, NF, axis=1)) ** 2
    o = np.log(np.maximum(p @ LOC.T, 1.19e-7))
    o -= o.mean(axis=0, keepdims=True)
    return o.astype(np.float32)

class Cam:
    def __init__(self, duong, luong=4):
        so = ort.SessionOptions(); so.intra_op_num_threads = luong
        self.s = ort.InferenceSession(duong, so, providers=['CPUExecutionProvider'])
        self.vao = self.s.get_inputs()[0].name
    def nhung(self, x16):
        if len(x16) < NW + HOP * 20: return None
        e = self.s.run(None, {self.vao: fbank(x16)[None]})[0].reshape(-1)
        return e / (np.linalg.norm(e) + 1e-9)
