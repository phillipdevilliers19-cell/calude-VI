REVIEW, HISTORY, PERMISSIONS, PERSONAL THEME
- REVIEW BEFORE PUBLISHING: Admin > Permissions > "Review new applications" (Nobody / viewers / viewers and editors; default viewers). New applications from those people are saved as "In review": only the author and admins can see them. Admins approve or reject them in Admin > Overview > Awaiting review, or on the application itself. A rejection carries a note; the author edits and saves to send it again. Note: this hides them in the app. They are not hidden from a determined person using the database directly, because Firestore cannot filter a list by who is allowed to see each item.
- CHANGE HISTORY: every save is recorded (who, when, which fields, old and new text). Application page > History. People who can edit that application can restore an earlier version (text only, not photos). History is kept while the application exists.
- PERMISSIONS TAB: Admin > Permissions shows a grid of what viewers, editors and admins can do. It is read-only, apart from the review setting.
- PERSONAL THEME: Tools > Account > "Appearance on my login" (Match my device / Light / Dark), and the moon button in the header. It is saved on the person's login, so it follows them to every device. The admin default only applies to people who have never chosen.
- REPUBLISH firestore.rules (new rules for review, history and the theme field; replace ADMIN_EMAIL again).

LATEST: Admin > Activity has Export to Excel. Pick From and To dates (or Last 7 days / Last 30 days / This month / All time) and tap Export. You get an .xlsx with an Activity sheet (date, person, email, action, item, detail, with filters) and a Summary sheet (counts by person and by action). Up to 5,000 entries per export. Needs no new setup.

ADMIN REDESIGN + WHO CAN EDIT AN APPLICATION
- Admin is now organised into tabs: Overview (notifications and status), Team (search, pending people first), Appearance, Documents, Data sheets, Settings (features, backups, weekly digest, industries), Activity and Data. A summary strip at the top shows people, waiting, applications and OEM references. The Save settings bar appears only on the tabs that have settings, and says when there are unsaved changes.
- Editing applications: admins and editors can edit and delete every application. Viewers can capture new applications and edit (not delete) only the ones they added themselves (others show no Edit button). Applications created before owners were recorded (samples, imports) can be changed by admins and editors only. firestore.rules enforces this on the server, so REPUBLISH it.

LATEST: Customer-safe share links and QR codes are removed (the Share / QR button, the public share page and the Admin feature switch). firestore.rules no longer has a public 'shared' rule and stored files can now be read only by signed-in staff. Share PDF and Send to chat are the ways to share an application. You can delete the old 'shared' collection in the Firebase console (Firestore Database) if it exists.

LATEST: OEM references moved into the Library page (switch at the top: Applications / OEM references); the OEM tab is gone. The trophy cabinet has a Clear trophies button (asks first, resets your trophies on this device and in the saved score).

CHATS UPDATE: ATTACHMENTS, EDIT, DELETE, LEAVE, SEND TO CHAT
- Paperclip in a chat attaches a photo or any file up to 8 MB (photos are shrunk first). Tap a photo to view it, tap a file to download or share it. Files are stored inside the chat, so only people in the chat can read them.
- Your own messages have a small ... button: Edit (shows "edited") or Delete (leaves "This message was deleted" and removes the attached file).
- Options (top right of a chat): Add people, Rename group (groups only), Leave chat (posts "<name> left the chat"; you no longer see the chat).
- SEND TO CHAT: every time the app hands you a generated file (application PDF, customer portfolio, drawing PDF/SVG/STEP, data sheet) a small menu now offers "Open / share" or "Send to chat". Pick an existing chat or a person and add an optional note.
- REPUBLISH firestore.rules again (new rules for editing messages, files and leaving). Replace ADMIN_EMAIL with your lowercase admin email.

CHATS (private messages between staff)
- New "Chats" tab. Start a chat from the tab (New chat), or open any application and tap Message to chat about that exact application (the chat shows "About: <application>" with a link back to it). Pick one person for a direct chat, or several for a group (optional group name). Inside a chat, "Add people" brings more staff in; they can read the earlier messages.
- Unread messages: red number on the Chats tab, a red dot on the chat in the list, a card on Home, a pop-up when a message arrives while the app is open, and the app icon badge on iPhone/Android when installed. There are no notifications while the app is closed (that needs push, see earlier notes).
- Privacy: each chat can be read only by the people in it. The Firestore rules enforce this, so admins cannot read other people's chats in the app. (Whoever owns the Firebase project can still see all data in the Firebase console.)
- YOU MUST REPUBLISH firestore.rules (new /chats rules; replace ADMIN_EMAIL with your lowercase admin email again) or chats will show an error.
- Not included yet: editing or deleting messages, leaving a chat, photos in chats.

SHARE + WEEKLY DIGEST
- Every application page now has "Share PDF" (a designed PDF of just that application; tap once to build, again to open or share). Customer-safe links still use Share / QR.
- WEEKLY DIGEST EMAIL to all admins (new applications, top contributors, activity, who is waiting for approval). It runs from an admin's browser, so there is no server. Setup, using the same EmailJS account as the sign-up alert:
  1. In EmailJS create a second Email Template. Set "To Email" to {{to_email}}, Subject to {{subject}}, and put {{message}} in the body (choose plain text or turn off HTML escaping). Note its Template ID.
  2. Put that ID into config.js as emailjs.digest and upload config.js.
  3. Admin > Weekly digest: choose "Ask me on the Home screen" (a card appears when a week has passed), "Send automatically when an admin opens the app", or Off. Preview and Send now buttons are there too.
  It is not a true scheduler: if no admin opens the app, no digest goes out. A real scheduler would need a Firebase Cloud Function (paid plan).

LATEST: Trophies sit in the centre of a gap again (like coins) and are re-offered if missed. The cabinet is a compact shelf (tap a medallion for details) and is only reachable from the game's 🏅 button or leaderboard, not from Tools/Account.

LATEST: Trophies are now a challenge. Each run offers a trophy once, in one of four styles (hugging a shaft collar, floating between shafts at a random height, waving up and down, or dashing in fast). Miss it and you need another run. Pickup radius is smaller and the unlock message is a small toast, not a full banner.

BUSH HOP TROPHIES
- 20 equipment trophies (pump, propeller, excavator, crawler drill, Hamilton waterjet, vane motor, conveyor, drill seeder, double toggle jaw crusher, rudder, Pelton wheel, wind turbine, tractor, concrete mixer, gate valve, hydraulic cylinder, rail wagon, log grapple, clarifier, golden Hilube bush). Each appears in a shaft gap once its goal is met (score, coins in a run, or games played). Fly into it to unlock it.
- Cabinet: the medal button in the game, or Tools > Account > Trophy cabinet once you own one. Tap a name on the game leaderboard to see their cabinet. Saved in the existing scores collection, so no rules change.

NEW IN THIS UPDATE
- Sign-up is limited to @vesconite.com and @vesconite.co.za. New people verify their email (link sent by Firebase), then an admin approves them. The Firestore rules enforce this too, so REPUBLISH firestore.rules (replace ADMIN_EMAIL with your lowercase admin email again).
- Sign in / Create account show a spinner while working. "Forgot password?" sends a reset email.
- Names: asked at sign-up, editable in Tools > Account, shown in the team list, leaderboard, insights and activity log. Admins can add or rename anyone in Admin > Team.
- QuickDraw has a metric / imperial toggle (STEP files stay in mm).
- ADMIN EMAIL ALERT when someone signs up (free, takes 5 minutes):
  1. Make a free account at emailjs.com, add an Email Service (Gmail or Outlook) and note the Service ID.
  2. Create an Email Template. Set "To Email" to the admin address(es). Subject: New Vesco Intelligence sign-up. Body can use {{name}}, {{email}}, {{when}} and {{link}}. Note the Template ID.
  3. In Account > General copy your Public Key. In Account > Security, restrict allowed domains to your GitHub Pages address.
  4. Put the three values into config.js (service, template, key) and upload it. Leave them blank to switch the alert off.

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
