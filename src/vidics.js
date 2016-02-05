import 'babel-polyfill';
import inquirer from 'inquirer';
import open from 'open';
import { Spinner } from 'cli-spinner';

import { search, getEpisodes, getEpisodeDownloadLink } from './api';

async function chooseShow () {
  return new Promise((resolve, reject) => {
    inquirer.prompt([{
      type: "input",
      name: "showQuery",
      message: "What do you want to watch?"
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

async function chooseSeries () {
  return new Promise((resolve, reject) => {
    inquirer.prompt([{
      type: "input",
      name: "showQuery",
      message: "What do you want to watch?"
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

async function chooseEpisode (show) {
  return new Promise(async function (resolve, reject) {
    let episodes = await getEpisodes(show);

    if (!episodes.length) {
      console.log(`Couldn't find any episodes`);
      return chooseShow().then(show => chooseEpisode(show));
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

async function main () {
  let show = await chooseShow();
  let series = await chooseSeries();
  let episode = await chooseEpisode(show);
  let link = await getEpisodeDownloadLink(show, episode);

  console.log(`Opening ${link}`)
  open(link);
}

main();
