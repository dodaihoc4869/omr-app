"""Nguồn806: giữ cả các vạch phổ không nhãn, không suy fragmentation."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=dict(next(x for x in json.loads((K/'doc-molecule-lo-169.json').read_text())if x['i']==806));r.pop('chiLaDuLieuDungChuaSoatRender',None)
peaks=[(164,544),(171,543),(182,526),(200,545),(215,543),(244.5,531),(254.5,505),(264,432),(269.5,512),(276.5,507),(286.5,540),(295.5,544),(307,547),(318.5,515),(335,543),(343.5,514),(353,508),(357,500),(364,532),(372.5,510),(381,543),(394.5,542),(417.5,545),(425.5,532),(433,522),(438.5,499),(450.5,512),(458,323),(464.5,195),(472.5,503),(486,547),(505,544),(522,536),(530.5,543),(540,532),(553,522),(575,545),(608,547),(648.5,522),(656,298),(666,35)]
b='<path d="M119 24V551H694" fill="none" stroke="#71acc3" stroke-width="2.2"/>'
for x,y in peaks:b+=f'<path d="M{x} 550V{y}" stroke="#bd6b9d" stroke-width="2"/>'
for x,t in [(119,'20'),(273,'40'),(425,'60'),(576,'80')]:b+=f'<path d="M{x} 551V560" stroke="#555" stroke-width="1.6"/>'+F.label(x,584,t,23)
for y,t in [(24,'100'),(286,'50')]:b+=f'<path d="M119 {y}H131" stroke="#555" stroke-width="1.6"/>'+F.label(109,y+7,t,23,'end')
for x,y,t in [(181,522,'28'),(203,540,'30'),(264,428,'39'),(282,502,'41'),(321,513,'46'),(361,493,'52'),(438,489,'63'),(464,190,'66'),(520,511,'74'),(550,515,'78'),(666,30,'93')]:b+=F.label(x,y,t,22)
b+='<g transform="translate(32 265) rotate(-90)">'+F.label(0,0,'Cường độ tương đối (%)',23,weight='dam')+'</g>'+F.label(682,584,'m/z',23)
b+='<path d="M218 631L228 616L238 631Z" fill="#bd6b9d"/>'+F.label(244,634,'Phổ khối lượng của aniline',23,'start',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="730" height="660" viewBox="0 0 730 660"><title>Phổ khối lượng của aniline theo nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(raw).hexdigest();fn='ms-aniline-ddh-'+h+'.svg';(K/fn).write_bytes(raw);r.update(svg=fn,hashSvg=h,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',peaksPixel=peaks,ghiChuDung='11labelledpeaks+unlabelledvạchgiữpixel/2blueaxes/X20-40-60-80/Y50-100/no0/noM/captiontriangle/DDHpath. Tinybaselinegraystrokeskeptat307486505575608,khônggánmz/khôngsuytheory.');(K/'cau-truc-ms-aniline-ddh-lo-180-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
