# ShortiGo Launcher Icon Replacement Design

## Goal

Replace the current ShortiGo launcher icon with the artwork supplied in
`/Users/corphd/Desktop/Screenshot 2026-06-03 at 15.19.04.png`, while removing
the surrounding screenshot border and producing correct launcher assets for
Android, iPhone, iPad, and the App Store.

## Source Treatment

The screenshot is the visual source of truth. Processing must preserve the
play symbol, glowing rings, colors, lighting, and rounded-square artwork.

The source will be cropped to a centered square that removes the screenshot
canvas above and beside the icon. The resulting master will be resized to an
opaque 1024 x 1024 PNG. No generative reconstruction or transparent outer
corners will be used, because either could change the supplied design or expose
an unintended black rim under launcher masks.

## Platform Assets

### Android

- Generate legacy `mipmap-*` launcher PNGs at all existing density sizes.
- Generate an adaptive foreground asset with conservative safe-zone scaling so
  the play symbol and glowing rings remain visible under circular, squircle,
  and rounded-square launcher masks.
- Use a dark purple background color sampled from the artwork so adaptive icon
  masks never reveal a mismatched black border.
- Preserve the existing `@mipmap/ic_launcher` application reference.

### Apple

- Generate every icon size listed in
  `ios/Runner/Assets.xcassets/AppIcon.appiconset/Contents.json`.
- Keep every Apple icon fully opaque and square; iOS applies its own mask.
- Use the processed 1024 x 1024 master for the App Store marketing icon.

### Splash Branding

Update the native splash logo source to use the new visual identity where it
can be done without making the startup artwork overly detailed at small sizes.
The animated Flutter splash remains a separate release-readiness task.

## Verification

- Check all generated files have the expected dimensions and are valid PNGs.
- Confirm Apple icons are opaque.
- Inspect representative Android legacy, Android adaptive, and iOS 1024 assets.
- Build an Android release app bundle and an iOS release app without code
  signing after the asset replacement.
- Run `flutter analyze` and `flutter test`.

## Scope Boundaries

This task does not redesign the supplied artwork, change the app display name,
or configure store listings. After the launcher replacement is verified, work
continues through the previously audited release checklist, beginning with the
current Android release-build failure and the animated splash cleanup.
