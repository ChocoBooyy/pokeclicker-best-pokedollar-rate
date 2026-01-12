# Best Pokédollar Rate

Best Pokédollar Rate is a utility script for Pokéclicker that identifies the most efficient source of Pokédollars based on observed in-game income over time.

The script relies exclusively on real gameplay data and does not use theoretical damage or speed calculations.

## Purpose

The goal of the script is to help players determine where they actually earn the most Pokédollars per second, based on what they have played, rather than what should be optimal on paper.

## What the Script Does

The script continuously tracks Pokédollar gains and associates them with the activity currently being played. Over time, it computes stable Pokédollar-per-second rates and determines which unlocked activity performs best.

It evaluates:
- Routes
- Gyms
- Temporary trainer battles

Dungeon content is not evaluated.

## How It Works

- Pokédollar balance changes are sampled once per second.
- Income is accumulated over fixed time windows to smooth reward timing.
- Each completed window produces a Pokédollar-per-second rate sample.
- A rolling history of recent samples is stored per activity.
- Average rates are computed from these samples.
- Only unlocked routes and gyms are considered.

This method reflects real gameplay conditions, including:
- Pokémon damage
- Click attack speed
- Items and buffs
- Player decisions and movement
- Reward timing behavior

The script measures what actually happens, not what is theoretically optimal.

## Interface

The script adds a collapsible card to the left-side interface in Pokéclicker.

The panel displays:
- The best observed Pokédollar farming target
- The Pokédollar rate of the currently active activity
- Status information while data is being collected

Additional controls:
- View all data: Expands a table listing all measured activities
- Rate sorting: Click the Rate column to toggle between highest and lowest values
- Reset: Clears all collected data and restarts observation

Pokédollar values are displayed using the in-game Pokédollar icon for consistency.

## Data Persistence

Observed income data is stored locally using browser or client storage.

This allows the script to retain previously measured activity data across:
- Page reloads
- Game restarts
- Desktop client sessions

No external data is transmitted.

## Platform Compatibility

The script works on:
- Pokéclicker Web
- Pokéclicker Desktop Client

It does not rely on userscript-manager-specific APIs and adapts automatically to both environments.

## Limitations

- Newly unlocked activities require time to collect sufficient data.
- Results are based on observation, not prediction.
- Short farming sessions may produce incomplete averages.
- Dungeon farming is not tracked.

## Intended Use

This script is intended as an informational and analytical tool.

It does not automate gameplay, modify core mechanics, or interact with combat systems.

## Author

ChocoBoy
