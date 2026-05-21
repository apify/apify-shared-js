// Robomongo / mongosh script that finds users whose username is on the forbidden list.
//
// The forbidden list (see packages/utilities/src/usernames.ts) keeps growing,
// so users created in the past may now hold a username that would be rejected
// today. This script lists the offending accounts so they can be reviewed.
//
// Output (tab-separated): username, profile.isPublic, createdAt, lastActivityAt

var candidates = [
    // Apify platform resources
    'dataset', 'datasets', 'key-value-store', 'request-queue', 'request-queues',
    'build', 'builds', 'schedule',

    // AI / LLM related
    'llms', 'agent', 'agents', 'chat', 'chatbot', 'chatgpt',
    'openai', 'anthropic', 'claude', 'gemini', 'copilot', 'mistral', 'llama',
    'prompt', 'prompts', 'embeddings', 'vectors',

    // Organizations / workspaces / permissions
    'org', 'orgs', 'organisation', 'organization',
    'workspace', 'workspaces', 'tenant', 'tenants',
    'role', 'roles', 'permission', 'permissions',

    // Auth / security
    'saml', 'scim', 'token', 'tokens', 'apikey', 'api-key', 'api-keys',
    'secret', 'secrets', 'keys',

    // Billing / commerce
    'invoice', 'invoices', 'coupon', 'coupons', 'discount', 'discounts', 'promos',
    'refund', 'refunds', 'credit', 'credits', 'wallet', 'billing-portal',

    // Infrastructure / environments
    'console', 'prod', 'production', 'canary', 'internal', 'restricted',

    // Communication
    'inbox', 'conversations', 'channel', 'channels', 'reactions', 'mentions',

    // Legal / trust / web standards
    'accessibility', 'imprint', 'impressum', 'trust', 'trust-center', 'security-center',
    'humans.txt', 'ads.txt', '.well-known',

    // Trust / verification / anti-impersonation handles
    'official', 'verified',
    'apify-support', 'apify-team', 'apify-admin', 'support-team',
    'noreply', 'no-reply', 'abuse',

    // Incidents / updates
    'outage', 'incident', 'incidents', 'whatsnew', 'what-is-new',
];

db.getCollection('users').find(
    {
        username: {
            $in: candidates,
        },
    },
    { username: 1, 'profile.isPublic': 1, createdAt: 1, lastActivityAt: 1 },
).sort({ username: 1 }).forEach(function (user) {
    var isPublic = user.profile && user.profile.isPublic !== undefined ? user.profile.isPublic : 'N/A';
    var created = user.createdAt ? user.createdAt.toISOString() : 'N/A';
    var lastActivity = user.lastActivityAt ? user.lastActivityAt.toISOString() : 'N/A';
    print(user.username + '\t' + isPublic + '\t' + created + '\t' + lastActivity);
});
