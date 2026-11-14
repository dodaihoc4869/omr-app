import json,sys,glob
a,b=float(sys.argv[1]),float(sys.argv[2])
ws=[]
for f in sorted(glob.glob(sys.argv[3]+'/loi-asr-k*.json')):
  for s in json.load(open(f)):
    ws+= [w for w in s['tu'] if w[0]>=a and w[0]<=b]
ws.sort()
out=[]; 
for w in ws: out.append(f"{w[2]}@{w[0]:.2f}")
print(' '.join(out))
