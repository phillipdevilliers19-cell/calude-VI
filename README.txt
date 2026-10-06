VESCO INTELLIGENCE - deploy notes

FILES
  index.html, app.js, style.css, manifest.json   upload to the repo root (replace the old ones)
  config.js                                      Firebase details. Skip it if your live one already works.
  firestore.rules                                reference copy of the security rules (see step 2)

STEPS
  1. Unzip. In GitHub: Add file > Upload files > drag the files in (not a folder, not the zip) > Commit changes.
  2. Firebase console > Firestore Database > Rules: paste firestore.rules, replace ADMIN_EMAIL with your
     lowercase admin email, Publish. REQUIRED for the activity log (new "activity" rules).
  3. Wait a minute, hard-refresh. On a phone, close and reopen the app.

KEEP IN THE REPO (not in this zip): vesco-intelligence-logo-header.png, icon-192.png, icon-512.png
