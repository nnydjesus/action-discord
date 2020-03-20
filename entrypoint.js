const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');
const { argv } = require('yargs');
const core = require('@actions/core');

const REQUIRED_ENV_VARS = [
  'GITHUB_EVENT_PATH',
  'GITHUB_REPOSITORY',
  'GITHUB_WORKFLOW',
  'GITHUB_ACTOR',
  'GITHUB_EVENT_NAME',
  'GITHUB_ACTION',
  'DISCORD_WEBHOOK'
];

REQUIRED_ENV_VARS.forEach(env => {
  if (!process.env[env] || !process.env[env].length) {
    console.error(
      `Env var ${env} is not defined. Maybe try to set it if you are running the script manually.`
    );
    process.exit(1);
  }
});

const eventContent = fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8');

_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

let url;
let payload;
var content = core.getInput('content', { required: false });

const eventPayload = JSON.parse(eventContent)

console.log(JSON.stringify({ content: content }))

if (content) {
  content = JSON.parse(_.template(content)({ ...process.env, EVENT_PAYLOAD: eventPayload }));
}

var embed = {}

embed.title = _.template(core.getInput('title'))({ ...process.env, EVENT_PAYLOAD: eventPayload });
embed.description = _.template(core.getInput('description'))({ ...process.env, EVENT_PAYLOAD: eventPayload });
embed.color = core.getInput('color');

if (core.getInput('author')) {
  embed.author = {
    name: eventPayload.sender.login,
    icon_url: eventPayload.sender.avatar_url,
    url: eventPayload.sender.url
  }
}

embed.fields = JSON.parse(_.template(core.getInput('fields'))({ ...process.env, EVENT_PAYLOAD: eventPayload }));

if (!embed.fields) { embed.fields = [] }
eventPayload.commits.forEach(commit => embed.fields.push({ name: "[" + commit.url + "](" + commit.sha + ")", "value": commit.message }))

console.log(JSON.stringify({ content: content, embed: embed }))

url = process.env.DISCORD_WEBHOOK;
payload = JSON.stringify({
  content: content,
  embeds: [embed],
  ...process.env.DISCORD_USERNAME && { username: process.env.DISCORD_USERNAME },
  ...process.env.DISCORD_AVATAR && { avatar_url: process.env.DISCORD_AVATAR },
});

// curl -X POST -H "Content-Type: application/json" --data "$(cat $GITHUB_EVENT_PATH)" $DISCORD_WEBHOOK/github

(async () => {
  console.log('Sending message ...');
  await axios.post(
    `${url}?wait=true`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': process.env.GITHUB_EVENT_NAME,
      },
    },
  );
  console.log('Message sent ! Shutting down ...');
  process.exit(0);
})().catch(err => {
  console.error('Error :', err.response.status, err.response.statusText);
  console.error('Message :', err.response ? err.response.data : err.message);
  process.exit(1);
});
