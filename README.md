# Scripted Debugger for Authentication Trees (Journeys) in ForgeRock Access Management (AM)

## Overview

The [src/scripted-debugger.js](src/scripted-debugger.js) code could be used in a scripted decision node script for displaying debugging and other information saved in the authentication journey context by this node or by other nodes already executed during the authentication.

The information is passed to the debugger as an array of individual messages (logs), which you need to create in the script.

The information is displayed in a pop-up window and/or in the login screen during an authentication journey.

> You will need to allow pop-ups for your AM origin.

Information displayed in the pop-up window will be continuously updated by instances of the scripted debugger. Thus, as long as the pop-up window stays open, it can serve as a log tailing tool.

Information displayed in the login screen is provided by a single instance of the scripted debugger—the one that is being currently executed.

Both display options are optional and work independently from each other.

The data presentation can be changed by including HTML in individual logs. It is also possible to change the overall appearance with some basic JavaScript and CSS modifications made in the debugger function code.

> In addition, by default, the logs will be outputted with the `logger.error(String log)` method. This can be disabled.

Optionally, you can enable control of this functionality with a URL query string parameter `&debug=true|false` added to the authentication journey URL.

See [docs > showLogs](docs/README.md#showlogs) for the supported options.

## How to make it work

* Copy the code from [src/scripted-debugger.js](src/scripted-debugger.js) and paste it at the bottom of your scripted decision.

    > The debugger function itself, as any [function statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function), can be placed at and called from any place in your script.

* In your scripted decision node script, create an array of log messages or choose a single message to be displayed in the browser.
* Using the example provided in the [src/scripted-debugger.js](src/scripted-debugger.js#L12) file, call `showLogs(Object options)` function, and pass in your log message(s) as the `options.logs` argument.
* In your authentication journey, add a scripted decision at a place where you want to output the content, and select the debugger script as the Script option. Add "true" outcome to proceed with.

    > Optionally, logs could be concatenated with additional information saved in the authentication journey context.
    >
    > For example, during development, you could collect exceptions, response codes, etc. in an array saved as stringified JSON in `sharedState`. Then, you could parse this JSON, and send the array content to `showLogs(Object options)` in a script at the end of your debugging journey.
    >
    > Doing so will allow to display logs saved in `sharedState` individually, without dumping out the entire state (or its key) as a string, which could be hard to read.
    >
    > A corresponding example is provided in the [src/scripted-debugger.js](src/scripted-debugger.js#L23) file.


## Examples

The two example scripts below were used in the following journey in `SD Data Debugger` and the `SD Exceptions Debugger` scripted decision (SD) nodes:

<img alt="Journey with the Identify Existing User nodes and Scripted Decision Debuggers." src="README_files/Journey.Identify-Existing-User.Scripted-Decision-Debuggers.png" width="1024">

In both scripts, logs are displayed in the pop-up window _and_ in the login screen, but using only one of the display options is also supported:

<img alt="Debugging Output for the journey with the Identify Existing User nodes and Scripted Decision Debuggers." src="README_files/Journey.Identify-Existing-User.Debugging-Output.png" width="1024">

Both of the scripts had the code copied and pasted from [src/scripted-debugger.js](src/scripted-debugger.js).

### Script 1: the SD Data Debugger script

In the first script, the log messages are populated with some generic data that could be collected and displayed at different points in an authentication journey.

```javascript
// CUSTOM CODE

/**
 * An array of log messages, populated with the journey data.
 */
var logs = []

logs.push('Data Debugger')
logs.push('sharedState: ' + sharedState)
logs.push('<div style="color: red;">ATTENTION!</div>')
logs.push('transientState: ' + transientState)

/**
 * Call the function copied from src/scripted-debugger.js.
 */
showLogs({
    logs: logs,
    // popupTitle: 'Debugger',
    // useDebugParameter: true,
    // noLoggerError: true,
    // noPopup: true,
    // noText: true
})

// END OF CUSTOM CODE

// CONTENT FROM src/scripted-debugger.js:
. . .
```

### Script 2: the SD Exceptions Debugger script

In the second script, the log messages are populated with some exceptions that might occur in an authentication journey.

```javascript
// CUSTOM CODE

/**
 * An array of log messages, populated with the journey data.
 */
var logs = []

logs.push('Exceptions Debugger')

try {
    sharedStateKeys = sharedState.keySet()
} catch (e) {
    logs.push(e)
}

try {
    password = secrets.getGenericSecret("scripted.node.secret.id").getAsUtf8()
} catch(e) {
    logs.push(e)
}

/**
 * Call the function copied from src/scripted-debugger.js.
 */
showLogs({
    logs: logs,
    // popupTitle: 'Debugger',
    // useDebugParameter: true,
    // noLoggerError: true,
    // noPopup: true,
    // noText: true
})

// END OF CUSTOM CODE

// CONTENT FROM src/scripted-debugger.js:
. . .
```
