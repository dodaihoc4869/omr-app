"""Nguồn494: giữ các đoạn dây và khoảng hở in trên sơ đồ, không suy độ sáng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='5b7a52e2077e567f8d44896203f009a6e91ab34a97c5faa6f5b641b42edb3377'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,fill='none',stroke='#707070',w=1.7,extra=''):
 return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round" {extra}/>'
def ellipse(x,y,rx,ry,fill='none',stroke='#777777',w=1.7):
 return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="{w}"/>'
b=path('M275 81L324 74L466 84L426 94Z','#fafafa')
b+=path('M426 94L466 84V136L426 149Z','#a5a5a5')
b+=path('M275 81L426 94V149L275 130Z','#bcbcbc')
b+=path('M425 73L386 86',w=1.2)
for x,y in [(286,108),(300,109),(343,113),(356,115),(402,120),(416,122)]:
 b+=ellipse(x,y,5,5,'#f5f5f5','#777777',2)
# Sáu dây đi từ ba cặp đầu cắm; cặp phải giữ các đoạn hở gần bóng như bản in.
for d in ['M286 112L271 134C238 159 174 174 119 175',
          'M300 113C282 148 253 174 219 195C190 219 178 195 164 203V210',
          'M343 118C340 140 345 149 351 160C365 181 325 188 295 200',
          'M356 120C347 145 349 150 363 164C379 181 374 193 360 195H344V209',
          'M402 125V173C402 188 430 198 449 202',
          'M416 127C417 153 424 171 446 180']:
 b+=path(d,w=1.6)
for offset,number in [(0,1),(182,2),(361,3)]:
 # Cốc, mặt chất lỏng và cung khuất đáy; nét đứt là đường khuất, không phải hạt.
 c=''
 c+=path('M81 236V333C81 353 176 353 176 333V237',w=1.9)
 c+=path('M82 329C94 315 161 315 175 329',w=1.1,extra='stroke-dasharray="3 5"')
 c+=ellipse(129,266,47,13,w=1.3)
 for x in [137,157]:
  c+=path(f'M{x} 243H{x+11}V329H{x}Z','#f8f8f8','#777777',2)
  c+=path(f'M{x+1} 244H{x+10}V266H{x+1}Z','#dddddd','none',0)
  c+=path(f'M{x} 266H{x+11}',w=1.3)
 c+=ellipse(129,230,51,16,'#aaaaaa')
 c+=ellipse(129,225,51,16,'#f5f5f5')
 c+=path('M78 228C87 247 169 247 180 228',w=2)
 # Vỏ bóng và thân chữ U bên trong giữ sắc xám giống nhau, không thêm tia sáng.
 c+=path('M100 214C100 208 91 201 90 187C89 159 115 157 119 180C122 196 109 204 109 214Z','#f7f7f7','#858585',2)
 c+=path('M101 214V182Q101 177 105 177Q110 177 110 182V214Z','#bbbbbb','#7d7d7d',1.8)
 c+=path('M103 214V186Q103 183 105 183Q107 183 107 186V214','#fafafa','#777777',1.3)
 c+=path('M92 219C88 211 87 197 91 188',w=1.7)
 c+=path('M117 215C120 203 126 193 136 194C148 194 150 200 143 209',w=1.7)
 if number==3:
  # Đoạn phải của bóng ba tách khỏi dây đến phía trái bóng; không tự nối xuyên kính.
  c+=path('M124 189C137 191 148 191 159 194C164 195 164 202 164 209',w=1.6)
 c+=ellipse(105,223,22,10,'#999999')
 c+=ellipse(105,219,19,7,'#cccccc')
 c+=ellipse(105,217,13,4,'#aaaaaa')
 for x,y in [(137,210),(157,208)]:
  c+=path(f'M{x} {y}H{x+11}V226H{x}Z','#cccccc','#777777',1.8)
 b+=f'<g transform="translate({offset} 0)">{c}</g>'
 b+=F.label(129+offset,383,f'({number})',23,weight='dam')
b+=F.label(456,58,'Nguồn điện',24)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="647" height="429" viewBox="0 0 647 429"><title>Ba cốc nối nguồn điện theo nguồn</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='ba-coc-nguon-dien-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=494,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=hashlib.sha256(b''.join((G/('src/styles/phong-ddh/ddh-rounded-dam-'+n+'.woff2')).read_bytes() for n in ['latin','vietnamese'])).hexdigest(),trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3Dpowerbox6terminals/3cups6rods3bulbs/Ustems/3localwireloops/literalrightbulbwiregaps/4labelsDDHpath/noaddedbrightness-rays-ions-polarity-ticks/hiddenbasearcnotparticlecount.')
(K/'cau-truc-ba-coc-nguon-dien-ddh-lo-240-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
