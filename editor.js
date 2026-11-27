(() => {
  if (globalThis.flowKeysController) return globalThis.flowKeysController.probe();

  const controls = 'button,select,[role="button"],[role="combobox"],[aria-haspopup],input,[tabindex],a[href],[ng-click],[data-ng-click]';
  const cards = '.trigger-section .componentInstance,.actionContainer .componentInstance,[data-step-id],[data-action-instance-id],[data-flow-step],.flow-step,.flow-action-card,.action-instance,[class*="flow-step-card"],[class*="action-instance-card"],sn-fd-action-instance,sn-fd-flow-step,[role="treeitem"]';
  const studioHeader = '#flow_trigger_expand_form,[id^="flow_action_"][id$="_expand_form"]';
  const actionCard = '.instance-type-action,[data-action-instance-id],.flow-action-card,.action-instance,sn-fd-action-instance';
  const logicCard = '.instance-type-flowlogic';
  const triggerCard = '.trigger-section .componentInstance';
  const stepCommands = [
    {id:'duplicate',key:'D',label:'Duplicate',selector:'[id*="_duplicate_component_instance_icon_"]'},
    {id:'annotation',key:'A',label:'Annotation',selector:'[id*="_add_comments_icon_"]'},
    {id:'done',key:'E',label:'Done',selector:'#flow_action_btnDone,#flow_trigger_btnDone,#flow_trigger_btn_done'},
    {id:'cancel',key:'C',label:'Cancel',selector:'#flow_action_btnCancel,#flow_trigger_btnCancel,#flow_trigger_btn_cancel'},
    {id:'delete',key:'X',label:'Delete',selector:'#flow_action_btnDelete,#flow_trigger_btnDelete,#flow_trigger_btn_delete,[id*="_delete_icon_"]'}
  ];
  const fieldButtons = '.dot_walk_btn,[id^="picker2col_opener_"],.select2-container,select,[role="combobox"]';
  const templateGroup = '.template_picker,[id$="_template_fields"]';
  const addFieldButton = '.btn-add-fv,.template_picker button[aria-label*="add a new row and pick a field" i]';
  const pillName = /^(?:data\s*pill\s*picker|데이터\s*필\s*선택기)(?:\s+for\s+|\s*[:·-]\s*)?/i;
  const groupSelector = '.form-group,.colrow,[data-condition-row],fieldset,[role="group"]';
  const categoryButtons = '#flow_action_newAction,#flow_action_newFlowLogic,#flow_action_newSubflow';
  // The text link is the keyboard opener. Studio removes it when a trigger exists.
  const addTrigger = '#flow_trigger_text_toggle';
  const hoverInsertion = '.drop-target-wrapper .addInstanceBtn [role="button"][data-isdroppable="true"][aria-label]';
  const logicList = '.flowlogic-picker-list';
  const searchableMenu = '.action-picker-component,.subflow-picker-component,#picker2col_choices_select_subflow,.trigger-picker-component,.dot-walk-picker,.select2-drop';
  const stepSearch = '#action-picker-search-input,#picker2col_search_select_subflow,.subflow-picker-component input';
  const textSearch = 'input:not([type]),input[type=text],input[type=search]';
  const fields = /(?:\b(?:select|choose|pick|add) (?:a |an )?(?:field|data pill)|\bfield(?: picker)?\b|pill picker|data pill picker|dot.walk|필드|데이터\s*필)/i;
  const additions = /(?:add|insert).{0,25}(?:an? action|flow logic|subflow|a step|new step|action here)|(?:액션|작업|동작|단계|플로우 로직|서브플로우).{0,15}(?:추가|삽입)/i;
  const interactive = 'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="searchbox"]';
  const surfaces = '.select2-drop,.dot-walk-picker';
  const pickers = surfaces + ',[role="dialog"],[role="listbox"],[role="menu"],[role="tree"],[popover]:popover-open';
  const search = 'input:not([type]),input[type="search"],input[type="text"],[role="searchbox"],[role="textbox"]';
  const options = '[role="option"],[role="menuitem"],[role="treeitem"],button,[role="button"]';
  const mac = /mac/i.test(navigator.platform);
  const prefix = mac ? '⌘+Shift+K' : 'Ctrl+Shift+K';
  const marks = {card:'data-flowkeys-card', field:'data-flowkeys-focus'};
  function cardKey(el) {
    for (const attr of ['data-step-id','data-action-instance-id','id']) {
      if (el.getAttribute(attr)) return attr+'='+el.getAttribute(attr);
    }
    if (el.matches('.trigger-section .componentInstance')) return 'studio-trigger';
    return null;
  }
  const sheet = `
    .select2-result-label[data-flowkeys-identity]::after{content:" · " attr(data-flowkeys-identity);font-size:.9em}
    [data-flowkeys-card]:not([data-flowkeys-preview-origin]){background-color:light-dark(#f0f0f0,#353535)!important;box-shadow:inset 4px 0 #414aff!important}
    [data-flowkeys-focus]{outline:3px solid light-dark(#414aff,#00d7f8)!important;outline-offset:1px!important}
    .picker-filter input[id="action-picker-search-input"]:focus,
    .action-picker-component input[id="action-picker-search-input"]:focus{
      background-color:light-dark(#fff,#181821)!important;color:light-dark(#191919,#fff)!important;
      caret-color:light-dark(#414aff,#00d7f8)!important;cursor:text;
      outline:2px solid light-dark(#414aff,#00d7f8)!important;outline-offset:-2px!important}
    .flowlogic-picker-list [data-flowkeys-focus]{background:#414aff!important;color:white!important;outline-offset:-2px!important}
    .flowlogic-picker-list [data-flowkeys-focus] button{background:transparent!important;color:inherit!important}
    [data-flowkeys-insertion-row]{background-color:light-dark(#f3f4ff,#303148)!important;box-shadow:inset 3px 0 #414aff!important}
    [data-flowkeys-insertion-row] .addInstanceBtn [data-isdroppable="true"]{opacity:1!important}
    [data-flowkeys-row-relative]{position:relative!important}
    [data-flowkeys-row-caption]{box-sizing:border-box;display:block;min-width:0;max-width:100%;padding:4px 12px;
      text-align:end;overflow-wrap:anywhere;pointer-events:none;user-select:none;color:light-dark(#373baa,#c6c9ff);
      font:600 13px/1.5 Pretendard,"Malgun Gothic",system-ui,sans-serif}
    [data-flowkeys-row-caption]:not([data-inline]){width:100%;background:light-dark(#f3f4ff,#303148);box-shadow:inset 3px 0 #414aff;grid-column:1/-1;flex:0 0 100%}
    [data-flowkeys-row-caption]>span{display:inline-block;max-width:100%}
    [data-flowkeys-row-caption][data-inline]{position:absolute;right:0;top:50%;transform:translateY(-50%);white-space:nowrap}
    @media(forced-colors:active){[data-flowkeys-focus]{outline-color:Highlight!important}}
  `;
  let session;

  function studio() {
    let url = location.href;
    try { url = decodeURIComponent(url); } catch {}
    return /(?:workflow[-_]studio|flow[-_]designer)/i.test(url);
  }
  function parent(el) { return el?.assignedSlot || el?.parentElement || el?.getRootNode()?.host || null; }
  function ancestor(el, match) {
    for (; el; el = parent(el)) if (match(el)) return el;
    return null;
  }
  function shadow(el) {
    return el.shadowRoot || (el.localName.includes('-') && chrome.dom?.openOrClosedShadowRoot?.(el)) || null;
  }
  function deepActive() {
    let el = document.activeElement;
    while (el && shadow(el)?.activeElement) el = shadow(el).activeElement;
    return el;
  }
  function shown(el) {
    if(!el.isConnected || !el.getClientRects().length || ancestor(el,n=>n.matches('[hidden],[inert],[aria-hidden="true"]'))) return false;
    if(el.checkVisibility({visibilityProperty:true,opacityProperty:true})) return true;
    // Studio makes the between-step + transparent until hover or keyboard focus.
    return el.matches(hoverInsertion) && el.checkVisibility({visibilityProperty:true}) &&
      el.parentElement.checkVisibility({visibilityProperty:true,opacityProperty:true});
  }
  function enabled(el) {
    return shown(el) && !ancestor(el,n=>n.matches(':disabled,.select2-container-disabled,[aria-disabled=true],[readonly],[aria-readonly=true],[data-read-only=true]'));
  }
  function name(el) {
    const labelled = (el.getAttribute('aria-labelledby') || '').split(/\s+/).map(id=>el.getRootNode().getElementById?.(id)?.textContent || '').join(' ').trim();
    return (el.getAttribute('aria-label') || labelled || el.getAttribute('title') || el.getAttribute('data-original-title') ||
      el.getAttribute('placeholder') || el.textContent || '').trim().replace(/\s+/g,' ').slice(0,120);
  }
  function roots(container, omit) {
    const list = [container];
    for (const root of list) {
      for (const el of root.querySelectorAll('*')) {
        if (el === omit) continue;
        const child = shadow(el);
        if (child) list.push(child);
      }
    }
    return list;
  }
  function probe() {
    if (session) return {active:true};
    if (!/^https:$/.test(location.protocol) || !location.hostname.endsWith('.service-now.com')) return {score:0};
    let inherited = false;
    try { inherited = window !== top && /workflow[-_]studio|flow[-_]designer/i.test(top.location.href); } catch {}
    if (!studio() && !inherited) return {score:0};
    const docRoots = roots(document);
    const hasCards = docRoots.some(r=>Array.from(r.querySelectorAll(cards)).some(shown));
    const hasAdd = docRoots.some(r=>Array.from(r.querySelectorAll(controls)).some(el=>(el.matches(addTrigger) || additions.test(name(el))) && shown(el)));
    const home = /\/home(?:[/?#]|$)/i.test(location.pathname + location.hash);
    return {score: (hasCards || hasAdd) ? 10 + Number(hasCards) + Number(hasAdd) + Number(studio()) : (studio() && !home ? 1 : 0)};
  }

  function start() {
    const host=document.createElement('div');
    host.setAttribute('data-flowkeys-panel','');
    document.documentElement.append(host);
    const ui=host.attachShadow({mode:'open'});
    ui.innerHTML=`
      <style>
        :host{all:initial;--blue:#414aff;--ink:#191919;--line:#ddd;--muted:#f7f7f7;
          position:fixed;right:12px;bottom:12px;z-index:2147483646;color-scheme:light;
          font:14px/1.45 Pretendard,"Pretendard Variable","Malgun Gothic",system-ui,sans-serif;color:var(--ink)}
        *,*::before,*::after{box-sizing:border-box}
        [hidden]{display:none!important}
        section{width:min(348px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;
          border:1px solid #aaa;border-radius:8px;background:#fff}
        header{display:flex;align-items:center;gap:6px;padding:8px 12px;background:#0a0f10;color:white}
        strong{margin-right:auto;font-size:18px;line-height:1.2;font-weight:700;letter-spacing:-.36px}
        button{font:inherit;font-weight:600;background:#fff;border:1px solid var(--line);border-radius:100px;
          padding:4px 12px;color:var(--ink);cursor:pointer;transition:background-color .25s cubic-bezier(.4,0,.2,1)}
        button:hover{background:var(--muted)}
        header button{color:white;background:transparent;border-color:#777;font-size:12px}
        header button:hover{background:#333}
        :focus-visible{outline:2px solid var(--blue);outline-offset:2px}
        header :focus-visible{outline-color:#00d7f8}
        output{display:block;padding:8px 12px;background:var(--muted);overflow-wrap:anywhere;font-size:13px}
        #key-hint{display:block;padding:5px 12px;color:#484848;font-size:12px}
        #commands,#help,#finder{padding:10px 12px}
        #commands{display:flex;gap:8px;flex-wrap:wrap}
        #commands button{display:flex;align-items:center;gap:7px;color:var(--blue)}
        kbd{font:700 12px/18px system-ui;text-align:center;min-width:20px;background:var(--blue);color:white;border-radius:4px}
        #help small{display:block;margin-bottom:6px}
        #help button{margin:2px;font-size:13px}
        input{width:100%;padding:8px 10px;border:1px solid #777;border-radius:8px;background:#fff;color:var(--ink);font:inherit}
        input:focus{border-color:var(--blue);caret-color:var(--blue);outline:2px solid var(--blue);outline-offset:1px}
        #fk-results{margin-top:6px;max-height:min(32vh,242px);overflow:auto;overscroll-behavior:contain}
        [role=option]{padding:6px 9px;border-radius:4px;cursor:pointer;overflow-wrap:anywhere}
        [role=option]:hover{background:var(--muted)}
        [role=option][aria-selected=true]{background:var(--blue);color:#fff;font-weight:600}
        .fk-pill{display:inline-block;width:18px;height:18px;vertical-align:middle;margin-inline-start:6px;fill:currentColor;color:var(--blue);pointer-events:none}
        [aria-selected=true] .fk-pill{color:inherit}
        @media(prefers-reduced-motion:reduce){button{transition:none}}
        @media(forced-colors:active){[aria-selected=true]{outline:2px solid Highlight;outline-offset:-2px}}
      </style>
      <section aria-label="Flow Keys"><header><strong>Flow Keys</strong><button id="guide">도움말</button><button id="off">끄기</button></header>
        <output role="status"></output><small id="key-hint" hidden></small><div id="help" hidden><small>키보드 명령</small><small>자동 인식되지 않으면 종류를 누르고 화면 요소를 클릭해 이 탭에 연결하세요.</small>
        <button data-bind="card">카드 연결</button><button data-bind="add">삽입점 연결</button><button data-bind="field">필드 연결</button></div></section>`;
    const get=id=>ui.getElementById(id);
    const helpText=get('help').querySelector('small');
    helpText.textContent='단계 카드에서 N 추가 · F 필드 검색 · '+prefix+' 명령 목록';
    const commands=document.createElement('div');
    commands.id='commands';commands.hidden=true;
    commands.innerHTML='<button data-command="add"><kbd>N</kbd>단계 추가</button><button data-command="field"><kbd>F</kbd>필드 선택</button>';
    for(const {id,key,label} of stepCommands) {
      const b=document.createElement('button');b.dataset.command=id;
      const shortcut=document.createElement('kbd');shortcut.textContent=key;
      b.append(shortcut,label);commands.append(b);
    }
    let commandCard=null;
    let deletion=null, annotationCard=null, annotationTimer=0;
    get('help').before(commands);
    function pillIcon(button) {
      const ns='http://www.w3.org/2000/svg';
      const icon=document.createElementNS(ns,'svg');
      icon.setAttribute('class','fk-pill');
      icon.setAttribute('role','img');icon.setAttribute('aria-label','Data Pill Picker');
      const source=button.querySelector('svg use');
      const href=source?.getAttribute('href') || source?.getAttributeNS('http://www.w3.org/1999/xlink','href');
      const url=href && URL.canParse(href,button.baseURI) && new URL(href,button.baseURI);
      const use=document.createElementNS(ns,'use');
      use.setAttribute('href',url && url.origin===location.origin && url.hash ? url.href : '/images/icon-data-pill-picker.svg#icon');
      icon.append(use);return icon;
    }
    function say(message,pill=null,suffix='') {
      const output=ui.querySelector('output');
      output.textContent=message;
      if(pill) output.append(pillIcon(pill));
      if(suffix) output.append(suffix);
      updateHint();
    }
    const rowCaption=document.createElement('div');
    rowCaption.setAttribute('data-flowkeys-row-caption','');
    rowCaption.setAttribute('aria-hidden','true');
    const captionText=document.createElement('span');
    rowCaption.append(captionText);
    let insertionRow=null;
    const state = {card:null, field:null, position:null, choices:null, picker:null, binding:null};
    const manual={card:new Set(), add:new Set(), field:new Set()};
    const fieldBindings=new Map();
    const observed=new Map(), styleNodes=new Map();
    let cache=null, repaint=0, pending=0, lastUrl=location.href;
    const abort=new AbortController();
    const on=(target,event,fn,capture=false)=>target.addEventListener(event,fn,{capture,signal:abort.signal});
    const finder=document.createElement('div');
    finder.id='finder';finder.hidden=true;
    finder.innerHTML='<input role="combobox" aria-label="필드 검색" aria-expanded="true" aria-controls="fk-results" placeholder="필드명 또는 현재 값 검색"><div id="fk-results" role="listbox"></div>';
    commands.after(finder);
    const query=finder.querySelector('input');
    const results=get('fk-results');
    let catalog=[], matches=[], cursor=0, origin=null, fieldCard=null;
    const normalize=s=>s.normalize('NFKC').toLocaleLowerCase().replace(/[_\s]+/g,' ').trim();
    function hideFinder() {
      finder.hidden=true;fieldCard=null;catalog=[];matches=[];query.value='';results.replaceChildren();
      query.removeAttribute('aria-activedescendant');
    }
    function highlightResult() {
      const selected=results.children[cursor];
      for(const item of results.children) item.setAttribute('aria-selected',String(item===selected));
      if(selected) {
        query.setAttribute('aria-activedescendant',selected.id);
        scrollWithin(results,selected);
      } else query.removeAttribute('aria-activedescendant');
    }
    function filterResults() {
      const needle=normalize(query.value);
      const logic=fieldCard?.matches(logicCard);
      const locationPattern=/(그룹|조건)\s*(\d+)/g;
      const locationTerms=logic ? [...needle.matchAll(locationPattern)] : [];
      const terms=(logic?needle.replace(locationPattern,' '):needle).split(' ').filter(Boolean);
      matches=catalog.filter(entry=>locationTerms.every(([,type,n])=>entry.location?.split(' · ').includes(type+' '+n)) &&
        terms.every(term=>logic && (term==='and' || term==='or') ? entry.join===term : entry.key.includes(term)));
      if(needle) {
        const rank=entry=>entry.label===needle?0:entry.label.startsWith(needle)?1:2;
        matches.sort((a,b)=>rank(a)-rank(b));
        const destinations=new Map();
        for(const entry of catalog) {
          if(entry.blank || entry.addRow && !destinations.has(entry.template)) destinations.set(entry.template,entry);
        }
        for(const entry of destinations.values()) {
          if(matches.includes(entry)) continue;
          const scope=entry.section ? entry.section+' · ' : '';
          matches.push({...entry,title:scope+'새 필드에서 “'+query.value.trim()+'” 검색',seed:query.value.trim()});
        }
      }
      const fragment=document.createDocumentFragment();
      for(const [i,entry] of matches.entries()) {
        const row=document.createElement('div');
        row.id='fk-opt-'+i;row.setAttribute('role','option');row.dataset.index=String(i);
        row.textContent=entry.title;
        if(entry.pill) {
          row.title=entry.accessible;
          row.setAttribute('aria-label',entry.accessible);
          row.append(pillIcon(entry.el));
        }
        fragment.append(row);
      }
      cursor=0;results.replaceChildren(fragment);highlightResult();
      say(matches.length ? '검색 결과 '+matches.length+'개 · ↑↓ 이동 · Enter 선택 · Esc 돌아가기' : '검색 결과 없음 · Esc 돌아가기');
    }
    function showFinder(entries,returnTo=deepActive(),owner=null,prompt='') {
      commands.hidden=true;fieldCard=owner;
      const logic=owner?.matches(logicCard);
      query.setAttribute('aria-label',prompt || (logic?'조건 및 버튼 검색':'필드 검색'));
      query.placeholder=prompt || (logic?'조건, AND, OR 또는 버튼 검색':'필드명 또는 현재 값 검색');
      origin=returnTo;catalog=entries;finder.hidden=false;query.value='';
      filterResults();query.focus({preventScroll:true});
    }
    function chooseResult(i) {
      const entry=matches[i];
      if(!entry || !enabled(entry.el) || cardOf(entry.el)!==state.card) {
        say('편집 화면이 바뀌었습니다. F로 다시 검색하세요.');hideFinder();focus(state.card);return;
      }
      hideFinder();
      if(entry.addRow) {
        const card=state.card;
        pendingFieldRow={card,template:entry.template,buttonId:entry.el.id,seed:entry.seed,until:performance.now()+3000};
        focus(entry.el);entry.el.click();cache=null;followFieldRow();invalidate();
      } else if(entry.choice) {
        const {el,choice}=entry;
        const select=choiceSelect(el);
        if(!select || select.disabled || choice.closest('select')!==select || !availableChoice(choice)) {
          say('선택 목록이 바뀌었습니다. 다시 검색하세요.');focus(state.card);return;
        }
        if(el===select) {
          applyOption(select,choice);focus(select);
        } else openPicker(el,'field','',entry.title,choice);
      } else if(entry.option) {
        const {el,option}=entry;
        if(option.closest('select')!==el || option.matches(':disabled') || option.hidden) {
          say('사용 가능한 연산자가 바뀌었습니다. F로 다시 검색하세요.');focus(state.card);return;
        }
        applyOption(el,option);
        cache=null;
        const value=logicControls(state.card).find(item=>item.location===entry.location && item.valueInput);
        if(value && showChoiceValues(value.el)) return;
        if(value?.el.matches('.select2-container')) {openPicker(value.el,'field','',value.title);return;}
        focus(value?.el || (el.isConnected ? el : state.card));
        say(entry.title+(value?' · 조건 값 입력':''));
      } else if(entry.press) {
        const card=state.card;
        focus(entry.el);entry.el.click();invalidate();
        if((entry.structure || entry.remove && !entry.el.isConnected) && card.isConnected && shown(card)) {
          cache=null;
          const entries=editorEntries(card);
          if(entries.length) showFinder(entries,card,card);
        }
      } else if(entry.edit) {focus(entry.el);say(entry.title);}
      else if((entry.valueInput || state.card.matches(triggerCard)) && showChoiceValues(entry.el)) return;
      else openPicker(entry.el,'field',entry.seed,entry.title);
    }
    function applyOption(select,option) {
      if(option.selected) return;
      select.selectedIndex=option.index;
      select.dispatchEvent(new Event('input',{bubbles:true}));
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
    function choiceSelect(el) {
      if(el.matches('select')) return el;
      const select=el.nextElementSibling;
      return el.matches('.select2-container') && select?.matches('select') && select.id && el.id==='s2id_'+select.id ? select : null;
    }
    function availableChoice(option) {
      return option.label.trim() && !option.matches(':disabled,[hidden]') && !option.closest('optgroup[hidden]');
    }
    function showChoiceValues(el) {
      const select=choiceSelect(el);
      if(!select || select.disabled || select.multiple) return false;
      const entries=Array.from(select.options).filter(availableChoice).map(choice=>{
        const title=choice.label.trim();
        return {el,choice,title,label:normalize(title),key:normalize(title+' '+choice.value)};
      });
      if(!entries.length) return false;
      reveal(el);showFinder(entries,el,null,'목록 값 검색');return true;
    }
    on(query,'input',filterResults);
    on(query,'keydown',e=>{
      if(e.isComposing || e.keyCode===229) return;
      if(!['ArrowUp','ArrowDown','Enter','Escape','Tab'].includes(e.key)) return;
      e.preventDefault();e.stopPropagation();
      if(e.key==='Escape' || e.key==='Tab') {hideFinder();focus(origin?.isConnected && origin!==host ? origin : state.card);return;}
      if(e.key==='Enter') {if(matches.length && !e.repeat) chooseResult(cursor);return;}
      cursor=Math.max(0,Math.min(matches.length-1,cursor+(e.key==='ArrowDown'?1:-1)));highlightResult();
    });
    on(results,'mousedown',e=>e.preventDefault());
    on(results,'click',e=>{const row=e.target.closest('[data-index]');if(row) chooseResult(Number(row.dataset.index));});
    function invalidate() {
      cache=null;
      if (!pending) pending=setTimeout(()=>{
        pending=0;
        if (location.href!==lastUrl) { stop(true); return; }
        if (state.card && !state.card.isConnected) {
          const oldKey=state.cardKey;
          const matches=oldKey ? index().cards.filter(c=>cardKey(c)===oldKey) : [];
          select(matches.length===1 ? matches[0] : null);
          closeChoices();
          if (!state.card) say('화면이 갱신됐습니다. ↑↓로 단계를 다시 선택하세요.');
        }
        if (state.position && !state.position.isConnected) closeChoices();
        followInsertionReturn();
        if (state.picker?.returnCategory) returnToCategories(state.picker);
        else if (state.picker?.surface && !shown(state.picker.surface)) restore();
        else if (state.picker && !state.picker.committed && (!state.picker.ready ||
          state.picker.searchUntil>performance.now() && !state.picker.searchInput?.isConnected)) focusPicker();
        updateReference(state.picker);
        followFieldRow();
        followNewForm();
        syncDeleteModal();
        if(annotationCard) focusAnnotation(annotationCard);
        if(fieldCard) {
          if(!fieldCard.isConnected || fieldCard!==state.card) hideFinder();
          else {
            const updated=editorEntries(fieldCard);
            if(updated.length!==catalog.length || updated.some((v,i)=>v.el!==catalog[i].el || v.option!==catalog[i].option || v.key!==catalog[i].key)) {
              const current=matches[cursor];
              catalog=updated;filterResults();cursor=Math.max(0,matches.findIndex(v=>v.el===current?.el && v.key===current.key));highlightResult();
            }
          }
        }
        draw();scheduleReveal();
      },75);
    }
    function index() {
      if (cache) return cache;
      const rr=roots(document,host);
      for (const [r,o] of observed) if (!rr.includes(r)) { o.disconnect(); observed.delete(r); }
      for (const r of rr) if (!observed.has(r)) {
        const ob=new MutationObserver(invalidate);
        ob.observe(r,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-expanded','aria-disabled','disabled','readonly','aria-label','class','style']});
        observed.set(r,ob);
      }
      const all=q=>rr.flatMap(r=>Array.from(r.querySelectorAll(q))).filter(el=>el!==host && shown(el));
      const buttons=all(controls+',.select2-container');
      const named=all(cards).filter(el=>!el.matches('.instance-type-new') &&
        !(el.matches(triggerCard) && el.querySelector(addTrigger) && !el.querySelector(studioHeader)) &&
        !ancestor(parent(el),p=>p.matches(pickers)));
      // Numbered, expandable step headers are a fallback when card classes vary.
      for (const b of buttons) if (/^(?:(?:step|단계)\s*)?\d+[.)\s:：-]+\S/i.test(name(b)) && b.hasAttribute('aria-expanded') && !ancestor(b,n=>named.includes(n))) named.push(b.parentElement || b);
      cache={all, buttons, cards:[...new Set([...manual.card,...named])].filter(shown)};
      return cache;
    }
    function cardOf(el) { const cs=index().cards; return ancestor(el,n=>cs.includes(n)); }
    function fieldTarget(el) {
      return ancestor(el,n=>n.matches('.select2-container')) || ancestor(el,n=>n.matches(controls)) || el;
    }
    function fieldLabel(el) {
      if(el.matches('select')) return el.selectedOptions[0]?.text.trim() || name(el);
      if (el.matches('.select2-container')) {
        const label=el.querySelector('.select2-chosen');
        return label?.textContent.trim() || name(el);
      }
      return name(el);
    }
    function groupLabel(el) {
      const group=el.closest(groupSelector);
      const direct=Array.from(el.labels || []).find(n=>shown(n) && !n.contains(el) && !n.matches('.select2-offscreen'));
      const label=direct || (group && Array.from(group.querySelectorAll('.control-label,legend,label:not(.select2-offscreen)'))
        .find(n=>n.closest(groupSelector)===group && !n.closest('.select2-container') && shown(n)));
      return (label?.innerText || '').trim().replace(/\s+/g,' ').replace(/\s*\*$/,'').trim();
    }
    function fieldDescription(el,rowLabel='') {
      const current=fieldLabel(el);
      const pill=el.matches('.dot_walk_btn') || pillName.test(current);
      const owner=rowLabel || groupLabel(el);
      if(pill) {
        const target=rowLabel || (pillName.test(current) && current.replace(pillName,'').trim()) || owner;
        const label=target || '데이터 필';
        return {label,title:label,pill:true,accessible:label+' · Data Pill Picker'};
      }
      const label=owner || current || '필드 선택기';
      return {label,title:owner && current && normalize(owner)!==normalize(current) ? owner+' · '+current : label,pill:false};
    }
    function styleRoot(el) {
      const r=el.getRootNode();
      if (!styleNodes.has(r)) {
        const style=document.createElement('style');style.textContent=sheet;
        (r.head || r).append(style);styleNodes.set(r,style);
      }
    }
    function mark(kind,el) {
      const prev=state[kind];
      if (prev===el) return;
      prev?.removeAttribute(marks[kind]);state[kind]=el;
      if (!el) return;
      styleRoot(el);
      el.setAttribute(marks[kind],'');
    }
    function select(el) {mark('card',el);state.cardKey=el && cardKey(el);mark('field',null);}
    function focus(el,context=null) {
      if (!el || !shown(el)) return;
      if (el.tabIndex<0 && !el.hasAttribute('tabindex')) {
        el.setAttribute('tabindex','-1');tempFocus.add(el);
      }
      el.focus({preventScroll:true});reveal(el,context);
    }
    // Measure each scrollport after moving its child. Picker lists, the canvas
    // and the document can all have different visible bounds in the same frame.
    function scrollWithin(box,anchor,context=null,padding=0) {
      const root=box===document.scrollingElement;
      const top=root ? 0 : box.getBoundingClientRect().top+box.clientTop;
      const height=root ? innerHeight : box.clientHeight;
      if(!height || box.scrollHeight<=height) return;
      const margin=Math.min(padding,height*0.1);
      const room=height-2*margin;
      const rect=anchor.getBoundingClientRect();
      let start=rect.top, end=Math.min(rect.bottom,start+room);
      if(context && context!==anchor) {
        const area=context.getBoundingClientRect();
        if(area.height && Math.max(end,area.bottom)-Math.min(start,area.top)<=room) {
          start=Math.min(start,area.top);end=Math.max(end,area.bottom);
        } else if(context.matches(searchableMenu) && anchor.matches(textSearch)) {
          // A large Action menu needs the search box and a few visible results.
          end=Math.max(end,Math.min(area.bottom,rect.bottom+140,start+room));
        }
      }
      const above=start-top-margin, below=end-(top+height-margin);
      const delta=above < -1 ? above : below > 1 ? below : 0;
      if(delta) box.scrollBy({top:delta,behavior:'instant'});
    }
    let viewportTarget=null, viewportFrame=0, viewportTimer=0;
    const viewportSize=new ResizeObserver(scheduleReveal);
    function releaseViewport() {
      viewportTarget=null;viewportSize.disconnect();
      clearTimeout(viewportTimer);cancelAnimationFrame(viewportFrame);viewportFrame=0;
    }
    function placeViewport() {
      if(!viewportTarget) return;
      const {anchor,context}=viewportTarget;
      if(!anchor.isConnected || !shown(anchor)) {releaseViewport();return;}
      for(let box=parent(anchor);box;box=parent(box)) {
        const style=getComputedStyle(box), root=box===document.scrollingElement;
        const scrollable=/^(auto|scroll|overlay)$/;
        if(root || box.scrollHeight>box.clientHeight && scrollable.test(style.overflowY)) {
          scrollWithin(box,anchor,context?.isConnected && !context.contains(box) ? context : null,20);
        }
        if(box.scrollWidth>box.clientWidth && (root || scrollable.test(style.overflowX))) {
          const left=root ? 0 : box.getBoundingClientRect().left+box.clientLeft;
          const rect=anchor.getBoundingClientRect();
          const right=left+box.clientWidth;
          if(rect.left>left+1 && rect.right>right+1) {
            box.scrollBy({left:Math.min(rect.left-left,rect.right-right),behavior:'instant'});
          } else if(rect.left<left-1 && rect.right<right-1) {
            box.scrollBy({left:Math.max(rect.left-left,rect.right-right),behavior:'instant'});
          }
        }
        if(style.position==='fixed') break;
      }
    }
    function scheduleReveal() {
      if(viewportTarget && !viewportFrame) viewportFrame=requestAnimationFrame(()=>{
        viewportFrame=0;placeViewport();
      });
    }
    function reveal(el,context=null) {
      releaseViewport();
      let anchor=el.closest('.select2-container') || el;
      if(anchor.matches(cards)) anchor=anchor.querySelector(studioHeader) || anchor;
      context ||= anchor.matches(textSearch) && anchor.closest(searchableMenu) ||
        (!anchor.closest(pickers+', '+searchableMenu) && anchor.closest(groupSelector)) || null;
      viewportTarget={anchor,context};
      viewportSize.observe(anchor);
      if(context && context!==anchor) viewportSize.observe(context);
      placeViewport();scheduleReveal();
      viewportTimer=setTimeout(releaseViewport,1500);
    }
    const tempFocus=new Set();
    function clearRow() {
      rowSize.disconnect();
      insertionRow?.removeAttribute('data-flowkeys-insertion-row');
      insertionRow?.removeAttribute('data-flowkeys-row-relative');
      insertionRow=null;rowCaption.remove();rowCaption.removeAttribute('data-inline');
    }
    function closeChoices() {
      state.card?.removeAttribute('data-flowkeys-preview-origin');
      state.position=null;state.choices=null;state.choiceKind=null;state.quickOrigin=null;state.previewOrigin=null;clearRow();
    }
    function stepTitle(card) {
      const header=card?.matches(studioHeader) ? card : card?.querySelector(studioHeader);
      const title=header ? name(header) : card && (card.getAttribute('aria-label') || card.innerText);
      return (title || '').replace(/^(?:expand|collapse)\s+(?:action|flow logic|subflow)\s+(\d+)\s*-\s*(?:[^-]+\s+-\s+)?/i,'$1. ').trim().slice(0,80);
    }
    function relativePosition(label) {
      if(/before first action/i.test(label)) return '첫 Action 앞';
      const match=label.match(/\b(child of|inside|after|before)\s+(.+)/i);
      if(!match) return '';
      const title=match[2].replace(/^(\d+)\s*-\s*/, '$1. ');
      const relation={'child of':'분기 안','inside':'분기 안','after':'뒤','before':'앞'};
      return title+' '+relation[match[1].toLowerCase()];
    }
    function insertionPosition(el) {
      if(el.matches(addTrigger)) return 'Add Trigger';
      const direct=relativePosition(name(el));
      if(direct) return direct;
      const row=el.closest('.instance-type-new') || el;
      // Studio replaces a + with a temporary row. Its adjacent drop target
      // still describes the original branch or numbered action.
      for(let n=row;n && !n.matches('.section,#app-floweditor');n=n.parentElement) {
        const prev=n.previousElementSibling;
        if(prev?.matches('.drop-target-wrapper')) {
          const opener=prev.querySelector('.addInstanceBtn [aria-label]');
          const text=opener && relativePosition(name(opener));
          if(text) return text;
        }
        if(n.matches('.actionContainer')) {
          const header=n.querySelector(studioHeader);
          if(header && n.contains(row)) return stepTitle(header)+' 분기 안';
        }
      }
      const owner=cardOf(el);
      if(owner) return stepTitle(owner)+' 안';
      const steps=index().cards.filter(c=>c.getRootNode()===row.getRootNode() && !c.matches('[role=treeitem]') && !c.contains(row) && !row.contains(c));
      const prev=steps.filter(c=>c.compareDocumentPosition(row)&Node.DOCUMENT_POSITION_FOLLOWING).at(-1);
      if(prev) return stepTitle(prev)+' 뒤';
      return steps.length ? stepTitle(steps[0])+' 앞' : '첫 단계 위치';
    }
    function draw() {
      const el=state.position || state.picker?.categories?.find(enabled);
      if(!el || !shown(el)) {if(rowCaption.isConnected) clearRow();return;}
      const row=el.closest(el.matches(addTrigger) ? '.trigger-section' : '.instance-type-new,.drop-target-wrapper');
      if(!rowCaption.isConnected || insertionRow!==row) {
        clearRow();styleRoot(el);insertionRow=row;
        if(row) {
          if(getComputedStyle(row).position==='static') row.setAttribute('data-flowkeys-row-relative','');
          row.setAttribute('data-flowkeys-insertion-row','');row.append(rowCaption);rowSize.observe(row);
        } else el.after(rowCaption);
      }
      if(!row) return;
      const buttons=Array.from(row.querySelectorAll('button,a,[role=button]')).filter(shown);
      const rect=row.getBoundingClientRect();
      const right=Math.max(el.getBoundingClientRect().right,...buttons.map(b=>b.getBoundingClientRect().right));
      const inline=rect.right-right>captionText.scrollWidth+32 && el.getBoundingClientRect().height>=24 && row.matches('.instance-type-new');
      rowCaption.toggleAttribute('data-inline',inline);
      if(inline && rowCaption.parentElement!==row) row.append(rowCaption);
      else if(!inline && row.nextElementSibling!==rowCaption) row.after(rowCaption);
    }
    function preview(i) {
      const el=state.choices[i];state.position=el;
      const description='삽입 위치 · '+insertionPosition(el)+' ('+(i+1)+'/'+state.choices.length+')';
      captionText.textContent=description;draw();
      state.card?.setAttribute('data-flowkeys-preview-origin','');
      mark('field',null);
      focus(el,rowCaption);
      const quick=state.quickOrigin && !el.matches(addTrigger);
      say(description+(quick?' · ↑↓ 위치 · Enter Action · → 단계 종류 · Esc 취소':' · ↑↓ 이동 · Enter 열기 · Esc 취소'));
    }
    function localButtons(card) {return index().buttons.filter(b=>cardOf(b)===card && enabled(b));}
    function stepButton(card,spec) {
      if(!card?.isConnected || !shown(card)) return null;
      const buttons=Array.from(card.querySelectorAll(spec.selector)).filter(el=>
        cardOf(el)===card && el.matches('button,a,[role=button]') && el.getClientRects().length &&
        el.checkVisibility({visibilityProperty:true}) && !ancestor(el,n=>n.matches(':disabled,[hidden],[inert],[aria-hidden=true],[aria-disabled=true],[data-read-only=true]')));
      // Prefer the open editor's Delete button over its hover toolbar icon.
      return buttons.find(b=>b.id.endsWith('_btnDelete') || b.id==='flow_trigger_btn_delete') || buttons[0];
    }
    function focusAnnotation(card) {
      const editor=Array.from(card.querySelectorAll('input[aria-label*="annotation text field" i],textarea[aria-label*="annotation" i]'))
        .find(el=>enabled(el) && cardOf(el)===card);
      if(!editor) return false;
      annotationCard=null;clearTimeout(annotationTimer);
      focus(editor);say(stepTitle(card)+' · Annotation · Enter 저장 · Esc 닫기');return true;
    }
    function openAnnotation(card,button) {
      if(focusAnnotation(card)) return;
      annotationCard=card;
      // Studio's annotation control also uses the primary mouse gesture.
      const mouse={view:window,bubbles:true,cancelable:true,composed:true,button:0,detail:1};
      button.dispatchEvent(new MouseEvent('mousedown',{...mouse,buttons:1}));
      button.dispatchEvent(new MouseEvent('mouseup',mouse));
      button.dispatchEvent(new MouseEvent('click',mouse));
      if(!focusAnnotation(card)) {
        say(stepTitle(card)+' · Annotation');
        clearTimeout(annotationTimer);
        annotationTimer=setTimeout(()=>{
          if(annotationCard===card && deepActive()===button) say(stepTitle(card)+' · Enter로 Annotation 열기');
          annotationCard=null;
        },1200);
      }
    }
    function deleteModal(card) {
      for(const root of new Set([card.getRootNode(),document])) {
        const dialog=Array.from(root.querySelectorAll('.instanceDeleteModal[role=dialog]')).find(shown);
        if(!dialog) continue;
        const cancel=dialog.querySelector('#instanceDeleteModal_cancelButton');
        const confirm=dialog.querySelector('#instanceDeleteModal_confirmButton');
        if(cancel && confirm) return {dialog,cancel,confirm};
      }
      return null;
    }
    function syncDeleteModal() {
      if(!deletion) return;
      const {card,title,dialog}=deletion;
      if(dialog) {
        if(shown(dialog)) return;
        deletion=null;
        const current=cardOf(deepActive());
        if(current) select(current);
        else if(card.isConnected && shown(card) && deepActive()===document.body) {select(card);focus(card);}
        say(card.isConnected?'삭제 확인 창을 닫았습니다.':title+' · 단계가 제거됐습니다.');
        return;
      }
      const modal=deleteModal(card);
      if(!modal) return;
      clearTimeout(deletion.timer);Object.assign(deletion,modal);
      const active=deepActive();
      if(active!==modal.cancel && active!==modal.confirm) focus(enabled(modal.confirm)?modal.confirm:modal.cancel);
      say(title+' · ← 취소 · → 삭제 · Enter 선택 · Esc 취소');
    }
    function awaitDeleteModal(card) {
      if(deletion) clearTimeout(deletion.timer);
      const pendingDelete={card,title:stepTitle(card)};
      deletion=pendingDelete;
      pendingDelete.timer=setTimeout(()=>{
        if(deletion===pendingDelete && !deletion.dialog) {
          deletion=null;say('Studio에서 삭제 대상과 확인 창을 확인하세요.');
        }
      },3500);
    }
    function runStep(spec) {
      const card=commandCard;
      const button=card===state.card && stepButton(card,spec);
      if(!button) {say('현재 단계에서 '+spec.label+'을 사용할 수 없습니다.');return;}
      const title=stepTitle(card) || '현재 단계';
      button.focus({preventScroll:true});reveal(button);
      if(!button.isConnected || !card.isConnected) {say('단계가 갱신됐습니다. 명령을 다시 여세요.');return;}
      if(spec.id==='delete') {
        say(title+' · 삭제 확인 창 열기');
        button.click();syncDeleteModal();return;
      }
      if(spec.id==='annotation') {openAnnotation(card,button);return;}
      if(spec.id==='duplicate') expectForm();
      say(title+' · '+spec.label);button.click();
      if((spec.id==='done' || spec.id==='cancel') && card.isConnected &&
          (!button.isConnected || !shown(button)) && deepActive()===document.body) focus(card);
    }
    function insertionTargets() {
      const idx=index();
      if(idx.insertions) return idx.insertions;
      const list=idx.buttons.filter(b=>!idx.cards.includes(b) && enabled(b) && (additions.test(name(b)) ||
        (cardOf(b) && /^\+$/.test(name(b)))) && !ancestor(parent(b),p=>p.matches(pickers)));
      const canonical=list.filter(b=>!b.matches(categoryButtons)).map(b=>
        b.closest('.instance-type-new')?.querySelector('#flow_action_btnToggleAction') || b);
      const trigger=index().buttons.find(el=>el.matches(addTrigger) && enabled(el));
      idx.insertions=uniqueControls([...(trigger ? [trigger] : []),...manual.add,...canonical].filter(enabled));
      return idx.insertions;
    }
    function beginAdd(quickOrigin=null,placement='') {
      const candidates=insertionTargets();
      if (!candidates.length) {say('삽입점을 찾지 못했습니다. 도움말의 삽입점 연결을 사용하세요.');return;}
      state.previewOrigin=quickOrigin || (ui.contains(deepActive()) ? state.card : deepActive());
      state.choices=candidates;
      state.quickOrigin=quickOrigin;
      state.choiceKind='add';
      const title=stepTitle(state.card);
      const after=title && (candidates.find(b=>b.matches(hoverInsertion) && relativePosition(name(b))===title+' 뒤') ||
        candidates.find(b=>b.closest('.new-component-last') && insertionPosition(b)===title+' 뒤'));
      const previous=placement && candidates.find(b=>insertionPosition(b)===placement);
      const first=previous || after ? candidates.indexOf(previous || after) : candidates.findIndex(b=>cardOf(b)===state.card);
      if (candidates.length===1 && !quickOrigin) openPicker(candidates[0],'add');
      else preview(Math.max(0,first));
    }
    function uniqueControls(list) {
      const unique=[...new Set(list)];
      return unique.filter(el=>!unique.some(other=>other!==el && ancestor(other,n=>n===el)));
    }
    function fieldEntries(card,candidates) {
      const entries=new Map();
      function add(el,label,detail,value='',edit=false,description=null) {
        if(!el || entries.has(el) || !enabled(el) || cardOf(el)!==card) return;
        const title=description?.title || [label,detail,value.slice(0,55)].filter(Boolean).join(' · ');
        const aliases=description?.pill?'Data Pill Picker 데이터 필 선택기':'';
        entries.set(el,{...description,el,title,edit,label:normalize(label),key:normalize([title,aliases,description?.section,description?.internalName,value,el.id].join(' '))});
      }
      for(const button of card.querySelectorAll(addFieldButton)) {
        const template=button.closest('.template_picker') || button.closest(templateGroup);
        if(!template) continue;
        const section=groupLabel(button) || 'Field Values';
        const title=section+' · '+(button.innerText.trim() || 'Add field value');
        add(button,section,'','',false,{title,section,template,addRow:true,internalName:'필드 값 추가'});
      }
      for(const row of card.querySelectorAll('.template_picker .colrow,[id$="_template_fields"] .colrow')) {
        const valueBox=row.querySelector('.colfield,[id$="_colfield"]');
        const field=Array.from(row.querySelectorAll('.select2-container')).find(el=>!valueBox?.contains(el));
        if(!field || !shown(field)) continue;
        const label=fieldLabel(field) || '필드';
        const template=row.closest('.template_picker') || row.closest(templateGroup);
        const section=groupLabel(template) || 'Field Values';
        const internalName=field.nextElementSibling?.matches('select') ? field.nextElementSibling.value : '';
        const context={template,section,internalName};
        if(valueBox) {
          const value=Array.from(valueBox.querySelectorAll('.select2-container,textarea,[contenteditable="true"],[contenteditable="plaintext-only"],input:not([type="hidden"],[type="password"],[type="button"],.select2-offscreen),select:not(.select2-offscreen)')).find(enabled);
          if(value) {
            const picker=value.matches('.select2-container,select,[role=combobox]');
            const current=value.matches('.select2-container')?fieldLabel(value):
              value.matches('select')?value.selectedOptions[0]?.text : value.value ?? value.textContent;
            add(value,label,'값',String(current || '').trim(),!picker,{...context,valueInput:picker});
          }
        }
        add(field,label,'필드 선택','',false,{...context,blank:!!field.querySelector('.select2-choice.select2-default')});
        const pill=valueBox?.querySelector('.dot_walk_btn');
        if(pill) add(pill,label,'','',false,{...context,...fieldDescription(pill,label)});
      }
      for(const el of candidates) {
        if(entries.has(el) || el.closest(templateGroup) && !manual.field.has(el)) continue;
        const description=fieldDescription(el);
        const edit=el.matches('input,textarea,[contenteditable=true],[contenteditable=plaintext-only],[role=textbox]') && !el.matches('[role=combobox]');
        add(el,description.label,'','',edit,description);
      }
      return [...entries.values()];
    }
    let pendingFieldRow=null;
    function followFieldRow() {
      const pending=pendingFieldRow;
      if(!pending) return;
      const {card,buttonId,seed}=pending;
      if(card!==state.card || !card.isConnected || performance.now()>pending.until) {pendingFieldRow=null;return;}
      if(pending.opened?.isConnected) return;
      let template=pending.template;
      if(!template.isConnected && buttonId) template=card.querySelector('#'+CSS.escape(buttonId))?.closest(templateGroup);
      if(!template) return;
      const field=Array.from(template.querySelectorAll('.colrow .select2-container')).find(el=>
        !el.closest('.colfield,[id$="_colfield"]') && el.querySelector('.select2-choice.select2-default') && enabled(el));
      if(!field) return;
      // Studio may replace the initial Select2 control while loading table metadata.
      // Reopen the replacement in the same row, without adding a second row.
      const rowIndex=Array.from(template.querySelectorAll('.colrow')).indexOf(field.closest('.colrow'));
      if(pending.opened) {
        pendingFieldRow=null;
        if(rowIndex!==pending.rowIndex) return;
      } else {
        pending.opened=field;pending.rowIndex=rowIndex;
      }
      openPicker(field,'field',seed,fieldLabel(field));
    }
    function actionFields(card) {
      const inputs=formInputs(card).map(el=>el.closest('.select2-container') || el);
      const openers=localButtons(card).filter(b=>b.matches('[id^="picker2col_opener_"]'));
      const linked=Array.from(manual.field).filter(el=>cardOf(el)===card);
      return fieldEntries(card,[...new Set([...inputs,...openers,...linked])].filter(el=>
        !el.closest('[id="picker2col_opener_select_action"]') &&
        !/annotation text field/i.test(el.getAttribute('aria-label') || '')));
    }
    function logicControls(card) {
      const form=Array.from(card.querySelectorAll('form.inputFields')).find(el=>shown(el) && cardOf(el)===card);
      if(!form) return [];
      const rowSelector='.condition-row,[data-condition-row]';
      const rows=Array.from(form.querySelectorAll(rowSelector));
      const rowNames=new Map(rows.map((row,i)=>{
        const description=row.querySelector('.and-btn,.or-btn,[aria-label*="condition set" i]')?.getAttribute('aria-label') || '';
        const numbers=description.match(/condition set\s+(\d+).*?condition\s+(\d+)/i);
        return [row,numbers?'그룹 '+numbers[1]+' · 조건 '+numbers[2]:'조건 '+(i+1)];
      }));
      const entries=[];
      const visited=new Set();
      for(const node of form.querySelectorAll(controls+',textarea,[contenteditable=true],[contenteditable=plaintext-only],.select2-container')) {
        const el=node.closest('.select2-container') || node;
        if(visited.has(el) || cardOf(el)!==card || !enabled(el) || el.closest(pickers) ||
            el.matches('.select2-offscreen,input[type=hidden]')) continue;
        visited.add(el);
        const row=el.closest(rowSelector);
        const comparison=row && (row.querySelector('.colselect select,select[name="col2"]') || row.querySelector('select'));
        const pill=el.matches('.dot_walk_btn') || pillName.test(name(el));
        const select=el.matches('select,.select2-container,[role=combobox]');
        const press=el.matches('button,a,[role=button],[role=checkbox],[role=radio],input[type=checkbox],input[type=radio],input[type=button],input[type=submit],[ng-click],[data-ng-click]');
        const edit=el.matches('input,textarea,[contenteditable=true],[contenteditable=plaintext-only],[role=textbox]');
        if(!pill && !select && !press && !edit) continue;
        const location=rowNames.get(row);
        if(el===comparison) {
          for(const option of el.options) {
            if(option.matches(':disabled') || option.hidden || option.closest('optgroup[hidden]')) continue;
            const label=option.label.trim();
            const title=location+' · 연산자 · '+label;
            entries.push({el,option,location,title,label:normalize(label),key:normalize(title+' operator '+option.value)});
          }
          continue;
        }
        const valueInput=!!(comparison && (comparison.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING) &&
          (select || edit) && !press && !pill);
        const native=name(el), text=el.innerText?.trim() || '';
        let label=el.getAttribute('aria-label') || groupLabel(el) || el.getAttribute('placeholder') || text || el.id || el.name;
        const and=el.matches('.and-btn'), or=el.matches('.or-btn');
        const group=el.matches('[id$="btnAddConditionsSet"]') || /add another condition set/i.test(native);
        const remove=/remove condition/i.test(native);
        if(and || or) label=and?'AND':'OR';
        else if(group) label='OR · 새 조건 그룹 추가';
        else if(remove) label='조건 삭제';
        else if(pill && row) label=/for condition set/i.test(native)?'조건 필드':'조건 값';
        else if(el.id==='condition_name') label='Condition Label';
        else if(valueInput) label='조건 값 입력';
        else if(press) label=text || native || label;
        if(!label) continue;
        const title=[location,label].filter(Boolean).join(' · ');
        const accessible=pill?title+' · Data Pill Picker':title;
        entries.push({el,title,pill,accessible,location,valueInput,join:and?'and':or || group?'or':'',label:normalize(label),
          key:normalize([accessible,native,el.id,group?'group set':'',remove?'remove delete':''].join(' ')),
          edit:edit && !press && !select && !pill,press:press && !select && !pill,structure:and || or || group,remove});
      }
      return entries;
    }
    function editorEntries(card) {
      if(card.matches(triggerCard)) {
        const entries=actionFields(card);
        const toggle=card.querySelector('#adv_trigger_toggle_button');
        if(toggle && enabled(toggle)) {
          const title='Advanced Options · '+(toggle.getAttribute('aria-expanded')==='true'?'접기':'펼치기');
          entries.push({el:toggle,title,label:'advanced options',key:normalize(title+' 고급 옵션'),press:true,structure:true});
        }
        for(const spec of stepCommands.filter(s=>['done','cancel','delete'].includes(s.id))) {
          const el=stepButton(card,spec);
          if(el && enabled(el)) entries.push({el,title:spec.label,label:spec.id,key:spec.id,press:true});
        }
        return entries;
      }
      return card.matches(logicCard)?logicControls(card):actionFields(card);
    }
    function beginField() {
      const active=deepActive(), card=state.card;
      if (!card) {say('먼저 조건이 있는 카드를 선택하세요.');return;}
      for (const el of manual.field) if (!el.isConnected) manual.field.delete(el);
      for (const id of fieldBindings.get(cardKey(card)) || []) {
        const replacement=card.querySelector('#'+CSS.escape(id));
        if (replacement && cardOf(replacement)===card) manual.field.add(replacement);
      }
      if(card.matches(actionCard+', '+logicCard) || card.matches(triggerCard) && card.querySelector('#adv_trigger_toggle_button,#flow_trigger_btn_done')) {
        const entries=editorEntries(card);
        if(entries.length) {showFinder(entries,active,card);return;}
      }
      const automatic=localButtons(card).filter(b=>!b.matches('select.select2-offscreen,[id$="-script"]') && (fields.test(name(b)) || b.matches(fieldButtons)));
      const candidates=uniqueControls([...manual.field,...automatic].map(fieldTarget)
        .filter(b=>cardOf(b)===card && enabled(b)));
      if(card.querySelector('[id$="_template_fields"]')) {
        const entries=fieldEntries(card,candidates);
        if(entries.length) {showFinder(entries);return;}
      }
      const row=ancestor(active,n=>n.matches('[role=row],tr,[data-condition-row],[class*="condition-row"]'));
      const sameRow=row && candidates.filter(b=>ancestor(b,n=>n===row));
      const picks=sameRow?.length ? sameRow : candidates;
      const bound=picks.filter(b=>manual.field.has(b));
      const seen=new Set();
      const repeated=picks.some(b=>{
        const label=normalize(fieldLabel(b));
        if(seen.has(label)) return true;
        seen.add(label);return false;
      });
      if(bound.length!==1 && repeated) {showFinder(fieldEntries(card,picks));return;}
      let target=(bound.length===1 && bound[0]) || picks.find(b=>ancestor(active,n=>n===b)) || (picks.length===1 ? picks[0] : null);
      if (!target && picks.length) {
        const explicit=picks.filter(b=>b.matches('.dot_walk_btn') || fields.test(name(b)));
        if (explicit.length===1) target=explicit[0];
      }
      if (!target && picks.length) {
        showFinder(fieldEntries(card,picks));return;
      }
      if (!target) {say('필드 선택기를 찾지 못했습니다. 도움말에서 필드 연결을 사용하세요.');return;}
      openPicker(target,'field');
    }
    function openPicker(el,kind,seed='',title='',choice=null,openAction=false,preferredCategory='') {
      if (!enabled(el)) {closeChoices();say('대상이 바뀌었습니다. 위치를 다시 선택하세요.');return;}
      const owner=cardOf(el) || state.card;
      const placement=kind==='add' ? insertionPosition(el) : '';
      const quickOrigin=state.quickOrigin;
      closeChoices();
      const description=kind==='field' && fieldDescription(el);
      if(description) {title=title || description.title;reveal(el);}
      const before=new Set(index().all(pickers+', '+search));
      state.picker={el,kind,owner,before,seed,placement,choice,quickOrigin,openAction,preferredCategory,cardsBefore:new Set(index().cards),ready:false,surface:null};
      if(kind==='add' && el.matches(addTrigger)) {
        state.picker.trigger=true;
        state.picker.triggerScope=el.closest('.trigger-section');
        reveal(el);el.click();invalidate();focusPicker();return;
      }
      if(kind==='add' && (el.id==='flow_action_btnToggleAction' || el.closest('#app-floweditor'))) {
        const p=state.picker;
        const local=el.closest('.instance-type-new') || el.parentElement;
        p.categoryScope=local;
        p.previousCategories=new Set(index().all(categoryButtons));
        const alreadyOpen=Array.from(local.querySelectorAll(categoryButtons)).some(enabled);
        reveal(el);
        if(!alreadyOpen) el.click();
        invalidate();focusPicker();return;
      }
      if (el.matches('.select2-container')) {
        const opener=el.querySelector('.select2-choice,.select2-choices');
        if (!opener) {state.picker=null;say('Table 선택 버튼을 찾지 못했습니다.');return;}
        // Select2 3.x opens on primary mousedown, before a click is delivered.
        opener.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,view:window,button:0,buttons:1}));
        invalidate();
        focusPicker();
        if(!choice) say('필드 선택 · '+title);
        return;
      }
      focus(el);
      if (el.matches('select')) {
        try {el.showPicker();} catch {el.focus();}
        state.picker=null;return;
      }
      el.click();invalidate();focusPicker();
      say(kind==='add'?'단계 추가 · Studio 선택기에서 항목을 고르세요.':'필드 선택 · '+title,description?.pill && el);
    }
    function updateReference(p) {
      if(!p?.el.matches('.select2-reference') || !p.surface?.matches('.select2-drop-active')) return;
      const surface=p.surface;
      const notice=surface.querySelector('.select2-no-results,.select2-searching,.select2-error,.select2-searching-error,[role=alert]');
      const text=notice?.textContent.trim() || '';
      const labels=[...surface.querySelectorAll('li.select2-result-selectable .select2-result-label')];
      let message;
      if(/forbidden|access denied|permission denied|insufficient (?:access|permission)|unauthorized|\b40[13]\b|권한/i.test(text)) message='참조 검색 권한이 없습니다.';
      else if(notice?.matches('.select2-error,.select2-searching-error,[role=alert]') || /failed|error|오류/i.test(text)) message='참조 검색에 실패했습니다.';
      else if(notice?.matches('.select2-no-results')) message='검색 결과가 없습니다.';
      else if(notice?.matches('.select2-searching') || surface.querySelector('input.select2-active')) message='참조 검색 중…';
      else if(labels.length) message='참조 검색 · ↑↓ 이동 · Enter 선택 · Esc 돌아가기';
      if(message && p.notice!==message) {p.notice=message;say(message);}
      if(!p.el.id.startsWith('s2id_field_values_assigned_to_') || !labels.length) return;
      const seen=new Set(), repeated=new Set();
      for(const label of labels) {
        const name=normalize(label.textContent);
        if(seen.has(name)) repeated.add(name);
        seen.add(name);
      }
      const duplicates=labels.filter(label=>repeated.has(normalize(label.textContent)));
      if(!duplicates.length || duplicates.every(label=>p.requestedIds?.has(label))) return;
      p.requestedIds ||= new WeakSet();
      for(const label of duplicates) p.requestedIds.add(label);
      void identifyAssignees(p,duplicates);
    }
    async function identifyAssignees(p,labels) {
      try {
        const records=await chrome.runtime.sendMessage('flow-keys-assignee-ids');
        const byOption=new Map((records || []).map(r=>[r.option,r]));
        const matched=labels.map(label=>({label,record:byOption.get(label.id)})).filter(({label,record})=>
          record?.text===label.textContent.trim() && /^[a-f0-9]{32}$/i.test(record.key));
        const current=()=>!abort.signal.aborted && state.picker===p && shown(p.surface);
        if(!current()) return;
        if(matched.length<labels.length) say('동명이인 · 일부 결과의 사용자 ID를 확인할 수 없습니다.');
        const mark=(label,record,value)=>{
          if(!p.surface.contains(label) || label.id!==record.option || label.textContent.trim()!==record.text) return;
          p.identityLabels ||= new Map();
          if(!p.identityLabels.has(label)) p.identityLabels.set(label,label.getAttribute('aria-label'));
          label.dataset.flowkeysIdentity=value;
          label.setAttribute('aria-label',record.text+' · '+value);
        };
        for(const {label,record} of matched) mark(label,record,record.login || record.key);
        const keys=[...new Set(matched.filter(({record})=>!record.login).map(({record})=>record.key))];
        if(!keys.length) return;
        const params=new URLSearchParams({sysparm_query:'sys_idIN'+keys.join(','),sysparm_fields:'sys_id,user_name',sysparm_limit:String(keys.length)});
        const res=await fetch('/api/now/table/sys_user?'+params,{signal:abort.signal,credentials:'same-origin',redirect:'error',headers:{Accept:'application/json'}});
        if(!current() || !res.ok) return;
        const body=await res.json();
        if(!current() || !Array.isArray(body.result)) return;
        const users=new Map(body.result.map(r=>[r.sys_id,r.user_name]));
        for(const {label,record} of matched) {
          const login=users.get(record.key);
          if(typeof login==='string' && login) mark(label,record,login.slice(0,160));
        }
      } catch { /* Studio keeps its native search available if identity lookup fails. */ }
    }
    function focusPicker() {
      const p=state.picker;if (!p) return;
      if(p.categoryScope) {
        const categories=index().all(categoryButtons).filter(b=>enabled(b) &&
          (p.categoryScope.contains(b) || !p.previousCategories.has(b)));
        if(categories.length) {
          p.categories=categories;p.ready=true;
          captionText.textContent='삽입 위치 · '+p.placement;draw();
          const action=categories.find(b=>b.id==='flow_action_newAction');
          if(p.openAction && action) {p.openAction=false;action.click();return;}
          focus(categories.find(button=>button.id===p.preferredCategory) || action || categories[0],rowCaption);
          say('단계 종류 · ← → 이동 · Enter 열기 · Esc 삽입 위치');return;
        }
        // The insertion control and the three category buttons can render in different updates.
        return;
      }
      if(p.category || p.property || p.trigger) {
        if(p.category?.id==='flow_action_newFlowLogic') {
          const local=p.category.closest('.instance-type-new') || p.category.parentElement;
          const list=Array.from(local?.querySelectorAll(logicList) || []).find(shown) ||
            index().all(logicList).find(el=>!p.before.has(el));
          if(!list) return;
          const items=logicItems(list);
          if(!items.length) return;
          p.surface=list;p.ready=true;
          focusLogic(items.find(item=>item.matches('[aria-selected=true],.selected')) || items[0]);return;
        }
        const opener=p.category || p.el;
        const local=p.trigger ? p.triggerScope : p.property ? p.owner || opener.parentElement : opener.closest('.instance-type-new') || opener.parentElement;
        const input=Array.from(local?.querySelectorAll(stepSearch) || []).find(el=>el.matches(textSearch) && enabled(el)) ||
          index().all(stepSearch).find(el=>!p.before.has(el));
        if(!input) return;
        p.surface=input.closest(searchableMenu) || (p.trigger && input.closest('#picker2col_wrapper_select_trigger')) || input;
        p.searchInput=input;
        p.ready=true;p.searchUntil ??= performance.now()+700;
        focus(input);
        say('검색창에 이름을 입력하세요 · ↓ 목록 탐색 · Enter 선택'+(p.category?' · Esc 단계 종류':''));return;
      }
      const id=p.el.getAttribute('aria-controls');
      const linked=id && p.el.getRootNode().getElementById?.(id);
      const fresh=index().all(pickers+', '+search).filter(el=>!p.before.has(el));
      const surface=fresh.find(el=>el.matches(surfaces)) || (linked && shown(linked) && linked) || fresh.find(el=>el.matches(pickers));
      const input=index().all(search).find(el=>surface ? ancestor(el,n=>n===surface) : fresh.includes(el));
      if (!surface && !input) return;
      p.surface=surface || input;
      if(p.choice && surface?.matches('.select2-drop')) {
        const select=choiceSelect(p.el);
        const choice=p.choice;
        const resultId=p.el.querySelector('[aria-owns]')?.getAttribute('aria-owns') || surface.querySelector('input[aria-owns]')?.getAttribute('aria-owns');
        const list=resultId && surface.querySelector('#'+CSS.escape(resultId));
        if(!list || !list.children.length) return;
        const siblings=select && Array.from(select.options).filter(o=>availableChoice(o) && o.label.trim()===choice.label.trim());
        const candidates=Array.from(list.querySelectorAll('.select2-result-selectable')).filter(li=>
          (li.querySelector('.select2-result-label')?.textContent || '').trim()===choice.label.trim());
        const target=siblings?.length===candidates.length && candidates[siblings.indexOf(choice)];
        p.ready=true;p.choice=null;
        if(!target) {say('Studio 목록이 바뀌었습니다. 현재 목록에서 값을 선택하세요.');return;}
        const label=target.querySelector('.select2-result-label');
        for(const type of ['mousemove','mouseup']) label.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,view:window,button:0}));
        say(choice.label+' 선택');invalidate();return;
      }
      if (input) {
        p.searchInput=input;
        p.ready=true;focus(input);
        if(p.seed && input instanceof HTMLInputElement) {
          input.value=p.seed;p.seed='';
          input.dispatchEvent(new Event('input',{bubbles:true}));
          input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true}));
        }
      }
    }
    function resumeSearch(e,el) {
      const k=e.key;
      if(e.ctrlKey || e.metaKey || e.altKey || e.isComposing ||
          !(k.length===1 && k!==' ' || k==='Backspace' || k==='Dead' || k==='Process' || e.keyCode===229)) return false;
      if(!(el instanceof Element) || el.closest('input,textarea,select,[contenteditable]:not([contenteditable=false]),[role=textbox],'+logicList)) return false;
      const menu=el.closest(searchableMenu);
      const picker=state.picker;
      const tracked=picker?.surface?.contains(el) && picker.searchInput;
      const input=(tracked && (!menu || menu.contains(tracked)) && tracked.isConnected && enabled(tracked) && tracked.matches(textSearch))
        ? tracked : menu && Array.from(menu.querySelectorAll(textSearch)).find(n=>n.closest(searchableMenu)===menu && enabled(n));
      if(!input) return false;
      input.focus({preventScroll:true});
      if(deepActive()!==input) return false;
      reveal(input,menu);
      e.stopImmediatePropagation();
      if(k==='/' && e.keyCode!==229) {
        e.preventDefault();input.select();
      } else {
        input.setSelectionRange(input.value.length,input.value.length);
        // Chrome delivers the native edit (including the first IME keystroke)
        // to the newly focused input. The picker receives its normal input events.
      }
      return true;
    }
    function logicItems(list) {
      return Array.from(list.querySelectorAll('[role=option],li')).filter(item=>{
        const button=item.querySelector('button,[role=button]');
        return item.closest(logicList)===list && enabled(item) && !item.matches('.disabled') && (!button || enabled(button));
      });
    }
    function focusLogic(item) {
      focus(item);mark('field',item);
      say('Flow Logic · '+name(item.querySelector('button') || item)+' · ↑↓ 이동 · Enter 추가 · Esc 단계 종류');
    }
    function commitResult(p,button) {
      // Trigger selection can populate an existing placeholder card. Its click
      // handler snapshots that card before Studio renders the selected inputs.
      if(p.trigger) {button.click();return;}
      p.committed=true;
      expectForm(null,false,[...p.cardsBefore],p.category?.id==='flow_action_newAction');
      button.click();
    }
    const inputSelector='input:not([type=hidden],[type=button],[type=submit],[type=reset]),textarea,select,[contenteditable="true"],[contenteditable="plaintext-only"],[role="textbox"],[role="combobox"],.select2-container,.dot_walk_btn';
    function formInputs(card) {
      const form=Array.from(card.querySelectorAll('form.inputFields')).find(shown) || card;
      return Array.from(form.querySelectorAll(inputSelector)).filter(el=>
        cardOf(el)===card && !el.closest(pickers+',.select2-drop') && !el.matches('.select2-offscreen') && enabled(el));
    }
    let follow=null, followTimer=0, tabFrame=0;
    function cancelFollow() {clearTimeout(followTimer);follow=null;}
    function expectForm(card=null,changing=false,before=index().cards,action=false) {
      cancelFollow();
      follow={card,action,key:card && cardKey(card),before:new Set(before),keys:new Set(before.map(cardKey).filter(Boolean)),
        previous:changing ? new Set(formInputs(card)) : null,landed:false};
      followTimer=setTimeout(cancelFollow,8000);
      invalidate();
    }
    function followNewForm() {
      if(!follow) return;
      const f=follow;
      let card=f.card;
      if(!card?.isConnected) {
        const candidates=index().cards.filter(c=>f.card ? f.key && cardKey(c)===f.key :
          !f.before.has(c) && !f.keys.has(cardKey(c)));
        const studioCards=candidates.filter(c=>c.matches('.componentInstance') && c.querySelector(studioHeader));
        const added=studioCards.length ? studioCards : candidates.filter(c=>!c.matches('[role=treeitem]'));
        if(added.length!==1) return;
        card=added[0];
      }
      if(state.picker?.committed) state.picker=null;
      const inputs=formInputs(card).filter(el=>!f.previous?.has(el));
      if(f.previous && !inputs.length) return;
      const active=deepActive();
      if(f.editing && !(active?.closest('#picker2col_opener_select_action,#picker2col_opener_select_trigger') && card.contains(active))) return;
      const editor=inputs[0];
      if(f.action || card.matches(actionCard+', '+logicCard)) {
        const entries=editorEntries(card);
        if(entries.length) {
          cancelFollow();select(card);
          const first=editor || entries[0].el;
          reveal(first,first.closest(groupSelector) || card.querySelector(studioHeader));
          showFinder(entries,f.origin?.isConnected ? f.origin : card,card);return;
        }
      }
      if(!editor && f.landed) return;
      f.card=card;f.key=cardKey(card);f.landed=true;
      select(card);
      if(!editor) {focus(card);say('추가된 단계로 이동했습니다.');return;}
      if(!f.editing) {clearTimeout(followTimer);followTimer=setTimeout(cancelFollow,650);}
      f.editing=true;
      const target=editor.matches('.select2-container') ? editor.querySelector('.select2-focusser,.select2-choice') || editor : editor;
      if(active && inputs.includes(active)) {mark('field',active.closest('.select2-container') || active);reveal(active);}
      else focus(target);
      say('단계 편집 · '+(groupLabel(deepActive()) || fieldLabel(deepActive()) || '입력'));
    }
    function clearIdentities(p) {
      for(const [label,original] of p?.identityLabels || []) {
        delete label.dataset.flowkeysIdentity;
        if(original===null) label.removeAttribute('aria-label');
        else label.setAttribute('aria-label',original);
      }
      p?.identityLabels?.clear();
    }
    function insertionFor(p) {
      cache=null;
      const candidates=insertionTargets();
      if(candidates.includes(p.el)) return p.el;
      const matches=candidates.filter(el=>(!p.el.matches(hoverInsertion) || el.matches(hoverInsertion)) &&
        insertionPosition(el)===p.placement);
      return matches.length===1 ? matches[0] : null;
    }
    function returnToCategories(p) {
      if(state.picker!==p || !p.returnCategory) return;
      const id=p.returnCategory;
      const buttons=Array.from(p.row?.querySelectorAll(categoryButtons) || []).filter(enabled);
      const previous=buttons.find(button=>button.id===id);
      if(previous) {
        if(p.surface && shown(p.surface)) {
          if(!p.closingMenu) {p.closingMenu=true;previous.click();invalidate();}
          return;
        }
        p.category=null;p.categoryScope=null;p.categories=buttons;p.ready=true;
        p.surface=null;p.searchInput=null;p.returnCategory=null;p.closingMenu=false;
        captionText.textContent='삽입 위치 · '+p.placement;draw();focus(previous,rowCaption);
        say('단계 종류 · ← → 이동 · Enter 열기 · Esc 삽입 위치');return;
      }
      // Some Studio rows are removed along with their menu. Reopen the same slot.
      const slot=insertionFor(p);
      if(slot) {
        state.quickOrigin=p.quickOrigin || p.owner || document.body;
        openPicker(slot,'add','','',null,false,id);
      } else restore();
    }
    function returnToInsertion(p) {
      state.picker=null;closeChoices();
      insertionReturn={picker:p,until:performance.now()+1600};
      followInsertionReturn();
      invalidate();
    }
    // Closing an inline row restores its transparent + in a later Studio render.
    // Keep the requested destination until the replacement has received focus.
    let insertionReturn=null;
    function followInsertionReturn() {
      if(!insertionReturn) return;
      const {picker:p,until}=insertionReturn;
      const origin=p.quickOrigin?.isConnected ? p.quickOrigin : p.owner?.isConnected ? p.owner : document.body;
      if(performance.now()>until) {
        insertionReturn=null;
        if(!state.position) {focus(origin);say('삽입 위치가 바뀌어 이전 위치로 돌아왔습니다.');}
        return;
      }
      const slot=insertionFor(p);
      if(!slot) {invalidate();return;}
      if(state.position===slot && deepActive()===slot) return;
      state.quickOrigin=origin;state.choices=insertionTargets();state.choiceKind='add';
      preview(state.choices.indexOf(slot));
    }
    function restore() {
      const p=state.picker;state.picker=null;
      clearIdentities(p);
      clearRow();
      if (!p) return;
      cache=null;
      if(p.backToPreview && p.quickOrigin?.isConnected) {
        const toggle=p.categoryScope?.querySelector('#flow_action_btnToggleAction') ||
          (p.category || p.categories?.[0])?.closest('.instance-type-new')?.querySelector('#flow_action_btnToggleAction');
        if(toggle && enabled(toggle) && /close/i.test(name(toggle))) toggle.click();
        focus(p.quickOrigin);beginAdd(p.quickOrigin,p.placement);return;
      }
      if(p.committed) {followNewForm();return;}
      const current=cardOf(deepActive());
      if (p.kind==='add') {
        const added=index().cards.filter(c=>!p.cardsBefore.has(c));
        if (added.length===1) {select(added[0]);focus(added[0]);say('추가된 단계로 이동했습니다.');return;}
      }
      if (current && current!==p.owner) {select(current);return;}
      if (p.owner?.isConnected) select(p.owner);
      const owner=p.owner?.isConnected ? p.owner :
        state.card && p.owner && cardKey(p.owner) && cardKey(state.card)===cardKey(p.owner) ? state.card : null;
      let field=p.el;
      if(!field.isConnected && field.matches('.select2-reference') && owner && field.id) {
        const replacements=owner.querySelectorAll('.select2-reference#'+CSS.escape(field.id));
        if(replacements.length===1) field=replacements[0];
      }
      const returnTo=field.matches('.select2-container') ? field.querySelector('.select2-focusser') : null;
      focus(shown(field)?(returnTo || field):owner);
    }
    function navigate(key) {
      const insertions=insertionTargets();
      const stops=[...new Set([...index().cards,...insertions])].sort(canvasOrder);
      if(!stops.length) {say('이동할 단계나 삽입 위치가 없습니다.');return;}
      const active=deepActive();
      const current=state.position || (insertions.includes(active) ? active : state.card);
      const i=stops.indexOf(current);
      const next=stops[Math.min(stops.length-1,Math.max(0,i+(key==='ArrowDown'?1:-1)))];
      if(next===current) return;
      if(insertions.includes(next)) {
        if(!state.choices) state.quickOrigin=cardShortcutTarget(active) ? active : state.card || document.body;
        state.choices=insertions;state.choiceKind='add';preview(insertions.indexOf(next));return;
      }
      closeChoices();select(next);focus(next);say(stepTitle(next) || '단계 선택됨');
    }
    // Compare hosts at shadow boundaries so a nested canvas stays in page order.
    function canvasOrder(a,b) {
      if(a===b) return 0;
      if(a.getRootNode()===b.getRootNode()) return a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      const path=el=>{
        const chain=[el];
        while(el.getRootNode().host) {
          el=el.getRootNode().host;
          chain.unshift(el);
        }
        return chain;
      };
      const left=path(a), right=path(b);
      let i=0;
      while(i<left.length && i<right.length && left[i]===right[i]) i++;
      if(i===left.length || i===right.length) return left.length-right.length;
      return left[i].compareDocumentPosition(right[i])&Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    }
    function cardShortcutTarget(el) {
      if(!state.card || !(el instanceof Element) || ancestor(el,n=>n.matches(interactive+', '+pickers))) return false;
      return el===state.card || !!el.closest(studioHeader) && cardOf(el)===state.card;
    }
    function updateHint() {
      const hint=get('key-hint'), active=deepActive();
      // Keep the bottom-anchored panel still between pointer-down and click.
      if(active && ui.contains(active) && active!==query && finder.hidden && commands.hidden) return;
      let message='';
      if(commands.hidden && finder.hidden && !state.binding && !state.choices && !state.picker && !deletion?.dialog) {
        if(cardShortcutTarget(active)) message='↑↓ 단계·삽입 위치 이동 · Enter 편집 · N 추가 · F 필드 검색';
        else if(active && state.card && cardOf(active)===state.card && active.matches(interactive)) message='값 입력 · Esc 단계로';
      }
      if(hint.textContent!==message) hint.textContent=message;
      hint.hidden=!message;
    }
    function track(e) {
      if (e.composedPath().includes(host) || state.binding) return;
      const el=e.composedPath().find(v=>v instanceof Element);
      if (!el) return;
      if(state.position && e.type==='focusin') {
        if(el===state.position) return;
        // Studio may focus the enclosing insertion row just after closing it.
        if(el.matches('.sect-main') && el.contains(state.position)) {
          const slot=state.position;
          queueMicrotask(()=>{if(state.position===slot && deepActive()===el && enabled(slot)) focus(slot,rowCaption);});
          return;
        }
        closeChoices();
      }
      if(fieldCard && e.type==='focusin' && fieldCard.contains(el) && el.closest('#picker2col_opener_select_action')) {
        queueMicrotask(()=>{if(fieldCard && deepActive()===el) {query.focus({preventScroll:true});scheduleReveal();}});
        return;
      }
      if(follow?.editing && e.type==='focusin' && el.closest('#picker2col_opener_select_action,#picker2col_opener_select_trigger')) invalidate();
      // Keep the owning card highlighted when the native picker is portalled.
      const picker=state.picker;
      if(e.type==='focusin' && picker?.searchUntil>performance.now() && picker.searchInput?.isConnected &&
          el!==picker.searchInput && (el===picker.category || el===picker.el || picker.surface?.contains(el) ||
            picker.trigger && el.id==='picker2col_opener_select_trigger')) {
        queueMicrotask(()=>{
          if(state.picker===picker && picker.searchUntil>performance.now() && deepActive()===el && enabled(picker.searchInput)) focus(picker.searchInput);
        });
        return;
      }
      if (picker && (ancestor(el,n=>n.matches(pickers) || n===picker.surface) || !cardOf(el))) {
        if (e.type==='focusin') mark('field',el);
        return;
      }
      const card=cardOf(el);
      if (card) {
        if (card!==state.card) select(card);
        if (e.type==='focusin') mark('field',el===card?null:ancestor(el,n=>n.matches('.select2-container')) || el);
      }
    }
    function key(e) {
      if(!e.repeat) insertionReturn=null;
      pendingFieldRow=null;
      if (e.defaultPrevented) return;
      const el=e.composedPath()[0], k=e.key;
      const searching=el===query || el===state.picker?.searchInput;
      if(!searching || k.length!==1 && !e.isComposing && !['Backspace','Delete','Process','Dead'].includes(k)) releaseViewport();
      if(state.picker?.ready) state.picker.searchUntil=0;
      if(deletion) {
        syncDeleteModal();
        const modal=deletion;
        if(modal?.dialog) {
          if(e.isComposing || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
          if(!modal.dialog.contains(el) && el!==modal.dialog.parentElement) return;
          if(['Escape','ArrowLeft','ArrowRight'].includes(k) || k==='Enter' && e.repeat) {
            e.preventDefault();e.stopImmediatePropagation();
            if(k==='Escape' && !e.repeat && enabled(modal.cancel)) modal.cancel.click();
            if(k==='ArrowLeft') focus(modal.cancel);
            if(k==='ArrowRight' && enabled(modal.confirm)) focus(modal.confirm);
          }
          return;
        }
      }
      if(commands.hidden && !state.binding && !e.composedPath().includes(host) && resumeSearch(e,el)) return;
      if(e.isComposing || e.keyCode===229) return;
      cancelFollow();
      if(k==='Escape') state.triggerChoice=null;
      if(k==='Tab' && !e.composedPath().includes(host)) {
        cancelAnimationFrame(tabFrame);
        tabFrame=requestAnimationFrame(()=>{
          const next=deepActive();
          if(next!==el && cardOf(next) && next.matches(controls+',textarea,[contenteditable="true"]') && !next.closest(pickers)) reveal(next);
        });
      }
      const take=()=>{e.preventDefault();e.stopImmediatePropagation();};
      if (!e.altKey && e.shiftKey && (mac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey) && e.code==='KeyK') {
        take();if (!e.repeat) arm();return;
      }
      if (!commands.hidden) {
        const id=e.code==='KeyN'?'add':e.code==='KeyF'?'field':stepCommands.find(s=>e.code==='Key'+s.key)?.id;
        if (id && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          take();if(!e.repeat) run(id);return;
        }
        if (k==='Escape') {take();commands.hidden=true;say(state.card ? stepTitle(state.card) : prefix+'로 명령 열기');return;}
        if (!['Control','Meta','Shift','Alt','Tab'].includes(k) && !e.composedPath().includes(commands)) commands.hidden=true;
      }
      if (e.composedPath().includes(host)) return;
      if(k==='Enter' && !e.repeat && !state.picker && !state.choices && el.closest?.(studioHeader)) {
        const owner=cardOf(el);
        if(owner?.matches(logicCard+', '+actionCard) && !Array.from(owner.querySelectorAll('form.inputFields')).some(shown)) expectForm(owner);
      }
      if (k==='Escape' && (state.binding || state.choices)) {
        take();const origin=state.quickOrigin || state.previewOrigin;state.binding=null;closeChoices();
        if(origin?.isConnected) focus(origin);
        say('취소했습니다.');return;
      }
      if (state.picker?.surface && !shown(state.picker.surface)) restore();
      if (state.picker) {
        const p=state.picker;
        if(k==='Escape' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey &&
            !p.committed && (p.category && (p.row?.contains(el) || p.surface?.contains(el) || el===document.body) || p.categories?.includes(el))) {
          if(e.repeat || p.returnCategory) {take();return;}
          logicKeyups.add(e.code);
          if(p.category) {
            // Studio dismisses the list on Escape. Keep its parent and suppress
            // its delayed search autofocus while the old surface disappears.
            p.returnCategory=p.category.id;p.searchUntil=0;
            setTimeout(()=>returnToCategories(p),0);
          } else {
            take();
            const row=el.closest('.instance-type-new') || el.parentElement;
            const toggle=row.querySelector('#flow_action_btnToggleAction');
            if(toggle && enabled(toggle)) toggle.click();
            returnToInsertion(p);
          }
          return;
        }
        if(p.surface?.matches(logicList) && (p.surface.contains(el) || el===p.category) && !e.altKey && !e.ctrlKey && !e.metaKey) {
          const items=logicItems(p.surface);
          const i=items.indexOf(el.closest('[role=option],li'));
          if(items.length && ['ArrowDown','ArrowUp','Home','End','Enter'].includes(k)) {
            take();logicKeyups.add(e.code);
            if(k==='Enter') {
              if(i>=0 && !e.repeat) (items[i].querySelector('button,[role=button]') || items[i]).click();
            } else {
              const next=k==='Home'?0:k==='End'?items.length-1:k==='ArrowDown'?i+1:i-1;
              focusLogic(items[Math.max(0,Math.min(items.length-1,next))]);
            }
            return;
          }
        }
        if(p.categories && !e.altKey && !e.ctrlKey && !e.metaKey) {
          const group=p.categories.filter(enabled);
          const active=ancestor(el,n=>group.includes(n));
          if(active && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)) {
            take();const step=['ArrowLeft','ArrowUp'].includes(k)?-1:1;
            focus(group[(Math.max(0,group.indexOf(active))+step+group.length)%group.length]);return;
          }
          if(k==='Enter' && active) {take();if(!e.repeat) active.click();return;}
        }
        if((p.category || p.trigger) && p.surface && ancestor(el,n=>n===p.surface) && !e.altKey && !e.ctrlKey && !e.metaKey) {
          const input=p.searchInput;
          if(input?.value.trim() && ['ArrowDown','ArrowUp','Enter'].includes(k)) {
            const hits=Array.from(p.surface.querySelectorAll(p.trigger ? 'button.rm-btn-action,button.rm-btn-trigger' : 'button.rm-btn-action')).filter(enabled);
            const i=hits.indexOf(el);
            if(hits.length && (el===input || i>=0)) {
              take();
              if(k==='Enter') {
                if(e.repeat) return;
                if(i>=0) {commitResult(p,hits[i]);return;}
                const q=normalize(input.value);
                const exact=hits.filter(b=>normalize(name(b))===q);
                if(exact.length===1) commitResult(p,exact[0]);
                else focus(hits[0]);
              } else if(i<0) focus(k==='ArrowDown'?hits[0]:hits[hits.length-1]);
              else focus(hits[(i+(k==='ArrowDown'?1:-1)+hits.length)%hits.length]);
              return;
            }
          }
        }
        if (k==='Escape') {
          p.backToPreview=!!p.quickOrigin;
          setTimeout(()=>{if(state.picker===p) restore();},0);return;
        }
        if (p.surface && p.surface.matches(pickers) && ['ArrowDown','ArrowUp'].includes(k) && !e.altKey && !e.ctrlKey) {
          // Give native combobox navigation the first chance to handle the event.
          const active=deepActive(), previous=active?.getAttribute('aria-activedescendant');
          setTimeout(()=>{
            if (!session || state.picker!==p || e.defaultPrevented || deepActive()!==active ||
                active?.getAttribute('aria-activedescendant')!==previous || previous) return;
            const items=uniqueControls(index().all(options).filter(b=>b!==p.surface && ancestor(b,n=>n===p.surface) && enabled(b) && !b.matches(interactive)));
            if (!items.length) return;
            const i=items.indexOf(active), next=k==='ArrowDown'?i+1:(i<0?items.length-1:i-1);
            p.fallbackItem=items[(next+items.length)%items.length];focus(p.fallbackItem);
          },0);
          return;
        } else if (k==='Enter' && p.fallbackItem && p.fallbackItem===el && !el.matches('button,a,input,select')) {
          take();if(!e.repeat) el.click();invalidate();return;
        } else if (k==='Tab' || k==='Enter') {invalidate();return;}
        else if (!e.altKey && el!==state.card) return;
      }
      if (state.choices && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey &&
          (['ArrowUp','ArrowDown','Enter'].includes(k) || state.quickOrigin && k==='ArrowRight')) {
        take();if (e.repeat && k==='Enter') return;
        if (k==='Enter' || k==='ArrowRight') openPicker(state.position,state.choiceKind,'','',null,!!state.quickOrigin && k==='Enter');
        else navigate(k);
        return;
      }
      if (k==='Escape' && state.card && el!==state.card && cardOf(el)===state.card && !ancestor(el,n=>n.matches(pickers))) {
        setTimeout(()=>{if(session && !e.defaultPrevented && deepActive()===el) focus(state.card);},0);
        return;
      }
      if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey || ancestor(el,n=>n.matches(interactive)) || ancestor(el,n=>n.matches(pickers))) return;
      const onCard=cardShortcutTarget(el);
      if(onCard && !state.binding && !state.choices && !state.picker && finder.hidden && (k.toLowerCase()==='n' || k.toLowerCase()==='f')) {
        take();if(e.repeat) return;
        if(k.toLowerCase()==='n') beginAdd(el);
        else {
          const header=state.card.querySelector(studioHeader);
          if(header && state.card.matches(actionCard+', '+logicCard) && !formInputs(state.card).length &&
              !Array.from(state.card.querySelectorAll('form.inputFields')).some(shown)) {
            header.click();
            if(follow) follow.origin=el;
          } else beginField();
        }
        return;
      }
      if (['ArrowUp','ArrowDown'].includes(k) &&
          (onCard || el===document.body || el===document.documentElement || insertionTargets().includes(el))) {take();navigate(k);}
      if (k==='Enter' && state.card && el===state.card) {
        const buttons=localButtons(state.card);
        const header=buttons.find(b=>b.matches(studioHeader));
        if (header && !Array.from(state.card.querySelectorAll('form.inputFields')).some(shown)) {
          take();if (!e.repeat) header.click();return;
        }
        const expand=buttons.find(b=>b.getAttribute('aria-expanded')==='false' && !b.hasAttribute('aria-haspopup') && !fields.test(name(b)));
        const first=formInputs(state.card)[0] || buttons.find(b=>b.matches(interactive)) || buttons[0];
        if (header && state.card.matches(actionCard+', '+logicCard+', '+triggerCard)) {
          const entries=editorEntries(state.card);
          if(entries.length) {take();showFinder(entries,state.card,state.card);return;}
        }
        if (header && first) {take();focus(first);return;}
        if (expand || first) {take();if(expand) {expand.click();focus(expand);}else focus(first);}
      }
    }
    const logicKeyups=new Set();
    on(window,'keydown',key,true);
    on(window,'keyup',e=>{
      if(logicKeyups.delete(e.code)) {e.preventDefault();e.stopImmediatePropagation();}
    },true);
    on(document,'pointerdown',e=>{
      insertionReturn=null;
      pendingFieldRow=null;
      releaseViewport();cancelFollow();annotationCard=null;
      if(state.picker?.ready) state.picker.searchUntil=0;
      if(!e.composedPath().includes(host)) {
        commands.hidden=true;
        if(!finder.hidden) hideFinder();
      }
    },true);
    on(document,'input',e=>{if(e.isTrusted) pendingFieldRow=null;},true);
    function userScroll() {
      releaseViewport();cancelFollow();
      if(state.picker) state.picker.searchUntil=0;
    }
    on(window,'wheel',userScroll,true);
    on(window,'touchmove',userScroll,true);
    on(window,'transitionend',scheduleReveal,true);
    on(document,'focusin',track,true);
    on(document,'focusin',()=>queueMicrotask(updateHint),true);
    // Swallow the complete registration gesture. Legacy pickers handle mousedown
    // and may replace the original target before its click reaches the document.
    for (const event of ['pointerdown','mousedown','pointerup','mouseup']) {
      on(window,event,e=>{
        if (state.binding && e.button===0 && !e.composedPath().includes(host)) {
          e.preventDefault();e.stopImmediatePropagation();
        }
      },true);
    }
    on(window,'click',e=>{
      const chosen=e.composedPath().find(n=>n instanceof Element && n.matches(categoryButtons));
      const p=state.picker;
      const raw=e.composedPath()[0];
      const property=raw.closest?.('#picker2col_opener_select_action');
      if(property && !state.binding) {
        if(p?.el===property && p.surface && shown(p.surface)) {state.picker=null;return;}
        const picker={kind:'field',property:true,el:property,owner:cardOf(property),before:new Set(index().all('#action-picker-search-input'))};
        state.picker=picker;
        queueMicrotask(()=>{if(state.picker===picker && !picker.ready) {cache=null;focusPicker();}});
        invalidate();return;
      }
      const deleteButton=raw.closest?.(stepCommands.find(s=>s.id==='delete').selector);
      if(deleteButton && !state.binding) {
        const owner=cardOf(deleteButton);
        if(owner && !deleteModal(owner)) awaitDeleteModal(owner);
      }
      if(state.choices && !e.composedPath().includes(host)) closeChoices();
      if(p?.categories && raw.closest?.('#flow_action_btnToggleAction') && !chosen) {
        state.picker=null;clearRow();return;
      }
      if(!state.binding && raw instanceof Element && !e.composedPath().includes(host)) {
        const result=raw.closest('.rm-btn-action,.rm-btn-trigger,[role="option"],[role="menuitem"],[role="treeitem"]');
        const trigger=p?.trigger ? cardOf(raw) || cardOf(p.el) : state.triggerChoice;
        if(raw.closest('#picker2col_opener_select_trigger')) state.triggerChoice=cardOf(raw);
        else if(result && (p?.surface?.contains(result) || result.closest('.action-picker-component,.trigger-picker-component') || trigger && result.closest(pickers))) {
          const triggerCard=trigger || (p?.el.id==='picker2col_opener_select_trigger' && p.owner);
          if(triggerCard?.isConnected || !p || p.kind==='add') {
            if(!p?.committed || !follow) {
              if(p) p.committed=true;
              expectForm(triggerCard || null,Boolean(triggerCard),p?.kind==='add' ? [...p.cardsBefore] : index().cards,p?.category?.id==='flow_action_newAction' || !!result.closest('.rm-btn-action') && !p?.trigger && !triggerCard && !p?.category);
            }
          }
          state.triggerChoice=null;
        } else if(raw.closest(studioHeader) || raw.closest('[role=button]')?.querySelector(studioHeader) ||
            !raw.closest('a,button,input,select,textarea,[role=button]') && raw.closest('.section-item')?.querySelector(studioHeader)) {
          const owner=cardOf(raw);
          if(owner && !Array.from(owner.querySelectorAll('form.inputFields')).some(shown)) expectForm(owner);
          state.triggerChoice=null;
        } else if(!raw.closest('.action-picker-component,.trigger-picker-component,'+pickers)) state.triggerChoice=null;
      }
      if(chosen && !state.binding && (p?.categories?.includes(chosen) || chosen.closest('.instance-type-new'))) {
        if(p?.closingMenu && chosen===p.category) return;
        const scope=chosen.closest('.instance-type-new') || chosen.parentElement;
        const picker=p?.kind==='add' ? p : {kind:'add',el:scope.querySelector('#flow_action_btnToggleAction') || chosen,owner:state.card,cardsBefore:new Set(index().cards)};
        picker.placement ||= insertionPosition(picker.el);
        captionText.textContent='삽입 위치 · '+picker.placement;clearRow();
        state.picker=picker;
        picker.row=scope;picker.category=chosen;picker.categoryScope=null;picker.categories=null;picker.ready=false;picker.surface=null;
        picker.searchInput=null;
        picker.before=new Set(index().all(stepSearch+','+logicList));
        picker.searchUntil=undefined;
        queueMicrotask(()=>{if(state.picker===picker && !picker.ready) {cache=null;focusPicker();}});
        invalidate();return; // Let Studio open its native picker.
      }
      if (!state.binding || e.composedPath().includes(host)) {track(e);return;}
      e.preventDefault();e.stopImmediatePropagation();
      const kind=state.binding;state.binding=null;
      const owner=cardOf(raw);
      const el=kind==='card' ? owner || ancestor(raw,n=>n.matches('article,li,[role=group]') && !n.querySelector(cards+',main,section,form + form')) :
        fieldTarget(raw);
      if (!el || (kind==='field' && (!owner || !enabled(el)))) {
        say('연결할 수 없습니다. 펼쳐진 단계 안에서 카드나 사용 가능한 필드 버튼을 다시 지정하세요.');return;
      }
      manual[kind].add(el);cache=null;
      if(kind==='card') {select(el);focus(el);}
      if(kind==='field') {
        select(owner);mark('field',el);
        if (state.cardKey && el.id) {
          if (!fieldBindings.has(state.cardKey)) fieldBindings.set(state.cardKey,new Set());
          fieldBindings.get(state.cardKey).add(el.id);
        }
      }
      const description=kind==='field' && fieldDescription(el);
      say('연결됨 · '+(description?.title || fieldLabel(el)).slice(0,75),description?.pill && el,
        ' · '+(kind==='card'?'↑↓로 이동하세요.':prefix+' 후 '+(kind==='add'?'N':'F')+'를 누르세요.'));
    },true);
    on(ui,'click',e=>{
      const command=e.target.closest('[data-command]');
      if (command) {run(command.dataset.command);return;}
      if (e.target.id==='off') {stop(true);return;}
      if (e.target.id==='guide') get('help').hidden=!get('help').hidden;
      if (e.target.dataset.bind) {commands.hidden=true;state.binding=e.target.dataset.bind;say('연결할 화면 요소를 클릭하세요. Esc로 취소합니다.');focus(state.card || document.body);}
    });
    const redraw=()=>{cancelAnimationFrame(repaint);repaint=requestAnimationFrame(draw);};
    const rowSize=new ResizeObserver(redraw);
    on(window,'scroll',redraw,true);on(window,'resize',redraw);
    on(window,'pagehide',()=>stop(true));on(window,'popstate',invalidate);on(window,'hashchange',invalidate);
    function arm() {
      if(deletion?.dialog && shown(deletion.dialog)) return;
      pendingFieldRow=null;
      cancelFollow();hideFinder();closeChoices();state.binding=null;commands.hidden=false;
      commandCard=state.card;
      for(const spec of stepCommands) commands.querySelector('[data-command='+spec.id+']').hidden=!stepButton(commandCard,spec);
      if (!document.hasFocus() && state.card) focus(state.card);
      say(state.card?(stepTitle(state.card) || '현재 단계')+' · 명령 키 선택 · Esc 닫기':'단계 미인식 · 도움말에서 카드 연결 또는 N으로 삽입점 찾기');
    }
    function run(kind) {
      clearIdentities(state.picker);hideFinder();commands.hidden=true;state.picker=null;cache=null;
      if(kind==='add') beginAdd();
      else if(kind==='field') beginField();
      else {
        const spec=stepCommands.find(s=>s.id===kind);
        if(spec) runStep(spec);
      }
    }
    session={arm,end(){
      clearIdentities(state.picker);
      clearTimeout(deletion?.timer);clearTimeout(annotationTimer);
      abort.abort();clearTimeout(pending);releaseViewport();cancelFollow();cancelAnimationFrame(tabFrame);cancelAnimationFrame(repaint);
      for(const ob of observed.values()) ob.disconnect();
      for(const el of tempFocus) if(el.getAttribute('tabindex')==='-1') el.removeAttribute('tabindex');
      closeChoices();select(null);for(const style of styleNodes.values()) style.remove();host.remove();state.picker=null;
    }};
    const first=cardOf(deepActive()) || index().cards[0];
    if(first) {select(first);focus(first);say(stepTitle(first) || '단계 선택됨');}
    else if(insertionTargets().length) beginAdd(document.body);
    else arm();
  }
  function stop(notify=false) {session?.end();session=null;if(notify) chrome.runtime?.sendMessage('flow-keys-off').catch(()=>{});}
  globalThis.flowKeysController={probe,invoke(){if(session) session.arm();else start();return true;}};
  return probe();
})();

