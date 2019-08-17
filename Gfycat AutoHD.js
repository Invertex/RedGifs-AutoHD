// ==UserScript==
// @name Gfycat AutoHD
// @author Invertex
// @supportURL http://invertex.xyz
// @version 1.0
// @description Automatically sets Gfycat video to HD mode
// @match https://gfycat.com/*
// @match https://*.gfycat.com/*
// @require  https://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @require  https://gist.github.com/raw/2625891/waitForKeyElements.js
// @run-at document-start
// ==/UserScript==

const thumbsStr = 'thumbs.gfycat';
const mobileStr = '-mobile.';
const settingsButtonClass = ".settings-button";

function setHDURL(url)
{
    url = url.replace(thumbsStr, 'giant.gfycat');
    if(url.includes(mobileStr))
    {
        url = url.replace(mobileStr, '.');
    }
    window.location = url;
};

function settingsClick(settingsButton)
{
    if(settingsButton) { settingsButton.click() }
};

(function()
{
    var url = window.location.href;

    if (url.includes(thumbsStr))
    {
        setHDURL(url);
    }
    else
    {
        waitForKeyElements(settingsButtonClass, settingsClick);
    }
})();


