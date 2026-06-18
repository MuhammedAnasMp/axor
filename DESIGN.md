---
name: Systematic Integrity
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#FFFFFF'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#414754'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#727785'
  outline-variant: '#E0E2E6'
  surface-tint: '#005bc0'
  primary: '#005bbf'
  on-primary: '#ffffff'
  primary-container: '#1a73e8'
  on-primary-container: '#ffffff'
  inverse-primary: '#adc7ff'
  secondary: '#3f6377'
  on-secondary: '#ffffff'
  secondary-container: '#c0e5fd'
  on-secondary-container: '#43677b'
  tertiary: '#9e4300'
  on-tertiary: '#ffffff'
  tertiary-container: '#c55500'
  on-tertiary-container: '#0e0200'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc7ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#c3e7ff'
  secondary-fixed-dim: '#a7cbe3'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#264b5e'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783100'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  text-primary: '#202124'
  text-secondary: '#444746'
  brand-cobalt: '#0B57D0'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  column-gap: 24px
  row-gap: 24px
---

## Brand & Style
This design system is engineered for high-density enterprise resource planning, prioritizing stability, clarity, and utilitarian efficiency. Inspired by modern productivity suites, the aesthetic is **Corporate / Modern** with a focus on systematic integrity. 

The target audience consists of professional operators who require a tool that minimizes cognitive load while managing complex data. The UI evokes a sense of "quiet competence"—it stays out of the way until needed, using generous whitespace to define relationships rather than decorative elements. Every visual choice is optimized for long-session readability and rhythmic consistency.

## Colors
The palette is centered around "Google Blue" (#1A73E8), used purposefully for primary actions and focus states to guide the user's eye. The foundation of the system relies on a tiered neutral structure:

- **Surface (#F8F9FA):** The lowest layer, used for page backgrounds to provide soft contrast against containers.
- **Surface Container (#FFFFFF):** The workspace layer. All cards, data tables, and forms sit on this level.
- **Text Tiers:** High-contrast Dark Gray (#202124) is reserved for content and headers, while Mid-Gray (#444746) is used for secondary labels and metadata.
- **Accents:** A soft blue (#C2E7FF) acts as a high-visibility background for active chips or selected navigation items.

## Typography
Inter is utilized exclusively across all hierarchy levels to ensure a clean, functional appearance. The scale is built on a modular rhythm, prioritizing legibility in data-heavy views.

- **Headlines:** Use semi-bold weights with slight negative letter-spacing to appear compact and authoritative.
- **Body:** The default for prose and data is `body-md` (14px), providing a balance between information density and readability.
- **Labels:** Medium weights are used for buttons, navigation, and table headers to distinguish them from editable data.
- **Scale:** On mobile, large headlines scale down to prevent excessive wrapping while maintaining hierarchy.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Navigation and sidebars are fixed, while the primary content area spans a fluid grid.

- **Grid:** A 12-column grid system is used for desktop (breakpoints at 1440px+ and 1024px).
- **Rhythm:** An 8px base unit (the "Round Eight" philosophy) governs all padding and margins. 
- **Desktop:** 32px external margins with 24px gutters. Content cards should span 3, 4, 6, or 12 columns.
- **Tablet:** 8-column grid with 24px margins.
- **Mobile:** 4-column grid with 16px margins. Complex data tables should reflow into card-based lists on mobile devices.

## Elevation & Depth
This design system uses **Tonal Layers** supplemented by subtle **Ambient Shadows** to communicate hierarchy.

- **Level 0 (Surface):** The background layer (#F8F9FA). No shadow.
- **Level 1 (Card/Container):** Pure white (#FFFFFF) with a soft, diffused shadow (0px 1px 3px rgba(0,0,0,0.1)). This is the primary work surface.
- **Level 2 (Navigation/Menus):** Elements that float above the workspace (like dropdowns) use a deeper shadow (0px 4px 12px rgba(0,0,0,0.15)) to indicate focus.
- **Interaction:** On hover, clickable cards should subtly increase their shadow depth and move -1px on the Y-axis to provide tactile feedback.

## Shapes
The shape language is disciplined and consistent. A standard **8px (0.5rem)** radius is applied to almost all UI components, including buttons, input fields, and cards. This "Softened Geometry" strikes a balance between the rigid professional look of 0px corners and the overly casual nature of fully rounded shapes.

- **Large Containers:** Use `rounded-lg` (1rem) for major dashboard sections to soften the visual impact of large blocks.
- **Small Elements:** Icons and tags may use `rounded-sm` (0.25rem) if space is constrained.

## Components
- **Buttons:** Primary buttons use a solid #1A73E8 fill with white text. Secondary buttons use a #1A73E8 outline with no fill. All buttons have an 8px corner radius and `label-lg` typography.
- **Input Fields:** Outlined style with a 1px border (#E0E2E6). Labels use `label-md` floating or positioned above the field. On focus, the border thickens to 2px and changes to Primary Blue.
- **Cards:** White background, 8px radius, and Level 1 elevation. Use internal padding of 24px (3x base) for standard dashboard cards.
- **Chips:** Used for status (e.g., "In Progress"). These should have a light tinted background based on status (e.g., light blue #C2E7FF for "Active") with 4px or 8px rounding.
- **Data Tables:** High-density rows (48px height) with 1px horizontal dividers. Header cells use `label-sm` with all-caps and increased letter spacing.
- **Navigation Rail:** A slim vertical sidebar (72px - 240px) using `neutral-color` as the background and Primary Blue for the active state indicator.