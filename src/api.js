import FormData from 'form-data';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import fs from 'fs';

import asp from './asp';

const baseUrl = 'http://vidics.ch';

export function createFormData (data = {}) {
  return Object.keys(data).reduce((form, key) => {
    form.append(key, data[key]);
    return form;
  }, new FormData());
}

export function search (keyword = '', type = 'FilmsAndTV') {
    console.log(type);
  const form = createFormData({ ajax: 1 });
  return fetch(
    `${baseUrl}/searchSuggest/${type}/${keyword}`,
    { method: 'POST', body: form }
  ).then(res => res.text()).then(res => {
    const $ = cheerio.load(res);
    const results = $('.searchitem a').not('.blue');

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

export function getEpisodes (programmeGuid) {
  return fetch(`${baseUrl}/Anime/${programmeGuid}`)
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

export function getEpisodeDownloadLink (programmeGuid, episodeGuid) {
  return fetch(`${baseUrl}/Anime/${programmeGuid}/${episodeGuid}`)
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
