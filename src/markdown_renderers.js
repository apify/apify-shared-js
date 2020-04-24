const marked = require('marked');

export const customHeadingRenderer = (text, level) => {
    let headingToReturn;

    const idRegEx = /[^{}]+(?=})/g;
    const idTags = text.match(idRegEx);

    let nameHtmlParam = text.toLowerCase().replace(/[^\w]+/g, '-');

    if (idTags) {
        let idTag = idTags[0];
        if (!idTag.includes('#')) idTag = `#${idTag}`;
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
