# Book My Tanker
1. Install Node.js 18+ and VS Code
2. `npm install` then `npm run dev` — open the URL on your Android phone (same Wi-Fi) in Chrome; location needs HTTPS or localhost, so use `npm run build` and host on Netlify/Vercel for GPS on a phone.
3. Chrome menu → "Add to Home screen" installs it like an app.
4. APK: `npm i @capacitor/core @capacitor/cli @capacitor/android && npx cap init "Book My Tanker" com.bookmytanker.app --web-dir dist && npm run build && npx cap add android && npx cap sync && npx cap open android` (Android Studio → Build APK).
Demo OTP: 123456. Data is stored in localStorage; replace TANKERS and the OTP/wallet logic with a real backend before launch.
