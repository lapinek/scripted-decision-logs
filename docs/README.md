<a name="showLogs"></a>

## showLogs([options]) ⇒ <code>undefined</code>
Display scripted decision log messages (logs) in a named pop-up window and/or in the login screen.

**Kind**: global function  
**Returns**: <code>undefined</code> - The function sends callbacks to the client side, but otherwise, returns nothing.
After the callbacks are completed, the function will exit the script setting its outcome to "true".
Thus, "true" is the expected outcome to be added to the scripted decision node that is using this code.  
**See**

- [ScriptTextOutputCallback](https://backstage.forgerock.com/docs/am/7.1/authentication-guide/authn-supported-callbacks.html#backchannel-callbacks) (ForgeRock documentation).
- [TextOutputCallback](https://backstage.forgerock.com/docs/am/7.1/authentication-guide/authn-supported-callbacks.html#read-only-callbacks) (ForgeRock documentation).

You can change the pop-up CSS and the initial pop-up window dimensions
by modifying arguments for [getPopupScript(options)](#showLogs..getPopupScript) (inner method) in the debugger code.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> | <code>{}</code> |  |
| [options.logs] | <code>Array.&lt;string&gt;</code> \| <code>string</code> | <code>&quot;No log information has been provided.&quot;</code> | An array of logs or a single string representing a log. |
| [options.noPopup] | <code>boolean</code> |  | Do NOT show logs in the pop-up window. |
| [options.noText] | <code>boolean</code> |  | Do NOT show current log in the login screen. CAUTION: the callbacks form will auto-submit if no login form callbacks are detected! In that case, make sure your journey has another stopping point (that is, a node with a callback) to avoid loops on failed login. |
| [options.popupTitle] | <code>string</code> | <code>&quot;Debugger&quot;</code> | Window title for the pop-up window. |
| [options.noLoggerError] | <code>boolean</code> |  | Do NOT output the logs with the `logger.error(String message)` method. If not provided or falsy, each log will be outputted with the logger object method. |
| [options.useDebugParameter] | <code>boolean</code> |  | Require `debug` parameter in the authentication journey URL query string for displaying the logs in the browser. If `useDebugParameter` is `true`, then in order for the debugger to be used the `debug` parameter needs to be present in the URL, and its value needs to be a truthy one; for example, `&debug=true`. Applying `useDebugParameter` will not affect the use of the `logger.error(String message)` method. |


* [showLogs([options])](#showLogs) ⇒ <code>undefined</code>
    * [~processLog([options])](#showLogs..processLog) ⇒ <code>string</code> \| <code>undefined</code>
    * [~getPopupScript([options])](#showLogs..getPopupScript) ⇒ <code>string</code>
    * [~getTextContent()](#showLogs..getTextContent) ⇒ <code>string</code>
    * [~getTextContentModifierScript()](#showLogs..getTextContentModifierScript) ⇒ <code>string</code>

<a name="showLogs..processLog"></a>

### showLogs~processLog([options]) ⇒ <code>string</code> \| <code>undefined</code>
Apply additional processing to individual log content
for displaying in different screens.

**Kind**: inner method of [<code>showLogs</code>](#showLogs)  
**Returns**: <code>string</code> \| <code>undefined</code> - A string representing the HTML element with the log content,
or undefined if no log content is provided.  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> |  |
| [options.log] | <code>object</code> \| <code>string</code> |  |
| [options.container] | <code>object</code> | An object with HTML element definition for the log content. |
| options.container.tagName | <code>string</code> |  |
| [options.container.class] | <code>string</code> |  |
| [options.container.style] | <code>string</code> |  |

<a name="showLogs..getPopupScript"></a>

### showLogs~getPopupScript([options]) ⇒ <code>string</code>
Define a script to run on the client side.

**Kind**: inner method of [<code>showLogs</code>](#showLogs)  
**Returns**: <code>string</code> - The script.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  |  |
| [options.debuggerWindowWidthExpression] | <code>string</code> \| <code>number</code> | <code>&quot;(screen.availWidth - innerWidth)&quot;</code> | Define the initial pop-up window width with JavaScript code to run on the client side or a hardcoded value. By default, it will try to size it to fill the remaining space on the screen on left from the (parent) login window. |
| [options.debuggerWindowHeightExpression] | <code>string</code> \| <code>number</code> | <code>&quot;screen.availHeight&quot;</code> | Define the initial pop-up window height with JavaScript code to run on the client side or a hardcoded value. By default, it will try to use all available screen height. |
| [options.css] | <code>Array.&lt;string&gt;</code> | <code>[ &quot;* { font-family: &#x27;Open Sans&#x27;, sans-serif }&quot;, &quot;p.date {color: green}&quot;, &quot;div.log {margin-bottom: 8px;}&quot; ]</code> | Internal CSS to be applied in the debugger window. |

<a name="showLogs..getTextContent"></a>

### showLogs~getTextContent() ⇒ <code>string</code>
Define text content to be displayed in the login screen.

**Kind**: inner method of [<code>showLogs</code>](#showLogs)  
<a name="showLogs..getTextContentModifierScript"></a>

### showLogs~getTextContentModifierScript() ⇒ <code>string</code>
Define a script to allow log content HTML to be displayed in the login screen.

**Kind**: inner method of [<code>showLogs</code>](#showLogs)  
