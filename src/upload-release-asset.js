const core = require('@actions/core');
const { GitHub } = require('@actions/github');
const fs = require('fs');

async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const github = new GitHub(process.env.GITHUB_TOKEN);
    const ownerrepo = process.env.GITHUB_REPOSITORY;

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const releaseTag = core.getInput('tag_name', { required: true });
    const assetPath = core.getInput('asset_path', { required: true });
    const assetName = core.getInput('asset_name', { required: true });
    const assetContentType = core.getInput('asset_content_type', { required: true });

    // remove prefix on release tag
    var tag = releaseTag.replace("refs/tags/", "");

    var [owner, repo] = ownerrepo.split('/');

    // get upload URL
    var release = octokit.repos.getReleaseByTag({
      owner,
      repo,
      tag
    })

    console.log(`Release uploadURL ${release.upload_url}`)

    // create upload URL
    const uploadUrl = `https://api.github.com/repos/${ownerrepo}/releases/${tag}/assets?name=${assetName}`;
    console.log(`UploadUrl: ${uploadUrl}`);

    var files = fs.readdirSync('./dist');
    console.log(JSON.stringify(files));

    // Determine content-length for header to upload asset
    const contentLength = filePath => fs.statSync(filePath).size;

    // Setup headers for API call, see Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset for more information
    const headers = { 'content-type': assetContentType, 'content-length': contentLength(assetPath) };

    // Upload a release asset
    // API Documentation: https://developer.github.com/v3/repos/releases/#upload-a-release-asset
    // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset
    const uploadAssetResponse = await github.repos.uploadReleaseAsset({
      url: uploadUrl,
      headers,
      name: assetName,
      file: fs.readFileSync(assetPath)
    });

    // Get the browser_download_url for the uploaded release asset from the response
    const {
      data: { browser_download_url: browserDownloadUrl }
    } = uploadAssetResponse;

    // Set the output variable for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    core.setOutput('browser_download_url', browserDownloadUrl);
  } catch (error) {
    console.log(error);
    core.setFailed(error.message);
  }
}

module.exports = run;
