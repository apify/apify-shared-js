import gitUrlParse from 'git-url-parse';

/**
 * This replaces all relative image paths (starting with './') in markdown readme
 * by appropriate absolute paths so they can be correctly rendered on the website.
 * At the moment, the conversion works for 3 major repo systems, namely Github, Gitlab and Bitbucket and
 * also works if the user opted to use custom branch for deploying their actor to Apify.
 * @param {Object} args
 * @param {string} args.readme whole readme file stored as a single string
 * @param {string} args.gitRepoUrl e.g. git@github.com:AUTHOR_NAME/REPO_NAME.git
 * @param {string} args.gitBranchName branch name associated with the actor build to which this readme corresponds
 * @return {string} updated readme
 */
export const convertRelativeImagePathsToAbsoluteInReadme = ({ readme, gitRepoUrl, gitBranchName }) => {
    const parsedRepoUrl = gitUrlParse(gitRepoUrl);

    // Can't use parsedRepoUrl.full_name on it's own as Bitbucket adds irrelevant path suffix to the end of it
    const repoNameParts = parsedRepoUrl.full_name.split('/');
    const repoFullName = `${repoNameParts[0]}/${repoNameParts[1]}`;

    // When user wants to specify a different branch during actor addition, they need
    // to add #branchName to the end of git URL. Hence it ends up under 'hash' key here.
    // Otherwise, we try to use the branch name from the build object. It should exist for all builds since roughly mid October 2020.
    // Prior to that, all default branches were 'master', hence we default to that as a backup.
    const branchName = parsedRepoUrl.hash || gitBranchName || 'master';

    // Images in markdown have syntax ![alt text](image url)
    const relativeImageMarkdownRegex = /(!\[.*?\])\(\.\/(.*?)\)/g;

    // HTML image references of type <img src="..." /> can be also embedded in markdown (e.g. in HTML table)
    // We provide 2 regular expression for cases where src attribute is wrapped in double or single quotes
    const relativeImageHtmlRegexWithDoubleQuotes = /(<img.*?src=")\.\/(.*?)(".*?\/>)/g;
    const relativeImageHtmlRegexWithSingleQuotes = /(<img.*?src=')\.\/(.*?)('.*?\/>)/g;

    let urlPrefix = null;
    if (parsedRepoUrl.resource === 'github.com') {
        urlPrefix = `https://raw.githubusercontent.com/${repoFullName}/${branchName}`;
    } else if (parsedRepoUrl.resource === 'gitlab.com') {
        urlPrefix = `https://gitlab.com/${repoFullName}/-/raw/${branchName}`;
    } else if (parsedRepoUrl.resource === 'bitbucket.org') {
        // Note: bytebucket is raw content serving service by Bitbucket
        urlPrefix = `https://bytebucket.org/${repoFullName}/raw/${branchName}`;
    }

    return urlPrefix
        ? readme
            .replace(relativeImageMarkdownRegex, `$1(${urlPrefix}/$2)`)
            .replace(relativeImageHtmlRegexWithDoubleQuotes, `$1${urlPrefix}/$2$3`)
            .replace(relativeImageHtmlRegexWithSingleQuotes, `$1${urlPrefix}/$2$3`)
        : readme;
};
