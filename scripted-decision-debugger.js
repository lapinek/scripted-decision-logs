/**
 * Displays scripted decision log messages in a named pop-up window and/or in the login screen.
 *
 * @see [ScriptTextOutputCallback]{@link https://backstage.forgerock.com/docs/am/7/authentication-guide/authn-supported-callbacks.html#backchannel-callbacks}
 *
 * @see [TextOutputCallback]{@link https://backstage.forgerock.com/docs/am/7/authentication-guide/authn-supported-callbacks.html#read-only-callbacks}
 *
 * You can change the pop-up CSS by adding style definitions to the style array.
 * You can change the log messages presentation in other ways by changing the script array items.
 * You can change the initial pop-up window dimensions by modifying the debuggerWindowWidth and debuggerWindowHeight parameters.
 *
 * @param {object} options
 * @param {array} options.logs An array of logs.
 * @param {string} [options.popupTitle=Debugger] Window title for the pop-up window.
 * @param {boolean} [options.useDebugParameter]
 * Require "debug" parameter in the URL query string for displaying the log messages in the browser.
 * For example, &debug=true.
 * No "debug" parameter, no value provided, or a falsy value (for example, &debug=false) will allow to bypass the logger.
 * This will not affect the use of  the logger.error(String message) method:
 * @param {boolean} [options.noLoggerError] Do NOT output the logs with the logger.error(String message) method.
 * If not provided or falsy, each log message will be outputted with the logger object method.
 * @param {boolean} [options.noPopup] Do NOT show logs in a pop-up window.
 * @param {boolean} [options.noText] Do NOT show current log in the login screen.
 * CAUTION: the callbacks form will auto-submit if no login form callbacks are detected!
 * Make sure your journey has another stopping point (that is, a node with a callback) to avoid loops on failed login.
 *
 * @example
 * showLogs({
 *     logs: messagesArray,
 *     // popupTitle: 'Debugger',
 *     // useDebugParameter: true,
 *     // noLoggerError: true,
 *     // noPopup: true,
 *     // noText: true
 * })
 *
 * @returns {undefined} The function sends callbacks to the client side, but otherwise, returns nothing.
 *
 * @author Konstantin Lapine <Konstantin.Lapine@forgerock.com>
 * @version 0.3.2
 * @license MIT
 */
function showLogs (options) {
    /**
     * Ensures options.logs is an array.
     */
    if (!Array.isArray(options.logs)) {
        options.logs = [options.logs]
    }

    var frJava = JavaImporter(
        org.forgerock.openam.auth.node.api.Action
    )

    if (!options.noLoggerError) {
        options.logs.forEach(function (log) {
            logger.error(String(log))
        })
    }

    var debug = callbacks.isEmpty() && options.logs.length && !(options.noPopup && options.noText)

    if (options.useDebugParameter) {
        var debugParameter = requestParameters.get('debug')

        debug = debug && debugParameter && ['false', 'null', 'undefined'].indexOf(String(debugParameter.toArray()[0])) === -1
    }

    /**
     * Sends callbacks to the client on the first visit, and if there is something to show.
     */
    if (debug) {
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
            var popupTitle = options.popupTitle || 'Debugger'

            script.push("var p = open('', 'debuggerWindow', 'scrollbars=yes, width=' + " + debuggerWindowWidth + " + ', height=' + " + debuggerWindowHeight + ")")

            script.push("p.document.write('<p>' + Date() + '</p>')")

            script.push("p.document.title = '" + popupTitle + "'")

            options.logs.forEach(function (log) {
                /**
                 * Tries to determine if the log content deserves JSON formatting on the client side.
                 */
                try {
                    var typeofJson = typeof JSON.parse(JSON.stringify(log))

                    if (typeofJson === 'object') {
                        script.push("p.document.write('<pre>' + JSON.stringify(" + JSON.stringify(log) + ", null, 4) + '</pre>')")
                    } else {
                        throw new Error('Log cannot be parsed as a JSON object: ' + typeofJson)
                    }
                } catch (e) {
                    // logger.error(e)

                    script.push("p.document.write('<div>" + String(log).split("'").join("\\'") + "</div>')")
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
             * Auto-submit the callbacks form, if no text is to be displayed in the login screen.
             * CAUTION: might create a loop on login failure IF there are no login form callbacks detected!
             *
             */
            if (options.noText) {
                script.push("if (!document.querySelector('div[role=\"alert\"], div[role=\"presentation\"]')) { \n\
                    document.querySelector('button[type=\"submit\"]').click() \n\
                }")
            }

            return script.join('\n')
        }

        /**
         * Defines text content to be displayed in the login screen.
         *
         * @returns {string}
         */
        function getTextContent () {
            var content = []

            content.push('<div style="text-align: left; margin-bottom: 8px;">')
            content.push(options.logs.join('</div><div style="text-align: left; margin-bottom: 8px;">'))
            content.push('</div>')

            return content.join('')
        }

        /**
         * Defines a script to allow HTML to be displayed in the login screen.
         *
         * @returns {string}
         */
        function getTextContentModifierScript() {
            var script = []

            script.push("var alertElements = document.querySelectorAll('div[role=\"alert\"], div[role=\"presentation\"]')")
            script.push(
                "Array.prototype.slice.call(alertElements).forEach(function (e) { \n\
                    if (/^(\\s)*<(?!!)/.test(e.textContent)) { \n\
                        e.innerHTML = e.textContent \n\
                    } \n\
                })"
            )

            return script.join('\n')
        }

        var frJavaCallbacks = JavaImporter(
            com.sun.identity.authentication.callbacks.ScriptTextOutputCallback,
            javax.security.auth.callback.TextOutputCallback
        )

        var callbacksToSend = []
        if (!options.noPopup) {
            callbacksToSend.push(frJavaCallbacks.ScriptTextOutputCallback(
                getPopupScript()
            ))
        }
        if (!options.noText) {
            callbacksToSend.push(frJavaCallbacks.TextOutputCallback(
                frJavaCallbacks.TextOutputCallback.ERROR,
                getTextContent()
            ))

            callbacksToSend.push(frJavaCallbacks.ScriptTextOutputCallback(
                getTextContentModifierScript()
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
