# Hifdh Tracker — Design System Reference

## Colors (defined in tailwind.config.js)

```
Primary (Qalam Blue):  bg-primary (#3B8EAD)     — headers, nav, primary buttons
Primary Dark:           bg-primary-dark (#2A6F8A) — pressed states, emphasis
Primary Light:          bg-primary-light (#E6F2F7) — selected highlights, secondary buttons
Primary 50:             bg-primary-50 (#F0F7FA)    — subtle tinted backgrounds
Coral:                  bg-coral (#D46B5A)         — favorites, save actions
Gold (Accent):          bg-accent (#C4983B)        — progress arcs, streaks, celebrations
Gold Light:             bg-accent-light (#F5EDD6)  — subtle accent backgrounds
Background:             bg-offwhite (#F8F8F8)      — screen background
Cards:                  bg-white                    — cards, modals, inputs
Text Primary:           text-charcoal (#2C2C2C)    — body text, headings
Text Secondary:         text-gray-600 (#6B6B6B)    — labels, subtitles
Text Hint:              text-gray-400 (#A0A0A0)    — placeholders, inactive icons
Success:                text-success (#2D7A4F)     — pass, present, very good
Warning:                text-warning (#D4922A)     — late, needs improvement
Error:                  text-error (#C0392B)       — not pass, absent, errors
```

## Typography

```
Screen title:    font-heading text-[24px] text-charcoal        (Playfair Display 700)
Section heading: font-body-semibold text-[18px] text-charcoal  (Source Sans 3 600)
Body text:       font-body text-[15px] text-charcoal           (Source Sans 3 400)
Label/caption:   font-body-medium text-[13px] text-gray-600    (Source Sans 3 500)
Small/hint:      font-body text-[12px] text-gray-400           (Source Sans 3 400)
Arabic text:     font-arabic / font-arabic-bold                (Amiri 400/700)
```

Rules: Never all-caps for Arabic. Use Amiri for all Quranic/Arabic content. Min tappable text: 15px.

## Spacing

```
Screen padding:  px-4 (16px)       Card padding: p-4 (16px)
Card list gap:   gap-3 (12px)      Section gap:  mb-6 (24px)
Input height:    h-12 (48px)       Button height: h-12 (48px)
Tab bar:         h-16 (64px) + safe area inset
```

## Components

**Card:** `bg-white rounded-card p-4` + shadow (`shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2`)

**Buttons:**
- Primary: `bg-primary text-white rounded-button h-12 font-body-semibold`
- Secondary: `bg-primary-light text-primary rounded-button h-12`
- Accent: `bg-coral text-white rounded-button h-12`
- Ghost: `border border-gray-200 text-charcoal rounded-button h-12`

**Input:** `bg-white border border-gray-200 rounded-button h-12 px-4 font-body text-[15px]`
- Focus: `border-primary` with ring
- Label above: `text-gray-600 text-[13px] font-body-medium mb-1`
- Error: `text-error text-[13px] mt-1` + `border-error`

**Status Chips** (all `rounded-chip px-3 py-1 font-body-medium text-[13px]`):
- pass / present / very_good → `bg-success/15 text-success`
- not_pass / absent → `bg-error/15 text-error`
- good → `bg-accent-light text-accent`
- needs_improvement / late / left_early → `bg-warning/15 text-warning`

**Tab Bar:** `bg-white border-t border-gray-100`, active: primary color + dot, inactive: gray-400. Icons: 24px. Labels: `text-[11px]`.

## Islamic Design Touches (use sparingly)

- **Geometric divider:** Thin `gray-200` line with small SVG star/octagon at center. Between major sections.
- **بسم الله header:** `font-arabic text-gray-400 text-[13px]` at top of dashboards. Cultural touch, not UI element.
- **Card ornament:** 3px `LinearGradient` from `primary` → `accent` at top of important cards (daily assignment).
- **Progress arcs:** Gold (`accent`) circular SVG arcs for Juz completion.

**Never:** Heavy patterned backgrounds. Patterns behind text. Gold overuse. Calligraphy for UI labels/buttons.
