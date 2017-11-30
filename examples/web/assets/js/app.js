var container = desktopJS.resolveContainer();

var hostName = document.getElementById('hostName');
var openWindowButton = document.getElementById('button-open-window');
var visibilityButton = document.getElementById('button-toggle-visiblity');
var notificationButton = document.getElementById('button-notification');
var trayIconButton = document.getElementById('button-tray-icon');
var childFocusButton = document.getElementById('button-child-focus');
var screenshotButton = document.getElementById('button-screenshot');
var subscribeButton = document.getElementById('button-subscribe');
var publishButton = document.getElementById('button-publish');
var unsubscribeButton = document.getElementById('button-unsubscribe');
var publishText = document.getElementById('input-publish');
var messageBusText = document.getElementById('text-messagebus');
var previewImage = document.getElementById('image-preview');
var loadlayoutButton = document.getElementById('button-loadlayout');
var savelayoutButton = document.getElementById('button-savelayout');

var subscription;
var childWindow;

/*
// Provide polyfill of browser getSnapshot.  Here is an example using html2canvas
desktopJS.Default.DefaultContainerWindow.prototype.getSnapshot = function () {
	return new Promise((resolve, reject) => {
		html2canvas(window.document.body).then(canvas => {
			resolve(canvas.toDataURL());
		});
	});
};
*/

desktopJS.Electron.ElectronContainer.prototype.showNotification = function (title, options) {
	notifier = (this.isRemote) ? this.electron.require("electron-notify") : require("electron-notify");

	notifier.notify({
		title: title,
		text: options.body,
		onClickFunc: function () { options["notification"].onclick(); }
	});
};

document.addEventListener("DOMContentLoaded", function (event) {
	hostName.innerHTML = container.hostType + "<br />" + container.uuid;

	container.addListener("window-created", (e) => console.log("Window created: " + e.window + ", " + e.windowId + ", " + e.windowName));
	container.addListener("layout-loaded", (e) => console.log("Layout loaded"));
	container.addListener("layout-saved", (e) => console.log("Layout saved"));

	desktopJS.Container.addListener("window-created", (e) => console.log("Window created - static (Container): " + e.windowId + ", " + e.windowName));
	desktopJS.ContainerWindow.addListener("window-created", (e) => console.log("Window created - static (ContainerWindow): " + e.windowId + ", " + e.windowName));
	desktopJS.Container.addListener("layout-saved", (e) => console.log("Layout saved - static: " + e.layoutName));
	desktopJS.Container.addListener("layout-loaded", (e) => console.log("Layout loaded - static: " + e.layoutName));

	subscribe();
});

openWindowButton.onclick = function () {
	childWindow = container.createWindow("http://localhost:8000",
		{
			resizable: true,
			x: 10, y: 10,
			width: 500, height: 500,
			minWidth: 200, minHeight: 100, maxWidth: 800, maxHeight: 600,
			taskbar: true, icon: "assets/img/application.png",
			minimizable: true, maximizable: true,
			alwaysOnTop: false, center: false
		});
};

visibilityButton.onclick = function () {
	if (!childWindow) {
		return;
	}

	childWindow.isShowing().then(function (showing) {
		if (showing) {
			childWindow.hide();
		} else {
			childWindow.show();
		}
	});
};

notificationButton.onclick = function () {
	Notification.requestPermission(function(permission) {
		if (permission === "granted") {
			var notification = new Notification("test", { body: "Message", url: "notification.html" });
			notification.onclick = () => window.alert("Notification clicked");
		}
	});
};

trayIconButton.onclick = function () {
	container.addTrayIcon({ icon: 'assets/img/application.png', text: 'ContainerPOC' }, function () {
		container.getMainWindow().isShowing().then(function (showing) {
			if (showing) {
				container.getMainWindow().hide();
			} else {
				container.getMainWindow().show();
			}
		});
	},
		[
			{ label: "Exit", click: function (menuItem) { window.alert(menuItem.label + " clicked"); } },
			{ label: "Test 1", icon: "assets/img/application.png", click: function (menuItem) { window.alert(menuItem.label + " clicked"); } },
			{ label: "Test 2", submenu: [{ label: "Foo", icon: "assets/img/application.png", click: function (menuItem) { window.alert(menuItem.label) } }], click: function (menuItem) { window.alert(menuItem.label + " clicked"); } }
		]);
};

childFocusButton.onclick = function () {
	childWindow.show()
		.then(childWindow.focus());
};

screenshotButton.onclick = function () {
	container.getCurrentWindow().getSnapshot().then(function (data) {
		previewImage.src = data;
	}).catch(function (error) { window.alert(error); });
};

subscribeButton.onclick = function () {
	subscribe();
};

function subscribe() {
	unsubscribe();

	container.ipc.subscribe("stock.selected", function (event, message) {
		messageBusText.innerHTML += "<br/>" + message.symbol;
	}).then(function (sub) {
		subscription = sub;
	});
}

publishButton.onclick = function () {
	container.ipc.publish("stock.selected", { symbol: publishText.value });
};

unsubscribeButton.onclick = function () {
	unsubscribe();
};

function unsubscribe() {
	if (subscription) {
		container.ipc.unsubscribe(subscription);
	}

	subscription = undefined;
}

loadlayoutButton.onclick = function () {
	container.loadLayout("Layout");
};

savelayoutButton.onclick = function () {
	container.saveLayout("Layout");
};
