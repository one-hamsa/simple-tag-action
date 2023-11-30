const { getOctokit, context } = require('@actions/github');
const core = require('@actions/core');

let octokit = null;

function getOctokitSingleton() {
    if (octokit) {
        return octokit;
    }

    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set myToken with the GitHub Secret Token
    // myToken: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    const myToken = core.getInput('myToken');
    if (!myToken) {
        core.setFailed('Missing myToken input.');
        return null;
    }

    const octokit = getOctokit(myToken);
    return octokit;
}

/**
 * 
 * @param {string} newTag new tag string
 * @param {boolean} createAnnotatedTag 
 * @param {string} GITHUB_SHA 
 * @param {string | undefined} message 
 */
async function createTag(
    newTag,
    createAnnotatedTag,
    GITHUB_SHA,
    message = undefined,
) {
    const octokit = getOctokitSingleton();

    /**
     * @type {import('@octokit/rest').Response<import('@octokit/rest').GitCreateTagResponse>}
     */
    let annotatedTag = undefined;

    if (createAnnotatedTag) {
        core.debug(`Creating annotated tag.`);

        annotatedTag = await octokit.rest.git.createTag({
            ...context.repo,
            tag: newTag,
            message: message ?? newTag,
            object: GITHUB_SHA,
            type: 'commit',
        });
    }

    core.debug(`Pushing new tag to the repo.`);
    await octokit.git.createRef({
        ...context.repo,
        ref: `refs/tags/${newTag}`,
        sha: annotatedTag ? annotatedTag.data.sha : GITHUB_SHA,
    });
}

async function run() {
    const { GITHUB_SHA } = process.env;

    const commitSha = core.getInput('commit_sha');
    const commitRef = commitSha || GITHUB_SHA;
    if (!commitRef) {
        core.setFailed('Missing commit_sha or GITHUB_SHA.');
        return;
    }

    const tag_name = core.getInput('tag');
    if (!tag_name) {
        core.setFailed('Missing tag input.');
        return;
    }

    const annotated_tag = core.getInput('annotated_tag') == 'true';

    const message = core.getInput('message');
    if (annotated_tag && !message) {
        core.notice('Annotated tag was requested but no message was provided.');
    }

    if (!annotated_tag && message) {
        core.warning('Message was provided but annotated tag was not requested.');
    }

    await createTag(
        tag_name,
        annotated_tag,
        commitRef,
        message
    );
}

run();