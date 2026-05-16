# CLAUDE.md — xmobile Project Rules

## Behavioral Guardrails (Karpathy-distilled)

- **Think before coding.** Sur surface assumptions, flag tradeoffs, ask if ambiguous. Don't pick silently between interpretations.
- **Simplicity first.** Minimum code that solves the problem. No speculative features, no premature abstractions, no error handling for impossible scenarios.
- **Surgical changes.** Touch only what the request requires. Don't "improve" adjacent code, don't refactor unbroken code, don't reformat. Match existing style.
- **Goal-driven execution.** Translate vague tasks into verifiable success criteria. "Make it work" is weak — write the test or check that proves done.

## Frontend Website (docs/index.html, docs/concept.html)

### Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

### Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

### Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.
- **aifurniture.com.tr brand colors:** Gold `#c9a227` (or `rgba(202,138,4,x)`), Background `#060606`, Text white.
- **Taste references:** When the user says "X gibi olsun / X tarzında yap" (e.g. "Stripe gibi", "Apple gibi"), read `brand_assets/design-references/<brand>/DESIGN.md` first. 54 brands available (apple, stripe, linear, vercel, notion, claude, cal, cursor, spotify, webflow, spacex, supabase, etc). Each file has typography, color, spacing, animation philosophy with exact values.

### Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

### Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

### Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color

---

## WordPress / aifurniture.com.tr Deploy Pipeline

- Source: `docs/index.html`
- Build: `python docs/build_snippet.py <version>` (output → `%TEMP%\wpwork\snippet_v<version>.php`)
- Deploy: `python C:\Users\emek.dogru\AppData\Local\Temp\wpwork\save_v<version>.py` (kept out of repo — contains session cookies)
- WPCode snippet ID: 76
- If session expired: `python C:\Users\emek.dogru\AppData\Local\Temp\wpwork\relogin.py` önce çalıştır
- GitHub Pages: `https://dogrucanemek-alt.github.io/xmobile/` (docs/ klasöründen serve edilir)

---

## Skill Routing

When the user's request matches an available skill, invoke it via the Skill tool.

- Frontend/UI design → invoke `frontend-design`
- CRO / conversion → invoke `page-cro`
- SEO → invoke `seo-audit`
- Image generation → invoke `image`
- UI/UX review → invoke `ui-ux-pro-max`
- Browse/screenshot → invoke `browse`
