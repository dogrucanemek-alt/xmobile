"""
build_snippet.py
Reads index.html, applies all WP transformations, produces snippet_vXX.php
that directly embeds the HTML — no GH Pages fetch, no transient cache.

Usage: python build_snippet.py <version>
Example: python build_snippet.py 44
"""
import sys, base64, os

VERSION = sys.argv[1] if len(sys.argv) > 1 else '44'
HERE    = os.path.dirname(os.path.abspath(__file__))
INDEX   = os.path.join(HERE, 'index.html')
OUT     = os.environ.get(
    'WP_SNIPPET_OUT',
    rf'C:\Users\emek.dogru\AppData\Local\Temp\wpwork\snippet_v{VERSION}.php'
)
BASE    = 'https://aifurniture.com.tr/wp-content/uploads/2026/05/'

# ── SEO meta block ────────────────────────────────────────────────────────────
SEO = (
    '<meta property="og:type" content="website">'
    '<meta property="og:url" content="https://aifurniture.com.tr/">'
    '<meta property="og:locale" content="tr_TR">'
    '<meta property="og:description" content="AI Furniture - Yapay zeka destekli akilli gardrop.">'
    '<meta name="twitter:card" content="summary_large_image">'
    '<meta name="twitter:title" content="AI Furniture - Wardrobe Intelligence">'
    f'<meta property="og:image" content="{BASE}hero.png">'
    f'<meta name="twitter:image" content="{BASE}hero.png">'
    '<link rel="canonical" href="https://aifurniture.com.tr/">'
)

# ── fv_inject (feature SVGs + mobilya cards) ─────────────────────────────────
FV_B64 = (
    'PHN0eWxlPgouZnZ7d2lkdGg6MTAwJTtoZWlnaHQ6MTIwcHg7bWFyZ2luLWJvdHRvbToyNnB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtvdmVyZmxvdzpoaWRkZW47fQouZnYgc3Zne3dpZHRoOjEwMCU7aGVpZ2h0OjEwMCU7fQoubW9iLWNhcmRze3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjclO3RvcDo1MCU7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoLTUwJSk7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6MTRweDt6LWluZGV4OjEwO30KLm1vYi1jYXJke2JhY2tncm91bmQ6cmdiYSgxMCwxMCwxMCwuNTUpO2JhY2tkcm9wLWZpbHRlcjpibHVyKDE0cHgpOy13ZWJraXQtYmFja2Ryb3AtZmlsdGVyOmJsdXIoMTRweCk7Ym9yZGVyOjFweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LC4xMyk7Ym9yZGVyLXJhZGl1czoxMHB4O3BhZGRpbmc6MTZweCAyMHB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjE2cHg7d2lkdGg6MjIwcHg7dHJhbnNpdGlvbjpiYWNrZ3JvdW5kIC4yMnMsdHJhbnNmb3JtIC4yMnM7b3BhY2l0eTowO30KLm1vYi1jYXJkOmhvdmVye2JhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwuMDkpO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC00cHgpICFpbXBvcnRhbnQ7fQoubW9iLWNhcmQgc3Zne3dpZHRoOjM0cHg7aGVpZ2h0OjM0cHg7ZmxleC1zaHJpbms6MDtzdHJva2U6cmdiYSgyNTUsMjU1LDI1NSwuOCk7ZmlsbDpub25lO3N0cm9rZS13aWR0aDoxLjI7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO30KLm1vYi1jYXJkLW5hbWV7Zm9udC1mYW1pbHk6IkJhcmxvdyBDb25kZW5zZWQiLHNhbnMtc2VyaWY7Zm9udC1zaXplOjEzcHg7Zm9udC13ZWlnaHQ6NjAwO2xldHRlci1zcGFjaW5nOjEuNXB4O3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LC44OCk7fQoubW9iLWNhcmQtdGFne2ZvbnQtc2l6ZTo5cHg7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwuMzUpO2xldHRlci1zcGFjaW5nOjIuNXB4O3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTttYXJnaW4tdG9wOjNweDt9CkBrZXlmcmFtZXMgbW9iSW57ZnJvbXtvcGFjaXR5OjA7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoMzBweCl9dG97b3BhY2l0eToxO3RyYW5zZm9ybTp0cmFuc2xhdGVYKDApfX0KfQo8L3N0eWxlPgo8c2NyaXB0PgooZnVuY3Rpb24oKXsKdmFyIHY9e307CnZbIllhcGF5IFpla2EgTW90b3J1Il09Jzxzdmcgdmlld0JveD0iMCAwIDIwMCAxMTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmUgeDE9IjM1IiB5MT0iMjIiIHgyPSIxMDAiIHkyPSIxNCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LC4xOCkiIHN0cm9rZS13aWR0aD0iLjgiIHN0cm9rZS1kYXNoYXJyYXk9IjUgMyI+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ic3Ryb2tlLWRhc2hvZmZzZXQiIGZyb209IjE2IiB0bz0iMCIgZHVyPSIxLjRzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvbGluZT48bGluZSB4MT0iMzUiIHkxPSIyMiIgeDI9IjEwMCIgeTI9IjM3IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsLjIpIiBzdHJva2Utd2lkdGg9Ii44IiBzdHJva2UtZGFzaGFycmF5PSI1IDMiPjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InN0cm9rZS1kYXNob2Zmc2V0IiBmcm9tPSIxNiIgdG89IjAiIGR1cj0iMS40cyIgYmVnaW49Ii4xNXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9saW5lPjxsaW5lIHgxPSIzNSIgeTE9IjIyIiB4Mj0iMTAwIiB5Mj0iNjAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwuMTMpIiBzdHJva2Utd2lkdGg9Ii44IiBzdHJva2UtZGFzaGFycmF5PSI1IDMiPjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InN0cm9rZS1kYXNob2Zmc2V0IiBmcm9tPSIxNiIgdG89IjAiIGR1cj0iMS40cyIgYmVnaW49Ii4zcyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48L2xpbmU+PGxpbmUgeDE9IjM1IiB5MT0iMjIiIHgyPSIxMDAiIHkyPSI4MyIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LC4wOCkiIHN0cm9rZS13aWR0aD0iLjgiIHN0cm9rZS1kYXNoYXJyYXk9IjUgMyI+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ic3Ryb2tlLWRhc2hvZmZzZXQiIGZyb209IjE2IiB0bz0iMCIgZHVyPSIxLjRzIiBiZWdpbj0iLjQ1cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48L2xpbmU+PGxpbmUgeDE9IjM1IiB5MT0iNTUiIHgyPSIxMDAiIHkyPSIxNCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LC4wOCkiIHN0cm9rZS13aWR0aD0iLjgiIHN0cm9rZS1kYXNoYXJyYXk9IjUgMyI+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ic3Ryb2tlLWRhc2hvZmZzZXQiIGZyb209IjE2IiB0bz0iMCIgZHVyPSIxLjRzIiBiZWdpbj0iLjZzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvbGluZT48bGluZSB4MT0iMzUiIHkxPSI1NSIgeDI9IjEwMCIgeTI9IjM3IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsLjE4KSIgc3Ryb2tlLXdpZHRoPSIuOCIgc3Ryb2tlLWRhc2hhcnJheT0iNSAzIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZnJvbT0iMTYiIHRvPSIwIiBkdXI9IjEuNHMiIGJlZ2luPSIuNzVzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvbGluZT48bGluZSB4MT0iMzUiIHkxPSI1NSIgeDI9IjEwMCIgeTI9IjYwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsLjIyKSIgc3Ryb2tlLXdpZHRoPSIuOCIgc3Ryb2tlLWRhc2hhcnJheT0iNSAzIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZnJvbT0iMTYiIHRvPSIwIiBkdXI9IjEuNHMiIGJlZ2luPSIuOXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9saW5lPjxsaW5lIHgxPSIzNSIgeTE9IjU1IiB4Mj0iMTAwIiB5Mj0iODMiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwuMTQpIiBzdHJva2Utd2lkdGg9Ii44IiBzdHJva2UtZGFzaGFycmF5PSI1IDMiPjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InN0cm9rZS1kYXNob2Zmc2V0IiBmcm9tPSIxNiIgdG89IjAiIGR1cj0iMS40cyIgYmVnaW49IjEuMDVzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvbGluZT48bGluZSB4MT0iMzUiIHkxPSI4OCIgeDI9IjEwMCIgeTI9IjM3IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsLjA4KSIgc3Ryb2tlLXdpZHRoPSIuOCIgc3Ryb2tlLWRhc2hhcnJheT0iNSAzIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZnJvbT0iMTYiIHRvPSIwIiBkdXI9IjEuNHMiIGJlZ2luPSIxLjJzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvbGluZT48bGluZSB4MT0iMzUiIHkxPSI4OCIgeDI9IjEwMCIgeTI9IjYwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsLjE0KSIgc3Ryb2tlLXdpZHRoPSIuOCIgc3Ryb2tlLWRhc2hhcnJheT0iNSAzIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZnJvbT0iMTYiIHRvPSIwIiBkdXI9IjEuNHMiIGJlZ2luPSIxLjM1cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48L2xpbmU+PGxpbmUgeDE9IjM1IiB5MT0iODgiIHgyPSIxMDAiIHkyPSI4MyIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LC4yKSIgc3Ryb2tlLXdpZHRoPSIuOCIgc3Ryb2tlLWRhc2hhcnJheT0iNSAzIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZnJvbT0iMTYiIHRvPSIwIiBkdXI9IjEuNHMiIGJlZ2luPSIxLjVzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvbGluZT48bGluZSB4MT0iMTAwIiB5MT0iMTQiIHgyPSIxNjUiIHkyPSIzMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LC4yKSIgc3Ryb2tlLXdpZHRoPSIuOCIgc3Ryb2tlLWRhc2hhcnJheT0iNSAzIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZnJvbT0iMTYiIHRvPSIwIiBkdXI9IjEuMnMiIGJlZ2luPSIuMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9saW5lPjxsaW5lIHgxPSIxMDAiIHkxPSIzNyIgeDI9IjE2NSIgeTI9IjMwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsLjIyKSIgc3Ryb2tlLXdpZHRoPSIuOCIgc3Ryb2tlLWRhc2hhcnJheT0iNSAzIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZnJvbT0iMTYiIHRvPSIwIiBkdXI9IjEuMnMiIGJlZ2luPSIuM3MiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9saW5lPjxsaW5lIHgxPSIxMDAiIHkxPSI2MCIgeDI9IjE2NSIgeTI9IjMwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsLjE0KSIgc3Ryb2tlLXdpZHRoPSIuOCIgc3Ryb2tlLWRhc2hhcnJheT0iNSAzIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZnJvbT0iMTYiIHRvPSIwIiBkdXI9IjEuMnMiIGJlZ2luPSIuNXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9saW5lPjxsaW5lIHgxPSIxMDAiIHkxPSI4MyIgeDI9IjE2NSIgeTI9IjMwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsLjA4KSIgc3Ryb2tlLXdpZHRoPSIuOCIgc3Ryb2tlLWRhc2hhcnJheT0iNSAzIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZnJvbT0iMTYiIHRvPSIwIiBkdXI9IjEuMnMiIGJlZ2luPSIuN3MiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9saW5lPjxsaW5lIHgxPSIxMDAiIHkxPSIxNCIgeDI9IjE2NSIgeTI9IjgwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsLjA4KSIgc3Ryb2tlLXdpZHRoPSIuOCIgc3Ryb2tlLWRhc2hhcnJheT0iNSAzIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZnJvbT0iMTYiIHRvPSIwIiBkdXI9IjEuMnMiIGJlZ2luPSIuMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9saW5lPjxsaW5lIHgxPSIxMDAiIHkxPSIzNyIgeDI9IjE2NSIgeTI9IjgwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsLjE0KSIgc3Ryb2tlLXdpZHRoPSIuOCIgc3Ryb2tlLWRhc2hhcnJheT0iNSAzIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZnJvbT0iMTYiIHRvPSIwIiBkdXI9IjEuMnMiIGJlZ2luPSIuNHMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9saW5lPjxsaW5lIHgxPSIxMDAiIHkxPSI2MCIgeDI9IjE2NSIgeTI9IjgwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsLjIpIiBzdHJva2Utd2lkdGg9Ii44IiBzdHJva2UtZGFzaGFycmF5PSI1IDMiPjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InN0cm9rZS1kYXNob2Zmc2V0IiBmcm9tPSIxNiIgdG89IjAiIGR1cj0iMS4ycyIgYmVnaW49Ii42cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48L2xpbmU+PGxpbmUgeDE9IjEwMCIgeTE9IjgzIiB4Mj0iMTY1IiB5Mj0iODAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwuMjIpIiBzdHJva2Utd2lkdGg9Ii44IiBzdHJva2UtZGFzaGFycmF5PSI1IDMiPjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InN0cm9rZS1kYXNob2Zmc2V0IiBmcm9tPSIxNiIgdG89IjAiIGR1cj0iMS4ycyIgYmVnaW49Ii44cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48L2xpbmU+PGNpcmNsZSBjeD0iMzUiIGN5PSIyMiIgcj0iNCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwuOSkiPjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9Im9wYWNpdHkiIHZhbHVlcz0iLjI7MTsuMiIgZHVyPSIyLjJzIiBiZWdpbj0iMHMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PGNpcmNsZSBjeD0iMzUiIGN5PSI1NSIgcj0iNCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwuOSkiPjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9Im9wYWNpdHkiIHZhbHVlcz0iLjI7MTsuMiIgZHVyPSIyLjJzIiBiZWdpbj0iLjVzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjM1IiBjeT0iODgiIHI9IjQiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsLjkpIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9Ii4yOzE7LjIiIGR1cj0iMi4ycyIgYmVnaW49IjFzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjE0IiByPSI0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LC45KSI+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgdmFsdWVzPSIuMjsxOy4yIiBkdXI9IjIuMnMiIGJlZ2luPSIuMjVzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjM3IiByPSI0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LC45KSI+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgdmFsdWVzPSIuMjsxOy4yIiBkdXI9IjIuMnMiIGJlZ2luPSIuNnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PGNpcmNsZSBjeD0iMTAwIiBjeT0iNjAiIHI9IjQiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsLjkpIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9Ii4yOzE7LjIiIGR1cj0iMi4ycyIgYmVnaW49IjEuMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PGNpcmNsZSBjeD0iMTAwIiBjeT0iODMiIHI9IjQiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsLjkpIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9Ii4yOzE7LjIiIGR1cj0iMi4ycyIgYmVnaW49Ii4xNXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PGNpcmNsZSBjeD0iMTY1IiBjeT0iMzAiIHI9IjQiIGZpbGw9IndoaXRlIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9Ii4yOzE7LjIiIGR1cj0iMi4ycyIgYmVnaW49Ii40cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJyIiB2YWx1ZXM9IjMuNTs1LjU7My41IiBkdXI9IjIuMnMiIGJlZ2luPSIuNHMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PGNpcmNsZSBjeD0iMTY1IiBjeT0iODAiIHI9IjQiIGZpbGw9IndoaXRlIj48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9Ii4yOzE7LjIiIGR1cj0iMi4ycyIgYmVnaW49Ii45cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJyIiB2YWx1ZXM9IjMuNTs1LjU7My41IiBkdXI9IjIuMnMiIGJlZ2luPSIuOXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+'
)
FV_INJECT = base64.b64decode(FV_B64 + '==').decode('utf-8', errors='replace')

# ── Read & transform ──────────────────────────────────────────────────────────
with open(INDEX, 'r', encoding='utf-8') as f:
    html = f.read()

# SEO
html = html.replace('</title>', '</title>' + SEO, 1)

# Three.js version (last UMD release; 0.161+ dropped three.min.js)
html = html.replace('three@0.148.0', 'three@0.160.0')
html = html.replace('three@0.169.0', 'three@0.160.0')

# Image URLs — WebP first (order matters: replace .webp before .png to avoid double-replace)
html = html.replace('img/hero.webp',            BASE + 'hero.webp')
html = html.replace('img/coming-soon.webp',     BASE + 'coming-soon.webp')
html = html.replace('img/bedroom.webp',         BASE + 'bedroom.webp')
html = html.replace('img/living-room.webp',     BASE + 'living-room.webp')
html = html.replace('img/app-screens.webp',     BASE + 'app-screens.webp')
html = html.replace('img/wardrobe-concept.webp', BASE + 'wardrobe-concept.webp')
html = html.replace('img/wardrobe-wireframe-desktop.webp', BASE + 'wardrobe-wireframe-desktop.webp')
html = html.replace('img/aif-demo.webm', BASE + 'aif-demo.webm')
html = html.replace('img/aif-demo.mp4', BASE + 'aif-demo.mp4')
html = html.replace('img/aif-demo-poster.webp', BASE + 'aif-demo-poster.webp')

# PNG fallback URLs — point to WebP in prod (~97% browser support)
# Old browsers (IE / pre-2020 Android) lose these fallback images; saves multi-MB
# from link previewers/crawlers that scrape <img src> directly.
html = html.replace('https://dogrucanemek-alt.github.io/xmobile/img/hero.png',       BASE + 'hero.webp')
html = html.replace('img/hero.png',         BASE + 'hero.webp')
html = html.replace('https://dogrucanemek-alt.github.io/xmobile/img/coming-soon.png', BASE + 'coming-soon.webp')
html = html.replace('img/coming-soon.png',  BASE + 'coming-soon.webp')
html = html.replace('https://dogrucanemek-alt.github.io/xmobile/img/bedroom.png',     BASE + 'bedroom.webp')
html = html.replace('img/bedroom.png',      BASE + 'bedroom.webp')
html = html.replace('https://dogrucanemek-alt.github.io/xmobile/img/living-room.png', BASE + 'living-room.webp')
html = html.replace('img/living-room.png',  BASE + 'living-room.webp')
html = html.replace('https://dogrucanemek-alt.github.io/xmobile/img/app-screens.png', BASE + 'app-screens.webp')
html = html.replace('img/app-screens.png',  BASE + 'app-screens.webp')
html = html.replace('https://dogrucanemek-alt.github.io/xmobile/img/wardrobe-concept.png', BASE + 'wardrobe-concept.webp')
html = html.replace('img/wardrobe-concept.png', BASE + 'wardrobe-concept.webp')

# fv_inject before </body>
html = html.replace('</body>', FV_INJECT + '</body>', 1)

# ── Sanity checks ─────────────────────────────────────────────────────────────
remaining_gh = html.count('dogrucanemek-alt.github.io')
remaining_img = html.count("'img/") + html.count('"img/')
print(f'Remaining GH Pages refs: {remaining_gh}')
print(f'Remaining relative img/ refs: {remaining_img}')
print(f'canonical: {"canonical" in html}')
print(f'og:type: {"og:type" in html}')
print(f'fv_inject: {".fv{" in html}')

delimiter = 'AIFURNITURE_HTML_END'
if delimiter in html:
    print(f'ERROR: delimiter "{delimiter}" found in HTML — choose a different one!')
    sys.exit(1)

# ── Build PHP snippet ─────────────────────────────────────────────────────────
php = f"""add_action('template_redirect', function() {{
    if (is_front_page()) {{
        status_header(200);
        header('Content-Type: text/html; charset=UTF-8');
        header('X-Content-Type-Options: nosniff');
        echo <<<'{delimiter}'
{html}
{delimiter};
        exit;
    }}
}}, 1);
"""

# Write BOM-free UTF-8
raw = php.encode('utf-8')
with open(OUT, 'wb') as f:
    f.write(raw)

size = os.path.getsize(OUT)
print(f'\nsnippet_v{VERSION}.php yazıldı: {size} bytes ({size/1024:.1f} KB)')
print(f'v{VERSION} count: {raw.count(f"v{VERSION}".encode())}')
