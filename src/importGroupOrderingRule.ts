import { SourceFile } from 'typescript';
import * as Lint from 'tslint';

import { ImportGroupsOrderingWalker } from './import-groups-ordering-walker';
import { NodesContainer } from './nodes-containers';
import { parseRuleConfig } from './options/parse-rule-config';

// TODO: fix description and examples
export class Rule extends Lint.Rules.AbstractRule {
  public static metadata: Lint.IRuleMetadata = {
    ruleName: 'import-group-ordering',
    description: 'Ensures a specific ordering of import groups.',
    optionsDescription: Lint.Utils.dedent`
      TODO: fill it
    `,
    hasFix: true,
    options: {
      type: 'object',
      properties: {
        'imports-groups': {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string'
              }
            }
          }
        },
        'matching-rules': {
          type: 'array',
          items: {
            type: 'object',
            oneOf: [
              {
                properties: {
                  type: {
                    const: 'dependencies'
                  },
                  'imports-group': {
                    type: 'string'
                  }
                },
                additionalProperties: false
              },
              {
                properties: {
                  type: {
                    const: 'project'
                  },
                  'imports-group': {
                    type: 'string'
                  },
                  matches: {
                    type: 'string'
                  }
                },
                additionalProperties: false
              }
            ]
          }
        }
      },
      required: ['imports-groups', 'matching-rules'],
      additionalProperties: false
    },
    optionExamples: [
      // TODO:
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

  public apply(sourceFile: SourceFile): Lint.RuleFailure[] {
    const { importsGroups, matchingRules } = parseRuleConfig(
      sourceFile,
      this.ruleArguments[0]
    );

    return this.applyWithWalker(
      new ImportGroupsOrderingWalker(sourceFile, this.ruleName, {
        importsGroups,
        matchingRules,
        misplacedNonImportStatementsContainer: new NodesContainer(sourceFile)
      })
    );
  }
}
