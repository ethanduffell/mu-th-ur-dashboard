# Security policy

This package installs only `dist/mu-th-ur-dashboard.js`.

The distributed card:

- reads only the Home Assistant entities named in its card configuration;
- opens Home Assistant's normal more-info dialog when selected;
- does not call services, fetch remote content, or transmit data; and
- does not install the optional upstream sound/effects script.

Before accepting upstream updates, compare them with the pinned upstream commit and
repeat the JavaScript review. Report suspected security problems privately to the fork
owner rather than including sensitive Home Assistant details in a public issue.

