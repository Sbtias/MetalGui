# Changelog

## 2026-10-23 — Studio overhaul

### Added
- AI Architect. Describe a game and Studio builds a playable level: platformer, endless runner, top-down maze, or asteroid dodge, with gravity, coins, hazards, and a goal. Press Play. No Python download required for these games.

- Changelog inside Studio (button in the top bar) and this file.
- Dark editor workspace: toolbar, hierarchy, scene view, inspector, and Python panel.
- Larger Add Node menu with clearer groups.
- Click outside the Add Node menu to dismiss it.
- Status bar hints for Select, Move, and Play.

### Fixed
- Studio controls stopped working after creating a project. `querySelector` was used where `querySelectorAll` was required, so Play, Add Node, zoom, and the inspector never attached their listeners.

### Changed
- Landing page calls to action say "Start Building".
- Landing page has a sticky glass top bar and entrance motion.
- Studio panels are wider, with stronger focus rings and button depth.

## 2026-10-19 — First studio

- Landing page, email sign-in, local workspace, 2D scene editor, hierarchy, inspector, Python play mode, and Windows export package.
