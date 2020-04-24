const marked = require('marked');

export const customHeadingRenderer = (text, level) => {
    let headingToReturn;

    const idRegEx = /[^{}]+(?=})/g;
    let idTags = text.match(idRegEx);
    if (!idTags.includes('#')) {
        idTags = `#${idTags}`;
    }

    let nameHtmlParam = text.toLowerCase().replace(/[^\w]+/g, '-');

    if (idTags) {
        const titleText = text.split('{')[0].trim();
        nameHtmlParam = titleText.toLowerCase().replace(/[^\w]+/g, '-');

        headingToReturn = `
            <h${level}>
                <a 
                    name="${nameHtmlParam}" 
                      href="${idTags}" 
                      id="${idTags}"> 
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
                      class="anchor" 
                      <span class="header-link"></span>
                    </a>
                    ${text}
                  </h${level}>`;
    }
    return headingToReturn;
};

marked.use({ customHeadingRenderer });
