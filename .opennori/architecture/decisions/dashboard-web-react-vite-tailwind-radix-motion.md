# dashboard-web-react-vite-tailwind-radix-motion Build-vs-Buy Decision

Area: dashboard-web
Need: Provide a productized local visual dashboard that helps users observe OpenNori agent activity, current acceptance gap, user intervention, architecture health, and completion decision without becoming an agent runtime or process log.
Recommendation: reuse
Status: active



## Summary

Use React, Vite, Tailwind CSS v4, Radix primitives, Motion, and Lucide React for the dashboard UI while keeping Hono as the local snapshot/SSE kernel and .opennori as the source of truth.

## Candidates Checked

- Current project: OpenNori already has a Hono dashboard kernel, /api/snapshot, /api/events, TypeScript modules, and a small vanilla dashboard. The vanilla files prove the transport but are not a long-term UI architecture for live visual state, motion, responsive layout, or accessible overlays.
- Standard library: Browser DOM, CSS, SVG, and EventSource can render the dashboard, but hand-rolling component state, animation, responsive primitives, accessible dialogs/tooltips/tabs, and build output would repeat solved frontend infrastructure.
- Official SDK: No official OpenNori UI SDK exists. Vite is the official modern build path for React projects through @vitejs/plugin-react, and @tailwindcss/vite is Tailwind's Vite integration.
- Open source: React is a mature UI library used broadly in agent UI projects; Vite is a mature ESM build tool; Tailwind CSS v4 provides utility styling and tokens; Radix primitives provide accessible UI behavior without a heavy visual system; Motion provides React animation; Lucide React provides icons. TK references show mature agent UI projects separate daemon/kernel state from frontend UI and often use React/Vite/Tailwind-style stacks.

## Self-build Reason

<none>
