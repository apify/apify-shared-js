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
            'a.b+123~@example.com',
            'test@example.com',
            'a-b@example.at',
            'test@my.example.com',
            'test@my-super.example.com',
            'a.b.c+123~@example.com',
            'a.b.c.d@example.com',
        ],
        invalid: [
            ' test@example.com',
            'test@example.com ',
            'test@@example.com',
            'test@localhost',
            'not an email',
            '@example.com',
            'test..test@example.com',
            'test.@example.com',
            '.test@example.com',
            '...test@example.com',
            'example@-test.com',
            'example@.test.test.com',
            // no underscore in domain name now but the standards are not 100% clear, might be reviewed
            'test@example_example.com',
        ],
    },

    COMMA_SEPARATED_EMAILS_REGEX: {
        valid: [
            'test@example.com , foo@example.com,bar@example.com',
            'test@example.com',
            'test@example.com,foo@example.com',
            'test@example.com, foo@example.com',
            'test@example.com ,foo@example.com',
            'test@example.com,a.b.c+123~@example.com,bar@example.com',
        ],
        invalid: [
            '',
            'not an email',
            'not, an, email',
            'not-an-email@',
            'not-an-email@,',
            'test@example.com ,@example.com',
            'test@example.com,,foo@example.com',
            'test@example.com,foo@example.com.',
            'test@example.com,... foo@example.com',
            'test@example.com, foo@example,com',
            'test@example.com\n,foo@example.com',
            'test@example.com,foo@example.com\n',
            '\ntest@example.com,foo@example.com',
            'test@example.com\t,foo@example.com',
            'test@example.com ,foo@example.com ',
            'not-an-email,test@example.com',
            'test@example.com, not-an-email',
            ' test@example.com',
            'test@example.com foo@example.com',
            'test@example.comfoo@example.com',
            ',test@example.com ,foo@example.com',
            'test@example.com,foo.@example.com',
            'test@example.com,foo@example.com,bar@example.com,',
            'test@example.com,foo@example.com,bar@example.com,fff@.com',
            'test@example.com,a.b.c+123~@example.com,bar@@example.com',
            'test@example.com,a.b.c+123~@example_foo.com,bar@@example.com',
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
    LINKEDIN_PROFILE_REGEX: {
        valid: [
            'https://www.linkedin.com/in/username',
            'https://www.linkedin.com/in/user-name',
            'https://www.linkedin.com/in/user_name',
            'https://linkedin.com/in/username',
            'http://linkedin.com/in/username',
            'https://www.linkedin.com/company/companyname',
            'https://linkedin.com/company/companyname',
            'http://linkedin.com/company/companyname',
            'https://www.cz.linkedin.com/in/username/',
            'https://cz.linkedin.com/company/apifytech',
            'http://cz.linkedin.com/company/apifytech',
            'https://www.linkedin.com/in/martin-kri%C5%A1tof-b6b78177/',
            'https://www.linkedin.com/in/jan%20novak',
        ],
        invalid: [
            'https://www.linkedin.com/in/',
            'https://www.linkedin.com/in',
            'https://www.linkedin.com/company/',
            'https://www.linkedin.com/company',
            'https://www.linkedin.com/in/username/extra',
            'https://www.linkedin.com/in/username/extra/',
            'https://www.linkedin.com/company/companyname/extra',
            'https://www.linkedin.com/company/companyname/extra/',
            'https://www.linkedin.com/in/username/extra/extra',
            'https://www.linkedin.com/in/username/extra/extra/',
            'https://www.linkedin.com/company/companyname/extra/extra',
            'https://www.linkedin.com/company/companyname/extra/extra/',
        ],
    },
    PROXY_URL_REGEX: {
        valid: [
            'http://asd:qweqwe@proxy.apify.com:8000',
            'http://asd:qweqwe@proxy.apify.com:8000',
            'http://123123:qweqwe:asdasd@proxy.com:55555',
            'http://proxy.apify.com:5000',
            'http://root@proxy.apify.com:5000',
            'https://proxy.apify.com:5000',
            'socks://proxy.apify.com:5000',
            'socks4://proxy.apify.com:5000',
            'socks4a://proxy.apify.com:5000',
            'socks5://proxy.apify.com:5000',
            'socks5h://proxy.apify.com:5000',
        ],
        invalid: [
            'http://@proxy.apify.com:8000/',
            'https://proxy.apify.com',
            'httpss://proxy.apify.com:5000',
            'htt://proxy.apify.com:5000',
            'soks://proxy.apify.com:5000',
            'socks3://proxy.apify.com:5000',
            'socks6://proxy.apify.com:5000',
        ],
    },
};

describe('regexps', () => {
    Object.entries(tests).forEach(([key, defs]) => {
        it(`${key} works`, () => {
            defs.valid.forEach((str) => {
                expect(str).toMatch(REGEXS[key]);
                // The `test` or `exec` function sets `lastIndex` property of RegExp with the `g` or `y` flag.
                // RegExp keeps the index of last match in this property.
                // If lastIndex is greater than the length of the input, exec() or test() will not find a match.
                // This could lead to confusing behaviour where e.g. test on email regexp result in false even with valid email.
                expect(REGEXS[key].test(str)).toEqual(true);
            });
            defs.invalid.forEach((str) => {
                expect(str).not.toMatch(REGEXS[key]);
                expect(REGEXS[key].test(str)).toEqual(false);
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
