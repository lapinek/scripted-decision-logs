# Scripted Decision Debugger

The [scripted-decision-debugger.js](scripted-decision-debugger.js) code could be added to a scripted decision node script.

It contains a function which accepts an array of log messages to be displayed in a pop-up window and/or in the login screen during an authentication journey.

The pop-up window can display continuously the log data from the parent window, and serve as a log tailing tool.

You will need to allow pop-ups for your AM origin.

## Authentication Journey Example

<img alt="Journey with the Identify Existing User nodes and Scripted Decision Debuggers." src="README_files/Journey.Identify-Existing-User.Scripted-Decision-Debuggers.png" width="1024">

## Logs Output Example

<img alt="Debugging Output for the journey with the Identify Existing User nodes and Scripted Decision Debuggers." src="README_files/Journey.Identify-Existing-User.Debugging-Output.png" width="1024">

## AM Script Examples

Two example scripts are provided that were used in the above journey, both including the function copied from [scripted-decision-debugger.js](scripted-decision-debugger.js).

In both examples, logs are displayed in the pop-up window _and_ in the login screen, but using only one of the display options is also supported.

### Script 1

In the first script, which was associated with the SD Data Debugger nodes, the log messages are populated with generic data, that could be collected and displayed at different points in an authentication journey.

```javascript
// CUSTOM CODE

/**
 * Namespace for the script variables.
 */
var frScript = {}

/**
 * An array of messages, populated with the journey data.
 */
frScript.messages = []
frScript.messages.push('Data Debugger')
frScript.messages.push('sharedState: ' + sharedState)
frScript.messages.push('transientState: ' + transientState)

/**
 * Outputs the log messages on the server side.
 *
 * The same array of log messages could be printed out using the logger object methods.
 */
frScript.messages.forEach(function (message) {
    logger.error(String(message))
})

/**
 * Calls the function copied from scripted-decision-debugger.js.
 */
showLogs({
    logs: frScript.messages,
    showPopup: true,
    showText: true
})

// END OF CUSTOM CODE

// FUNCTION COPIED FROM scripted-decision-debugger.js

/**
 * Displays scripted decision log messages in a named pop-up window and/or in the login screen.
 *
 * @see [ScriptTextOutputCallback]{@link https://backstage.forgerock.com/docs/am/7/authentication-guide/authn-supported-callbacks.html#backchannel-callbacks}
 *
 * @see [TextOutputCallback]{@link https://backstage.forgerock.com/docs/am/7/authentication-guide/authn-supported-callbacks.html#read-only-callbacks}
 *
 * @example
 * showLogs({
 *     logs: frScript.messages,
 *     showPopup: true,
 *     showText: true
 * })
 *
 * You can change the pop-up CSS by adding style definitions to the style array.
 * You can change the log messages presentation in other ways by changing the script array items.
 * You can change the initial pop-up window dimensions by modifying the debuggerWindowWidth and debuggerWindowHeight parameters.
 *
 * @param {object} options
 * @param {array} options.logs An array of logs.
 * @param {boolean} [options.showPopup] Show logs in a pop-up window.
 * @param {boolean} [options.showText] Show current logs in the login screen.
 * @returns {undefined} The function sends callbacks to the client side, but otherwise, returns nothing.
 */
function showLogs (options) {
    var frJava = JavaImporter(
        org.forgerock.openam.auth.node.api.Action,
        com.sun.identity.authentication.callbacks.ScriptTextOutputCallback,
        javax.security.auth.callback.TextOutputCallback
    )

    /**
     * Sends callbacks to the client on the first visit, and if there is something to show.
     */
    if (callbacks.isEmpty() && options.logs.length && (options.showPopup || options.showText)) {
        /**
         * Defines a script to run on the client side.
         *
         * @returns {string}
         */
        function getPopupScript () {
            var script = []

            /**
             * Defines the initial pop-up window dimensions with a JavaScript code to run on the client side.
             *
             * By default, it will be sized to fill the remaining space
             * on the screen left from the (parent) login window.
             *
             * You can use hardcoded values instead.
             */
            var debuggerWindowWidth = '(window.screen.availWidth - window.innerWidth)'
            var debuggerWindowHeight = 'window.screen.availHeight'

            script.push("var p = open('', 'debuggerWindow', 'scrollbars=yes, width=' + " + debuggerWindowWidth + " + ', height=' + " + debuggerWindowHeight + ")")

            script.push("p.document.write('<p>' + Date() + '</p>')")

            options.logs.forEach(function (log) {
                /**
                 * Tries to determine if the content deserves JSON formatting on the client side.
                 */
                try {
                    var typeofJson = typeof JSON.parse(JSON.stringify(log))
                    if (typeofJson === 'object') {
                        script.push("p.document.write('<pre>' + JSON.stringify(" + JSON.stringify(log) + ", null, 4) + '</pre>')")
                    } else {
                        throw new Error('Not an object: ' + typeofJson)
                    }
                } catch (e) {
                    script.push("p.document.write('<div>" + log + "</div>')")
                }
            })

            script.push('p.document.body.scrollTop = p.document.body.scrollHeight')

            /**
             * The CSS to be applied in the pop-up window.
             */
            var style = []
            style.push('* { font-family: \'Open Sans\', sans-serif }')
            style.push('p {color: green}')
            style.push('div {margin-bottom: 8px}')

            script.push('var style = document.createElement("style")')
            script.push('style.type = "text/css"')
            script.push('style.appendChild(document.createTextNode("' + style.join(' ') + '"))');
            script.push('p.document.head.appendChild(style)')

            /**
             * You can bypass the callbacks login screen by submitting the form automatically.
             * However, if the journey comes to a Fail outcome, this might create a loop.
             * Make sure you have other stopping point (that is, a node with callbacks) before enabling.
             */
            // script.push("document.querySelector('button[type=\"submit\"]').click()")

            return script.join('\n')
        }

        /**
         * Defines text content to be displayed in the login screen.
         *
         * @returns {string}
         */
        function getTextContent () {
            return options.logs.join(' | ')
        }

        var callbacksToSend = []
        if (options.showPopup) {
                callbacksToSend.push(frJava.ScriptTextOutputCallback(
                getPopupScript()
            ))
        }
        if (options.showText) {
            callbacksToSend.push(frJava.TextOutputCallback(
                frJava.TextOutputCallback.ERROR,
                getTextContent()
            ))
        }

        action = frJava.Action.send.apply(
            null,
            callbacksToSend
        ).build()
    } else {
        action = frJava.Action.goTo('true').build()
    }
}
```

### Script 2

In the second script, which was associated with the SD Exception Debugger node, the log messages are populated with exceptions that might occur in an authentication journey.

```javascript
// CUSTOM CODE

/**
 * Namespace for the script variables.
 */
var frScript = {}

/**
 * An array of messages, populated with the journey data.
 */
frScript.messages = []
frScript.messages.push('Exceptions Debugger')

try {
    frScript.sharedStateKeys = sharedState.keySet()
} catch (e) {
    frScript.messages.push(e)
}

try {
    password = secrets.getGenericSecret("scripted.node.secret.id").getAsUtf8()
} catch(e) {
    frScript.messages.push(e)
}

/**
 * Outputs the log messages on the server side.
 *
 * The same array of log messages could be printed out using the logger object methods.
 */
frScript.messages.forEach(function (message) {
    logger.error(String(message))
})

/**
 * Calls function copied from the scripted-decision-debugger.js.
 */
showLogs({
    logs: frScript.messages,
    showPopup: true,
    showText: true
})

// END OF CUSTOM CODE

// FUNCTION COPIED FROM scripted-decision-debugger.js

/**
 * Displays scripted decision log messages in a named pop-up window and/or in the login screen.
 *
 * @see [ScriptTextOutputCallback]{@link https://backstage.forgerock.com/docs/am/7/authentication-guide/authn-supported-callbacks.html#backchannel-callbacks}
 *
 * @see [TextOutputCallback]{@link https://backstage.forgerock.com/docs/am/7/authentication-guide/authn-supported-callbacks.html#read-only-callbacks}
 *
 * @example
 * showLogs({
 *     logs: frScript.messages,
 *     showPopup: true,
 *     showText: true
 * })
 *
 * You can change the pop-up CSS by adding style definitions to the style array.
 * You can change the log messages presentation in other ways by changing the script array items.
 * You can change the initial pop-up window dimensions by modifying the debuggerWindowWidth and debuggerWindowHeight parameters.
 *
 * @param {object} options
 * @param {array} options.logs An array of logs.
 * @param {boolean} [options.showPopup] Show logs in a pop-up window.
 * @param {boolean} [options.showText] Show current logs in the login screen.
 * @returns {undefined} The function sends callbacks to the client side, but otherwise, returns nothing.
 */
function showLogs (options) {
    var frJava = JavaImporter(
        org.forgerock.openam.auth.node.api.Action,
        com.sun.identity.authentication.callbacks.ScriptTextOutputCallback,
        javax.security.auth.callback.TextOutputCallback
    )

    /**
     * Sends callbacks to the client on the first visit, and if there is something to show.
     */
    if (callbacks.isEmpty() && options.logs.length && (options.showPopup || options.showText)) {
        /**
         * Defines a script to run on the client side.
         *
         * @returns {string}
         */
        function getPopupScript () {
            var script = []

            /**
             * Defines the initial pop-up window dimensions with a JavaScript code to run on the client side.
             *
             * By default, it will be sized to fill the remaining space
             * on the screen left from the (parent) login window.
             *
             * You can use hardcoded values instead.
             */
            var debuggerWindowWidth = '(window.screen.availWidth - window.innerWidth)'
            var debuggerWindowHeight = 'window.screen.availHeight'

            script.push("var p = open('', 'debuggerWindow', 'scrollbars=yes, width=' + " + debuggerWindowWidth + " + ', height=' + " + debuggerWindowHeight + ")")

            script.push("p.document.write('<p>' + Date() + '</p>')")

            options.logs.forEach(function (log) {
                /**
                 * Tries to determine if the content deserves JSON formatting on the client side.
                 */
                try {
                    var typeofJson = typeof JSON.parse(JSON.stringify(log))
                    if (typeofJson === 'object') {
                        script.push("p.document.write('<pre>' + JSON.stringify(" + JSON.stringify(log) + ", null, 4) + '</pre>')")
                    } else {
                        throw new Error('Not an object: ' + typeofJson)
                    }
                } catch (e) {
                    script.push("p.document.write('<div>" + log + "</div>')")
                }
            })

            script.push('p.document.body.scrollTop = p.document.body.scrollHeight')

            /**
             * The CSS to be applied in the pop-up window.
             */
            var style = []
            style.push('* { font-family: \'Open Sans\', sans-serif }')
            style.push('p {color: green}')
            style.push('div {margin-bottom: 8px}')

            script.push('var style = document.createElement("style")')
            script.push('style.type = "text/css"')
            script.push('style.appendChild(document.createTextNode("' + style.join(' ') + '"))');
            script.push('p.document.head.appendChild(style)')

            /**
             * You can bypass the callbacks login screen by submitting the form automatically.
             * However, if the journey comes to a Fail outcome, this might create a loop.
             * Make sure you have other stopping point (that is, a node with callbacks) before enabling.
             */
            // script.push("document.querySelector('button[type=\"submit\"]').click()")

            return script.join('\n')
        }

        /**
         * Defines text content to be displayed in the login screen.
         *
         * @returns {string}
         */
        function getTextContent () {
            return options.logs.join(' | ')
        }

        var callbacksToSend = []
        if (options.showPopup) {
                callbacksToSend.push(frJava.ScriptTextOutputCallback(
                getPopupScript()
            ))
        }
        if (options.showText) {
            callbacksToSend.push(frJava.TextOutputCallback(
                frJava.TextOutputCallback.ERROR,
                getTextContent()
            ))
        }

        action = frJava.Action.send.apply(
            null,
            callbacksToSend
        ).build()
    } else {
        action = frJava.Action.goTo('true').build()
    }
}
```
