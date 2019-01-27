# Changelog

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
