LATEST CHANGES
- Drawings: OD and ID now say "OD" / "ID", the wall dimension says "WALL", and the data table lists OD, ID and wall thickness with tolerances. The centre line no longer runs through the OD text.
- Each Design a bearing calculator now remembers its own units (metric or imperial) separately.
- Game: 10 coins for a shield.
- New icons, favicon and splash from your logo. Upload ALL PNG files (icon-192, icon-512, icon-maskable-512, apple-touch-icon, favicon-32, logo-full).
- New tool: Freezer shrink time (Tools > Design).

THIS UPDATE
- Backup reminders: Admin > Backups lets you choose how often (never, daily, weekly, 2 weeks, monthly). When a backup is due, admins see a banner on Home with "Back up now" and "Remind me tomorrow". The last-backup date is saved in the settings document, so no rules change is needed.
- App icons and splash screen: new icon PNGs (192, 512, maskable, Apple touch 180, favicon) plus a splash screen that fades out when the app is ready. Upload ALL the PNG files in this folder.
- Design a bearing: Metric / Imperial toggle at the top of every calculator (inches, °F, lb, psi, ft/min). Your choice is remembered. Inputs convert when you toggle, results, checks, machining table, copied text and the drawing follow the unit. The STEP file is always in millimetres.

VESCO INTELLIGENCE - deploy notes

UPLOAD TO THE REPO ROOT (Add file > Upload files > drag the files in, not a folder, not the zip > Commit changes)
  app.js, style.css, index.html, manifest.json   replace the old ones
  datasheets.json    NEW: the 11 data sheet PDFs, stored into Firebase from the Admin screen
  samples.json       the 10 sample applications (optional, loaded from Admin)
  config.js          Firebase details. Skip it if your live one already works.
  firestore.rules    reference copy of the security rules (see step 2)

STEPS
  1. Unzip, upload the files above, commit.
  2. Firebase console > Firestore Database > Rules: paste firestore.rules, replace ADMIN_EMAIL with your
     lowercase admin email, Publish. REQUIRED: the new "datasheets" rule lives here.
  3. Wait a minute, hard-refresh. On a phone, close and reopen the app.
  4. Admin > Data sheets > "Store the included PDFs in Firebase" (one tap, stores all 11 PDFs).
     Use "Replace PDF" beside any material to swap in a newer sheet later.
  5. Admin > Data > "Load 10 sample applications" if you want example records.

KEEP IN THE REPO (not in this zip): vesco-intelligence-logo-header.png, icon-192.png, icon-512.png

THIS UPDATE
  - Tools > Design a bearing now has four calculators in one place: Industrial, Pump, Marine rudder, Marine stern.
    Results list matches Vesconite's own calculator (expansion gap, interference fit, bore closure, additional and assembled clearance,
    fitted ID, press fit force estimate, OD after dry-ice cooling).
  - STEP files rebuilt as proper solid B-reps (planes, cylinders, cones with seam edges; grooves as flat faces).
  - Vesconite 3D colour darkened. Container ship easter egg removed.
Upload app.js and style.css. Firestore rules are unchanged. Delete textures.js from the repo if it is still there.

RULES CHANGED: republish firestore.rules in Firebase (adds the scores collection for the leaderboard). Remember to put your admin email in it.
