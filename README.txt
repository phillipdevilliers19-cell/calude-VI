VESCO INTELLIGENCE - deploy notes

UPLOAD TO THE REPO ROOT (Add file > Upload files > drag the files in, not a folder, not the zip > Commit changes)
  app.js, style.css, index.html, manifest.json   replace the old ones
  textures.js        NEW: 3D material textures and colours (built from your Vesconite and Hilube photos)
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
