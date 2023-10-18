/**
 * @file Provide a function for debugging in the UI
 * and an example of its use
 * in a Scripted Decision Node script
 * in ForgeRock Access Management (AM).
 *
 * @author Konstantin Lapine <Konstantin.Lapine@forgerock.com>
 * @version 0.3.6
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
     * You can save log messages as a JSON stringified array
     * in the `sharedState` object up the authentication journey,
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
 * Display scripted decision log messages (logs) in a named pop-up window and/or in the login screen.
 * @see [ScriptTextOutputCallback]{@link https://backstage.forgerock.com/docs/am/7.1/authentication-guide/authn-supported-callbacks.html#backchannel-callbacks} (ForgeRock documentation).
 * @see [TextOutputCallback]{@link https://backstage.forgerock.com/docs/am/7.1/authentication-guide/authn-supported-callbacks.html#read-only-callbacks} (ForgeRock documentation).
 *
 * You can change the pop-up CSS and the initial pop-up window dimensions
 * by modifying arguments for [getPopupScript(options)]{@link #showLogs..getPopupScript} (inner method) in the debugger code.
 * @param {object} [options={}]
 * @param {string[]|string} [options.logs="No log information has been provided."] An array of logs or a single string representing a log.
 * @param {boolean} [options.noPopup] Do NOT show logs in the pop-up window.
 * @param {boolean} [options.noText] Do NOT show current log in the login screen.
 * CAUTION: the callbacks form will auto-submit if no login form callbacks are detected!
 * In that case, make sure your journey has another stopping point (that is, a node with a callback) to avoid loops on failed login.
 * @param {string} [options.popupTitle=Debugger] Window title for the pop-up window.
 * @param {boolean} [options.noLoggerError] Do NOT output the logs with the `logger.error(String message)` method.
 * If not provided or falsy, each log will be outputted with the logger object method.
 * @param {boolean} [options.useDebugParameter]
 * Require `debug` parameter in the authentication journey URL query string for displaying the logs in the browser.
 * If `useDebugParameter` is `true`, then in order for the debugger to be used
 * the `debug` parameter needs to be present in the URL,
 * and its value needs to be a truthy one; for example, `&debug=true`.
 * Applying `useDebugParameter` will not affect the use of the `logger.error(String message)` method.
 * @returns {undefined} The function sends callbacks to the client side, but otherwise, returns nothing.
 * After the callbacks are completed, the function will exit the script setting its outcome to "true".
 * Thus, "true" is the expected outcome to be added to the scripted decision node that is using this code.
 */
function showLogs (options) {
    var getPopupScript;
    var getTextContent;
    var getTextContentModifierScript;
    var processLog;
    var logs;
    var noPopup;
    var noText;
    var popupTitle;
    var noLoggerError;
    var useDebugParameter;

    options = options || {};

    logs = options.logs || 'No log information has been provided.';
    noPopup = options.noPopup;
    noText = options.noText;
    popupTitle = options.popupTitle || 'Debugger';
    noLoggerError = options.noLoggerError;
    useDebugParameter = options.useDebugParameter;

    /**
     * Ensure `logs` is an array.
     */
    if (!Array.isArray(logs)) {
        logs = [logs];
    }

    var frJava = JavaImporter(
        org.forgerock.openam.auth.node.api.Action
    );

    if (!noLoggerError) {
        logs.forEach(function (log) {
            logger.error(String(log));
        });
    }

    var debug = callbacks.isEmpty() && logs.length && !(noPopup && noText);

    if (useDebugParameter) {
        var debugParameter = requestParameters.get('debug');

        debug = debug && debugParameter && ['false', 'null', 'undefined'].indexOf(String(debugParameter.toArray()[0])) === -1;
    }

    /**
     * Send callbacks to the client on the first visit and if there is something to show.
     */
    if (debug) {
        /**
         * Apply additional processing to individual log content
         * for displaying in different screens.
         *
         * @param {object} [options]
         * @param {object|string} [options.log]
         * @param {object} [options.container] An object with HTML element definition for the log content.
         * @param {string} options.container.tagName
         * @param {string} [options.container.class]
         * @param {string} [options.container.style]
         *
         * @returns {string|undefined} A string representing the HTML element with the log content,
         * or undefined if no log content is provided.
         */
        processLog = function (options) {
            var stringsToReplace;
            var processedLog;

            options = options || {};

            options.container = options.container || {
                tagName: 'div',
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
                            options.log = '<pre>\' + JSON.stringify(' + JSON.stringify(options.log) + ', null, 4) + \'</pre>';
                        } else {
                            options.log = '<pre>' + JSON.stringify(options.log, null, 4) + '</pre>';
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

                    options.log = String(options.log);

                    Object.keys(stringsToReplace).forEach(function (key) {
                        options.log = options.log.split(key).join(stringsToReplace[key]);
                    });
                }
            }

            processedLog = '<' + options.container.tagName;
            if (options.container.class) {
                processedLog += ' class="' + options.container.class + '"';
            }
            if (options.container.style) {
                processedLog += ' style="' + options.container.style + '"';
            }
            processedLog += '>' + options.log + '</' + options.container.tagName + '>';

            return processedLog;
        };

        /**
         * Define a script to run on the client side.
         * @param {object} [options]
         * @param {string|number} [options.debuggerWindowWidthExpression=(screen.availWidth - innerWidth)]
         * Define the initial pop-up window width with JavaScript code to run on the client side or a hardcoded value.
         * By default, it will try to size it to fill the remaining space on the screen on left from the (parent) login window.
         * @param {string|number} [options.debuggerWindowHeightExpression=screen.availHeight]
         * Define the initial pop-up window height with JavaScript code to run on the client side or a hardcoded value.
         * By default, it will try to use all available screen height.
         * @param {string[]} [options.css=[ "* { font-family: 'Open Sans', sans-serif }", "p.date {color: green}", "div.log {margin-bottom: 8px;}" ]]
         * Internal CSS to be applied in the debugger window.
         * @returns {string} The script.
         */
        getPopupScript = function (options) {
            var script = [];

            options = options || {};
            options.debuggerWindowWidthExpression = options.debuggerWindowWidthExpression || '(screen.availWidth - innerWidth)';
            options.debuggerWindowHeightExpression = options.debuggerWindowHeightExpression || 'screen.availHeight';
            if (!options.css) {
                options.css = [];
                options.css.push('* { font-family: "Open Sans", sans-serif }');
                options.css.push('p.date {color: green}');
                options.css.push('div.log {margin-bottom: 8px;}');
            }

            /**
             * Create a pop-up window.
             */
            script.push('var p = open(\'\', \'debuggerWindow\', \'scrollbars=yes, width=\' + ' + options.debuggerWindowWidthExpression + ' + \', height=\' + ' + options.debuggerWindowHeightExpression + ');');

            /**
             * Add CSS to the pop-up window.
             */
            script.push('var style = p.document.createElement(\'style\');');

            /**
             * Write logs.
             */
            script.push('p.document.write(\'<p class="date">\' + Date() + \'</p>\');');
            script.push('p.document.title = "' + popupTitle + '";');
            logs.forEach(function (log) {
                var processedLog = String(processLog({
                    scripted: true,
                    log: log,
                    container: {
                        tagName: 'div',
                        class: 'log'
                    }
                }));

                script.push('p.document.write(\'' + processedLog + '\');');
            });
            script.push('p.document.body.scrollTop = p.document.body.scrollHeight;');
            script.push('style.type = "text/css";');
            script.push('style.appendChild(p.document.createTextNode(\'' + options.css.join(' ') + '\'));');
            script.push('p.document.head.appendChild(style);');

            /**
             * Auto-submit the callbacks form if no text is to be displayed in the login screen.
             * CAUTION: might create a loop on login failure IF there are no login form callbacks detected!
             */
            if (noText) {
                script.push('if (!document.querySelector(\'div[role="alert"], div[role="presentation"]\')) { \n\
                    document.querySelector(\'button[type="submit"]\').click(); \n\
                }');
            }

            return script.join('\n');
        };

        /**
         * Define text content to be displayed in the login screen.
         * @returns {string}
         */
        getTextContent = function () {
            var content = [];

            logs.forEach(function (log) {
                content.push(String(processLog({
                    log: log,
                    container: {
                        tagName: 'div',
                        style: 'text-align: left; margin-bottom: 8px;'
                    }
                })));
            });

            return content.join('');
        };

        /**
         * Define a script to allow log content HTML to be displayed in the login screen.
         * @returns {string}
         */
        getTextContentModifierScript = function () {
            var script = [];

            script.push('var alertElements = document.querySelectorAll(\'div[role="alert"], div[role="presentation"], div[class~="alert"]\');');
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
        if (!noPopup) {
            callbacksToSend.push(frJavaCallbacks.ScriptTextOutputCallback(
                getPopupScript()
            ));
        }
        if (!noText) {
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
