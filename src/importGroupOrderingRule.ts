import { SourceFile } from 'typescript';
import * as Lint from 'tslint';

import { ImportGroupsOrderingWalker } from './import-groups-ordering-walker';
import { NodesContainer } from './nodes-containers';
import { parseRuleConfig } from './options/parse-rule-config';

export class Rule extends Lint.Rules.AbstractRule {
  public static metadata: Lint.IRuleMetadata = {
    ruleName: 'import-group-ordering',
    description: 'Ensures a specific ordering of import groups.',
    optionsDescription: Lint.Utils.dedent`
      The imports groups are configured via the "imports-groups" property. It is an array
      that specifies the names of consecutive imports groups.

      Then, use the "matching-rules" property to configure which import declarations belong
      to which imports groups.

      A matching rule can be either a rule that matches the projects dependencies (installed
      node modules and NodeJS native modules) or specific project files, configured
      with a regular expression (regexp).

      Each import statement is tested against consecutive matching rules. It it matches
      a specific matching rule, that import statement belongs to an imports group defined
      in the matching rule.
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
                  },
                  'disable-native-nodejs-modules': {
                    type: 'boolean'
                  },
                  'from-package.json': {
                    type: 'boolean'
                  }
                },
                additionalProperties: false,
                required: ['type', 'imports-group']
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
                additionalProperties: false,
                required: ['type', 'imports-group', 'matches']
              }
            ]
          }
        }
      },
      required: ['imports-groups', 'matching-rules'],
      additionalProperties: false
    },
    optionExamples: [
      [
        true,
        {
          'imports-groups': [
            {
              name: 'dependencies'
            },
            {
              name: 'fabric and common'
            },
            {
              name: 'product'
            },
            {
              name: 'other'
            }
          ],
          'matching-rules': [
            {
              type: 'project',
              matches: '^(fabric|common)',
              'imports-group': 'fabric and common'
            },
            {
              type: 'project',
              matches: '^(products)',
              'imports-group': 'product'
            },
            {
              type: 'dependencies',
              'imports-group': 'dependencies',
              'disable-native-nodejs-modules': true,
              'from-package.json': true
            },
            {
              type: 'project',
              matches: '.*',
              'imports-group': 'other'
            }
          ]
        }
      ]
    ],
    type: 'style',
    typescriptOnly: false
  };

  public apply(sourceFile: SourceFile): Lint.RuleFailure[] {
    if (this.ruleArguments.length === 0) {
      throw new Error('Rule configuration is required.');
    }

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
