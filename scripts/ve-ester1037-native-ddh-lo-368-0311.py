"""Thủy phân ester nguồn1037: R chưa biết, giữ H–O–H và ba đầu mũi tên khác nhau."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-ester1037-lo-368.json').read_text());h=p['hash'];g=p['geometry'];b=''
def line(pair):
 (x,y),(u,v)=pair
 return f'<path d="M{x} {y}L{u} {v}" stroke="#202020" stroke-width="1.8" fill="none"/>'
def text(x,y,t,z=30,anchor='middle'):return F.label(x,y,t,z,anchor=anchor,fill='#202020')
for name in ['esterLeft','acidRight']:
 for pair in g[name]['singleBonds']+g[name]['CORaysDown']:b+=line(pair)
for name in ['water','alcohol']:
 for pair in g[name]['bonds']:b+=line(pair)
for x,y,t in [(18,72,'R'),(85,72,'O'),(131,96,"R'"),(52,131,'O'),(236,98,'H'),(282,98,'O'),(328,98,'H'),(496,71,'R'),(539,131,'O'),(715,98,"R'"),(766,98,'O'),(805,98,'H')]:b+=text(x,y,t)
b+=text(572-F.advance('O',30)/2,73,'OH',30,'start')+text(180,98,'+',26)+text(658,98,'+',26)
a=g['equilibrium'];b+=line(a['upperShaft'])+line(a['lowerShaft'])+line(g['cleavageLeader']['shaft'])
for pts in [a['upperHalfHead'],a['lowerHalfHead'],g['cleavageLeader']['filledTriangle']]:b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in pts)+'Z" fill="#202020"/>'
parts=[('H',24,0),('+',16,-8),(', t',24,0),('o',16,-8)];left=411-sum(F.advance(t,z)for t,z,dy in parts)/2
for t,z,dy in parts:b+=text(left,75+dy,t,z,'start');left+=F.advance(t,z)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="822" height="136" viewBox="0 0 822 136"><title>Thủy phân ester theo nguồn1037</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ester1037-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=1037,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2knownBareC6O4HexcludingconditionHplus/2R2RapostropheUNKNOWNtotalC/2COdouble2splitfeetCONTACTslopes-nativeV/noaddedcrossbar/2HALFfilledharpoonsTOPrightABOVE-BOTTOMleftBELOW/1FULLfilledcleavageleaderDOWNRIGHTtip6166ABOVEbondNOTatom/ALLregularUPRIGHT/EXACTH-O-H-andRapostrophe-O-H/shortstraightapostropheNOlongprime/OHfirstOanchor/Hplus,tSUPo/0captions-stereo/noaddedanswer-H2Ocondense-acidnames')
(K/'cau-truc-ester1037-native-ddh-lo-368-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
