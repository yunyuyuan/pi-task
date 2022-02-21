import axios from 'axios';
import CryptoJS from 'crypto-js';
import {notification} from "antd";

export const user = 'yunyuyuan',
  repo = 'pi-task',
  branch = 'master'

export async function post(data, token) {
  return await axios.post('https://api.github.com/graphql', {query: data}, {
    headers: {
      Authorization: 'token ' + token
    }
  });
}

function encodeB64(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

/** @description 是否管理员 */
export async function isAuthor(token) {
  try {
    const result = await post(`query {
    viewer {
      login
    }
  }`, token);
    const err = result.data.errors;
    if (err) {
      return false;
    } else {
      return result.data.data.viewer.login === user;
    }
  } catch (e) { }
}

/** @description 获取文件内容 */
export async function getFileContent(path, token) {
  try {
    const result = await post(`query {
      repository(owner: "${user}", name: "${repo}") {
        object(expression: "HEAD:${path}") {
          ... on Blob {
            text
          }
        }
      }
    }`, token);
    const err = result.data.errors;
    if (err) {
      notification.warn({
        message: err[0].type,
        description: err[0].message
      })
    } else {
      return result.data.data.repository.object.text;
    }
  } catch (e) {
    notification.error({
      message: 'Error!',
      description: e.toString(),
    })
  }
}

/** @description 获取最后一个 commit id */
async function getCommitId(token) {
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
  }`, token);
  const err = result.data.errors;
  if(err) {
    notification.warn({
      message: err[0].type,
      description: err[0].message
    })
  } else {
    return result.data.data.repository.defaultBranchRef.target.history.nodes[0].oid;
  }
}

/** @description 提交 Github commit */
export async function createCommit(token, commit='', additions = [], deletions = []) {
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
    const commitId = await getCommitId(token);
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
  }`, token);
    const err = result.data.errors;
    if (err) {
      notification.warn({
        message: err[0].type,
        description: err[0].message
      })
      return false;
    }
    return true;
  } catch (e) {
    notification.error({
      message: 'Error!',
      description: e.toString(),
    })
  }
}

// 加密解密
export function encrypt(text, pwd) {
  try {
    return CryptoJS.AES.encrypt(text, pwd).toString();
  } catch (e) {
    notification.error({
      message: '加密失败',
      description: e.toString(),
    });
    throw e;
  }
}

export function decrypt(text, pwd) {
  try {
    return CryptoJS.AES.decrypt(text, pwd).toString(CryptoJS.enc.Utf8) || text;
  } catch (e) {
    notification.error({
      message: '解密失败',
      description: e.toString(),
    })
    throw e;
  }
}
