# IdleMates Design System Architecture

## Executive Summary
Complete UI/UX revamp to minimal, modern, high-contrast dark-first design system. Brand color (#8A5CFF) derived from logo.svg. Full light/dark theme parity with class-based switching.

## Color Token System

### Brand Colors
```css
--accent: 138 92 255;           /* #8A5CFF - Primary brand purple */
--accent-hover: 156 117 255;    /* #9C75FF - Hover state */
--accent-pressed: 116 69 255;   /* #7445FF - Active/pressed */
--accent-foreground: 255 255 255; /* White text on accent */
```

### Dark Theme (Default)
```css
--bg: 11 15 20;                 /* #0B0F14 - Base background */
--bg-subtle: 15 20 26;          /* #0F141A - Subtle bg variation */
--bg-muted: 20 26 34;           /* #141A22 - Muted bg */

--surface: 23 28 36;            /* #171C24 - Card/elevated surface */
--surface-2: 30 36 46;          /* #1E242E - Secondary surface */
--surface-3: 37 44 56;          /* #252C38 - Tertiary surface */

--overlay: 0 0 0 / 0.7;         /* Modal overlays */
--overlay-hover: 255 255 255 / 0.05; /* Subtle hover overlays */

--border: 255 255 255 / 0.1;    /* Default borders */
--border-hover: 255 255 255 / 0.2; /* Hover borders */
--border-focus: 138 92 255 / 0.5; /* Focus ring */

--text: 232 233 237;            /* #E8E9ED - Primary text */
--text-muted: 158 160 172;      /* #9EA0AC - Secondary text */
--text-disabled: 93 100 112;    /* #5D6470 - Disabled text */
```

### Light Theme
```css
--bg: 248 250 252;              /* #F8FAFC - gray-50 */
--bg-subtle: 241 245 249;       /* #F1F5F9 - gray-100 */
--bg-muted: 226 232 240;        /* #E2E8F0 - gray-200 */

--surface: 255 255 255;         /* #FFFFFF - white */
--surface-2: 248 250 252;       /* #F8FAFC - gray-50 */
--surface-3: 241 245 249;       /* #F1F5F9 - gray-100 */

--text: 15 23 42;               /* #0F172A - slate-900 */
--text-muted: 71 85 105;        /* #475569 - slate-600 */
--text-disabled: 148 163 184;   /* #94A3B8 - slate-400 */

--border: 226 232 240;          /* #E2E8F0 */
--border-hover: 203 213 225;    /* #CBD5E1 */
```

### Semantic Colors
```css
--success: 74 222 128;          /* #4ADE80 - green-400 */
--warning: 251 191 36;          /* #FBBF24 - yellow-400 */
--danger: 239 68 68;            /* #EF4444 - red-500 */
```

## Typography Scale

### Font Family
```css
--font-br-shape: 'BR Shape', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Type Scale
- **Display**: 4rem / 3rem (64px/48px) - Hero headings
- **Heading 1**: 2.25rem (36px) - Page titles
- **Heading 2**: 1.875rem (30px) - Section headings
- **Heading 3**: 1.5rem (24px) - Subsection headings
- **Heading 4**: 1.25rem (20px) - Card headings
- **Body Large**: 1.125rem (18px) - Emphasized body
- **Body**: 1rem (16px) - Default body text
- **Body Small**: 0.875rem (14px) - Secondary text
- **Caption**: 0.75rem (12px) - Labels, captions

### Weights
- Regular: 400
- Medium: 500
- Semibold: 600

## Spacing Scale
Based on 4px base unit:
- xs: 0.5rem (8px)
- sm: 0.75rem (12px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)
- 3xl: 4rem (64px)
- 4xl: 6rem (96px)

## Border Radius Scale
- sm: 0.5rem (8px)
- md: 0.75rem (12px)
- lg: 1rem (16px)
- xl: 1.25rem (20px)
- 2xl: 1.5rem (24px)
- full: 9999px

## Shadow Scale
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-accent: 0 0 20px 5px rgb(var(--accent) / 0.25);
```

## Component Inventory

### Primitives (Phase 1)
- [x] Button (primary, secondary, subtle, destructive, ghost, icon-only)
- [x] Input (text, email, password, search)
- [ ] Select
- [ ] Textarea
- [ ] Switch/Toggle
- [ ] Checkbox
- [ ] Radio
- [x] Badge
- [x] Card
- [ ] Tooltip
- [ ] Dialog/Modal
- [ ] Toast
- [ ] Tabs
- [ ] Dropdown Menu

### Layout Components (Phase 2)
- [x] Header (with theme toggle)
- [x] Footer
- [x] Sidebar (dashboard)
- [x] MobileNav
- [ ] Container
- [ ] Stack
- [ ] Grid

### Feature Components (Phase 3)
- [x] FloatingGames
- [x] ChatHistory
- [x] SubscriptionWidget
- [x] AnnouncementBar
- [x] DashboardLayout
- [ ] PricingCard
- [ ] StatCard
- [ ] SessionCard
- [ ] GameCard

### Pages to Migrate (Phase 4)
- [x] Home (/)
- [ ] Pricing (/pricing)
- [ ] FAQ (/faq)
- [ ] Dashboard (/app/dashboard)
- [ ] Billing (/app/billing)
- [ ] Auth (login/register)
- [ ] Legal (TOS/Privacy)
- [ ] Admin pages

## Motion Standards

### Transition Durations
```css
--transition-fast: 100ms;
--transition-base: 150ms;
--transition-slow: 250ms;
```

### Timing Functions
- Default: ease-out
- Bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
- Smooth: cubic-bezier(0.4, 0, 0.2, 1)

### Respect Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Accessibility Requirements

### Contrast Ratios (WCAG AA)
- Normal text: ≥ 4.5:1
- Large text: ≥ 3:1
- Interactive elements: ≥ 3:1

### Focus Indicators
All interactive elements must have visible focus ring using `--border-focus` color.

### ARIA Requirements
- aria-current on active navigation links
- aria-label on icon-only buttons
- aria-expanded on toggles
- aria-describedby for form errors

## Implementation Phases

### Phase 1: Foundation ✓
- [x] Theme tokens in globals.css
- [x] Tailwind config update
- [x] ThemeProvider component
- [x] Theme toggle component
- [x] Logo components (Mark & Wordmark)
- [x] FOUC prevention

### Phase 2: Primitive Components
- [ ] Button system (all variants)
- [ ] Form inputs (Input, Select, Textarea)
- [ ] Form controls (Switch, Checkbox, Radio)
- [ ] Feedback (Badge, Toast, Dialog)
- [ ] Navigation (Tabs, Dropdown)

### Phase 3: Layout Migration
- [ ] Refactor Header
- [ ] Refactor Footer
- [ ] Refactor Sidebar
- [ ] Refactor MobileNav
- [ ] Update containers & grids

### Phase 4: Feature Components
- [ ] Pricing cards
- [ ] Dashboard widgets
- [ ] Game cards
- [ ] Session management
- [ ] Chat interface

### Phase 5: Page Migration
- [ ] Homepage
- [ ] Pricing page
- [ ] Dashboard
- [ ] Billing
- [ ] Auth flows
- [ ] Admin panel

### Phase 6: Polish & Audit
- [ ] Remove dead CSS
- [ ] ESLint a11y rules
- [ ] Contrast audit
- [ ] Performance audit
- [ ] Visual regression tests

## Breaking Changes
None expected - all changes are additive or cosmetic.

## Migration Report Format
```
Changed Files: X
New Components: Y
Removed Classes: Z
Token Coverage: N%
Accessibility Score: Pass/Fail
Performance Impact: +/-N%
```
