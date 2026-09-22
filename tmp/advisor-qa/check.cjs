const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync('public/conseiller-ia.html', 'utf8');
const calls = [], errors = [];
let failSubmit = false;
const dom = new JSDOM(html, {
  url:'https://plateforme.les-formateurs-ia.fr/conseiller-ia.html', runScripts:'dangerously', pretendToBeVisual:true,
  beforeParse(w) {
    w.ResizeObserver = class { observe() {} };
    w.addEventListener('error', e => errors.push(e.message));
    w.fetch = async (_, options) => {
      const data = JSON.parse(options.body); calls.push(data);
      if (failSubmit && data.action === 'submit') return {ok:false,json:async()=>({error:'Erreur test'})};
      return {ok:true,json:async()=>data.action === 'analyze' ? {analysis:{introduction:'Votre analyse',opportunities:['Une piste'],sections:[{title:'Formation',body:'Un parcours'}]}} : {}};
    };
  }
});
const w = dom.window, d = w.document;
const $ = id => d.getElementById(id);
const click = selector => d.querySelector(selector).click();
const input = (id, value) => { $(id).value = value; $(id).dispatchEvent(new w.Event('input', {bubbles:true})); };
const submit = () => $('project-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const tick = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  assert.equal($('panel-profile').hidden,false);
  assert.equal($('profile').value,'');
  assert.deepEqual([...d.querySelectorAll('[data-profile]')].map(x=>x.dataset.profile),['particulier','entreprise']);
  click('[data-profile="particulier"]');
  assert.equal($('panel-project').hidden,false);
  assert.equal(d.activeElement.id,'title-project');
  click('#next-project');
  assert.equal($('panel-contact').hidden,true);
  input('sector','Commerce'); input('need','Un projet de formation pour apprendre à utiliser l’IA.');
  click('#next-project');
  assert.equal($('panel-contact').hidden,false);
  input('first-name','Camille'); input('last-name','Test'); input('email','invalid');
  submit(); await tick(); assert.equal(calls.length,0);
  click('[data-back="1"]'); assert.match($('need').value,/formation/);
  click('[data-back="0"]'); click('[data-profile="entreprise"]');
  assert.equal($('sector').value,'Commerce');
  click('#next-project'); assert.equal($('first-name').value,'Camille');
  input('email','camille@example.test');
  failSubmit = true; submit(); await tick();
  assert.equal($('submit-error').hidden,false);
  assert.equal($('project-fields').disabled,false);
  assert.equal($('panel-contact').hidden,false);
  const requestId = calls[0].requestId;
  failSubmit = false; submit(); await tick();
  assert.equal($('analysis').hidden,false);
  assert.deepEqual(calls.map(x=>x.action),['submit','submit','analyze']);
  assert.equal(calls[1].requestId,requestId);
  assert.equal(calls[1].contactAccepted,true);
  assert.equal(calls[1].profile,'entreprise');
  assert.equal(calls[1].email,'camille@example.test');
  click('#restart-button');
  assert.equal($('panel-profile').hidden,false);
  assert.equal($('profile').value,'');
  assert.equal($('email').value,'');
  assert.equal($('need-count').textContent,'0/2000');
  click('[data-profile="particulier"]'); input('sector','Commerce'); input('need','short');
  click('#next-project'); assert.equal($('panel-contact').hidden,true);
  input('need','Une description suffisamment longue.'); submit();
  assert.equal($('panel-contact').hidden,false);
  assert.equal(calls.length,3);
  assert.deepEqual(errors,[]);
  console.log('PASS: profile order, instant progression, required fields, minimum length, Enter navigation, back preserves data, both profiles, consent payload, failed save retry/deduplication, analysis, restart, no JS errors.');
  w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1;});
