# WCAG contrast check for the palette in src/app/globals.css (MASTER.md §3).
# Palette (23 Oct 2026): Sea Moss #2C5252, Antique Gold #EBDAB0, Alabaster #F4EADE.
# Usage: python3 qa/scripts/contrast.py
def lum(h):
    h=h.lstrip('#'); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in c]
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
def cr(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)
BG,CARD,ELEV,DEEP="#2C5252","#244747","#1D3C3C","#183333"
FG,MUTED,GOLD,GOLD_HI,ON_GOLD="#F4EADE","#C3CEC6","#EBDAB0","#F6EBCF","#1B3434"
pairs=[("Foreground on bg",FG,BG,4.5),("Foreground on card",FG,CARD,4.5),("Foreground on elevated",FG,ELEV,4.5),
("Muted text on bg",MUTED,BG,4.5),("Muted text on card",MUTED,CARD,4.5),("Muted text on elevated",MUTED,ELEV,4.5),
("Gold text on bg",GOLD,BG,4.5),("Gold text on card",GOLD,CARD,4.5),("Gold text on elevated",GOLD,ELEV,4.5),
("Dark text on gold btn",ON_GOLD,GOLD,4.5),("White text on gold btn (reject)","#FFFFFF",GOLD,4.5),
("Dark text on gold hover",ON_GOLD,GOLD_HI,4.5),
("Focus ring vs bg (3:1)",GOLD,BG,3),("Focus ring vs card (3:1)",GOLD,CARD,3),
("Border vs card (decorative)","#4A7372",CARD,1),("Input border vs card (3:1)","#8DAEA8",CARD,3),
("Input border vs elevated (3:1)","#8DAEA8",ELEV,3),
("Error text on bg","#FCA5A5",BG,4.5),("Error text on card","#FCA5A5",CARD,4.5),
("Success text on card","#86EFAC",CARD,4.5),("Warning text on card","#FDBA74",CARD,4.5),
("Info text on card","#A5F3FC",CARD,4.5),
("Logo: Sea Moss on Alabaster",BG,FG,4.5),("Logo: gold on Alabaster (reject)",GOLD,FG,3)]
fails=0
for n,f,b,t in pairs:
    r=cr(f,b); ok=r>=t; fails+=0 if ok or "reject" in n else 1
    print(f"{n:34s} {f} on {b}: {r:5.2f}:1  {'PASS' if ok else 'FAIL'} (need {t})")
print("All pairs pass." if not fails else f"{fails} pair(s) fail.")
