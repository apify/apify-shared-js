import log from './log';

const matchAll = require('match-all');

export const APIFY_CODE_TABS = 'apify-code-tabs';

function formatIdTag(idTag) {
    // Get rid of whitespace and random characters
    idTag = idTag.toLowerCase().trim().replace(/[^\w]+/g, '-');
    // Remove dashes at the and end
    idTag = idTag.replace(/^[-]+|[-]+$/g, '');
    return idTag;
}

export const customHeadingRenderer = (text, level, raw) => {
    const idRegEx = /[^{}]+(?=})/g;
    const idTags = text.match(idRegEx);
    // If provided, format custom ID
    let idTag = idTags && idTags.length ? formatIdTag(idTags[0]) : null;
    // If no ID tag provided, generate from title
    if (!idTag) idTag = formatIdTag(raw);
    // If the custom ID is badly formatted, throw error
    if (idTags && idTag !== idTags[0]) log.error('Badly formatted heading ID', { id: idTags[0] });

    const titleText = text.split('{')[0].trim();

    const headingToReturn = `
            <h${level} id="${idTag}">${titleText}</h${level}>`;

    return headingToReturn;
};

export const customCodeRenderer = (code) => {
    if (!code.trim().startsWith('```marked-tabs')) {
        return false;
    }

    const matchesIterator = matchAll(code, /<marked-tab header="(?<header>.*?)" lang="(?<lang>.*?)">(?<code>.*?)<\/marked-tab>/sg);
    const matches = [];
    let nextMatch = matchesIterator.nextRaw();
    while (nextMatch) {
        matches.push(nextMatch);
        nextMatch = matchesIterator.nextRaw();
    }

    const inputArg = matches
        .map((match) => {
            const { header, lang } = match.groups;
            let tabCode = match.groups.code;

            let numLeadingSpacesOnFirstLine = 0;
            while (tabCode.startsWith('\n') || tabCode.startsWith(' ')) {
                if (tabCode.startsWith('\n')) {
                    numLeadingSpacesOnFirstLine = 0;
                } else if (tabCode.startsWith(' ')) {
                    numLeadingSpacesOnFirstLine += 1;
                }
                tabCode = tabCode.substring(1);
            }

            while (tabCode.endsWith('\n') || tabCode.endsWith(' ')) {
                tabCode = tabCode.substring(0, tabCode.length - 1);
            }

            tabCode = tabCode
                .split('\n')
                .map((line, index) => {
                    if (index === 0) {
                        return line;
                    }

                    for (let i = 0; i < numLeadingSpacesOnFirstLine; i++) {
                        if (line.startsWith(' ')) {
                            line = line.substring(1);
                        }
                    }
                    return line;
                })
                .join('\n');

            return `"${header}": { "language": "${lang}", "code: "${tabCode}" }`;
        })
        .join(',\n');
    return `<${APIFY_CODE_TABS} input="{\n${inputArg.replace(/"/g, '\\"')}\n}" />`;
};
