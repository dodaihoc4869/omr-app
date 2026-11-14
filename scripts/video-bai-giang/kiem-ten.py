# Kiểm mọi đoạn GIỌNG trong kịch bản: chữ nghe được (ASR) nào nằm trong đoạn mà là tên người ⇒ in ngữ cảnh (chỉ để soát, không xuất ra ngoài)
import json,sys,unicodedata
kb=json.load(open(sys.argv[1])); asr=json.load(open(sys.argv[2]))
TEN={'hưng','angola','angô','angela','long','đao','bảo','kiên','yến','hoàng','minh','trường','cao','kiều','chiêu','ngọc','thiên','khánh','hà','trần','đào','nhật','hùng','iran','thịnh','vượng','tiến','thanh','la'}
for l in open(sys.argv[3]):
  for w in l.split(): TEN.add(w.lower())
ws=[w for s in asr for w in s['tu']]
bad=0
for g in kb['giong']:
  trong=[w for w in ws if w[0]>=g['s0']-0.02 and w[1]<=g['s1']+0.02 or (w[0]<g['s1'] and w[1]>g['s0'] and w[0]>=g['s0']-0.3)]
  for w in trong:
    if w[2].lower().strip('.,') in TEN:
      bad+=1; ctx=' '.join(x[2] for x in ws if abs(x[0]-w[0])<2.5)
      print(f"{g['s0']:.2f}-{g['s1']:.2f} '{w[2]}'@{w[0]:.2f} | {ctx}")
print('so cho nghi:',bad)
