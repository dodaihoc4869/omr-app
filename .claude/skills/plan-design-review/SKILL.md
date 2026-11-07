---
name: plan-design-review
description: Chấm điểm 0–10 từng mặt của một thiết kế / bản vẽ (kiến trúc thông tin, trạng thái tương tác, hành trình cảm xúc, nguy cơ "AI slop", khớp hệ thiết kế, đáp ứng khổ + trợ năng, quyết định còn bỏ ngỏ) rồi nêu điều cần để đạt 10. Dùng trước khi build một màn mới hoặc khi soát bản vẽ.
---

# Plan Design Review (rút gọn cho omr-app)

Phương pháp lấy từ `/plan-design-review` của gstack (Garry Tan, giấy phép MIT — xem LICENSE). Bản này CHỈ giữ phương pháp chấm:
đã bỏ phần cài đặt, các lệnh `~/.claude/skills/gstack/bin/*`, telemetry và bộ nhớ học chéo dự án (omr-app không cài gstack).

Luật omr-app vẫn ưu tiên: CLAUDE.md, `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`, quy trình 4 bước (vẽ ảnh Chromium thật → thầy duyệt → build), luật màu, luật tốc độ.

## Cách chấm 0–10
Với mỗi mặt (Pass 1–7 dưới đây):
1. Chấm: «Kiến trúc thông tin: 4/10».
2. Khoảng hở: vì sao là 4, bản 10 trông thế nào.
3. Đề xuất cách sửa cụ thể (+ phương án khác, lý do chọn).
4. Sửa trên bản vẽ, chấm lại; lặp tới 10 hoặc tới khi thầy bảo đủ.
Báo cáo cuối: bảng điểm trước → sau từng mặt + ảnh trước/sau.

## Bảy lượt soát (trích nguyên phương pháp gốc)

**Pass protocol (1-6):** Record the initial 0-10 score. Every `FIX TO 10` below is a proposal: ask about each issue, wait for approval, then edit the plan and re-rate that pass with the reason for the score change. Never edit first and ask afterward.

A declined fix remains documented: the unresolved gap keeps the rating below 10. Carry each pass's before/after scores and remaining gaps into the Completion Summary below. Compute the overall score as specified in the Completion Summary; do not treat litmus answers or Pass 7's decision counts as numeric ratings. Pass 7 is the unscored decision register, not a seventh rating.

A faithful restatement of an existing or already approved contract, such as a wireframe of the unchanged layout, is review evidence rather than a new design choice. Record it directly; ask if producing it would introduce or change a design decision. Finish with the Required Outputs and terminal Plan File Review Report below, including any unanswered decisions.

### Pass 1: Information Architecture
Rate 0-10: Does the plan define what the user sees first, second, third?
FIX TO 10: Add information hierarchy to the plan. Include ASCII diagram of screen/page structure and navigation flow. Apply "constraint worship" — if you can only show 3 things, which 3?
**Persuade plan** (a landing, marketing, pricing, waitlist, campaign or comparison page; the Pass 4 classifier): the plan settles each check below, or the gap is a Pass 1 finding. Ask the user for missing proof and risk terms; never invent them.
1. **One primary action**, named; nothing competes with it above the fold, and the closing CTA repeats it.
2. **Named objections**: the visitor's top objections, each answered where it arises (FAQ of real questions, comparison, guarantee).
3. **Proof beside each claim**: a supplied customer, quote or figure next to the claim it supports, never a metric row; an unsupported claim is cut or marked `[Needs proof: …]`.
4. **A risk reversal** the business really offers (free plan, trial, no card, cancel anytime, refund); never an invented one.
5. **An index/noindex decision**: an ad-only or time-bound page is `noindex`; an indexed one has a real title and description, and its FAQ ships as FAQPage JSON-LD.
**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues, say so and move on. Do NOT proceed until user responds.

### Pass 2: Interaction State Coverage
Rate 0-10: Does the plan specify loading, empty, error, success, partial states?
FIX TO 10: Add interaction state table to the plan:
```
  FEATURE              | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL
  ---------------------|---------|-------|-------|---------|--------
  [each UI feature]    | [spec]  | [spec]| [spec]| [spec]  | [spec]
```
For each state: describe what the user SEES, not backend behavior.
Empty states are features — specify warmth, primary action, context.
**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY.

### Pass 3: User Journey & Emotional Arc
Rate 0-10: Does the plan consider the user's emotional experience?
FIX TO 10: Render the accepted journey as the required storyboard; do not ask whether to create it:
```
  STEP | USER DOES        | USER FEELS      | PLAN SPECIFIES?
  -----|------------------|-----------------|----------------
  1    | Lands on page    | [what emotion?] | [what supports it?]
  ...
```
Apply time-horizon design: 5-sec visceral, 5-min behavioral, 5-year reflective.
**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY.

### Pass 4: AI Slop Risk

**Pass 4 evaluation:** Rate 0-10: Does the plan describe specific, intentional UI, or generic patterns? Record each hard-rejection hit and litmus YES/NO with evidence. An unresolved hard rejection caps this pass below 8 (not design-complete); it does not automatically set the score to 0. Litmus answers support findings, not a separate numeric score.
Use plan text and any available mockups as evidence for the rules below.

#### Design Hard Rules

Review these as UI requirements in the plan, approved mockups, and referenced existing contracts. Inspect pixels or computed values when a rendered surface is available; otherwise assess what the plan specifies and identify concrete gaps.

**Classifier: name the mode before you apply the rules.** The mode is what the visitor's win looks like on THIS surface, not what the product is. A dev tool's landing page is Persuade. A fashion house's docs are Read.
- **PERSUADE** (MARKETING/LANDING PAGE: hero-driven, brand-forward, pricing, campaigns) → they decide and act. Design IS the product. Apply Landing Page Rules.
- **OPERATE** (APP UI: dashboards, admin, settings, editors, tools) → they finish a task. Scanability and native expectations beat expression; the brand lives in the details. Apply App UI Rules.
- **READ** (docs, articles, guides, changelogs) → they understand something. Structure for comprehension, then make staying worth it. Apply Read Rules.
- **EXPERIENCE** (portfolios, galleries, showcases) → they are inside the work. The artifact owns the first viewport; the interface gets out of the way. Apply Experience Rules.
- **HYBRID** (marketing shell with app-like sections) → classify per section, not per page.

**Hard rejection criteria** (instant-fail patterns — flag if ANY apply):
1. Generic SaaS card grid as first impression
2. Beautiful image with weak brand
3. Strong headline with no clear action
4. Busy imagery behind text
5. Sections repeating same mood statement
6. Carousel with no narrative purpose
7. App UI made of stacked cards instead of layout

**Litmus checks** (answer YES/NO for each with evidence; compare with the outside-voice litmus scorecard when available. These support findings, not an additional numeric score):
1. Brand/product unmistakable in first screen?
2. One strong visual anchor present?
3. Page understandable by scanning headlines only?
4. Each section has one job?
5. Are cards actually necessary?
6. Does motion improve hierarchy or atmosphere?
7. Would design feel premium with all decorative shadows removed?

**Landing page rules** (apply when classifier = PERSUADE / MARKETING/LANDING):
- First viewport reads as one composition, not a dashboard
- Brand-first hierarchy: brand > headline > body > CTA
- Typography: expressive, purposeful — no default stacks (Inter, Roboto, Arial, system)
- No flat single-color backgrounds by default: texture from the brand or a real asset, never a halo, spotlight, stripe, or grid-paper gradient (see the AI Slop blacklist and detector rule ids below)
- Hero: full-bleed, edge-to-edge, no inset/tiled/rounded variants
- Hero budget: brand, one headline, one supporting sentence, one CTA group, one image
- No cards in hero. Cards only when card IS the interaction
- One job per section: one purpose, one headline, one short supporting sentence
- Motion: one authored moment on the first viewport (an entrance or a scroll-linked reveal), ease-out from a visible default; hover states only where they carry information
- Color: define CSS variables, avoid purple-on-white defaults, one accent color default
- Copy: product language not design commentary. "If deleting 30% improves it, keep deleting"
- Beautiful defaults: composition-first, brand as loudest text, two text faces max (plus a mono for data and code), cardless by default, first viewport as one composition, not a document (poster in stance, not in type size: display stays under 6rem)

**App UI rules** (apply when classifier = OPERATE / APP UI):
- Calm surface hierarchy, strong typography, few colors
- Dense but readable, minimal chrome
- Organize: primary workspace, navigation, secondary context, one accent
- Avoid: dashboard-card mosaics, thick borders, decorative gradients, ornamental icons
- Copy: utility language — orientation, status, action. Not mood/brand/aspiration
- Cards only when card IS the interaction
- Section headings state what area is or what user can do ("Selected KPIs", "Plan status")

**Read rules** (apply when classifier = READ):
- Measure 65-75ch, one reading column, headings closer to what follows than to what precedes
- Wayfinding is a feature: where am I, what is next, where do I search
- A docs index is Read, not Persuade: no hero, no CTA theater

**Experience rules** (apply when classifier = EXPERIENCE):
- The work fills the first viewport; chrome earns every pixel
- One authored transition, not a scroll-jacked tour
- Never crop the artifact to fit a template

**Universal rules** (apply to ALL types):
- Define CSS variables for color system
- No default font stacks as the display voice (Inter, Roboto, Arial, system); DM Sans, Instrument Sans, IBM Plex Sans are allowed for body/UI on an Operate or Read surface when the proposal explicitly assigns that role
- One job per section
- "If deleting 30% of the copy improves it, keep deleting"
- Cards earn their existence — no decorative card grids
- NEVER use small, low-contrast type (body text < 16px or contrast ratio < 4.5:1 on body text)
- NEVER put labels inside form fields as the only label (placeholder-as-label pattern — labels must be visible when the field has content)
- ALWAYS preserve visited vs unvisited link distinction (visited links must have a different color)
- NEVER float headings between paragraphs (heading must be visually closer to the section it introduces than to the preceding section)

**Reflexes no detector catches** (check by hand, every time):
- **Browser surfaces carry the design.** Selection color, caret, scrollbars, focus rings, underline offset, tabular numerals all ship with browser defaults that belong to no design system. Theme them from the palette. Cheapest tell that a page was designed rather than assembled, and the one models skip most.
- **One authored motion moment.** Not the same entrance on every section, not a hover effect on everything. Exponential ease-out from an already-visible default. Content never hides behind animation timing.
- **Depth has an offset.** Shadows are offset plus soft blur. A zero-offset colored halo is decoration, not depth.
- **Secondary text on a colored surface is tinted from that hue.** Never gray.
- **More space above a heading than below it.** Read the computed values.
- **Light or dark comes from the use scene.** Who, where, under what light: one sentence. Never from the category.

**Calibration: the three looks.** AI-built interfaces land in one of three looks no matter what the product is: (1) cream ground, high-contrast serif display, terracotta or signal-red accent; (2) near-black, one neon accent, glowing edges; (3) broadsheet hairlines, italic display serif, tiny tracked mono labels. Each is fine when the brief asks for it. If the brief left the look open and you lande

**AI Slop blacklist** (the 11 patterns that scream "AI-generated"):
1. Purple/violet/indigo gradient backgrounds or blue-to-purple color schemes
2. **The 3-column feature grid:** icon-in-colored-circle + bold title + 2-line description, repeated 3x symmetrically. THE most recognizable AI layout.
3. Icons in colored circles as section decoration (SaaS starter template look)
4. Centered everything (`text-align: center` on all headings, descriptions, cards)
5. Uniform bubbly border-radius on every element (same large radius on everything)
6. Decorative blobs, floating circles, wavy SVG dividers (if a section feels empty, it needs better content, not decoration)
7. Emoji as design elements (rockets in headings, emoji as bullet points)
8. Colored left-border on cards (`border-left: 3px solid <accent>`)
9. Generic hero copy ("Welcome to [X]", "Unlock the power of...", "Your all-in-one solution for...")
10. Cookie-cutter section rhythm (hero → 3 features → testimonials → pricing → CTA, every section same height)
11. system-ui or `-apple-system` as the PRIMARY display/body font — the "I gave up on typography" signal. Pick a real typeface.

Detector rule ids for the rest of the catalog (a `[rule-id]` in a finding is one of these): border-accent-on-rounded: Border accent on a rounded card; overused-font: Overused display font; flat-type-hierarchy: Flat type hierarchy; gradient-text: Gradient text; cream-palette: Cream default palette; nested-cards: Nested cards; monotonous-spacing: Monotonous spacing; bounce-easing: Bounce easing; pul
Judgment tells with no detector rule: gradient cta button, stock-photo hero, cards as the default component, generic testimonial section, left-text right-image hero, generic cta labels, hero metric template, identical card grids, glassmorphism, hand-drawn svg illustration, modal by default, monospace as costume, content stand-ins, mode picked by category, unthemed browser surfaces, missing states.


FIX TO 10: Rewrite vague UI descriptions with specific alternatives:
- "Cards with icons" → what differentiates these from every SaaS template?
- "Hero section" → what makes this hero feel like THIS product?
- "Clean, modern UI" → meaningless. Replace with actual design decisions.
- "Dashboard with widgets" → what makes this NOT every other dashboard?
- "Trusted by thousands", "99.9% uptime" → on a Persuade plan, supplied proof beside the claim (Pass 1, check 3), or no claim.
If visual mockups were generated in Step 0.5, evaluate them against the AI slop blacklist above. Read each mockup image using the Read tool. Does the mockup fall into generic patterns (3-column grid, centered hero, stock-photo feel)? If so, flag it and offer to regenerate with more specific direction via `$D iterate --feedback "$(cat "$FEEDBACK_FILE")"` (the feedback in a private file, never inlin
**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY.

### Pass 5: Design System Alignment
Rate 0-10: Does the plan align with DESIGN.md?
If DESIGN.md is absent, rate the plan's explicit token and component specifications. Missing specifications remain findings; do not skip the score or assume alignment.
FIX TO 10: If DESIGN.md exists, annotate with specific tokens/components; when it has YAML front matter (the open DESIGN.md format), cite tokens by path (`{colors.primary}`, `{rounded.md}`) so the plan and the file share one vocabulary. If no DESIGN.md, flag the gap and recommend `/design-consultation`.
Flag any new component — does it fit the existing vocabulary?
Before offering a token-alignment fix, check whether an earlier pass already approved that outcome. If so, apply the established tokens and update every stale gap/reference under that decision; changing the plan location or spelling out the same fix is not a new issue. Ask again only if new evidence exposes an unresolved requirement or tradeoff, and name it. An unapproved violation still needs its
**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY.

### Pass 6: Responsive & Accessibility
Rate 0-10: Does the plan specify mobile/tablet, keyboard nav, screen readers?
FIX TO 10: Add responsive specs per viewport — not "stacked on mobile" but intentional layout changes. Add a11y: keyboard nav patterns, ARIA landmarks, touch target sizes (44px min), color contrast requirements.
**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY.

### Pass 7: Unresolved Design Decisions
Start from unresolved choices recorded in earlier passes. For each new item, cite an actual in-scope element and the missing decision in the plan, source, DESIGN.md, or approved mockup. Page/section names and outside-review suggestions do not establish that a control exists. Check the available artifacts first; if its existence is unknown, keep the item conditional and state what must be verified.

Preserve accepted user-facing outcomes. Choosing implementation mechanics does not
reopen them; ask only if a concrete constraint exposes a new design requirement
or tradeoff. Surface the remaining ambiguities that will haunt implementation:
```
  DECISION NEEDED              | IF DEFERRED, WHAT HAPPENS
  -----------------------------|---------------------------
  What does empty state look like? | Engineer ships "No items found."
