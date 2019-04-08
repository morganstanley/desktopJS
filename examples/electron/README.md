desktopJS and [Electron](https://electron.atom.io/ "Electron")
===============================================================

It is possible to use desktopJS within the main electron node process to author
container portable bootstraps or within the renderer to leverage desktop functionality
from your application code.

To launch the example manually, run electron within the examples/web directory providing
the electron directory as the argument. It is necessary to launch from the examples
directory to ensure assets used from examples/web are also within the scope of the
node process.

<blockquote>
   [examples/web] $ electron ../electron --enable-logging
</blockquote>

### Electron main

From your bootstrap, use the same consistent api as you would from your application.

```
const desktopJS = require('@morgan-stanley/desktopjs');
const djsElectron = require('@morgan-stanley/desktopjs-electron');
const app = electron.app;

let mainWindow;

function createWindow() {
    let container = desktopJS.resolveContainer();
    container.createWindow('http://localhost:8000').then(win => mainWindow = win);
}

app.on("ready", createWindow);
```

### Electron renderer

index.html

```
<html>
<head>
    <script type="text/javascript" src="desktop.js"></script>
	<script type="text/javascript" src="desktopjs-electron.js"></script>
    <script type="text/javascript" src="app.js"></script>
</head>
<body>
    <div id="hostName"></div>
    <br />
    <button id="button-open-window">Open Window</button>
</body>
</html>
```

app.js

```
var container = desktopJS.resolveContainer();

var hostName = document.getElementById('hostName');
var btnOpenWindow = document.getElementById('button-open-window');
var childWindow;

document.addEventListener("DOMContentLoaded", function (event) {
	hostName.innerHTML = container.hostType + "<br />" + container.uuid
});

btnOpenWindow.onclick = function () {
	container.createWindow("child.html",
		{
			resizable: true,
			x: 10, y: 10,
			width: 500, height: 300,
			minWidth: 200, minHeight: 100, maxWidth: 800, maxHeight: 500,
			taskbar: true, icon: "assets/img/application.png",
			minimizable: true, maximizable: true,
			alwaysOnTop: false, center: false,
		}).then(win => childWindow = win);
};
```

In order to show notifications while hosted in Electron, it is necessary for you as a
developer to provide a polyfill of showNotification.  This allows you the flexibility
to use the node module of your choice for displaying notifications. 

Here is an example polyfill using electron-notify.

```
desktopJS.Electron.ElectronContainer.prototype.showNotification = function(title, options) {
	notifier = (this.isRemote)
         ? this.electron.require("electron-notify")
         : require("electron-notify");

	notifier.notify({
		title: title,
		text: options.body
	});
};
```
