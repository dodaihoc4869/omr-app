"""So hình học và các dấu nhỏ với nguồn; kết quả không thay cho duyệt chuyên môn/phong cách."""
from PIL import Image
from pathlib import Path
from scipy import ndimage
from concurrent.futures import ProcessPoolExecutor,as_completed
import numpy as np,json
G=Path(__file__).resolve().parents[1]
S=G/'docs/hinh-vector-0311/nguon';O=G/'docs/hinh-vector-0311/ung-vien';R=Path('/workspace/scratch/vector-render')
D=json.loads((O/'ket-qua.json').read_text())
def kiem(a):
 if 'svg'not in a:return a
 if a['loai']=='mau-da-duyet':return {**a,'kiemNet':'mau-da-doi-chieu-rieng'}
 try:
  src=np.array(Image.open(S/a['nguon']).convert('RGB'));dst=np.array(Image.open(R/(a['hash']+'.png')).convert('RGB'))
  if src.shape!=dst.shape:return {**a,'kiemNet':'loi-kich-thuoc'}
  # Dấu tối, kể cả dấu thập phân/chỉ số, phải còn tại vị trí gốc.
  sm=src.mean(2)<180;dm=dst.mean(2)<180
  ds=ndimage.binary_dilation(sm,iterations=1);dd=ndimage.binary_dilation(dm,iterations=1)
  missing=int((sm&~dd).sum());extra=int((dm&~ds).sum())
  labels,n=ndimage.label(sm);sizes=np.bincount(labels.ravel());hit=np.bincount(labels.ravel(),weights=dd.ravel(),minlength=n+1)
  lost=int(((sizes[1:]>=2)&(hit[1:]==0)).sum())
  # Phát hiện đường xám/màu nhạt bị mất do phân ngưỡng.
  light=src.min(2)<230;labs,nn=ndimage.label(light);sz=np.bincount(labs.ravel());got=np.bincount(labs.ravel(),weights=ndimage.binary_dilation(dst.min(2)<240,iterations=1).ravel(),minlength=nn+1)
  lost_light=int(((sz[1:]>=6)&(got[1:]==0)).sum())
  ratio=(missing+extra)/max(1,int(sm.sum()))
  status='qua-cong-hinh-hoc'if lost==0 and lost_light==0 and ratio<.003 else 'can-soat-net'
  return {**a,'kiemNet':status,'doNet':{'matPixelNgoai1px':missing,'themPixelNgoai1px':extra,'tiLeSaiNet':round(ratio,6),'matThanhPhanToi':lost,'matThanhPhanNhat':lost_light}}
 except Exception as e:return {**a,'kiemNet':'loi-kiem','loi':str(e)}
if __name__=='__main__':
 results=[]
 with ProcessPoolExecutor(max_workers=4)as pool:
  for x in pool.map(kiem,D['assets'],chunksize=4):results.append(x)
 (O/'kiem-net.json').write_text(json.dumps({'ghiChu':'Qua cổng hình học không có nghĩa đã đúng phong cách hoặc đã xác minh từng ký hiệu hóa học; chưa tự tích hợp.', 'assets':results},ensure_ascii=False,indent=2))
 from collections import Counter
 print(Counter(a.get('kiemNet',a['trangThai']) for a in results))
