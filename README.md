# 🎮 Memory Game

A beautiful, minimal memory card game with two difficulty modes. Built with vanilla JavaScript, no frameworks required.

## ✨ Features

- **Two Game Modes**
  - 💙 **Light Mode**: Classic memory game - flip cards to find matching pairs
  - 💛 **Dark Mode (Hard)**: Cards can only be revealed once - memory required!

- **Persistent State**: Separate game progress and highscores for each mode
- **Share Scores**: Copy your best score with a visual representation to clipboard
- **Glassmorphic UI**: Modern, elegant design with smooth animations
- **Mobile-First**: Responsive design with proper touch support and safe areas

## 🎯 How to Play

1. Click any card to reveal its symbol
2. Click a second card to find its match
3. Match all 8 pairs to complete the game
4. Try to finish in the fewest moves and shortest time!

### Hard Mode Challenge

In Dark Mode, each card can only be revealed **once**. After you flip a card:
- If it matches: Both cards stay revealed ✓
- If it doesn't match: The card is marked but the symbol is hidden
- Flipping a marked card again shows it's selected but **not the symbol**

This requires true memory - you must remember what you've seen!

## 🚀 Getting Started

Simply open `index.html` in any modern browser. No build steps, no dependencies.

```bash
open index.html
```

## 📤 Sharing Scores

Click the share button (📤) to copy your best score to clipboard in this format:

```
💙 It only took me 42s to solve in 18 moves!
💛 Check it out on olzhas.de/vibes

🟦🟦⬜⬜🟦🟦🟦
⬜🟦⬜⬜🟦⬜🟦
⬜🟦⬜⬜⬜🟦⬜
⬜🟦⬜⬜🟦⬜🟦
🟦🟦🟦⬜🟦🟦🟦
```

The visual shows your move count in 3×5 pixel art using colored emoji squares!

## 🏗️ Architecture

Built following clean code principles:

- **Immutable State**: Pure functional state updates
- **Separation of Concerns**: Game logic, rendering, and UI are cleanly separated
- **Local-First**: All data stored in localStorage
- **No Dependencies**: Vanilla JavaScript, HTML, and CSS only

## 📁 Project Structure

```
.
├── index.html      # Main HTML structure
├── style.css       # Glassmorphic UI styling
├── game.js         # Game logic and state management
└── README.md       # You are here
```

## 🎨 Design Philosophy

This project follows the philosophy outlined in `instructions.md`:

- Clarity over cleverness
- Preserve structure, fix what's broken
- Favor readability and explainability
- Make it obvious, make it robust, make it composable

## 📝 License

MIT

---

Made with 💙 by [Olzhas](https://olzhas.de/vibes)
