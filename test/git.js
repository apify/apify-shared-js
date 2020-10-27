/* eslint-disable */

import { expect } from 'chai';

import { convertRelativeImagePathsToAbsoluteInReadme } from '../src/git';

describe('convertRelativeImagePathsToAbsoluteInReadme()', () => {
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
        })).to.eql(expectedResult)
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
        })).to.eql(expectedResult)
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
        })).to.eql(expectedResult)
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
        })).to.eql(expectedResult)
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
        })).to.eql(expectedResult)
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
        })).to.eql(testMarkdown)
    });

});
