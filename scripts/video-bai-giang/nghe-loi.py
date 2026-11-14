# NHẬN DẠNG LỜI THẦY (thầy 14/11 cho phép tải PhoWhisper): chạy TRÊN MÁY, không gửi tiếng đi đâu. Đoạn tiếng 16 kHz một kênh ⇒ chữ + giờ từng chữ
# (giây trên tiếng gốc = lệch + giờ trong đoạn). Chữ nghe được CHỈ dùng để lấy GIỜ cho khop-loi.mjs (có tên học sinh, sai thuật ngữ ⇒ không hiện, không đưa
# vào kho mã). Mô hình để NGOÀI dự án (mad1999/pho-whisper-medium-ct2 ~1,5 GB). Cần: pip install faster-whisper (trong môi trường riêng).
# Dùng: ffmpeg -ss <đầu> -to <cuối> -i tieng.mp3 -ac 1 -ar 16000 doan.wav
#       python nghe-loi.py <thư mục mô hình> doan.wav <đầu> <tư liệu>/loi-asr.json
import sys, json, time, wave
import numpy as np
from faster_whisper import WhisperModel
mo_hinh, wav, lech, ra = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
bd = time.time()
m = WhisperModel(mo_hinh, device='cpu', compute_type='int8', cpu_threads=4)
w = wave.open(wav); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
seg, info = m.transcribe(x, language='vi', beam_size=5, word_timestamps=True, vad_filter=False, condition_on_previous_text=True)
out = []
for s in seg:
    out.append({'a': round(lech + s.start, 2), 'b': round(lech + s.end, 2), 'chu': s.text.strip(), 'tu': [[round(lech + w.start, 2), round(lech + w.end, 2), w.word.strip(), round(w.probability, 2)] for w in (s.words or [])]})
json.dump(out, open(ra, 'w', encoding='utf8'), ensure_ascii=False)
print(f'xong {len(out)} câu, {sum(len(x["tu"]) for x in out)} chữ, {time.time()-bd:.0f} s')
