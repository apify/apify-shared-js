import * as REGEXS from '@apify/consts';
import { SPLIT_PATH_REGEX } from '@apify/consts';

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

    // Test samples inspired by https://mathiasbynens.be/demo/url-regex
    HTTP_URL_REGEX: {
        valid: [
            'http://foo.com/blah_blah',
            'http://foo.com/blah_blah/',
            'http://foo.com/blah_blah_(wikipedia)',
            'http://foo.com/blah_blah_(wikipedia)_(again)',
            'http://www.example.com/wpstyle/?p=364',
            'https://www.example.com/foo/?bar=baz&inga=42&quux',
            'http://✪df.ws/123',
            'http://userid:password@example.com:8080',
            'http://userid:password@example.com:8080/',
            'http://userid@example.com',
            'http://userid@example.com/',
            'http://userid@example.com:8080',
            'http://userid@example.com:8080/',
            'http://userid:password@example.com',
            'http://userid:password@example.com/',
            'http://142.42.1.1/',
            'http://142.42.1.1:8080/',
            'http://➡.ws/䨹',
            'http://⌘.ws',
            'http://⌘.ws/',
            'http://foo.com/blah_(wikipedia)#cite-1',
            'http://foo.com/blah_(wikipedia)_blah#cite-1',
            'http://foo.com/unicode_(✪)_in_parens',
            'http://foo.com/(something)?after=parens',
            'http://☺.damowmow.com/',
            'http://code.google.com/events/#&product=browser',
            'http://j.mp',
            // 'ftp://foo.bar/baz', // FTP URLs are not supported!
            'http://foo.bar/?q=Test%20URL-encoded%20stuff',
            'http://مثال.إختبار',
            'http://例子.测试',
            'http://उदाहरण.परीक्षा',
            'http://-.~_!$&"()*+,;=:%40:80%2f::::::@example.com',
            'http://1337.net',
            'http://a.b-c.de',
            'http://223.255.255.254',

            // Our additions - more hyphens in text
            'https://us-central1-some-project----prod.cloudfunctions.net/functionName',
            'http://a.b--c.de/',
            'http://www.foo.bar./',
            'https://example.com',
            'https://example.com/',
            'https://example.com/some.thing',
            'http://example.com/some_thing/else',
            'HTTP://example.com/some_thing/else',
            'HTTPs://example.com/some_thing/else',

            // These should also work
            'http://xn--80aaxitdbjk.xn--p1ai',
        ],
        invalid: [
            'http://',
            'http://.',
            'http://..',
            'http://../',
            'http://?',
            'http://??',
            'http://??/',
            'http://#',
            'http://##',
            'http://##/',
            'http://foo.bar?q=Spaces should be encoded',
            '//',
            '//a',
            '///a',
            '///',
            'http:///a',
            'foo.com',
            'rdar://1234',
            'h://test',
            'http:// shouldfail.com',
            ':// should fail',
            'http://foo.bar/foo(bar)baz quux',
            'ftps://foo.bar/',
            'http://-error-.invalid/',
            // 'http://a.b--c.de/', // This is actually valid
            'http://-a.b.co',
            'http://a.b-.co',
            'http://0.0.0.0',
            'http://10.1.1.0',
            'http://10.1.1.255',
            'http://224.1.1.1',
            'http://1.1.1.1.1',
            'http://123.123.123',
            'http://3628126748',
            'http://.www.foo.bar/',
            // 'http://www.foo.bar./', // This is actually valid
            'http://.www.foo.bar./',
            'http://10.1.1.1',

            // Our additions
            'ftp://foo.bar/baz',
            'ssh://example.com',

            // Should not match localhost
            'http://localhost',
            'http://localhost:3000',
            'https://localhost',
            'https://localhost:3000',
            'http://127.0.0.1',
            'http://127.0.0.1:3000',
            'https://127.0.0.1',
            'https://127.0.0.1:3000',
        ],
    },
};

describe('regexps', () => {
    Object.entries(tests).forEach(([key, defs]) => {
        it(`${key} works`, () => {
            defs.valid.forEach((str) => {
                expect(str).toMatch(REGEXS[key]);
            });
            defs.invalid.forEach((str) => {
                expect(str).not.toMatch(REGEXS[key]);
            });
        });
    });
});

describe('SPLIT_PATH_REGEX', () => {
    it('works', () => {
        expect(
            '/aaa/bbb/ccc'.match(SPLIT_PATH_REGEX),
        ).toEqual([
            'aaa',
            'bbb',
            'ccc',
        ]);
    });
});
