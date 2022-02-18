import axios from 'axios';
import {token} from "./data";
import {notification} from "antd";

export const user = 'yunyuyuan',
  repo = 'pi-task',
  branch = 'master'

export async function post(data) {
  if (!token.value) return ;
  return await axios.post('https://api.github.com/graphql', {query: data}, {
    headers: {
      Authorization: 'token ' + token.value
    }
  });
}

function encodeB64(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

/** @description 是否管理员 */
export async function isAuthor() {
  try {
    const result = await post(`query {
    viewer {
      login
    }
  }`);
    const err = result.data.errors;
    if (err) {
      return false;
    } else {
      return result.data.data.viewer.login === user;
    }
  } catch (e) { }
}

/** @description 获取最后一个 commit id */
async function getCommitId() {
  const result = await post(`query {
    repository(name: "${repo}", owner: "${user}") {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 1) {
              nodes {
                oid
              }
            }
          }
        }
      }
    }
  }`);
  const err = result.data.errors;
  if(err) {
    notification.open({
      message: err[0].type,
      description: err[0].message
    })
  } else {
    return result.data.data.repository.defaultBranchRef.target.history.nodes[0].oid;
  }
}

/** @description 提交 Github commit */
export async function createCommit(commit='', additions = [], deletions = []) {
  let add = '',
    del = '';
  if (additions.length) {
    add = 'additions: [';
    additions.forEach(item => {
      add += `{path: "${item.path}",contents: "${encodeB64(item.content)}"},`;
    })
    add += '],';
  }
  if (deletions.length) {
    del = 'deletions: [';
    deletions.forEach(item => {
      del += `{path: "${item.path}"},`;
    })
    del += ']';
  }
  try {
    const commitId = await getCommitId();
    if (!commitId) return false;
    const result = await post(`mutation {
    createCommitOnBranch(
      input: {
        branch: {
          branchName: "${branch}",
          repositoryNameWithOwner: "${user}/${repo}"
        },
        message: {
          headline: "${commit}"
        },
        expectedHeadOid: "${commitId}",
        fileChanges: {
          ${add}
          ${del}
        }
      }
    ) {
      clientMutationId
    }
  }`);
    const err = result.data.errors;
    if (err) {
      notification.open({
        message: err[0].type,
        description: err[0].message
      })
      return false;
    }
    return true;
  } catch (e) {
    notification.open({
      message: 'Error!',
      description: e,
    })
  }
}
