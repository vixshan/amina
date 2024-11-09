import Logger from '@helpers/Logger'
import fetch, { Response, RequestInit } from 'node-fetch'

interface JsonResponse<T = any> {
  success: boolean
  status?: number
  data?: T
}

interface BufferResponse {
  success: boolean
  status?: number
  buffer?: Buffer
}

interface BinResponse {
  url: string
  short: string
  raw: string
}

export class HttpUtils {
  /**
   * Returns JSON response from url
   * @param {string} url - The URL to fetch from
   * @param {RequestInit} options - Fetch options
   */
  static async getJson<T = any>(
    url: string,
    options?: RequestInit
  ): Promise<JsonResponse<T>> {
    try {
      const response: Response = options
        ? await fetch(url, options)
        : await fetch(url)
      const json: T = await response.json()

      return {
        success: response.status === 200,
        status: response.status,
        data: json,
      }
    } catch (ex) {
      Logger.debug(`Url: ${url}`)
      Logger.error(`getJson`, ex as Error)
      return {
        success: false,
      }
    }
  }

  /**
   * Returns buffer from url
   * @param {string} url - The URL to fetch from
   * @param {RequestInit} options - Fetch options
   */
  static async getBuffer(
    url: string,
    options?: RequestInit
  ): Promise<BufferResponse> {
    try {
      const response: Response = options
        ? await fetch(url, options)
        : await fetch(url)
      const buffer: Buffer = await response.buffer()

      if (response.status !== 200) {
        Logger.debug(`Response: ${response.status} ${response.statusText}`)
      }

      return {
        success: response.status === 200,
        status: response.status,
        buffer,
      }
    } catch (ex) {
      Logger.debug(`Url: ${url}`)
      Logger.error('getBuffer', ex as Error)
      return {
        success: false,
      }
    }
  }
}
