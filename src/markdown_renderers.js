function formatIdTag(idTag) {
    // Get rid of whitespace and random characters
    idTag = idTag.toLowerCase().trim().replace(/[^\w]+/g, '-');
    // Add hastag if it is missing
    if (!idTag.includes('#')) idTag = `#${idTag}`;
    // Remove dashes right after hashtag
    while (idTag[1] === '-') {
        idTag = idTag.replace(idTag[1], '');
    }
    // Remove trailing dashes
    if (idTag.slice(-1) === '-') {
        idTag = idTag.substring(0, idTag.length - 1);
    }
    return idTag;
}

export const customHeadingRenderer = (text, level) => {
    let headingToReturn;

    const idRegEx = /[^{}]+(?=})/g;
    const idTags = text.match(idRegEx);

    if (idTags) {
        const idTag = formatIdTag(idTags[0]);
        const titleText = text.split('{')[0].trim();
        const htmlName = titleText.toLowerCase().replace(/[^\w]+/g, '-');
        headingToReturn = `
            <h${level}>
                <a 
                    name="${htmlName}"
                    href="${idTag}"
                    id="${idTag}">
                    <span class="header-link"></span>
                </a>
                ${titleText}
            </h${level}>`;
    } else {
        const htmlName = text.toLowerCase().replace(/[^\w]+/g, '-');
        headingToReturn = `
            <h${level}>
                <a 
                    name="${htmlName}"
                    href="#${htmlName}">
                    <span class="header-link"></span>
                </a>
                ${text}
            </h${level}>`;
    }
    return headingToReturn;
};
