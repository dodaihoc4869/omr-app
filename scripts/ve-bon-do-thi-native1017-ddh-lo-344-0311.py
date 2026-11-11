"""Bốn đồ thị1017: giữ đoạn thẳng và vị trí gốc theo native."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='b6651243b7a6642011831be7cbc88f2794d09bac1d30f46a8545583dd8a54fb0';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
b=''
for n,(x,end,curve) in enumerate([(52,196,'M52 120H184'),(278,423,'M278 120L405 59'),(500,644,'M500 120L632 161'),(744,888,'M744 189L873 87')],1):
 b+=line(f'M{x} 24V189H{end-6}')+line(curve)
 b+=f'<path d="M{x} 18L{x-5} 27L{x+5} 27Z M{end} 189L{end-9} 184L{end-9} 194Z" fill="#252440"/>'
 b+='<g transform="translate('+str(x-12)+' 100)rotate(-90)">'+F.label(0,0,'Khối lượng điện cực',17,weight='de')+'</g>'
 b+=F.label(x-7,204,'0',16,weight='de')+F.label(end-3,210,'Thời gian',17,anchor='end',weight='de')+F.label((x+end)/2-3,231,'('+str(n)+')',18,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="248" viewBox="0 0 900 248"><title>Bốn đồ thị theo nguồn1017</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bon-do-thi-native1017-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1017,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4graphs4straightlines-horizontal-rising-falling-originrising/8FILLEDheads/4origin0/4regularuprightKhối lượng điện cực-Thời gian/4trueDAMuprightcaptions1-4/0ticks0grid/noaddedunits-data-answer')
(K/'cau-truc-bon-do-thi-native1017-ddh-lo-344-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
