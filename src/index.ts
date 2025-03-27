import { getOctokit, context } from '@actions/github';
import * as core from '@actions/core';

let octokit: ReturnType<typeof getOctokit> | null = null;

function getOctokitSingleton() {
    if (octokit !== null) {
        return octokit;
    }

    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set github_token with the GitHub Secret Token
    // github_token: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    const github_token = core.getInput('github_token');
    // if (!github_token) {
    //     core.setFailed('Missing github_token input.');
    //     return null;
    // }

    return getOctokit(github_token);
}

/**
 * 
 * @param {string} newTag new tag string
 * @param {boolean} createAnnotatedTag 
 * @param {string} commitSha 
 * @param {string | undefined} message 
 */
async function createTag(
    newTag: string,
    createAnnotatedTag: boolean,
    commitSha: string,
    message: string | undefined = undefined,
) {
    const octokit = getOctokitSingleton();

    let annotatedTag: Awaited<ReturnType<typeof octokit.rest.git.createTag>> | undefined = undefined;

    if (createAnnotatedTag) {
        core.debug(`Creating annotated tag.`);

        annotatedTag = await octokit.rest.git.createTag({
            ...context.repo,
            tag: newTag,
            message: message ?? newTag,
            object: commitSha,
            type: 'commit',
        });
    }

    core.debug(`Pushing new tag to the repo.`);
    await octokit.rest.git.createRef({
        ...context.repo,
        ref: `refs/tags/${newTag}`,
        sha: annotatedTag ? annotatedTag.data.sha : commitSha,
    });
}

async function run() {
    const { GITHUB_SHA } = process.env;

    const commitRef = core.getInput('ref');

    let commitSha = GITHUB_SHA;
    if (commitRef) {
        const octokit = getOctokitSingleton();

        const { data: refData } = await octokit.rest.git.getRef({
            ...context.repo,
            ref: commitRef,
        });

        commitSha = refData.object.sha;

        if (!commitSha) {
            core.setFailed(`Unable to find sha for ref ${commitRef}`);
            return;
        }
    }
    else if (!commitSha) {
        core.setFailed('Missing GITHUB_SHA environment variable and no ref input provided.');
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
        commitSha,
        message
    );
}

run();
