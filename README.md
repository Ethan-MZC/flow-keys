# Flow Keys

Edit ServiceNow flows from your keyboard. Flow Keys highlights the active step, keeps it in view, and lets you search actions, fields, and data pills in Workflow Studio.

[Release notes on GitHub](https://github.com/Ethan-MZC/flow-keys/releases)

## Tested environments

Flow Keys targets the editable Workflow Studio flow canvas on HTTPS `*.service-now.com` instances in Chrome 125 or later. The checks below cover the list of steps in an editable draft. Diagram view, read-only flows, and individual third-party spokes need separate verification.

| ServiceNow release | Environment | Editing checks |
| --- | --- | --- |
| Brazil Patch 2 | Original development PDI | Record Created triggers, If conditions, action field search, data pills, and keyboard navigation between insertion points and step types. |
| Australia Patch 6 (build tag `patch6w39`) | Separate demo instance, Windows Chrome, Nov 27, 2026 | Opened trigger and action search from the insertion row. Selected Record → Created and set the table to Incident. In Ask For Approval, `F` then `journal select` returned only the Journal Field selector. Enter opened it and Esc restored focus. Both the trigger and action remained after reloading the inactive draft. |

During the Australia check, Studio briefly reopened the draft read-only. Reloading and choosing **Edit flow** restored editing. Activation and runtime execution were outside this check.

Use the [release QA checklist](QA.md) to repeat these checks and record editing, persistence, and execution results for another build.

## Get started

1. Clone this repository or extract **Code → Download ZIP**.
2. In Chrome 125 or later, open `chrome://extensions`, enable **Developer mode**, and select **Load unpacked**. Choose the folder containing `manifest.json`.
3. Open an editable flow on your `*.service-now.com` instance. Press **Ctrl+Shift+K** on Windows or **⌘+Shift+K** on macOS to activate Flow Keys. You can also click its toolbar icon.

To update, pull the latest changes, reload the extension, and refresh the editor tab.

## Edit several fields in one action

1. With Flow Keys active, focus **Ask For Approval** and press **F**. Type `approval field` and use ↑ or ↓ to highlight the selector. The matching control is outlined on the canvas. Press **Enter** to open it.
2. Choose a value, then press **F** and type `journal field`. Your typing replaces the previous query. Choose the Journal Field selector and press **Enter**. The same **F** shortcut works after choosing a data pill for **Record**.
3. When typing in **Approval Reason**, press **F2** to find another field. To finish the action from the text field, press **⌘+Enter** on macOS or **Ctrl+Enter** on Windows.

To revisit the list you came from, press **Esc**. Flow Keys restores the query and highlights the previous result. In an **If** step, you can search by position as well as name. For example, `group 1 condition 2 OR` finds the OR control on that row.

## Keyboard guide

| When | Keys | What happens |
| --- | --- | --- |
| On the canvas | ↑ / ↓ | Move between steps, stage positions, and insertion points, including empty branches. |
| On a step | Enter / F | Open the step or search its fields and controls. |
| Adding a step | N, then Enter | Jump to an insertion point and show the step types. On **Add Trigger**, open trigger search. |
| In the step type chooser | ← / →, then Enter | Choose Action, Flow Logic, or Subflow. Esc returns to the insertion point. |
| In a picker | Type, ↑ / ↓, Enter | Filter and select. The highlighted field result also outlines and reveals its control on the canvas. While browsing results, type to keep searching or press `/` to replace the query. |
| In a field opened from search | Esc | Return to the previous field list with its query and selection. Esc again returns to the card. Reopen with F to resume searching. |
| After choosing a dropdown value or data pill, or on a checkbox or radio button | F | Search the same step’s fields. Type to replace the previous query. |
| While editing a text field | F2 | Go directly to field search. Ordinary letters continue editing the value. |
| At a stage position | Enter | Open the stage chooser. Tab to New Stage for its form. Esc returns to the chooser, then to the stage position. |
| On a card or its header | E / C / X | Done, Cancel, or open the step’s deletion dialog with Cancel focused. |
| Inside a step form | ⌘+Enter / Ctrl+Enter | Invoke the current step’s available Done button on macOS / Windows. |
| In the command menu | D / A / E / C / X | Duplicate, annotate, finish, cancel, or open the selected step’s deletion dialog. |

## Language and access

The extension follows Chrome’s display language. English and Korean are included, with English as the fallback. Flow Keys uses English for its field and condition labels in both languages. Field names supplied by Studio, record values, and native menus follow your instance.

Flow Keys uses `activeTab` and `scripting` when you activate it. Duplicate assignee names may trigger a lookup on your own instance using your existing access. If a control is missing, use **Help** to link it for the current tab.

## Development

Run the keyboard regression suite against a simulated Studio page with Node.js and npm. Set `FK_LOCALE=ko` for Korean or `FK_MAC=1` to exercise Command shortcuts.

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node workflow-studio.test.cjs
```

[MIT license](LICENSE)
