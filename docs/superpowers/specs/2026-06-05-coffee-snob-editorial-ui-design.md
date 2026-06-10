# Coffee Snob editorial UI & analytics — design spec

**Status:** Implemented in #21  
**Issue:** https://github.com/glimpsovstar/coffee-shot-journal/issues/21

## Summary

Premium editorial journal layout: centered brand hero, floating featured shot, dedicated analytics chart page. Brand palette `#2E1F16`, `#FAF6F0`, `#E05A47`; Nunito + JetBrains Mono for metrics.

## Shipped components

| Component | Role |
|-----------|------|
| `EditorialHeader` | Centered stacked logo, tagline, social placeholders (Instagram, Day One), sign out |
| `FloatingShotHero` | Last **10** extraction photos (newest first); staggered float; per-card hover/tap recipe overlay |
| `AnalyticsPage` | Recharts dual-axis line chart (ratio + duration) |
| `SocialPlaceholders` | Disabled future-integration buttons |

## Navigation

- **Journal** — hero + shot feed + add shot + bean sidebar
- **Analytics** — chart only (no sidebar)
- **Import past shot** / **Backup & restore** — unchanged

## Chart data

- X: brew timestamp (locale label)
- Y left: extraction ratio (`yield / dose`)
- Y right: duration (seconds)
- Source: `src/utils/analytics.ts`

## Future

- Wire Instagram API and Day One webhooks to `SocialPlaceholders`
- Cafe visit logging (mentioned in product brief)
