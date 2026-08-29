# Unskipping-Sleep-Cutscenes

Minecraft Bedrock Edition Add-on: **Unskipping Sleep Cutscenes**

Sleeping in a bed forces your character to lie awake in real-time for 8 in-game hours (~7 minutes of real time). You cannot open your inventory, look around, or leave the bed until the sun fully rises, watching your ceiling in total silence.

---

## Features

- **Real-Time Sleep Delay**: Sleeping in any bed forces an 8 in-game hour delay (~7 minutes real time / 8,000 ticks) before sunrise.
- **Ceiling Camera Lock**: Your view is locked in place, looking directly up at the ceiling (`minecraft:free` camera preset with pitch set to `-90°`).
- **HD Ceiling Textures**: Includes enhanced wood ceiling texture assets.
- **Actionbar Progress**: Displays remaining time until sunrise and percentage complete.
- **Vanilla Compatibility**: Uses standard Minecraft Script API (`@minecraft/server`).

---

## Installation & How to Play

### 1. Installation
1. Download or import **`Unskipping_Sleep_Cutscenes.mcaddon`** (or import `Unskipping_Sleep_Cutscenes_BP.mcpack` and `Unskipping_Sleep_Cutscenes_RP.mcpack` separately).
2. Double-click or open the `.mcaddon` / `.mcpack` file to import it into Minecraft Bedrock.

### 2. World Setup
1. Edit your world settings in Minecraft Bedrock Edition.
2. Under **Resource Packs**, activate **Unskipping Sleep Cutscenes - Resource Pack**.
3. Under **Behavior Packs**, activate **Unskipping Sleep Cutscenes - Behavior Pack**.
4. Enable **Beta APIs** / **Scripting API** in world Experiments settings.

---

## File Structure

- `behavior_pack/` - Behavior pack files, `manifest.json`, and Script API code.
  - `scripts/main.js` - Script for handling bed interactions, locking camera, time loop, and sunrise release.
- `resource_pack/` - Resource pack files, `manifest.json`, and HD ceiling textures.
- `Unskipping_Sleep_Cutscenes.mcaddon` - Complete combined add-on package ready for installation.
- `Unskipping_Sleep_Cutscenes_BP.mcpack` - Behavior pack file.
- `Unskipping_Sleep_Cutscenes_RP.mcpack` - Resource pack file.
