# Changelog

## v2.2.0 (10/28/2026)

- Final release. `tslint-import-group-ordering` is no longer maintained because TSLint is
  deprecated.

  Migrate to `perfectionist/sort-imports` with typescript-eslint. The README's
  [Migrating to ESLint](https://github.com/Gelio/tslint-import-group-ordering#migrating-to-eslint)
  section describes how, and maps every option.

- Treat `node:` imports (such as `node:fs` and `node:test`) as NodeJS native modules in
  `dependencies` matching rules. `disable-native-nodejs-modules` excludes them too.

  This can report new errors: `node:` imports used to fall through to a later matching rule, and
  are now matched by the `dependencies` rule. To keep the old grouping, add a rule before the
  `dependencies` rule:

  ```json
  { "type": "project", "matches": "^node:", "imports-group": "<the group they were in>" }
  ```

- Change the `peerDependencies` to `tslint` `^5.1.0 || ^6.0.0` and `typescript` `>=2.4.0 <7.0.0-0`

  TSLint 6 is now accepted. Installing v2.1.2 next to TSLint 6 failed with an `ERESOLVE` error on
  npm 7 and later. TypeScript 2.1 through 2.3 never worked with this rule
  (`ts.isImportDeclaration is not a function`). TypeScript 7 is not supported, because TSLint
  itself crashes on it.

- Maintenance

  - Move CI from Azure Pipelines to GitHub Actions
  - Test TypeScript 2.4, 3.9, 4.9, 5 and 6 with TSLint 5 and 6 in CI, plus TSLint 5.1.0 with
    TypeScript 2.4
  - Smoke-test the packed tarball in CI
  - Upgrade TypeScript to 5.x for building the rule, TSLint to 6.1.3 and Prettier to 3
  - Publish from a `files` allowlist instead of `.npmignore`, and build in `prepack` instead of
    `prepublishOnly`. The package no longer ships 5 stale compiled files left over from deleted
    sources, which nothing required.
  - Fix typos in the README and in the rule's options description

## v2.1.2 (6/5/2019)

- Update package dependencies to latest versions

## v2.1.1 (1/27/2019)

- Fix parsing `package.json` that does not have either `devDependencies` or `dependencies` at all.

## v2.1.0 (1/27/2019)

- Allow disabling treating native NodeJS modules as dependencies.

  Set `disable-native-nodejs-modules` on a given matching rule to activate.

- Fix handling leading import declaration comments. They will no longer be duplicated when using the
  auto-fix.

- Performance improvements.

  Node positions will no longer be recalculated upon encountering new nodes.

- Support for reading dependencies and devDependencies from `package.json` instead of reading the
  contents of `node_modules`. This is configured by setting `from-package.json` on a specific
  matching-rule.

## v2.0.0 (1/26/2019)

### Breaking changes

- Rule configuration has been changed. Imports groups and matching rules are now configured
  separately.

### Features

- The rule is much more configurable. It supports multiple matching rules for a given imports group.
  Dependencies do not have to appear in the first import group.

- Improved error messages. Error messages now contain the expected imports group name.

- Detect non-import statements between imports. Such statements will be moved to after all the
  imports.

- Preserve comments.

### Technical

- Added automated tests for linting and the auto-fix.
- Configured CI to automatically run tests.

## v1.1.1 (8/28/2018)

- add auto-fix

  The auto-fix may remove comments near the import declarations and non-import statements that
  appear between import groups.

  These issues will be resolved in future releases.
