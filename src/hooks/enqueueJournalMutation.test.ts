import { describe, expect, it } from 'vitest';
import { createJournalMutationQueue } from './enqueueJournalMutation';

describe('createJournalMutationQueue', () => {
  it('runs mutations sequentially', async () => {
    const order: number[] = [];
    const enqueue = createJournalMutationQueue();

    const first = enqueue(async () => {
      order.push(1);
      await new Promise((r) => setTimeout(r, 20));
      order.push(2);
    });
    const second = enqueue(async () => {
      order.push(3);
    });

    await Promise.all([first, second]);
    expect(order).toEqual([1, 2, 3]);
  });

  it('continues queue after a failed mutation', async () => {
    const enqueue = createJournalMutationQueue();
    const log: string[] = [];

    await enqueue(async () => {
      log.push('fail');
      throw new Error('nope');
    }).catch(() => {});

    await enqueue(async () => {
      log.push('ok');
    });

    expect(log).toEqual(['fail', 'ok']);
  });
});
