import 'babel-polyfill';
import inquirer from 'inquirer';
import open from 'open';
import { Spinner } from 'cli-spinner';

import { getBypassHeaders, search, getEpisodes, getEpisodeDownloadLink, getSeries, getVideoList, getVideoElement, determineType, getRealUrl } from './api';

async function chooseShow () {
let types = {"Movies":"Movie", "TvShows":"TV Show"};

  return new Promise((resolve, reject) => {
    inquirer.prompt([{
      type: "input",
      name: "showQuery",
      message: "What do you want to watch?",
      default: "modern"
    }], async function ({ showQuery }) {
      let shows = await search(showQuery);

      if (!shows.length) {
        if (showQuery) {
          console.log(`Couldn't find "${showQuery}"`);
        } else {
          console.log('Type the name of the tv show or movie you want to watch');
        }
        return chooseShow().then(resolve).catch(reject);
      }

      inquirer.prompt([{
        type: "list",
        name: "show",
        message: `Which one? (${shows.length} found)`,
        choices: shows.map(([guid, title]) => ({
          name: title,
          value: guid
        }))
      }], ({ show }) => {
        resolve(show);
      });
    });
  });
}

async function chooseSeries (show) {
  return new Promise(async function (resolve, reject) {
    let series = await getSeries(show);

    if (!series.length) {
      console.log(`Couldn't find any series`);
      return chooseShow().then(show => chooseSeries(show));
    }

    inquirer.prompt([{
      type: "list",
      name: "series",
      message: `Which series? (${series.length} found)`,
      choices: series.map(([guid, title]) => ({
        name: title,
        value: guid
      }))
    }], ({ series }) => {
      resolve(series);
    });
  });
}

async function chooseEpisode (series) {
  return new Promise(async function (resolve, reject) {
    let episodes = await getEpisodes(series);

    if (!episodes.length) {
      console.log(`Couldn't find any episodes`);
      return chooseShow().then(show => chooseSeries(show));
    }

    inquirer.prompt([{
      type: "list",
      name: "episode",
      message: `Which episode? (${episodes.length} found)`,
      choices: episodes.map(([guid, title]) => ({
        name: title,
        value: guid
      }))
    }], ({ episode }) => {
      resolve(episode);
    });
  });
}

async function chooseVideos (episode) {
  return new Promise(async function (resolve, reject) {
    let videolinks = await getVideoList(episode);

    if (!videolinks.length) {
      console.log(`Couldn't find any video links`);
      return chooseShow().then(show => chooseSeries(show));
    }

    inquirer.prompt([{
      type: "list",
      name: "videolink",
      message: `Which video link? (${videolinks.length} found)`,
      choices: videolinks.map(([guid, title]) => ({
        name: title,
        value: guid
      }))
    }], ({ videolink }) => {
      resolve(videolink);
    });
  });
}

async function parseVideo(videolink, headers = {}) {
  return new Promise(async function (resolve, reject) {
    let video = await getVideoElement(videolink, headers);
    resolve(video);
  });
}

async function getRealLink(videolink) {
  return new Promise(async function (resolve, reject) {
    let url = await getRealUrl(videolink);
    resolve(url);
  });
}

async function main () {
  let show = await chooseShow();
  let type = await determineType(show);

  if(type=="Serie"){
    let series = await chooseSeries(show);
    let episode = await chooseEpisode(series);
    let videoredirect = await chooseVideos(episode);
    let videolink = await getRealLink(videoredirect);

    let spinner = new Spinner('%s Bypassing DDoS protection..');
    spinner.setSpinnerString('|/-\\');
    spinner.start();
    let headers = await getBypassHeaders(videolink);
    spinner.stop(true);

    let video = await parseVideo(videolink, headers);

    let link = await getEpisodeDownloadLink(episode);
  } else {
    let link = await getEpisodeDownloadLink(show);
  }

  // console.log(`Opening ${link}`)
  // open(link);
}

main();
