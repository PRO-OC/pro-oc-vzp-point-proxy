FROM node:14

RUN mkdir -p /app

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list

RUN apt-get update && apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget x11vnc x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps xvfb
RUN apt-get install -yq google-chrome-stable
RUN apt-get install -yq libnss3-tools

RUN mkdir -p /etc/opt/chrome/policies/managed
COPY googlechromepolicy.json /etc/opt/chrome/policies/managed/

RUN useradd -m app
RUN chown app:app /app
USER app

COPY cert.pfx /tmp/
COPY certpfxpass.txt /tmp/
RUN mkdir -p $HOME/.pki/nssdb
RUN pk12util -d sql:$HOME/.pki/nssdb -i /tmp/cert.pfx -w /tmp/certpfxpass.txt

WORKDIR /app 

COPY package.json /app

RUN npm install 

COPY . /app

EXPOSE 3000

CMD xvfb-run --server-args="-screen 0 640x480x24" -a npm start