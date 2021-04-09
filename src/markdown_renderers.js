import gitUrlParse from 'git-url-parse';
import * as utils from './utilities.client';

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

export const parseRepoName = (repoUrl) => {
    const parsedRepoUrl = gitUrlParse(repoUrl);
    // Can't use parsedRepoUrl.full_name on it's own as Bitbucket adds irrelevant path suffix to the end of it
    const repoName = parsedRepoUrl.full_name.split('/').slice(0, 2).join('/');
    return repoName;
};

/* *
 * Generates URLs for RAW content such as images
*/
export const generateRawGitRepoUrlPrefix = (repoUrl, branchName) => {
    let urlPrefix;
    const repoFullName = parseRepoName(repoUrl);

    if (repoUrl.includes('github.com')) {
        urlPrefix = `https://raw.githubusercontent.com/${repoFullName}/${branchName}`;
    } else if (repoUrl.includes('gitlab.com')) {
        urlPrefix = `https://gitlab.com/${repoFullName}/-/raw/${branchName}`;
    } else if (repoUrl.includes('bitbucket.org')) {
        // Note: bytebucket is a raw content serving service by Bitbucket
        urlPrefix = `https://bytebucket.org/${repoFullName}/raw/${branchName}`;
    }
    return urlPrefix;
};

/* *
 * Generates URLs for files and folders
*/
export const generateGitRepoUrlPrefix = (repoUrl, branchName, href) => {
    let urlPrefix;
    const repoFullName = parseRepoName(repoUrl);

    const hrefParts = href.split('/');
    const lastHrefPart = hrefParts[hrefParts.length - 1];

    // If the last part of the URL has a dot, it's a file with an extension or .gitignore (blob),
    // otherwise we assume the link is for a directory (tree)
    const isTreeOrBlob = lastHrefPart.includes('.') ? 'blob' : 'tree';

    if (repoUrl.includes('github.com')) {
        urlPrefix = `https://github.com/${repoFullName}/${isTreeOrBlob}/${branchName}`;
    } else if (repoUrl.includes('gitlab.com')) {
        urlPrefix = `https://gitlab.com/${repoFullName}/-/${isTreeOrBlob}/${branchName}`;
    } else if (repoUrl.includes('bitbucket.org')) {
        // Note: bytebucket is a raw content serving service by Bitbucket
        urlPrefix = `https://bitbucket.org/${repoFullName}/src/${branchName}`;
    }
    return urlPrefix;
};

/**
 * Replaces relative links with absolute ones that point to the actor's git repo.
 * Mainly for use in actor READMES
 * Parses the actor's repo URL to extract the repo name and owner name.
 * @param {string} href
 * @param {string} text
 * @param {string} repoUrl
 * @param {string} branchName
 * @return {string}
*/
export const customLinkRenderer = (href, text, repoUrl, branchName) => {
    // Handle anchor links and local Apify links
    // Return Apify domain links without rel="nofollow" for SEO
    if (href.startsWith('#') || href.includes('apify.com')) {
        // Ensure that anchors have lowercase href
        return `<a href="${href.toLowerCase()}">${text}</a>`;
    }
    // Only target relative URLs, which are used to refer to the git repo, and not anchors or absolute URLs
    const urlIsRelative = utils.isUrlRelative(href);
    if (urlIsRelative) {
        const urlPrefix = generateGitRepoUrlPrefix(repoUrl, branchName, href);
        // Since the README will always be in the root, the hrefs will have the same prefix, which needs to be taken off for the URL
        const cleanedHref = href.startsWith('./') ? href.replace('./', '') : href;
        href = `${urlPrefix}/${cleanedHref}`;
    }

    return `<a href="${href}" rel="nofollow noreferrer noopener">${text}</a>`;
};

/**
 * Replaces relative links in images with absolute ones that point to the actor's git repo.
 * Mainly for use in actor READMES
 * Parses the actor's repo URL to extract the repo name and owner name.
 * @param {string} href
 * @param {string} text
 * @param {string} repoUrl
 * @param {string} branchName
 * @return {string}
*/
export const customImageRenderer = (href, text, repoUrl, gitBranchName) => {
    // Only target relative URLs, which are used to refer to the git repo, and not anchors or absolute URLs
    const urlIsRelative = utils.isUrlRelative(href);
    if (urlIsRelative) {
        const urlPrefix = generateRawGitRepoUrlPrefix(repoUrl, gitBranchName);
        // Since the README will always be in the root, the hrefs will have the same prefix, which needs to be taken off for the URL
        const cleanedHref = href.startsWith('./') ? href.replace('./', '') : href;
        href = `${urlPrefix}/${cleanedHref}`;
    }

    return `<img src="${href}" alt=${text} />`;
};
