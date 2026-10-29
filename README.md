# Memories album ✨

## Setup (10 min, all free)
1. https://console.firebase.google.com -> Add project (Spark plan = free).
2. Build -> Firestore Database -> Create (production mode).
3. Build -> Authentication -> Get started -> Email/Password -> enable. Then Users -> Add user (your admin email + password).
4. Project settings -> Your apps -> Web (</>) -> copy the config into `firebase-config.js`.
5. Firestore -> Rules -> paste `firestore.rules`, replace both `YOUR_ADMIN_EMAIL` with your admin email, Publish.
6. Authentication -> Settings -> Authorized domains -> add your GitHub Pages domain (e.g. yourname.github.io).
7. Upload everything to a GitHub repo, enable Pages. Admin lives at `/admin.html`.

## Notes
- Photos are shrunk in the browser and saved inside Firestore, so you never need the paid Storage plan.
- Pink theme turns on by itself in October (see `theme.js`). To preview: run `document.documentElement.classList.add('october')` in the console.
- Visitors can only create *pending* items; only your admin email can approve, deny or delete.

## Photo of the Year
In admin -> Approved, press "Photo of <year>" on any approved memory. One winner per year (picking a new one replaces the old). The year comes from the photo's submit date. Re-paste firestore.rules after updating.
