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
    // This is regular expression matching relative image paths
    // The image path must not start with any of ['http://', 'https://', 'www']
    // Alt text is captured in capturing group 1 and the path itself in capturing group 4.
    // If the relative path starts with ./, it's ignored and not part of the capturing group.
    //
    // Examples
    // ![example](relative_path) - matches with "example" in group 1 and "relative_path" in group 4
    // ![example](./relative_path) - matches with "example" in group 1 and "relative_path" in group 4
    // ![example](http://relative_path) - doesn't match
    // ![example](https://relative_path) - doesn't match
    // ![example](www.relative_path) - doesn't match
    const relativeImgMdRegex = /(!\[.*?\])\((?!(https?:\/\/|www\.))(\.\/)?(.*?)\)/g;

    // HTML image references of type <img src="..." /> can be also embedded in markdown (e.g. in HTML table)
    // We provide 2 regular expression for cases where src attribute is wrapped in double or single quotes
    // As in the example above, relative path is matched if it doesn't start with any of ['http://', 'https://', 'www.'].
    // Also, if the path starts with "./", these characters are not part of the capture.
    //
    // Examples
    // Text                              | Group 1               | Group 2 | Group 3 | Group 4 | Group 5
    // <img src="path" key="val"/>       | <img alt="txt" src="  |         |         | path    | " key="val"/>
    // <img src="./path" key="val"/      | <img alt="txt" src="  |         |  ./     | path    | " key="val"/>
    // <img src="http://path" key="val"/      no match
    // <img src="https://path" key="val"/     no match
    // <img src="www.path" key="val"/         no match
    const relativeImgHtmlRegexWithDoubleQuotes = /(<img.*?src=")(?!(https?:\/\/|www\.))(\.\/)?(.*?)(".*?\/>)/g;

    // Same as for double quotes just all the src attribute is wrapped in single quote
    const relativeImgHtmlRegexWithSingleQuotes = /(<img.*?src=')(?!(https?:\/\/|www\.))(\.\/)?(.*?)('.*?\/>)/g;

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
            .replace(relativeImgMdRegex, `$1(${urlPrefix}/$4)`)
            .replace(relativeImgHtmlRegexWithDoubleQuotes, `$1${urlPrefix}/$4$5`)
            .replace(relativeImgHtmlRegexWithSingleQuotes, `$1${urlPrefix}/$4$5`)
        : readme;
};
