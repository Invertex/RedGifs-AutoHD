// ==UserScript==
// @name Gfycat AutoHD
// @author Invertex
// @description Automatically sets Gfycat/RedGifs video to HD mode and other improvements
// @icon https://github.com/Invertex/Gfycat-AutoHD/raw/master/logo.png
// @namespace https://greasyfork.org/users/137547
// @license GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// @homepageURL https://github.com/Invertex/Gfycat-AutoHD
// @supportURL https://github.com/Invertex/Gfycat-AutoHD
// @version 1.65
// @match *://*.gifdeliverynetwork.com/*
// @match *://cdn.embedly.com/widgets/media.html?src=*://*.gfycat.com/*
// @match *://cdn.embedly.com/widgets/media.html?src=*://*.redgifs.com/*
// @match *://*.gfycat.com/*
// @match *://*.redgifs.com/*
// @connect *.redgifs.com
// @connect *.gfycat.com
// @connect *.gifdeliverynetwork.com
// @connect *.cdn.embedly.com
// @grant GM.xmlHttpRequest
// @grant GM_setValue
// @grant GM_getValue
// @grant GM.setValue
// @grant GM.getValue
// @grant GM_addValueChangeListener
// @run-at document-idle

// ==/UserScript==
var isAdultSite;

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
//Extra option to force "Autoplay Related GIFs" on/off if user wants to set this manually in the script so the setting can work in private browsing modes as well. You will have to edit this value again whenever a script update is pushed though.
const autoplayForcedMode = null; //Replace 'null' with "on" or "off" depending on how you want Autoplay to always behave. Include the quotation marks "" !
//Hide advertisement stuff
addGlobalStyle('.pro-cta, .toast-notification--pro-cta, .top-slot, .side-slot, .signup-call-to-action, .adsbyexoclick-wrapper, .trafficstars_ad { display: none !important; }');

/** Global audio on/off enforcement Start**/
var audioEnabled = false;
const audioEnabledKey = "gfyHD_audioEnabled";

//Sadly Greasemonkey does not have this functionality... Tampermonkey really is superior.
const isGM = (typeof GM_addValueChangeListener === 'undefined');

async function isAudioEnabled()
{
  if(isGM) { return await GM.getValue(audioEnabledKey, false); }
  return await GM_getValue(audioEnabledKey, false);
}
async function setAudioEnabled(enabled)
{
  if(isGM) { return await GM.setValue(audioEnabledKey, enabled); }
	return await GM_setValue(audioEnabledKey, enabled);
}

if (!isGM)
{
	GM_addValueChangeListener(audioEnabledKey, (name, oldValue, newValue, remote) => { audioEnabled = newValue; });
}

/** Global audio on/off enforcement End**/

(async function()
{
    var url = window.location.href;
    isAdultSite = url.includes("redgifs.");

    if (url.includes(thumbsSubDomain) || url.includes(redgCDN))
    {
        setHDURL(url);
        return;
    }

    audioEnabled = await isAudioEnabled();

    const root = await awaitElem(document.body, '#root > div');

    if(!addHasModifiedClass(root))
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
        awaitElem(root, 'div.iframe-player-container').then(processVideo);
    };
    processRoot(root);
    watchForChange(root, {childList: true, subtree: false, attributes: false}, (rootChanged, mutation) => { processRoot(rootChanged); });
}

async function processMainSite(root)
{
    const processRoot = async function(root)
    {
        const main = await awaitElem(root, 'main');
        if(!addHasModifiedClass(main))
        {
            processMain(main);
            watchForChange(main, {childList: true, subtree: false, attributes: false}, (main, mutation) => { processMain(main); });
        }
    };

    processRoot(root);
    watchForChange(root, {childList: true, subtree: false, attributes: false}, (rootChanged, mutation) => { processRoot(rootChanged); });
}

async function processMain(main)
{
    const mainVideoWrapper = await awaitElem(main, 'div.video-player-wrapper', {childList: true, subtree: true, attributes: false});
    const scrollFeed = await awaitElem(main, 'div.block-2 > div:not(.first-row)');

    if(!addHasModifiedClass(mainVideoWrapper.parentElement))
    {
        await processVideo(mainVideoWrapper);
        watchForChange(mainVideoWrapper.parentElement, {childList: true, subtree: false, attributes: false}, (wrapperParent, mutation) => { processVideo(mainVideoWrapper); });
        if(autoplayForcedMode !== null) { awaitElem(scrollFeed.parentElement, autoplayButtonSelector).then(setAutoplayState); }
    }

    processVideoList(scrollFeed.querySelectorAll('.gif-feed-card > .content-sizer'));
    watchForChange(scrollFeed, {childList: true, subtree: false, attributes: false}, (feed, mutation) => { processVideoList(mutation.addedNodes); });
}

function setAutoplayState(autoplayButton)
{
    let forcedMode = (autoplayForcedMode || autoplayForcedMode == "on") ? true : false;

	if(autoplayButton != null && autoplayButton.checked != forcedMode)
	{
        autoplayButton.click();
	}
};

async function processVideoList(vids)
{
  //  console.log(`processing vids: ${vids.length}`);
    vids.forEach(processVideo);
}

async function processVideo(vidWrapper)
{
    let container = await awaitElem(vidWrapper, '.player-container');
    if(addHasModifiedClass(container)) { return; }
    let video = await awaitElem(container, 'VIDEO', {childList: true, subtree: false, attributes: false});
    let src = await awaitElem(video, 'SOURCE', {childList: true, subtree: true, attributes: true});
    let sources = video.getElementsByTagName("SOURCE");

    await removeMobileQualityVideos(vidWrapper, video);
    awaitElem(container, progressControlClass).then(customizeProgressBar);

    modifySoundControl(container);
	
    //Website clears out all sub elements when you scroll far enough away, have to detect this change to process that element again since it won't show up in the main list mutations.
    watchForChange(vidWrapper, {childList: true, subtree: false, attributes: false}, (vw, mutation) => { processVideo(vw); });
}

async function modifySoundControl(playerContainer)
{
    const soundBtnUnmuted = function(sndBtn)
    {
        return sndBtn.getAttribute('data-tooltip') != "Unmute" || !sndBtn.className.includes('muted');
    };

    const setupSoundButtonListener = function(sndBtn)
    {
        if(!addHasModifiedClass(sndBtn))
        {
            sndBtn.addEventListener('click', (e) =>
            {
                setAudioEnabled(!soundBtnUnmuted(sndBtn));
            });
        }
    };

    const playerBottom = await awaitElem(playerContainer, '.player-bottom');
    const sndBtn1 = await awaitElem(playerBottom, '.sound-control');
    const sndBtn2 = await awaitElem(playerContainer, ':scope > .sound-control');
	if(isGM) { audioEnabled = await isAudioEnabled(); }
    if(soundBtnUnmuted(sndBtn2) != audioEnabled) { sndBtn2.click();}
    setupSoundButtonListener(sndBtn1);
    setupSoundButtonListener(sndBtn2);
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

async function changeQualitySettings(settingsButton)
{
    if(settingsButton && settingsButton.innerText != "HD")
    {
        settingsButton.click();
    }
};


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

async function removeMobileQualityVideos(container, video)
{
    if(video == null)
    {
        console.log("alternate vid locate method");
        video = container.querySelector(iframeVideoClass);
    }

    if(video == null) { console.log("no vid"); return; }
    let settingsButton = container.querySelector('div.right > span.settings-button > .quality');
    await changeQualitySettings(settingsButton);
};

function hideElem(elem)
{
    if(elem && !addHasModifiedClass(elem))
    {
        elem.style.display = "none";
        //Gfycat recreates the same element multiple times sometimes
        watchForChange(elem, { childList: false, subtree: false, attributes: true}, hideElem(elem));
    }
};

async function customizeProgressBar(progressBar)
{
    if(progressBar)
    {
        if(isAdultSite) { progressBar.setAttribute('style', "height:2.4mm;"); }
        else
        {
            progressBar.setAttribute('style', "height:2.4mm; background-color: hsla(0,0%,100%,.1);");
            progressBar.querySelector('.hover-progress').setAttribute('style', "background-color: hsla(0,0%,100%,.2);");
            progressBar.querySelector('.play-progress').setAttribute('style', "background-image: linear-gradient(90deg,rgba(58,168,255,0.3),rgba(36,117,255,0.3));");
        }
        progressBar.querySelector('.progress-knob').setAttribute('style', "margin-top: 0.6em;");
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