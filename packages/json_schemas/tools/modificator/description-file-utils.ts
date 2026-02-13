// eslint-disable-next-line import/no-extraneous-dependencies
import { load as cheerioLoad } from 'cheerio';

import * as addDescriptionRule from './rules/add-description-rule';
import * as removeValueRule from './rules/remove-value-rule';
import * as replaceValueRule from './rules/replace-value-rule';
import type { Rule } from './types';

/**
 * Parses an XML rules file and returns a list of supported rules.
 *
 * Expected XML structure:
 *
 * <Enchantments>
 *   <AddDescription json-path="/pointer" format="markdown">
 *     Markdown content...
 *   </AddDescription>
 *   <ReplaceValue json-path="/pointer" type="json|js">...</ReplaceValue>
 *   <RemoveValue json-path="/pointer" />
 * </Enchantments>
 *
 * Notes:
 * - Only direct children of <Enchantments> are processed.
 * - Unknown tags are ignored with a console warning.
 * - See individual rule parsers for attribute semantics and behavior.
 */
export function parseRuleFile(ruleFileContent: string): Rule[] {
    const supportedRules: Rule[] = [];

    const $ = cheerioLoad(ruleFileContent, { xml: true });

    $('Enchantments > *').each((_, ruleElement) => {
        const { tagName } = $(ruleElement).get(0);

        let rule: Rule | null = null;
        switch (tagName) {
            case addDescriptionRule.RULE_NAME:
                rule = addDescriptionRule.parseAddDescriptionRule($, ruleElement);
                break;
            case replaceValueRule.RULE_NAME:
                rule = replaceValueRule.parseReplaceValueRule($, ruleElement);
                break;
            case removeValueRule.RULE_NAME:
                rule = removeValueRule.parseRemoveValueRule($, ruleElement);
                break;
            default:
                // eslint-disable-next-line no-console
                console.warn(`Unknown Rule "${tagName}", skipping...`);
        }

        if (rule) {
            supportedRules.push(rule);
        }
    });

    return supportedRules;
}
