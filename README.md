# Best Pokédollar Rate

Best Pokédollar Rate is a utility script for Pokéclicker that identifies the most efficient source of Pokédollars based on observed in-game income over time.

The script relies on real gameplay data rather than theoretical damage calculations.

## What the Script Does

The script continuously tracks Pokédollar gains and associates them with the activity currently being played. Over time, it determines which unlocked activity produces the highest average Pokédollars per second.

It evaluates:
- Routes
- Gyms
- Temporary trainer battles

The script displays:
- The best-performing activity observed so far
- The Pokédollar rate of the currently active activity

## How It Works

- Pokédollar changes are sampled once per second.
- Each sample is associated with the current activity.
- A rolling window of recent samples is stored per activity.
- Average Pokédollars per second are computed from these samples.
- Only unlocked routes and gyms are considered.

This approach reflects real gameplay conditions, including:
- Pokémon damage
- Click attack speed
- Items and buffs
- Player behavior

## Interface

The script adds a collapsible card to the left-side interface in Pokéclicker.

The panel displays:
- Best observed Pokédollar farming target
- Current activity Pokédollar rate
- Status information while data is being collected

## Data Persistence

Observed income data is saved locally in the browser or desktop client.

This allows the script to retain knowledge of previously measured activities across reloads and restarts.

## Platform Compatibility

The script works on:
- Pokéclicker Web
- Pokéclicker Desktop Client

It does not rely on userscript-only APIs and adapts automatically to both environments.

## Limitations

- Newly unlocked activities require time to collect data.
- Results are based on observation, not prediction.
- Very short farming sessions may produce incomplete averages.
- Dungeon farming is not evaluated.

## Intended Use

This script is intended as an informational tool.
It does not automate gameplay or modify core game mechanics.

## Author

ChocoBoy
