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

desktopJS.Electron.ElectronContainer.prototype.showNotification = function (options) {
	notifier = (this.isRemote) ? this.electron.require("node-notifier") : require("node-notifier");

	notifier.notify({
		title: options.title,
		message: options.message
	});
};

document.addEventListener("DOMContentLoaded", function (event) {
	hostName.innerHTML = container.hostType + "<br />" + container.uuid;
	subscribe();
});

openWindowButton.onclick = function () {
	childWindow = container.showWindow("http://localhost:8000",
		{
			resizable: true,
			x: 10, y: 10,
			width: 500, height: 500,
			minWidth: 200, minHeight: 100, maxWidth: 800, maxHeight: 600,
			taskbar: true, icon: "assets/img/application.png",
			minimizable: true, maximizable: true,
			alwaysOnTop: false, center: false,
			name: "child"
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
	container.showNotification({ title: "Title", message: "Message", url: "notification.html" });
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
	container.getMainWindow().getSnapshot().then(function (data) {
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
