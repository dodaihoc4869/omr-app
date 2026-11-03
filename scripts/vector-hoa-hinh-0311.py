"""Tạo ứng viên vector từ nguồn; KHÔNG tự đánh dấu đạt và KHÔNG tự phát hành.
Cài: python -m pip install pillow numpy vtracer
Chạy: python scripts/vector-hoa-hinh-0311.py
"""
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor, as_completed
import hashlib,json,gzip,os,time
from PIL import Image
import numpy as np
import vtracer
GOC=Path(__file__).resolve().parents[1]
NGUON=GOC/'docs/hinh-vector-0311/nguon'
OUT=GOC/'docs/hinh-vector-0311/ung-vien'
OUT.mkdir(exist_ok=True)
MAU=GOC/'docs/hinh-vector-0311/kiem'
MANUAL=json.loads((MAU/'mau-da-duyet.json').read_text())
# Phân loại thị giác từ contact sheets; giữ ảnh chụp riêng, không giả thành vector.
ANH_CHUP={a['hash'] for a in json.loads((MAU/'phan-loai-nguon.json').read_text())['anhChupAnhGhep']}
D=json.loads((NGUON/'kiem-ke.json').read_text())
ASSETS=sorted(D['assets'],key=lambda a:a['hash'])
def ve(pair):
 i,a=pair;h=a['hash'];out=OUT/(h+'.svg');base={'i':i,'hash':h,'nguon':a['file'],'byteGoc':a['bytes']}
 if h in MANUAL:
  out.write_bytes((MAU/MANUAL[h]).read_bytes());kind='mau-da-duyet'
 elif h in ANH_CHUP:return {**base,'loai':'anh-chup-hoac-anh-ghep','trangThai':'giu-nguon-can-tach-hinh-ve'}
 else:
  try:
   im=Image.open(NGUON/a['file']).convert('RGBA');canvas=Image.new('RGBA',im.size,'white');canvas.alpha_composite(im);im=canvas.convert('RGB')
   if im.width<4 or im.height<4:return {**base,'loai':'nguon-qua-nho','trangThai':'can-kiem-nguon'}
   # Bản nét đen không OCR; vùng xám tô thực sự và hình màu được giữ riêng.
   ar=np.array(im).astype('int16');gray=ar.mean(2)
   mono=((ar.max(2)-ar.min(2))>15).mean()<.0005
   central=gray[1:-1,1:-1];flat=(central>70)&(central<225)
   for yy,xx in [(-1,0),(1,0),(0,-1),(0,1)]:flat &= abs(central-gray[1+yy:gray.shape[0]-1+yy,1+xx:gray.shape[1]-1+xx])<3
   binary=bool(mono and flat.mean()<.002)
   if binary:
    im=im.convert('L').point(lambda p:255 if p>=180 else 0).convert('RGB')
   else:
    # Nền ảnh quét trắng được làm sạch; không dither tạo chấm giả.
    clean=np.array(im);white=(clean.min(2)>=245);clean[white]=255
    im=Image.fromarray(clean).quantize(colors=32,dither=Image.Dither.NONE).convert('RGB')
   temp=OUT/(h+'.png');im.save(temp)
   vtracer.convert_image_to_svg_py(str(temp),str(out),colormode='binary' if binary else 'color',hierarchical='stacked',mode='spline',filter_speckle=0,color_precision=8,layer_difference=8,corner_threshold=60,length_threshold=3.5,max_iterations=10,splice_threshold=45,path_precision=3)
   if binary:
    svg=out.read_text().replace('fill="#000000"','fill="#252440"')
    svg=svg.replace('>', '><rect width="100%" height="100%" fill="white"/>', 1) if False else svg
    # Nền trắng bảo đảm chữ đậm rõ khi app ở chế độ tối.
    at=svg.find('>',svg.find('<svg'))+1;svg=svg[:at]+'<rect width="100%" height="100%" fill="white"/>'+svg[at:]
    out.write_text(svg)
   base['netDonSac']=binary
   temp.unlink();kind='do-net-giu-nguon'
  except Exception as e:return {**base,'loai':'loi','trangThai':'can-sua','loi':str(e)}
 b=out.read_bytes()
 # Tên tài nguyên do nội dung quyết định, không ghi đè URL ảnh gốc bất biến.
 return {**base,'loai':kind,'trangThai':'cho-doi-chieu','svg':out.name,'hashSvg':hashlib.sha256(b).hexdigest(),'byteSvg':len(b),'byteGzip':len(gzip.compress(b,mtime=0))}
if __name__=='__main__':
 results=[];start=time.time()
 with ProcessPoolExecutor(max_workers=4) as pool:
  jobs=[pool.submit(ve,p) for p in enumerate(ASSETS)]
  for j in as_completed(jobs):
   results.append(j.result())
   if len(results)%80==0:print('Đã tạo ứng viên:',len(results),'/',len(ASSETS),'giây',round(time.time()-start),flush=True)
 results.sort(key=lambda a:a['i'])
 (OUT/'ket-qua.json').write_text(json.dumps({'ghiChu':'Ứng viên kỹ thuật chưa xác nhận đạt phong cách mẫu hoặc chính xác từng ký hiệu. Không tự tích hợp ứng viên.', 'assets':results},ensure_ascii=False,indent=2))
 print('Tổng',len(results),'SVG',sum('svg' in r for r in results),'giữ ảnh nguồn',sum(r['loai']=='anh-chup-hoac-anh-ghep' for r in results),flush=True)
