import 'babel-polyfill';
import inquirer from 'inquirer';
import open from 'open';
import { Spinner } from 'cli-spinner';

import { getBypassHeaders, search, getEpisodes, getEpisodeDownloadLink } from './api';

async function chooseShow (headers = {}) {
  return new Promise((resolve, reject) => {
    inquirer.prompt([{
      type: "input",
      name: "showQuery",
      message: "What cartoon do you want to watch?"
    }], async function ({ showQuery }) {
      let shows = await search(showQuery, headers);

      if (!shows.length) {
        if (showQuery) {
          console.log(`Couldn't find "${showQuery}"`);
        } else {
          console.log('Type the name of the cartoon you want to watch');
        }
        return chooseShow(headers).then(resolve).catch(reject);
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

async function chooseEpisode (show, headers = {}) {
  return new Promise(async function (resolve, reject) {
    let episodes = await getEpisodes(show, headers);

    if (!episodes.length) {
      console.log(`Couldn't find any episodes`);
      return chooseShow(headers).then(show => chooseEpisode(show, headers));
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
  let spinner = new Spinner('%s Bypassing DDoS protection..');
  spinner.setSpinnerString('|/-\\');
  spinner.start();
  let headers = await getBypassHeaders();
  spinner.stop(true);

  let show = await chooseShow(headers);
  let episode = await chooseEpisode(show, headers);
  let link = await getEpisodeDownloadLink(show, episode, headers);

  console.log(`Opening ${link}`)
  open(link);
}

main();
