# Scripted Debugger for Authentication Trees (Journeys) in ForgeRock Access Management (AM)

## Overview

The [src/scripted-debugger.js](src/scripted-debugger.js) code could be used in a scripted decision node script for displaying debugging and other information captured during an authentication journey.

The scripted debugger code is a function accepting an array of individual messages (logs), which you need to create in the script. The function also accepts some options to control the logs output. The function, `showLogs(Object options)`, accepts all the arguments as a single configuration object. You can see the full specification in [docs > showLogs](docs/README.md#showlogs).

The logs information is displayed in a pop-up window and/or in the login screen during an authentication journey.

> You will need to allow pop-ups for your AM origin for the pop-up window to be displayed.

Information presented in the pop-up window will be continuously updated by instances of the scripted debugger. Thus, as long as the pop-up window stays open, it can serve as a log tailing tool.

Information displayed in the login screen, however, is provided by a single, currently executed instance of the scripted debugger.

Both display options are optional and work independently from each other.

The logs' data presentation can be changed by including HTML in the individual messages.

> It is also possible to change the overall appearance of logs with some basic JavaScript and CSS modifications made in the scripted debugger code.

By default, the logs will be also outputted with the `logger.error(String log)` method. This can be disabled in options.

Another option allows to accept a URL query string argument, `&debug=true|false`, added to the authentication journey URL. When accepted, this argument will respectively enable or disable scripted debugger output.

## How to make it work

* Copy the code from [src/scripted-debugger.js](src/scripted-debugger.js) and paste it in your scripted decision.

    The debugger function itself, as any [function statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function), can be placed at and called from any place in your script. Due to its size, it might be more convenient to place it at the bottom of your scripted decision.

    The provided in the source code example of calling `showLogs(Object options)` could be located and extended as needed for collecting log messages.

* In your scripted decision node script, create a variable containing an array of log messages or a single message.

* Using the example provided in the [src/scripted-debugger.js](src/scripted-debugger.js#L12) file, call `showLogs(Object options)` function, and pass in your log message(s) as the `options.logs` argument.

* In your authentication journey, add a scripted decision at a place where you want to output the content, and select the debugger script as the Script option. Add a "true" outcome to proceed with.

    > Optionally, you could collect exceptions, response codes, etc. encountered in different scripted decision nodes in an array saved as stringified JSON in `sharedState`. Then, in a scripted decision containing the scripted debugger code, you could parse this JSON and send the entire array content to `showLogs(Object options)` in a scripted decision at the desired place in your journey.
    >
    > For example:
    >
    > `A scripted decision without scripted debugger code:`
    >
    > ```javascript
    > var logs = [];
    >
    > (function () {
    >     // Custom code: start
    >     try {
    >         [ . . . ]
    >
    >         logs.push('Message 1');
    >
    >         [ . . . ]
    >
    >         logs.push('Message 2');
    >
    >         [ . . . ]
    >    } catch (e) {
    >         logs.push(e);
    >     }
    >
    >     outcome = 'true';
    >     // Custom code: end
    > }());
    >
    > /**
    >  * Concatenate current logs with the already existing ones in `sharedState`, or with an empty array if > sharedState doesn't have the "logs" key.
    >  */
    > sharedState.put('logs', JSON.stringify(JSON.parse(sharedState.get('logs') || '[]').concat(logs)));
    > ```
    >
    > `A scripted decision with scripted debugger code, later in the journey:`
    >
    > ```javascript
    > (function () {
    >     var logs = [];
    >
    >     logs.push('Message A');
    >
    >     /**
    >     * You can save log messages as a JSON stringified array
    >     * in the `sharedState` object up the authentication journey,
    >     * and consume them in the debugger node.
    >     */
    >     var savedLogs = sharedState.get('logs');
    >
    >     /**
    >      * Optionally, discard collected thus far logs after displaying them.
    >      */
    >     sharedState.put('logs', null);
    >
    >     /**
    >      * Merge logs from the current scripted decision and from the preceding ones.
    >      */
    >     if (savedLogs) {
    >         logs = logs.concat(JSON.parse(savedLogs));
    >     } else {
    >         logs.push('No additional logs were saved in the sharedState object by preceding nodes.');
    >     }
    >
    >     showLogs({
    >         logs: logs,
    >         // noPopup: true,
    >         // noText: true,
    >         // popupTitle: 'Debugger',
    >         // useDebugParameter: true,
    >         // noLoggerError: true
    >     });
    > }());
    >
    > // CONTENT FROM src/scripted-debugger.js:
    > ```

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

// CONTENT FROM src/scripted-debugger.js
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

// CONTENT FROM src/scripted-debugger.js
```
