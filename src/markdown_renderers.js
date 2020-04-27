import log from './log';

function formatIdTag(idTag) {
    // Get rid of whitespace and random characters
    idTag = idTag.toLowerCase().trim().replace(/[^\w]+/g, '-');
    // Remove dashes at the start
    while (idTag[1] === '-') {
        idTag = idTag.replace(idTag[1], '');
    }
    // Remove trailing dashes
    if (idTag.slice(-1) === '-') {
        idTag = idTag.substring(0, idTag.length - 1);
    }
    return idTag;
}

export const customHeadingRenderer = (text, level, raw) => {
    const idRegEx = /[^{}]+(?=})/g;
    const idTags = text.match(idRegEx);

    let idTag = idTags && idTags.length ? formatIdTag(idTags[0]) : null;
    if (!idTag) idTag = formatIdTag(raw);
    // If the custom ID is badly formatted, throw error
    if (idTags && idTag !== idTags[0]) log.error('Badly formatted heading ID', { id: idTags[0] });

    const titleText = text.split('{')[0].trim();

    const headingToReturn = `
            <h${level} id="${idTag}">
                <a href="#${idTag}"></a>
                ${titleText}
            </h${level}>`;

    return headingToReturn;
};
