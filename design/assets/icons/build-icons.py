"""Generate the standalone RidePilot SVG icon set. Run from any directory."""

from pathlib import Path
from xml.sax.saxutils import escape


HERE = Path(__file__).resolve().parent
MUTED = "#ADB2AA"
GOLD = "#D2C18F"

# All product icons share a 24 × 24 grid and rounded 1.8 px outline.
# Names describe UI meaning rather than a particular screen so they can be reused.
ICONS = {
    "nav-home": '<path d="m3 10 9-7 9 7v10H3V10Z"/><path d="M9 20v-7h6v7"/>',
    "nav-training": '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="m6 17 4-8 3 8h5l-4-8h-4M14 6h2"/>',
    "nav-nutrition": '<path d="M4 3v7m3-7v7m3-7v7M4 10h6m-3 0v11M17 21V3c3 2 4 5 4 9h-4"/>',
    "nav-coach": '<path d="M12 5c-2-3-6-2-6 1-3 0-4 4-1 6-2 3 0 6 3 6 1 3 4 3 4 0V5Zm0 0c2-3 6-2 6 1 3 0 4 4 1 6 2 3 0 6-3 6-1 3-4 3-4 0V5Z"/><path d="M8 10c2 0 3 1 4 3m4-3c-2 0-3 1-4 3"/>',
    "nav-profile": '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2H4Z"/>',
    "history": '<path d="M3.5 8a8.5 8.5 0 1 1-.2 7"/><path d="M3 3.5V8h4.5M12 7v5l3 2"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "heart-rate": '<path d="M4 14h4l2-6 4 9 2-4h4M3 20h18"/>',
    "weather": '<path d="M7 17h11a3 3 0 0 0 .2-6A5 5 0 0 0 8.6 8.5 4 4 0 0 0 7 17Z"/><path d="M9 20h.01M15 20h.01"/>',
    "calendar": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    "calendar-add": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m6 4v4m-2-2h4"/>',
    "calendar-test": '<path d="M4 7h16M7 4v4m10-4v4M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z"/><path d="m9 15 2 2 4-4"/>',
    "race-flag": '<path d="M5 21V3m1 1c4-2 6 2 10 0v10c-4 2-6-2-10 0"/>',
    "chat": '<path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 10h8m-8 3h5"/>',
    "profile": '<circle cx="12" cy="7" r="3.5"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/>',
    "settings": '<circle cx="12" cy="12" r="3"/><path d="M19.5 13.5a8 8 0 0 0 0-3l2-1.5-2-3.5-2.4.9a8 8 0 0 0-2.6-1.5L14 2h-4l-.5 2.9a8 8 0 0 0-2.6 1.5l-2.4-.9-2 3.5 2 1.5a8 8 0 0 0 0 3l-2 1.5 2 3.5 2.4-.9a8 8 0 0 0 2.6 1.5L10 22h4l.5-2.9a8 8 0 0 0 2.6-1.5l2.4.9 2-3.5-2-1.5Z"/>',
    "body-profile": '<circle cx="12" cy="7" r="3.5"/><path d="M5 21v-1a7 7 0 0 1 14 0v1"/>',
    "meal": '<path d="M4 3v7m3-7v7m3-7v7M4 10h6m-3 0v11M17 21V3c3 2 4 5 4 9h-4"/>',
    "plan-draft": '<path d="M4 5h16v14H4zM8 9h8M8 13h5"/>',
    "records": '<path d="M5 4h14v16H5zM8 8h8m-8 4h8m-8 4h5"/>',
    "privacy": '<path d="m12 3 8 4v5c0 5-3 8-8 9-5-1-8-4-8-9V7l8-4Z"/><path d="M10 12h4m-2-2v4"/>',
    "privacy-verified": '<path d="m12 3 8 4v5c0 5-3 8-8 9-5-1-8-4-8-9V7l8-4Z"/><path d="m9 12 2 2 4-4"/>',
    "device": '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h10m-7 4h4"/>',
    "status-unknown": '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 4.6 1.3c-.5.8-1.6 1.2-2.1 2.1-.2.4-.2.7-.2 1.2M12 17h.01"/>',
    "workout-profile": '<path d="M3 19h18M4 16h4v-5h5v-5h5v10h3"/>',
    "compare": '<path d="M3 5h7v14H3zM14 5h7v14h-7zM11 12h2m-2 0 2-2m-2 2 2 2"/>',
    "time-short": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l-3 2"/>',
    "fatigue": '<path d="M12 3c-2 3-7 6-7 11a7 7 0 0 0 14 0c0-5-5-8-7-11Z"/><path d="M9 15c.5 1.5 1.5 2 3 2"/>',
    "intensity": '<path d="M4 18V7m5 11V5m5 13v-8m5 8V3M3 21h18"/>',
    "more": '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "arrow-right": '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    "arrow-left": '<path d="M20 12H4m6-6-6 6 6 6"/>',
    "plus": '<path d="M12 3v18M3 12h18"/>',
    "minus": '<path d="M3 12h18"/>',
    "check": '<path d="m4 12 5 5L20 6"/>',
    "close": '<path d="M5 5l14 14M19 5 5 19"/>',
    "warning": '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
    "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    "edit": '<path d="M4 20h16M5 16l11-11 3 3-11 11H5v-3ZM14 7l3 3"/>',
    "restore": '<path d="M3 11a9 9 0 1 1 2.4 6.1M3 4v7h7M12 7v5l4 2"/>',
    "save": '<path d="M4 3h14l3 3v15H3V3h1Zm3 0v6h10V3M7 21v-8h10v8"/>',
}


def svg(body: str, color: str) -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" '
        'viewBox="0 0 24 24" fill="none" '
        f'color="{color}" stroke="currentColor" stroke-width="1.8" '
        'stroke-linecap="round" stroke-linejoin="round">'
        f'{body}</svg>\n'
    )


for name, body in ICONS.items():
    (HERE / f"{name}.svg").write_text(svg(body, MUTED), encoding="utf-8")
    if name.startswith("nav-"):
        (HERE / f"{name}-active.svg").write_text(svg(body, GOLD), encoding="utf-8")

# OS status-bar glyphs use their original proportions rather than the product grid.
SYSTEM = {
    "status-signal": ('18', '13', '<path d="M1 10V8m4 2V6m4 4V4m4 6V2"/>'),
    "status-wifi": ('16', '13', '<path d="M1 4c4-4 10-4 14 0M4 7c2-2 6-2 8 0M7 10h2"/>'),
    "status-battery": ('23', '12', '<rect x=".6" y=".6" width="19" height="10.8" rx="2.3"/><rect x="2.5" y="2.5" width="14.8" height="7" rx="1" fill="currentColor" stroke="none"/><path d="M21 4v4"/>'),
}
for name, (width, height, body) in SYSTEM.items():
    content = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" fill="none" color="#EFF0E9" '
        f'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
        f'stroke-linejoin="round">{body}</svg>\n'
    )
    (HERE / f"{name}.svg").write_text(content, encoding="utf-8")


groups = {
    "五栏导航": ["nav-home", "nav-training", "nav-nutrition", "nav-coach", "nav-profile"],
    "训练与 AI 调整": ["history", "clock", "heart-rate", "weather", "calendar", "calendar-add", "calendar-test", "race-flag", "workout-profile", "compare", "time-short", "fatigue", "intensity", "restore", "save"],
    "饮食与档案": ["meal", "chat", "profile", "settings", "body-profile", "plan-draft", "records", "privacy", "privacy-verified", "device", "status-unknown"],
    "通用操作与反馈": ["more", "chevron-left", "chevron-right", "arrow-left", "arrow-right", "plus", "minus", "check", "close", "warning", "info", "edit"],
    "系统状态栏": list(SYSTEM),
}
parts = [
    '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>RidePilot 图标预览</title><style>:root{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;color:#eff0e9;background:#0d0f0e}body{max-width:1060px;margin:0 auto;padding:32px 20px 64px}h1{font-size:28px}h2{font-size:18px;margin:34px 0 14px;color:#d2c18f}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px}.item{background:#191c1a;border:1px solid #313731;border-radius:14px;padding:16px;min-height:75px;display:flex;align-items:center;gap:12px}.item img{flex:none;width:24px;height:24px}.item span{font-size:11px;color:#adb2aa;overflow-wrap:anywhere}.note{font-size:13px;color:#adb2aa}</style>',
    '<h1>RidePilot SVG 图标</h1><p class="note">24 × 24 pt · 1.8 pt 圆角描边 · 五栏含金色选中态；图表按数据实时绘制，不属于图标资产。</p>',
]
for title, names in groups.items():
    parts.append(f'<h2>{escape(title)}</h2><div class="grid">')
    for name in names:
        choices = [name, name + "-active"] if name.startswith("nav-") else [name]
        for choice in choices:
            parts.append(f'<div class="item"><img src="{choice}.svg" alt=""><span>{choice}.svg</span></div>')
    parts.append('</div>')
parts.append('</html>')
(HERE / "index.html").write_text("\n".join(parts), encoding="utf-8")
print(f"Generated {len(ICONS) + 5 + len(SYSTEM)} SVG icons")
