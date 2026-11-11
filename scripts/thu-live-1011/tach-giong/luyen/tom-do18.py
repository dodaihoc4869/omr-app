# Tóm bản đo 18 s (do-tach-giong.mjs, LV_CHI_MH=1) thành 4 tiêu chí (mục 10.5) cho từng tệp số đo:
#   python3 -I tom-do18.py <so-do-1.json> [<so-do-2.json> …]
# mở sau (ms) · nói chồng: SI-SDR thầy vào → ra ở từng mức (giọng khác thấp hơn thầy 0 / 2 / 10 dB … theo LV_SNR) · giọng khác giảm (dB, đoạn một mình; lúc chồng) ·
# hệ số thời gian thực · giữ dải (dB theo dải, đoạn thầy một mình; 11–24 kHz = hệ số mô hình đặt cho dải cao, không phụ thuộc tiếng vào) · thầy bị hạ (dB) ·
# giọng khác giảm theo thời gian từ lúc người khác bắt đầu nói.
import sys, json
import numpy as np
for p in sys.argv[1:]:
    d = json.load(open(p)); r = [x for x in d['ca'] if x['cach'] == 'mo-hinh']
    if not r: continue
    ban = r[0].get('ban'); snrs = sorted({x['snr'] for x in r})
    print(f'== {ban} ({p})')
    print('  mở sau (ms):', ' · '.join(f"{x['snr']}dB {x['khac']} {x['moSauKhacMs']}" for x in r))
    for s in snrs:
        print(f'  nói chồng {s} dB (SI-SDR thầy vào→ra):', ' · '.join(f"{x['khac']} {x['chongSiSdr0']}→{x['chongSiSdr']}" for x in r if x['snr'] == s))
    print('  giọng khác giảm một mình (dB):', ' · '.join(f"{x['snr']}/{x['khac']} {x['khacGiamDb']}" for x in r))
    print('  giọng khác giảm lúc chồng (dB):', ' · '.join(f"{x['snr']}/{x['khac']} {x['chongKhacGiamDb']}" for x in r))
    print('  hệ số thời gian thực:', min(x['rtf'] for x in r), '–', max(x['rtf'] for x in r))
    bands = list(r[0]['giuDai'].keys())
    print('  giữ dải (dB, TB):', ' · '.join(f"{b} {np.mean([x['giuDai'][b] for x in r]):.1f}" for b in bands))
    if 'thayHaDb' in r[0]: print('  thầy bị hạ (dB, đoạn thầy một mình):', min(x['thayHaDb'] for x in r), '–', max(x['thayHaDb'] for x in r), '· SI-SDR thầy một mình', min(x['thayGiuSiSdr'] for x in r), '–', max(x['thayGiuSiSdr'] for x in r))
    if 'khacGiamTheoTg' in r[0]:
        ks = list(r[0]['khacGiamTheoTg'].keys())
        print('  giọng khác giảm theo thời gian từ lúc bắt đầu nói (dB, TB các ca):', ' · '.join(f"{k} {np.mean([x['khacGiamTheoTg'][k] for x in r]):.1f}" for k in ks))
    kq = {'ban': ban, 'moSauMax': max(x['moSauKhacMs'] for x in r), 'khacGiamMin': min(x['khacGiamDb'] for x in r), 'khacGiamMax': max(x['khacGiamDb'] for x in r),
          'chongGiamSiSdrMax': round(max(x['chongSiSdr0'] - x['chongSiSdr'] for x in r), 1), 'rtfMax': max(x['rtf'] for x in r)}
    print('  TÓM:', json.dumps(kq, ensure_ascii=False))
