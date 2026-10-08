"""Build the five-tab preview from the preserved standalone screen designs."""

from pathlib import Path
import re


HERE = Path(__file__).resolve().parent
SCREENS = [
    ("home", "首页", "H01-home.html"),
    ("training", "训练", "T01-training.html"),
    ("nutrition", "饮食", "N01-nutrition.html"),
    ("coach", "AI 教练", "A01-ai-coach.html"),
    ("profile", "我的", "M01-profile.html"),
]
OUTPUT = HERE / "five-tabs-prototype.html"


def part(source: str, tag: str) -> str:
    match = re.search(rf"<{tag}(?:\s[^>]*)?>(.*?)</{tag}>", source, re.S | re.I)
    if not match:
        raise ValueError(f"Missing <{tag}> in standalone design")
    return match.group(1).strip()


templates = []
for key, label, filename in SCREENS:
    source = (HERE / filename).read_text(encoding="utf-8")
    # Standalone pages set their default text color on <body>. Inside Shadow DOM
    # there is no body element, so the host must provide that inherited color.
    css = part(source, "style").replace(":root{", ":host{color:var(--text);", 1)
    body = part(source, "body")
    if "</template>" in css or "</template>" in body:
        raise ValueError(f"Unexpected template closing tag in {filename}")
    templates.append(
        f'<template id="screen-{key}" data-label="{label}">\n'
        f"<style>{css}</style>\n{body}\n</template>"
    )


page = """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>五栏联动原型 · 首页</title>
  <style>
    html,body{margin:0;min-height:100%;background:#0d0f0e}
    #app{min-height:100vh}
    .screen-host[hidden]{display:none}
  </style>
</head>
<body>
<div id="app"></div>
<!-- Each template is copied from its standalone design, with its styles isolated by Shadow DOM. -->
__TEMPLATES__
<script>
  const screens = [
    {id:'home',label:'首页'},
    {id:'training',label:'训练'},
    {id:'nutrition',label:'饮食'},
    {id:'coach',label:'AI 教练'},
    {id:'profile',label:'我的'}
  ];
  const app = document.getElementById('app');
  const hosts = screens.map((screen, index) => {
    const host = document.createElement('section');
    host.className = 'screen-host';
    host.hidden = index !== 0;
    host.setAttribute('aria-label', screen.label + '页面');
    const root = host.attachShadow({mode:'open'});
    root.append(document.getElementById('screen-' + screen.id).content.cloneNode(true));
    root.querySelectorAll('.tabbar .tab').forEach((button, targetIndex) => {
      button.addEventListener('click', () => show(targetIndex, true));
    });
    app.append(host);
    return {host, root};
  });

  function show(index, changeHash) {
    if (index < 0 || index >= screens.length) return;
    hosts.forEach(({host}, hostIndex) => { host.hidden = hostIndex !== index; });
    document.title = '五栏联动原型 · ' + screens[index].label;
    if (changeHash && location.hash !== '#' + screens[index].id) {
      location.hash = screens[index].id;
    }
  }

  function linkToTab(root, selector, index, all = false) {
    const elements = all ? [...root.querySelectorAll(selector)] : [root.querySelector(selector)];
    elements.filter(Boolean).forEach(element => {
      element.style.cursor = 'pointer';
      if (element.tagName !== 'BUTTON') {
        element.setAttribute('role', 'button');
        element.setAttribute('tabindex', '0');
        element.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            show(index, true);
          }
        });
      }
      element.addEventListener('click', () => show(index, true));
    });
  }

  // Cross-tab shortcuts connect existing page sections; deeper flows remain in the handoff specs.
  linkToTab(hosts[0].root, '.top .round-button', 4);
  linkToTab(hosts[0].root, '.section-title button', 2);
  linkToTab(hosts[0].root, '.draft', 3);
  linkToTab(hosts[2].root, '.training-strip', 1);
  linkToTab(hosts[2].root, '.top .round-button', 4);
  linkToTab(hosts[3].root, '.context', 1);
  linkToTab(hosts[3].root, '.more', 2);

  function showFromHash() {
    const index = screens.findIndex(screen => '#' + screen.id === location.hash);
    show(index < 0 ? 0 : index, false);
  }
  addEventListener('hashchange', showFromHash);
  showFromHash();
</script>
</body>
</html>
""".replace("__TEMPLATES__", "\n".join(templates))

OUTPUT.write_text(page, encoding="utf-8")
print(f"Built {OUTPUT.name} from {len(SCREENS)} preserved screens")
