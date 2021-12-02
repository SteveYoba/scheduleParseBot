require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const cheerio = require('cheerio');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const path = require('path')

const rename = require('./scripts/rename.js')
const delFile = require('./scripts/delFile')
const chatIdJson = require('./dataForMessage/chatIdJson.json')

puppeteer.use(StealthPlugin())

let dataShedule;
let prevDataShedule

let parser = async (bot) => {
    let exelLink;
    const browser = await puppeteer.launch({
        headless: true,
        //executablePath: '/usr/bin/google-chrome'
    });

    const page = await browser.newPage();
    await page.goto('http://www.mgkit.ru/studentu/raspisanie-zanatij');
    let content = await page.content();

    let $ = cheerio.load(content);
    let exelLinks = $('span[style="line-height:19.9733px"]>a')
    let dataSheduleArray = []

    for (i = 0; i < exelLinks.length; i++) {
        let exelLinkLocal = $(exelLinks[i]).text()
        if (exelLinkLocal.search(/(заняти.)/) != -1) {
            dataSheduleArray.push(parseInt(exelLinkLocal.match(/\d+/)))
        }
    }

    dataShedule = Math.max.apply(null, dataSheduleArray)

    for (i = 0; i < exelLinks.length; i++) {
        let exelLinkLocal = $(exelLinks[i]).text()
        if (exelLinkLocal.search(dataShedule) != -1) {
            exelLink = $(exelLinks[i]).attr('href')
        }
    }
    console.log("dataShedule " + dataShedule)
    console.log("prevData " + prevDataShedule)

    if (dataShedule != prevDataShedule) {
        delFile('./pdf/')
        await page.goto(exelLink)
        content = await page.content()
        $ = cheerio.load(content)

        await page._client.send("Page.setDownloadBehavior", {
            behavior: "allow",
            downloadPath: path.resolve(__dirname, './pdf')
        })
        
        await page.click('div[aria-label="Download"]')

        await page.waitForTimeout(5000)

        await rename('./pdf/')
        .then (() => {
        if (!!prevDataShedule) {
            Object.keys(chatIdJson).forEach((el) => {
                return bot.sendDocument(el, './pdf/schedule_0.pdf' )
            })
        }})
    } else console.log('Расписание не изменилось')

    prevDataShedule = dataShedule
    await browser.close().then(() => console.log('Браузер закрыт'))
}

module.exports = parser;