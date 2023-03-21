desktopJS and [OpenFin](https://openfin.co/ "OpenFin")
======================================================

It is possible to use desktopJS from an application hosted within OpenFin.

To launch the example manually, run OpenFin providing the application manifest
as the argument.  It is expected that openfin-cli is installed globally and available
on the path.

<blockquote>
   [examples/openfin] $ openfin -l -c app.json
</blockquote>

For convenience within Visual Studio Code, there is a task provided - "Launch OpenFin" in which
you can execute from the command palete or define a keybinding.

Platform configuration example:

<blockquote>
   [examples/openfin] $ openfin -l -c platform.json
</blockquote>