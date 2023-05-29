import gitUrlParse from 'git-url-parse';

interface ConvertOptions {
    /** whole readme file stored as a single string */
    readme: string;
    /** e.g. git@github.com:AUTHOR_NAME/REPO_NAME.git */
    gitRepoUrl: string;
    /** branch name associated with the actor build to which this readme corresponds */
    gitBranchName?: string;
}

interface ParseGitUrl extends gitUrlParse.GitUrl {
    branchName?: string;
}

/**
 * Apify uses an extended git URL format with branch and directory as hash parameters:
 * - myrepo.git#branch
 * - myrepo.git#:folder
 * - myrepo.git#branch:folder
 * see https://github.com/apify/apify-worker/blob/8a667b3b5879a78ec2ce6a06e4953ad174b47cf2/src/actor/act2_build_job.js#L1258
 * @param gitRepoUrl
 * @return {ParseGitUrl}
 */
const parseApifyGitUrl = (gitRepoUrl: string): ParseGitUrl => {
    if (gitRepoUrl.includes('#')) {
        const repoFullUrlParsed = gitRepoUrl.split('#');
        const repoUrl = repoFullUrlParsed[0];
        const branchDirPart = repoFullUrlParsed[1];
        const parsedRepoUrl = gitUrlParse(repoUrl);
        let branchName;
        if (branchDirPart && branchDirPart.includes(':')) {
            const [branchPart] = branchDirPart.split(':');
            branchName = branchPart;
        } else if (branchDirPart) {
            branchName = branchDirPart;
        }
        return { ...parsedRepoUrl, branchName };
    }
    return gitUrlParse(gitRepoUrl);
};

/**
 * This replaces all relative image paths in markdown readme
 * by appropriate absolute paths so they can be correctly rendered on the website.
 * At the moment, the conversion works for 3 major repo systems, namely Github, Gitlab and Bitbucket and
 * also works if the user opted to use custom branch for deploying their actor to Apify.
 * @return {string} updated readme
 */
export const convertRelativeImagePathsToAbsoluteInReadme = ({ readme, gitRepoUrl, gitBranchName }: ConvertOptions): string => {
    const parsedRepoUrl = parseApifyGitUrl(gitRepoUrl);

    // Can't use parsedRepoUrl.full_name on it's own as Bitbucket adds irrelevant path suffix to the end of it
    const repoNameParts = parsedRepoUrl.full_name.split('/');
    const repoFullName = `${repoNameParts[0]}/${repoNameParts[1]}`;

    // We need to parse the branch there hence gitUrlParse is not detected this format of git URL.
    // Otherwise, we try to use the branch name from the build object. It should exist for all builds since roughly mid October 2020.
    // Prior to that, all default branches were 'master', hence we default to that as a backup.
    const branchName = parsedRepoUrl.branchName || gitBranchName || 'master';

    // We want to replace relative paths (all paths which are not absolute, so anything not starting with http://, https://, ftp:// or data:)
    // with absolute paths, which is done by these fancy regular expressions

    // Images in markdown have syntax ![alt text](image url)
    // (!\[.*?\])\( matches the start of the image code
    // (?!(?:(?:https?|ftp):\/\/|data:)) lookahead matches if the next part of the string is not http://, https://, ftp:// or data:
    // (?:\.?\/) matches the starting ./ or / in a relative or root-relative URL, which can be ignored when converting to absolute link
    // (.*?) matches the actual relative URL
    // \) matches the end parenthesis
    const relativeImageMarkdownRegex = /(!\[.*?\])\((?!(?:(?:https?|ftp):\/\/|data:))(?:\.?\/)?(.*?)\)/g;

    // HTML image references of type <img src="..." /> can be also embedded in markdown (e.g. in HTML table)
    // We provide 2 regular expression for cases where src attribute is wrapped in double or single quotes
    // (<img.*?src=") or (<img.*?src=') matches the start of the image code
    // (?!(?:(?:https?|ftp):\/\/|data:)) lookahead matches if the next part of the string is not http://, https://, ftp:// or data:
    // (?:\.?\/) matches the starting ./ or / in a relative or root-relative URL, which can be ignored when converting to absolute link
    // (.*?) matches the actual relative URL
    // (".*?\/>) or ('.*?\/>) matches the end of the image code
    const relativeImageHtmlRegexWithDoubleQuotes = /(<img.*?src=")(?!(?:(?:https?|ftp):\/\/|data:))(?:\.?\/)?(.*?)(".*?\/>)/g;
    const relativeImageHtmlRegexWithSingleQuotes = /(<img.*?src=')(?!(?:(?:https?|ftp):\/\/|data:))(?:\.?\/)?(.*?)('.*?\/>)/g;

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
