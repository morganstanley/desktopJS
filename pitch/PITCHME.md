<center>desktopJS</center>

---

Why web on desktop?

- Look and Feel
  - Not in a browser tab
  - Looks like other applications
  - Customizable window chrome
- Fine tuned window creation
- Window management
  - Docking
  - Layouts
- Tray icons
- Shortcut keys
- Notifications

---

Current State: API for each container

- Electron

```
var tray = new Tray("<path to icon>");
tray.setToolTip("MyApp");
tray.setContextMenu(Menu.buildFromTemplate({}));
tray.on('click', () => { /* callback */ });
```

- OpenFin

```
fin.desktop.Application.getCurrent()
    .setTrayIcon("<icon url>", (clickInfo) => { /* callback */ });
```

---

Can we make applications container agnostic?

---

What does desktopJS provide?

- Write once to a common API and host in any container
  - Electron
  - OpenFin
  - Browser
  - Pluggable architecture for your own
- Avoid lock-in
- Target one container internally and another externally

---

desktopJS: Single API for any container

```
container.addTrayIcon(
    {icon: 'favicon.ico', text: 'MyApp' },
    (clickInfo) => { /* callback */ });
```
