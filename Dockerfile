FROM mhart/alpine-node:12.16.1

LABEL "com.github.actions.name"="Actions for Discord"
LABEL "com.github.actions.description"="Outputs a message to Discord."
LABEL "com.github.actions.icon"="message-square"
LABEL "com.github.actions.color"="gray-dark"

LABEL "repository"="https://github.com/Ilshidur/actions"
LABEL "homepage"="https://github.com/Ilshidur/actions/discord"
LABEL "maintainer"="Ilshidur <ilshidur@gmail.com>"
LABEL "version"="0.1.0"

ADD package.json package-lock.json /
RUN npm ci --production
ADD entrypoint.js /
RUN chmod +x /entrypoint.js

ENTRYPOINT ["node", "/entrypoint.js"]
