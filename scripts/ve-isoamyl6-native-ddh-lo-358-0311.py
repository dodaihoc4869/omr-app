"""Phản ứng isoamyl nguồn6: giữ hai halfharpoon và chân carbonyl native."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-isoamyl6-lo-358.json').read_text());h=p['hash'];g=p['geometry'];b=''
def line(a):
 (x,y),(u,v)=a
 return f'<path d="M{x} {y}L{u} {v}" stroke="#202020" stroke-width="2" fill="none"/>'
def text(x,y,t,z=30,weight='de',anchor='middle'):
 return F.label(x,y,t,z,weight=weight,anchor=anchor,fill='#202020')
def formula(x,y,parts,which='first',size=30,weight='de'):
 widths=[F.advance(t,size*.7 if kind=='sub'else size,weight)for t,kind in parts]
 if which=='first':left=x-widths[0]/2
 elif which=='last':left=x-sum(widths[:-1])-widths[-1]/2
 else:left=x-sum(widths)/2
 out=''
 for (t,kind),w in zip(parts,widths):
  out+=text(left,y+7 if kind=='sub'else y,t,size*.7 if kind=='sub'else size,weight,'start');left+=w
 return out
for name in ['acid','ester']:
 a=g[name]
 for pair in a['singleBonds']+a['carbonylRays']+[a['shortFootJoin']]:b+=line(pair)
for pair in g['alcohol']['bonds']:b+=line(pair)
b+=formula(48,97,[('H','body'),('3','sub'),('C','body')],'last')
b+=text(83,34,'O')+formula(121,96,[('O','body'),('H','body')])
b+=formula(286,93,[('H','body'),('O','body')],'last')
for x,y in [(394,28),(429,95),(942,39),(976,103)]:b+=formula(x,y,[('C','body'),('H','body'),('3','sub')])
b+=formula(763,102,[('H','body'),('3','sub'),('C','body')],'last')+text(800,38,'O')+text(835,102,'O')
b+=formula(1109,88,[('H','body'),('2','sub'),('O','body')],'middle')
b+=text(195,93,'+')+text(1057,85,'+')
for name in ['acid','alcohol','ester']:
 a=g[name]['caption'];bb=a['bbox'];b+=text((bb[0]+bb[2])/2,bb[3]-2,a['text'],28,'dam')
a=g['equilibrium'];b+=line(a['upperShaft'])+line(a['lowerShaft'])
for key in ['upperFilledHalfHead','lowerFilledHalfHead']:
 b+='<path d="M'+'L'.join(str(x)+' '+str(y)for x,y in a[key])+'Z" fill="#202020"/>'
parts=[('H',24,0),('2',17,5),('SO',24,0),('4',17,5),(' đặc, t',24,0),('o',16,-8)];left=608-sum(F.advance(t,z,'dam')for t,z,dy in parts)/2
for t,z,dy in parts:b+=text(left,54+dy,t,z,'dam','start');left+=F.advance(t,z,'dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1141" height="150" viewBox="0 0 1141 150"><title>Phản ứng theo nguồn6</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='isoamyl6-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=6,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='14C6Oincludingwater-excludingcatalyst/2COdouble2nativeSHORTfootjoins/2FILLEDHALFharpoonsTOPrightABOVE-BOTTOMleftBELOW/3TRUEdamUPRIGHTcaptions-conditionH2SO4đặc,tSUPo/regularUPRIGHTchemicals-SUB2-3-4/HOlastO-H3ClastC-CH3firstC/0stereo0charges/noaddedIRbands-yield-tempvalue-H-answer')
(K/'cau-truc-isoamyl6-native-ddh-lo-358-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
