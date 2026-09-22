from pathlib import Path
p = Path('public/conseiller-ia.html')
s = p.read_text(encoding='utf-8')
start = s.index('    <header class="intro">')
end = s.index('\n      <section class="loading"', start)
s = s[:start] + '''    <header class="intro">
      <div class="topline"><div class="eyebrow"><span aria-hidden="true">✦</span> Votre demande en quelques secondes</div><span class="step-count" id="step-count">Étape 1 sur 3</span></div>
      <nav class="steps" aria-label="Étapes du formulaire">
        <span class="step" id="step-profile" aria-current="step"><b>1</b> Votre profil</span>
        <span class="step" id="step-project"><b>2</b> Votre projet</span>
        <span class="step" id="step-contact"><b>3</b> Vos coordonnées</span>
      </nav>
    </header>
    <div class="content">
      <noscript><p class="error">Activez JavaScript pour utiliser le conseiller, ou appelez-nous au <a href="tel:+33980874046">09 80 87 40 46</a>.</p></noscript>
      <form id="project-form" novalidate>
        <fieldset id="project-fields">
          <input type="hidden" name="profile" id="profile">
          <section id="panel-profile" aria-labelledby="title-profile">
            <h1 id="title-profile" tabindex="-1">Faisons connaissance.</h1>
            <p class="panel-description">Un projet personnel ou un besoin pour votre entreprise ? À vous de choisir.</p>
            <div class="profiles">
              <button class="profile" type="button" data-profile="particulier" aria-pressed="false"><span class="profile-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg></span><strong>Particulier</strong><small>Je développe mes compétences<br>et je donne vie à mes idées.</small><span class="profile-arrow" aria-hidden="true">↗</span></button>
              <button class="profile" type="button" data-profile="entreprise" aria-pressed="false"><span class="profile-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 21V3h10v18M14 9h6v12M2 21h20M8 7h2M8 11h2M8 15h2M17 13h1M17 17h1"/></svg></span><strong>Entreprise</strong><small>J’accompagne mon équipe<br>et je fais évoluer mon activité.</small><span class="profile-arrow" aria-hidden="true">↗</span></button>
            </div>
            <p class="note">Un premier pas vers un projet IA qui vous ressemble.</p>
          </section>
          <section id="panel-project" aria-labelledby="title-project" hidden>
            <h1 id="title-project" tabindex="-1">Parlez-nous de votre projet</h1>
            <p class="panel-description">Décrivez votre besoin : notre IA vous propose des pistes adaptées à votre activité et à vos objectifs.</p>
            <label class="field-label" for="sector">Secteur d’activité</label>
            <input id="sector" name="sector" list="sectors" minlength="2" maxlength="120" required placeholder="Ex. Immobilier, santé, commerce…"><datalist id="sectors"><option value="Immobilier"><option value="Santé"><option value="Juridique"><option value="BTP"><option value="Marketing et communication"><option value="Commerce"><option value="Ressources humaines"><option value="Éducation et formation"><option value="Industrie"></datalist>
            <label class="field-label project-label" for="need">Parlez-nous de votre projet</label>
            <div class="textarea-wrap"><span class="pencil" aria-hidden="true">✎</span><textarea id="need" name="need" minlength="10" maxlength="2000" required aria-describedby="need-help" placeholder="Exemple : Je souhaite former mon équipe à l’IA pour gagner en productivité…"></textarea><span class="counter" id="need-count">0/2000</span></div>
            <p class="hint" id="need-help">10 caractères minimum. N’incluez pas de données personnelles ou confidentielles.</p>
            <div class="step-actions"><button class="back" type="button" data-back="0"><span aria-hidden="true">←</span> Revenir</button><button class="btn primary" type="button" id="next-project">Continuer <span aria-hidden="true">→</span></button></div>
          </section>
          <section id="panel-contact" aria-labelledby="title-contact" hidden>
            <h1 id="title-contact" tabindex="-1">Et pour faire connaissance…</h1>
            <p class="panel-description">Laissez-nous vos coordonnées pour vous accompagner dans votre projet.</p>
            <div class="grid">
              <div><label class="field-label" for="first-name">Prénom</label><input id="first-name" name="firstName" autocomplete="given-name" maxlength="100" required placeholder="Votre prénom"></div>
              <div><label class="field-label" for="last-name">Nom</label><input id="last-name" name="lastName" autocomplete="family-name" maxlength="100" required placeholder="Votre nom"></div>
              <div class="wide"><label class="field-label" for="email">Adresse email</label><input id="email" name="email" type="email" autocomplete="email" maxlength="254" required placeholder="vous@exemple.fr"></div>
            </div>
            <p class="consent" id="contact-consent">En passant à l’étape suivante, vous acceptez que Les Formateurs IA utilisent vos coordonnées pour répondre à votre demande et vous contacter au sujet de ce projet.</p>
            <div class="step-actions"><button class="back" type="button" data-back="1"><span aria-hidden="true">←</span> Revenir</button><button class="btn primary" type="submit" id="submit-button" aria-describedby="contact-consent"><span aria-hidden="true">✦</span> Analyser mon besoin <span aria-hidden="true">→</span></button></div>
            <p class="note">Analyse personnalisée · Sans engagement</p>
          </section>
          <div class="honeypot" aria-hidden="true"><label>Votre site web<input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>
        </fieldset>
        <p class="error" id="submit-error" role="alert" hidden></p>
      </form>
''' + s[end:]
css = '''
    /* Soft animated canvas and translucent cards, shared by every step. */
    :root { --ink:#302b4b; --muted:#77768e; --line:rgba(181,141,224,.22); --purple:#9562e8; --pink:#dfa7f1; --brand-gradient:linear-gradient(110deg,#dfa7f1 0%,#ab79ed 46%,#7954ff 100%); }
    body { position:relative; isolation:isolate; padding:36px 28px 22px; background:#f8f7ff; }
    body::before { content:""; position:fixed; z-index:-2; inset:-20%; pointer-events:none; background:radial-gradient(ellipse at 20% 25%,#ead7ff 0,transparent 45%),radial-gradient(ellipse at 85% 30%,#fbdcf3 0,transparent 42%),radial-gradient(ellipse at 65% 85%,#dcecff 0,transparent 48%); animation:aurora 18s ease-in-out infinite alternate; }
    body::after { content:"✦"; position:absolute; top:10px; right:15px; color:#b58de0; font-size:30px; text-shadow:0 0 24px #dca5ef; pointer-events:none; animation:twinkle 5s ease-in-out infinite alternate; }
    @keyframes aurora { to { transform:translate(5%,-4%) rotate(8deg) scale(1.08); } }
    @keyframes twinkle { to { opacity:.45; transform:rotate(18deg) scale(.85); } }
    @keyframes appear { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .shell { max-width:920px; border:1.5px solid rgba(255,255,255,.95); border-radius:28px; background:linear-gradient(120deg,rgba(255,255,255,.64),rgba(255,255,255,.4)); box-shadow:0 15px 65px #ab83dd20,inset 0 0 24px #ffffff70; backdrop-filter:blur(22px); }
    .intro { padding:26px 30px 0; background:none; border:0; }
    .topline { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .eyebrow { display:inline-flex; padding:5px 12px; border-radius:999px; background:var(--brand-gradient); color:#fff; font-size:11px; font-weight:600; letter-spacing:0; text-transform:none; box-shadow:0 3px 14px #ad79e940; }
    .eyebrow span { font-size:17px; line-height:1; }
    .step-count { font-size:11px; color:var(--muted); white-space:nowrap; }
    .steps { gap:22px; margin-top:22px; font-size:12px; }
    .step { gap:7px; color:var(--muted); }
    .step b { width:22px; height:22px; border-color:var(--line); font-size:10px; background:#ffffff60; }
    .step[aria-current="step"] { color:#8050ca; }
    .step[aria-current="step"] b { color:white; }
    .content { padding:22px 30px 26px; }
    #project-fields > section:not([hidden]) { animation:appear .3s ease-out; }
    h1 { margin:0 0 8px; font-size:clamp(24px,3.5vw,30px); line-height:1.2; font-weight:650; letter-spacing:-.035em; }
    h1:focus { outline:none; }
    .panel-description { max-width:650px; color:var(--muted); font-size:14px; margin:0 0 22px; line-height:1.5; }
    .profiles { gap:16px; margin:4px 0 18px; }
    .profile { display:flex; flex-direction:column; align-items:flex-start; gap:0; min-height:204px; padding:24px; text-align:left; color:var(--ink); background:#ffffff85; border:1px solid #ffffff; border-radius:20px; transition:transform .2s,box-shadow .2s,border-color .2s; }
    .profile:hover,.profile[aria-pressed="true"] { transform:translateY(-3px); border-color:#be98f0; background:#ffffffb0; box-shadow:0 8px 26px #b58de025; }
    .profile-icon { display:grid; place-items:center; width:44px; height:44px; border-radius:14px; background:var(--brand-soft); color:#9562df; margin-bottom:16px; }
    .profile-icon svg { width:25px; height:25px; fill:none; stroke:currentColor; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
    .profile strong { font-size:21px; font-weight:600; }
    .profile small { font-size:13px; margin-top:7px; line-height:1.5; }
    .profile-arrow { position:absolute; right:22px; top:25px; color:#a575e3; font-size:23px; }
    .field-label { font-size:13px; margin-bottom:7px; font-weight:550; }
    input:not([type="radio"]):not([type="checkbox"]),textarea { border:1px solid #ffffffc0; background:#ffffffb0; border-radius:14px; padding:13px 16px; font-size:14px; }
    input::placeholder,textarea::placeholder { color:#9a98b2; }
    .project-label { margin-top:18px; }
    .textarea-wrap { position:relative; }
    textarea { min-height:126px; padding:17px 20px 32px 42px; resize:vertical; }
    .pencil { position:absolute; top:12px; left:15px; color:#9864df; font-size:22px; pointer-events:none; }
    .counter { position:absolute; right:15px; bottom:10px; color:#9291af; font-size:11px; pointer-events:none; }
    .hint { font-size:11px; }
    .step-actions { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:24px; }
    .back { display:inline-flex; align-items:center; gap:9px; color:var(--muted); background:none; border:0; padding:12px 0; font-size:13px; }
    .back:hover { color:#8050ca; }
    .btn { border-radius:999px; min-height:46px; padding:12px 23px; font-size:13px; }
    .primary { color:white; box-shadow:0 6px 20px #a175e33b; }
    .primary:hover { box-shadow:0 8px 24px #a175e35c; }
    .consent { display:block; margin:20px 0 0; font-size:12px; line-height:1.65; }
    .note { font-size:11px; }
    .footer { background:#ffffff40; border-color:#ffffff90; padding:14px 30px; }
    .trust { max-width:650px; margin:18px auto 0; padding:10px 20px; display:flex; align-items:center; justify-content:center; gap:10px; color:#83819d; background:#eeebfb70; border:1px solid #ffffff70; border-radius:999px; font-size:11px; text-align:center; }
    .trust svg { width:20px; height:20px; flex:none; fill:none; stroke:#9562e8; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
    .analysis-card { background:#ffffff70; }
    @media (max-width:640px) {
      body { padding:22px 12px 16px; }
      .intro { padding:22px 18px 0; }
      .content { padding:20px 18px 22px; }
      .footer { padding:14px 18px; }
      .topline { align-items:flex-start; gap:8px; }
      .eyebrow { font-size:10px; padding:5px 9px; }
      .step-count { font-size:10px; padding-top:4px; }
      .steps { gap:12px; justify-content:space-between; font-size:10px; }
      .step { gap:4px; }
      .profiles { grid-template-columns:1fr 1fr; gap:10px; }
      .profile { padding:18px 13px; min-height:210px; }
      .profile strong { font-size:18px; }
      .profile small { font-size:12px; }
      .profile-arrow { right:12px; top:15px; font-size:20px; }
      .panel-description { font-size:13px; }
      .grid { grid-template-columns:1fr; gap:14px; }
      .btn { padding:12px 16px; }
      .trust { padding:10px 14px; font-size:10px; }
    }
    @media (max-width:360px) { .topline { flex-wrap:wrap; } .step-actions { gap:8px; } .btn { padding:12px; font-size:12px; } }
'''
s = s.replace('    @media (prefers-reduced-motion:reduce)', css + '\n    @media (prefers-reduced-motion:reduce)')
s = s.replace('  <main class="shell"', '  <div id="widget-frame">\n  <main class="shell"')
s = s.replace('  </main>\n  <script>', '''  </main>
  <p class="trust"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6Z"/><path d="m8 12 3 3 5-6"/></svg>Vos informations sont utilisées uniquement pour vous accompagner dans votre projet.</p>
  </div>
  <script>''')
pos = s.index('\n      async function api(')
s = s[:pos] + '''
      const panels = ['profile', 'project', 'contact'];
      let currentStep = 0;
      function goToStep(index, focus = true) {
        currentStep = index;
        panels.forEach((name, i) => {
          show(`panel-${name}`, i === index);
          $(`step-${name}`).toggleAttribute('data-complete', i < index);
          if (i === index) $(`step-${name}`).setAttribute('aria-current', 'step');
          else $(`step-${name}`).removeAttribute('aria-current');
        });
        $('step-count').textContent = `Étape ${index + 1} sur 3`;
        error('submit-error', '');
        if (focus) $(`title-${panels[index]}`).focus({ preventScroll:true });
      }
      function validateStep(index) {
        const inputs = $(`panel-${panels[index]}`).querySelectorAll('input, textarea');
        for (const input of inputs) {
          input.value = input.value.trim();
          input.setCustomValidity(input.minLength > 0 && input.value.length < input.minLength
            ? `Veuillez saisir au moins ${input.minLength} caractères.` : '');
          if (!input.reportValidity()) return false;
        }
        return true;
      }
      form.querySelectorAll('input, textarea').forEach(input => input.addEventListener('input', () => input.setCustomValidity('')));
      document.querySelectorAll('[data-profile]').forEach(button => button.addEventListener('click', () => {
        $('profile').value = button.dataset.profile;
        document.querySelectorAll('[data-profile]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
        goToStep(1);
      }));
      document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => goToStep(Number(button.dataset.back))));
      $('next-project').addEventListener('click', () => { if (validateStep(1)) goToStep(2); });
      $('need').addEventListener('input', () => { $('need-count').textContent = `${$('need').value.length}/2000`; });
''' + s[pos:]
s = s.replace("        if (busy || !form.reportValidity()) return;", """        if (busy) return;
        if (currentStep === 0) return;
        if (currentStep === 1) { if (validateStep(1)) goToStep(2); return; }
        if (!$('profile').value) { goToStep(0); return; }
        for (const index of [1, 2]) {
          const invalid = Array.from($(`panel-${panels[index]}`).querySelectorAll('input, textarea')).some(input => !input.checkValidity());
          if (invalid) { goToStep(index); validateStep(index); return; }
        }
        if (!validateStep(2)) return;""")
s = s.replace("fields.contactAccepted = $('contact-accepted').checked;", "fields.contactAccepted = true; // Explicit submission accepts the notice beside this button.")
s = s.replace("$('step-project').removeAttribute('aria-current'); $('step-analysis').setAttribute('aria-current','step');", "panels.forEach(name => $(`step-${name}`).removeAttribute('aria-current')); $('step-count').textContent = 'Votre analyse';")
s = s.replace("$('step-analysis').removeAttribute('aria-current'); $('step-project').setAttribute('aria-current','step'); $('first-name').focus();", "document.querySelectorAll('[data-profile]').forEach(button => button.setAttribute('aria-pressed', 'false')); $('need-count').textContent = '0/2000'; form.querySelectorAll('input, textarea').forEach(input => input.setCustomValidity('')); goToStep(0);")
s = s.replace("$('widget').getBoundingClientRect().height + parseFloat(getComputedStyle(document.body).paddingTop) * 2", "$('widget-frame').getBoundingClientRect().height + parseFloat(getComputedStyle(document.body).paddingTop) + parseFloat(getComputedStyle(document.body).paddingBottom)")
s = s.replace(".observe($('widget'));", ".observe($('widget-frame'));")
p.write_text(s, encoding='utf-8')
