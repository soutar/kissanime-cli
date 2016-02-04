import cloudscraper from 'cloudscraper';
import FormData from 'form-data';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import fs from 'fs';

import asp from './asp';

const baseUrl = 'http://kisscartoon.me';
const contentType = 'Cartoon';
const headersCache = './.cfheaderscache';

function tryCachedHeaders () {
  try {
      var headers = JSON.parse(fs.readFileSync(headersCache).toString('utf-8'));
  } catch (e) {
      return false;
  }

  return fetch(baseUrl, { headers })
    .then(res => (res.status === 200) ? headers : false);
}

function cacheHeaders (headers = {}) {
  fs.writeFileSync(headersCache, JSON.stringify(headers));
}

export async function getBypassHeaders () {
    let cached = await tryCachedHeaders();
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve, reject) => {
      cloudscraper.get(
        baseUrl,
        (error, response, body) => {
          if (error) reject(error);
          resolve(response.request.headers);
          cacheHeaders(response.request.headers);
        },
        { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.97 Safari/537.36' }
      );
    });
}

export function createFormData (data = {}) {
  return Object.keys(data).reduce((form, key) => {
    form.append(key, data[key]);
    return form;
  }, new FormData());
}

export function search (keyword = '', headers = {}) {
  const form = createFormData({ type: contentType, keyword });
  return fetch(
    `${baseUrl}/Search/SearchSuggest`,
    { method: 'POST', body: form, headers }
  ).then(res => res.text()).then(res => {
    const $ = cheerio.load(res);
    const results = $('a');

    return nodeArrayFromCheerio(results)
      .map(node => [parseGuidFromUrl(node.attribs.href), node.children[0].data])
  }).catch(err => { console.log(err); return err; });
}

export function parseGuidFromUrl (url) {
  return url.split('/').reverse()[0];
}

export function nodeArrayFromCheerio (cheerio) {
  return Object.keys(cheerio)
    .filter(key => !isNaN(key))
    .sort((a, b) => a - b)
    .map(key => cheerio[key]);
}

export function getEpisodes (programmeGuid, headers = {}) {
  return fetch(`${baseUrl}/${contentType}/${programmeGuid}`, { headers })
    .then(res => res.text())
    .then(text => {
      const $ = cheerio.load(text);
      const results = $('table.listing td a');
      return nodeArrayFromCheerio(results)
          .map(node => {
            return [parseGuidFromUrl(node.attribs.href), node.children[0].data.trim()];
          }).reverse();
    }).catch(err => { console.log(err); return err; })
}

export function getEpisodeDownloadLink (programmeGuid, episodeGuid, headers = {}) {
  return fetch(`${baseUrl}/${contentType}/${programmeGuid}/${episodeGuid}`, { headers })
    .then(res => {
      if (res.status !== 200) {
        throw res.status
      }

      return res.text()
    })
    .then(text => {
      const $ = cheerio.load(text);
      const file = asp.wrap($('#selectQuality').val());
      return file;
    });
}
