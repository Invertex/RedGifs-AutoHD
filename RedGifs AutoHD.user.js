// ==UserScript==
// @name RedGifs AutoHD
// @author Invertex
// @description Automatically sets RedGifs video to HD mode and does layout improvements
// @icon https://www.google.com/s2/favicons?sz=64&domain=redgifs.com
// @namespace https://greasyfork.org/users/137547
// @license GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// @homepageURL https://github.com/Invertex/RedGifs-AutoHD
// @supportURL https://github.com/Invertex/RedGifs-AutoHD
// @updateURL https://github.com/Invertex/RedGifs-AutoHD/raw/master/RedGifs%20AutoHD.user.js
// @downloadURL https://github.com/Invertex/RedGifs-AutoHD/raw/master/RedGifs%20AutoHD.user.js
// @version 2.12
// @match *://*.gifdeliverynetwork.com/*
// @match *://cdn.embedly.com/widgets/media.html?src=*://*.redgifs.com/*
// @match *://*.redgifs.com/*
// @connect *.redgifs.com
// @connect *.gifdeliverynetwork.com
// @connect *.cdn.embedly.com
// @connect *.api.redgifs.com
// @grant GM.xmlHttpRequest
// @grant GM_setValue
// @grant GM_getValue
// @grant GM.setValue
// @grant GM.getValue
// @grant GM_addValueChangeListener
// @grant GM_addStyle
// @run-at document-start

// ==/UserScript==
const thumbsSubDomain = '//thumbs.';
const redgCDN = '//thcf';
const hdSubDomain = '//giant.';
const mobileAffix = '-mobile.';
const gifAffix = '-size_restricted.';
const iframeVideoClass = 'video.media,video.video';
const settingsButtonClass = 'span.settings-button';
const progressControlClass = '.progress-control';
const autoplayButtonSelector = "div.upnext-control div.switch input[type='checkbox']";
const modifiedAttr = "gfyHD";
const pageWidth = "80%";

//Hide advertisement stuff
//GM_addStyle('.pro-cta, .toast-notification--pro-cta, .placard-wrapper, .ad, .top-slot, #adsbox, #jerky-im, .side-slot, .signup-call-to-action, .adsbyexoclick-wrapper, .trafficstars_ad, #fpa_layer { display: none !important; }');
GM_addStyle('.infinite-scroll-component { overflow:visible !important; }');
GM_addStyle(`.skyWrapper>.side { display: contents !important; }`);
GM_addStyle(`.previewFeed > .seeMoreBlock, .previewFeed > .nicheListWidget { max-width: 95% !important; }`);
GM_addStyle(`.previewFeed > .trendingTags, .explorePage > .trendingTags, .explorePage > .nicheListWidget { height: auto !important; }`);
GM_addStyle(`.previewFeed > .nicheListWidget > .columns, .explorePage > .nicheListWidget > .columns { column-count: 4 !important; }`);
GM_addStyle(`.previewFeed,.skyWrapper > .middle { max-width: ${pageWidth} !important; }`);
GM_addStyle(`.page.watchPage, .middle > .explorePage, .middle > .exploreGifsPage { width: ${pageWidth} !important; }`);
GM_addStyle(`.player .preview, .skyWrapper > .middle, .previewFeed { width: 100% !important; }`);
GM_addStyle(`.watchPage .center,.page > .homeFeed { max-width: 100% !important; }`);
GM_addStyle(`.right.side > div,.left.side > div,.wide.page.creatorPage  { width: auto !important; }`);
GM_addStyle(`.appFooter  { overflow-y: hidden !important; }`);

/** Global persistence Start**/
var autoplayEnabled = true;
const autoplayEnabledKey = "gfyHD_autoplayEnabled";

var audioEnabled = false;
const audioEnabledKey = "gfyHD_audioEnabled";

//Sadly Greasemonkey does not have this functionality... Tampermonkey really is superior.
const isGM = (typeof GM_addValueChangeListener === 'undefined');

async function isEnabled(key, defaultValue)
{
  return isGM ? await GM.getValue(key, defaultValue) : GM_getValue(key, defaultValue);
}
async function setEnabled(key, value)
{
  return isGM ? await GM.setValue(key, value) : GM_setValue(key, value);
}

if (!isGM)
{
    GM_addValueChangeListener(autoplayEnabledKey, (name, oldValue, newValue, remote) => { autoplayEnabled = newValue; });
	GM_addValueChangeListener(audioEnabledKey, (name, oldValue, newValue, remote) => { audioEnabled = newValue; });
}

/** Global persistence End**/

//Intercept request for video information and replace SD with HD content
(function (open)
 {
    const processMediaEntry = function(media)
    {
         if(media.urls != null && media.urls.sd != null && media.urls.hd != null)
         {
             media.urls.sd = media.urls.hd;
         }
    }

    //  if(!window.location.href.includes("//v3.")) { return; }
    XMLHttpRequest.prototype.open = function (method, url)
    {

        if (url.includes('/v2/') || url.includes('/v3/') || url.includes('/v1/'))
        {
            this.addEventListener('readystatechange', async function (e)
            {
                if (this.readyState === 4)
                {
                    try
                    {
                        let content = JSON.parse(e.target.response);

                        if(content == null) { return; }

                        if(content.gif != null)
                        {
                            processMediaEntry(content.gif);
                        }
                        else if(content.gifs != null)
                        {
                            let gifs = content.gifs;

                            let gifCnt = content.gifs.length;
                            for(let i = 0; i < gifCnt; i++)
                            {
                                processMediaEntry(gifs[i]);
                            }
                        }

                        Object.defineProperty(this, 'responseText', { writable: true });
                        this.responseText = JSON.stringify(content);
                    } catch(e){}
                }
            });
        }

        open.apply(this, arguments);
    };
})(XMLHttpRequest.prototype.open);

(async function()
{
    var url = window.location.href;

    if (url.includes(thumbsSubDomain) || url.includes(redgCDN))
    {
        setHDURL(url);
        return;
    }

    audioEnabled = await isEnabled(audioEnabledKey, false);

    const root = document.body;

    if(root != null && !addHasModifiedClass(root))
    {
        if(url.includes('embedly') || url.includes('gifdeliverynetwork') || url.includes('/ifr/'))
        {//Embeds like on Reddit.
            processEmbed(root);
        }
        else
        {
            processMainSite(root);
        }
    }
})();

async function processEmbed(root)
{
     const processRoot = async function(root)
    {
        awaitElem(root, 'div.player-wrapper, div.iframe-player-container').then(processVideo);
    };
    processRoot(root);
    watchForChange(root, {childList: true, subtree: false, attributes: false}, (rootChanged, mutation) => { processRoot(rootChanged); });
}

async function processMainSite(root)
{
    const processRoot = async function(root)
    {
        const main = await awaitElem(root, 'main, .content-page, #root > div.nav');

        if(!addHasModifiedClass(main))
        {
            let feed = await awaitElem(main, 'div.page');
            processMain(feed);
            watchForChange(feed, {childList: true, subtree: false, attributes: false}, (main, mutation) => { processMain(feed); });
        }
    };

    processRoot(root);
    watchForChange(root, {childList: true, subtree: false, attributes: false}, (rootChanged, mutation) => { processRoot(rootChanged); });
}

async function processMain(main)
{
    const mainVideoWrapper = await awaitElem(main, 'div.video-player-wrapper, div.player', {childList: true, subtree: true, attributes: false});
    const scrollFeed = await awaitElem(main.parentElement, 'div.previewFeed');
    console.log("proc main");
    if(!addHasModifiedClass(scrollFeed))
    {
        watchForChange(scrollFeed, {childList: true, subtree: false, attributes: false}, (main, mutation) => { processVideoList(scrollFeed.childNodes); });
    }

    processVideoList(scrollFeed.childNodes);
}

async function processVideoList(vids)
{
    vids.forEach(processVideo);
}

async function processVideo(vidWrapper)
{
    if(vidWrapper.className.includes('placard-wrapper'))
    {//Advert slot, skip
        return;
    }
    if(vidWrapper.style.aspectRation != "")
    {
        let aspect = vidWrapper.style.aspectRatio.split('/');
        let width = parseInt(aspect[0]) * 2.0;
        let height = parseInt(aspect[1]) * 1.0;
        if(width == null) {return; }
        let perc = (width / height) * 100.0;
          //  vidWrapper.style.width = perc + "%";
    }
}


function setHDURL(url)
{
    url = url.replace(thumbsSubDomain, hdSubDomain);
    if(url.includes(mobileAffix)) { url = url.replace(mobileAffix, '.'); }
    if(url == window.location.href)
    {
        checkForVideoConnection(
            url,
            () =>
            {
                switchToFastServer(
                    url,
                    0,
                    (newUrl) => { window.location = newUrl; }
                );
            },
            () => { return; }
        );
    }
    else { switchToFastServer(url, 0, function(newUrl){ window.location = newUrl;}); }
};

async function switchToFastServer(src, serverIndex, onFinish)
{
    let url = cycleCDN(src, serverIndex);
    if(serverIndex >= 9 || url == "") { onFinish(src); }
}

function cycleCDN(url, serverIndex)
{
    function setCharAt(str,index,chr) {
        if(index > str.length-1) return str;
        return str.substring(0,index) + chr + str.substring(index+1);
    }

    let cdnSubstr = url.indexOf('thcf');
    if(cdnSubstr > 2) cdnSubstr += 4;
    else return "";

    return setCharAt(url, cdnSubstr, serverIndex + 1);
}

async function checkForVideoConnection(url, onFail, onSuccess)
{
    return;
    let isAvailable = await isResourceAvailable(url);
    if(isAvailable) { onSuccess(url); }
    else { onFail(); }
}

async function isResourceAvailable(url)
{
    function gmGet(args) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest(
                Object.assign({
                    method: 'HEAD',
                }, args.url ? args : {url: args}, {
                    onload: e => resolve(e.status),
                    onerror: reject,
                    ontimeout: reject
                })
            );
        });
    }

    let a = 404;

    try { a = await gmGet(url); } catch(e){ }

    return a == 200;
}

function hideElem(elem)
{
    if(elem && !addHasModifiedClass(elem))
    {
        elem.style.display = "none";
        //Gfycat recreates the same element multiple times sometimes
        watchForChange(elem, { childList: false, subtree: false, attributes: true}, hideElem(elem));
    }
};

function addHasModifiedClass(elem)
{
    if(elem.className.includes(modifiedAttr)) { return true; }
    else if(elem.className == '') { elem.className = modifiedAttr; }
    else { elem.className +=" " + modifiedAttr; }

    return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function awaitElem(root, query, mutationArgs = {childList: true, subtree: true, attributes: false})
{
    const findElem = (rootElem, query, observer, resolve) =>
    {
        const elem = rootElem.querySelector(query);
        if(elem != null)
        {
            observer?.disconnect();
            resolve(elem);
            return true;
        }
        return false;
    };

    return new Promise((resolve, reject) =>
    {
        if(findElem(root, query, null, resolve)) { return; }

        const rootObserver = new MutationObserver((mutes, obs) =>
        {
            findElem(root, query, rootObserver, resolve);
        });
        rootObserver.observe(root, mutationArgs);
    });
}

function watchForChange(root, obsArguments, onChange)
{
    const rootObserver = new MutationObserver(function(mutations) {
        mutations.forEach((mutation) => onChange(root, mutation));
    });
    rootObserver.observe(root, obsArguments);
    return rootObserver;
}

async function watchForElem(root, query, stopAfterFinding, obsArguments, executeAfter)
{
    let elem = root.querySelector(query);
    if(elem != null && elem != undefined)
    {
        executeAfter(elem);
        if(stopAfterFinding === true) { return; }
    }

    let rootObserver = new MutationObserver(
        function(mutations)
        {
            elem = root.querySelector(query);
            if(elem != null && elem != undefined)
            {
                if(stopAfterFinding === true) { rootObserver.disconnect(); }

                executeAfter(elem);
            }
        });

    rootObserver.observe(root, obsArguments);
}

function addGlobalStyle(css) {
    let head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}
