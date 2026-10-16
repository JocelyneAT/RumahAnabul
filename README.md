# Happy Paws — dog rehoming community for Indonesia

A website where owners who can no longer keep their dog (moving, money problems, illness…)
can find adopters who really love dogs. Bahasa Indonesia by default, with an English toggle.

## What it does (Stage 1)
- **Browse** dogs looking for a home, filtered by province, size, age and sex
- **Owners** sign up, post their dog with a photo and its story, and see who applied
- **Adopters** sign up and apply with details about their home and experience, plus a pledge
  never to sell the dog or hand it over for consumption
- **Owners accept or decline** applications, then chat with the adopter on WhatsApp
- Owners mark a dog as *In progress* or *Adopted*

## How to open it
Double-click `index.html`. It starts in **demo mode**: the 8 dogs are examples, and anything
you add is saved only in your browser. To try the full flow, sign up as one user and post a
dog, then log out, sign up as a second user and apply for it.

## Connecting a real database (Supabase, free)
1. Create an account at https://supabase.com and make a new project.
2. Open **SQL Editor → New query**, paste everything from `supabase/schema.sql`, and click **Run**.
3. Open **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
4. Paste them into `js/config.js`.
5. Reload the site. The demo banner disappears, and accounts and dogs are now real and shared.

By default Supabase sends a confirmation email when someone signs up. You can turn this off
for testing under **Authentication → Providers → Email**.

## Files
- `index.html`: the page shell
- `js/app.js`: all pages (browse, dog profile, post a dog, dashboard, login)
- `js/api.js`: saving and loading data (demo mode or Supabase)
- `js/i18n.js`: all text in Bahasa Indonesia and English
- `js/data.js`: provinces, dropdown options, and the example dogs for demo mode
- `js/config.js`: your Supabase keys
- `css/style.css`: styling
- `supabase/schema.sql`: database tables and security rules

## Next stages
- **Stage 2:** adopter profiles, phone verification, a printable rehoming agreement
- **Stage 3:** follow-up photo updates after adoption, adopter reviews, reporting bad listings
