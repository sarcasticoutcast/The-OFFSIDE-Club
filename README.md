# The Offside Club Website

Five pages: Home, About, Gallery, Register Team, Join. Plain HTML/CSS/JS, no build step, no dependencies.

```
index.html          home
about.html          the story
gallery.html        photos + upload panel
register-team.html  tournament team entry form
join.html           booking steps + membership form
style.css           all styling
app.js              nav, scroll animations, stat counter, gallery lightbox
pitch.svg           football-pitch background behind every page header
photos/             your images live here
```

## Get it live in 2 minutes (easiest option)

1. Go to **https://app.netlify.com/drop**
2. Drag this whole folder (the one with `index.html` in it) into the browser window
3. You'll get a live URL instantly, no account needed for the first deploy
4. To keep that URL permanently and be able to update it later, create a free Netlify account and claim the site (it'll prompt you)

## Alternative: GitHub Pages

1. Create a free GitHub account if you don't have one
2. Create a new repository, upload all these files into it
3. Go to the repo's Settings → Pages → set source to the main branch
4. GitHub gives you a live URL within a minute or two

## Things you can still customise

**1. The header background**
- Both forms are already wired to Formspree (`mykranqr`). Submissions arrive in that inbox.
- Every page header currently shows the pitch-markings graphic (`pitch.svg`).
- To use a real photo instead, drop one into `/photos` named `hero-bg.jpg`. It layers on top automatically, darkened so text stays readable. No code change needed.

**2. Adding photos to the gallery**
- Drop your image files into the `/photos` folder
- Open `gallery.html`, find the `const photos = [...]` list near the bottom, and add one line per photo, e.g.:
  `{ src: "photos/matchday-1.jpg", caption: "First game" },`
- Save and re-upload/redeploy

**3. The gallery upload button**
- The "Upload Photos" button currently points at the WhatsApp group.
- For proper drag-and-drop uploads, make a shared Google Photos album (album → Share → Get link → allow others to add photos), then paste that link into the `href` marked with a `SETUP:` comment in `gallery.html`.
- Note: the "Preview Mine" button shows photos in the grid on that visitor's device only. A static site has no server, so it cannot receive real uploads. The shared album is what makes them public.

## Notes

- Everything degrades safely without JavaScript: the pages render fully, only the animations and lightbox are skipped.
- Animations are disabled automatically for visitors who have "reduce motion" turned on.
