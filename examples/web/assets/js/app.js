var container;
var snapAssist;

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

var fpsCount, fpsOut;

function updatefps() {
	fpsCount++;
	if (fpsOut) {
		$("#fps").html(fpsOut + " fps");
	}
	requestAnimationFrame(updatefps);
}

setInterval(() => {
	fpsOut = fpsCount;
	fpsCount = 0
}, 1000);

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

/*
// Provide polyfill for electron notifications.  here is an example using electron-notify
desktopJS.Electron.ElectronContainer.prototype.showNotification = function (title, options) {
	notifier = (this.isRemote) ? this.electron.require("electron-notify") : require("electron-notify");

	notifier.notify({
		title: title,
		text: options.body,
		onClickFunc: function () { options["notification"].onclick(); }
	});
};
*/

document.addEventListener("DOMContentLoaded", function (event) {
	updatefps();

	container = desktopJS.resolveContainer({node: true});

	container.ready().then(() => {
		hostName.innerHTML = container.hostType + " &#8226; " + container.uuid + " &#8226; " + desktopJS.version;

		$("#button-joingroup").prop("disabled", !container.getCurrentWindow().allowGrouping);
		$("#button-leavegroup").prop("disabled", !container.getCurrentWindow().allowGrouping);

		container.addListener("window-created", (e) => container.log("info", "Window created: " + e.window + ", " + e.windowId + ", " + e.windowName));
		container.addListener("layout-loaded", (e) => container.log("info", "Layout loaded"));
		container.addListener("layout-saved", (e) => container.log("info", "Layout saved"));

		desktopJS.Container.addListener("window-created", (e) => container.log("info", "Window created - static (Container): " + e.windowId + ", " + e.windowName));
		desktopJS.ContainerWindow.addListener("window-created", (e) => container.log("info", "Window created - static (ContainerWindow): " + e.windowId + ", " + e.windowName));
		desktopJS.Container.addListener("layout-saved", (e) => container.log("info", "Layout saved - static: " + e.layoutName));
		desktopJS.Container.addListener("layout-loaded", (e) => container.log("info", "Layout loaded - static: " + e.layoutName));

		desktopJS.ContainerWindow.addListener("window-joinGroup", (e) => container.log("info", "grouped " + JSON.stringify(e)));
		desktopJS.ContainerWindow.addListener("window-leaveGroup", (e) => container.log("info", "ungrouped" + JSON.stringify(e)));

		subscribe();

		// If url is provided a hash, try to navigate to bootstrap tab if exists
		var activeTab = $('[href="' + location.hash + '"]');
		activeTab && activeTab.tab('show');

		// Enable popovers
		$('[data-toggle="popover"]').popover();

		if (container.getCurrentWindow().id === "desktopJS") {
			snapAssist = new desktopJS.SnapAssistWindowManager(container,
				{
					windowStateTracking: desktopJS.WindowStateTracking.Main | desktopJS.WindowStateTracking.Group
				});
		}
	});
});

openWindowButton.onclick = function () {
	container.createWindow("http://localhost:8000",
		{
			resizable: true,
			x: 10, y: 10,
			width: 850, height: 500,
			minWidth: 200, minHeight: 100, maxWidth: 850, maxHeight: 600,
			taskbar: true,
			minimizable: true, maximizable: true,
			alwaysOnTop: false, center: false
		}).then(win => childWindow = win);
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

$("#button-flash").click(function() {
	container.getCurrentWindow().flash(true, {});
});

$("#button-joingroup").click(function() {
	container.getCurrentWindow().joinGroup(container.getMainWindow());
});

$("#button-leavegroup").click(function() {
	container.getCurrentWindow().leaveGroup();
});

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

/** Invoked by window layout saving to maintain state specific to this window */
function getState() {
	return { value: "Foo" };
}

/** Invoked by window layout loading to restore state specific to this window */
function setState(state) {
	this.container.log("info", state);
}
