import { describe, expect, it } from 'vitest';

import { isForbiddenUsername } from '@apify/utilities';

describe('isForbiddenUsername()', () => {
    it('works as expected', () => {
        expect(isForbiddenUsername('anonymous')).toBe(true);
        expect(isForbiddenUsername('admin')).toBe(true);
        expect(isForbiddenUsername('craWLers')).toBe(true);
        expect(isForbiddenUsername('for-developers')).toBe(true);
        expect(isForbiddenUsername('yourdomain')).toBe(true);

        // Special files
        expect(isForbiddenUsername('favicon.ICO')).toBe(true);
        expect(isForbiddenUsername('FAVICON.ico')).toBe(true);
        expect(isForbiddenUsername('apple-touch-icon.png')).toBe(true);
        expect(isForbiddenUsername('apple-touch-icon-180x180.png')).toBe(true);
        expect(isForbiddenUsername('index.html')).toBe(true);
        expect(isForbiddenUsername('robots.txt')).toBe(true);
        expect(isForbiddenUsername('index')).toBe(true);
        expect(isForbiddenUsername('google6d0b9d7407741f6a.html')).toBe(true);
        expect(isForbiddenUsername('BingSiteAuth.XML')).toBe(true);
        expect(isForbiddenUsername('llms.txt')).toBe(true);
        expect(isForbiddenUsername('llms-full.txt')).toBe(true);
        expect(isForbiddenUsername('AGENTS.md')).toBe(true);
        expect(isForbiddenUsername('agents.MD')).toBe(true);
        expect(isForbiddenUsername('CLAUDE.md')).toBe(true);
        expect(isForbiddenUsername('claude.MD')).toBe(true);

        // Agentic protocols and payment standards
        expect(isForbiddenUsername('x402')).toBe(true);
        expect(isForbiddenUsername('X402')).toBe(true);
        expect(isForbiddenUsername('mpp')).toBe(true);
        expect(isForbiddenUsername('a2a')).toBe(true);
        expect(isForbiddenUsername('ap2')).toBe(true);
        expect(isForbiddenUsername('acp')).toBe(true);
        expect(isForbiddenUsername('ucp')).toBe(true);
        expect(isForbiddenUsername('l402')).toBe(true);
        expect(isForbiddenUsername('kyapay')).toBe(true);
        expect(isForbiddenUsername('agentic-commerce')).toBe(true);

        // AI / agent generic terms
        expect(isForbiddenUsername('agent')).toBe(true);
        expect(isForbiddenUsername('agents')).toBe(true);
        expect(isForbiddenUsername('agentic')).toBe(true);
        expect(isForbiddenUsername('crawlee')).toBe(true);
        expect(isForbiddenUsername('chatbot')).toBe(true);
        expect(isForbiddenUsername('chatgpt')).toBe(true);
        expect(isForbiddenUsername('gemini')).toBe(true);
        expect(isForbiddenUsername('llama')).toBe(true);

        // Apify-specific routes / features
        expect(isForbiddenUsername('contact-sales')).toBe(true);
        expect(isForbiddenUsername('creator-plan')).toBe(true);
        expect(isForbiddenUsername('standby')).toBe(true);
        expect(isForbiddenUsername('pay-per-event')).toBe(true);
        expect(isForbiddenUsername('compute-unit')).toBe(true);
        expect(isForbiddenUsername('build')).toBe(true);
        expect(isForbiddenUsername('dataset')).toBe(true);
        expect(isForbiddenUsername('datasets')).toBe(true);

        // Organizations / workspaces / permissions
        expect(isForbiddenUsername('org')).toBe(true);
        expect(isForbiddenUsername('organisation')).toBe(true);
        expect(isForbiddenUsername('workspace')).toBe(true);
        expect(isForbiddenUsername('role')).toBe(true);
        expect(isForbiddenUsername('roles')).toBe(true);

        // Auth / security
        expect(isForbiddenUsername('apikey')).toBe(true);
        expect(isForbiddenUsername('keys')).toBe(true);
        expect(isForbiddenUsername('secret')).toBe(true);
        expect(isForbiddenUsername('secrets')).toBe(true);

        // Infrastructure / environments
        expect(isForbiddenUsername('prod')).toBe(true);
        expect(isForbiddenUsername('internal')).toBe(true);

        // Communication
        expect(isForbiddenUsername('channel')).toBe(true);
        expect(isForbiddenUsername('channels')).toBe(true);
        expect(isForbiddenUsername('inbox')).toBe(true);
        expect(isForbiddenUsername('no-reply')).toBe(true);
        expect(isForbiddenUsername('noreply')).toBe(true);

        // Billing / commerce
        expect(isForbiddenUsername('wallet')).toBe(true);

        // Incidents / updates
        expect(isForbiddenUsername('whatsnew')).toBe(true);

        // All hidden files
        expect(isForbiddenUsername('.hidden')).toBe(true);
        expect(isForbiddenUsername('.a')).toBe(true);
        expect(isForbiddenUsername('.')).toBe(true);
        expect(isForbiddenUsername('..')).toBe(true);
        expect(isForbiddenUsername('...')).toBe(true);
        expect(isForbiddenUsername('.htaccess')).toBe(true);
        expect(isForbiddenUsername('.well-known')).toBe(true);

        // Strings not starting with letter or number
        expect(isForbiddenUsername('_karlyolo')).toBe(true);
        expect(isForbiddenUsername('.karlyolo')).toBe(true);
        expect(isForbiddenUsername('-karlyolo')).toBe(true);
        expect(isForbiddenUsername('___')).toBe(true);
        expect(isForbiddenUsername('---')).toBe(true);
        expect(isForbiddenUsername('...')).toBe(true);

        // Strings not ending with letter or number
        expect(isForbiddenUsername('karlyolo_')).toBe(true);
        expect(isForbiddenUsername('karlyolo.')).toBe(true);
        expect(isForbiddenUsername('karlyolo-')).toBe(true);

        // Strings where there's more than one underscore, comma or dash in row
        expect(isForbiddenUsername('karl..yolo')).toBe(true);
        expect(isForbiddenUsername('karl.-yolo')).toBe(true);
        expect(isForbiddenUsername('karl.-.yolo')).toBe(true);
        expect(isForbiddenUsername('karl--yolo')).toBe(true);
        expect(isForbiddenUsername('karl---yolo')).toBe(true);
        expect(isForbiddenUsername('karl__yolo')).toBe(true);
        expect(isForbiddenUsername('karl__.yolo')).toBe(true);

        // Adult-content keywords are blocked only as whole words (boundary check
        // on both sides), so the keyword alone or with non-letter separators matches,
        // but legitimate names that merely contain the keyword as a substring do not.
        expect(isForbiddenUsername('porn')).toBe(true);
        expect(isForbiddenUsername('my-porn-site')).toBe(true);
        expect(isForbiddenUsername('PORN')).toBe(true);
        expect(isForbiddenUsername('vagina-lover')).toBe(true);
        expect(isForbiddenUsername('dildo-shop')).toBe(true);
        expect(isForbiddenUsername('nsfw-content')).toBe(true);
        expect(isForbiddenUsername('hentai-fan')).toBe(true);
        expect(isForbiddenUsername('cunt123')).toBe(true);
        expect(isForbiddenUsername('shit-show')).toBe(true);
        expect(isForbiddenUsername('bitch-mode')).toBe(true);
        expect(isForbiddenUsername('whore-house')).toBe(true);
        expect(isForbiddenUsername('cock')).toBe(true);
        expect(isForbiddenUsername('big-cock')).toBe(true);
        expect(isForbiddenUsername('cock-lover')).toBe(true);
        expect(isForbiddenUsername('dick')).toBe(true);
        expect(isForbiddenUsername('my-dick')).toBe(true);
        expect(isForbiddenUsername('anus')).toBe(true);
        expect(isForbiddenUsername('my-anus')).toBe(true);
        expect(isForbiddenUsername('pussy')).toBe(true);
        expect(isForbiddenUsername('wet-pussy')).toBe(true);
        expect(isForbiddenUsername('nude')).toBe(true);
        expect(isForbiddenUsername('nude-pics')).toBe(true);
        expect(isForbiddenUsername('penis')).toBe(true);
        expect(isForbiddenUsername('big-penis')).toBe(true);
        expect(isForbiddenUsername('naked')).toBe(true);
        expect(isForbiddenUsername('naked-pics')).toBe(true);

        // Verify no false positives for common names and legitimate words.
        expect(isForbiddenUsername('akshit')).toBe(false);
        expect(isForbiddenUsername('akshit_trivedi')).toBe(false);
        expect(isForbiddenUsername('pornography')).toBe(false);
        expect(isForbiddenUsername('bullshit')).toBe(false);
        expect(isForbiddenUsername('slutty')).toBe(false);
        expect(isForbiddenUsername('scunthorpe')).toBe(false);
        expect(isForbiddenUsername('dickens')).toBe(false);
        expect(isForbiddenUsername('dickson')).toBe(false);
        expect(isForbiddenUsername('hancock')).toBe(false);
        expect(isForbiddenUsername('peacock')).toBe(false);
        expect(isForbiddenUsername('cockpit')).toBe(false);
        expect(isForbiddenUsername('uranus')).toBe(false);
        expect(isForbiddenUsername('janus')).toBe(false);
        expect(isForbiddenUsername('pussycat')).toBe(false);
        expect(isForbiddenUsername('pussywillow')).toBe(false);
        expect(isForbiddenUsername('nudelman')).toBe(false);
        expect(isForbiddenUsername('penistone')).toBe(false);
        expect(isForbiddenUsername('snaked')).toBe(false);

        // Test valid usernames
        expect(!isForbiddenUsername('apify')).toBe(true);
        expect(!isForbiddenUsername('APIFY')).toBe(true);
        expect(!isForbiddenUsername('jannovak')).toBe(true);
        expect(!isForbiddenUsername('jan.novak')).toBe(true);
        expect(!isForbiddenUsername('jan.novak.YOLO')).toBe(true);
        expect(!isForbiddenUsername('jan.novak-YOLO')).toBe(true);
        expect(!isForbiddenUsername('jan_novak-YOLO')).toBe(true);
        expect(!isForbiddenUsername('jan-novak')).toBe(true);
        expect(!isForbiddenUsername('jan_novak')).toBe(true);
        expect(!isForbiddenUsername('a.b_c-d.0-1_2.3')).toBe(true);
        expect(!isForbiddenUsername('0123456789')).toBe(true);
        expect(!isForbiddenUsername('01234.56789')).toBe(true);
        expect(!isForbiddenUsername('1aaaaa5')).toBe(true);

        // Apify ID
        expect(isForbiddenUsername('yZtyxMUADJHyInTId')).toBe(true);
        expect(isForbiddenUsername('yZtyxMUADJHyInTI')).toBe(false);

        // Some correct ones
        expect(isForbiddenUsername('karel')).toBe(false);
        expect(isForbiddenUsername('karel1234')).toBe(false);
        expect(isForbiddenUsername('karel.novak')).toBe(false);

        // apify.com pattern (unescaped "." matches any character)
        expect(isForbiddenUsername('apify.com')).toBe(true);
        expect(isForbiddenUsername('apify_com')).toBe(true);
        expect(isForbiddenUsername('apifyxcom')).toBe(true);
    });
});
