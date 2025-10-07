Title: chrome.devtools.panels

URL Source: https://developer.chrome.com/docs/extensions/reference/api/devtools/panels

Markdown Content:
chrome.devtools.panels
bookmark_border Stay organized with collections Save and categorize content based on your preferences.

## Description

Use the `chrome.devtools.panels` API to integrate your extension into Developer Tools window UI: create your own panels, access existing panels, and add sidebars.

Each extension panel and sidebar is displayed as a separate HTML page. All extension pages displayed in the Developer Tools window have access to all parts of the `chrome.devtools` API, as well as all other extension APIs.

You can use the [`devtools.panels.setOpenResourceHandler`](https://developer.chrome.com/docs/extensions/reference/api/devtools/panels#method-setOpenResourceHandler) method to install a callback function that handles user requests to open a resource (typically, a click a resource link in the Developer Tools window). At most one of the installed handlers gets called; users can specify (using the Developer Tools Settings dialog) either the default behavior or an extension to handle resource open requests. If an extension calls `setOpenResourceHandler()` multiple times, only the last handler is retained.

See [DevTools APIs summary](https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools) for general introduction to using Developer Tools APIs.

## Manifest

The following keys must be declared [in the manifest](https://developer.chrome.com/docs/extensions/mv3/manifest) to use this API.

`"devtools_page"`

## Example

The following code adds a panel contained in `Panel.html`, represented by `FontPicker.png` on the Developer Tools toolbar and labeled as _Font Picker_:

```
chrome.devtools.panels.create("Font Picker",
                              "FontPicker.png",
                              "Panel.html",
                              function(panel) { ... });
```

The following code adds a sidebar pane contained in `Sidebar.html` and titled _Font Properties_ to the Elements panel, then sets its height to `8ex`:

```
chrome.devtools.panels.elements.createSidebarPane("Font Properties",
  function(sidebar) {
    sidebar.setPage("Sidebar.html");
    sidebar.setHeight("8ex");
  }
);
```

The screenshot illustrates the effect this example would have on Developer Tools window:

![Image 1: Extension icon panel on DevTools toolbar](https://developer.chrome.com/static/docs/extensions/reference/api/devtools/panels/images/devtools-panels.png)

Extension icon panel on DevTools toolbar.

To try this API, install the [devtools panels API example](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/api-samples/devtools/panels) from the [chrome-extension-samples](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/api-samples) repository.

## Types

### Button

A button created by the extension.

#### Properties

- onClicked

Event<functionvoidvoid>
Fired when the button is clicked.

The `onClicked.addListener` function looks like:

(callback: function)=>{...}

    *   callback

function
The `callback` parameter looks like:

()=> void

- update

void
Updates the attributes of the button. If some of the arguments are omitted or `null`, the corresponding attributes are not updated.

The `update` function looks like:

(iconPath?: string, tooltipText?: string, disabled?: boolean)=>{...}

    *   iconPath

string optional
Path to the new icon of the button.

    *   tooltipText

string optional
Text shown as a tooltip when user hovers the mouse over the button.

    *   disabled

boolean optional
Whether the button is disabled.

### ElementsPanel

Represents the Elements panel.

#### Properties

- onSelectionChanged

Event<functionvoidvoid>
Fired when an object is selected in the panel.

The `onSelectionChanged.addListener` function looks like:

(callback: function)=>{...}

    *   callback

function
The `callback` parameter looks like:

()=> void

- void
  Creates a pane within panel's sidebar.

The `createSidebarPane` function looks like:

(title: string, callback?: function)=>{...}

    *   string

Text that is displayed in sidebar caption.

    *   function optional

The `callback` parameter looks like:

(result: [ExtensionSidebarPane](https://developer.chrome.com/docs/extensions/reference/api/devtools/panels#type-ExtensionSidebarPane))=> void

        *   An ExtensionSidebarPane object for created sidebar pane.

### ExtensionPanel

Represents a panel created by an extension.

#### Properties

- onHidden

Event<functionvoidvoid>
Fired when the user switches away from the panel.

The `onHidden.addListener` function looks like:

(callback: function)=>{...}

    *   callback

function
The `callback` parameter looks like:

()=> void

- onSearch

Event<functionvoidvoid>
Fired upon a search action (start of a new search, search result navigation, or search being canceled).

The `onSearch.addListener` function looks like:

(callback: function)=>{...}

    *   callback

function
The `callback` parameter looks like:

(action: string, queryString?: string)=> void

        *   action

string \* queryString

string optional

- onShown

Event<functionvoidvoid>
Fired when the user switches to the panel.

The `onShown.addListener` function looks like:

(callback: function)=>{...}

    *   callback

function
The `callback` parameter looks like:

(window: Window)=> void

        *   window

Window

- createStatusBarButton

void
Appends a button to the status bar of the panel.

The `createStatusBarButton` function looks like:

(iconPath: string, tooltipText: string, disabled: boolean)=>{...}

    *   iconPath

string
Path to the icon of the button. The file should contain a 64x24-pixel image composed of two 32x24 icons. The left icon is used when the button is inactive; the right icon is displayed when the button is pressed.

    *   tooltipText

string
Text shown as a tooltip when user hovers the mouse over the button.

    *   disabled

boolean
Whether the button is disabled.

    *   returns

- show

void Chrome 140+
Shows the panel by activating the corresponding tab.

The `show` function looks like:

()=>{...}

A sidebar created by the extension.

#### Properties

- Event<functionvoidvoid>
  Fired when the sidebar pane becomes hidden as a result of the user switching away from the panel that hosts the sidebar pane.

The `onHidden.addListener` function looks like:

(callback: function)=>{...}

    *   function

The `callback` parameter looks like:

()=> void

- Event<functionvoidvoid>
  Fired when the sidebar pane becomes visible as a result of user switching to the panel that hosts it.

The `onShown.addListener` function looks like:

(callback: function)=>{...}

    *   function

The `callback` parameter looks like:

(window: Window)=> void

        *   Window

- void
  Sets an expression that is evaluated within the inspected page. The result is displayed in the sidebar pane.

The `setExpression` function looks like:

(expression: string, rootTitle?: string, callback?: function)=>{...}

    *   string

An expression to be evaluated in context of the inspected page. JavaScript objects and DOM nodes are displayed in an expandable tree similar to the console/watch.

    *   string optional

An optional title for the root of the expression tree.

    *   function optional

The `callback` parameter looks like:

()=> void

- void
  Sets the height of the sidebar.

The `setHeight` function looks like:

(height: string)=>{...}

    *   string

A CSS-like size specification, such as `'100px'` or `'12ex'`.

- void
  Sets a JSON-compliant object to be displayed in the sidebar pane.

The `setObject` function looks like:

(jsonObject: string, rootTitle?: string, callback?: function)=>{...}

    *   string

An object to be displayed in context of the inspected page. Evaluated in the context of the caller (API client).

    *   string optional

An optional title for the root of the expression tree.

    *   function optional

The `callback` parameter looks like:

()=> void

- void
  Sets an HTML page to be displayed in the sidebar pane.

The `setPage` function looks like:

(path: string)=>{...}

    *   string

Relative path of an extension page to display within the sidebar.

### SourcesPanel

Represents the Sources panel.

#### Properties

- onSelectionChanged

Event<functionvoidvoid>
Fired when an object is selected in the panel.

The `onSelectionChanged.addListener` function looks like:

(callback: function)=>{...}

    *   callback

function
The `callback` parameter looks like:

()=> void

- void
  Creates a pane within panel's sidebar.

The `createSidebarPane` function looks like:

(title: string, callback?: function)=>{...}

    *   string

Text that is displayed in sidebar caption.

    *   function optional

The `callback` parameter looks like:

(result: [ExtensionSidebarPane](https://developer.chrome.com/docs/extensions/reference/api/devtools/panels#type-ExtensionSidebarPane))=> void

        *   An ExtensionSidebarPane object for created sidebar pane.

## Properties

### elements

Elements panel.

### sources

Sources panel.

### themeName

Chrome 59+

The name of the color theme set in user's DevTools settings. Possible values: `default` (the default) and `dark`.

#### Type

string

## Methods

### create()

chrome.devtools.panels.create(

  title: string,

  iconPath: string,

  pagePath: string,

  callback?: function,

): void

Creates an extension panel.

#### Parameters

- title

string
Title that is displayed next to the extension icon in the Developer Tools toolbar.

- iconPath

string
Path of the panel's icon relative to the extension directory.

- pagePath

string
Path of the panel's HTML page relative to the extension directory.

- callback

function optional
The `callback` parameter looks like:

(panel: [ExtensionPanel](https://developer.chrome.com/docs/extensions/reference/api/devtools/panels#type-ExtensionPanel))=> void

    *   panel

An ExtensionPanel object representing the created panel.

### openResource()

chrome.devtools.panels.openResource(

  url: string,

  lineNumber: number,

  columnNumber?: number,

  callback?: function,

): void

Requests DevTools to open a URL in a Developer Tools panel.

#### Parameters

- url

string
The URL of the resource to open.

- lineNumber

number
Specifies the line number to scroll to when the resource is loaded.

- columnNumber

number optional Chrome 114+
Specifies the column number to scroll to when the resource is loaded.

- callback

function optional
The `callback` parameter looks like:

()=> void

### setOpenResourceHandler()

chrome.devtools.panels.setOpenResourceHandler(

  callback?: function,

): void

Specifies the function to be called when the user clicks a resource link in the Developer Tools window. To unset the handler, either call the method with no parameters or pass null as the parameter.

#### Parameters

- callback

function optional
The `callback` parameter looks like:

(resource: [Resource](https://developer.chrome.com/docs/extensions/reference/api/devtools/devtools_inspectedWindow/#type-Resource), lineNumber: number)=> void

    *   resource

A [`devtools.inspectedWindow.Resource`](https://developer.chrome.com/docs/extensions/reference/api/devtools/devtools_inspectedWindow/#type-Resource) object for the resource that was clicked.

    *   lineNumber

number
Specifies the line number within the resource that was clicked.
