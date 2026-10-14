# Tebishiro logo pack (for website use)

All SVG files have the lettering converted to shapes, so they look correct without installing any font.

## Files

| Folder | File | Use it for |
|---|---|---|
| logo/ | tebishiro-logo-horizontal.svg | Website header / navbar on light backgrounds |
| logo/ | tebishiro-logo-horizontal-dark.svg | Header on dark backgrounds |
| logo/ | tebishiro-logo-stacked.svg | Hero section, About page, footer (light) |
| logo/ | tebishiro-logo-stacked-dark.svg | Hero / footer on dark backgrounds |
| sub-brands/ | tebishiro-kayaking(-dark).svg | Kayaking booking page and kayaking materials |
| icon/ | tebishiro-icon*.svg | Icon only (no text): social media, app icons, small spaces |
| favicon/ | favicon.svg, favicon-16/32/48.png, apple-touch-icon.png, android-chrome-192/512.png | Browser tab and phone home-screen icons |
| png/ | PNG copies of every logo and icon | Places that don't accept SVG |

## Brand colours

| Name | Hex | Use |
|---|---|---|
| Deep sea blue | #0E3B43 | Main text, dark backgrounds, buttons |
| Coral sun | #E07A5F | Accent, highlights, call-to-action |
| Lagoon teal | #2A9D8F | Secondary accent, links |
| Light teal | #7CC6BC | Accent on dark backgrounds |
| Sand white | #F7F5F0 | Page background |
| Slate | #3E5A5F | Secondary text |

## Font

Jost (free on Google Fonts): https://fonts.google.com/specimen/Jost
Headings: Jost 500, uppercase, wide letter-spacing (about 0.2em). Body text: Jost 400.

## Favicon HTML

```html
<link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png">
```

## Prompt to paste into Claude Code

Copy this folder into your website project (for example as `public/brand/`), then tell Claude Code:

> I've added our brand assets in public/brand/ (see README.md there). Tebishiro is the master brand; Tebishiro Kayaking is our first business. Use logo/tebishiro-logo-horizontal.svg in the site header (the -dark version on dark sections), the stacked logo in the hero and footer, and sub-brands/tebishiro-kayaking.svg on the kayaking page. Set up the favicons from the favicon/ folder. Apply the brand colours and the Jost font from the README as CSS variables across the site. Keep alt text "Tebishiro" on all logos.
