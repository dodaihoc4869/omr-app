"""Nguồn758: ba vòng trần, sáu O và đầu sóng theo nét nguồn công khai."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='8d3c2d210b6531dd587d3bba037f36a738c6ede9f4cf90e1cccc98720911f2c9'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<g transform="translate(10 8)">'
lines=['M48 77L69 51L95 23H122 M144 35L156 51L136 75H89L69 51 M156 51L168 61 M191 62L205 51L231 23H259 M282 35L293 51L273 75H226L205 51 M293 51L307 64 M330 64L345 51L371 23H398 M421 35L433 51L413 75H366L345 51 M433 51L447 64']
# Các cực trị có chứng cứ pixel nguồn; dựng đường cong mượt qua từng cực trị, không thêm chu kỳ.
def wave(knots):
 d=f'M{knots[0][0]} {knots[0][1]}'
 for (x,y),(u,v) in zip(knots,knots[1:]):
  dx=(u-x)/3;d+=f'C{x+dx:g} {y:g} {u-dx:g} {v:g} {u:g} {v:g}'
 return d
left=[(3,79),(5,80.5),(8.5,76),(12,80),(16,75),(19.5,80),(23,75.5),(27,80.5),(30.5,76),(34,80),(38,75.5),(41.5,80),(45,75.5),(48,77)]
right=[(470,77.5),(472,78),(475,74.5),(478,78.5),(481,74),(484,78),(487.5,74.5),(491,78),(494,74.5),(497,78.5),(500,74),(502,75.5)]
for d in lines+[wave(left),wave(right)]:b+=f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
for x,y in [(136,29),(178,78),(273,29),(318,83),(412,29),(458,83)]:b+=F.label(x,y,'O',24)
b+='<path d="M337 5L311 47" fill="none" stroke="#252440" stroke-width="1.5"/><path d="M307 54L310 39L313 45L320 46Z" fill="#252440"/>'
b+='</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="526" height="111" viewBox="0 0 526 111"><title>Liên kết giữa các vòng polysaccharide theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polysaccharide-ba-vong-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=758,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3bare rings6O/1diagonalfilledhead pointingbond/left6crest6troughright5crest5trough/nativeendpoints/allthinuniform/noH-OH-CH2OH-nums-bracket-caption-answer.')
(K/'cau-truc-polysaccharide-ba-vong-ddh-lo-264-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
