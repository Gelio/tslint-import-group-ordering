# TSLint import group ordering rule

> **This package is no longer maintained.** [TSLint is deprecated](https://github.com/palantir/tslint/issues/4534),
> and v2.2.0 is the final release of `tslint-import-group-ordering`. Use
> [`perfectionist/sort-imports`](https://perfectionist.dev/rules/sort-imports) with
> [typescript-eslint](https://typescript-eslint.io) instead. See
> [Migrating to ESLint](https://github.com/Gelio/tslint-import-group-ordering#migrating-to-eslint).

[![npm](https://img.shields.io/npm/dw/tslint-import-group-ordering.svg)](https://www.npmjs.com/package/tslint-import-group-ordering)
[![GitHub stars](https://img.shields.io/github/stars/Gelio/tslint-import-group-ordering.svg)](https://github.com/Gelio/tslint-import-group-ordering/stargazers)
[![GitHub license](https://img.shields.io/github/license/Gelio/tslint-import-group-ordering.svg)](https://github.com/Gelio/tslint-import-group-ordering)
[![CI](https://github.com/Gelio/tslint-import-group-ordering/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/Gelio/tslint-import-group-ordering/actions/workflows/ci.yml)

![Demo](https://i.imgur.com/DBMMoA6.gif)

- enforces imports groups ordering
- highly configurable

  Use regular expressions to configure which import statements go into which import group.

- support for determining `package.json` dependencies (or reading all the dependencies from
  `node_modules`)

- has an auto-fixer

  - preserves comments
  - preserves non-import statements that appear in-between import statements

    Even though it is allowed in the ECMAScript Modules specification, the rule discourages mixing
    regular statements with import declarations.

## Migrating to ESLint

The [`sort-imports`](https://perfectionist.dev/rules/sort-imports) rule from
[`eslint-plugin-perfectionist`](https://www.npmjs.com/package/eslint-plugin-perfectionist) works
the same way as this rule: imports go into ordered, named groups, each group is picked by a regular
expression on the import path, and the first matching rule wins. With `type: 'unsorted'` it doesn't
sort imports inside a group, so it only moves the imports that this rule would move. Its autofix
keeps comments attached to their imports, and its messages name the groups of both imports.

1. Check that your TypeScript version is supported by typescript-eslint. It supports a narrower
   range than this package (see its
   [dependency versions](https://typescript-eslint.io/users/dependency-versions)), so you may need
   to change TypeScript versions first.

2. Create an ESLint config in one of two ways:

   - To convert the rest of your `tslint.json` too, run
     [`tslint-to-eslint-config`](https://github.com/typescript-eslint/tslint-to-eslint-config). The
     `--comments` option also converts `tslint:disable` comments (adjust the glob to your sources):

     ```sh
     npx tslint-to-eslint-config --comments 'src/**/*.{ts,tsx}'
     ```

     It writes a legacy `.eslintrc.js` file, which ESLint 10 no longer reads. Convert it to a flat
     config with [`@eslint/migrate-config`](https://www.npmjs.com/package/@eslint/migrate-config),
     then delete `.eslintrc.js`:

     ```sh
     npx @eslint/migrate-config .eslintrc.js
     ```

     `tslint-to-eslint-config` has no ESLint equivalent for `import-group-ordering`, so it keeps the
     rule running through TSLint inside a `@typescript-eslint/tslint/config` rule, together with
     any other TSLint rules it couldn't map. Remove `import-group-ordering` from that rule's
     `rules` in the new `eslint.config.js`: the next steps replace it. If nothing else is left
     there, delete the `@typescript-eslint/tslint/config` rule and the `@typescript-eslint/tslint`
     plugin too; otherwise replace the remaining rules first, because the bridge stops working once
     TSLint is removed. Then install the packages that both tools list, skipping
     `@typescript-eslint/eslint-plugin-tslint` if you deleted the bridge.

     The converted comments lose the rule names it can't map, so a
     `tslint:disable-next-line:import-group-ordering` comment becomes a bare
     `eslint-disable-next-line` that disables every rule on that line. Add
     `perfectionist/sort-imports` to those comments.

   - Otherwise, follow the
     [typescript-eslint Getting Started guide](https://typescript-eslint.io/getting-started).

3. Install the plugin:

   ```sh
   npm install eslint-plugin-perfectionist --save-dev
   ```

4. Add the rule to the config file from step 2. ESLint loads only one config file, so don't create
   a second one. The configuration from the
   [Usage](https://github.com/Gelio/tslint-import-group-ordering#usage) section below translates
   to this complete config:

   ```js
   // eslint.config.mjs
   import fs from 'node:fs';
   import js from '@eslint/js';
   import { defineConfig } from 'eslint/config';
   import perfectionist from 'eslint-plugin-perfectionist';
   import tseslint from 'typescript-eslint';

   // "from-package.json": true -> build the "dependencies" pattern from package.json.
   // Built-in modules such as `fs` are not in package.json, which also covers
   // "disable-native-nodejs-modules": true.
   const pkg = JSON.parse(
     fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
   );
   const packageNames = [
     ...Object.keys(pkg.dependencies ?? {}),
     ...Object.keys(pkg.devDependencies ?? {}),
   ].map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

   export default defineConfig(
     {
       files: ['**/*.{js,jsx,ts,tsx}'],
       extends: [js.configs.recommended, tseslint.configs.recommended],
     },
     {
       files: ['**/*.{js,jsx,ts,tsx}'],
       plugins: { perfectionist },
       rules: {
         'perfectionist/sort-imports': [
           'warn',
           {
             type: 'unsorted', // keep the existing order inside each group
             newlinesBetween: 1, // one blank line between groups
             newlinesInside: 'ignore', // allow blank lines inside a group
             sortSideEffects: true, // group side-effect imports by path too
             // "imports-groups"
             groups: ['dependencies', 'common', 'product', 'other'],
             // "matching-rules": tried top to bottom, first match wins
             customGroups: [
               { groupName: 'common', elementNamePattern: '^(common)' },
               { groupName: 'product', elementNamePattern: '^(product)' },
               {
                 groupName: 'dependencies',
                 elementNamePattern: `^(${packageNames.join('|')})(/|$)`,
               },
               { groupName: 'other', elementNamePattern: '.*' },
             ],
           },
         ],
       },
     },
   );
   ```

   If your config file uses `require` (`@eslint/migrate-config` writes one for a CommonJS
   package), load the plugin with `const perfectionist = require('eslint-plugin-perfectionist');`
   and package.json with `const pkg = require('./package.json');`, copy the `packageNames`
   declaration, and add the second object above to the array the file exports. Keep its `files`
   line: ESLint only lints `.ts` and `.tsx` files that a config object's `files` matches.

5. Run `npx eslint src` to see the violations, and `npx eslint --fix src` to fix them.

6. Remove `tslint-import-group-ordering`, TSLint and your `tslint.json` once ESLint covers your
   code.

### Options

| `import-group-ordering` | `perfectionist/sort-imports` |
| --- | --- |
| `"severity": "warning"` | `'warn'` |
| `imports-groups` | `groups`, in the same order. Leave out groups that no matching rule targets: perfectionist rejects them. |
| `matching-rules`, first match wins | `customGroups`, tried in order, first match wins |
| `imports-group` | `groupName`. Several custom groups may share one `groupName`. |
| `"type": "project"` with `matches` | `{ groupName, elementNamePattern: '<the same regular expression>' }` |
| `"type": "dependencies"` | `{ groupName, anyOf: [{ selector: 'external' }, { selector: 'builtin' }] }`. Perfectionist doesn't read `node_modules`. It treats every bare import path that doesn't resolve to a project file as `external`, including packages that aren't installed and aliases from `paths` in `tsconfig.json` (such as `@utils/x`). Keep your `project` rules before this one, as this rule's configs already do, or set the plugin's `tsconfig` option to classify aliases as `tsconfig-path`. |
| `"from-package.json": true` | No option. Build `elementNamePattern` from `package.json`, as in the example above. This rule matched package names as prefixes (`react` also matched `react-dom`); the example's pattern matches a package name and its subpaths only. |
| `"disable-native-nodejs-modules": true` | Leave out `{ selector: 'builtin' }`. Perfectionist also tags built-in modules as `external`, so exclude them from that selector too: `{ selector: 'external', elementNamePattern: '^(?!(?:node:)?(?:fs\|path\|...)(?:/\|$))' }`, listing the names from `builtinModules` of `node:module`. With a pattern built from `package.json`, built-in modules are already left out. |
| `node:` imports (`node:fs`) | Perfectionist classifies them as `builtin`, like `fs`, so the mappings above group them the way this rule's v2.2.0 does. |
| A blank line between groups | `newlinesBetween: 1`. It means exactly one: two or more blank lines between groups, which this rule accepted, are reported. |
| Blank lines inside a group | `newlinesInside: 'ignore'` accepts them, as this rule did. This rule's autofix removed them from the groups it rewrote; `newlinesInside: 0` does that too, but also reports blank lines inside groups that this rule accepted. |
| Imports keep their order inside a group | `type: 'unsorted'` |
| An import that matches no rule is reported | No equivalent. Perfectionist puts it in the `unknown` group, placed last, and fixes it there. Keep a catch-all `.*` rule last. |
| Non-import statements between imports are reported and moved below the imports | Not reported. Add the [`import-x/first`](https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/first.md) rule from `eslint-plugin-import-x`, whose autofix moves them. |
| Side-effect imports (`import './polyfills'`) are grouped by path | By default perfectionist doesn't move them (`sortSideEffects: false`). Set `sortSideEffects: true`, as the example above does, to group them by path, and add `{ groupName: 'side-effects', selector: 'side-effect' }` to give them a group of their own. |
| `// tslint:disable-next-line:import-group-ordering` | `// eslint-disable-next-line perfectionist/sort-imports`. The import keeps its position. |

### Compatibility

The final release supports TSLint 5.1 and later (including 6), and TypeScript 2.4 through 6.x.
TypeScript 7 is not supported: TSLint itself crashes on it.

## Usage

Install this library as a `devDependency`:

```bash
npm install tslint-import-group-ordering --save-dev
```

Modify `tslint.json` (add `extends` and the rule configuration to `rules`):

```json
{
  "extends": ["tslint-import-group-ordering"],
  "rules": {
    "import-group-ordering": {
      "severity": "warning",
      "options": {
        "imports-groups": [
          {
            "name": "dependencies"
          },
          {
            "name": "common"
          },
          {
            "name": "product"
          },
          {
            "name": "other"
          }
        ],
        "matching-rules": [
          {
            "type": "project",
            "matches": "^(common)",
            "imports-group": "common"
          },
          {
            "type": "project",
            "matches": "^(product)",
            "imports-group": "product"
          },
          {
            "type": "dependencies",
            "imports-group": "dependencies",
            "disable-native-nodejs-modules": true,
            "from-package.json": true
          },
          {
            "type": "project",
            "matches": ".*",
            "imports-group": "other"
          }
        ]
      }
    }
  }
}
```

The above configuration would enforce the following import group order:

- dependencies from `node_modules` (but not NodeJS native modules - this is configured by setting
  `disable-native-nodejs-modules`)
- anything that starts with `common`
- anything that starts with `product`
- other imports

For example, the following order of imports would be incorrect:

```typescript
import React, { Component } from 'react';

import { ITableHeaderProps, ITableHeaderState } from './interfaces';
import ActionGroup from 'common/components/action-button-group';
import { FilterBar, FilterDock } from 'common/components/filters';
import { SearchInput } from 'common/components/inputs';
```

because `./interfaces` is imported too early.

## Testing

The project uses 3 types of tests. To run the automated tests, run

```sh
npm run test
```

This will build the project and run the tests. Alternatively, to only run the tests without building
the project run

```sh
npm run test:only
```

### Automated lint tests

These use the TSLint command to test whether the actual errors match the expected ones.

First, build the rule using `npm run build` and then run:

```sh
npm run test:only:lint
```

to run the lint tests.

See [TSLint's docs](https://palantir.github.io/tslint/develop/testing-rules/) for more information.

### Automated autofix tests

These apply the TSLint's autofix and compare the results with the expected ones.

First, build the rule using `npm run build` and then run:

```sh
npm run test:only:automated-fix
```

to run the autofix tests.

### Manual tests

Open the `test/manual` directory to perform manual tests, e.g. use your IDE or the `tslint` CLI
directly.

## Author

The author of this rule is Grzegorz Rozdzialik.
