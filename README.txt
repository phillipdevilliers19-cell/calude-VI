VESCO INTELLIGENCE - deploy notes

UPLOAD TO THE REPO ROOT (Add file > Upload files > drag the files in, not a folder, not the zip > Commit changes)
  index.html, app.js, style.css, manifest.json   replace the old ones
  samples.json                                   NEW: the 10 sample applications (loaded from Admin)
  config.js                                      Firebase details. Skip it if your live one already works.
  firestore.rules                                reference copy of the security rules (see step 2)

STEPS
  1. Unzip, upload the files above, commit.
  2. Firebase console > Firestore Database > Rules: paste firestore.rules, replace ADMIN_EMAIL with your
     lowercase admin email, Publish. REQUIRED: the new "delete team member" rule lives here.
  3. Wait a minute, hard-refresh. On a phone, close and reopen the app.
  4. Admin > Data > "Load 10 sample applications" to fill the library with examples (removable in one tap).

OPTIONAL: official data sheet PDFs
  Download the PDFs from vesconite.com/design-and-technical and upload them to a folder named datasheets in the repo
  with these names: v.pdf (Vesconite), h.pdf (Hilube), s.pdf (Superlube), t150.pdf, t160.pdf, t230.pdf, f.pdf (Vescoflex).
  "Share PDF" then shares the official file. Without them it shares a clean copy of the property table.

KEEP IN THE REPO (not in this zip): vesco-intelligence-logo-header.png, icon-192.png, icon-512.png
