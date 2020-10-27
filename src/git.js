import GitUrlParse from 'git-url-parse';


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
    const parsedRepoUrl = GitUrlParse(gitRepoUrl);

    // Can't use parsedRepoUrl.full_name on it's own as Bitbucket adds irrelevant path suffix to the end of it
    const repoNameParts = parsedRepoUrl.full_name.split('/');
    const repoFullName = `${repoNameParts[0]}/${repoNameParts[1]}`;

    // When user wants to specify a different branch during actor addition, they need
    // to add #branchName to the end of git URL. Hence it ends up under 'hash' key here.
    // Otherwise, we try to use the branch name from the build object. It should exist for all builds since roughly mid October 2020.
    // Prior to that, all default branches were 'master', hence we default to that as a backup.
    const branchName = parsedRepoUrl.hash || gitBranchName || 'master';

    // Images in markdown have syntax ![alt text](image url)
    const relativeImageRegex = /(!\[.*?\])\(\.\/(.*?)\)/g;

    switch (parsedRepoUrl.resource) {
        case 'github.com':
            return readme.replace(
                relativeImageRegex,
                `$1(https://raw.githubusercontent.com/${repoFullName}/${branchName}/$2)`,
            );
        case 'gitlab.com':
            return readme.replace(
                relativeImageRegex,
                `$1(https://gitlab.com/${repoFullName}/-/raw/${branchName}/$2)`,
            );
        case 'bitbucket.org':
            // Note: bytebucket is raw content serving service by Bitbucket
            return readme.replace(
                relativeImageRegex,
                `$1(https://bytebucket.org/${repoFullName}/raw/${branchName}/$2)`,
            );
        default:
            return readme;
    }
};
