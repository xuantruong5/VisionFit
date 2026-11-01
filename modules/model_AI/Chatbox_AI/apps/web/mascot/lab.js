import { MASCOT_STATES, MASCOT_SPECIES, EVOLUTION_STAGES } from '/contracts/assistant.js';
const $ = id => document.getElementById(id);
for (const [id, values] of [['species', MASCOT_SPECIES], ['stage', EVOLUTION_STAGES]]) {
  for (const value of values) { const option = document.createElement('option'); option.value = option.textContent = value; $(id).append(option); }
}
let current = 'idle';
function render() {
  $('preview').textContent = $('species').value === 'bear' ? '🐻' : '🐱';
  $('preview').dataset.state = current;
  $('status').textContent = `${$('species').value} · ${$('stage').value} · ${current} (minh họa, chưa có bộ hình tiến hóa)`;
  for (const button of $('states').children) button.setAttribute('aria-pressed', String(button.textContent === current));
}
for (const state of MASCOT_STATES) { const button = document.createElement('button'); button.textContent = state; button.onclick = () => { current = state; render(); }; $('states').append(button); }
$('species').onchange = $('stage').onchange = render;
render();
