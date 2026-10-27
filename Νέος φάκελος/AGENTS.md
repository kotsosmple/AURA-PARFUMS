# AGENTS

## Project overview
This repository is a single-page luxury storefront built with plain HTML, CSS, and JavaScript. It does not use a framework, build step, or package manager.

## Working conventions
- Keep the project lightweight and static. Prefer direct edits in `index.html`, `style.css`, and `script.js`.
- Preserve the existing design language: dark luxury palette, editorial typography, smooth motion, and minimal but polished interactions.
- Reuse the current CSS variables and class structure before introducing new patterns.
- Prefer relative asset paths for local images and keep media files in the project root unless there is a clear need to organize them.
- Do not add frameworks, bundlers, or dependencies unless the task explicitly requires them.

## File map
- `index.html`: page structure, sections, and script/style includes.
- `style.css`: all layout, typography, motion, and visual styling.
- `script.js`: page animations, cursor effects, cart drawer behavior, and product modal interactions.

## Local preview
Serve the folder with a static web server, for example:

```bash
cd "c:\Users\ktzov\Desktop\Νέος φάκελος"
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Quality bar
- Prefer small, targeted edits over broad rewrites.
- Keep behavior accessible and degrade gracefully when JavaScript or assets are unavailable.
- Verify visual changes in a browser and watch for console errors after updates.
- Maintain the current luxury aesthetic and motion timing unless a task asks for a different direction.

## When modifying behavior
- Respect the existing GSAP/Lenis setup and avoid duplicating animation logic unnecessarily.
- If adding new product data or UI states, follow the established pattern of `data-*` attributes and DOM-driven updates.
- Keep naming consistent with the current selectors and class conventions.
