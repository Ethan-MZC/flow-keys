const {chromium}=require(process.env.FK_PLAYWRIGHT || 'playwright');
const assert=require('node:assert/strict');
const extension=__dirname;
const locale = process.env.FK_LOCALE || 'en';
const korean = /^ko(?:$|[-_])/i.test(locale);
const ui = (en, ko) => korean ? ko : en;
const fixture='https://dev-test.service-now.com/now/workflow-studio/builder/flow/example';
const html='<!doctype html><meta charset=utf-8><h1>Flow editor fixture</h1><test-canvas></test-canvas>';
(async()=>{
  const ctx=await chromium.launchPersistentContext('',{
    channel:'chromium',executablePath:process.env.FK_BROWSER,headless:true,
    locale, args:['--lang='+locale,'--enable-unsafe-extension-debugging','--load-extension='+extension],ignoreDefaultArgs:['--disable-extensions']
  });
  try {
    const dev=await ctx.browser().newBrowserCDPSession();
    const {id}=await dev.send('Extensions.loadUnpacked',{path:extension});
    assert((await dev.send('Extensions.getExtensions')).extensions.some(e=>e.id===id && e.name==='Flow Keys'));
    console.log('Installed actual unpacked extension',id);
    await ctx.route('https://dev-test.service-now.com/**', route=>route.fulfill({contentType:'text/html',body:html}));
    await ctx.route('**/images/icon-data-pill-picker.svg',route=>route.fulfill({contentType:'image/svg+xml',
      body:'<svg xmlns="http://www.w3.org/2000/svg"><symbol id="icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/></symbol></svg>'}));
    const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(fixture);
    await page.evaluate(()=>{
      const root=document.querySelector('test-canvas').attachShadow({mode:'open'});
      root.innerHTML='<article data-step-id="1" aria-label="1. If"><button aria-label="Select a field">Choose</button><div id="nested"><button aria-label="Add an action inside If">+</button></div></article><button aria-label="Add an action after If">+</button><article data-step-id="2" aria-label="2. Log"><input aria-label="Message"></article>';
      for (const b of root.querySelectorAll('button')) b.onclick=()=>{
        const add=b.textContent==='+', dialog=document.createElement('div');
        dialog.setAttribute('role','dialog');dialog.innerHTML='<input type=search><div role=option tabindex=-1>'+(add?'Update Record':'Priority')+'</div>';
        const option=dialog.lastChild;
        option.onclick=()=>{
          if(add) {const step=document.createElement('article');step.dataset.stepId='3';step.setAttribute('aria-label','3. Update Record');step.textContent='Update Record';b.after(step);}
          else b.textContent='Priority';
          dialog.remove();
        };
        dialog.onkeydown=e=>{if(e.key==='Escape') dialog.remove();};document.body.append(dialog);
      };
    });
    const mac=Boolean(process.env.FK_MAC);if(mac) await (await ctx.newCDPSession(page)).send('Emulation.setUserAgentOverride',{userAgent:await page.evaluate(()=>navigator.userAgent),platform:'MacIntel'});const chord=(mac?'Meta':'Control')+'+Shift+k';const command=async k=>{await page.keyboard.press(chord);await page.keyboard.press(k);};await page.keyboard.press(chord);
    const panel=page.locator('[data-flowkeys-panel]');
    let native=await panel.count();
    if(!native) {try {await panel.waitFor({timeout:1200});native=true;}catch{}}
    if(!native) {
      const tabSession=await ctx.newCDPSession(page);
      const {targetInfos}=await dev.send('Target.getTargets',{filter:[{type:'tab'}]});const targetInfo=targetInfos.find(t=>t.url===fixture) || targetInfos[targetInfos.length-1];
      await dev.send('Extensions.triggerAction',{id,targetId:targetInfo.targetId});
      await panel.waitFor({timeout:5000});
    }
    console.log('Real activeTab activation via',native?'registered shortcut':'toolbar action');
    assert.equal(await panel.getByRole('button',{name:ui('Help','도움말'),exact:true}).count(),1);
    const marked=page.locator('[data-flowkeys-card]');
    assert.equal(await marked.getAttribute('data-step-id'),'1');
    const canvasFocus=()=>page.evaluate(()=>document.querySelector('test-canvas').shadowRoot.activeElement?.getAttribute('aria-label'));
    await page.keyboard.press('ArrowDown');assert.equal(await canvasFocus(),'Add an action inside If');
    await page.keyboard.press('ArrowDown');assert.equal(await canvasFocus(),'Add an action after If');
    await page.keyboard.press('ArrowDown');assert.equal(await marked.getAttribute('data-step-id'),'2');
    await page.keyboard.press('Enter');await page.keyboard.type('fn');
    assert.equal(await page.getByRole('textbox',{name:'Message'}).inputValue(),'fn');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('test-canvas').shadowRoot.activeElement?.dataset.stepId==='2');
    await page.keyboard.press('ArrowUp');
    assert.equal(await canvasFocus(),'Add an action after If');
    await page.keyboard.press('ArrowUp');assert.equal(await canvasFocus(),'Add an action inside If');
    await page.keyboard.press('ArrowUp');assert.equal(await marked.getAttribute('data-step-id'),'1');
    await command('f');
    const input=page.getByRole('searchbox');
    await input.waitFor();await page.waitForFunction(()=>document.activeElement?.type==='search');
    await page.keyboard.type('priority');await page.keyboard.press('ArrowDown');
    await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='option');
    await page.keyboard.type('2');assert.equal(await input.inputValue(),'priority2');
    await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='option');
    await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
    await page.waitForFunction(()=>document.querySelector('test-canvas').shadowRoot.activeElement?.textContent==='Priority');
    await command('n');await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(),0);
    await command('n');await page.keyboard.press('Enter');
    await input.waitFor();await page.waitForFunction(()=>document.activeElement?.type==='search');
    await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='option');
    await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('test-canvas').shadowRoot.querySelector('#nested [data-flowkeys-card]'));
    await page.keyboard.press('ArrowDown');assert.equal(await canvasFocus(),'Add an action after If');
    await page.keyboard.press('Enter');
    await input.waitFor();await page.waitForFunction(()=>document.activeElement?.type==='search');await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    await page.evaluate(()=>{const root=document.querySelector('test-canvas').shadowRoot;const node=root.querySelector('[data-flowkeys-card]');const clone=node.cloneNode(true);clone.removeAttribute('data-flowkeys-card');node.replaceWith(clone);});
    await marked.waitFor({timeout:2000});
    await page.getByRole('button',{name:ui('Turn off','끄기'),exact:true}).click();assert.equal(await marked.count(),0);
    assert.equal(await panel.count(),0);assert.deepEqual(errors,[]);
    await page.evaluate(fixture=>{
      const f=document.createElement('iframe');f.src=fixture+'?frame';document.body.replaceChildren(f);
    },fixture);
    const child=page.frameLocator('iframe');
    await child.getByRole('heading').waitFor();
    await child.getByRole('heading').evaluate(h=>h.outerHTML='<article data-step-id="frame-step">1. If<button disabled aria-label="Add an action">+</button></article>');
    const tabInfo=(await dev.send('Target.getTargets',{filter:[{type:'tab'}]})).targetInfos.find(t=>t.url===fixture);
    await dev.send('Extensions.triggerAction',{id,targetId:tabInfo.targetId});
    await child.locator('[data-flowkeys-card]').waitFor();
    await page.keyboard.press('n');
    await child.getByText(ui('No insertion point found.','삽입점을 찾지 못했습니다.'),{exact:false}).waitFor();
    assert.equal(await page.locator('[data-flowkeys-panel]').count(),0);
    console.log('PASS activeTab same-origin iframe selection and disabled insertion control');
    await page.goto(fixture);
    await page.evaluate(()=>{
      document.body.innerHTML='<main id="app-floweditor"><section class="trigger-section"><button id="flow_trigger_add_toggle">+</button><a href="#" id="flow_trigger_text_toggle">Add a trigger</a></section><button id="flow_action_btnToggleAction">Add an Action, Flow Logic, or Subflow</button></main>';
      const section=document.querySelector('.trigger-section');
      section.querySelector('a').onclick=e=>{
        e.preventDefault();
        setTimeout(()=>{
          section.innerHTML='<div class="componentInstance"><div class="trigger-picker-component"><input id="action-picker-search-input"><button class="rm-btn-action">Created</button><button class="rm-btn-action">Created or Updated</button></div></div>';
          const first=section.querySelector('button');
          setTimeout(()=>first.focus(),120);
          first.onclick=()=>{section.firstChild.innerHTML='<a id="flow_trigger_expand_form">Record Created</a><form class="inputFields"><input aria-label="Trigger table"></form>';};
        },30);
      };
    });
    await dev.send('Extensions.triggerAction',{id,targetId:tabInfo.targetId});
    await page.getByText(ui(/Insertion point · Add Trigger \(1\/2\)/,/삽입 위치 · Add Trigger \(1\/2\)/)).first().waitFor();
    await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.id),'flow_action_btnToggleAction');
    await page.keyboard.press('ArrowUp');assert.equal(await page.evaluate(()=>document.activeElement.id),'flow_trigger_text_toggle');
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.activeElement.id==='action-picker-search-input');
    await page.waitForTimeout(175);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'action-picker-search-input');
    await page.keyboard.type('Created');await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Created');
    await page.keyboard.press('Enter');await page.getByText('Record Created',{exact:true}).waitFor();
    await page.waitForFunction(()=>document.activeElement.getAttribute('aria-label')==='Trigger table');
    await command('n');
    assert.equal(await page.getByText(ui(/Insertion point · Add Trigger/,/삽입 위치 · Add Trigger/)).count(),0);
    console.log('PASS empty Flow → Add Trigger → search focus after Studio autofocus → keyboard Record Created → trigger input');
    await page.goto(fixture);
    if(mac) await (await ctx.newCDPSession(page)).send('Emulation.setUserAgentOverride',{userAgent:await page.evaluate(()=>navigator.userAgent),platform:'MacIntel'});
    await page.evaluate(()=>{
      document.body.innerHTML='<section id="app-floweditor"><div class="trigger-section"><div class="componentInstance form active"><a href="#" id="flow_trigger_expand_form">Record Created</a><form class="inputFields"><button type="button" id="picker2col_opener_select_trigger">Created</button><div id="s2id_flow_trigger_table_label" class="select2-container"><input aria-label="Table" role="combobox" class="select2-focusser"><a role="button" aria-hidden="true" class="select2-choice"><span class="select2-chosen">Select a Table</span><span class="select2-arrow">▼</span></a></div></form></div></div><div class="actionContainer"><div class="componentInstance" id="if-1"><a href="#" id="flow_action_1_expand_form">If</a><form class="inputFields" hidden><div class="condition-row"><input placeholder="Condition Label"><button type="button" class="dot_walk_btn">…</button><select><option>is</option></select></div></form></div></div></section>';
      document.querySelector('#flow_action_1_expand_form').onclick=e=>{e.preventDefault();document.querySelector('#if-1 form').hidden=false;};
      function open(className, opener) {
        const box=document.createElement('div');box.className=className;
        box.innerHTML='<input type="text" role="combobox"><ul role="listbox"><li role="option">Sample</li></ul>';
        document.body.append(box);box.querySelector('input').focus();
        box.addEventListener('keydown',e=>{if(e.key==='Escape'){box.remove();opener.focus();}});
      }
      document.addEventListener('mousedown',e=>{
        if (e.target.closest('.select2-choice')) open('select2-drop',e.target.closest('.select2-container').querySelector('.select2-focusser') || e.target);
      });
      document.querySelector('.dot_walk_btn').onclick=e=>open('dot-walk-picker',e.target);
    });
    await dev.send('Extensions.triggerAction',{id,targetId:tabInfo.targetId});
    await page.waitForSelector('.trigger-section .componentInstance[data-flowkeys-card]');
    await page.getByRole('button',{name:ui('Help','도움말')}).click();
    await page.getByRole('button',{name:ui('Link step','카드 연결'),exact:true}).click();
    await page.locator('#app-floweditor').evaluate(e=>{const label=document.createElement('span');label.textContent='Canvas margin';e.append(label);});
    await page.getByText('Canvas margin').click();
    await page.getByText(ui(/Could not link/,/연결할 수 없습니다/)).waitFor();
    await page.getByRole('button',{name:ui('Link field','필드 연결'),exact:true}).click();
    await page.locator('.select2-arrow').click();
    assert.equal(await page.locator('.select2-drop').count(),0);
    await page.getByText(ui(/Linked · Select a Table/,/연결됨 · Select a Table/)).waitFor();
    assert.equal(await page.locator('#app-floweditor[data-flowkeys-card]').count(),0);
    await page.locator('.select2-container').evaluate(el=>{
      const replacement=el.cloneNode(true);replacement.removeAttribute('data-flowkeys-focus');el.replaceWith(replacement);
    });
    await command('f');
    const evidence=()=>page.evaluate(()=>({active:document.activeElement.outerHTML.slice(0,170),message:document.querySelector('[data-flowkeys-panel]').shadowRoot.querySelector('output').textContent, platform:navigator.platform}));
    console.log('Select2',await evidence());
    await page.waitForFunction(()=>document.activeElement.closest('.select2-drop'),null,{timeout:3500});
    await page.keyboard.type('incident');
    assert.equal(await page.locator('.select2-drop input').inputValue(),'incident');
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.activeElement.matches('.select2-focusser'));
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.activeElement.matches('.trigger-section [data-flowkeys-card]'),null,{timeout:3500}).catch(async e=>{console.log(await evidence());throw e;});
    await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.locator('.condition-row').waitFor();
    await command('f');
    await page.waitForFunction(()=>document.activeElement.closest('.dot-walk-picker'));
    await page.keyboard.type('record');await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.activeElement.matches('.dot_walk_btn'));
    assert.equal(await marked.getAttribute('id'),'if-1');
    console.log('PASS PDI-shaped trigger and If boundaries, capture before Select2 mousedown, portalled search, Escape restore, row pill selection');
    await page.evaluate(()=>{
      const card=document.querySelector('#if-1');
      const fields=document.createElement('div');fields.id='field_values_template_fields';
      for(const [field,id,value] of [['Short description','short_description','Laptop request'],['Order','order','20'],['Assignment group','assignment_group','Change Management']]) {
        const row=document.createElement('div');row.className='colrow';
        row.innerHTML='<div class="select2-container"><a class="select2-choice"><span class="select2-chosen"></span></a></div><div id="field_values_colfield"><input><button type="button" class="dot_walk_btn">…</button></div>';
        row.querySelector('span').textContent=field;
        const input=row.querySelector('input');input.id=id;input.value=value;fields.append(row);
      }
      const blank=document.createElement('div');blank.className='colrow';
      blank.innerHTML='<div class="select2-container"><input class="select2-focusser" tabindex="-1"><a class="select2-choice select2-default"><span class="select2-chosen">Select a field</span></a></div>';
      fields.append(blank);card.append(fields);
      const group=document.createElement('div');group.className='componentInstance instance-type-new';
      group.innerHTML='<button id="flow_action_btnToggleAction" aria-label="Add action, flow logic, or subflow to end of flow">+</button><button>Add an Action, Flow Logic, or Subflow</button>';
      card.after(group);
      group.firstChild.onclick=()=>setTimeout(()=>{
        const kinds=document.createElement('div');kinds.className='newactionflowsection-div';
        for(const [id,text] of [['newAction','Action'],['newFlowLogic','Flow Logic'],['newSubflow','Subflow']]) {
          const b=document.createElement('button');b.id='flow_action_'+id;b.textContent=text;kinds.append(b);
          b.onclick=()=>{
            const surface=document.createElement('div');surface.className='action-picker-component';
            if(id==='newFlowLogic') {
              setTimeout(()=>{
                const list=document.createElement('ul');list.className='flowlogic-picker-list';list.setAttribute('role','listbox');
                list.style.cssText='max-height:46px;overflow:auto';
                for(const label of ['If','Unavailable','Else If','Else','For Each']) {
                  const li=document.createElement('li');li.setAttribute('role','option');li.tabIndex=-1;
                  const hit=document.createElement('button');hit.textContent=label;hit.disabled=label==='Unavailable';
                  hit.onclick=()=>{document.body.dataset.logic=label;list.remove();};
                  li.append(hit);list.append(li);
                }
                list.onkeydown=e=>{if(e.key==='Escape')list.remove();};
                group.append(list);
              },30);
              return;
            }
            surface.innerHTML='<input id="action-picker-search-input"><button class="spoke">ServiceNow Core</button><button class="rm-btn-action">Create or Update Record</button><button class="rm-btn-info">Help</button><button class="rm-btn-action" aria-label="Update Record">Update Record</button>';
            const search=surface.querySelector('input');
            if(id==='newSubflow') {
              surface.id='picker2col_choices_select_subflow';surface.className='picker-choices';
              search.id='picker2col_search_select_subflow';
            }
            search.onkeydown=e=>{if(e.key==='ArrowDown' && !search.value){e.preventDefault();surface.querySelector('.spoke').focus();}};
            search.oninput=()=>surface.dataset.query=search.value;
            surface.onkeydown=e=>{if(e.key==='Escape')surface.remove();};
            for(const hit of surface.querySelectorAll('.rm-btn-action')) hit.onclick=()=>{
              const step=document.createElement('article');step.dataset.stepId='added';step.textContent=hit.textContent;
              surface.remove();
              setTimeout(()=>group.before(step),130);
              setTimeout(()=>{
                const form=document.createElement('form');form.className='inputFields';
                form.innerHTML='<div style="height:460px"></div><input disabled><div class="form-group"><label class="control-label" for="new-input">Record</label><br><input id="new-input"></div><div style="height:480px"></div><div class="form-group"><label for="last-input">Last input</label><br><input id="last-input"></div>';
                step.append(form);
              },340);
            };
            kinds.append(surface);
          };
        }
        group.append(kinds);document.querySelector('.trigger-section input').focus();
      },25);
    });
    page.setDefaultTimeout(6000);
    const lookup=page.getByRole('combobox',{name:ui('Find fields','필드 검색')});
    await command('f');await lookup.fill('nothing found');assert.equal(await page.locator('#fk-results [role=option]').count(),1);
    await lookup.press('Enter');await page.waitForFunction(()=>document.activeElement.closest('.select2-drop') && document.activeElement.value==='nothing found');
    await page.keyboard.press('Escape');
    await command('f');await lookup.fill('Change Management');await lookup.press('Enter');
    await page.waitForFunction(()=>document.activeElement.id==='assignment_group');
    await command('f');await lookup.fill('order');await lookup.press('Enter');
    await page.waitForFunction(()=>document.activeElement.id==='order' && document.activeElement.value==='20');
    await page.evaluate(()=>{
      const canvas=document.querySelector('#app-floweditor'), row=canvas.querySelector('.instance-type-new');
      canvas.classList.add('fd-ap-scrollable');
      canvas.style.cssText='height:210px;overflow-y:auto;overflow-anchor:none';
      const style=document.createElement('style');
      style.textContent='.action-picker-component > button{display:block;height:27px}';
      document.head.append(style);
      for(let i=0;i<18;i++) {
        const step=document.createElement('article');
        step.dataset.stepId='existing-'+i;step.textContent=(i+1)+'. Existing Action';
        step.style.height='52px';row.before(step);
      }
      row.firstChild.addEventListener('click',()=>{
        const rect=row.firstChild.getBoundingClientRect(), view=canvas.getBoundingClientRect();
        row.dataset.visibleAtOpen=String(rect.top>=view.top && rect.bottom<=view.bottom);
      });
    });
    await command('n');
    await page.waitForFunction(()=>document.activeElement.id==='flow_action_newAction');
    assert.equal(await page.locator('.instance-type-new').getAttribute('data-visible-at-open'),'true');
    assert.match(await page.locator('[data-flowkeys-row-caption]').innerText(),ui(/Insertion point/,/삽입 위치/));
    await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.id),'flow_action_newFlowLogic');
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.activeElement.matches('.flowlogic-picker-list li') && document.activeElement.textContent==='If');
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Else If');
    await page.keyboard.press('End');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'For Each');
    await page.keyboard.press('ArrowUp');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Else');
    assert.match(await panel.locator('output').innerText(),/Else · ↑↓/);
    if(process.env.FK_PREVIEW) await panel.locator('section').screenshot({path:process.env.FK_PREVIEW});
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.id==='flow_action_newFlowLogic');
    await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.activeElement.id==='picker2col_search_select_subflow');
    await page.keyboard.press('ArrowDown');await page.keyboard.type('Sub');
    assert.equal(await page.locator('#picker2col_search_select_subflow').inputValue(),'Sub');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#picker2col_search_select_subflow'));
    await page.waitForFunction(()=>document.activeElement.id==='flow_action_newSubflow');
    await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.activeElement.id==='action-picker-search-input');
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(()=>document.activeElement.className==='spoke');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.id==='flow_action_newAction');
    await command('n');await page.waitForFunction(()=>document.activeElement.id==='flow_action_newAction');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.activeElement.id==='action-picker-search-input');
    const searchBox=page.locator('#action-picker-search-input');
    assert(await searchBox.evaluate(el=>{
      const canvas=el.closest('.fd-ap-scrollable'), bounds=canvas.getBoundingClientRect();
      const last=el.parentElement.querySelector('.rm-btn-action:last-child');
      return canvas.scrollTop>800 && el.getBoundingClientRect().top>=bounds.top && last.getBoundingClientRect().bottom<=bounds.bottom+1;
    }));
    await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.className),'spoke');
    await page.keyboard.type('Rec');assert.equal(await searchBox.inputValue(),'Rec');
    await page.keyboard.press('ArrowDown');await page.keyboard.type('ord');
    assert.equal(await page.locator('.action-picker-component').getAttribute('data-query'),'Record');
    await page.keyboard.press('ArrowDown');await page.keyboard.press('Backspace');assert.equal(await searchBox.inputValue(),'Recor');
    await page.keyboard.press('ArrowDown');await page.keyboard.press('/');
    assert.deepEqual(await searchBox.evaluate(n=>[n.selectionStart,n.selectionEnd]),[0,5]);
    await page.keyboard.type('Record');await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Create or Update Record');
    assert.equal(await page.locator('[data-step-id=added]').count(),0);
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Update Record');
    const ime=await ctx.newCDPSession(page);
    await ime.send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Process',code:'KeyG',windowsVirtualKeyCode:229});
    assert(await searchBox.evaluate(n=>n===document.activeElement));
    await ime.send('Input.imeSetComposition',{text:'한',selectionStart:1,selectionEnd:1});
    await ime.send('Input.insertText',{text:'한'});
    assert.equal(await searchBox.inputValue(),'Record한');
    await page.keyboard.press('ArrowDown');await page.keyboard.press('/');
    await page.locator('#app-floweditor').evaluate(el=>el.style.cssText='height:210px;overflow-y:auto');
    await page.keyboard.type('Update Record');await page.keyboard.press('Enter');
    await page.getByText('Update Record',{exact:true}).waitFor();
    assert((await page.locator('[data-step-id=added]').textContent()).startsWith('Update Record'));
    await lookup.waitFor();assert(await lookup.evaluate(el=>el.matches(':focus')));
    await page.waitForFunction(visibleRow,'new-input');
    await page.locator('#new-input').evaluate(el=>{
      const spacer=document.createElement('div');spacer.style.height='240px';
      el.closest('.form-group').before(spacer);
    });
    await page.waitForFunction(visibleRow,'new-input');
    const canvas=page.locator('#app-floweditor');
    await canvas.hover({position:{x:30,y:40}});await page.mouse.wheel(0,-360);
    await page.waitForFunction(()=>document.getElementById('new-input').getBoundingClientRect().top>document.querySelector('#app-floweditor').getBoundingClientRect().bottom);
    const manual=await canvas.evaluate(el=>el.scrollTop);
    await canvas.evaluate(el=>el.append(document.createElement('span')));
    await page.waitForTimeout(180);
    assert.equal(await canvas.evaluate(el=>el.scrollTop),manual);
    console.log('PASS 18 preceding Actions, offscreen insertion, visible search and results, delayed form layout, manual scroll override');
    await page.evaluate(()=>{
      const opener=document.createElement('button');opener.id='picker2col_opener_select_action';
      const card=document.querySelector('[data-step-id=added]');card.prepend(opener);opener.focus();
    });
    await page.waitForFunction(label=>document.querySelector('[data-flowkeys-panel]').shadowRoot.activeElement?.getAttribute('aria-label')===label,ui('Find fields','필드 검색'));
    await lookup.fill('Record');await lookup.press('Enter');
    await page.waitForFunction(()=>document.activeElement.id==='new-input');
    function visibleRow(id) {
      const el=document.getElementById(id), box=document.querySelector('#app-floweditor');
      const rect=box.getBoundingClientRect(), label=el.labels[0].getBoundingClientRect();
      return box.scrollTop>0 && label.top>=rect.top && el.getBoundingClientRect().bottom<=rect.bottom;
    }
    assert(await page.evaluate(visibleRow,'new-input'));
    await page.keyboard.press('Tab');
    await page.waitForFunction(()=>document.activeElement.id==='last-input');
    await page.waitForFunction(visibleRow,'last-input');
    await page.evaluate(()=>{
      const form=document.querySelector('[data-step-id=added] form');
      for(const [field,title] of [['approval_field','Approval Field'],['journal_field','Journal Field'],['approval_reason','Approval Reason']]) {
        const group=document.createElement('div');group.className='form-group dynamic-field_name';
        group.innerHTML='<label class="control-label"></label><div class="field-element"><div class="select2-container"><input tabindex="-1" class="select2-focusser select2-offscreen"><a class="select2-choice"><span class="select2-chosen">Select a field</span></a></div></div><button type="button" class="dot_walk_btn"></button>';
        group.querySelector('label').textContent=title;group.querySelector('.field-element').id=field;
        const pill=group.querySelector('button');pill.setAttribute('aria-label','Data Pill Picker for '+title);
        pill.innerHTML='<svg><use href="/images/icon-data-pill-picker.svg#icon"></use></svg>';
        pill.onclick=()=>{document.body.dataset.pill=field;};
        group.querySelector('a').addEventListener('mousedown',()=>document.body.dataset.field=field);
        if(field==='approval_reason') group.querySelector('.select2-container').remove();
        form.append(group);
      }
    });
    await command('f');
    assert.equal(await panel.locator('header').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(10, 15, 16)');
    assert.equal(await panel.locator('[role=option][aria-selected=true]').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(65, 74, 255)');
    await lookup.fill('Select a field');
    assert.deepEqual(await page.locator('#fk-results [role=option]').allTextContents(),
      ['Approval Field · Select a field','Journal Field · Select a field']);
    await lookup.fill('journal select');await lookup.press('Enter');
    await page.waitForFunction(()=>document.body.dataset.field==='journal_field' && document.activeElement.closest('.select2-drop'));
    await page.keyboard.press('Escape');
    await command('f');await lookup.fill(ui('data pill','데이터 필'));
    const pillOption=page.getByRole('option',{name:ui('Approval Reason · Data Pill Picker','Approval Reason · 데이터 필 선택기'),exact:true});
    assert.equal(await pillOption.innerText(),'Approval Reason');
    const original=await page.locator('button[aria-label="Data Pill Picker for Approval Reason"] use').getAttribute('href');
    assert.equal(new URL(await pillOption.locator('use').getAttribute('href'),fixture).href,new URL(original,fixture).href);
    await page.waitForFunction(()=>document.querySelector('[data-flowkeys-panel]').shadowRoot.querySelector('[role=option] svg use')?.getBBox().width>0);
    await lookup.fill('approval reason data pill');await lookup.press('Enter');
    await page.waitForFunction(()=>document.body.dataset.pill==='approval_reason');
    assert.equal(await panel.locator('output svg[aria-label="'+ui('Data Pill Picker','데이터 필 선택기')+'"]').count(),1);
    console.log('PASS delayed Action, label and field visible inside nested scrolling canvas, Tab to offscreen input, contextual Select2 search and named data pill activation');
    await page.evaluate(()=>{
      const opener=document.querySelector('#picker2col_opener_select_trigger');
      opener.onclick=()=>{
        const surface=document.createElement('div');surface.className='trigger-picker-component';
        surface.innerHTML='<button class="rm-btn-trigger">Record Updated</button>';document.body.append(surface);
        surface.firstChild.onclick=()=>{
          surface.remove();setTimeout(()=>{
            const group=document.createElement('div');group.className='form-group';
            group.innerHTML='<label class="control-label" for="trigger-table">Updated table</label><input id="trigger-table">';
            opener.closest('form').replaceChildren(group);
          },210);
        };
      };
    });
    await page.locator('#picker2col_opener_select_trigger').click();
    await page.getByRole('button',{name:'Record Updated'}).click();
    await page.waitForFunction(()=>document.activeElement.id==='trigger-table');
    console.log('PASS native trigger selection and focus after asynchronous form replacement');
    await page.evaluate(()=>{
      const menu=document.createElement('div');menu.className='action-picker-component';
      menu.innerHTML='<button class="rm-btn-action">Another action</button>';document.body.append(menu);
      menu.firstChild.onclick=()=>{
        menu.remove();
        setTimeout(()=>{
          const step=document.createElement('article');step.dataset.stepId='late';
          step.innerHTML='<input aria-label="Late input">';document.querySelector('#app-floweditor').append(step);
        },450);
      };
    });
    await page.getByRole('button',{name:'Another action'}).click();
    await page.locator('#trigger-table').click();
    await page.keyboard.type('keep editing');
    await page.getByRole('textbox',{name:'Late input'}).waitFor();
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'trigger-table');
    console.log('PASS manual editing cancels deferred focus');
    await page.locator('#flow_action_newFlowLogic').click();
    await page.waitForFunction(()=>document.activeElement.closest('.flowlogic-picker-list'));
    await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>document.body.dataset.logic),'Else If');
    await page.evaluate(()=>{
      const group=document.querySelector('.instance-type-new');
      group.style.cssText='width:850px;background:white';
      group.firstChild.textContent='×';group.firstChild.nextElementSibling.hidden=true;
      group.querySelector('.newactionflowsection-div').style.display='inline-flex';
      for(const b of group.querySelectorAll('button')) b.style.minHeight='32px';
      group.firstChild.setAttribute('aria-label','Close picker to add action, flow logic, or subflow');
      const wrapper=document.createElement('div');wrapper.className='drop-target-wrapper';
      wrapper.innerHTML='<div class="addInstanceBtn"><a aria-label="Add Action, Flow Logic, or Subflow as the first and only child of 2 - If"></a></div>';
      group.before(wrapper);
      const before=document.createElement('button');before.setAttribute('aria-label','Add Action, Flow Logic, or Subflow before first action -1 -');
      group.before(before);
      wrapper.before(before);
    });
    await command('n');
    const caption=page.locator('[data-flowkeys-row-caption]');
    await caption.waitFor();
    const labels=[await caption.innerText()];
    await page.keyboard.press('ArrowDown');labels.push(await caption.innerText());
    assert(labels.some(text=>text.includes(ui('Inside the 2. If branch','2. If 분기 안'))),labels.join(' / '));
    assert(labels.some(text=>text.includes(ui('Before the first action','첫 Action 앞'))),labels.join(' / '));
    if(!(await caption.innerText()).includes(ui('branch','분기 안')))await page.keyboard.press('ArrowDown');
    const activeRow=page.locator('[data-flowkeys-insertion-row]');
    await page.waitForFunction(()=>document.querySelector('[data-flowkeys-row-caption]')?.hasAttribute('data-inline'));
    const labelRect=await caption.locator('span').boundingBox();
    const toggle=activeRow.locator('#flow_action_btnToggleAction');
    assert((await toggle.boundingBox()).x+100<labelRect.x);
    if(process.env.FK_ROW_PREVIEW) await activeRow.screenshot({path:process.env.FK_ROW_PREVIEW});
    assert.equal(await toggle.getAttribute('aria-label'),'Close picker to add action, flow logic, or subflow');
    await activeRow.evaluate(n=>n.style.width='200px');
    await page.waitForFunction(()=>document.querySelector('[data-flowkeys-insertion-row]').nextElementSibling?.matches('[data-flowkeys-row-caption]'));
    const rowRect=await activeRow.boundingBox();
    assert((await caption.boundingBox()).y>=rowRect.y+rowRect.height-1);
    await page.keyboard.press('Escape');
    assert.equal(await caption.count(),0);assert.equal(await activeRow.count(),0);
    console.log('PASS spoke and result type-to-search, slash replacement, Backspace, Korean composition, Subflow and field picker search, wide and narrow insertion rows');
    console.log('PASS Flow Logic arrows, disabled option, Enter, Escape, mouse opening, contextual branch and first-row captions');
    await page.evaluate(()=>{
      const section=document.createElement('section');section.id='between-test';
      section.innerHTML='<article data-step-id="six"><a href="#" id="flow_action_5_expand_form" aria-label="Expand Action 6 - Global - Update Record">Update Record</a></article><div style="height:340px"></div><div class="drop-target-wrapper"><div class="addInstanceBtn"><a href="#" role="button" style="opacity:0" data-isdroppable="true" aria-label="Add Action, Flow Logic, or Subflow after 6 - Update Record">+</a></div></div><article data-step-id="seven">7. If</article><div style="height:400px"></div>';
      document.querySelector('#app-floweditor').append(section);
      section.querySelector('article a').onclick=e=>e.preventDefault();
      const drop=section.querySelector('.drop-target-wrapper');
      drop.querySelector('a').onclick=e=>{
        e.preventDefault();
        const row=document.createElement('div');row.className='instance-type-new';
        row.innerHTML='<button id="flow_action_newAction">Action</button><button id="flow_action_btnToggleAction" aria-label="Close picker to add action">×</button>';
        row.lastChild.onclick=()=>{
          row.remove();
          const plus=drop.querySelector('a'),replacement=plus.cloneNode(true);
          replacement.onclick=plus.onclick;plus.remove();
          setTimeout(()=>drop.querySelector('.addInstanceBtn').append(replacement),100);
        };
        drop.after(row);
        row.firstChild.onclick=()=>{
          const menu=document.createElement('div');menu.className='action-picker-component';
          menu.innerHTML='<input id="action-picker-search-input"><button class="rm-btn-action">Ask For Approval</button>';
          row.append(menu);
        };
      };
    });
    const between=page.locator('#between-test');
    await between.locator('article a').click();
    await command('n');
    assert.match(await caption.innerText(),ui(/After 6\. Update Record/,/6\. Update Record 뒤/));
    assert(await between.locator('[data-isdroppable]').evaluate(el=>{
      const box=el.closest('#app-floweditor').getBoundingClientRect(),r=el.getBoundingClientRect();
      return getComputedStyle(el).opacity==='1' && r.top>=box.top && r.bottom<=box.bottom;
    }));
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.activeElement.matches('#between-test #flow_action_newAction'));
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.activeElement.matches('#between-test #action-picker-search-input'));
    await between.locator('.instance-type-new').evaluate(el=>el.remove());
    await page.waitForFunction(()=>document.activeElement.matches('#between-test [data-isdroppable]'));
    await between.locator('article a').focus();
    await panel.locator('#key-hint').filter({hasText:ui('N to add · F to find fields','N 추가 · F 필드 검색')}).waitFor();
    for(const firstKey of ['ArrowDown','n']) {
      await between.locator('article a').focus();
      await page.keyboard.press(firstKey);
      assert(await between.locator('[data-isdroppable]').evaluate(el=>document.activeElement===el));
      await page.keyboard.press('ArrowDown');
      assert.equal(await marked.getAttribute('data-step-id'),'seven');
      await page.keyboard.press('ArrowUp');
      assert(await between.locator('[data-isdroppable]').evaluate(el=>document.activeElement===el));
      await page.keyboard.press('ArrowUp');
      assert.equal(await marked.getAttribute('data-step-id'),'six');
    }
    await between.locator('article a').focus();
    await page.keyboard.press('n');
    assert.match(await caption.innerText(),ui(/After 6\. Update Record/,/6\. Update Record 뒤/));
    await page.keyboard.press('Escape');
    assert(await between.locator('article a').evaluate(el=>document.activeElement===el));
    await page.keyboard.press('n');await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.activeElement.matches('#between-test #action-picker-search-input'));
    await page.keyboard.type('nf');assert.equal(await between.locator('#action-picker-search-input').inputValue(),'nf');
    await between.locator('#action-picker-search-input').evaluate(el=>el.onkeydown=e=>{if(e.key==='Escape') el.closest('.instance-type-new').remove();});
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.matches('#between-test #flow_action_newAction'));
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.matches('#between-test [data-isdroppable]'));
    assert.match(await caption.innerText(),ui(/After 6\. Update Record/,/6\. Update Record 뒤/));
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.id==='flow_action_5_expand_form');
    await between.evaluate(el=>el.remove());
    console.log('PASS transparent insertion after selected step 6, visible preview and scoped Action search before existing step 7');
    await page.evaluate(()=>{
      const log=[];
      for(const i of [7,8]) {
        const card=document.createElement('article');
        card.className='componentInstance instance-type-action';card.dataset.stepId=String(i);
        card.innerHTML='<a href="#" id="flow_action_'+i+'_expand_form">Action '+i+'</a><form class="inputFields" hidden><label>Message</label><textarea aria-label="Message"></textarea></form>';
        const form=card.querySelector('form');
        card.firstChild.onclick=e=>{e.preventDefault();form.hidden=!form.hidden;};
        for(const [op,id,parent] of [
          ['duplicate','flow_action_'+i+'_duplicate_component_instance_icon_'+i,card],
          ['annotation','flow_action_'+i+'_add_comments_icon_'+i,card],
          ['delete','flow_action_btnDelete',form],['cancel','flow_action_btnCancel',form],['done','flow_action_btnDone',form]
        ]) {
          const b=document.createElement('button');b.type='button';b.id=id;b.textContent=op;
          if(op==='annotation') b.onmousedown=()=>b.dataset.primary='true';
          b.onclick=()=>{log.push(i+'/'+op);document.body.dataset.operations=JSON.stringify(log);
            if(op==='annotation' && b.dataset.primary==='true'){
              setTimeout(()=>{const n=document.createElement('input');n.setAttribute('aria-label','Action annotation text field');card.append(n);},45);
            }
            if(op==='delete') setTimeout(()=>{
              const overlay=document.createElement('div');
              overlay.innerHTML='<div class="instanceDeleteModal" role="dialog" tabindex="-1"><button id="instanceDeleteModal_cancelButton">Cancel</button><button id="instanceDeleteModal_confirmButton">Delete</button></div>';
              const [cancel,confirm]=overlay.querySelectorAll('button');
              cancel.onclick=()=>{overlay.remove();card.focus();};
              confirm.onclick=()=>{overlay.remove();card.remove();};
              document.body.append(overlay);overlay.firstChild.focus();
            },45);
          };
          parent.append(b);
        }
        document.querySelector('#app-floweditor').append(card);
      }
      document.querySelector('[data-step-id="7"] form').hidden=false;
    });
    const subject=page.locator('[data-step-id="8"]');
    await subject.locator('a').click();await lookup.waitFor();
    await lookup.press('Escape');await page.waitForFunction(()=>document.activeElement.dataset.stepId==='8');
    await page.keyboard.press('f');await lookup.waitFor();
    await lookup.pressSequentially('nf');assert.equal(await lookup.inputValue(),'nf');
    await lookup.press('Escape');await page.waitForFunction(()=>document.activeElement.dataset.stepId==='8');
    await page.keyboard.press('Enter');await lookup.waitFor();
    await lookup.fill('later');
    await subject.locator('form').evaluate(f=>{const n=document.createElement('input');n.setAttribute('aria-label','Later field');f.append(n);});
    await panel.getByRole('option',{name:'Later field'}).waitFor();assert.equal(await lookup.inputValue(),'later');
    const msg=subject.locator('textarea');
    await lookup.fill('message');await lookup.press('Enter');await msg.pressSequentially('daxcenf');
    assert.equal(await msg.inputValue(),'daxcenf');
    await command('d');await command('a');
    await page.waitForFunction(()=>document.activeElement.getAttribute('aria-label')==='Action annotation text field');
    await command('c');await command('e');
    assert.deepEqual(await page.evaluate(()=>JSON.parse(document.body.dataset.operations)),['8/duplicate','8/annotation','8/cancel','8/done']);
    await command('x');
    await page.waitForFunction(()=>document.activeElement.id==='instanceDeleteModal_confirmButton');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.dataset.stepId==='8');
    await subject.locator('#flow_action_btnDone').evaluate(n=>n.disabled=true);
    await page.keyboard.press(chord);assert(!(await panel.locator('[data-command=done]').isVisible()));
    await page.keyboard.press('e');assert.equal(await page.evaluate(()=>JSON.parse(document.body.dataset.operations).length),5);
    await command('x');await page.waitForFunction(()=>document.activeElement.id==='instanceDeleteModal_confirmButton');
    await page.keyboard.press('ArrowLeft');assert.equal(await page.evaluate(()=>document.activeElement.id),'instanceDeleteModal_cancelButton');
    await page.keyboard.press('Enter');assert.equal(await subject.count(),1);
    await command('x');await page.waitForFunction(()=>document.activeElement.id==='instanceDeleteModal_confirmButton');
    await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
    await subject.waitFor({state:'detached'});assert.equal(await page.locator('[data-step-id="7"]').count(),1);
    const other=page.locator('[data-step-id="7"]');
    await other.evaluate(card=>{
      const button=document.createElement('button');button.id='picker2col_opener_select_action';button.textContent='Choose Action';
      button.onclick=()=>setTimeout(()=>{
        const surface=document.createElement('div');surface.className='action-picker-component';
        surface.innerHTML='<input id="action-picker-search-input"><button class="module">Core</button>';
        const input=surface.firstChild, module=surface.lastChild;
        input.onkeydown=e=>{if(e.key==='ArrowDown')module.focus();};
        card.append(surface);
        setTimeout(()=>{module.focus();card.dataset.autofocus='finished';},150);
      },25);
      card.append(button);
    });
    await other.getByRole('button',{name:'Choose Action'}).click();
    await page.waitForFunction(()=>document.querySelector('[data-step-id="7"]').dataset.autofocus==='finished' && document.activeElement.id==='action-picker-search-input');
    const propSearch=other.locator('#action-picker-search-input');
    assert.equal(await propSearch.evaluate(n=>getComputedStyle(n).caretColor),'rgb(65, 74, 255)');
    await page.keyboard.type('Update Record');assert.equal(await propSearch.inputValue(),'Update Record');
    await page.keyboard.press('ArrowDown');assert(await other.locator('.module').evaluate(n=>n===document.activeElement));
    console.log('PASS native delete confirmation, Escape and arrow keys, scoped confirmation, delayed Action property caret, immediate typing and deliberate navigation');
    console.log('PASS automatic Action field finder, direct text edit, scoped duplicate/annotation/cancel/done/delete, disabled command and delete cancellation');
    await page.goto(fixture);
    if(mac) await (await ctx.newCDPSession(page)).send('Emulation.setUserAgentOverride',{userAgent:await page.evaluate(()=>navigator.userAgent),platform:'MacIntel'});
    await page.evaluate(()=>{
      const makeRow=(group,index)=>{
        const row=document.createElement('div');row.className='condition-row';
        row.innerHTML='<button type="button" class="and-btn" id="orBtnANDCondition1">and</button><button type="button" class="or-btn">or</button><select disabled><option>is</option></select><button type="button" class="remove">Remove</button>';
        for(const b of row.querySelectorAll('button')) {
          b.setAttribute('aria-label',b.className==='remove'?'Remove Condition set '+group+' condition '+index:
            "Add '"+b.textContent.toUpperCase()+"' Condition in condition set "+group+' after condition '+index);
          b.onclick=()=>{if(b.className==='remove')row.remove();else row.after(makeRow(group,index+1));};
        }
        return row;
      };
      document.body.innerHTML='<main class="actionContainer"></main>';
      for(const [i,label] of ['If','Else If'].entries()) {
        const card=document.createElement('article');card.className='componentInstance instance-type-flowlogic';card.dataset.stepId='logic'+i;
        card.innerHTML='<a href="#" id="flow_action_'+i+'_expand_form">'+label+'</a><form class="inputFields" hidden><input id="condition_name"><button type="button" id="ifbtnAddConditionsSet">Add another condition set</button><button type="button">Done</button></form>';
        const form=card.querySelector('form'),group=form.querySelector('#ifbtnAddConditionsSet');
        group.before(makeRow(1,1));
        group.onclick=()=>group.before(makeRow(2,1));
        card.firstChild.onclick=e=>{e.preventDefault();form.hidden=!form.hidden;};
        card.firstChild.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();form.hidden=!form.hidden;}};
        document.querySelector('main').append(card);
      }
    });
    await dev.send('Extensions.triggerAction',{id,targetId:tabInfo.targetId});
    await page.getByRole('link',{name:'Else If'}).press('Enter');
    const logicQuery=page.getByRole('combobox',{name:ui('Find conditions and buttons','조건 및 버튼 검색')}), rowCount=id=>page.locator('[data-step-id="'+id+'"] .condition-row').count();
    await logicQuery.waitFor();await logicQuery.fill('AND');await logicQuery.press('Enter');
    assert.equal(await rowCount('logic1'),2);assert.equal(await rowCount('logic0'),1);
    await logicQuery.fill(ui('group1 condition2 OR','그룹1 조건2 OR'));assert.equal(await panel.getByRole('option').count(),1);await logicQuery.press('Enter');
    assert.equal(await rowCount('logic1'),3);
    await logicQuery.fill(ui('new group','새 그룹'));await logicQuery.press('Enter');
    await logicQuery.fill(ui('group 2 condition 1 delete','그룹 2 조건 1 삭제'));await logicQuery.press('Enter');
    assert.equal(await rowCount('logic1'),3);
    await logicQuery.press('Escape');await command('f');await logicQuery.fill('operator');assert.equal(await panel.getByRole('option').count(),0);
    await logicQuery.fill(ui('Condition Label','조건 레이블'));await logicQuery.press('Enter');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'condition_name');
    const opSelect=page.locator('[data-step-id=logic1] .condition-row select').first();
    await opSelect.evaluate(el=>{
      el.disabled=false;el.add(new Option('is not','!='));el.add(new Option('is empty','ISEMPTY'));
      const value=document.createElement('div');value.contentEditable='true';el.after(value);
      el.onchange=()=>{el.dataset.committed=el.value;value.hidden=el.value==='ISEMPTY';};
    });
    await command('f');await logicQuery.fill(ui('Operator','연산자'));
    assert.equal(await panel.getByRole('option').count(),3);
    await logicQuery.fill('is not');await logicQuery.press('Enter');
    assert.equal(await opSelect.getAttribute('data-committed'),'!=');
    await page.keyboard.type('keyboard QA');
    assert.equal(await opSelect.evaluate(el=>el.nextElementSibling.textContent),'keyboard QA');
    await command('f');await logicQuery.fill('is');await logicQuery.press('Enter');
    assert.equal(await opSelect.getAttribute('data-committed'),'is');
    assert(await opSelect.evaluate(el=>el.nextElementSibling===document.activeElement));
    await command('f');await logicQuery.fill('is empty');await logicQuery.press('Enter');
    assert(await opSelect.evaluate(el=>el===document.activeElement && el.nextElementSibling.hidden));
    console.log('PASS scoped Else If AND, per-row OR, separate group, row removal, disabled operator and text editing');
    await opSelect.evaluate(el=>{
      el.nextElementSibling.remove();
      el.onchange=null;el.value='is';
      el.insertAdjacentHTML('afterend','<div id="s2id_condition" class="select2-container"><a class="select2-choice"><span class="select2-chosen">Select a choice</span></a></div><select id="condition" class="select2-offscreen" aria-hidden="true"><option></option><option value="1">1 - Critical</option><option value="2">2 - High</option></select>');
      const container=el.nextElementSibling, select=container.nextElementSibling;
      container.querySelector('a').onmousedown=()=>{
        const popup=document.createElement('div');popup.className='select2-drop';
        popup.innerHTML='<input aria-owns="qa-choice-results"><ul id="qa-choice-results"></ul>';
        for(const option of select.options) {
          if(!option.label) continue;
          const li=document.createElement('li');li.className='select2-result-selectable';
          const label=document.createElement('span');label.className='select2-result-label';label.textContent=option.label;
          li.append(label);popup.querySelector('ul').append(li);
          li.onmouseup=()=>{select.value=option.value;container.querySelector('span').textContent=option.label;popup.remove();};
        }
        document.body.append(popup);
      };
    });
    await command('f');await logicQuery.fill(ui('group 1 condition 1 is','그룹 1 조건 1 is'));await logicQuery.press('Enter');
    const choiceQuery=page.getByRole('combobox',{name:ui('Find a value','목록 값 검색')});
    await choiceQuery.fill('High');assert.equal(await panel.getByRole('option').count(),1);
    await choiceQuery.press('Enter');
    assert.equal(await page.locator('#condition').inputValue(),'2');
    console.log('PASS row-specific Choice operator → value search → native Select2 selection');
    await page.evaluate(()=>{
      const card=document.createElement('section');card.className='trigger-section';
      card.innerHTML='<div class="componentInstance"><a id="flow_trigger_expand_form">Created</a><form class="inputFields"><button type="button" id="adv_trigger_toggle_button" aria-expanded="false">Advanced Options</button><input aria-label="Run session" hidden><button type="button" id="flow_trigger_btn_delete">Delete</button><button type="button" id="flow_trigger_btn_cancel">Cancel</button><button type="button" id="flow_trigger_btn_done">Done</button></form></div>';
      document.body.append(card);
      card.querySelector('form').onclick=e=>{
        if(e.target.id==='adv_trigger_toggle_button') {
          const input=card.querySelector('input');input.hidden=!input.hidden;e.target.setAttribute('aria-expanded',String(!input.hidden));
        } else card.dataset.result=e.target.id;
      };
    });
    await page.locator('#adv_trigger_toggle_button').focus();await command('f');
    const triggerQuery=page.getByRole('combobox',{name:ui('Find fields','필드 검색')});
    await triggerQuery.fill(ui('Advanced Options','고급 옵션'));await triggerQuery.press('Enter');
    await triggerQuery.fill('Run session');assert.equal(await panel.getByRole('option').count(),1);
    await triggerQuery.fill('Advanced Options');await triggerQuery.press('Enter');
    await triggerQuery.fill('Run session');assert.equal(await panel.getByRole('option').count(),0);
    for(const name of ['Done','Cancel','Delete']) {
      await triggerQuery.fill(name);await triggerQuery.press('Enter');
      assert.equal(await page.locator('.trigger-section').getAttribute('data-result'),'flow_trigger_btn_'+name.toLowerCase());
      await command('f');
    }
    console.log('PASS trigger Advanced Options expansion, child filter, collapse, Done, Cancel and Delete scope');
    await triggerQuery.press('Escape');
    await page.evaluate(()=>{
      const card=document.createElement('article');card.dataset.actionInstanceId='dynamic-qa';
      card.innerHTML='<form class="inputFields"><input aria-label="Table"></form>';document.body.append(card);
    });
    const dynamic=page.locator('[data-action-instance-id=dynamic-qa]');
    await dynamic.locator('input').focus();await command('f');
    await lookup.fill('Field Values');assert.equal(await panel.getByRole('option').count(),0);
    await dynamic.evaluate(card=>{
      const group=document.createElement('div');group.className='form-group';
      group.innerHTML='<label class="control-label">Field Values</label><div class="template_picker"><div class="rows"></div><button type="button" class="btn-add-fv">Add field value</button></div>';
      card.querySelector('form').append(group);
      const add=group.querySelector('button');
      add.onclick=()=>{
        add.disabled=true;
        setTimeout(()=>{
          const row=document.createElement('div');row.className='colrow';
          row.innerHTML='<div class="colselect"><div class="select2-container"><a class="select2-choice select2-default"><span class="select2-chosen">Select a field</span></a></div></div><div class="colfield"></div>';
          group.querySelector('.rows').append(row);
          row.querySelector('a').onmousedown=()=>{
            const popup=document.createElement('div');popup.className='select2-drop';popup.innerHTML='<input type="search"><button type="button">Short description</button>';
            document.body.append(popup);
            popup.querySelector('button').onclick=()=>{
              popup.remove();row.querySelector('a').classList.remove('select2-default');
              row.querySelector('span').textContent='Short description';
              row.querySelector('.colfield').innerHTML='<input hidden><textarea id="short_description"></textarea>';add.disabled=false;
            };
          };
        },120);
      };
    });
    const addFieldResult=panel.getByRole('option',{name:'Field Values · Add field value',exact:true});
    await addFieldResult.waitFor();await lookup.fill('Short description');
    await lookup.press('Enter');
    await page.waitForFunction(()=>document.activeElement.matches('.select2-drop input') && document.activeElement.value==='Short description');
    await dynamic.evaluate(card=>{
      const field=card.querySelector('.colrow .select2-container'), replacement=field.cloneNode(true);
      replacement.querySelector('a').onmousedown=field.querySelector('a').onmousedown;
      document.querySelector('.select2-drop').remove();
      field.replaceWith(replacement);
    });
    await page.waitForFunction(()=>document.activeElement.matches('.select2-drop input') && document.activeElement.value==='Short description');
    assert.equal(await dynamic.locator('.colrow').count(),1);
    await page.locator('.select2-drop button').press('Enter');
    await dynamic.locator('textarea').focus();await command('f');await lookup.fill(ui('short_description value','short_description 값'));await lookup.press('Enter');
    await page.keyboard.type('dynamic QA');assert.equal(await dynamic.locator('textarea').inputValue(),'dynamic QA');
    await command('f');await lookup.fill('Field Values');await addFieldResult.waitFor();await lookup.press('Enter');
    await page.waitForFunction(()=>document.activeElement.matches('.select2-drop input'));
    assert.equal(await dynamic.locator('.colrow').count(),2);
    console.log('PASS dynamic template discovery, seeded new row search, value focus, and explicit second row');
    // Model the PDI Select2 portal. Only the native widget can commit a row.
    await page.keyboard.press('Escape');
    const people=['1'.repeat(32),'2'.repeat(32)];
    await page.route('**/api/now/table/sys_user?*',route=>{
      const query=new URL(route.request().url()).searchParams;
      assert.equal(query.get('sysparm_query'),'sys_idIN'+people.join(','));
      return route.fulfill({json:{result:people.map((sys_id,i)=>({sys_id,user_name:'alex.'+(i+1)}))}});
    });
    await dynamic.evaluate((card,people)=>{
      const row=document.createElement('div');
      row.className='colrow';
      row.innerHTML='<div class="colselect"><div class="select2-container"><a class="select2-choice"><span class="select2-chosen">Assigned to</span></a></div></div><div class="colfield"><div class="select2-container select2-reference" id="s2id_field_values_assigned_to_3"><input class="select2-focusser" id="fixture-person"><a class="select2-choice"><span class="select2-chosen">Original</span></a></div></div>';
      card.querySelector('.rows').append(row);
      const metadata=new WeakMap();
      window.$j=el=>({data:k=>k==='select2-data' && metadata.get(el)});
      row.onmousedown=e=>{
        if(!e.target.closest('.select2-reference')) return;
        const field=row.querySelector('.select2-reference');
        field.classList.add('select2-dropdown-open');
        const popup=document.createElement('div');
        popup.className='select2-drop select2-drop-active';
        popup.innerHTML='<input id="fixture-person_search" aria-owns="fixture-results"><ul class="select2-results" id="fixture-results"></ul>';
        document.body.append(popup);
        const input=popup.querySelector('input'),list=popup.querySelector('ul');
        let selected=0;
        input.oninput=()=>{
          const states={load:['select2-searching','Searching...'],empty:['select2-no-results','No matches found'],denied:['select2-error','403 Forbidden'],error:['select2-error','Search failed']};
          list.replaceChildren();
          if(states[input.value]) {
            const li=document.createElement('li');[li.className,li.textContent]=states[input.value];list.append(li);return;
          }
          people.forEach((id,i)=>{
            const li=document.createElement('li');li.className='select2-result-selectable';
            li.innerHTML='<div role="option" class="select2-result-label" id="person-'+i+'">Alex Kim</div>';
            metadata.set(li,{id});list.append(li);
          });
        };
        input.onkeydown=e=>{
          if(e.key==='ArrowDown') {e.preventDefault();selected=1;}
          if(!['Enter','Escape'].includes(e.key)) return;
          e.preventDefault();
          if(e.key==='Enter') {row.dataset.selected=people[selected];field.querySelector('.select2-chosen').textContent='Alex Kim';}
          field.classList.remove('select2-dropdown-open');
          field.replaceWith(field.cloneNode(true));popup.remove();
        };
      };
    },people);
    const openPerson=async()=>{
      await dynamic.locator('#fixture-person').focus();await command('f');
      await lookup.fill(ui('assigned_to value','assigned_to 값'));await lookup.press('Enter');
      await page.waitForFunction(()=>document.activeElement.id==='fixture-person_search');
    };
    await openPerson();
    const personQuery=page.locator('#fixture-person_search');
    for(const [q,msg] of [['load',ui('Searching records…','참조 검색 중…')],['empty',ui('No records found.','검색 결과가 없습니다.')],['denied',ui('You don’t have permission to search these records.','참조 검색 권한이 없습니다.')],['error',ui('The record search failed.','참조 검색에 실패했습니다.')]]) {
      await personQuery.fill(q);await panel.getByText(msg,{exact:true}).waitFor();
    }
    await personQuery.press('Escape');
    await page.waitForFunction(()=>document.activeElement.id==='fixture-person');
    assert.equal(await dynamic.locator('#s2id_field_values_assigned_to_3 .select2-chosen').innerText(),'Original');
    await openPerson();await personQuery.fill('Alex');
    await page.getByRole('option',{name:'Alex Kim · alex.1'}).waitFor();
    await page.getByRole('option',{name:'Alex Kim · alex.2'}).waitFor();
    await personQuery.press('ArrowDown');await personQuery.press('Enter');
    await page.waitForFunction(()=>document.activeElement.id==='fixture-person');
    assert.equal(await dynamic.locator('.colrow[data-selected]').getAttribute('data-selected'),people[1]);
    console.log('PASS duplicate assignee identity, reference statuses, exact Enter commit, Escape and focus after replacement');
    assert.deepEqual(errors,[]);
    console.log('PASS field/value search, direct value focus, forwarding new field query, duplicate insertion deduplication, category keyboard selection and exact action insertion');
    console.log('PASS navigation, portal search, option selection, field focus return, branch cancel, nested insertion, new card focus, native Escape, teardown');
  } finally {await ctx.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});



