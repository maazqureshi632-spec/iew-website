INNOVATION ENGINEERING WORKS - WEBSITE
======================================

PAGES: index (Home), about, services, projects, clients, team, hse, contact (.html)
       The menu and footer are repeated in every page - if you change them, change all 8.

Open:  index.html  (double click) - works offline, no install needed.
(Stock photos load from Unsplash, so the internet must be on for them.)

FILES
  index.html          all pages/sections and text
  css/style.css       design (colors are at the top, under :root)
  js/main.js          animations (preloader, 3D hero, scroll effects)
  js/projects.js      PROJECT LIST - add new projects here (one line each)
  js/images.js        list of stock photos
  assets/logo.png     logo
  assets/clients/     28 client logos (from the company profile PDF)
  assets/img/         PUT YOUR OWN PHOTOS HERE

CHANGE A PHOTO
  Put your photo in assets/img/ with one of these names (.jpg / .webp / .png):
  hero, about, welding, fabrication, oil-gas, machining, threading, coating,
  crane, solar, pipeline, tank-repair, fire-safety, piping, safety
  Example: assets/img/hero.jpg  -> replaces the big first-screen photo.

ADD A NEW PROJECT
  In js/projects.js add a line at the top:
  ["15 Jan 2027","Project name","Scope of work","Client name",2.5],
  (last number = cost in PKR million). Total & year filters update automatically.

CHANGE COLORS
  css/style.css -> :root  ( --fire = orange, --ink = black, --bone = light )

GO LIVE (ieworkspk.com)
  Upload the whole folder to your hosting (cPanel > File Manager > public_html),
  or drag the folder onto app.netlify.com/drop for a free test link.
