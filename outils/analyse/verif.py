exec(open('/tmp/rythme/base.py').read())
import json
from scipy.signal import find_peaks
pk,_=find_peaks(onset,height=0.08,distance=int(0.06/FT)); pt=times[pk]
ch=json.load(open('/tmp/rythme/partition.json'))
dev=[]; far=[]
for n in ch:
    d=pt-n['t']; i=np.argmin(np.abs(d))
    if abs(d[i])<0.06: dev.append(d[i]*1000)
    else: far.append(n['t'])
dev=np.array(dev)
print('notes avec attaque audible à ±60 ms :',len(dev),'/',len(ch))
print('écart (ms) médian %.1f, 90%% sous %.1f ms, max %.1f'%(np.median(dev),np.percentile(np.abs(dev),90),np.abs(dev).max()))
print('sans attaque proche :',far)
