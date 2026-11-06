import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { BotWorkspaceStore } from '../src/channels/shared/bot-workspace-store.mjs';
import { decodeProjectPaths, encodeProjectPaths } from '../src/channels/shared/project-paths.mjs';

function restoreRoot(value) {
  if (value === undefined) delete process.env.PERSONAL_AGENT_ROOT;
  else process.env.PERSONAL_AGENT_ROOT = value;
}

test('workspace store reads a moved project without rewriting its configuration', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'dsh-im-portable-'));
  const before = join(temporary, 'before'), after = join(temporary, 'after');
  const original = process.env.PERSONAL_AGENT_ROOT;
  try {
    process.env.PERSONAL_AGENT_ROOT = before;
    const workspace = join(before, 'data', '工作区');
    await mkdir(workspace, { recursive: true });
    const file = join(before, 'workspaces.json');
    const store = await new BotWorkspaceStore(file, { defaultWorkspace: workspace }).load();
    await store.ensure('bot');
    await store.setConversationWorkspace('bot', 'chat-one', workspace);
    await store.setAlias('bot', '测试机器人');
    const bytes = await readFile(file);
    const saved = JSON.parse(bytes);
    assert.equal(saved.workspaces.bot, '/__personal_agent__/data/%E5%B7%A5%E4%BD%9C%E5%8C%BA');
    assert.equal(saved.conversationWorkspaces.bot['chat-one'], saved.workspaces.bot);
    await rename(before, after);
    process.env.PERSONAL_AGENT_ROOT = after;
    const reloaded = await new BotWorkspaceStore(join(after, 'workspaces.json')).load();
    assert.equal(reloaded.workspaceFor('bot'), join(after, 'data', '工作区'));
    assert.equal(reloaded.conversationWorkspaceFor('bot', 'chat-one'), join(after, 'data', '工作区'));
    assert.deepEqual(await readFile(join(after, 'workspaces.json')), bytes);
  } finally { restoreRoot(original); }
});

test('ordinary installs and external paths keep their original values', () => {
  const original = process.env.PERSONAL_AGENT_ROOT;
  try {
    delete process.env.PERSONAL_AGENT_ROOT;
    const value = { path: resolve('outside'), text: 'message', permissions: ['admin'] };
    assert.equal(encodeProjectPaths(value), value);
    assert.equal(decodeProjectPaths(value), value);
    process.env.PERSONAL_AGENT_ROOT = resolve('project');
    assert.deepEqual(encodeProjectPaths(value), value);
    assert.throws(() => decodeProjectPaths('/__personal_agent__/../escape'));
    assert.throws(() => decodeProjectPaths('/__personal_agent__/%2Fescape'));
    assert.throws(() => decodeProjectPaths('/__personal_agent__/%5Cescape'));
  } finally { restoreRoot(original); }
});
