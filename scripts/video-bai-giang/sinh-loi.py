# Sinh loi-sach-cN.json từ spec: mỗi dòng [chữ, giờ chữ đầu, giờ chữ cuối, cờ] ('c' = cắt cứng hai đầu, 'd' = cứng cuối, 't' = cứng đầu)
import json,sys,glob,os
d=sys.argv[1]; spec=json.load(open(sys.argv[2]))
ws=[]
for f in sorted(glob.glob(d+'/loi-asr-k*.json')):
  for s in json.load(open(f)): ws+=s['tu']
ws.sort()
def tim(t):
  i=min(range(len(ws)), key=lambda k: abs(ws[k][0]-t))
  if abs(ws[i][0]-t)>0.03: raise SystemExit(f'không thấy chữ tại {t}')
  return i
for cid,lines in spec.items():
  out=[]
  for row in lines:
    chu,a,b=row[0],row[1],row[2]; co=row[3] if len(row)>3 else ''
    i,j=tim(a),tim(b)
    tu=ws[i][0]; den=ws[j][1]
    o={'chu':chu,'tu':round(tu,2),'den':round(den,2)}
    if 'c' in co or 't' in co:
      pe=ws[i-1][1] if i>0 else 0; o['tu']=round(max(tu-0.06, pe+0.03, (pe+tu)/2 if pe>tu-0.12 else 0),2); o['tuCung']=True
    if 'c' in co or 'd' in co:
      ns=ws[j+1][0] if j+1<len(ws) else den+1; o['den']=round(min(den+0.06, ns-0.04),2); o['denCung']=True
    out.append(o)
  json.dump(out, open(f'{d}/loi-sach-{cid}.json','w'), ensure_ascii=False)
  print(cid, len(out), 'dòng', round(sum(x['den']-x['tu'] for x in out),1),'s')
