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
// @version 2.40
// @match *://*.gifdeliverynetwork.com/*
// @match *://cdn.embedly.com/widgets/media.html?src=*://*.redgifs.com/*
// @match *://*.redgifs.com/*
// @connect redgifs.com
// @connect gifdeliverynetwork.com
// @connect embedly.com
// @grant unsafeWindow
// @grant GM.xmlHttpRequest
// @grant GM_xmlhttpRequest
// @grant GM_setClipboard
// @grant GM_addStyle
// @grant GM_download
// @run-at document-start

// ==/UserScript==
const thumbsSubDomain = '//thumbs.';
const redgCDN = '//thcf';
const hdSubDomain = '//giant.';
const mobileAffix = '-mobile.';
const modifiedAttr = "gfyHD";


GM_addStyle(`
body.gfyHD {
 overflow: auto !important;
}
.GifPreview-MetaInfo {
 opacity: 4%;
}
.GifPreview-MetaInfo:hover, .embeddedPlayer > .logo:hover, .embeddedPlayer > .buttons:hover, .embeddedPlayer > .userInfo:hover {
 opacity: 90%;
}
#scrollableDiv:has(> .routeWrapper > .embeddedPlayer):hover {
 .embeddedPlayer > .logo, .embeddedPlayer > .userInfo { opacity: 100%; }
 .embeddedPlayer > .buttons { opacity: 100%; }
}
.embeddedPlayer > .logo, .embeddedPlayer > .userInfo { opacity: 15%; }
.embeddedPlayer > .buttons { opacity: 20%; }

.seek-slider .track .main:hover {
 opacity: 100%;
 .seek-slider .track .main .inner-seek-block {
   height: 8px !important;
 }
}
.seek-slider .track .main { opacity: 30%; }
 .seek-slider .track .main .inner-seek-block {
   height: 4px !important;
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
.rgDlBtn[downloading],[rgDL-disabled] {
  pointer-events: none !important;
}
[rgDL-disabled] {
  opacity: 20% !important;
}
.rgDlBtn[downloading] > .rgDlSVG {
  pointer-events: none !important;
  background-color: rgba(143, 44, 242, 0.5);
  border-radius: 12px;
  animation-iteration-count: infinite;
  animation-duration: 2s;
  animation-name: dl-animation;
}
.rgDlBtn[downloading] > .rgDlSVG > path,.rgDlBtn[disabled] > .rgDlSVG > path {
    fill: rgba(255,255,255,0.2);
}
.rgDlSVG:hover {
  background-color: rgba(143, 44, 242, 0.5);
  border-radius: 12px;
}
.rgDlSVG:hover {
  background-color: rgba(200, 200, 200, 0.25);
  border-radius: 12px;
}
.rgDlSVG:focus {
  padding-top: 3px;
  padding-bottom: 3px;
}
.rghd_sidebarwrap {
  position: absolute;
  right: -58px;
  bottom: 20px;
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
/* REMOVE ANNOYANCES */
div[class*="adBox"],div:has(> iframe[rel*="sponsored"]) { display: none !important; }
`);

const dlSVG = '<svg class="rgDlSVG" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="m 3.9472656,2.0820312 c -0.9135398,0 -0.9135398,1.4375 0,1.4375 H 21 c 0.913541,0 0.913541,-1.4375 0,-1.4375 z m 8.5253904,3.484375 c -0.380641,0 -0.759765,'+
      '0.1798801 -0.759765,0.5390626 V 17.886719 c 0,0.862037 -2.6e-4,1.723988 -0.457032,1.292969 L 5.1660156,14.007812 c -0.4567702,-0.431018 -1.9800328,0.287496 -1.21875,1.00586 l 6.6992184,5.603516 c 1.82708,1.43673 1.827215,1.43673 3.654297,0 L 21,15.013672 c 0.761283,'+
      '-0.718364 -0.609723,-1.580552 -1.21875,-1.00586 l -6.089844,5.171876 c -0.456769,0.431019 -0.457031,-0.430932 -0.457031,-1.292969 V 6.1054688 c 0,-0.3591825 -0.381078,-0.5390626 -0.761719,-0.5390626 z"></path></svg>';

const linkSVG = `<svg class="rgDlSVG" xmlns="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" id="Layer_1" x="0px" y="0px" width="24" height="24" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve" data-google-analytics-opt-out="">
<path fill="white" d="M459.654,233.373l-90.531,90.5c-49.969,50-131.031,50-181,0c-7.875-7.844-14.031-16.688-19.438-25.813  l42.063-42.063c2-2.016,4.469-3.172,6.828-4.531c2.906,9.938,7.984,19.344,15.797,27.156c24.953,24.969,65.563,24.938,90.5,0  l90.5-90.5c24.969-24.969,24.969-65.563,0-90.516c-24.938-24.953-65.531-24.953-90.5,0l-32.188,32.219  c-26.109-10.172-54.25-12.906-81.641-8.891l68.578-68.578c50-49.984,131.031-49.984,181.031,0  C509.623,102.342,509.623,183.389,459.654,233.373z M220.326,382.186l-32.203,32.219c-24.953,24.938-65.563,24.938-90.516,0  c-24.953-24.969-24.953-65.563,0-90.531l90.516-90.5c24.969-24.969,65.547-24.969,90.5,0c7.797,7.797,12.875,17.203,15.813,27.125  c2.375-1.375,4.813-2.5,6.813-4.5l42.063-42.047c-5.375-9.156-11.563-17.969-19.438-25.828c-49.969-49.984-131.031-49.984-181.016,0  l-90.5,90.5c-49.984,50-49.984,131.031,0,181.031c49.984,49.969,131.031,49.969,181.016,0l68.594-68.594  C274.561,395.092,246.42,392.342,220.326,382.186z"/>
</svg>`;

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
    new MediaElem(content, true);
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

    mediaWrapper.rghd = new MediaElem(mediaWrapper, false);
}

function getFilenameFromMetaData(metaData, mediaURLs, curItem)
{
    if(mediaURLs.length == 0) { return ""; }

    let mediaURL = mediaURLs[curItem];
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

    if(mediaURLs.length > 1)
    {
        let fileOG = mediaURLs[0].split('?')[0].split('/').slice(-1)[0].split('.')[0].split('-')[0];
        file =`${fileOG}_${curItem + 1}_${file}`;
    }
    let filename = username + '_' + date + description + ' - ' + file + '.' + ext;
    return filename.replace(/[\\/]/g, '_').replace(/[:*<>|]/g, '-').replace(/[?"]/g, '').trim(); //Sanitize filename
}

function doOnAttributeChange(elem, onChange, repeatOnce = false)
{
    let rootObserver = new MutationObserver((mutes, obvs) => async function()
    {
        obvs.disconnect();
        await onChange(elem);
        if (repeatOnce == true) { return; }
        obvs.observe(elem, { childList: false, subtree: false, attributes: true })
    });
    rootObserver.observe(elem, { childList: false, subtree: false, attributes: true });
}

class MediaElem
{
    urls = [];
    curItem = -1;
    gallery = null;
    mediaWrapper = null;
    link = null;

    applyStyling = function()
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

    async update()
    {
        await this.updateLinkAndID();
        this.sideBar = await awaitElem(this.mediaWrapper, "div:has(> ul.SideBar), .embeddedPlayer:has(>.userInfo) > div.buttons");

        if(this.sideBar != null)
        {
            this.processSidebar();
            let rghdSideBar = this.mediaWrapper.querySelector('.rghd_sidebarwrap');
            if(rghdSideBar == null)
            {
                if(this.is_embed)
                {
                    this.addEmbedPauser();
                }
                this.createSideBar();
            }
        }

    };

    addEmbedPauser = function()
    {
        let vidLink = this.mediaWrapper?.querySelector('a.videoLink');
        if(vidLink)
        {
            let logobtn = this.mediaWrapper.querySelector('a.logo');
            if(logobtn)
            {
                logobtn.href = vidLink.href;
                vidLink.removeAttribute('href');
            }
        }
    };

    async updateLinkAndID()
    {
        let link = await awaitElem(this.mediaWrapper, 'a[href*="/watch/"]', {childList: true, subtree: true, attributes: true});
        this.link = link.href;

        if(this.mediaWrapper?.id?.startsWith('gif_')) {
            let contentid = this.mediaWrapper.id;
            this.id = contentid.substr(contentid.lastIndexOf('_') + 1).toLowerCase();
        }
        else {
            this.id = link.href.split('/').at(-1);
        }
    }

    async onWrapperAttributesChanged()
    {
        await this.updateLinkAndID();
        await this.processContent();
    }

    setup = async function()
    {
        await this.update();
        doOnAttributeChange(this.mediaWrapper, (elem) => { this.onWrapperAttributesChanged()});
    };

    createSideBar = async function()
    {
        //DOWNLOAD BUTTON
        let dlWrap = document.createElement('li');
        dlWrap.className = 'SideBar-Item';

        this.dlBtn = document.createElement("button");
        this.dlBtn.className = "rgDlBtn";
        this.dlBtn.innerHTML = dlSVG;
        this.dlBtn.title = "Download";
        this.dlBtn.onclick = ()=> { this.download(); };
        dlWrap.appendChild(this.dlBtn);

        // COPY LINK BUTTON
        let copyWrap = document.createElement('li');
        copyWrap.className = 'SideBar-Item';

        this.copyBtn = document.createElement("a");
        this.copyBtn.className = "rgDlBtn";
        this.copyBtn.innerHTML = linkSVG;
        this.copyBtn.title = "File Link (if Download won't work, click this instead)";
       // this.copyBtn.onclick = ()=> { this.download(); };
        copyWrap.appendChild(this.copyBtn);



        if(this.sideBar.classList.contains('buttons')) {
            //Embed player, just add it to existing static sidebar
            dlWrap.className = 'button';
            copyWrap.className = 'button';
            this.sideBar.appendChild(dlWrap);
            this.sideBar.appendChild(copyWrap);
        }
        else {
            // Let's make our own sidebar, because redgifs does some really stupid re-use stuff
            let sidebar = document.createElement('div');
            this.rghdSideBar = sidebar;
            sidebar.className = "rghd_sidebarwrap";
            let sblist = document.createElement('ul');
            sidebar.appendChild(sblist);
            sblist.appendChild(dlWrap);
            sblist.appendChild(copyWrap);
            this.mediaWrapper.appendChild(sidebar);
        }

        this.dlBtn.setAttribute('rgDL-disabled','');
        this.copyBtn.setAttribute('rgDL-disabled','');
        let enabled = await this.processContent();
        if(enabled === true)
        {
            this.dlBtn.removeAttribute('rgDL-disabled');
            this.copyBtn.removeAttribute('rgDL-disabled');
        }
    };


    processContent = async function()
    {
        this.metaData = await awaitElem(this.mediaWrapper, '.GifPreview-MetaInfo,.Player-MetaInfo,.userInfo');

        if(!this.is_embed)
        {
            await awaitElem(this.mediaWrapper.parentElement, ".GifPreview_isVideo,.Player_isVideo,.GifPreview_isImage,.Player_isImage,.GifPreview_isGallery,.Player_isGallery", {subtree: true, childList: false, attributes: true});
        }
        this.urls = [];
        let foundContent = false;

        if(this.mediaWrapper.classList.contains('GifPreview_isGallery') || this.mediaWrapper.classList.contains('Player_isGallery'))
        {
            let gallery = await awaitElem(this.mediaWrapper,`.GalleryGif .swiper-wrapper`,
                                           {childList: true, subtree: true, attributes: true});
            if(!gallery) { return; }

            gallery = gallery.parentElement;
            let swipes = gallery.querySelectorAll('.swiper-slide');

            for(let i = 0; i < swipes.length; i++)
            {
                this.urls.push(swipes[i].querySelector('video,img')?.src);
                if(swipes[i].classList.contains('swiper-slide-active'))
                {
                    this.curItem = i;
                }
            }
        }
        else if (this.mediaWrapper.classList.contains('GifPreview_isImage') || this.mediaWrapper.classList.contains('Player_isImage'))
        {
            this.content = await awaitElem(this.mediaWrapper, `.ImageGif > img.ImageGif-Thumbnail[src*=${this.id} i]`,
                                       {childList: true, subtree: true, attributes: true, characterData: true, attributeOldValue: true});
            if(this.content)
            {
                this.curItem = 0;
                this.urls.push(this.content.src);
            }
        }
        else if (this.mediaWrapper.classList.contains('GifPreview_isVideo') || this.mediaWrapper.classList.contains('Player_isVideo') || this.mediaWrapper.classList.contains('routeWrapper'))
        {
            const video = await awaitElem(this.mediaWrapper,`video[src*="${this.id}" i]`, {childList: true, subtree: true, attributes: true, characterData: true, attributeOldValue: true});
            if(video)
            {
                this.curItem = 0;
                this.urls.push(video.src);
            }
        }

        if(this.urls.length > 0)
        {
            foundContent = true;
            this.copyBtn.href = this.urls[0];
            this.copyBtn.target = '_blank';
            this.copyBtn.download = getFilenameFromMetaData(this.metaData, this.urls, 0);
            this.copyBtn.addEventListener('mousedown', (e) => {
                GM_setClipboard(this.copyBtn.download, "text");
            }, {passive: true});

        }

        return foundContent;
    };


    processSidebar = function()
    {
        let qualBtn = this.sideBar.querySelector('.QualityButton > svg, .gifQuality');
        if(qualBtn != null && !this.content?.src?.includes('-mobile.'))
        {
            qualBtn.innerHTML = hdSVGPaths;
            let parent = qualBtn.parentElement;
            parent.className = parent.className.replace(' sd', ' hd');
        }
    };

    getCurIndex = function()
    {
        if(this.urls.length <= 1) { return 0; }

        this.gallery = this.mediaWrapper.querySelector('.TapTracker .GalleryGif .swiper-wrapper');
        if(this.gallery != null)
        {
            let swipes = this.gallery.querySelectorAll('.swiper-slide');
            for(let i = 0; i < swipes.length; i++)
            {
                if(swipes[i].classList.contains('swiper-slide-active'))
                {
                    return i;
                }
            }
        }
        return this.curItem;
    };

    download = function(e)
    {
        this.downloadBtnToggle(false);

        if(this.curItem < 0) {
            this.downloadBtnToggle(true);
            return;
        }
        let curItem = this.getCurIndex();

        let contentSrc = this.urls[curItem];

        if (contentSrc != null) {
            let filename = getFilenameFromMetaData(this.metaData, this.urls, curItem);

            this.downloadURL(contentSrc, filename);
            if(this.urls.length > 1)
            {
                let nextbtn = this.mediaWrapper.querySelector('.GalleryGifNav > button[aria-label*="next"]');
                if(nextbtn && !nextbtn.hasAttribute('disabled'))
                {
                    nextbtn.click();
                    this.curItem += 1;
                }
            }
        }
        else
        {
            alert("error: no URL!");
            this.downloadBtnToggle(true);
        }
    };



    downloadURL = function(url, filename)
    {
        const dl = GM_download({
            url: url,
            name: filename,
            onload: () => { this.downloadSuccess(); },
            onerror: (e) => { this.downloadFailed(e); },
            ontimeout: (e) => { this.downloadFailed(e); },
            saveAs: true
        });
        // For some reason GM_download is failing for some downloads on Chrome, but directly putting them in the URL bar is fine... So timeout for now.
        window.setTimeout(()=> {
            this.downloadBtnToggle(true);
            dl.abort();
        }, 240000);
    };
    downloadSuccess = function()
    {
        this.downloadBtnToggle(true);
    };

    downloadFailed = function(err)
    {
        console.log(err);
        this.downloadBtnToggle(true);
    };

    downloadBtnToggle = function(enabled)
    {
        if(!enabled)
        {
            this.dlBtn.setAttribute('downloading','');
        }
        else
        {
            if(this.dlBtn.hasAttribute('downloading'))
            {
                this.dlBtn.removeAttribute('downloading');
            }
        }
    };
    copyBtnToggle = function(enabled)
    {
        if(!enabled)
        {
            this.copyBtn.setAttribute('downloading','');
        }
        else
        {
            if(this.copyBtn.hasAttribute('downloading'))
            {
                this.copyBtn.removeAttribute('downloading');
            }
        }
    };
    constructor(mediaWrapper, isEmbed)
    {
        this.urls = [];
        this.is_embed = isEmbed;
        mediaWrapper.setAttribute('rghd','');
        mediaWrapper.rghd = this;
        this.mediaWrapper = mediaWrapper;

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
    if(elem.classList.contains(modifiedAttr)) { return true; }
    else if(elem.className == '') { elem.className = modifiedAttr; }
    else { elem.className +=" " + modifiedAttr; }

    return false;
}

function findElem(rootElem, query, observer, resolve)
{
    const elem = rootElem.querySelector(query);
    if (elem != null && elem != undefined)
    {
        observer?.disconnect();
        resolve(elem);
    }
    return elem;
}

async function awaitElem(root, query, obsArguments = {childList: true, subtree: true, attributes: false, characterData: true})
{
    return new Promise((resolve, reject) =>
    {
        if (findElem(root, query, null, resolve)) { return; }
        const rootObserver = new MutationObserver((mutes, obs) => {
            findElem(root, query, obs, resolve);
        });
        rootObserver.observe(root, obsArguments);
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
