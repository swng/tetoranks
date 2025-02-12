const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

async function fetchLeagueRanks() { // to do add caching
    try {
        const response = await fetch('https://ch.tetr.io/api/labs/league_ranks');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return undefined;
    }
}


const rank = process.argv[2].toLowerCase();

(async () => {
    // Check if rank is provided
    if (!rank) {
        console.error('Please provide a rank argument!');
        return;
    }

    // the data
    let rank_data = await fetchLeagueRanks();
    let the_rank_data = rank_data["data"]["data"][rank];

    // the image
    const ranksDir = path.resolve(__dirname, 'ranks');
    const rankFiles = fs.readdirSync(ranksDir);
    const rankFile = `${rank}.png`;

    if (!rankFiles.includes(rankFile)) {
        console.error(`Error: Rank image for '${rank}' not found.`);
        return;
    }

    const imagePath = path.join(ranksDir, rankFile);



    // Launch a headless browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({ width: 320, height: 450 }); // are these dimensions right? idk
    
    const filePath = `file://${path.resolve(__dirname, 'card_template.html')}`;
    await page.goto(filePath, { waitUntil: 'networkidle2' });

    // bro I used AI to center this image div wtf is graphic design
    // Modify the div to display the image as a background
    await page.evaluate((imagePath) => {

        const logoDiv = document.getElementById('logo'); // Select the div
        if (logoDiv) {
            logoDiv.style.backgroundImage = `url('${imagePath}')`;
            logoDiv.style.backgroundSize = "contain"; // Ensure the image fits
            logoDiv.style.backgroundRepeat = "no-repeat";
            logoDiv.style.backgroundPosition = "center";
            logoDiv.style.width = "120px"; // Set width
            logoDiv.style.height = "120px";

            // Force reflow to ensure styles are applied before screenshot
            logoDiv.offsetHeight;
        }
    }, imagePath);

    await page.evaluate((rank) => { // bg color theme stuff
        applyTheme(themes[rank.toUpperCase()]);
    }, rank);

    await page.evaluate((rankData) => { // apply the actual data
        const trElement = document.getElementById('tr');
        if (trElement) {
            trElement.innerHTML = `${Math.round(rankData.tr)}<sup>TR</sup>`;
        }

        const playersElement = document.getElementById('players');
        if (playersElement) {
            playersElement.innerHTML = `${rankData.count.toLocaleString()} PLAYERS`;
        }

        const apmElement = document.getElementById('apm');
        if (apmElement) {
            apmElement.innerHTML = rankData.apm.toFixed(2);
        }

        const vsElement = document.getElementById('vs'); // vs is a worthless stat, maybe I should replace with ds/min
        if (vsElement) {
            vsElement.innerHTML = rankData.vs.toFixed(2);
        }

        const ppsElement = document.getElementById('pps');
        if (ppsElement) {
            ppsElement.innerHTML = rankData.pps.toFixed(2); 
        }

        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.innerHTML = (rankData.apm / rankData.pps / 60.0).toFixed(2);
        }

        const percentileElement = document.getElementById('percentile');
        if (percentileElement) {
            percentileElement.innerHTML = `TOP ${(rankData.percentile * 100).toFixed(1)}%`;
        }

    }, the_rank_data);

    await page.screenshot({ path: 'output.png', omitBackground: true });

    console.log('Screenshot saved as output.png');

    await browser.close();
})();