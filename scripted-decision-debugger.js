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
 *
 * @author Konstantin Lapine <Konstantin.Lapine@forgerock.com>
 * @version 0.1.0
 * @license MIT
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
