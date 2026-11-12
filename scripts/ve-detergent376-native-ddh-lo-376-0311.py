"""Hai chất tẩy rửa nguồn335: giữ SO₂O, vòng tròn thơm và các điện tích rời."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-detergent376-lo-376.json').read_text());h=p['hash'];g=p['geometry'];b=''
def path(v,close=False):
 return '<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+('Z'if close else'')+'" stroke="#252525" stroke-width="2" fill="none"/>'
for name,base in [('X',112),('Y',315)]:
 x,y,u,v=g[name]['box']['rect'];b+=f'<rect x="{x}" y="{y}" width="{u-x}" height="{v-y}" fill="white" stroke="#252525" stroke-width="1"/>'
 b+=F.label(64,base,name,32,fill='#252525')
b+=path(g['X']['orderedBareC'])+path(g['X']['saltLabel']['bond'])
for v in g['X']['carbonyl']['rays']:b+=path(v)
b+=path(g['Y']['orderedChainBareC'])+path(g['Y']['chainRingBond'])+path(g['Y']['ringVertices'],True)+path(g['Y']['ringHeadBond'])
c=g['Y']['innerCircle'];b+=f'<ellipse cx="{c["center"][0]}" cy="{c["center"][1]}" rx="{c["rx"]}" ry="{c["ry"]}" fill="none" stroke="#252525" stroke-width="2"/>'
def label(x,y,t,z=24,anchor='middle'):return F.label(x,y,t,z,anchor=anchor,fill='#252525')
b+=label(1032,24,'O',26)+label(1081,118,'O',26)+label(1096,101,'−',16)+label(1108,118,'Na',24,'start')+label(1143,101,'+',16)
b+=label(1023,281,'SO',24,'start')+label(1057,288,'2',16.8,'start')+label(1076,281,'O',24)+label(1091,264,'−',16)+label(1103,281,'Na',24,'start')+label(1141,265,'+',16)
b+=label(152,173,g['X']['caption']['text'],30,'start')+label(152,399,g['Y']['caption']['text'],30,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1153" height="411" viewBox="0 0 1153 411"><title>Hai chất tẩy rửa theo nguồn335</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='detergent376-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=335,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='36C5O1S2Na/X18bareC1COdouble2splitfeetCONTACT2slopes-nativeV-NOcrossbar/Y12chainC6ringC1innerCIRCLE-NO3Phdouble/EXACTOminus-NaPLUS-and-SO2Ominus-NaPLUS-SUB2-SUPcharges-NOcovalentO-Na/2whiteXYboxes1px/ALLregularUPRIGHT-2captionsEXACTsodium stearate-sodium 4-dodecylbenzenesulfonate/0arrows-stereo-noaddedH-expandedSO-SO3formulaanswer-alias')
(K/'cau-truc-detergent376-native-ddh-lo-376-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
