# TSLint import group ordering rule

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
