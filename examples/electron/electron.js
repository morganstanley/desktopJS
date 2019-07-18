const desktopJS = require('@morgan-stanley/desktopjs');
const djsElectron = require('@morgan-stanley/desktopjs-electron');
const electron = require('electron');
const app = electron.app;

let mainWindow;
let snapAssist;

function createWindow() {
    let container = desktopJS.resolveContainer({node: true});

    desktopJS.ContainerWindow.addListener("window-created", (e) => container.log("info", "Window created - static (ContainerWindow): " + e.windowId + ", " + e.windowName));
	desktopJS.ContainerWindow.addListener("window-joinGroup", (e) => container.log("info", "grouped " + JSON.stringify(e)));
	desktopJS.ContainerWindow.addListener("window-leaveGroup", (e) => container.log("info", "ungrouped" +  JSON.stringify(e)));
    
    snapAssist = new desktopJS.SnapAssistWindowManager(container,
        {
            windowStateTracking: desktopJS.WindowStateTracking.Main | desktopJS.WindowStateTracking.Group
        });

    container.createWindow('http://localhost:8000', { name: "desktopJS", main: true }).then(win => mainWindow = win);
 
    let trayIcon = electron.nativeImage.createFromPath(__dirname + '\\..\\web\\favicon.ico');
    container.addTrayIcon({ icon: trayIcon, text: 'ContainerPOC' }, () => {
        mainWindow.isShowing().then((showing) => {
            if (showing) {
                mainWindow.hide();
            } else {
                mainWindow.show();
            }
        });
    }, [{ label: "Exit", click: (menuItem) => app.quit() }]);

	container.ipc.subscribe("stock.selected", function (event, message) {
		container.log("info", "Message received: " + message.symbol);
    });
}

app.on("ready", createWindow);

