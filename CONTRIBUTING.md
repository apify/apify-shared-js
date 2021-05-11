# Contributing to `apify-shared`

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change.

## Submitting a pull request

- Fork the project and install NPM dependencies. **NPM 7 is needed to have support for workspaces.**

    ```sh
    npm install
    ```

- Run tests before you start working, to be sure they all pass, and your setup is working correctly:

     ```sh
     npm test
     ```

- Be sure to **include appropriate test cases**.
- Follow defined coding standard, use `npm run lint` command to check it.
- Commit your changes using a descriptive commit message that follows defined
  [commit message conventions](#commit-message-guidelines). Adherence to these conventions is necessary because release notes are automatically generated from these messages.
- Push the code to your forked repository and create a pull request on GitHub.
- If somebody from project contributors suggest changes then:
    - Make the required updates.
    - Re-run all test suites to ensure tests are still passing.
    - Push the changes. No need to rebase/squash at this point, as the whole PR will be squash merged.
- Make sure the PR title and description is meaningful, as it will be used for the commit message in master.

That's it! Thank you for your contribution!

## Commit Message Guidelines

The project have very precise rules over how git commit messages can be formatted. This leads to
**more readable messages** that are easy to follow when looking through the **project history**. But also, git history is used to **generate the change log**.

The commit message format is borrowed from Angular projects, you can find
[more details here](https://www.conventionalcommits.org).

In a nutshell, all commit messages need to start with a commit type, that will then drive the version bumps:

- `fix: ...` will trigger a patch bump (1.0.x)
- `feat: ...` will trigger a minor bump (1.x.0)
- any commit with `BREAKING CHANGE: ...` in the footer will trigger a major bump (x.0.0)
    - the colon and the BC description is important, without it, it won't be considered a BC
- use can also use other types as `chore/build/test`, those will never trigger the publishing and won't be part of
  the changelog

Commit message itself should always be imperative (e.g. `add new logger`), and without trailing dot.
Keep message clean, simple and short. When needed, use extended description on new line (keep one
empty line to separate subject and body).

## Adding new package

This repository is managed via `lerna` and NPM workspaces. When adding new package, be sure to include all
the appropriate config files (`package.json`, `tsconfig.json` and `tsconfig.build.json`). It should be mostly
ok to just copy&paste one of the existing packages, wipe its contents and change the package name. Be sure
to clean up the dependencies as well. Keep all the scripts defined in the `package.json`, especially the `build` one.

## Dependencies between packages

If one package depends on another, this relation needs to be described in the `package.json`, either via
regular `dependencies` or via `peerDependencies`. This way `lerna` will know what package to build first,
as we need topological order when building/publishing.

We need to use absolute paths for such packages in the imports, e.g. from `@apify/utilities` we need to import
`@apify/consts`. If we want to import local file from the same package, we always need to use the relative path.
In other words, if we try to import `@apify/utilities` from inside `@apify/utilities`, it won't work when we build
the project.

## Testing

Tests are using `jest` and are written in TS. Just add a file into the `test` folder with a name ending `*.test.ts`
and they will get included automatically. We use `ts-jest` to execute them, so it is not necessary to build the
project first as we are using the TS files directly.

In tests, we need to use absolute paths to our packages, so `@apify/consts`, not `../../packages/consts/src/...`.

## Development dependencies

All dev dependencies should go to the root `package.json` file, as those are shared for the whole repository.
