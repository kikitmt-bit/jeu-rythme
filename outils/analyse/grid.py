exec(open('/tmp/rythme/base.py').read())
fr=np.arange(len(onset))
def score(bpm,ph):
    P=60/bpm; t=np.arange(ph,times[-1],P)
    return np.interp(t,times,onset).sum()
best=(0,0,0)
for bpm in np.arange(155.5,157.5,0.01):
    P=60/bpm
    for ph in np.arange(0,P,0.004):
        v=score(bpm,ph)
        if v>best[0]: best=(v,bpm,ph)
print('best',best)
v,bpm,ph=best; P=60/bpm
# force a sous-divisions
for sub,name in [(0.5,'half-beat'),(0.25,'quarter')]:
    t=np.arange(ph+P*sub,times[-1],P)
    print(name, np.interp(t,times,onset).mean(), 'vs on-beat', np.interp(np.arange(ph,times[-1],P),times,onset).mean())
# premier temps fort
t=np.arange(ph,times[-1],P)
o=np.interp(t,times,onset)
print('first beats',np.round(t[:8],3), np.round(o[:8],2))
np.save('/tmp/rythme/grid.npy',np.array([bpm,ph]))
