import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeTasks, createTask, pluralTasks} from '../store.js';
test('task input rejects blank text and trims whitespace', () => {
  assert.equal(createTask('   '), null);
  assert.equal(createTask('x'.repeat(181)), null);
  const task = createTask('  Купить продукты  ');
  assert.equal(task.text, 'Купить продукты');
  assert.equal(task.done, false);
  assert.ok(task.id);
});
test('stored tasks survive a serialization round trip', () => {
  const tasks = [createTask('Первая'), {...createTask('Вторая'), done:true}];
  assert.deepEqual(decodeTasks(JSON.stringify(tasks)), tasks);
  assert.deepEqual(decodeTasks(null), []);
});
test('bad storage cannot become executable markup or invalid tasks', () => {
  const task = {id:'a',text:'<img src=x onerror=alert(1)>',done:false};
  assert.deepEqual(decodeTasks(JSON.stringify([task, task, null, {id:'b',text:42,done:false}])), [task]);
  assert.throws(() => decodeTasks('{broken'));
  assert.throws(() => decodeTasks('{}'));
});
test('Russian task endings', () => {
  assert.deepEqual([0,1,2,5,11,21,24].map(pluralTasks), ['задач','задача','задачи','задач','задач','задача','задачи']);
});
