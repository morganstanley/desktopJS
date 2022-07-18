![desktopJS](https://raw.githubusercontent.com/wiki/MorganStanley/desktopJS/images/logo.png)
==========
![Lifecycle Active](https://badgen.net/badge/Lifecycle/Active/green)
[![npm version](https://badge.fury.io/js/%40morgan-stanley%2Fdesktopjs.svg)](https://www.npmjs.com/package/@morgan-stanley/desktopjs)
[![Build Status](https://github.com/MorganStanley/desktopJS/actions/workflows/continuous-integration.yml/badge.svg?event=push)](https://github.com/MorganStanley/desktopJS/actions/workflows/continuous-integration.yml)
[![codecov](https://codecov.io/gh/MorganStanley/desktopJS/branch/main/graph/badge.svg)](https://codecov.io/gh/MorganStanley/desktopJS)

desktopJS is a common API across multiple HTML5 containers. By programming to a
common API, applications can target multiple HTML5 containers without change. Detecting
what container in which you are hosted, desktopJS provides shims and polyfills to
bridge the common API to the underlying container.  The goal is to help applications be
container agnostic and provide portability when multiple container deployments are desired.

Usage
---------------

The first step is to simply [resolve](http://opensource.morganstanley.com/desktopJS/modules/_desktopjs_src_registry_.html#resolvecontainer) the current [container](http://opensource.morganstanley.com/desktopJS/classes/_desktopjs_src_container_.container.html). This enumerates
all registered containers (including your own custom container or derived custom implementations) and
returns the container implementation that matches.

```
var container = desktopJS.resolveContainer();
console.log("Container: " + container.hostType);
```

Interact with the [container](http://opensource.morganstanley.com/desktopJS/classes/_desktopjs_src_container_.container.html) via a single api instead of having conditional code or applications
based on deployment.

```
container.addTrayIcon({ icon: 'assets/img/application.png', text: 'Example' }, () => {
	console.log("Icon clicked");
});
```

Building
-------
The library uses gulp and rollup for building.  All build dependencies are included as
devDependencies and are installed during npm install.

```
$ npm install
```

Build the project.  This runs static analysis, unit tests and bundles the output with
rollup.

```
$ npm run build && npm test
```

For those using [Visual Studio Code](https://code.visualstudio.com/), tasks.json has a build task.

Development
-----------

### Local Hosting

To run the examples or to manually test scenarios in each container, there is a gulp task providing
a local server with live reload.  This can be run directly via gulp or through npm.

```
$ npm start
```

This is configured to listen at [http://localhost:8000](http://localhost:8000) and will reload upon
any change to the project build output under /dist or the web example under /examples/web.  All of the
included examples make use of this example application to showcase the portability of one
codebase.

### Unit tests

The tests can be run independent of the build.

```
$ npm test
```

A task is provided for [Visual Studio Code](https://code.visualstudio.com/) users that can be launched
from the command palette via

```
>Tasks: Run Test Task
```

or it is recommended to define a custom keyboard binding.

```
{
    "key": "ctrl+shift+t",
    "command": "workbench.action.tasks.test"
}
``` 

Examples
--------
Examples showcasing usage of desktopJS for various containers and scenarios can be found under
the [examples](https://github.com/MorganStanley/desktopJS/tree/main/examples) directory.

