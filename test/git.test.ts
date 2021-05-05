import { convertRelativeImagePathsToAbsoluteInReadme } from '@apify/git';

describe('convertRelativeImagePathsToAbsoluteInReadme()', () => {
    it('works correctly for all forms of relative paths', () => {
        const testMarkdown = `
            # Heading
            ![img1](/root/relative/path/to/img.jpg)
            ![img2](./relative-path-to-img.jpg)
            ![img3](relative-path-to-img.jpg)
            <img src='/root/relative/path/to/img.jpg' />
            <img src='./relative-path-to-img.jpg' />
            <img src='relative-path-to-img.jpg' />
            <img src="/root/relative/path/to/img.jpg" />
            <img src="./relative-path-to-img.jpg" />
            <img src="relative-path-to-img.jpg" />
        `;

        const expectedResult = `
            # Heading
            ![img1](https://raw.githubusercontent.com/apify/test-repo/master/root/relative/path/to/img.jpg)
            ![img2](https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg)
            ![img3](https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg)
            <img src='https://raw.githubusercontent.com/apify/test-repo/master/root/relative/path/to/img.jpg' />
            <img src='https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg' />
            <img src='https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg' />
            <img src="https://raw.githubusercontent.com/apify/test-repo/master/root/relative/path/to/img.jpg" />
            <img src="https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg" />
            <img src="https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg" />
        `;

        expect(convertRelativeImagePathsToAbsoluteInReadme({
            readme: testMarkdown,
            gitRepoUrl: 'git@github.com:apify/test-repo.git',
        })).toEqual(expectedResult);
    });

    it('does not convert absolute paths', () => {
        const testMarkdown = `
            # Heading
            ![img1](https://apify.com/path/to/img.jpg)
            ![img2](http://apify.com/path/to/img.jpg)
            ![img3](ftp://apify.com/path/to/img.jpg)
            <img src='https://apify.com/path/to/img.jpg' />
            <img src='http://apify.com/path/to/img.jpg' />
            <img src='ftp://apify.com/path/to/img.jpg' />
        `;

        expect(convertRelativeImagePathsToAbsoluteInReadme({
            readme: testMarkdown,
            gitRepoUrl: 'git@github.com:apify/test-repo.git',
        })).toEqual(testMarkdown);
    });

    it('does not convert <img> tags with mismatched quotes', () => {
        const testMarkdown = `
            # Heading
            <img src='path/to/img.jpg" />
            <img src="path/to/img.jpg' />
        `;

        expect(convertRelativeImagePathsToAbsoluteInReadme({
            readme: testMarkdown,
            gitRepoUrl: 'git@github.com:apify/test-repo.git',
        })).toEqual(testMarkdown);
    });

    it('does not convert Base64 encoded images', () => {
        const testMarkdown = `
            # Heading
            ![img1](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=)
            <img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=' />
        `;

        expect(convertRelativeImagePathsToAbsoluteInReadme({
            readme: testMarkdown,
            gitRepoUrl: 'git@github.com:apify/test-repo.git',
        })).toEqual(testMarkdown);
    });

    it('works correctly for Github repo with explicit branch name', () => {
        const testMarkdown = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](./relative-path-to-img.jpg)
        `;
        const expectedResult = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](https://raw.githubusercontent.com/apify/test-repo/main/relative-path-to-img.jpg)
        `;

        expect(convertRelativeImagePathsToAbsoluteInReadme({
            readme: testMarkdown,
            gitRepoUrl: 'git@github.com:apify/test-repo.git',
            gitBranchName: 'main',
        })).toEqual(expectedResult);
    });

    it('works correctly for Bitbucket repo with explicit branch name', () => {
        const testMarkdown = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](./relative-path-to-img.jpg)
        `;
        const expectedResult = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](https://bytebucket.org/apify/test-repo/raw/main/relative-path-to-img.jpg)
        `;
        expect(convertRelativeImagePathsToAbsoluteInReadme({
            readme: testMarkdown,
            gitRepoUrl: 'git@bitbucket.org:apify/test-repo.git',
            gitBranchName: 'main',
        })).toEqual(expectedResult);
    });

    it('works correctly for Gitlab repo with explicit branch name', () => {
        const testMarkdown = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](./relative-path-to-img.jpg)
        `;
        const expectedResult = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](https://gitlab.com/apify/test-repo/-/raw/main/relative-path-to-img.jpg)
        `;

        expect(convertRelativeImagePathsToAbsoluteInReadme({
            readme: testMarkdown,
            gitRepoUrl: 'git@gitlab.com:apify/test-repo.git',
            gitBranchName: 'main',
        })).toEqual(expectedResult);
    });

    it('works correctly for Github repo with branch name in hash', () => {
        const testMarkdown = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](./relative-path-to-img.jpg)
        `;
        const expectedResult = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](https://raw.githubusercontent.com/apify/test-repo/my-awesome-branch/relative-path-to-img.jpg)
        `;

        expect(convertRelativeImagePathsToAbsoluteInReadme({
            readme: testMarkdown,
            gitRepoUrl: 'git@github.com:apify/test-repo.git#my-awesome-branch',
        })).toEqual(expectedResult);
    });

    it('works correctly for Github repo without explicit branch name', () => {
        const testMarkdown = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](./relative-path-to-img.jpg)
        `;
        const expectedResult = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg)
        `;

        expect(convertRelativeImagePathsToAbsoluteInReadme({
            readme: testMarkdown,
            gitRepoUrl: 'git@github.com:apify/test-repo.git',
        })).toEqual(expectedResult);
    });

    it('works correctly for Github repo without explicit branch name and <img src=... /> tags', () => {
        const testMarkdown = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](./relative-path-to-img.jpg)
            <img src='./relative-path-to-img.jpg' />
            <img src='./relative-path-to-img.jpg' alt='Some alt text'/>
            <img alt='Some alt text' src='./relative-path-to-img.jpg' />
            <img alt='Some alt text' src='./relative-path-to-img.jpg' width="500"/>
            <img src="./relative-path-to-img.jpg" />
            <img src="./relative-path-to-img.jpg" alt="Some alt text"/>
            <img alt="Some alt text" src="./relative-path-to-img.jpg" />
            <img alt="Some alt text" src="./relative-path-to-img.jpg" width="500"/>
        `;
        const expectedResult = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg)
            <img src='https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg' />
            <img src='https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg' alt='Some alt text'/>
            <img alt='Some alt text' src='https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg' />
            <img alt='Some alt text' src='https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg' width="500"/>
            <img src="https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg" />
            <img src="https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg" alt="Some alt text"/>
            <img alt="Some alt text" src="https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg" />
            <img alt="Some alt text" src="https://raw.githubusercontent.com/apify/test-repo/master/relative-path-to-img.jpg" width="500"/>
        `;

        expect(convertRelativeImagePathsToAbsoluteInReadme({
            readme: testMarkdown,
            gitRepoUrl: 'git@github.com:apify/test-repo.git',
        })).toEqual(expectedResult);
    });

    it('works correctly for unknown repo', () => {
        const testMarkdown = `
            # Heading
            ![img1](http://www.apify-awesome-test-image.com)
            ![img2](./relative-path-to-img.jpg)
        `;

        expect(convertRelativeImagePathsToAbsoluteInReadme({
            readme: testMarkdown,
            gitRepoUrl: 'git@some-unknown-git-site.com:apify/test-repo.git',
        })).toEqual(testMarkdown);
    });
});
