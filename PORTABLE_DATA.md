# Personal Agent fork

This fork starts from upstream `v5.10.0`. When `PERSONAL_AGENT_ROOT` is set to an absolute project directory, the workspace store saves paths inside that directory as `/__personal_agent__/` references. Reads resolve those references against the current project directory before validation. No startup rewrite is performed. External paths and ordinary installations without this environment variable keep their existing behavior.

The implementation is in `src/channels/shared/project-paths.mjs` and the read/write boundaries in `bot-workspace-store.mjs`. The reference format matches Personal Agent's `portable-data` plugin. `test/project-paths.test.mjs` verifies real workspace persistence across a directory move and rejects escaping references.

When used as `personal-agent/plugins/dsh-im`, run `pnpm build:plugins` from the parent project after editing source, then restart DSH. The parent project's `pnpm bootstrap` initializes this submodule, installs its dependencies and builds it automatically. Its workspace lockfile pins development dependencies; no npm patch is required.
