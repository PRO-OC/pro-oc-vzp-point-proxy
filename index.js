const puppeteer = require('puppeteer-core');
var express = require('express');
var app = express();
var CryptoJS = require("crypto-js");

var encryptKey = process.env.ENCRYPT_KEY;

var browserWSEndpointGlobal = null;

function encryptBody(body, key) {
    let encJson = CryptoJS.AES.encrypt(JSON.stringify( { body }), key).toString();
    let encData = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encJson));
    return encData;
}

async function startBrowser() {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome-stable',
        headless: false,
        args: ['--no-sandbox'], // '--disable-setuid-sandbox' blocks userDataDir
        userDataDir: process.env.USER_DATA_DIR || './userDataDir',
        ignoreDefaultArgs: ['--disable-extensions']
    });
    browser.on('disconnected', function() {
        console.log('disconnected event handler');
        /*startBrowser().then(function(browserWSEndpoint) {
            browserWSEndpointGlobal = browserWSEndpoint;
            console.log('browserWSEndpoint', browserWSEndpoint);
        });*/
    });
    const wsEndpoint = browser.wsEndpoint();
    browser.disconnect();
    return wsEndpoint;
}

async function endBrowser(browserWSEndpoint) {
    const browser = await puppeteer.connect({
        browserWSEndpoint: browserWSEndpoint,
    });
    browser.close();
}

async function signIn(browserWSEndpoint) {

    const browser = await puppeteer.connect({
        browserWSEndpoint: browserWSEndpoint,
    });
    console.log('browser');

    let page = await browser.newPage();
    console.log('new page');

    await page.setViewport({ width: 640, height: 400 });

    // do not load css/font/image
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
            req.abort();
        } else {
            req.continue();
        }
    });

    await page.goto('https://point.vzp.cz/online/online01');

    if(page.url() != "https://point.vzp.cz/online/online01") {
 
        await page.waitForSelector('button[type="submit"]');
    
        const submitButtonElements = await page.$$('button[type="submit"]');
        console.log('button[type="submit"]');
        submitButtonElements[1].click();
    
        await page.waitForNavigation({
            waitUntil: 'load',
        });

        console.log('signed into vzp point');
    } else {
        console.log('already signed into vzp point');
    }

    await page.close();

    await browser.disconnect();

    return;
}

async function getVysledekKontroly(browserWSEndpoint, firstName, lastName, dateBirth, until) {
    console.log('getVysledekKontroly', browserWSEndpoint);

    browser = await puppeteer.connect({
        browserWSEndpoint: browserWSEndpoint,
    });
    console.log('browser');

    let page = await browser.newPage();
    console.log('new page');

    // 3 mins
    page.setDefaultNavigationTimeout(1000 * 180);

    await page.setViewport({ width: 640, height: 480 });

    // do not load css/font/image
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
            req.abort();
        } else {
            req.continue();
        }
    });

    await page.goto('https://point.vzp.cz/online/online01');

    if(page.url() != "https://point.vzp.cz/online/online01") {

        await page.goto('https://auth.vzp.cz/signin');
        console.log('https://auth.vzp.cz/signin');

        await page.waitForSelector('button[type="submit"]');

        const submitButtonElements = await page.$$('button[type="submit"]');
        console.log('button[type="submit"]');
        submitButtonElements[1].click();

        await page.waitForNavigation({
            waitUntil: 'load',
        });

        await page.goto('https://point.vzp.cz/online/online01');

        console.log('signed into vzp point');
    } else {
        console.log('already signed into vzp point');
    }

    console.log('https://point.vzp.cz/online/online01');

    await page.waitForSelector("#mode_search");

    await page.evaluate(() => {
        let radio = document.querySelector('#mode_search');
        radio.click();
    });

    if(until) {
        await page.waitForSelector("#Until");
        await page.evaluate((until) => {
            var untilElement = document.getElementById("Until");
            untilElement.value = until;
        }, until);
    }

    await page.waitForSelector("#Search_FirstName");

    await page.type('input[name="Search.FirstName"]', firstName);
    await page.type('input[name="Search.LastName"]', lastName);
    await page.type('input[name="Search.BirthDate"]', dateBirth);

    const searchForm = await page.$('#form0');
    await searchForm.evaluate(searchForm => searchForm.submit());

    await page.waitForSelector('.well');
    const Vysledek = await page.evaluate(() => {

        const shrnuti = document.querySelector('.col-md-12 span');
        const cisloPojistence = document.querySelector('.col-md-3 p .text-strong');
        const druhPojisteni = document.querySelector('.col-md-4 p .text-strong');
        const zdravotniPojistovna = document.querySelector('.col-md-5 p .text-strong');

        return {
            'shrnuti': shrnuti ? shrnuti.innerHTML : "",
            'cisloPojistence': cisloPojistence ? cisloPojistence.innerHTML : "",
            'druhPojisteni': druhPojisteni ? druhPojisteni.innerHTML : "",
            'zdravotniPojistovna': zdravotniPojistovna ? zdravotniPojistovna.innerHTML : ""
        };
    });

    await page.close();

    await browser.disconnect();

    return Vysledek;
}

app.use(function(req, res, next) {

    console.log(req.method + ': new request');

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type', 'X-Requested-With');

    if (req.method === 'OPTIONS') {
        console.log('OPTIONS: preflight sent');
        res.send();
    } else if (req.method === "GET") {

        if(req.baseUrl + req.path == "/online/online01") {
            return new Promise(resolve => {

                const firstName = req.query.firstName;
                const lastName = req.query.lastName;
                const dateBirth = req.query.dateBirth;
                const until = req.query.until;

                console.log(firstName, lastName, dateBirth, until);

                if(!lastName || !dateBirth)
                {
                    throw new TypeError("Invalid arguments", lastName, dateBirth);
                }

                try {
                    if(!browserWSEndpointGlobal) {
                        startBrowser().then(function(browserWSEndpoint) {

                            browserWSEndpointGlobal = browserWSEndpoint;
                            getVysledekKontroly(browserWSEndpointGlobal, firstName, lastName, dateBirth, until).then(function(Vysledek) {
                                console.log(Vysledek);
                                resolve(Vysledek);
                            });
                        });
                    } else {
                        getVysledekKontroly(browserWSEndpointGlobal, firstName, lastName, dateBirth, until).then(function(Vysledek) {
                            console.log(Vysledek);
                            resolve(Vysledek);
                        });
                    }
                } catch(err) {
                    console.log("getVysledekKontroly err", err);
                    const Vysledek = {
                        'shrnuti': "",
                        'cisloPojistence': "",
                        'druhPojisteni': "",
                        'zdravotniPojistovna': ""
                    };
                    console.log(Vysledek);
                    resolve(Vysledek);
                }
            }).then(body => {
                console.log('GET: response sent');
                var bodyEncrypted = encryptBody(body, encryptKey);
                res.send(bodyEncrypted);
            }).catch(error => {
                console.error(error);
                console.log('GET: error 400 sent');
                res.statusCode = 400;
                res.send();
            });
        }
    } else {
        console.log(req.method + ': is not GET or OPTION request');
        next();
    }
});

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), function () {

    console.log('Proxy server listening on port ' + app.get('port'));

    startBrowser().then(function(browserWSEndpoint) {

        browserWSEndpointGlobal = browserWSEndpoint;
        console.log('browserWSEndpoint', browserWSEndpoint);

        signIn(browserWSEndpoint).then(function() {
            // Only testing purpose (when is browser closed signing in should persist in userDataDir)
            /*endBrowser(browserWSEndpoint).then(function() {
                startBrowser().then(function(browserWSEndpoint2) {
                    browserWSEndpointGlobal = browserWSEndpoint2;
                    getVysledekKontroly(browserWSEndpoint2, "Lukáš", "Drahník", "19.5.1994", "9.3.2022", function(res) {
                        console.log(res);
                    });
                });
            });*/
        });
    });
});