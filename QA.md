# Flow Keys release QA checklist

Use this checklist to test a specific Flow Keys build in ServiceNow Workflow Studio. Each checkbox belongs to a **new test run**. The baseline below records earlier observations.

## What has been verified

| Environment | Observed behavior | Remaining coverage |
| --- | --- | --- |
| Brazil Patch 2, original development PDI | Development checks covered Record Created triggers, If conditions, action field search, data pills, and navigation between insertion points and step types. | Repeat the cases below with the same extension build used on Australia to compare releases. |
| Australia Patch 6 (`patch6w39`), Windows Chrome, 2026-11-27 | In the fresh draft `Flow Keys QA - Australia 2026-11-27`, Enter opened trigger search. The Incident Created trigger and Ask For Approval action persisted after reload. In the action, `F` and `journal select` returned one Journal Field result. Enter opened its picker and Esc returned focus to that field. | The run included clicks on the toolbar icon and action result. The keyboard-only path, flow execution, and external spokes still need verification. Studio briefly reopened the draft read-only. Reloading and choosing **Edit flow** restored editing. The cause is unknown. |

## Keyboard navigation check, 2026-11-27

The local development build was loaded in macOS Chrome (Korean UI) and tested in the inactive PDI draft `Flow Keys QA - Keyboard navigation 2026-11-27`.

| Check | Observed result |
| --- | --- |
| Ask For Approval | Searched for `approval reason`, entered its editor, and pressed Esc. The query, selected result, and canvas highlight returned. A second Esc focused the action card. |
| Form controls | X opened the native deletion dialog with Cancel focused. Esc returned to the card. C closed the action form. F reopened field search and Command+Enter from the Approval Reason editor invoked Done and returned to the card. |
| Stage | Created a stage in the inline editor. Done focused its replacement stage button. Esc from New Stage returned to its chooser, a second Esc focused the stage position, and Down selected the next action. |
| Record Created | Compared extension off/on and mouse/Enter in the QA draft. The trigger form remained open with Cancel and Done available. Both a native mouse selection with the extension off and a keyboard selection with it on displayed a transient `Saving...` indicator. A separate rapid cancel-and-retry produced a Studio error page once. Refresh and Edit flow restored the draft. Its cause was not established. |

## Run setup

1. Create a new draft flow for each environment and run. Record its name, the instance build from `stats.do`, the loaded extension version from `chrome://extensions`, and the Chrome version. Use the same extension build on both releases.
2. Start in the editable step-list view. Use a test Incident table record, two distinguishable action steps, and a test group with a member and a nonmember. Keep the flow inactive during editing checks. Use an isolated instance and test connections for execution checks.
3. Copy the relevant checkboxes and the result template below into the run record. Start with **03, 11–18, and 29**. Record a mouse intervention, unexpected focus change, or retry at the exact step where it occurred.

## P0 · Core editing and persistence

- [ ] **01 · Install and update.** Test a clean install and reload an existing unpacked installation after updating its files. Refresh an already-open flow. Verify the expected version and a single working panel.
- [ ] **02 · Activate and turn off.** Open Flow Keys with Ctrl+Shift+K on Windows, ⌘+Shift+K on macOS, and the toolbar icon. Turn it off and verify that highlights disappear and Studio handles arrows and Enter again.
- [ ] **03 · Complete a keyboard-only edit.** From an empty flow, activate the extension, add a trigger, select its table, add an action, fill its required inputs, and choose Done. Complete the entire sequence using only the keyboard.
- [ ] **04 · Find insertion points.** Use both ordinary ↑/↓ navigation and N. Insert before the first step, between steps, after the last step, and inside an empty If branch. Compare the highlighted row with the actual insertion location.
- [ ] **05 · Configure a trigger.** At Add Trigger, press Enter and immediately type in the focused search box. Choose Record → Created, select Incident, and finish editing. Reopen the trigger and verify the table.
- [ ] **06 · Switch step types.** Press Enter at an insertion point and verify that all three types appear before any picker opens. Open Action with Enter, press Esc, then select Flow Logic and Subflow with the arrow keys. From each picker, Esc returns to its type button. Backing out again selects the original insertion row.
- [ ] **07 · Confirm action search results.** Try a unique exact name, then a query with similar matches. Confirm the intended result with Enter and verify that exactly one instance of that action was added.
- [ ] **08 · Search immediately after opening an action.** Try a new action and an existing collapsed action. Type as soon as its form opens and verify that the field finder receives the query. Close it and reopen it with F.
- [ ] **09 · Distinguish fields and data pill controls.** In Ask For Approval, distinguish Approval Field from Journal Field despite the shared “Select a field” label. Search `journal select` for one Journal Field result. Verify that the pill icon beside Approval Reason opens that input’s data pill picker.
- [ ] **10 · Edit nested branches.** Create If, Else If, Else, and a nested If. Open If and Else If with Enter and check focus in condition search. Insert an action inside the nested branch and inspect its parent after reopening.
- [ ] **11 · Target an AND/OR row.** Build at least two conditions. Search `group 1 condition 2 OR` and confirm that only that row’s OR is offered. Compare adding a condition to an existing group with creating a separate OR group. Reopen and inspect the grouping.
- [ ] **12 · Change comparison operators.** Try `is`, `is not`, and `is empty`. For the first two, verify focus moves to the value in the same row. For `is empty`, verify that the editor accepts the condition without a value.
- [ ] **13 · Save choice values.** Build `Priority is 2 - High AND State is In Progress` by searching both lists with the keyboard. Close and reopen the step, then refresh the page. Verify both fields, operators, values, and their AND relationship.
- [ ] **14 · Edit dynamic Field Values.** In an action such as Create Incident Task, select the Incident table. Search the fields that appear, reuse an empty row, add a second row, change a field, and remove a row. Check the search list after each change for duplicate or stale entries.
- [ ] **15 · Persist data pill bindings.** Bind Short description, Assignment group, and Assigned to to the corresponding trigger data pills. Refresh and reopen the action. Inspect the source step and field path of each binding.
- [ ] **16 · Scope step commands.** Add two instances of the same action with distinguishable values. On the second, try Duplicate, Annotation, Done, and Cancel. Inspect the copy’s position, saved annotation, and cancelled edit. Verify that the first action retains its original values.
- [ ] **17 · Confirm or cancel deletion.** Use a disposable duplicate. Open its deletion dialog, try Esc and Cancel separately, and verify that both preserve the step. Reopen and confirm Delete. Verify that only the duplicate disappears and keyboard navigation resumes.
- [ ] **18 · Recover from read-only mode.** Open a saved draft read-only and resume through Edit flow. If Studio reports a stale draft, record the message and try reloading before Edit flow. Check disabled edit commands, persisted values, focus, whether the panel needs reactivation, and whether one keypress runs one command.

## P1 · Authoring workflows and execution

- [ ] **19 · Follow focus in a long flow.** Put Update Record at step 6 and add enough steps to extend below the viewport. Insert after step 6 and after the last step. Follow the row, search box, result, and new input. Verify that deliberate wheel or touch scrolling takes precedence.
- [ ] **20 · Resume search from results.** Browse modules with arrows and type to continue searching. Try slash to replace the query, Backspace, and Korean IME composition. In a normal text input, verify that typing n or f inserts the letter.
- [ ] **21 · Navigate Flow Logic.** Use arrows, Home, and End to select among If, Else If, Else, and For Each. Check that selection moves visibly, skips disabled items, opens with Enter, and returns with Esc.
- [ ] **22 · Edit trigger Advanced Options.** Expand and collapse the section from field search. Verify that its child options are searchable only while visible. Exercise Done, Cancel, and Delete on a disposable trigger and verify that adjacent actions are unaffected.
- [ ] **23 · Compare dependent reference results.** Set Assignment group to Network and search Assigned to for a known member and nonmember. Repeat with Assignment group bound to a trigger data pill. For each search, compare results and selected identity with Studio’s native picker on the same instance and under the same role.
- [ ] **24 · Handle ambiguous or unavailable references.** Exercise duplicate display names, loading, no results, a lookup failure, and denied access. Verify the status, user identifiers when available, exact selection on Enter, and preservation of the previous value on Esc. Use a simulated response when a failure cannot be reproduced live and label that evidence.
- [ ] **25 · Change or clear dependent values.** Select an assignee, change the group, and compare the resulting assignee with native Studio behavior. Test group empty, assignee empty, and both empty. For each, record the saved binding and the value observed during execution.
- [ ] **26 · Connect a subflow.** Search for and insert a subflow, bind an input to a trigger data pill, and use a subflow output in the next action. Reopen the flow and verify both bindings.
- [ ] **27 · Exercise customer-used spokes.** Choose one or two commonly used spokes. Record each spoke version and action. Search and insert the action, set required, reference, and choice inputs where available, and consume an output data pill in the next step. Exercise any external call with a test connection.
- [ ] **28 · Recover manually linked controls.** Link an unrecognized card, insertion point, and field via Help. Let Studio redraw the form and verify that each link still targets the same control. Remove a linked control and check that commands do not act on a neighboring row.
- [ ] **29 · Check runtime behavior.** In an isolated test, use one Incident that satisfies the condition and another that does not. Inspect execution details for the branch taken, actual data pill values, and action outputs. Record external spoke execution separately if applicable.

## P2 · Platform and support boundaries

- [ ] **30 · OS and browser.** Run on actual Windows and macOS. Exercise native shortcuts and focus on Chrome 125 and the Chrome version used by testers. Record the exact OS and browser versions, including any combinations still untested.
- [ ] **31 · Extension and Studio languages.** Pair Korean and English Studio with Korean Chrome, English Chrome, and a Chrome locale that falls back to English. Verify panel text, original instance field names, and field search in each combination.
- [ ] **32 · Roles and permissions.** Compare an administrator, a flow author, and a read-only user on the same flow. Verify that available commands and reference results respect what each user can access in Studio.
- [ ] **33 · Frames, views, and tabs.** Use standalone Studio, an embedded editor, and two different flow tabs. Make a selection in one and check the other. Record diagram-view behavior separately if assessing support for that view.
- [ ] **34 · Accessibility and layout.** Verify visible keyboard focus, screen-reader announcements of result counts and selection, and readable row captions and buttons at a narrow width, with zoom, and in high-contrast mode.
- [ ] **35 · Scope outside the canvas.** Invoke the extension on a normal ServiceNow form, the Studio list, and a tab outside the supported domain. Check the toolbar guidance and verify that ordinary typing and navigation continue to work there.

## Result template

Record **Pass**, **Fail**, **Blocked**, or **Not run** for each applicable check. Use **N/A** when a case has no editing, reload, or execution step. List the observed failure and the last successful input when a case passes only in part.

| Run date | ServiceNow family and build tag | Loaded Flow Keys version | OS and Chrome version | QA flow name | Role and UI languages |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

| Case | Live instance or local fixture | Edit outcome | After reload | Runtime | Expected and observed behavior, evidence or issue |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

For local regression coverage and supported test flags, see the [development instructions](README.md#development).
