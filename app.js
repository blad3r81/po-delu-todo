import {STORAGE_KEY, decodeTasks, createTask, pluralTasks} from './store.js';

const $ = selector => document.querySelector(selector);
const form = $('#task-form');
const input = $('#task-input');
const list = $('#task-list');
const error = $('#input-error');
const storageError = $('#storage-error');
let tasks = [];
let filter = 'all';
let undoBatch = [];
let toastTimer;
try { tasks = decodeTasks(localStorage.getItem(STORAGE_KEY)); }
catch { storageError.textContent = 'Не удалось прочитать сохранённый список. Новые задачи можно добавлять. Если сохранение недоступно, оставьте вкладку открытой.'; storageError.hidden = false; }

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    storageError.hidden = true;
  } catch {
    storageError.textContent = 'Браузер не разрешил сохранить изменения. Они останутся в этой вкладке, но могут пропасть после обновления.';
    storageError.hidden = false;
  }
}
function announce(message) { $('#announcement').textContent = message; }
function render() {
  const done = tasks.filter(t => t.done).length;
  const active = tasks.length - done;
  $('#all-count').textContent = tasks.length;
  $('#active-count').textContent = active;
  $('#done-count').textContent = done;
  $('#remaining-count').textContent = active;
  const ending = pluralTasks(active);
  $('#remaining-label').textContent = `${ending === 'задача' ? 'активная' : ending === 'задачи' ? 'активные' : 'активных'} ${ending}`;
  $('#clear-done').hidden = done === 0;
  $('#completion-note').textContent = tasks.length ? `Выполнено ${done} из ${tasks.length}` : 'Без спешки. По одному делу.';
  list.replaceChildren();
  const visible = tasks.filter(task => filter === 'all' || (filter === 'done' ? task.done : !task.done));
  for (const task of visible) {
    const row = document.createElement('li');
    row.className = `task-row${task.done ? ' is-done' : ''}`;
    const label = document.createElement('label');
    label.className = 'task-check';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Выполнено: ${task.text}`);
    const tick = document.createElement('span');
    tick.textContent = '✓';
    tick.setAttribute('aria-hidden', 'true');
    label.append(checkbox, tick);
    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-task';
    remove.setAttribute('aria-label', `Удалить: ${task.text}`);
    remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/></svg>';
    checkbox.addEventListener('change', () => {
      task.done = checkbox.checked;
      const index = [...list.children].indexOf(row);
      save(); render();
      const next = list.children[Math.min(index, list.children.length - 1)];
      (next?.querySelector('input') || $(`[data-filter="${filter}"]`)).focus({preventScroll: true});
      announce(task.done ? 'Задача выполнена' : 'Задача снова активна');
    });
    remove.addEventListener('click', () => {
      const index = tasks.findIndex(t => t.id === task.id);
      undoBatch = [{task: {...task}, index}];
      tasks.splice(index, 1);
      save(); render(); showToast('Задача удалена');
      input.focus({preventScroll: true});
    });
    row.append(label, text, remove);
    list.append(row);
  }
  $('#empty-state').hidden = visible.length > 0;
  const empty = filter === 'done' ? ['Пока нет выполненных задач', 'Готовые дела появятся здесь.'] : filter === 'active' && tasks.length ? ['Всё готово на этот момент', 'Можно добавить новое дело или отдохнуть.'] : ['Здесь начнётся ваш список', 'Добавьте первое дело в поле выше.'];
  $('#empty-title').textContent = empty[0];
  $('#empty-description').textContent = empty[1];
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const task = createTask(input.value);
  if (!task) {
    error.textContent = 'Напишите задачу, а не только пробелы.';
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'input-error');
    input.focus(); return;
  }
  tasks.unshift(task);
  input.value = '';
  setFilter('all');
  save(); render(); input.focus(); announce('Задача добавлена');
});
input.addEventListener('input', () => { error.hidden = true; input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); });
function setFilter(value) {
  filter = value;
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === value)));
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { setFilter(button.dataset.filter); render(); }));
function showToast(message) {
  clearTimeout(toastTimer);
  $('#toast-text').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(dismissToast, 8000);
}
function dismissToast() { $('#toast').hidden = true; undoBatch = []; clearTimeout(toastTimer); }
$('#dismiss-toast').addEventListener('click', dismissToast);
$('#toast').addEventListener('mouseenter', () => clearTimeout(toastTimer));
$('#toast').addEventListener('focusin', () => clearTimeout(toastTimer));
$('#undo').addEventListener('click', () => {
  undoBatch.sort((a,b) => a.index - b.index).forEach(({task, index}) => {
    if (!tasks.some(t => t.id === task.id)) tasks.splice(Math.min(index, tasks.length), 0, task);
  });
  save(); render(); dismissToast(); announce('Удаление отменено'); input.focus({preventScroll:true});
});
$('#clear-done').addEventListener('click', () => {
  undoBatch = tasks.flatMap((task, index) => task.done ? [{task: {...task}, index}] : []);
  tasks = tasks.filter(task => !task.done);
  save(); render(); showToast('Выполненные задачи удалены');
});
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  try { tasks = decodeTasks(event.newValue); render(); dismissToast(); announce('Список обновлён из другой вкладки'); } catch { /* Не заменяем открытый список повреждёнными данными. */ }
});
$('#today').textContent = new Intl.DateTimeFormat('ru', {day:'numeric', month:'long'}).format(new Date());
render();

// Один видеоролик, время которого зависит только от положения прокрутки.
const hero = $('.hero');
const video = $('#planning-video');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let targetTime = .05;
let ready = false;
let raf = 0;
let blobUrl;
function seek() {
  if (!ready || video.seeking || reduced.matches || document.hidden) return;
  if (Math.abs(video.currentTime - targetTime) > .025) video.currentTime = targetTime;
}
function updateHero() {
  raf = 0;
  const progress = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / Math.max(1, hero.offsetHeight - $('.hero-sticky').offsetHeight)));
  hero.style.setProperty('--copy-y', `${progress * -24}px`);
  hero.style.setProperty('--copy-opacity', String(1 - progress * .25));
  hero.style.setProperty('--media-y', `${progress * -16}px`);
  if (ready) { targetTime = .05 + progress * (video.duration - .15); seek(); }
}
function queueHero() { if (!raf) raf = requestAnimationFrame(updateHero); }
video.addEventListener('loadedmetadata', () => { ready = true; video.pause(); updateHero(); });
video.addEventListener('seeked', seek);
async function loadVideo() {
  if (reduced.matches || blobUrl) return;
  try {
    const response = await fetch('assets/planning-long.mp4');
    if (!response.ok) throw new Error('Video unavailable');
    blobUrl = URL.createObjectURL(await response.blob());
    video.src = blobUrl;
  } catch { /* Постер остаётся доступен, задачи работают независимо от видео. */ }
}
addEventListener('scroll', queueHero, {passive:true});
addEventListener('resize', queueHero);
reduced.addEventListener('change', () => { if (reduced.matches) video.pause(); else loadVideo(); });
loadVideo(); updateHero();
