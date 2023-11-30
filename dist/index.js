/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 384:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 782:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const { getOctokit, context } = __nccwpck_require__(782);
const core = __nccwpck_require__(384);

let octokit = null;

function getOctokitSingleton() {
    if (octokit) {
        return octokit;
    }

    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set github_token with the GitHub Secret Token
    // github_token: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    const github_token = core.getInput('github_token');
    if (!github_token) {
        core.setFailed('Missing github_token input.');
        return null;
    }

    const octokit = getOctokit(github_token);
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
})();

module.exports = __webpack_exports__;
/******/ })()
;