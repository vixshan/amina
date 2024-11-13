import sourcebin from 'sourcebin_js'
import { error, debug } from '@helpers/Logger'
import fetch from 'node-fetch'

/**
 * Returns JSON response from url
 * @param {string} url
 * @param {object} options
 */
export const getJson = async (url, options) => {
  try {
    const response = options ? await fetch(url, options) : await fetch(url)
    const json = await response.json()
    return {
      success: response.status === 200,
      status: response.status,
      data: json,
    }
  } catch (ex) {
    debug(`Url: ${url}`)
    error(`getJson`, ex)
    return {
      success: false,
    }
  }
}

/**
 * Returns buffer from url
 * @param {string} url
 * @param {object} options
 */
export const getBuffer = async (url, options) => {
  try {
    const response = options ? await fetch(url, options) : await fetch(url)
    const buffer = await response.buffer()
    if (response.status !== 200) debug(response)
    return {
      success: response.status === 200,
      status: response.status,
      buffer,
    }
  } catch (ex) {
    debug(`Url: ${url}`)
    error(`getBuffer`, ex)
    return {
      success: false,
    }
  }
}

/**
 * Posts the provided content to the BIN
 * @param {string} content
 * @param {string} title
 */
export const postToBin = async (content, title) => {
  try {
    const response = await sourcebin.create(
      [
        {
          name: ' ',
          content,
          languageId: 'text',
        },
      ],
      {
        title,
        description: ' ',
      }
    )
    return {
      url: response.url,
      short: response.short,
      raw: `https://cdn.sourceb.in/bins/${response.key}/0`,
    }
  } catch (ex) {
    error(`postToBin`, ex)
  }
}
