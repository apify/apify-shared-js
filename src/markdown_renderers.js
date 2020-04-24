const marked = require('marked');

function formatIdTag(idTag) {
    // Replace spaces with dashes and get rid of whitespace
    idTag = idTag.toLowerCase().trim().replace(/[^\w]+/g, '-');
    // Add hastag if it is missing
    if (!idTag.includes('#')) idTag = `#${idTag}`;
    // Remove dashes right after hashtag
    while (idTag[1] === '-') {
        idTag = idTag.replace(idTag[1], '');
    }
    return idTag;
}

export const customHeadingRenderer = (text, level) => {
    let headingToReturn;

    const idRegEx = /[^{}]+(?=})/g;
    const idTags = text.match(idRegEx);

    let nameHtmlParam = text.toLowerCase().replace(/[^\w]+/g, '-');

    if (idTags) {
        const idTag = formatIdTag(idTags[0]);
        const titleText = text.split('{')[0].trim();
        nameHtmlParam = titleText.toLowerCase().replace(/[^\w]+/g, '-');

        headingToReturn = `
            <h${level}>
                <a 
                    name="${nameHtmlParam}"
                    href="${idTag}"
                    id="${idTag}">
                    <span class="header-link"></span>
                </a>
                ${titleText}
            </h${level}>`;
    } else {
        headingToReturn = `
            <h${level}>
                <a 
                    name="${nameHtmlParam}"
                    href="#${nameHtmlParam}">
                    <span class="header-link"></span>
                </a>
                ${text}
            </h${level}>`;
    }
    return headingToReturn;
};

marked.use({ customHeadingRenderer });
