# DESIGN.md

## Goal
Build interfaces that feel intentional, fast, human, and production-ready.
Do not stop at "works". Push for the last mile of quality.

## Core principle
Code and design are one discipline.
Every UI decision must satisfy both:
1. functional clarity
2. visual and interaction quality

## What good output looks like
The product should feel:
- clear
- coherent
- refined
- responsive
- modern but restrained

The UI must not feel generic, template-like, or AI-generated.

## Priorities
Follow this order:
1. Make the core flow work
2. Make the layout clear and readable
3. Make the interaction feel polished
4. Remove visual and behavioral inconsistencies
5. Refine only what improves the actual user experience

## Design standards
### Layout and spacing
- Use consistent spacing rhythms
- Align elements cleanly
- Avoid cramped layouts and random empty areas
- Prefer strong hierarchy over decorative complexity
- Reduce visual noise

### Typography
- Typography must be deliberate, readable, and consistent
- Use clear contrast in size, weight, and hierarchy
- Avoid awkward line lengths and weak text contrast
- Headings, labels, body text, and helper text must each have a distinct role

### Color
- Use color with restraint
- Keep the palette coherent
- Avoid random accent colors and muddy gray combinations
- Color should support hierarchy and meaning, not decoration

### Components
- Reuse patterns consistently
- Buttons, inputs, cards, modals, dropdowns, and navigation should feel like one system
- Similar elements must behave similarly
- States must be complete: default, hover, focus, active, disabled, loading, error, success

## Interaction standards
### Motion
- Motion should clarify, not distract
- Use animation to communicate cause and effect, hierarchy, continuity, and feedback
- Keep timing consistent across related elements
- Prefer subtle, purposeful motion over flashy effects
- Avoid decorative motion that slows the user down

### Microinteractions
- Add polish to hover, focus, press, expand, drag, loading, selection, and transition states
- Small interactions should feel responsive and intentional
- Use microcopy and motion to reduce ambiguity

### Scrolling
- Never use scroll hijacking
- Respect native scrolling behavior
- Scroll effects must not fight the user

### Feedback
- Every action should have clear feedback
- Loading, saving, success, failure, and empty states must be designed
- Avoid dead clicks and silent state changes

## Product taste rules
- Prefer restraint over overdesign
- Prefer coherence over novelty
- Prefer clarity over visual tricks
- Prefer one strong idea over many weak ones
- If an effect does not improve usability or feeling, remove it

## AI usage rules
AI can accelerate implementation, exploration, and prototyping.
AI must not decide the final quality bar.

When generating UI:
- do not accept first-pass output blindly
- inspect spacing, typography, hierarchy, and motion
- remove generic patterns
- rewrite awkward sections
- refine until the result feels crafted

## Common failure modes to avoid
Do not ship:
- generic landing-page styling
- inconsistent spacing
- weak typography hierarchy
- random border radii, shadows, or colors
- overuse of blur, glow, gradients, or glassmorphism
- meaningless animation
- inconsistent component states
- poor mobile adaptation
- fake polish that hides weak UX
- feature-complete but emotionally flat UI

## Implementation behavior
When building UI, Codex should:
1. think like a product designer and frontend engineer at the same time
2. define the structure before styling details
3. create a small, consistent design system before scaling pages
4. keep interaction patterns uniform
5. refine the most important user-facing moments first
6. make the interface feel production-ready, not demo-ready

## Review checklist
Before finishing, check:
- Is the hierarchy obvious in 3 seconds?
- Does the spacing feel systematic?
- Does the typography feel intentional?
- Do similar elements behave the same way?
- Are motion and transitions consistent?
- Are hover, focus, loading, empty, and error states covered?
- Does anything feel generic or AI-made?
- Can anything be simplified without losing quality?
- Does the UI feel fast, human, and confident?

## Final instruction
Do not optimize for flashy output.
Optimize for taste, coherence, and last-mile quality.

A good result is not just functional.
It should feel like someone cared.