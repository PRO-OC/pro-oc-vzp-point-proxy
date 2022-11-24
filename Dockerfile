# syntax = docker/dockerfile:1.0-experimental
FROM node:14-slim

RUN apt-get -yq update

RUN apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget x11vnc x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps gnupg xvfb
RUN apt-get install -yq fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends
RUN apt-get install -yq nodejs
RUN apt-get install -yq npm
RUN apt-get install -yq libnss3-tools
RUN apt-get install -yq libgbm1

RUN mkdir -p /etc/chromium/policies/managed/
RUN --mount=type=secret,id=googlechromepolicy,dst=googlechromepolicy.json cp googlechromepolicy.json /etc/chromium/policies/managed/

RUN mkdir -p $HOME/.pki/nssdb
RUN --mount=type=secret,id=cert,dst=cert.pem --mount=type=secret,id=cert_pass,dst=certpass.txt openssl pkcs12 -inkey cert.pem -in cert.pem -export -out cert.pfx -password pass:$(cat certpass.txt) -passin pass:$(cat certpass.txt) && pk12util -d sql:$HOME/.pki/nssdb -i cert.pfx -w certpass.txt

COPY . .

RUN npm install

EXPOSE ${PORT}

CMD xvfb-run --server-args="-screen 0 640x480x24" -a npm start