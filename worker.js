const idleTitle = chrome.i18n.getMessage("openCommands");
const busy = new Set();

async function indicator(tabId, badge, title) {
  await Promise.all([
    chrome.action.setBadgeText({ tabId, text: badge }),
    chrome.action.setBadgeBackgroundColor({ tabId, color: badge === "ON" ? "#414aff" : "#191919" }),
    chrome.action.setTitle({ tabId, title })
  ]);
}

chrome.action.onClicked.addListener(async tab => {
  if (!tab.id || busy.has(tab.id)) return;
  busy.add(tab.id);
  try {
    if (!tab.url || !/^https:\/\/[^/]+\.service-now\.com\//i.test(tab.url)) {
      await indicator(tab.id, "PDI", chrome.i18n.getMessage("needPdi"));
      return;
    }
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true }, files: ["editor.js"]
    });
    const active = results.find(frame => frame.result?.active);
    const frame = active || results.filter(f => f.result?.score > 0)
      .sort((a, b) => b.result.score - a.result.score)[0];
    if (!frame) {
      await indicator(tab.id, "FLOW", chrome.i18n.getMessage("needFlow"));
      return;
    }
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id, documentIds: [frame.documentId] },
      func: () => globalThis.flowKeysController.invoke()
    });
    await indicator(tab.id, result.result ? "ON" : "", result.result ? chrome.i18n.getMessage("activeTitle") : idleTitle);
  } catch {
    await indicator(tab.id, "!", chrome.i18n.getMessage("cannotRun")).catch(() => {});
  } finally {
    busy.delete(tab.id);
  }
});

// Classic Select2 keeps the record key on the result node in page-world jQuery.
// Return only identifiers for the displayed rows of the active assignee picker.
function visibleAssigneeIds() {
  const field = document.querySelector('.select2-dropdown-open.select2-reference[id^="s2id_field_values_assigned_to_"]');
  const results = document.querySelector('.select2-drop-active .select2-results');
  const input = results?.closest('.select2-drop-active')?.querySelector('input[aria-owns]');
  if (!field || !input || input.getAttribute('aria-owns') !== results.id ||
      field.querySelector('.select2-focusser')?.id + '_search' !== input.id) return [];
  const jquery = window.$j || window.jQuery;
  if (typeof jquery !== 'function') return [];
  return [...results.querySelectorAll('li.select2-result-selectable')].slice(0, 100).flatMap(row => {
    const label = row.querySelector('.select2-result-label[id]');
    const record = jquery(row).data('select2-data');
    const key = record?.sys_id || record?.id;
    if (!label || typeof key !== 'string' || !/^[a-f0-9]{32}$/i.test(key)) return [];
    return [{option: label.id, text: label.textContent.trim(), key,
      login: typeof record.user_name === 'string' ? record.user_name.slice(0, 160) : ''}];
  });
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message === "flow-keys-off" && sender.tab?.id) indicator(sender.tab.id, "", idleTitle).catch(() => {});
  if (message !== 'flow-keys-assignee-ids' || !sender.tab?.id || !sender.documentId ||
      !/^https:\/\/[^/]+\.service-now\.com\//i.test(sender.url || '')) return;
  chrome.scripting.executeScript({target: {tabId: sender.tab.id, documentIds: [sender.documentId]},
    world: 'MAIN', func: visibleAssigneeIds}).then(rows => respond(rows[0]?.result || []), () => respond([]));
  return true;
});
