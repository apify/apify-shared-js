export const formatHeadingId = (headingId) => {
    // Replace non-word characters with dashes
    headingId = headingId.toLowerCase().trim().replace(/[^\w]+/g, '-');
    // Replace multiple following dashes with one dash
    headingId = headingId.replace(/[-]+/g, '-');
    // Remove dashes at the beginning and end
    headingId = headingId.replace(/^[-]+|[-]+$/g, '');

    return headingId;
};

export const extractHeadingIdAndText = (text, raw) => {
    // Check if there is a custom fragment link with the custom heading ID present in the heading
    // The heading text already comes rendered from Markdown to HTML to the renderer, so we have to look for an <a> tag instead of the Markdown source
    const parsingRegExp = new RegExp('<a href="#([^"]+)"></a>(.*)');
    const regexMatch = text.match(parsingRegExp);

    let headingId = '';
    let headingText = '';

    if (regexMatch && regexMatch.length) {
        // If there was a custom heading ID, format it to make sure it follows our heading structure
        headingId = formatHeadingId(regexMatch[1]);
        headingText = regexMatch[2].trim();
    } else {
        // If there was no custom heading ID, format the heading text into one
        headingId = formatHeadingId(raw);
        headingText = text.trim();
    }
    return { headingId, headingText };
};

/**
 * Renders headings by adding an ID to them, and adds a fragment link pointing to that ID (we use it to render a copy icon)
 * Optionally parses a custom ID from the heading text
 * So that:
 *   ## Heading text
 *     becomes
 *   <h2 id="heading-text"><a href="#heading-text"></a>Heading text</h2>
 * and
 *   ### [](#custom-id) Heading text
 *     becomes
 *   <h3 id="custom-id"><a href="#custom-id"></a>Heading text</h3>
*/
export const customHeadingRenderer = (text, level, raw) => {
    const { headingId, headingText } = extractHeadingIdAndText(text, raw);

    const headingToReturn = `
            <h${level} id="${headingId}"><a href="#${headingId}"></a>${headingText}</h${level}>`;
    return headingToReturn;
};
