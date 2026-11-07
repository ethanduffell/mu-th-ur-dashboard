# MU-TH-UR 6000: an Alien (1979) "Mother" dashboard for Home Assistant

A green-screen ship's computer for your house, styled on MU-TH-UR from the Nostromo. Work in progress.

I can't code. I built this with Claude (Anthropic's AI) working through the Home Assistant MCP server, so treat it as a hobby project and expect rough edges.

## What's in here

| File | What it is |
|---|---|
| `dashboard.yaml` | The dashboard itself (Sections view, card-mod styling, Markdown cards with templates) |
| `mother-tracker-card.js` | Custom motion-tracker card (sweeping radar, tap to open the camera) |
| `mother-sound.js` | Boot animation, ambient drone, glitch effects, film grain, CRT band. Audio is optional |

## What you need first

1. **card-mod** from HACS (Frontend). It does all the styling.
2. The **Courier Prime** font. Add this as a dashboard resource (Settings > Dashboards > three dots > Resources), type *Stylesheet*:
   `https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap`
3. Optional: the **System Monitor** integration, for the Main Computer panel (CPU, memory, disk, temperature, uptime).

## Install

1. In File editor (or Samba), put these in `/config/www/`:
   - `mother-tracker-card.js`
   - `mother-sound.js`
   - `mother-logo.png` (optional, your own header logo; or delete the `<img ...>` line from the header card)
   - `mother-boot.mp3` and `mother-ambience.wav` (optional, see Sound below)
2. Settings > Dashboards > Resources > Add, as type *JavaScript module*:
   - `/local/mother-tracker-card.js`
   - `/local/mother-sound.js`
   If you can't see Resources, turn on Advanced mode in your user profile.
3. Settings > Dashboards > Add dashboard. Give it the URL **`mu-th-ur`** (the script looks for that path). Open it, then use the three dots > Edit > three dots > Raw configuration editor, and paste in `dashboard.yaml`.
4. Hard refresh the browser (Ctrl+F5). Browsers cache `/local/` files, so after changing a script, add `?v=2` to its resource URL.

## Make it yours

The entity IDs in `dashboard.yaml` are examples. Swap them for yours (the raw editor has find and replace):

- **Crew list**: top of the header card, `('DALLAS','person.dallas')` etc.
- **Cameras**: `camera.front_door`, `camera.garden`, `camera.hall`
- **Person detection and motion sensors** for the two scanners
- **Room motion sensors** in the Motion Tracker card
- **Lights** in Deck Lighting (the Purge button turns off the same list)
- **Alarm panel**, **thermostats**, **media player**, **door sensor**
- `binary_sensor.YOUR_WAN_STATUS`: any binary sensor that is `on` when your internet is up (router integration, ping sensor). If you don't have one, delete the UPLINK lines.
- `ignore` list in the Attention Required card: battery sensors you don't want flagged

Anything that doesn't exist just shows as NO SIGNAL or NONE. The mission stats in the Navigation card are made up, so change the text to taste.

If the dashboard path isn't `/mu-th-ur`, change `MOTHER_PATH` at the top of `mother-sound.js`.

## Sound

The boot clip and ambient drone I used come from the film, so I haven't included them. Without the files, everything works but silently (you still get the boot-up flicker, grain and glitches).

To add your own, drop two files in `/config/www/`:

- `mother-boot.mp3`: a short boot sequence, about 7 seconds. The header animation is timed to 7 seconds.
- `mother-ambience.wav`: a low drone that loops. Set `LOOP_END` in `mother-sound.js` to the loop point in seconds, and edit `GLITCHES` (start time and length in seconds of short glitchy sounds inside the same file, used for the random glitch noises).

Volumes and timings are constants at the top of `mother-sound.js`. Browsers block audio until you click or tap the page once.

## Known issues / to do

- Built for desktop first. It works on mobile but isn't tuned.
- The bottom of the dashboard could use better use of space.
- The boot animation targets the first two cards by their heading text, so renaming them breaks it.
- More in-universe touches (Mother "answering" questions) are planned.

Not affiliated with 20th Century Studios or Weyland-Yutani Corp. Just a fan project. Use as you like.
