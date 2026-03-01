# QuestBody - Modern Web App Blueprint

## Project Overview
QuestBody is a gamified fitness and cognitive training hub with a futuristic, cyberpunk aesthetic. It combines physical exercises (GYM), mental puzzles (BRAIN), and a strategic defense game (DEFENSE) into a unified RPG-like experience.

## Features & Design
- **Visual Style:** Cyberpunk/Neon aesthetic using Tailwind CSS and custom glassmorphism effects.
- **Typography:** 'Orbitron' font for a sci-fi feel.
- **Components:**
    - **Header:** Real-time stats (Village HP, Coins, Mana).
    - **Main Area:** 2.5D character sprite display with a holographic grid background.
    - **Stat Bars:** Animated STR (Strength) and INT (Intelligence) progress bars.
    - **Guide Section:** Interactive NPC dialogues with glow effects.
    - **Bottom Navigation:** Quick access to GYM, BRAIN, DEFENSE, and SHOP.

## Implementation Steps
1. **Login System:** Create `login.html` and add authentication checks to `index.html`.
2. **Initial Setup:** Create the Main Hub interface in `index.html` using Tailwind CSS.
3. **Navigation:** Implement a modular menu system to switch between different game modes.
4. **Stat Persistence:** (Planned) Integration with local storage or Firebase to save user progress.
