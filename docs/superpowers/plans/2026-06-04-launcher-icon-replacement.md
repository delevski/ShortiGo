# ShortiGo Launcher Icon Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every ShortiGo launcher icon with a border-free, platform-safe version of the user-supplied artwork.

**Architecture:** Produce one opaque 1024 x 1024 master by cropping screenshot residue from the supplied source. Derive Android legacy, Android adaptive foreground, native splash, iPhone, iPad, and App Store PNGs from that master while preserving the existing resource names and application references.

**Tech Stack:** macOS `sips`, PNG assets, Android adaptive icons, Xcode asset catalogs, Flutter build tooling

---

### Task 1: Produce and inspect the master icon

**Files:**
- Create: `assets/branding/shortigo_launcher_icon_source.png`
- Modify: `assets/branding/shortigo_launcher_icon_1024.png`

- [ ] **Step 1: Record source and current-master dimensions**

Run:

```bash
sips -g pixelWidth -g pixelHeight -g hasAlpha \
  "/Users/corphd/Desktop/Screenshot 2026-06-03 at 15.19.04.png" \
  assets/branding/shortigo_launcher_icon_1024.png
```

Expected: the screenshot is `1244 x 1188`; the existing master is `1024 x 1024`.

- [ ] **Step 2: Crop screenshot residue and create the opaque master**

Use `sips` to crop the supplied image around the rounded-square artwork, then
resize the result to `1024 x 1024`. Save the cropped original separately as
`shortigo_launcher_icon_source.png` and replace the existing master.

- [ ] **Step 3: Inspect the master**

Open `assets/branding/shortigo_launcher_icon_1024.png` and confirm the play
symbol and glowing rings are centered, the screenshot strip is gone, the
artwork reaches all four sides, and the image is opaque.

- [ ] **Step 4: Verify dimensions and alpha**

Run:

```bash
sips -g pixelWidth -g pixelHeight -g hasAlpha \
  assets/branding/shortigo_launcher_icon_source.png \
  assets/branding/shortigo_launcher_icon_1024.png
```

Expected: the master is `1024 x 1024` and has no alpha channel.

### Task 2: Generate Android launcher and splash assets

**Files:**
- Modify: `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
- Modify: `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- Modify: `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- Modify: `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- Modify: `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- Modify: `android/app/src/main/res/drawable-mdpi/ic_launcher_foreground.png`
- Modify: `android/app/src/main/res/drawable-hdpi/ic_launcher_foreground.png`
- Modify: `android/app/src/main/res/drawable-xhdpi/ic_launcher_foreground.png`
- Modify: `android/app/src/main/res/drawable-xxhdpi/ic_launcher_foreground.png`
- Modify: `android/app/src/main/res/drawable-xxxhdpi/ic_launcher_foreground.png`
- Modify: `android/app/src/main/res/drawable-nodpi/launch_logo.png`
- Modify: `android/app/src/main/res/values/colors.xml`

- [ ] **Step 1: Generate legacy launcher PNGs**

Resize the opaque master to Android legacy sizes `48`, `72`, `96`, `144`, and
`192` pixels and write them to the existing `mipmap-*` paths.

- [ ] **Step 2: Generate adaptive foreground PNGs**

Create foreground images at `108`, `162`, `216`, `324`, and `432` pixels with
the master artwork scaled into the Android adaptive safe zone. Keep the outer
area transparent so Android's mask and background color control the final
shape.

- [ ] **Step 3: Match the adaptive background**

Set `launcher_icon_background` in `values/colors.xml` to the dark purple edge
color of the new master. Preserve `launch_background`.

- [ ] **Step 4: Update the native splash logo**

Create an appropriately sized `drawable-nodpi/launch_logo.png` from the new
master so the native startup screen uses the new identity.

- [ ] **Step 5: Inspect representative Android assets**

Inspect the mdpi legacy icon, xxxhdpi adaptive foreground, and native splash
logo. Confirm no screenshot border remains and the adaptive foreground has
enough safe-zone padding.

### Task 3: Generate Apple icon assets

**Files:**
- Modify: `ios/Runner/Assets.xcassets/AppIcon.appiconset/*.png`

- [ ] **Step 1: Generate every listed Apple icon**

Read `Contents.json`, then resize the opaque master to every pixel dimension
used by the existing filenames: `20`, `29`, `40`, `58`, `60`, `76`, `80`,
`87`, `120`, `152`, `167`, `180`, and `1024`.

- [ ] **Step 2: Verify Apple dimensions and opacity**

Run `sips -g pixelWidth -g pixelHeight -g hasAlpha` across every Apple icon.

Expected: dimensions match each filename and every PNG has no alpha channel.

- [ ] **Step 3: Inspect the App Store icon**

Inspect `Icon-App-1024x1024@1x.png` and confirm it matches the master.

### Task 4: Verify and commit the icon replacement

**Files:**
- Test: all generated launcher and splash assets

- [ ] **Step 1: Run static checks**

Run:

```bash
flutter analyze
flutter test
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Build the Android release app bundle**

Run:

```bash
flutter build appbundle --release --dart-define=ENV=prod
```

Expected: a release AAB is produced. If the known Kotlin DSL Base64 error
blocks this step, fix it under the systematic-debugging workflow before
re-running the build.

- [ ] **Step 3: Build iOS release without code signing**

Run:

```bash
PATH="/usr/local/opt/ruby@3.1/bin:/usr/local/lib/ruby/gems/3.1.0/bin:$PATH" \
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 \
SSL_CERT_FILE=/usr/local/etc/ca-certificates/cert.pem \
flutter build ios --release --no-codesign --dart-define=ENV=prod
```

Expected: `build/ios/iphoneos/Runner.app` is produced.

- [ ] **Step 4: Commit only icon-related files**

Stage the master, Android launcher/splash assets, Apple icon assets, and this
plan. Do not stage unrelated dirty-worktree files.

```bash
git commit -m "feat: replace launcher icon artwork"
```
