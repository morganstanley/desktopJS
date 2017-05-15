var container = desktopJS.resolveContainer();

var hostName = document.getElementById('hostName');
var btnOpenWindow = document.getElementById('button-open-window');
var btnToggleVisibility = document.getElementById('button-toggle-visiblity');
var btnNotification = document.getElementById('button-notification');
var btnTrayIcon = document.getElementById('button-tray-icon');
var btnChildFocus = document.getElementById('button-child-focus');
var btnScreenshot = document.getElementById('button-screenshot');
var previewImage = document.getElementById('image-preview');

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
	hostName.innerHTML = container.hostType + "<br />" + container.uuid
});

var childWindow;

btnOpenWindow.onclick = function () {
	childWindow = container.showWindow("child.html",
		{
			resizable: true,
			x: 10, y: 10,
			width: 500, height: 300,
			minWidth: 200, minHeight: 100, maxWidth: 800, maxHeight: 500,
			taskbar: true, icon: "assets/img/application.png",
			minimizable: true, maximizable: true,
			alwaysOnTop: false, center: false,
		});
};

btnToggleVisibility.onclick = function () {
	childWindow.isShowing().then(function (showing) {
		if (showing) {
			childWindow.hide();
		} else {
			childWindow.show();
		}
	});
};

btnNotification.onclick = function () {
	container.showNotification({ title: "Title", message: "Message", url: "notification.html" });
};

btnTrayIcon.onclick = function () {
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

btnChildFocus.onclick = function () {
	childWindow.show()
		.then(childWindow.focus());
};

btnScreenshot.onclick = function () {
	container.getMainWindow().getSnapshot().then(function (data) {
		previewImage.src = data;
	}).catch(function (error) { window.alert(error); });
};
