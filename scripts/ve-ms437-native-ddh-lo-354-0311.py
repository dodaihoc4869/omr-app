"""Phổ nguồn437: năm peak theo pixel native, không suy cường độ hay đáp án."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-ms437-lo-354.json').read_text());h=p['hash'];g=p['geometry'];b=''
def line(pair,width=1.5):
 (x0,y0),(x1,y1)=pair
 return f'<path d="M{x0} {y0}L{x1} {y1}" stroke="#333333" stroke-width="{width}" fill="none"/>'
for a in g['axes'].values():
 if isinstance(a,list):b+=line(a)
for a in g['xTicks']:
 b+=line(a['stem']);b+=F.label(a['centerX'],382,a['text'],22,fill='#222222')
for a in g['yTicks']:
 b+=line(a['stem']);b+=F.label(73,a['centerY']+8,a['text'],22,anchor='end',fill='#222222')
for a in g['peaks']:
 b+=line(a['shaft'],1.8);b+=F.label(a['centerX'],a['labelBBox'][3]-1,a['label'],18,fill='#222222')
b+='<g transform="translate(31 204) rotate(-90)">'+F.label(0,0,'Cường độ tương đối (%)',22,fill='#222222')+'</g>'
b+='<g transform="translate(752 409) skewX(-12)">'+F.label(0,0,'m/z',23,fill='#222222')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="795" height="420" viewBox="0 0 795 420"><title>Phổ khối lượng theo nguồn437</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms437-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=437,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='5peaks12-16nativeheights11-34.5-66-288-325.5PIXELSnotexactpercent/8Xlabels11-18/6Ylabels0-100/14tickstems/regularUPRIGHTnumbers-Ylabelrotated/mzREGULARITALIC/baseline355LEFT357RIGHTdrift/0heads0grid/noextra17peak-ionannotation-answer-intensitylabels')
(K/'cau-truc-ms437-native-ddh-lo-354-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
