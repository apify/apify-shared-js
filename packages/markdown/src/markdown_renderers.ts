import { CONTACT_LINK_REGEX, GIT_MAIN_BRANCH } from '@apify/consts';
import { isUrlRelative } from '@apify/utilities';

export function formatHeadingId(headingId: string) {
    // Replace non-word characters with dashes
    headingId = headingId.toLowerCase().trim().replace(/[^\w]+/g, '-');
    // Replace multiple following dashes with one dash
    headingId = headingId.replace(/[-]+/g, '-');
    // Remove dashes at the beginning and end
    headingId = headingId.replace(/^[-]+|[-]+$/g, '');

    return headingId;
}

export function extractHeadingIdAndText(text: string, raw: string): { headingText: string; headingId: string } {
    // Check if there is a custom fragment link with the custom heading ID present in the heading
    // The heading text already comes rendered from Markdown to HTML to the renderer, so we have to look for an <a> tag instead of the Markdown source
    const parsingRegExp = /<a href="#([^"]+)"><\/a>(.*)/;
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
}

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
export function customHeadingRenderer(text: string, level: 1 | 2 | 3 | 4 | 5 | 6, raw: string): string {
    const { headingId, headingText } = extractHeadingIdAndText(text, raw);
    return `\n${' '.repeat(12)}<h${level} id="${headingId}"><a href="#${headingId}"></a>${headingText}</h${level}>`;
}

export function parseRepoName(gitRepoUrl: string): string {
    // Handling for SSH URLs
    const normalizedUrl = gitRepoUrl.includes('git@')
        ? gitRepoUrl.replace(':', '/').replace('git@', 'https://')
        : gitRepoUrl;
    const parsedRepoUrl = new URL(normalizedUrl);
    const cleanedPath = parsedRepoUrl.pathname.replace('.git', '');
    // Do not use the initial slash in the path
    const path = cleanedPath.substr(1);
    // Can't use "path" on it's own as Bitbucket adds irrelevant path suffix to the end of it
    return path.split('/').slice(0, 2).join('/');
}

/**
 * Generates URLs for RAW content such as images
 */
export function generateRawGitRepoUrlPrefix(gitRepoUrl: string, gitBranchName: string): string | undefined {
    let urlPrefix;
    const repoFullName = parseRepoName(gitRepoUrl);

    // Avoid errors created by missing branch name / badly formed URLs
    const branchName = gitBranchName || GIT_MAIN_BRANCH;

    if (gitRepoUrl.includes('github.com')) {
        urlPrefix = `https://raw.githubusercontent.com/${repoFullName}/${branchName}`;
    } else if (gitRepoUrl.includes('gitlab.com')) {
        urlPrefix = `https://gitlab.com/${repoFullName}/-/raw/${branchName}`;
    } else if (gitRepoUrl.includes('bitbucket.org')) {
        // Note: bytebucket is a raw content serving service by Bitbucket
        urlPrefix = `https://bytebucket.org/${repoFullName}/raw/${branchName}`;
    }

    return urlPrefix;
}

/**
 * Generates URLs for files and folders
 */
export function generateGitRepoUrlPrefix(gitRepoUrl: string, gitBranchName: string, href: string): string | undefined {
    let urlPrefix;
    const repoFullName = parseRepoName(gitRepoUrl);

    const hrefParts = href.split('/');
    const lastHrefPart = hrefParts[hrefParts.length - 1];

    // If the last part of the URL has a dot, it's a file with an extension or .gitignore (blob),
    // otherwise we assume the link is for a directory (tree)
    const isTreeOrBlob = lastHrefPart.includes('.') ? 'blob' : 'tree';

    // Avoid errors created by missing branch name / badly formed URLs
    const branchName = gitBranchName || GIT_MAIN_BRANCH;

    if (gitRepoUrl.includes('github.com')) {
        urlPrefix = `https://github.com/${repoFullName}/${isTreeOrBlob}/${branchName}`;
    } else if (gitRepoUrl.includes('gitlab.com')) {
        urlPrefix = `https://gitlab.com/${repoFullName}/-/${isTreeOrBlob}/${branchName}`;
    } else if (gitRepoUrl.includes('bitbucket.org')) {
        // Note: bytebucket is a raw content serving service by Bitbucket
        urlPrefix = `https://bitbucket.org/${repoFullName}/src/${branchName}`;
    }

    return urlPrefix;
}

/**
 * Replaces relative links with absolute ones that point to the actor's git repo.
 * Mainly for use in actor READMES
 * The flow:
 * 1) handle anchors, Apify links, and contact links (these don't point to a git repo and shouldn't have rel=nofollow).
 * 2) handle relative links for the Git repo and convert them to absolute
 * 3) handle absolute links
*/
export function customLinkRenderer(href: string, text: string, gitRepoUrl: string, gitBranchName: string): string {
    // Handle anchor links, local Apify links, and mailto
    // Return Apify domain links without rel="nofollow" for SEO
    if (href.startsWith('#') || href.includes('apify.com') || CONTACT_LINK_REGEX.test(href)) {
        // Ensure that anchors have lowercase href
        return `<a href="${href.toLowerCase()}">${text}</a>`;
    }

    // Only target relative URLs, which are used to refer to the git repo, and not anchors or absolute URLs
    const urlIsRelative = isUrlRelative(href);

    if (urlIsRelative && gitRepoUrl) {
        const urlPrefix = generateGitRepoUrlPrefix(gitRepoUrl, gitBranchName, href);
        // Since the README will always be in the root, the hrefs will have the same prefix, which needs to be taken off for the URL
        const cleanedHref = href.startsWith('./') ? href.replace('./', '') : href;
        href = `${urlPrefix}/${cleanedHref}`;
    }

    return `<a href="${href}" target="_blank" rel="nofollow noreferrer noopener">${text}</a>`;
}

/**
 * Replaces relative links in images with absolute ones that point to the actor's git repo.
 * Mainly for use in actor READMES
 * Parses the actor's repo URL to extract the repo name and owner name.
*/
export function customImageRenderer(href: string, text: string, gitRepoUrl: string, gitBranchName: string): string {
    // Only target relative URLs, which are used to refer to the git repo, and not anchors or absolute URLs
    const urlIsRelative = isUrlRelative(href);

    if (urlIsRelative && gitRepoUrl) {
        const urlPrefix = generateRawGitRepoUrlPrefix(gitRepoUrl, gitBranchName);
        // Since the README will always be in the root, the hrefs will have the same prefix, which needs to be taken off for the URL
        const cleanedHref = href.startsWith('./') ? href.replace('./', '') : href;
        href = `${urlPrefix}/${cleanedHref}`;
    }

    return `<img src="${href}" alt="${text}" loading="lazy" />`;
}
