[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/0xTreasureDev/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/0xTreasureDev/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Legend · GTA VI Trophy Guide and Tracker

An offline guide and tracker for all 55 Grand Theft Auto VI PlayStation 5 trophies. Every trophy keeps its official name, description and grade exactly as PlayStation publishes them, and adds a guide written for this entry in its own words: what to do, where and how, and when it can be missed, with the sources for each trophy cited beside its guide. A seven-stage roadmap orders the platinum run story first, then collectibles, then activities, then 100 percent completion and the platinum, and every missable trophy carries a visible MISSABLE flag in the checklist, in its roadmap stage and in its detail panel. The tracker saves earned trophies and per-trophy progress counters in localStorage, filters by kind, grade, earned state and search text, offers a spoiler setting that masks unearned story and hidden trophies, and exports or imports progress as a JSON file. Deep links such as #view=roadmap, #kind=missable and #trophy=37 open the matching view on load. The app loads nothing over the network and uses no game artwork; its dark neon-dusk Leonida look is original CSS with a system font stack.

## Run it

Serve the app/ folder with any static file server, for example:

```sh
python3 -m http.server -d app 8080
```

Then open http://localhost:8080 in a browser. To hand the entry in the way the bounty expects, run `node main.ts` (with MAKEFUN_OUTPUT_DIR set outside the grader), which copies app/ and screenshots/ to the output directory and writes dossier.json there.

Built for the make.fun bounty: https://make.fun/bounty/gta6-trophy-guide-01
