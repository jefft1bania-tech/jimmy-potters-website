# Internal Traffic Exclusion — Enrollment URLs

## Internal traffic exclusion

Visit `?internal=1` once on each device that should be excluded from analytics. The cookie persists for 2 years (`Max-Age=63072000`). To re-enable tracking on a device, visit `?internal=0`.

- Production enroll: `https://website-three-omega-62.vercel.app/?internal=1`
- Production clear:  `https://website-three-omega-62.vercel.app/?internal=0`
- Local enroll:      `http://localhost:3000/?internal=1`
- Local clear:       `http://localhost:3000/?internal=0`

When enrolled, the middleware skips the pageview beacon and the client SDK no-ops `track()` / `sendEnrich()`. No rows are written for internal devices, so the admin analytics dashboard naturally excludes them.
