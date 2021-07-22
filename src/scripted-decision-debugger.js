/**
 * @file Provide a function for debugging in the UI
 * and an example of its use
 * in a Scripted Decision Node script
 * in ForgeRock Access Management (AM).
 *
 * @author Konstantin Lapine <Konstantin.Lapine@forgerock.com>
 * @version 0.3.3
 * @license MIT
 */

// An example of sending log messages to the debugger function: START
(function () {
    var logs = [];

    logs.push('Debugger: ');

    // . . .

    logs.push('sharedState: ' + sharedState);
    logs.push('transientState: ' + transientState);

    /**
     * You can save logs as a JSON stringified array
     * in the sharedState object up the authentication journey,
     * and consume them in the debugger node.
     */
    var savedLogs = sharedState.get('logs');
    if (savedLogs) {
        logs = logs.concat(JSON.parse(savedLogs));
    } else {
        logs.push('No additional logs were saved in the sharedState object by preceding nodes.');
    }

    showLogs({
        logs: logs,
        // noPopup: true,
        // noText: true,
        // popupTitle: 'Debugger',
        // useDebugParameter: true,
        // noLoggerError: true
    });
}());
// An example of sending log messages to the debugger function: END

/**
 * Display scripted decision log messages in a named pop-up window and/or in the login screen.
 *
 * @see [ScriptTextOutputCallback]{@link https://backstage.forgerock.com/docs/am/7.1/authentication-guide/authn-supported-callbacks.html#backchannel-callbacks}.
 * @see [TextOutputCallback]{@link https://backstage.forgerock.com/docs/am/7.1/authentication-guide/authn-supported-callbacks.html#read-only-callbacks}.
 *
 * You can change the pop-up CSS by adding style definitions to the style array.
 * You can change the log messages presentation in other ways by changing the script array items.
 * You can change the initial pop-up window dimensions by modifying the debuggerWindowWidthExpression and debuggerWindowHeightExpression variables.
 * @see getPopupScript
 *
 * @param {object} options
 * @param {array} options.logs An array of logs.
 * @param {boolean} [options.noPopup=undefined] Do NOT show logs in a pop-up window.
 * @param {boolean} [options.noText=undefined] Do NOT show current log in the login screen.
 * CAUTION: the callbacks form will auto-submit if no login form callbacks are detected!
 * Make sure your journey has another stopping point (that is, a node with a callback) to avoid loops on failed login.
 * @param {string} [options.popupTitle=Debugger] Window title for the pop-up window.
 * @param {boolean} [options.noLoggerError=undefined] Do NOT output the logs with the logger.error(String message) method.
 * If not provided or falsy, each log message will be outputted with the logger object method.
 * @param {boolean} [options.useDebugParameter=undefined]
 * Require "debug" parameter in the URL query string for displaying the log messages in the browser.
 * For example, &debug=true.
 * If there is no "debug" parameter, or no value or a falsy value is provided (for example, &debug=false), the debugger will not be used.
 * This will not affect the use of  the logger.error(String message) method.
 *
 * @returns {undefined} The function sends callbacks to the client side, but otherwise, returns nothing.
 * After the callbacks are completed, the function will exit the script setting its outcome to "true".
 * Thus, "true" is the expected outcome to be added to the scripted decision node that is using this code.
 */
function showLogs (options) {
    var getPopupScript;
    var getTextContent;
    var getTextContentModifierScript;
    var processLog;

    /**
     * Ensure options.logs is an array.
     */
    if (!Array.isArray(options.logs)) {
        options.logs = [options.logs];
    }

    var frJava = JavaImporter(
        org.forgerock.openam.auth.node.api.Action
    );

    if (!options.noLoggerError) {
        options.logs.forEach(function (log) {
            logger.error(String(log));
        });
    }

    var debug = callbacks.isEmpty() && options.logs.length && !(options.noPopup && options.noText);

    if (options.useDebugParameter) {
        var debugParameter = requestParameters.get('debug');

        debug = debug && debugParameter && ['false', 'null', 'undefined'].indexOf(String(debugParameter.toArray()[0])) === -1;
    }

    /**
     * Send callbacks to the client on the first visit,
     * and if there is something to show.
     */
    if (debug) {
        processLog = function (options) {
            var stringsToReplace;
            var log;

            options = options || {};

            options.container = options.container || {
                tag: 'div',
                style: 'text-align: left; margin-bottom: 8px;'
            };

            if (options.log) {
                /**
                 * Try to determine if the log content deserves JSON representation.
                 */
                try {
                    var typeofJson = typeof JSON.parse(JSON.stringify(options.log));

                    if (typeofJson === 'object') {
                        if (options.scripted) {
                            log = '<pre>\' + JSON.stringify(' + JSON.stringify(options.log) + ', null, 4) + \'</pre>';
                        } else {
                            log = '<pre>' + JSON.stringify(options.log, null, 4) + '</pre>';
                        }
                    } else {
                        throw new Error('Log cannot be parsed as a JSON object: ' + typeofJson);
                    }
                } catch (e) {
                    // logger.error(e)

                    stringsToReplace = {};

                    if (options.scripted) {
                        stringsToReplace['\''] = '\\\'';
                    }

                    stringsToReplace['\n'] = '<br/>';

                    log = String(options.log);
                    Object.keys(stringsToReplace).forEach(function (key) {
                        log = log.split(key).join(stringsToReplace[key]);
                    });
                }
            }

            log = '<' + options.container.tag + ' style="' + options.container.style + '">' + log + '</' + options.container.tag + '>';

            return log;
        };

        /**
         * Define a script to run on the client side.
         *
         * @returns {string}
         */
        getPopupScript = function () {
            var script = [];

            /**
             * Define the initial pop-up window dimensions with a JavaScript code to run on the client side.
             *
             * By default, it will be sized to fill the remaining space on the screen
             * left from the (parent) login window.
             *
             * You can use hardcoded values instead.
             */
            var debuggerWindowWidthExpression = '(screen.availWidth - innerWidth)';
            var debuggerWindowHeightExpression = 'screen.availHeight';
            var popupTitle = options.popupTitle || 'Debugger';

            script.push('var p = open(\'\', \'debuggerWindow\', \'scrollbars=yes, width=\' + ' + debuggerWindowWidthExpression + ' + \', height=\' + ' + debuggerWindowHeightExpression + ');');

            script.push('p.document.write(\'<p>\' + Date() + \'</p>\');');

            script.push('p.document.title = "' + popupTitle + '";');

            options.logs.forEach(function (log) {
                var processedLog = String(processLog({
                    scripted: true,
                    log: log
                }));

                script.push('p.document.write(\'' + processedLog + '\');');
            });

            script.push('p.document.body.scrollTop = p.document.body.scrollHeight;');

            /**
             * The CSS to be applied in the pop-up window.
             */
            var style = [];
            style.push('* { font-family: "Open Sans", sans-serif }');
            style.push('p {color: green}');
            style.push('div {margin-bottom: 8px}');

            script.push('var style = document.createElement(\'style\');');
            script.push('style.type = "text/css";');
            script.push('style.appendChild(document.createTextNode(\'' + style.join(' ') + '\'));');
            script.push('p.document.head.appendChild(style);');

            /**
             * Auto-submit the callbacks form if no text is to be displayed in the login screen.
             * CAUTION: might create a loop on login failure IF there are no login form callbacks detected!
             */
            if (options.noText) {
                script.push('if (!document.querySelector(\'div[role="alert"], div[role="presentation"]\')) { \n\
                    document.querySelector(\'button[type="submit"]\').click(); \n\
                }');
            }

            return script.join('\n');
        };

        /**
         * Define text content to be displayed in the login screen.
         *
         * @returns {string}
         */
        getTextContent = function () {
            var content = [];

            options.logs.forEach(function (log) {
                content.push(String(processLog({
                    log: log
                })));
            });

            return content.join('');
        };

        /**
         * Define a script to allow HTML to be displayed in the login screen.
         *
         * @returns {string}
         */
        getTextContentModifierScript = function () {
            var script = [];

            script.push('var alertElements = document.querySelectorAll(\'div[role="alert"], div[role="presentation"]\');');
            script.push(
                'Array.prototype.slice.call(alertElements).forEach(function (e) { \n\
                    if (/^(\\s)*<(?!!)/.test(e.textContent)) { \n\
                        e.innerHTML = e.textContent; \n\
                    } \n\
                })'
            );

            return script.join('\n');
        };

        var frJavaCallbacks = JavaImporter(
            com.sun.identity.authentication.callbacks.ScriptTextOutputCallback,
            javax.security.auth.callback.TextOutputCallback
        );

        var callbacksToSend = [];
        if (!options.noPopup) {
            callbacksToSend.push(frJavaCallbacks.ScriptTextOutputCallback(
                getPopupScript()
            ));
        }
        if (!options.noText) {
            callbacksToSend.push(frJavaCallbacks.TextOutputCallback(
                frJavaCallbacks.TextOutputCallback.ERROR,
                getTextContent()
            ));

            callbacksToSend.push(frJavaCallbacks.ScriptTextOutputCallback(
                getTextContentModifierScript()
            ));
        }

        action = frJava.Action.send.apply(
            null,
            callbacksToSend
        ).build();
    } else {
        action = frJava.Action.goTo('true').build();
    }
}