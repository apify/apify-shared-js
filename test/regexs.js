import _ from 'underscore';
import { expect } from 'chai';
import * as REGEXS from '../build/regexs';

const tests = {
    GIT_REPO_REGEX: {
        valid: [
            'git://github.com/ember-cli/ember-cli.git#ff786f9f',
            'git://github.com/ember-cli/ember-cli.git#gh-pages',
            'git://github.com/ember-cli/ember-cli.git#master',
            'git://github.com/ember-cli/ember-cli.git#Quick-Fix',
            'git://github.com/ember-cli/ember-cli.git#quick_fix',
            'git://github.com/ember-cli/ember-cli.git#quick_fix:a/b/c',
            'git://github.com/ember-cli/ember-cli.git#quick_fix:',
            'git://github.com/ember-cli/ember-cli.git#v0.1.0',
            'git://host.xz/path/to/repo.git/',
            'git://host.xz/~user/path/to/repo.git/',
            'git@192.168.101.127:user/project.git',
            'git@github.com:user/project.git',
            'git@github.com:user/some-project.git',
            'git@github.com:user/some-project.git',
            'git@github.com:user/some_project.git',
            'git@github.com:user/some_project.git',
            'http://192.168.101.127/user/project.git',
            'http://github.com/user/project.git',
            'http://host.xz/path/to/repo.git/',
            'https://192.168.101.127/user/project.git',
            'https://github.com/user/project.git',
            'https://host.xz/path/to/repo.git/',
            'https://username::;*%$:@github.com/username/repository.git',
            'https://username:$fooABC@:@github.com/username/repository.git',
            'https://username:password@github.com/username/repository.git',
            'ssh://host.xz/path/to/repo.git/',
            'ssh://host.xz/path/to/repo.git/',
            'ssh://host.xz/~/path/to/repo.git',
            'ssh://host.xz/~user/path/to/repo.git/',
            'ssh://host.xz:port/path/to/repo.git/',
            'ssh://user@host.xz/path/to/repo.git/',
            'ssh://user@host.xz/path/to/repo.git/',
            'ssh://user@host.xz/~/path/to/repo.git',
            'ssh://user@host.xz/~user/path/to/repo.git/',
            'ssh://user@host.xz:port/path/to/repo.git/',

            // Without .git
            'git://github.com/ember-cli/ember-cli.git#v0.1.0',
            'git://github.com/ember-cli/ember-cli#v0.1.0',
            'git://github.com#v0.1.0',
            'git@github.com:user/some_project',
            'https://username:password@github.com/username/repository',
            'ssh://host.xz/~user/path/to/repo/',
            'ssh://host.xz/~user/path/to/repo',
            'ssh://host.xz/~user/path/to/',
            'ssh://host.xz/',
            'ssh://host.xz/a/b/c',
            'ssh://host.xz/a/b/c/#something',
            'ssh://host.xz/a/b/c/#something:a/b/c',
        ],
        invalid: [
            '/path/to/repo.git/',
            'file:///path/to/repo.git/',
            'file://~/path/to/repo.git/',
            'host.xz:/path/to/repo.git/',
            'host.xz:path/to/repo.git',
            'host.xz:~user/path/to/repo.git/',
            'path/to/repo.git/',
            'rsync://host.xz/path/to/repo.git/',
            'user@host.xz:/path/to/repo.git/',
            'user@host.xz:path/to/repo.git',
            'user@host.xz:~user/path/to/repo.git/',
            '~/path/to/repo.git',
        ],
    },

    APIFY_PROXY_VALUE_REGEX: {
        valid: [
            '123_jkn_090',
            '123_090',
            'klkn_kkk',
            'd',
            '7',
            '0.345245346',
            'fff~ggg',
        ],
        invalid: [
            '',
            'jjj-',
            's-s',
            'k#k',
            '$',
        ],
    },

    KEY_VALUE_STORE_KEY_REGEX: {
        valid: [
            'hello123',
            '123hello',
            'this_is_1-key',
            'with(parens)',
            ")(x_._-''",
            '!!!',
        ],
        invalid: [
            '#',
            '"hello"',
            '/foo/bar',
            '\\foo\\bar',
            'some.*',
            'one&two',
            'yes?',
            'xx{no}xx',
            'http://www.google.com',
            'C:\\Windows',
        ],
    },

    EMAIL_REGEX: {
        valid: [
            'test@example.com',
            'a.b+123~@example.com',
            'a-b@example.at',
            'test@my.example.com',
            'test@my-super.example.com',
        ],
        invalid: [
            ' test@example.com',
            'test@@example.com',
            'test@localhost',
            'not an email',
            '@example.com',
        ],
    },
};

describe('regexps', () => {
    _.forEach(tests, (defs, key) => {
        it(`${key} works`, () => {
            defs.valid.forEach((str) => {
                expect(str).to.match(REGEXS[key]);
            });
            defs.invalid.forEach((str) => {
                expect(str).to.not.match(REGEXS[key]);
            });
        });
    });
});
