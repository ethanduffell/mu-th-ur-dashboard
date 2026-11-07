# MU-TH-UR Dashboard — HACS package

HACS-compatible packaging of the MU-TH-UR 6000 motion-tracker card from
[`jonesy-the-cat/mu-th-ur-dashboard`](https://github.com/jonesy-the-cat/mu-th-ur-dashboard).

This fork is intentionally conservative. HACS installs only the reviewed motion-tracker
card. It does not automatically install the full example dashboard, audio, boot effects,
page-wide JavaScript effects, or a Google-hosted font.

## What HACS installs

- `dist/mu-th-ur-dashboard.js`
- Custom card type: `custom:mother-tracker-card`
- No external network requests
- No Home Assistant service calls
- No global sound, timers, page overlays, or injected effects

The original `mother-sound.js` is retained under `extras/` for provenance and manual
review only. HACS does not download it because the installable files live in `dist/`.

## Install as a HACS custom repository

1. In HACS, open the menu and choose **Custom repositories**.
2. Add this repository URL and select **Dashboard** as the type.
3. Download **MU-TH-UR Dashboard**.
4. Confirm the dashboard resource is:
   `/hacsfiles/mu-th-ur-dashboard/mu-th-ur-dashboard.js`
5. Refresh Home Assistant.

HACS custom-repository instructions:
https://www.hacs.xyz/docs/faq/custom_repositories/

## Card configuration

```yaml
type: custom:mother-tracker-card
title: "[ SCANNER // FRONT ]"
entity: binary_sensor.front_door_motion
camera: camera.front_door
range: 20
```

Use real entity IDs from your Home Assistant instance. When the configured detection
entity is unavailable, the card displays `NO SIGNAL`.

## Dashboard YAML

`dashboard.yaml` is the author's original example. It contains placeholder entity IDs
and must not be imported unchanged. Keep a separate dashboard and map every entity before
use. Missing systems should be labelled unavailable rather than treated as healthy.

## Provenance and maintenance

- Upstream commit: `e2837327a1c324ee2b21b008a123a98178efbfe2`
- The upstream project currently has no declared software licence. This fork does not
  add or imply one; retain the upstream attribution and treat redistribution cautiously.
- Review upstream changes manually before merging them into this package.

The original README is preserved as [`UPSTREAM.md`](UPSTREAM.md).

