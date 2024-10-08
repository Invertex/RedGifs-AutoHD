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
// @version 2.37
// @match *://*.gifdeliverynetwork.com/*
// @match *://cdn.embedly.com/widgets/media.html?src=*://*.redgifs.com/*
// @match *://*.redgifs.com/*
// @connect *.redgifs.com
// @connect *.gifdeliverynetwork.com
// @connect *.cdn.embedly.com
// @connect *.api.redgifs.com
// @grant unsafeWindow
// @grant GM.xmlHttpRequest
// @grant GM_xmlhttpRequest
// @grant GM_addStyle
// @grant GM_download
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


GM_addStyle(`
body.gfyHD {
 overflow: auto !important;
}
infinite-scroll-component {
  overflow: visible !important;
}
.skyWrapper > .side, skyWrapper > .side {
  display: contents !important;
}
.previewFeed > .seeMoreBlock,
.previewFeed > .nicheListWidget {
  max-width: 95% !important;
}
.previewFeed > .trendingTags,
.explorePage > .trendingTags,
.explorePage > .nicheListWidget {
  height: auto !important;
}
.previewFeed > .nicheListWidget > .columns,
.explorePage > .nicheListWidget > .columns {
  column-count: 8 !important;
  row-count: 1 !important;
}
.nicheListWidget .rows .row {
  display: contents !important;
  flex-direction: unset !important;
  .title {
    width: auto !important;
  }
}
.nicheGifList .previewFeed {
  margin: auto !important;
}
.seeMoreBlock > .contents.grid {
  grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
  grid-template-rows: repeat(1, minmax(0, 1fr)) !important;
}
.contents > .userTile {
  max-height: 10em !important;
  .main > .thumbnail {
    width: 10em !important;
  }
}
.right.side > div,
.left.side > div,
.wide.page.creatorPage {
  width: auto !important;
}
.appFooter {
  overflow-y: hidden !important;
}
.Video-OverLayer,
.SideBar-Item:has(img[alt^="Live site"]) {
  display: none !important;
}
/* CUSTOM BUTTONS */
.rgDlBtn {
  background-color: transparent;
  border: none;
}
.rgDlBtn[disabled] {
  pointer-events: none !important;
}
.rgDlBtn[disabled] > .rgDlSVG {
  pointer-events: none !important;
  background-color: rgba(143, 44, 242, 0.5);
  border-radius: 12px;
  animation-iteration-count: infinite;
  animation-duration: 2s;
  animation-name: dl-animation;
}
.rgDlBtn[disabled] > .rgDlSVG > path {
    fill: rgba(255,255,255,0.2);
}
.rgDlSVG:hover {
  background-color: rgba(143, 44, 242, 0.5);
  border-radius: 12px;
}
.rgDlSVG:focus {
  padding-top: 3px;
  padding-bottom: 3px;
}
@keyframes dl-animation
{
    0%
    {
        background-color: cyan;
    }
    33%
    {
        background-color: magenta;
    }
    66%
    {
        background-color: yellow;
    }
    100%
    {
        background-color: cyan;
    }
}
.nicheListWidget > .rows {
  min-height: 0px !important;
}
.skyWrapper > .middle {
  width: 70% !important;
}
/* OUTTER FEED CONTAINERS */

.middle > .page,
.middle > .watchPage,
.middle > .explorePage,
.middle > .exploreGifsPage,
.page.narrow,
.page.wide
{
   min-width: 95% !important;
  max-width: 100% !important;
}
/* FEED CONTAINER */
.page > .watchFeed, .page > .center,
.middle > .homePage {
 max-width: 100% !important;
min-width: 95% !important;
}

/* MAIN FEED */
.previewFeed,
.fullScreen .watchPage .previewFeed,
.fullScreen .watchPage .previewFeed1
{
  min-width: 95% !important;
  max-width: 100% !important;
}
/* FEED ITEMS */
.previewFeed > div {
width: auto !important;
max-width: calc(100% - 58px) !important;
}
`);

const dlSVG = '<svg class="rgDlSVG" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="m 3.9472656,2.0820312 c -0.9135398,0 -0.9135398,1.4375 0,1.4375 H 21 c 0.913541,0 0.913541,-1.4375 0,-1.4375 z m 8.5253904,3.484375 c -0.380641,0 -0.759765,'+
      '0.1798801 -0.759765,0.5390626 V 17.886719 c 0,0.862037 -2.6e-4,1.723988 -0.457032,1.292969 L 5.1660156,14.007812 c -0.4567702,-0.431018 -1.9800328,0.287496 -1.21875,1.00586 l 6.6992184,5.603516 c 1.82708,1.43673 1.827215,1.43673 3.654297,0 L 21,15.013672 c 0.761283,'+
      '-0.718364 -0.609723,-1.580552 -1.21875,-1.00586 l -6.089844,5.171876 c -0.456769,0.431019 -0.457031,-0.430932 -0.457031,-1.292969 V 6.1054688 c 0,-0.3591825 -0.381078,-0.5390626 -0.761719,-0.5390626 z"></path></svg>';

const hdSVGPaths = '<path fill-rule="evenodd" clip-rule="evenodd" d="M1.16712 2.51909C0 4.12549 0 6.41699 0 11C0 15.583 0 17.8745 1.16712 19.4809C1.54405 19.9997 2.00029 20.456 2.51909 '+
      '20.8329C4.12549 22 6.41699 22 11 22C15.583 22 17.8745 22 19.4809 20.8329C19.9997 20.456 20.456 19.9997 20.8329 19.4809C22 17.8745 22 15.583 22 11C22 6.41699 22 4.12549 20.8329 2.51909C20.456 2.00029 19.9997 1.54405 19.4809 1.16712C17.8745 0 15.583 0 11 0C6.41699 0 4.12549 '+
      '0 2.51909 1.16712C2.00029 1.54405 1.54405 2.00029 1.16712 2.51909ZM10.0756 15V6.66H8.70763V10.236H4.78363V6.66H3.41563V15H4.78363V11.352H8.70763V15H10.0756ZM16.9286 7.176C16.2646 6.832 15.4886 6.66 14.6006 6.66H11.8766V15H14.6006C15.4886 15 16.2646 14.836 16.9286 '+
      '14.508C17.6006 14.172 18.1166 13.692 18.4766 13.068C18.8446 12.444 19.0286 11.708 19.0286 10.86C19.0286 10.012 18.8446 9.272 18.4766 8.64C18.1166 8 17.6006 7.512 16.9286 7.176ZM16.8446 13.092C16.3246 13.62 15.5766 13.884 14.6006 13.884H13.2446V7.776H14.6006C15.5766 '+
      '7.776 16.3246 8.048 16.8446 8.592C17.3646 9.136 17.6246 9.892 17.6246 10.86C17.6246 11.82 17.3646 12.564 16.8446 13.092Z" fill="white"></path>';
const processMediaEntry = function(media)
{
    if(media.urls != null && media.urls.sd != null && media.urls.hd != null)
    {
        if(media.hls != null) { media.hls = false; }
        let hdurl = media.urls.hd;
        media.urls.sd = hdurl;
        if(hdurl.includes('.png') || hdurl.includes('.jpg') || hdurl.includes('.gif'))
        {
            media.urls.thumbnail = hdurl;
            media.urls.poster = hdurl;
        }
    }
};

/** Global persistence End**/

//Intercept request for video information and replace SD with HD content
var openOpen = unsafeWindow.XMLHttpRequest.prototype.open;
unsafeWindow.XMLHttpRequest.prototype.open = exportFunction(function(method, url)
{
    if (url.includes('/v2/') || url.includes('/v3/') || url.includes('/v1/'))
    {
        if(url.includes('/gifs/boost')) {
        return;
        }
        this.addEventListener('readystatechange', function (e)
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
                    Object.defineProperty(this, 'response', { writable: true });
                    this.response = this.responseText = JSON.stringify(content);
                } catch(e){}
            }
        });
    }
    openOpen.call(this, method, url);
}, unsafeWindow);



(async function()
{
    let url = window.location.href;

    if (url.includes(thumbsSubDomain) || url.includes(redgCDN))
    {
        setHDURL(url);
        return;
    }

    const root = await awaitElem(document, "body");

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
    let content = await awaitElem(root, '.Wrapper .routeWrapper,div.player-wrapper,div.iframe-player-container');
    //let sidebar = await awaitElem(content, ".buttons");
    new MediaElem(content);
}

async function processMainSite(root)
{
    const processRoot = async function(root)
    {
        const main = await awaitElem(root, 'main, .content-page, #root > div.nav');

      if(!addHasModifiedClass(main))
        {
            let middle = await awaitElem(main, '.routeWrapper');
            if(!addHasModifiedClass(middle))
            {

                processMain(middle);
                watchForChange(middle, {childList: true, subtree: false, attributes: false}, (main, mutation) => { processMain(middle); });
            }

        }
    };

    await processRoot(root);
    watchForChange(root, {childList: true, subtree: false, attributes: false}, (rootChanged, mutation) => { processRoot(rootChanged); });
}

async function processMain(middle)
{
    const mainVideoWrapper = await awaitElem(middle, 'div.Player, div.video-player-wrapper', {childList: true, subtree: true, attributes: false});
    const scrollFeed = await awaitElem(middle, 'div.previewFeed');

    if(!addHasModifiedClass(scrollFeed))
    {
        if(!addHasModifiedClass(scrollFeed.parentElement))
        {
            watchForChange(scrollFeed.parentElement, {childList: true, subtree: false, attributes: false}, (rootChanged, mutation) => { processMain(middle); });
            if(!addHasModifiedClass(scrollFeed.parentElement.parentElement))
            {
                watchForChange(scrollFeed.parentElement.parentElement, {childList: true, subtree: false, attributes: false}, (rootChanged, mutation) => { processMain(middle); });
            }
        }
        onFeedUpdated(scrollFeed, scrollFeed.childNodes);
        watchForAddedNodes(scrollFeed, onFeedUpdated);
    }
}

function onFeedUpdated(root, feedEntries)
{
    feedEntries.forEach(processFeedEntry);
}

async function processFeedEntry(mediaWrapper)
{
    if(mediaWrapper?.rghd != null){ return; }

    const classes = mediaWrapper.className;
    if(classes.includes('placard-wrapper') || classes.includes('seeMoreBlock') || classes.includes('trendingTags') || classes.includes("Placeholder"))
    {//Not content, skip
        return;
    }

    mediaWrapper.rghd = new MediaElem(mediaWrapper);
}

function getFilenameFromMetaData(metaData, mediaURL, mediaURLOG, appendNum)
{
    let username = "";
    let date = "";
    let description = "";

    if(metaData != null)
    {
        let link = metaData.querySelector('.UserInfo-UserLink, .text > .author > a');
        let followBtn = metaData.querySelector('.UserInfo-FollowBtn');
        let dateInfo = metaData.querySelector('.UserInfo-Date, .text > .date > a');
        let descInfo = metaData.querySelector('.UserInfo-Description');

        if(link != null) { username = link.href.split('/').slice(-1)[0]; }
        else if (followBtn != null) { username = followBtn.title; }

        if(dateInfo != null)
        {
            let datey = new Date(dateInfo.innerText);
            date = datey.toISOString().split('T')[0];
        }

        if(descInfo)
        {
            let moreBtn = descInfo.querySelector('button');

          //  if(moreBtn != null)
         //   {
         //       moreBtn.click();
         //       await returnOnChange(moreBtn, {childList: false, subtree: false, attributes: true});
         //   }
            let desc_text = descInfo.querySelector('.descriptionText');
            if(desc_text)
            {
                description = '_' + desc_text.innerText.substring(0,50).trimEnd();
            }
        }
    }

    let parts = mediaURL.split('?')[0].split('/').slice(-1)[0].split('.');
    let file = parts[0].split('-')[0];
    let ext = parts[1];

    if(appendNum > 0)
    {
        let fileOG = mediaURLOG.split('?')[0].split('/').slice(-1)[0].split('.')[0].split('-')[0];
        file =`${fileOG}_${appendNum}_${file}`;
    }
    let filename = username + '_' + date + description + ' - ' + file + '.' + ext;
    return filename.replace(/[\\/]/g, '_').replace(/[:*<>|]/g, '-').replace(/[?"]/g, '').trim(); //Sanitize filename
}

class MediaElem
{
    constructor(mediaWrapper)
    {
        mediaWrapper.setAttribute('rghd','');
        mediaWrapper.rghd = this;

        this.curItem = -1;
        this.urls = null;
        this.gallery = null;
        this.mediaWrapper = mediaWrapper;

        this.update = async function()
        {
            this.content = await awaitElem(this.mediaWrapper, ".ImageGif > img.ImageGif-Thumbnail, video");
            await awaitElem(this.mediaWrapper, '.TapTracker, .embeddedPlayer a[href^="/watch/"]');
            this.metaData = await awaitElem(this.mediaWrapper, '.GifPreview-MetaInfo,.Player-MetaInfo,.userInfo');
            this.sideBar = await awaitElem(this.mediaWrapper, "div:has(> ul.SideBar), .embeddedPlayer:has(>.userInfo) > div.buttons");
            if(this.sideBar != null)
            {
                this.processSidebar();
            }
        };

        this.setup = async function()
        {
            await this.update();
            watchForAddedNodes(this.mediaWrapper, this.onAddedNodes);
        };

        this.applyStyling = function()
        {
            if(this.mediaWrapper.style.aspectRatio != "")
            {
                let aspect = this.mediaWrapper.style.aspectRatio.split('/');
                let width = parseInt(aspect[0]) * 2.0;
                let height = parseInt(aspect[1]) * 1.0;
                if(width == null) {return; }
                let perc = (width / height) * 100.0;
                this.mediaWrapper.style.width = perc + "%";
            }
        };


        this.processContent = async function()
        {
            this.content = await awaitElem(this.mediaWrapper, ".ImageGif > img.ImageGif-Thumbnail, video");
            await awaitElem(this.mediaWrapper, '.TapTracker, .embeddedPlayer a[href^="/watch/"]');
            this.metaData = await awaitElem(this.mediaWrapper, '.GifPreview-MetaInfo,.Player-MetaInfo,.userInfo');

            if(this.mediaWrapper.className.includes('GifPreview_isGallery') || this.mediaWrapper.className.includes('Player_isGallery'))
            {
                let gallery = this.mediaWrapper.querySelector('.GalleryGif .swiper-wrapper');
                if(!gallery) { return; }

                let swipes = gallery.querySelectorAll('.swiper-slide');

                this.urls = new Array(swipes.length);
                for(let i = 0; i < swipes.length; i++)
                {
                    this.urls[i] = swipes[i].querySelector('video,img')?.src;
                    if(swipes[i].className.includes('swiper-slide-active'))
                    {
                        this.curItem = i;
                    }
                }
            }
            else if (this.mediaWrapper.className.includes('GifPreview_isImage') || this.mediaWrapper.className.includes('Player_isImage'))
            {
                let image = this.mediaWrapper.querySelector('.ImageGif > img');
                if(image)
                {
                    this.curItem = 0;
                    this.urls = [image.src];
                }
            }
            else if (this.mediaWrapper.className.includes('GifPreview_isVideo') || this.mediaWrapper.className.includes('Player_isVideo') || this.mediaWrapper.className.includes('routeWrapper'))
            {
                let video = await awaitElem(this.mediaWrapper, 'video');
               /* while(!video.src.includes("?expires") && video.src.substr(-4, 1) != '.' && video.src.substr(-3, 1) != '.')
                {
                    await returnOnChange(video, {childList: false, subtree: false, attributes: true}, function(){});

                }*/
                if(video)
                {
                    this.curItem = 0;
                    this.urls = [video.src];
                }
            }
        };


        this.processSidebar = function()
        {
            let qualBtn = this.sideBar.querySelector('.QualityButton > svg, .gifQuality');
            if(qualBtn != null && !this.content?.src?.includes('-mobile.'))
            {
                qualBtn.innerHTML = hdSVGPaths;
                let parent = qualBtn.parentElement;
                parent.className = parent.className.replace(' sd', ' hd');
            }
            console.log("add dl htutt");
            this.createDownloadBtn();
        };

        this.getCurIndex = function()
        {
            if(this.urls.length <= 1) { return 0; }

            this.gallery = this.mediaWrapper.querySelector('.TapTracker .GalleryGif .swiper-wrapper');
            if(this.gallery != null)
            {
                let swipes = this.gallery.querySelectorAll('.swiper-slide');
                for(let i = 0; i < swipes.length; i++)
                {
                    if(swipes[i].className.includes('swiper-slide-active'))
                    {
                        return i;
                    }
                }
            }
            return this.curItem;
        };


        this.createDownloadBtn = function()
        {
           // if(this.curItem < 0) { return; }

            let existingButtons = this.sideBar.querySelectorAll('li.SideBar-Item:has(> .rgDlBtn), li.button:has(> .rgDlBtn)');

            if (existingButtons.length == 0)
            {
                let dlWrap = document.createElement('li');
                dlWrap.className = 'SideBar-Item';

                this.dlBtn = document.createElement("button");
                this.dlBtn.className = "rgDlBtn";

                dlWrap.appendChild(this.dlBtn);
                if(this.sideBar.className.includes('buttons')) {
                    dlWrap.className = 'button';
                    this.sideBar.appendChild(dlWrap); }
                else { this.sideBar.firstElementChild.appendChild(dlWrap); }

                this.dlBtn.innerHTML = dlSVG;
            }
            else
            {
                for(let i = 1; i < existingButtons.length; i++)
                {
                    existingButtons[i].remove();
                }

                this.dlBtn = existingButtons[0];
            }
            this.dlBtn.onclick = (e) => {
                //Re-associate the download button with the element it's actually on now, as the site moves the panel around instead of making a unique sidebar for each entry...
                let mediaElem = e.target.closest('div[rghd]');

                if(mediaElem) {
                    console.log("foiund media elem");
                    console.log(mediaElem);
                    mediaElem.rghd.dlBtn = e.target;
                    mediaElem.rghd.download();
                }
                else
                {
                    this.download();
                }
            };
        };

        this.download = async function()
        {
            this.downloadBtnToggle(false);
            await this.processContent();

            if(this.curItem < 0) {
                 this.downloadBtnToggle(true);
                return;
            }
            let curItem = this.getCurIndex();

            let contentSrc = this.urls[curItem];
            let appendNum = this.urls.length > 1 ? curItem + 1 : -1;

            if (contentSrc != null) {
                let filename = getFilenameFromMetaData(this.metaData, contentSrc, this.urls[0], appendNum);

                this.downloadURL(contentSrc, filename);
                if(this.gallery != null)
                {
                    this.gallery.querySelector('.GalleryGifNav > button[aria-label*="next"]')?.click();
                }
            }
            else
            {
                alert("error: no URL!");
                this.downloadBtnToggle(true);
            }
        };

        this.downloadURL = async function(url, filename)
        {
            GM_download({
                url: url,
                name: filename,
                onload: () => { this.downloadSuccess(); },
                onerror: (e) => { this.downloadFailed(e); },
                ontimeout: (e) => { this.downloadFailed(e); }
            });
        };
        this.downloadSuccess = function()
        {
            this.downloadBtnToggle(true);
        };

        this.downloadFailed = function(err)
        {
            console.log(err);
            this.downloadBtnToggle(true);
        };

        this.downloadBtnToggle = function(enabled)
        {
            if(!enabled)
            {
                this.dlBtn.setAttribute('disabled','');
            }
            else
            {
                if(this.dlBtn.hasAttribute('disabled'))
                {
                    this.dlBtn.removeAttribute('disabled');
                }
            }
        };

        this.onAddedNodes = function(root, addedNodes)
        {
            addedNodes.forEach((node) => {
                if(node.className.includes('-SideBarWrap'))
                {
                    console.log("added node");
                    root.rghd.update();
                }
            });
        };
        this.applyStyling();
        this.setup();
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

function watchForAddedNodes(root, onNodesAdded, obsArgs = {childList: true, subtree: false, attributes: false})
{
    const onMutated = (root, mutation) =>
    {
        if (mutation.addedNodes != null && mutation.addedNodes.length > 0)
        {
            if(root == null) { return; }
            onNodesAdded(root, mutation.addedNodes);
        }
    };
    const observer = watchForChange(root, obsArgs, onMutated);
}

function returnOnChange(target, obsArguments, resolve)
{
     return new Promise(resolve => watchForChange(target, obsArguments, resolve));
}

function watchForChange(root, obsArguments, onChange, stopAfter = false)
{
    const rootObserver = new MutationObserver(function(mutations) {
        rootObserver.disconnect();
        if(root == null) { return; }
        mutations.forEach((mutation) => onChange(root, mutation));
        if(stopAfter != true)
        {
            rootObserver.observe(root, obsArguments);
        }
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
