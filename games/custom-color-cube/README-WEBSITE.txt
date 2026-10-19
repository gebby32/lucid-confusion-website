CCCP — Custom Color Cube Puzzle · Website version
==================================================

Upload the CONTENTS of this folder to any directory on the web server, e.g.
  https://lucidconfusion.gg/arcade/cccp/
All paths are relative, so any subdirectory works. Open that address in a browser.

Requirements
  • Must be served over http(s) (any static web server). It will not run by
    double-clicking index.html — use the Portable version for that.
  • No build step, server code or database. No external requests (fonts, logo,
    solver are all included).
  • .js files must be served as JavaScript (standard on every web server).
  • If the site sends a Content-Security-Policy, it must allow 'self' for
    script-src and worker-src (the puzzle solver runs in a Web Worker file).

Keeping it independent of the website
  The game is a complete page of its own (own HTML, CSS and scripts). The
  recommended way to put it inside a Demo Arcade page is an iframe, which
  keeps the website's CSS/scripts and the game fully separate:

    <iframe src="/arcade/cccp/" title="CCCP — Custom Color Cube Puzzle"
            style="width:100%; height:100vh; border:0; display:block"
            allow="autoplay; fullscreen"></iframe>

  Saved data uses keys starting with "cccp." (localStorage) and the
  IndexedDB database "cccp-assets", so it will not collide with site data.

Adding content later
  • Music: put files in audio/lucid-radio/ and audio/confusion-radio/ and list
    them in audio/stations.json (see audio/README.txt). No rebuild needed.
  • Backgrounds: put images in assets/backgrounds/ and list them in
    assets/backgrounds/backgrounds.json. No rebuild needed.

Testing on phones/tablets before upload
  From the project folder run:  npm run serve:devices
  then open the "Network" address it prints on a device on the same Wi-Fi.
