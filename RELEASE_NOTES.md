# Flow Keys release notes

## Unreleased

### Field navigation

- Use ↑ and ↓ in field search to see the matching control outlined on the Workflow Studio canvas. Offscreen fields scroll into view while keyboard focus stays in the search box.
- After selecting a dropdown value or data pill, press **F** and type the next field name. **F** also works on checkboxes and radio buttons. In a text field, press **F2** to switch to field search.
- Press **Esc** from a field opened through search to return to the previous query and selection. Press **Esc** again from the top-level field list to return to the step.
- Flow Keys uses English for the field and condition labels it supplies, including **Condition Label** and **Operator**. Korean shortcut hints and Korean condition search terms remain available.

### Steps, stages, and forms

- An insertion point now offers **Action**, **Flow Logic**, and **Subflow** before opening a picker. Choose a type with the arrow keys and **Enter**. **Esc** inside its picker returns to the type chooser.
- Navigate to a stage position with the arrow keys and press **Enter** to open its chooser. Completing a new stage returns focus to its position on the canvas.
- On a step card or its header, use **E** for Done, **C** for Cancel, or **X** for the deletion dialog. The dialog opens with Cancel focused. From a form input, use **⌘+Enter** or **Ctrl+Enter** to invoke Done.
- In trigger search, **Enter** on an empty query or a query with no available results leaves the picker open. Studio can still briefly display `Saving...` after trigger selection, including when Flow Keys is off. [QA observations](QA.md#keyboard-navigation-check-2026-11-27)

Earlier published versions are listed on [GitHub Releases](https://github.com/Ethan-MZC/flow-keys/releases).
