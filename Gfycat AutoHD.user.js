// ==UserScript==
// @name Gfycat AutoHD
// @author Invertex
// @description Automatically sets Gfycat video to HD mode and other improvements
// @icon https://github.com/Invertex/Gfycat-AutoHD/raw/master/logo.png
// @namespace https://greasyfork.org/users/137547
// @license GPLv3 - http://www.gnu.org/licenses/gpl-3.0.txt
// @homepageURL https://github.com/Invertex/Gfycat-AutoHD
// @supportURL https://github.com/Invertex/Gfycat-AutoHD
// @updateURL https://github.com/Invertex/Gfycat-AutoHD/raw/master/Gfycat%20AutoHD.user.js
// @version 1.32
// @match https://gfycat.com/*
// @match https://*.gfycat.com/*
// @require  https://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @grant none
// @run-at document-start

// ==/UserScript==

const thumbsStr = 'thumbs.gfycat.com';
const giantStr = 'giant.gfycat.com';
const mobileStr = '-mobile.';
const settingsButtonClass = ".settings-button";
const proUpgradeClass = ".pro-cta";
const proUpgradeNotificationClass = ".toast-notification--pro-cta";
const topSlotAdClass = ".top-slot";
const sideSlotAdClass = ".side-slot";

(function()
{
    var url = window.location.href;

    if (url.includes(thumbsStr))
    {
        setHDURL(url);
    }
    else
    {
        waitForKeyElements(settingsButtonClass, changeSettings);
        waitForKeyElements(proUpgradeClass, deleteElement);
        waitForKeyElements(proUpgradeNotificationClass, deleteElement);
        //Delete the third-party advertisements in case adblockers aren't able to catch them.
        waitForKeyElements(topSlotAdClass, deleteElement);
        waitForKeyElements(sideSlotAdClass, deleteElement);
    }
})();

function setHDURL(url)
{
    url = url.replace(thumbsStr, giantStr);
    if(url.includes(mobileStr))
    {
        url = url.replace(mobileStr, '.');
    }
    window.location = url;
};

function changeSettings(settingsButton)
{
    if(settingsButton)
    {
        //In case some webpage uses same class name for something, check for data-tooltip to reduce any chance of false positive
        if(settingsButton.attr("data-tooltip") === "Quality")
        {
            settingsButton.click();
            waitForKeyElements('.progress-control', customizeProgressBar, true);
        }
    }
};

function deleteElement(elem)
{
    if(elem)
    {
        elem.remove();
    }
};

function customizeProgressBar(progressBar)
{
    if(progressBar)
    {
        progressBar.attr('style', "height:2.4mm; background-color: hsla(0,0%,100%,.1);");
        progressBar.find('.hover-progress').attr('style', "background-color: hsla(0,0%,100%,.2);");
        progressBar.find('.play-progress').attr('style', "background-image: linear-gradient(90deg,rgba(58,168,255,0.3),rgba(36,117,255,0.3));");
    }
};

//Had to directly include waitForKeyElements.js since Greasyfork hasn't approved the include...
//Following function by https://gist.github.com/BrockA
function waitForKeyElements (
    selectorTxt,    /* Required: The jQuery selector string that
                        specifies the desired element(s).
                    */
    actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
    bWaitOnce,      /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
    iframeSelector  /* Optional: If set, identifies the iframe to
                        search.
                    */
) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes     = $(selectorTxt);
    else
        targetNodes     = $(iframeSelector).contents ()
                                           .find (selectorTxt);

    if (targetNodes  &&  targetNodes.length > 0) {
        btargetsFound   = true;
        /*--- Found target node(s).  Go through each and act if they
            are new.
        */
        targetNodes.each ( function () {
            var jThis        = $(this);
            var alreadyFound = jThis.data ('alreadyFound')  ||  false;

            if (!alreadyFound) {
                //--- Call the payload function.
                var cancelFound     = actionFunction (jThis);
                if (cancelFound)
                    btargetsFound   = false;
                else
                    jThis.data ('alreadyFound', true);
            }
        } );
    }
    else {
        btargetsFound   = false;
    }

    //--- Get the timer-control variable for this selector.
    var controlObj      = waitForKeyElements.controlObj  ||  {};
    var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl     = controlObj [controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval (timeControl);
        delete controlObj [controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if ( ! timeControl) {
            timeControl = setInterval ( function () {
                    waitForKeyElements (    selectorTxt,
                                            actionFunction,
                                            bWaitOnce,
                                            iframeSelector
                                        );
                },
                300
            );
            controlObj [controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj   = controlObj;
}
