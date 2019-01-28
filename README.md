# TSLint import group ordering rule

[![npm](https://img.shields.io/npm/dw/tslint-import-group-ordering.svg)](https://www.npmjs.com/package/tslint-import-group-ordering)
[![GitHub stars](https://img.shields.io/github/stars/Gelio/tslint-import-group-ordering.svg)](https://github.com/Gelio/tslint-import-group-ordering/stargazers)
[![GitHub license](https://img.shields.io/github/license/Gelio/tslint-import-group-ordering.svg)](https://github.com/Gelio/tslint-import-group-ordering)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/Gelio/tslint-import-group-ordering/.svg?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2FGelio%2Ftslint-import-group-ordering%2F)
[![Build Status](https://dev.azure.com/vorenygelio/vorenygelio/_apis/build/status/Gelio.tslint-import-group-ordering?branchName=master)](https://dev.azure.com/vorenygelio/vorenygelio/_build/latest?definitionId=1?branchName=master)

![Demo](https://imgur.com/download/DBMMoA6)

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
- anything that starts wtih `products`
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

There apply the TSLint's autofix and compare the results with the expected ones.

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
