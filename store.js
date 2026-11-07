export const STORAGE_KEY = 'po-delu.tasks.v1';
export function decodeTasks(raw) {
  if (raw === null) return [];
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('Invalid task list');
  const ids = new Set();
  return data.filter(task => {
    if (!task || typeof task.id !== 'string' || typeof task.text !== 'string' || !task.text.trim() || typeof task.done !== 'boolean' || ids.has(task.id)) return false;
    ids.add(task.id);
    return true;
  }).map(({id, text, done}) => ({id, text: text.trim().slice(0, 180), done}));
}
export function createTask(text) {
  const clean = text.trim();
  if (!clean || clean.length > 180) return null;
  return {id: crypto.randomUUID(), text: clean, done: false};
}
export function pluralTasks(n) {
  if (n % 100 >= 11 && n % 100 <= 14) return 'задач';
  return n % 10 === 1 ? 'задача' : n % 10 >= 2 && n % 10 <= 4 ? 'задачи' : 'задач';
}
