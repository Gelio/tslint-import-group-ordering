import * as ts from 'typescript';
import * as Lint from 'tslint';

import { ImportGroupsOrderingWalker } from './import-groups-ordering-walker';
import { parseOptions } from './options/parse-options';

export class Rule extends Lint.Rules.AbstractRule {
  public static metadata: Lint.IRuleMetadata = {
    ruleName: 'import-group-ordering',
    description:
      'Requires specific ordering of import groups. Requires third party import to be in the first group.',
    optionsDescription: Lint.Utils.dedent`
      The "groups-order" options should contain strings with regular expressions that describe module
      specifiers (paths) allowed in consecutive import groups.

      Imports from libraries (from "node_modules") will always be in the first group.

      The last group will contain the rest of the import statements.
    `,
    hasFix: false,
    options: {
      type: 'object',
      properties: {
        'groups-order': {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      },
      required: ['group-order'],
      additionalProperties: false
    },
    optionExamples: [
      [
        true,
        {
          'groups-order': ['/^(fabric|common)/', '/^products/']
        }
      ]
    ],
    type: 'style',
    typescriptOnly: false
  };

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(
      new ImportGroupsOrderingWalker(
        sourceFile,
        this.ruleName,
        parseOptions(this.ruleArguments)
      )
    );
  }
}
