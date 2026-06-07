#!/usr/bin/env python3
# Generates VoterIQ Play Store phone screenshots (1080x1920) as SVG.
# Each = marketing caption + device frame + faithful reconstruction of the real screen.
import html

# Per-device geometry. Inner screen content is always authored in a 660x1480
# local box; for tablets we scale that box up and center it on a larger 9:16 canvas.
GEO = {
    "phone": dict(CW=1080, CH=1920, SX=210, SY=336, S=1.0,
                  BZ=(190, 316, 700, 1520, 70), CAP=(150, 58, 214, 30), NOTCH=22),
    "tablet": dict(CW=1620, CH=2880, SX=420, SY=660, S=1.18,
                   BZ=(392, 632, 836, 1802, 84), CAP=(250, 86, 332, 44), NOTCH=28),
}

def esc(s): return html.escape(str(s), quote=True)

def T(x, y, s, size, fill, weight=400, anchor="start", ls=None, italic=False):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    l = f' letter-spacing="{ls}"' if ls is not None else ""
    it = ' font-style="italic"' if italic else ""
    return (f'<text x="{x}" y="{y}" font-family="Helvetica, Arial, sans-serif" '
            f'font-size="{size}" font-weight="{weight}" fill="{fill}"{a}{l}{it}>{esc(s)}</text>')

def rect(x, y, w, h, r, fill, stroke=None, sw=0):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{s}/>'

def line(x1, y1, x2, y2, c, sw=1):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{sw}"/>'

# ---- icons (drawn within ~ a box at top-left tx,ty, ~34px, accent color c) ----
def ic_bars(tx, ty, c):
    return (f'<g fill="{c}">'
            f'<rect x="{tx}" y="{ty+18}" width="8" height="16" rx="2"/>'
            f'<rect x="{tx+12}" y="{ty+8}" width="8" height="26" rx="2"/>'
            f'<rect x="{tx+24}" y="{ty}" width="8" height="34" rx="2"/></g>')

def ic_bell(tx, ty, c):
    return (f'<g fill="none" stroke="{c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="M {tx+4} {ty+26} q 0 -20 13 -20 q 13 0 13 20 l 3 5 h -32 z"/>'
            f'<path d="M {tx+13} {ty+33} q 4 5 8 0"/></g>')

def ic_clip(tx, ty, c):
    return (f'<g fill="none" stroke="{c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'
            f'<rect x="{tx+3}" y="{ty+4}" width="28" height="32" rx="4"/>'
            f'<rect x="{tx+11}" y="{ty}" width="12" height="8" rx="2" fill="{c}"/>'
            f'<path d="M {tx+9} {ty+16} h 16 M {tx+9} {ty+24} h 16"/></g>')

def ic_pin(tx, ty, c):
    return (f'<g fill="{c}">'
            f'<path d="M {tx+17} {ty+2} c -9 0 -15 7 -15 15 c 0 11 15 21 15 21 c 0 0 15 -10 15 -21 c 0 -8 -6 -15 -15 -15 z"/>'
            f'<circle cx="{tx+17}" cy="{ty+17}" r="5.5" fill="#fff"/></g>')

def ic_clock(tx, ty, c):
    return (f'<g fill="none" stroke="{c}" stroke-width="3" stroke-linecap="round">'
            f'<circle cx="{tx+16}" cy="{ty+16}" r="14"/>'
            f'<path d="M {tx+16} {ty+8} v 9 l 6 4"/></g>')

def ic_shield(tx, ty, c):
    return (f'<path d="M {tx+12} {ty+1} l 10 4 v 7 c 0 7 -5 11 -10 13 c -5 -2 -10 -6 -10 -13 v -7 z" '
            f'fill="none" stroke="{c}" stroke-width="2.4" stroke-linejoin="round"/>'
            f'<path d="M {tx+8} {ty+11} l 3 3 6 -6" fill="none" stroke="{c}" stroke-width="2.4" '
            f'stroke-linecap="round" stroke-linejoin="round"/>')

def feature_card(y, accent, iconfn, label, sub):
    out = [rect(20, y, 620, 92, 14, "#ffffff")]
    out.append(f'<path d="M 26 {y} h -6 a0 0 0 0 0 0 0 v 92 h 6 z" fill="{accent}"/>')
    out.append(rect(20, y, 8, 92, 4, accent))  # accent bar
    out.append(rect(40, y+20, 52, 52, 13, accent, ))  # tile (will tint via opacity overlay)
    out.append(f'<rect x="40" y="{y+20}" width="52" height="52" rx="13" fill="#ffffff" fill-opacity="0.80"/>')
    out.append(f'<g transform="translate({40+9},{y+20+9})">{iconfn(0,0,accent)}</g>')
    out.append(T(112, y+42, label, 22, "#0f172a", 700))
    out.append(T(112, y+68, sub, 18, "#64748b"))
    out.append(T(612, y+60, "›", 34, accent, 300, "end"))
    return "".join(out)

def cand_card(y, initial, name, party, bio1, bio2, verified="Verified 6/04/2026"):
    out = [rect(20, y, 620, 158, 14, "#ffffff")]
    out.append(f'<circle cx="68" cy="{y+58}" r="30" fill="#1e3a5f"/>')
    out.append(T(68, y+68, initial, 26, "#ffffff", 700, "middle"))
    out.append(T(118, y+44, name, 23, "#0f172a", 600))
    out.append(T(118, y+72, party, 19, "#64748b"))
    out.append(T(118, y+100, bio1, 18, "#475569"))
    out.append(T(118, y+124, bio2, 18, "#475569"))
    out.append(f'<circle cx="122" cy="{y+144}" r="5" fill="#22c55e"/>')
    out.append(T(136, y+149, verified, 16, "#94a3b8"))
    return "".join(out)

# -------------------- SCREEN CONTENTS (local coords 0..660 x 0..1480) --------------------
def screen_home():
    o = []
    o.append(rect(0, 0, 660, 1480, 0, "#f1f5f9"))
    o.append(rect(0, 0, 660, 322, 0, "#1e3a5f"))
    o.append(T(330, 120, "NONPARTISAN · SOURCED · FREE", 17, "#60a5fa", 800, "middle", 2))
    o.append(T(330, 208, "VoterIQ", 76, "#ffffff", 900, "middle", -1))
    o.append(T(330, 258, "Your complete civic companion", 24, "#93c5fd", 500, "middle"))
    o.append(rect(20, 288, 620, 384, 20, "#ffffff"))
    o.append(T(44, 344, "See Your Exact Ballot", 31, "#0f172a", 800))
    o.append(T(44, 382, "Enter your registered address to get your", 21, "#64748b"))
    o.append(T(44, 410, "personal ballot, candidates & AI research.", 21, "#64748b"))
    o.append(rect(44, 446, 572, 62, 12, "#f8fafc", "#e2e8f0", 1.5))
    o.append(T(64, 485, "123 Main St, Austin, TX 78701", 21, "#94a3b8"))
    o.append(rect(44, 530, 572, 68, 12, "#1e3a5f"))
    o.append(T(330, 573, "View My Ballot   →", 26, "#ffffff", 700, "middle"))
    o.append(line(44, 632, 616, 632, "#eef2f7", 1))
    o.append(ic_pin(44, 644, "#1e3a5f"))
    o.append(T(86, 666, "1600 Pennsylvania Ave NW, Washington DC", 19, "#475569"))
    o.append(T(40, 724, "EXPLORE", 19, "#94a3b8", 800, "start", 1.5))
    o.append(feature_card(744, "#0f766e", ic_bars, "Election Center", "Polls, reps, races & news by state"))
    o.append(feature_card(850, "#b45309", ic_bell, "My Alerts", "Follow politicians & get news alerts"))
    o.append(feature_card(956, "#0891b2", ic_clip, "Register to Vote", "Find your state guide"))
    o.append(feature_card(1062, "#7c3aed", ic_pin, "How to Vote", "Polling place & ID info"))
    o.append(T(330, 1206, "VoterIQ is nonpartisan. All data is sourced", 17, "#94a3b8", 400, "middle"))
    o.append(T(330, 1230, "from official civic databases.", 17, "#94a3b8", 400, "middle"))
    return "".join(o)

def screen_ballot():
    o = []
    o.append(rect(0, 0, 660, 1480, 0, "#f8fafc"))
    o.append(rect(0, 0, 660, 72, 0, "#ffffff"))
    o.append(line(0, 72, 660, 72, "#e2e8f0", 1))
    o.append(ic_pin(20, 18, "#1e3a5f"))
    o.append(T(62, 46, "1600 Pennsylvania Ave NW, Washington DC", 19, "#1e293b"))
    o.append(T(640, 46, "Change", 19, "#2563eb", 600, "end"))
    o.append(T(20, 128, "FEDERAL", 18, "#1e3a5f", 700, "start", 0.8))
    o.append(T(20, 166, "U.S. Senate", 30, "#0f172a", 700))
    o.append(cand_card(186, "J", "Jordan A. Maxwell", "Democratic",
                       "Two-term state senator focused on healthcare",
                       "access and small-business tax relief."))
    o.append(cand_card(360, "P", "Patricia Nguyen", "Republican",
                       "Former city-council member and small-business",
                       "owner; focus on infrastructure and schools."))
    o.append(T(20, 590, "STATE", 18, "#1e3a5f", 700, "start", 0.8))
    o.append(T(20, 628, "Governor", 30, "#0f172a", 700))
    o.append(cand_card(648, "M", "Marcus A. Bell", "Independent",
                       "Engineer and two-term mayor running on",
                       "government transparency and budget reform."))
    o.append(T(20, 880, "LOCAL", 18, "#1e3a5f", 700, "start", 0.8))
    o.append(T(20, 918, "Mayor", 30, "#0f172a", 700))
    o.append(cand_card(938, "D", "Diana Okafor", "Nonpartisan",
                       "Community organizer and former school-board",
                       "chair; focus on housing and public safety."))
    # fade hint at bottom
    o.append(f'<rect x="0" y="1380" width="660" height="100" fill="#f8fafc" fill-opacity="0.6"/>')
    return "".join(o)

def screen_candidate():
    o = []
    o.append(rect(0, 0, 660, 1480, 0, "#f8fafc"))
    o.append(f'<rect x="0" y="0" width="660" height="172" fill="url(#heroGrad)"/>')
    o.append(f'<circle cx="92" cy="172" r="60" fill="#1e3a5f" stroke="#ffffff" stroke-width="6"/>')
    o.append(T(92, 186, "J", 44, "#ffffff", 800, "middle"))
    o.append(T(40, 262, "Jordan A. Maxwell", 32, "#0f172a", 800))
    o.append(T(40, 298, "U.S. Senate · TX", 21, "#64748b"))
    o.append(rect(40, 318, 168, 38, 19, "#dbeafe"))
    o.append(T(124, 344, "Democratic", 19, "#2563eb", 600, "middle"))
    # tabs
    tabs = ["Overview", "Positions", "Compare", "Ask AI"]
    centers = [95, 260, 410, 565]
    for t, cx in zip(tabs, centers):
        active = (t == "Overview")
        o.append(T(cx, 404, t, 20, "#1e3a5f" if active else "#94a3b8", 700 if active else 500, "middle"))
    o.append(rect(60, 418, 70, 4, 2, "#1e3a5f"))
    o.append(line(0, 430, 660, 430, "#e2e8f0", 1))
    o.append(T(40, 478, "Biography", 22, "#0f172a", 700))
    bio = ["Jordan A. Maxwell is a two-term state senator",
           "and former civil-rights attorney. In office,",
           "Maxwell has prioritized expanding healthcare",
           "access, lowering prescription costs, and",
           "protecting voting access across the state."]
    for i, ln in enumerate(bio):
        o.append(T(40, 516 + i*32, ln, 20, "#334155"))
    # on the issues card
    o.append(rect(20, 712, 620, 150, 14, "#ffffff"))
    o.append(T(44, 752, "On the issues", 21, "#0f172a", 700))
    chips = [("Healthcare", "#0f766e"), ("Economy", "#b45309"), ("Education", "#0891b2")]
    cx = 44
    for label, c in chips:
        w = 28 + len(label) * 11
        o.append(rect(cx, 772, w, 40, 20, "#f1f5f9"))
        o.append(T(cx + w/2, 798, label, 18, c, 600, "middle"))
        cx += w + 14
    o.append(T(44, 842, "Sourced from Ballotpedia & VoteSmart · Verified 6/04/2026", 16, "#94a3b8"))
    # ask-ai cta
    o.append(rect(20, 884, 620, 64, 14, "#1e3a5f"))
    o.append(T(330, 924, "Ask the AI guide about Jordan  →", 22, "#ffffff", 700, "middle"))
    return "".join(o)

def screen_chat():
    o = []
    o.append(rect(0, 0, 660, 1480, 0, "#f8fafc"))
    o.append(rect(0, 0, 660, 52, 0, "#e0f2fe"))
    o.append(f'<g transform="translate(214,12)">{ic_shield(0,0,"#0369a1")}</g>')
    o.append(T(348, 34, "Nonpartisan · Sourced · Verified", 19, "#0369a1", 600, "middle"))
    # AI bubble 1
    o.append(rect(20, 84, 560, 168, 16, "#ffffff"))
    o.append(rect(20, 236, 24, 16, 4, "#ffffff"))  # tail-ish
    ai1 = ["Hi! I'm your nonpartisan civic AI guide. Ask",
           "me anything about candidates, elections,",
           "voting procedures, or civic issues. For",
           "ballot-specific results, enter your address."]
    for i, ln in enumerate(ai1):
        o.append(T(42, 124 + i*30, ln, 20, "#1e293b"))
    # user bubble
    o.append(rect(168, 280, 472, 96, 16, "#1e3a5f"))
    o.append(T(616, 318, "What does the Texas Railroad", 20, "#ffffff", 400, "end"))
    o.append(T(616, 350, "Commission actually do?", 20, "#ffffff", 400, "end"))
    # AI bubble 2
    o.append(rect(20, 404, 600, 300, 16, "#ffffff"))
    ai2 = ["Despite its name, the Texas Railroad",
           "Commission doesn't regulate railroads — it",
           "oversees the state's oil and gas industry,",
           "including drilling permits, pipeline safety,",
           "and natural-gas utilities.",
           "",
           "It's led by three statewide-elected",
           "commissioners who serve six-year terms."]
    for i, ln in enumerate(ai2):
        o.append(T(42, 444 + i*31, ln, 20, "#1e293b"))
    # input row
    o.append(rect(0, 1396, 660, 84, 0, "#ffffff"))
    o.append(line(0, 1396, 660, 1396, "#e2e8f0", 1))
    o.append(rect(16, 1414, 560, 52, 26, "#ffffff", "#cbd5e1", 1.5))
    o.append(T(38, 1447, "Ask about a candidate or issue...", 20, "#94a3b8"))
    o.append(f'<circle cx="608" cy="1440" r="26" fill="#1e3a5f"/>')
    o.append(T(608, 1450, "→", 24, "#ffffff", 700, "middle"))
    return "".join(o)

def screen_register():
    o = []
    o.append(rect(0, 0, 660, 1480, 0, "#f8fafc"))
    o.append(rect(0, 0, 660, 150, 0, "#1e3a5f"))
    o.append(T(28, 78, "Register in Texas", 31, "#ffffff", 700))
    o.append(T(28, 118, "Photo ID required to vote", 20, "#93c5fd"))
    # deadlines card
    o.append(rect(16, 176, 628, 196, 14, "#ffffff"))
    o.append(f'<g transform="translate(40,200)">{ic_clock(0,0,"#1e3a5f")}</g>')
    o.append(T(84, 224, "Registration Deadlines", 21, "#1e3a5f", 700))
    rows = [("Online", "Oct 6, 2026"), ("By Mail", "Postmarked Oct 6"), ("In Person", "Oct 6, 2026")]
    for i, (a, b) in enumerate(rows):
        yy = 268 + i*34
        o.append(T(40, yy, a, 19, "#64748b"))
        o.append(T(620, yy, b, 19, "#1e293b", 600, "end"))
        if i < 2:
            o.append(line(40, yy+14, 620, yy+14, "#f1f5f9", 1))
    # how to register
    o.append(rect(16, 396, 628, 268, 14, "#ffffff"))
    o.append(f'<g transform="translate(40,420)">{ic_clip(0,0,"#1e3a5f")}</g>')
    o.append(T(84, 444, "How to Register", 21, "#1e3a5f", 700))
    o.append(rect(40, 470, 580, 80, 8, "#f8fafc"))
    o.append(T(60, 502, "Online (Fastest)", 19, "#1e3a5f", 700))
    o.append(T(60, 532, "Register at the Texas official site  →", 19, "#4f46e5", 600))
    o.append(rect(40, 562, 580, 82, 8, "#f8fafc"))
    o.append(T(60, 594, "By Mail", 19, "#1e3a5f", 700))
    o.append(T(60, 624, "Download the form, complete it, and mail to", 18, "#475569"))
    # buttons
    o.append(rect(16, 688, 628, 64, 12, "#ecfdf5", "#22c55e", 1.5))
    o.append(T(330, 728, "Check if You're Already Registered  →", 19, "#166534", 600, "middle"))
    o.append(rect(16, 768, 628, 64, 12, "#ffffff", "#cbd5e1", 1.5))
    o.append(T(330, 808, "Official Texas Elections Site", 19, "#1e3a5f", 500, "middle"))
    o.append(T(330, 876, "VoterIQ links directly to official government", 17, "#94a3b8", 400, "middle"))
    o.append(T(330, 900, "registration sites. Always verify deadlines.", 17, "#94a3b8", 400, "middle"))
    return "".join(o)

# -------------------- FRAME --------------------
def frame(caption, sub, inner, device="phone"):
    g = GEO[device]
    CW, CH, SX, SY, S = g["CW"], g["CH"], g["SX"], g["SY"], g["S"]
    bx, by, bw, bh, br = g["BZ"]
    cap_y, cap_sz, sub_y, sub_sz = g["CAP"]
    SW, SH, SR = 660*S, 1480*S, 52*S
    return f'''<svg width="{CW}" height="{CH}" viewBox="0 0 {CW} {CH}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="pageGrad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#274b75"/><stop offset="1" stop-color="#11233d"/>
  </linearGradient>
  <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#274b75"/><stop offset="1" stop-color="#1e3a5f"/>
  </linearGradient>
  <clipPath id="screenClip"><rect x="{SX}" y="{SY}" width="{SW}" height="{SH}" rx="{SR}"/></clipPath>
  <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#000000" flood-opacity="0.28"/>
  </filter>
</defs>
<rect width="{CW}" height="{CH}" fill="url(#pageGrad)"/>
<circle cx="{CW*0.89}" cy="{CH*0.06}" r="{CW*0.19}" fill="#ffffff" fill-opacity="0.04"/>
<circle cx="{CW*0.11}" cy="{CH*0.95}" r="{CW*0.17}" fill="#ffffff" fill-opacity="0.04"/>
{T(CW/2, cap_y, caption, cap_sz, "#ffffff", 800, "middle", -1)}
{T(CW/2, sub_y, sub, sub_sz, "#ffd66b", 500, "middle")}
<g filter="url(#ds)">
  <rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="{br}" fill="#0b1828"/>
</g>
<rect x="{SX}" y="{SY}" width="{SW}" height="{SH}" rx="{SR}" fill="#ffffff"/>
<g clip-path="url(#screenClip)"><g transform="translate({SX},{SY}) scale({S})">{inner}</g></g>
<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="{br}" fill="none" stroke="#000000" stroke-opacity="0.25" stroke-width="2"/>
<rect x="{SX+SW/2-70}" y="{by+g['NOTCH']}" width="140" height="10" rx="5" fill="#0b1828"/>
</svg>'''

SCREENS = [
    ("01-home",       "See your exact ballot",        "Type your address — get your personal ballot", screen_home),
    ("02-ballot",     "Your ballot, race by race",    "Every contest, with sourced candidate info",       screen_ballot),
    ("03-candidate",  "Know every candidate",         "Bios, positions & sources for every race",         screen_candidate),
    ("04-chat",       "Ask anything, get real answers","Your nonpartisan AI ballot guide",                screen_chat),
    ("05-register",   "Register & never miss a date",  "Official state deadlines, methods & links",        screen_register),
]

import sys
device = sys.argv[1] if len(sys.argv) > 1 else "phone"
prefix = "shot" if device == "phone" else "tablet"
for slug, cap, sub, fn in SCREENS:
    svg = frame(cap, sub, fn(), device)
    with open(f"/tmp/voteriq-art/{prefix}-{slug}.svg", "w") as f:
        f.write(svg)
    print("wrote", device, slug)
