"""Dựng hình học ba orbital nguồn19, giữ trục/pha/nhãn; không tự thêm tên AO."""
from pathlib import Path
import json,hashlib,html
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);a=A[19]
assert a['hash']=='0361afe28db5cea013014d170fc4e0293031367734af2290328f9dedc2d291e9'
def path(d,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
def text(x,y,s,size=25):return f'<text x="{x}" y="{y}" font-family="DejaVu Sans,Arial,sans-serif" font-size="{size}" text-anchor="middle" fill="#252440">{html.escape(s)}</text>'
def arrow(d):return f'<path d="{d}" fill="#252440"/>'
b='''<defs><radialGradient id="cau" cx="30%" cy="50%" r="70%"><stop offset="0" stop-color="#f5f2fb"/><stop offset="0.4" stop-color="#b9b4d0"/><stop offset="1" stop-color="#77718f"/></radialGradient><radialGradient id="thuy" cx="35%" cy="35%" r="75%"><stop offset="0" stop-color="white"/><stop offset="0.4" stop-color="#b9b4d0"/><stop offset="1" stop-color="#77718f"/></radialGradient></defs>'''
# a: nguồn không có đầu mũi tên, nhãnx ở dưới-trái.
b+=path('M28 144H338M177 44V245M124 214L235 68')
b+='<circle cx="177" cy="144" r="36" fill="url(#cau)" stroke="#252440" stroke-width="2.5"/>'
b+=text(177,34,'z')+text(354,152,'y')+text(115,233,'x')+text(190,302,'a)',28)
# b: giữ đầu mũi tên chéo dưới-trái dù chữx nằm trên-phải như nguồn.
b+=path('M457 151H630M544 238V66M615 97L477 203')
b+=arrow('M540 79L544 66L548 79Z')+arrow('M618 147L630 151L618 155Z')+arrow('M485 191L477 203L490 200Z')
b+=path('M544 151C542 131 555 108 571 107C587 102 604 122 590 137C576 148 556 151 544 151Z','white')
b+=path('M544 151C519 149 492 167 491 180C490 197 505 200 516 191C533 180 546 161 544 151Z','url(#thuy)')
b+=text(544,56,'z')+text(642,158,'y')+text(622,102,'x')+text(548,302,'b)',28)
# c: trái trắng/phải tô, không thêm dấu+/− hoặc p_x/p_y.
b+=path('M806 158H985M896 248V70M970 104L828 211')
b+=arrow('M892 83L896 70L900 83Z')+arrow('M973 154L985 158L973 162Z')+arrow('M836 199L828 211L841 208Z')
b+=path('M896 158C879 143 852 133 841 143C832 153 835 172 849 173C866 173 883 163 896 158Z','white')
b+=path('M896 158C914 139 944 128 954 145C961 157 956 171 942 170C919 168 906 162 896 158Z','url(#thuy)')
b+=text(896,59,'z')+text(1000,166,'y')+text(980,109,'x')+text(897,302,'c)',28)
svg=('<svg xmlns="http://www.w3.org/2000/svg" width="1060" height="340" viewBox="0 0 1060 340"><title>Ba hình orbital theo nguồn, giữ nhãn a b c</title>'+b+'</svg>').encode();digest=hashlib.sha256(svg).hexdigest();fn='orbital-khong-gian-'+digest+'.svg';(M/fn).write_bytes(svg)
out=M/'cau-truc-orbital-khong-gian-lo-10-ban-dung.json';r=dict(i=19,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=digest,byteSvg=len(svg),trangThai='cho-soat-doc-lap',nguoiDocNguon='cau_truc_6',ghiChu='a:cầu,khôngarrowhead,x dưới-trái;b:trênphảitrắng/dướitráitô;c:tráitrắng/phảitô;b/carrowchéodướitrái,chữxtrênphải;khôngthêmtênAO/dấuphase.')
if out.exists():
 old=json.loads(out.read_text())[0]
 if old.get('hashSvgDaSoat')==digest and old.get('trangThai')=='da-soat-doc-lap':
  for k in ['trangThai','hashSvgDaSoat','nguoiSoat']:r[k]=old[k]
out.write_text(json.dumps([r],ensure_ascii=False,indent=2));print('Đã dựng nguồn19; chưa tính đạt trước soát độc lập.')
