# Samosa Hut Static Digital Menu

This version is built with plain HTML, CSS, JavaScript and JSON. It is optimized for mobile phones and can be hosted directly from GitHub using Cloudflare Pages.

## Files

- `index.html` — website structure
- `styles.css` — mobile-first layout, branding and animations
- `script.js` — categories, search, swiping and slide transitions
- `menu.json` — all menu categories, items, prices and notices
- `manifest.webmanifest` — installable app settings
- `service-worker.js` — offline caching and faster repeat visits
- `images/` — add your logo and food pictures here

The `images` folder contains a hidden `.gitkeep` placeholder because Git does not save completely empty folders. Delete `.gitkeep` after adding your first image if you want.

## Add your branding images

The website automatically looks for:

- `images/logo.png` — opening-page and header icon
- `images/wordmark.png` — horizontal “Samosa Hut” header image

If these files are missing, a text fallback is displayed instead of a broken image.

## Add product images

1. Put an optimized `.webp` image inside the `images` folder.
2. Open `menu.json`.
3. Find the correct item and enter its image path:

```json
{
  "name": "Loaded Naan Taco",
  "price": "$10.95",
  "imageSlot": true,
  "image": "images/loaded-naan-taco.webp"
}
```

Recommended image settings:

- Format: WebP
- Shape: square (1:1)
- Size: 700 × 700 px
- File size: preferably under 200 KB

Leave `"image": ""` to keep an empty framed image box.

## Update prices or menu items

All menu information is stored in `menu.json`. Keep valid JSON formatting:

- Use double quotation marks.
- Put a comma between entries.
- Do not put a comma after the last entry in a list.

You can validate the file at [jsonlint.com](https://jsonlint.com/) before uploading changes.

## Upload to GitHub

1. Create a new GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Make sure `index.html` is at the top level—not inside another folder.
4. Commit the files.

## Connect GitHub to Cloudflare Pages

1. Open Cloudflare and go to **Workers & Pages**.
2. Create a new **Pages** application and connect your GitHub repository.
3. Choose **None** as the framework preset.
4. Leave the build command empty.
5. Set the output directory to `.` (the repository root).
6. Deploy.

No Node.js, npm installation or build command is required.

## Test locally

Opening `index.html` directly may prevent the browser from reading `menu.json`. Run a small local web server instead:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## Refreshing the offline cache

When making major design changes, update the cache name at the top of `service-worker.js`:

```js
const CACHE_NAME = "samosa-hut-menu-v2";
```

This tells customers’ phones to download the new version.
