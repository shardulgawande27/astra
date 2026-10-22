import { defineVisualizer, TraceBuilder } from '../builder';
import type { StackState } from '../types';

const code = `function runOps(ops) {
  const stack = [];
  const output = [];
  for (const op of ops) {
    if (op.type === 'push') {
      stack.push(op.value);
    } else if (op.type === 'pop') {
      output.push(stack.length ? stack.pop() : null);
    } else if (op.type === 'peek') {
      output.push(stack.length ? stack[stack.length - 1] : null);
    }
  }
  return output;
}`;

type Op = { type: 'push'; value: string } | { type: 'pop' } | { type: 'peek' };

const MAX_OPS = 30;

function describe(op: Op): string {
  return op.type === 'push' ? `push ${op.value}` : op.type;
}

export const stackOperations = defineVisualizer<{ ops: Op[] }>({
  id: 'stack-operations',
  name: 'Stack — Push / Pop / Peek',
  pattern: 'Stack',
  summary: 'Apply a sequence of push, pop and peek operations and record what pop/peek return.',
  code,
  timeComplexity: 'O(1) per operation',
  spaceComplexity: 'O(n)',
  keywords: ['stack', 'push', 'pop', 'peek', 'lifo'],
  fields: [
    {
      key: 'ops',
      label: 'operations',
      kind: 'string',
      placeholder: 'push 1, push 2, peek, pop, push 3, pop, pop, pop',
      help: 'Comma-separated: push <value>, pop, peek',
    },
  ],
  defaultInput: { ops: 'push 1, push 2, peek, pop, push 3, pop, pop, pop' },

  parse(raw) {
    const parts = (raw.ops ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return { ok: false, errors: ['Enter at least one operation.'] };
    if (parts.length > MAX_OPS) return { ok: false, errors: [`At most ${MAX_OPS} operations are supported.`] };
    const ops: Op[] = [];
    const errors: string[] = [];
    for (const part of parts) {
      const [name, ...rest] = part.split(/\s+/);
      const cmd = name.toLowerCase();
      if (cmd === 'push') {
        const value = rest.join(' ');
        if (!value) errors.push(`"${part}": push needs a value, e.g. "push 5".`);
        else if (value.length > 8) errors.push(`"${part}": pushed values can be at most 8 characters.`);
        else ops.push({ type: 'push', value });
      } else if ((cmd === 'pop' || cmd === 'peek') && rest.length === 0) {
        ops.push({ type: cmd });
      } else {
        errors.push(`"${part}" is not a valid operation. Use push <value>, pop or peek.`);
      }
    }
    if (errors.length) return { ok: false, errors };
    return { ok: true, value: { ops } };
  },

  generate({ ops }) {
    const t = new TraceBuilder();
    const stack: string[] = [];
    const output: string[] = [];
    const stackState = (op: StackState['op'] = null): StackState => ({ label: 'stack', items: [...stack], op });
    const top = () => (stack.length ? stack[stack.length - 1] : 'null');

    t.push({
      line: 1,
      title: 'Start',
      explanation: `Run ${ops.length} operation(s): ${ops.map(describe).join(', ')}.`,
      vars: { 'ops.length': ops.length },
    });
    t.push({
      line: 2,
      title: 'Create stack',
      explanation: 'Start with an empty stack (last in, first out).',
      vars: { 'stack.length': 0 },
      stack: stackState(),
    });
    t.push({
      line: 3,
      title: 'Create output',
      explanation: 'output collects the values returned by pop and peek.',
      vars: { 'stack.length': 0 },
      stack: stackState(),
      output: [],
    });

    ops.forEach((op, idx) => {
      const base = { op: describe(op), step: idx + 1 };
      t.push({
        line: 4,
        title: `Operation ${idx + 1}: ${describe(op)}`,
        explanation: `Next operation is "${describe(op)}".`,
        vars: { ...base, 'stack.length': stack.length, top: top() },
        stack: stackState(),
        output: [...output],
      });

      if (op.type === 'push') {
        stack.push(op.value);
        t.push({
          line: 6,
          title: `push ${op.value}`,
          explanation: `${op.value} is placed on top of the stack.`,
          vars: { ...base, 'stack.length': stack.length, top: top() },
          stack: stackState({ kind: 'push', value: op.value }),
          output: [...output],
        });
      } else if (op.type === 'pop') {
        const value = stack.length ? stack.pop()! : 'null';
        output.push(value);
        t.push({
          line: 8,
          title: `pop → ${value}`,
          explanation: value === 'null' ? 'The stack is empty, so pop records null.' : `Remove the top element ${value} and record it in output.`,
          vars: { ...base, 'stack.length': stack.length, top: top(), returned: value },
          stack: stackState({ kind: 'pop', value }),
          output: [...output],
        });
      } else {
        const value = top();
        output.push(value);
        t.push({
          line: 10,
          title: `peek → ${value}`,
          explanation: value === 'null' ? 'The stack is empty, so peek records null.' : `Read the top element ${value} without removing it.`,
          vars: { ...base, 'stack.length': stack.length, top: top(), returned: value },
          stack: stackState({ kind: 'peek', value }),
          output: [...output],
        });
      }
    });

    t.push({
      line: 13,
      title: 'Return output',
      explanation: `All operations done. output = [${output.join(', ')}].`,
      vars: { 'stack.length': stack.length, top: top() },
      stack: stackState(),
      output: [...output],
      result: { value: `[${output.join(', ')}]`, success: true },
    });
    return t.steps;
  },
});
