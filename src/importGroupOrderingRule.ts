import * as ts from 'typescript';
import * as Lint from 'tslint';

import { ImportGroupsOrderingWalker } from './import-groups-ordering-walker';
import { parseOptions } from './options/parse-options';
import { createGuardedNodesContainers } from './options/create-guarded-nodes-containers';
import { NodesContainer } from './nodes-containers';

// TODO: fix description and examples
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

      Possible values for \`resolution-order\` are:
      * \`'dependencies-first'\` - a module specifier will first be checked if it is a third party
          dependency and belongs to the first group. **This is the default behavior**
      * \`'project-first\` - the module specifier will be checked if it is a third party dependency
          only if it does not match any project module.
    `,
    hasFix: true,
    options: {
      type: 'object',
      properties: {
        'imports-groups': {
          type: 'array',
          items: {
            type: 'object',
            oneOf: [
              {
                properties: {
                  type: {
                    const: 'third-party'
                  }
                },
                additionalProperties: false
              },
              {
                properties: {
                  type: {
                    const: 'project'
                  },
                  regExp: {
                    type: 'string'
                  }
                },
                additionalProperties: false
              }
            ]
          }
        }
      },
      required: ['imports-groups'],
      additionalProperties: false
    },
    optionExamples: [
      [
        true,
        {
          'groups-order': ['/^(fabric|common)/', '/^products/']
        }
      ],
      [
        true,
        {
          'groups-order': ['/^utils/', '/^products/'],
          'resolution-order': 'project-first'
        }
      ]
    ],
    type: 'style',
    typescriptOnly: false
  };

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    const options = parseOptions(this.ruleArguments);
    const guardedNodesContainers = createGuardedNodesContainers(
      options,
      sourceFile
    );

    return this.applyWithWalker(
      new ImportGroupsOrderingWalker(sourceFile, this.ruleName, {
        ...options,
        guardedNodesContainers,
        misplacedNonImportStatementsContainer: new NodesContainer(sourceFile)
      })
    );
  }
}
