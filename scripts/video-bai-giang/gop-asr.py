import json,sys,glob,collections,re
d=sys.argv[1]
fs=sorted(glob.glob(d+'/loi-asr-k*.json'), key=lambda f:int(re.search(r'asr-k(\d+)',f)[1]))
data=[json.load(open(f)) for f in fs]
dau=[min((s['a'] for s in x), default=1e9) for x in data]
out=[]
for i,x in enumerate(data):
  ws=[w for s in x for w in s['tu']]
  dem=collections.Counter(w[0] for w in ws)
  han=dau[i+1] if i+1<len(data) else 1e9
  for s in x:
    tu=[w for w in s['tu'] if dem[w[0]]<4 and w[0]<han]
    if tu: out.append({'a':tu[0][0],'b':tu[-1][1],'chu':' '.join(w[2] for w in tu),'tu':tu})
json.dump(out, open(d+'/loi-asr-all.json','w'), ensure_ascii=False)
print(len(fs),'tệp',len(out),'câu',sum(len(s['tu']) for s in out),'chữ')
