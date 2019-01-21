# TSLint import group ordering rule

[![npm](https://img.shields.io/npm/dw/tslint-import-group-ordering.svg)](https://www.npmjs.com/package/tslint-import-group-ordering)
[![GitHub stars](https://img.shields.io/github/stars/Gelio/tslint-import-group-ordering.svg)](https://github.com/Gelio/tslint-import-group-ordering/stargazers)
[![GitHub license](https://img.shields.io/github/license/Gelio/tslint-import-group-ordering.svg)](https://github.com/Gelio/tslint-import-group-ordering)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/Gelio/tslint-import-group-ordering/.svg?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2FGelio%2Ftslint-import-group-ordering%2F)

This rule enforces import groups ordering.

It allows specifying which regular expressions that imports in consecutive import groups should
follow.

This rule assumes that external libraries come in the first import group.

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
        "groups-order": ["^(fabric|common)", "^products"]
      }
    }
  }
}
```

The above configuration would enforce the following import group order:

- external libraries
- anything that starts with `fabric` or `common`
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
