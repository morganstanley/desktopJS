const desktopJS = require('../../dist/desktop.js');
const electron = require('electron');
const app = electron.app;

let mainWindow;

function createWindow() {
    let container = desktopJS.resolveContainer();

    mainWindow = container.createWindow('http://localhost:8000');
 
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
		console.log("Message received: " + message.symbol);
    });

    /*
    mainWindow.on("closed", function () {
        mainWindow = null;
    });
    */
}

app.on("ready", createWindow);

