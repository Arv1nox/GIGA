# GIGAribo

GIGAribo is a home-services marketplace app for Naga City. People can browse local services (roofing, plumbing, cleaning, electrical, landscaping and more), save favourites, add services to their requests, and check out with a preferred date, time and payment option.

Website:[(https://gigaribo-3l6b.onrender.com)](https://gigaribo-3l6b.onrender.com)

Built with React Native and Expo (Expo Router), with Supabase for accounts. It runs on the web and on phones through Expo Go.

## Features

- Loading screen with the GIGAribo logo, then a Get started page
- Sign up, sign in and sign out with Supabase email and password accounts
- Browse services by category, search and explore
- Service details with ratings and a starting price
- Favourites and Requests tabs
- "Request added" popup after adding a service
- Checkout with date, time slot, payment option and promo code (demo)
- Account page with profile details and settings
- Light and dark mode

## Tech stack

- Expo SDK 57, React Native 0.86, Expo Router
- Supabase Auth (`@supabase/supabase-js`)
- AsyncStorage for local data (requests, favourites, profile)
- TypeScript

## Getting started

Requirements: Node.js and npm.

1. Install dependencies:

   ```sh
   cd GIGAribo-Mobile
   npm install
   ```

2. Create a `.env` file next to `package.json`:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
   ```

   - Use only the base project URL. Do not add `/rest/v1/` at the end.
   - Use the publishable (anon) key. Never use the `service_role` key in the app.
   - Do not commit `.env`. It is already in `.gitignore`.

3. Start the app:

   ```sh
   npm run web      # open in the browser
   npm start        # Expo dev menu; scan the QR code with Expo Go
   ```

   After changing `.env`, restart with `npx expo start -c` so the new values load.

## Supabase setup

- Authentication > Sign In / Providers > Email: turn on the Email provider.
- Confirm email: turn it off for quick testing, or keep it on and set up custom SMTP (for example Resend with a verified domain) under Authentication > Emails > SMTP Settings. Without custom SMTP, Supabase only sends a few emails per hour and only to your team members.
- Authentication > URL Configuration: set the Site URL and Redirect URLs to your deployed site.

## Deploying the web app

The web app builds to static files and is hosted as a static site (for example on Render).

- Build command: `npm install && npx expo export --platform web`
- Publish directory: `dist`
- Environment variables: set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the host's settings. They are read at build time, so redeploy after changing them.
- Add a rewrite rule `/*` to `/index.html` so refreshing a page does not return "Not Found".

## Project structure

```
GIGAribo-Mobile/
  app/          Screens and routes (index = loading screen, welcome = Get started)
  components/   Shared UI (MarketplaceUI, Toast, ...)
  constants/    Colours, services and prices
  context/      Auth and marketplace state
  lib/          Supabase client and web-safe alert helper
  assets/       Images and logos
```

## Demo notes

- Services, ratings, reviews and prices are sample content.
- Requests, favourites, checkout choices and profile details are saved locally on the device or browser.
- No provider booking or real payment processing is connected. Checkout is a preview.

## Logo files

- `assets/images/logo.png`: full logo shown on the loading screen
- `assets/images/logo-icon.png`: small square logo shown next to the app name
- `assets/images/icon.png`: app icon
