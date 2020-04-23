const marked = require('marked');

const renderer = {
    heading(text, level) {
        let headingToReturn;

        const idRegEx = /[^{}]+(?=})/g;
        const idTags = text.match(idRegEx);

        let nameHtmlParam = text.toLowerCase().replace(/[^\w]+/g, '-');

        if (idTags) {
            const titleText = text.split('{')[0].trim();
            nameHtmlParam = titleText.toLowerCase().replace(/[^\w]+/g, '-');

            headingToReturn = `
                  <h${level}>
                    <a 
                      name="${nameHtmlParam}" 
                      href="${idTags[0]}" 
                      id="${idTags[0]}"> 
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
    },
};

marked.use({ renderer });

function renderMarkdown(title) {
    return marked(title);
}


module.exports = renderMarkdown();
