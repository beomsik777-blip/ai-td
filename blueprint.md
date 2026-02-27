# Beom Random TD - Project Blueprint

## Overview
Beom Random TD (Hero Defense) is a **premium-tier tower defense game** with high-fidelity 2.5D graphics. It features a sophisticated UI, "cool" character assets, and a deep evolution system for heroes.

## Features
- **Hero Evolution (Level 1-5):** Each hero has 5 unique visual stages. As they level up, their appearance evolves from a basic initiate to a mythic deity.
- **Premium 2.5D Visuals:** High-definition character sprites with dynamic height, soft shadows, and evolving magical auras.
- **Cool Enemies:** Distinct monster archetypes (Orc Warriors, Ogre Knights, Mythic Bosses) with unique visual styles.
- **Epic Buttons:** Modern 3D energy-themed buttons with glassmorphism and tactile feedback.
- **Persistent State:** Automatic saving to `localStorage`.

## Current Plan
1.  **Level-Based Visual System:**
    - Refactor `towerData` to store unique image URLs for each of the 5 levels.
    - Update `drawHero` to dynamically load and render the correct image based on the hero's current level.
2.  **Asset High-Fidelity Update:**
    - Integrate professional-grade RPG sprites that represent progression (e.g., from a basic fire spirit to a phoenix).
3.  **UI/UX Polish:**
    - Ensure smooth transitions and loading states for new images.

## Project Structure
- `index.html`: Optimized UI structure.
- `main.js`: Core logic with level-based image rendering.
- `style.css`: Luxury styling.
- `Beom/fire.png`: Legacy asset.
