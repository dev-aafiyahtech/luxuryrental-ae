def lum(h):
    h=h.lstrip('#'); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in c]
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
def cr(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)
pairs=[("Foreground on bg","#FAFAF9","#0C0A09",4.5),("Foreground on card","#FAFAF9","#1C1917",4.5),
("Muted text on bg","#A8A29E","#0C0A09",4.5),("Muted text on card","#A8A29E","#1C1917",4.5),
("Muted text on elevated","#A8A29E","#292524",4.5),
("Gold text on bg","#CA8A04","#0C0A09",4.5),("Gold text on card","#CA8A04","#1C1917",4.5),
("Dark text on gold btn","#0C0A09","#CA8A04",4.5),("White text on gold btn (reject)","#FFFFFF","#CA8A04",4.5),
("Dark text on gold hover","#0C0A09","#EAB308",4.5),
("Focus ring vs bg (3:1)","#EAB308","#0C0A09",3),("Focus ring vs card (3:1)","#EAB308","#1C1917",3),
("Border vs card (decorative)","#44403C","#1C1917",1),("Input border vs card (3:1)","#78716C","#1C1917",3),
("Error text on bg","#F87171","#0C0A09",4.5),("Error text on card","#F87171","#1C1917",4.5),
("Success text on card","#4ADE80","#1C1917",4.5)]
for n,f,b,t in pairs:
    r=cr(f,b); print(f"{n:34s} {f} on {b}: {r:5.2f}:1  {'PASS' if r>=t else 'FAIL'} (need {t})")
