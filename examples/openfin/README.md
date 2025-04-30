desktopJS and [OpenFin](https://openfin.co/ "OpenFin")
======================================================

It is possible to use desktopJS from an application hosted within OpenFin.

To launch the example manually, run OpenFin providing the application manifest
as the argument.

<blockquote>
   [examples/openfin] $ npx openfin-cli -l -c app.json
</blockquote>

For convenience within Visual Studio Code, there is a task provided - "Launch OpenFin" in which
you can execute from the command palete or define a keybinding.

Platform configuration example:

<blockquote>
   [examples/openfin] $ npx openfin-cli -l -c platform.json
</blockquote>