# ShortiGo v1 Monitoring Runbook

## Sentry

- Create an alert rule for error count greater than 10 events in 5 minutes.
- Route alerts to the launch owner email or Slack channel.
- During launch week, review top errors daily and file fixes for the top three actionable issues.
- Confirm route breadcrumbs are visible for `/discover`, `/shorts`, `/profile`, `/subscribe`, and player paths.

## Firebase Performance

- Confirm custom traces are reporting for `cold_start`, `discover_load`, `shorts_load`, and `episode_play`.
- Watch p50/p95 cold-start and feed-load timings on mid-range Android and iPhone 12 class devices.
- Investigate any launch-week regression above 20% from the verified baseline.

## Revenue And Product Health

- Check AdMob rewarded-ad fill rate and reward completion rate daily.
- Check RevenueCat active subscribers, trial conversions, and webhook delivery daily.
- Review app store ratings and reviews daily for the first week.
- Keep a short launch log with date, issue, owner, and resolution status.
