import FormData from 'form-data';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import fs from 'fs';

import asp from './asp';

const baseUrl = 'http://vidics.ch';
const goodLinks = ["Vodlocker.com", "Thevideo.me", "Vidto.me"];

export function createFormData (data = {}) {
  return Object.keys(data).reduce((form, key) => {
    form.append(key, data[key]);
    return form;
  }, new FormData());
}

export function search (keyword = '') {
  const form = createFormData({ ajax: 1 });
  return fetch(
    `${baseUrl}/searchSuggest/FilmsAndTV/${keyword}`,
    { method: 'POST', body: form }
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

export function getEpisodes (seriesGuid) {
  return fetch(`${baseUrl}${seriesGuid}`)
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

export function getVideoList (episodeGuid) {
    return fetch(`${baseUrl}${episodeGuid}`)
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

export function getVideoElement (videoUrl) {
     return fetch(`${baseUrl}${videoUrl}`)
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

        return fetch(`${baseUrl}${videoUrl}`, { method: 'POST', body: form })
        .then(res => res.text())
        .then(text => {
            console.log(text);
            const pattern = RegExp("(http(s)?)[A-Za-z0-9%?=&:/._-]*[.]{1}(mp4(?!.jpg)|webm|ogg)([?]{1}[A-Za-z0-9%?=&:/.-_;-]*)?", "ig");
            const matches = text.match(pattern);
            console.log(matches);
        });
    });
}

export function getEpisodeDownloadLink (episodeGuid) {
  return fetch(`${baseUrl}${episodeGuid}`)
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
