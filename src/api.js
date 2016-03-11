import cloudscraper from 'cloudscraper';
import FormData from 'form-data';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import fs from 'fs';
import videoSource from 'video-source';
import gunzip from 'gunzip-maybe';

import asp from './asp';

const baseUrl = 'http://vidics.ch';
const headersCache = './.cfheaderscache';
const goodLinks = ["Vodlocker.com", "Thevideo.me", "Vidto.me"];

function tryCachedHeaders (url) {
  try {
      var headers = JSON.parse(fs.readFileSync(headersCache).toString('utf-8'));
  } catch (e) {
      return false;
  }

  return fetch(url, { headers })
    .then(res => (res.status === 200) ? headers : false);
}

function cacheHeaders (headers = {}) {
  fs.writeFileSync(headersCache, JSON.stringify(headers));
}

export async function getBypassHeaders (videolink = "") {
    return new Promise((resolve, reject) => {
      cloudscraper.get(
        baseUrl + videolink,
        (error, response, body) => {
          if (error) reject(error);
          resolve(response.request.headers);
          cacheHeaders(response.request.headers);
        });
    });
}

export function createFormData (data = {}) {
  return Object.keys(data).reduce((form, key) => {
    form.append(key, data[key]);
    return form;
  }, new FormData());
}

export function search (keyword = '', headers = {}) {
  const form = createFormData({ ajax: 1 });
  return fetch(
    `${baseUrl}/searchSuggest/FilmsAndTV/${keyword}`,
    { method: 'POST', body: form, headers }
  ).then(res => res.text()).then(res => {
    const $ = cheerio.load(res);
    const results = $('.searchitem a').not('.blue');

    return nodeArrayFromCheerio(results)
      .map(node => [node.attribs.href, node.children[0].data])
  }).catch(err => { console.log(err); return err; });
}

export function nodeArrayFromCheerio (cheerio) {
  return Object.keys(cheerio)
    .filter(key => !isNaN(key))
    .sort((a, b) => a - b)
    .map(key => cheerio[key]);
}

export function getSeries (programmeGuid) {
  return fetch(`${baseUrl}${programmeGuid}`)
    .then(res => res.text())
    .then(text => {
      const $ = cheerio.load(text);
      const results = $('h3.season_header a');
      return nodeArrayFromCheerio(results)
      .map(node => {
        return [node.attribs.href, node.children[0].data.trim()];
      }).reverse();
    }).catch(err => { console.log(err); return err; })
}

export function getEpisodes (seriesGuid, headers = {}) {
  return fetch(`${baseUrl}${seriesGuid}`, { headers })
    .then(res => res.text())
    .then(text => {
      const $ = cheerio.load(text);
      const results = $('a.episode');
      return nodeArrayFromCheerio(results)
      .map(node => {
        return [node.attribs.href, node.children[0].data.trim() + " " + node.children[1].children[0].data.trim()];
      }).reverse();
    }).catch(err => { console.log(err); return err; })
}

export function getVideoList (episodeGuid, headers = {}) {
    return fetch(`${baseUrl}${episodeGuid}`, { headers })
    .then(res => res.text())
    .then(text => {
      const $ = cheerio.load(text);
      const results = $('#linkLangHide1').parent().find('div.movie_link a.p1');
      return nodeArrayFromCheerio(results)
      .map(node => {
        return [node.attribs.href, node.children[0].data.trim()];
      }).filter(item => {
        return goodLinks.includes(item[1]);
      }).sort((a, b) => {
        return goodLinks.indexOf(a[1]) - goodLinks.indexOf(b[1]);
      });
    }).catch(err => { console.log(err); return err; })
}

export function getRealUrl (videoLink) {
    return fetch(`${baseUrl}${videoLink}`)
    .then(res => {
        return res.url;
    });
}

export function getVideoElement (videoUrl, headers = {}) {
     return fetch(`${videoUrl}`, { headers })
    .then(res => res.text())
    .then(text => {
        const $ = cheerio.load(text);

        const form = createFormData({
            op: $('input[name="op"]')[1].attribs.value,
            usr_login: $('input[name="usr_login"]')[0].attribs.value,
            id: $('input[name="id"]')[0].attribs.value,
            fname: $('input[name="fname"]')[0].attribs.value,
            referer: $('input[name="referer"]')[0].attribs.value,
            hash: $('input[name="hash"]')[0].attribs.value,
            imhuman: $('input[name="imhuman"]')[0].attribs.value,
        });

        return new Promise((resolve, reject) => {
          cloudscraper.post(
            videoUrl,
            {body: form},
            (error, response, body) => {
              if (error) reject(error);
            });
        });

        // return fetch(`${videoUrl}`, { method: 'POST', body: form, headers })
        // .then(res => res.text())
        // .then(text => {
        //     console.log(text);
        //     const pattern = RegExp("(http(s)?)[A-Za-z0-9%?=&:/._-]*[.]{1}(mp4(?!.jpg)|webm|ogg)([?]{1}[A-Za-z0-9%?=&:/.-_;-]*)?", "ig");
        //     const matches = text.match(pattern);
        //     console.log(matches);
        // });
    });
}

export function getEpisodeDownloadLink (episodeGuid, headers = {}) {
  return fetch(`${baseUrl}${episodeGuid}`, { headers })
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

export function determineType(url) {
    return url.split('/')[1];
}

export function getVideoLocation(url) {
    videoSource.getInfo(url).then(function (info) {
        return info.url;
    });
}
