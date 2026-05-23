# Design System Strategy: The Precision Concierge

## 1. Overview & Creative North Star
The "Precision Concierge" is the guiding philosophy of this design system. We are moving away from the "utilitarian car repair app" aesthetic and toward a high-end, editorial automotive experience. This system avoids the common "boxed-in" look of mobile apps by utilizing intentional asymmetry, overlapping layers, and a deep focus on tonal depth.

Our goal is to convey **Trust through Precision**. We achieve this not through rigid grids and heavy lines, but through breathing room, sophisticated typography scales, and a "glass-and-metal" material logic that mirrors the sleek surfaces of a modern electric vehicle.

## 2. Colors & Surface Logic
The color palette is built on a foundation of "Sleek Deep Sea" blues and "Industrial Silver" grays, punctuated by a high-energy "Electric Teal" accent.

### The "No-Line" Rule
To maintain a premium, editorial feel, **1px solid borders are strictly prohibited for sectioning.** We define boundaries through background color shifts rather than structural strokes. For example, a `surface-container-low` section should sit directly on a `surface` background to create a soft, natural edge.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of frosted glass.
*   **Base:** `surface` (#f9f9ff) for the primary background.
*   **Depth 1:** `surface-container-low` (#f0f3ff) for secondary sections.
*   **Depth 2:** `surface-container` (#e7eeff) for primary content cards.
*   **Depth 3:** `surface-container-highest` (#d8e3fb) for interactive elements that need to pop.
*   **The Lift:** Use `surface-container-lowest` (#ffffff) for floating action elements to provide the highest contrast against the background.

### The "Glass & Gradient" Rule
To inject "soul" into the interface, use Glassmorphism for floating navigation bars or modal headers. Apply `surface` or `primary` colors at 70% opacity with a `20px` backdrop-blur. 
**Signature Texture:** Main CTAs should not be flat. Use a linear gradient from `primary` (#0040a1) to `primary-container` (#0056d2) at a 135-degree angle to simulate the sheen of high-end automotive paint.

## 3. Typography
We utilize a dual-typeface system to balance technical authority with modern readability.

*   **Display & Headlines (Manrope):** Use Manrope for all `display` and `headline` tokens. Its geometric yet friendly curves suggest modern engineering. Use high-contrast sizing (e.g., `display-lg` at 3.5rem) to create an editorial "magazine" feel on hero screens.
*   **Utility & Body (Inter):** Use Inter for `title`, `body`, and `label` tokens. Inter provides maximum legibility for technical data like "Engine Oil Life" or "Next Service Date."

**Hierarchy Note:** Always pair a `headline-lg` with a `body-md` in `on-surface-variant` (#424654) to create a sophisticated tonal contrast that guides the eye toward the most important information.

## 4. Elevation & Depth
In this design system, shadows are a last resort, not a default. We convey hierarchy through **Tonal Layering**.

*   **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card on a `surface-container-low` background. The subtle shift in hex value creates a "soft lift" that feels more expensive than a drop shadow.
*   **Ambient Shadows:** When an element must float (e.g., a critical "Book Now" FAB), use a shadow with a blur radius of `24px` and an opacity of `6%`. The shadow color must be a tinted version of `on-surface` (#111c2d), never pure black.
*   **The "Ghost Border" Fallback:** If a layout requires a container for accessibility (like a form field), use a "Ghost Border": the `outline-variant` (#c3c6d6) at **15% opacity**. 100% opaque borders are forbidden.

## 5. Components

### Buttons
*   **Primary:** Gradient of `primary` to `primary-container`. `xl` roundedness (1.5rem). Text should be `on-primary` (#ffffff) in `label-md` uppercase with slight letter spacing.
*   **Secondary:** `secondary-container` background with `on-secondary-container` text. No border.
*   **Tertiary:** No background. Use `primary` text. Use for low-emphasis actions like "Cancel" or "View All."

### Cards & Lists
*   **The No-Divider Rule:** Forbid the use of divider lines. Separate list items using `12px` of vertical white space or by alternating the background between `surface-container-low` and `surface-container-lowest`.
*   **Rounding:** All content cards must use `xl` (1.5rem) rounded corners to evoke the aerodynamic curves of modern vehicle design.

### Input Fields
*   **Style:** Minimalist. Use `surface-container-highest` as a subtle background fill. 
*   **Active State:** Transition the "Ghost Border" to 100% opacity `tertiary` (#004f53) to signal focus without being jarring.

### Specialized Components: The "Performance Gauge"
For automotive data (fuel, tire pressure), use a custom "Gauge" component featuring the `tertiary_fixed` (#63f7ff) accent color. This element should utilize motion—a 1.2s cubic-bezier ease-out transition—when the screen loads to emphasize the "live" nature of the vehicle data.

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts (e.g., a headline aligned left with a supporting image offset to the right).
*   **Do** use the `tertiary` accent for "Active" or "Healthy" states (e.g., "Tires: OK").
*   **Do** use large amounts of negative space to define the "Professional" brand pillar.

### Don't:
*   **Don't** use 100% opaque borders for any container.
*   **Don't** use standard "Material Design" blue (#2196F3). Only use the specified `primary` (#0040a1).
*   **Don't** use shadows on every card; rely on surface tone shifts first.
*   **Don't** clutter the screen. If it's not essential for the user's current "Care" task, move it to a sub-menu.