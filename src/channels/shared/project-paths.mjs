import { isAbsolute, relative, resolve, sep } from 'node:path';

// Reserved on-disk references shared with personal-agent's storage provider.
// Decode before path validation or I/O; ordinary installations are unchanged.
const prefix = '/__personal_agent__/';

function transformProjectPaths(value, decode) {
  const root = process.env.PERSONAL_AGENT_ROOT;
  if (!root) return value;
  if (!isAbsolute(root)) throw new TypeError('PERSONAL_AGENT_ROOT must be an absolute path.');
  const base = resolve(root);
  const inside = path => {
    const suffix = relative(base, path);
    return suffix !== '..' && !suffix.startsWith(`..${sep}`) && !isAbsolute(suffix);
  };
  const convert = item => {
    if (typeof item === 'string') {
      if (decode) {
        if (!item.startsWith(prefix)) return item;
        const pieces = item.slice(prefix.length).split('/').map(decodeURIComponent);
        if (pieces.some(part => part === '..' || /[\\/]/.test(part))) throw new TypeError('Invalid portable path.');
        const path = resolve(base, ...pieces);
        if (!inside(path)) throw new TypeError('Portable path escapes the project.');
        return path;
      }
      if (!isAbsolute(item) || !inside(item)) return item;
      return prefix + relative(base, item).split(sep).map(encodeURIComponent).join('/');
    }
    if (Array.isArray(item)) return item.map(convert);
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([key, child]) => [key, convert(child)]));
    return item;
  };
  return convert(value);
}

export const encodeProjectPaths = value => transformProjectPaths(value, false);
export const decodeProjectPaths = value => transformProjectPaths(value, true);
