"""Partition v2 de Great Fairy's Fountain : on suit la pulsation de la harpe.
Chaque groupe = 4 demi-temps (0,77 s) : position 0 = note de mélodie (accent), 1-3 = cascade qui descend.
Codes : b  = pulsation (mélodie en pos 0 + note plus grave en pos 2)
        b0 = mélodie seule
        c  = cascade complète (4 notes, de la piste du haut vers celle du bas)
        H  = tenir la mélodie jusqu'à la frappe suivante (pos 0 du groupe d'après) ; le groupe d'après commence par x
        Ht = tenir la mélodie jusqu'au groupe suivant ET taper la pos 2 avec l'autre pouce
        x  = seulement la pos 2 (le groupe où l'on vient de lâcher)
        D  = note double (mélodie + basse, les deux mains de la harpe) + pos 2
        S:dir = glissé sur la mélodie + pos 2
        F  = note tenue finale (dans le fondu)
"""
import json, numpy as np
bpm,ph=np.load('/tmp/rythme/grid.npy'); HB=60/bpm/2
T=lambda k: round(float(ph+k*HB),4)
A=[93,91,90,91, 91,89,88,89, 89,88,87,88, 88,86,85,86]
B=[93,91,90,91, 94,93,92,93, 96,94,93,94, 93,91,89,88]
lm=lambda m: 1 if m<=86 else 2 if m<=89 else 3
SECTIONS=[
 ('A1',20,A,"b b b H | x b b H | x b b H | x b b S:u"),
 ('B1',84,B,"D b c b | S:ur b c b | S:u b c b | b b b H"),
 ('A2',148,A,"x b Ht x | b c Ht x | D b Ht x | c c c S:u"),
 ('B2',212,B,"D c b c | D b c b | D c c c | b Ht x H"),
 ('A3',276,A,"x b b H | x b b H | x b0 b H | x F - -"),
]
notes=[];paire=0
def add(**n): notes.append(n)
# intro : on suit les scintillements de harpe (rythme libre), qui montent
for t,l in [(1.207,0),(1.37,1),(1.939,2),(2.844,1),(3.007,2),(3.309,3),(3.738,2)]: add(type='tap',t=t,lane=l)
for name,base,mel,plan in SECTIONS:
    codes=plan.replace('|',' ').split(); assert len(codes)==16,name
    for g,c in enumerate(codes):
        k=base+4*g; L=lm(mel[g]); op=c.split(':')[0]
        if op in('b','b0'): add(type='tap',t=T(k),lane=L)
        if op in('b','S','D','Ht','x'): add(type='tap',t=T(k+2),lane=L-1)
        if op=='c':
            for j,l in enumerate([3,2,1,0]): add(type='tap',t=T(k+j),lane=l)
        if op in('H','Ht'): add(type='hold',t=T(k),end=T(k+4),lane=L)
        if op=='F': add(type='hold',t=T(k),end=T(k+10),lane=L)
        if op=='S': add(type='swipe',t=T(k),lane=L,dir=c.split(':')[1])
        if op=='D':
            add(type='tap',t=T(k),lane=0,paire=paire); add(type='tap',t=T(k),lane=max(L,2),paire=paire); paire+=1
notes.sort(key=lambda n:(n['t'],n['lane']))
# contrôles : pas deux notes au même moment hors doubles, écart mini d'un demi-temps, rien qui démarre pile à la fin d'une tenue
pb=[]
for a,b in zip(notes,notes[1:]):
    if b['t']-a['t']<HB-0.01 and not ('paire' in a and a.get('paire')==b.get('paire')): pb.append((a,b))
for h in [n for n in notes if n['type']=='hold']:
    for n in notes:
        if n is not h and abs(n['t']-h['end'])<0.05: pb.append(('fin de tenue',h['t'],n['t']))
print('problèmes',pb)
juge=sum(2 if n['type']=='hold' else 1 for n in notes)
print('notes',len(notes),'jugements',juge)
from collections import Counter
for name,base,_,_ in SECTIONS:
    t0,t1=T(base)-0.05,T(base+64)-0.05
    sel=[n for n in notes if t0<=n['t']<t1]
    print(f"{name} {len(sel):3d} notes  {len(sel)/(t1-t0):.2f}/s ",dict(Counter(n['type']+('2' if 'paire' in n else '') for n in sel)))
json.dump(notes,open('/tmp/rythme/partition.json','w'))
