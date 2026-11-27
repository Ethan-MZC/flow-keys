# Flow Keys

Edit ServiceNow flows from your keyboard. Flow Keys highlights the active step, keeps it in view, and lets you search actions, fields, and data pills in Workflow Studio.

## Get started

1. Clone this repository or extract **Code → Download ZIP**.
2. In Chrome 125 or later, open `chrome://extensions`, enable **Developer mode**, and select **Load unpacked**. Choose the folder containing `manifest.json`.
3. Open an editable flow on your `*.service-now.com` instance. Press **Ctrl+Shift+K** on Windows or **⌘+Shift+K** on macOS to activate Flow Keys. You can also click its toolbar icon.

To update, pull the latest changes, reload the extension, and refresh the editor tab.

## Keyboard guide

| When | Keys | What happens |
| --- | --- | --- |
| On the canvas | ↑ / ↓ | Move between steps and insertion points, including empty branches. |
| On a step | Enter / F | Open the step or search its fields and controls. |
| Adding a step | N, then Enter | Jump to an insertion point and search actions. On **Add Trigger**, search triggers instead. |
| At an insertion point | →, then ← / → | Choose Action, Flow Logic, or Subflow. Press Enter to browse. |
| In a picker | Type, ↑ / ↓, Enter | Filter and select. While browsing results, type to keep searching or press `/` to replace the query. |
| In a menu or picker | Esc | Return to the previous choice or step. |
| In the command menu | D / A / E / C / X | Duplicate, annotate, finish, cancel, or open the selected step’s deletion dialog. |

**Try it:** Open **Ask For Approval**, press **F**, and type `journal select` to reach the Journal Field selector. In an **If** step, search `group 1 condition 2 OR` to add a condition to that specific row.

## Language and access

The extension follows Chrome’s display language. English and Korean are included, with English as the fallback. Field names, record values, and native menus use the language of your ServiceNow instance.

Flow Keys uses `activeTab` and `scripting` when you activate it. Duplicate assignee names may trigger a lookup on your own instance using your existing access. If a control is missing, use **Help** to link it for the current tab.

## Development

Run the keyboard regression suite against a simulated Studio page with Node.js and npm. Set `FK_LOCALE=ko` for Korean or `FK_MAC=1` to exercise Command shortcuts.

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node workflow-studio.test.cjs
```

[MIT license](LICENSE)
