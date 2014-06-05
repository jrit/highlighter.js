/* global jQuery */

/*
 * Highlighter.js 1.0
 *
 * Author: Matthew Conlen <matt.conlen@huffingtonpost.com>
 *         Huffington Post Labs
 *
 * Copyright 2012: Huffington Post Labs
 *
 * This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the WTFPL, Version 2, as
 * published by Sam Hocevar. See http://sam.zoy.org/wtfpl/
 * for more details.
 */

(function ($) {
    /*
     * Code for triple click from
     * http://css-tricks.com/snippets/jquery/triple-click-event/
     */
    $.event.special.tripleclick = {

        setup: function (data, namespaces) {
            var elem = this,
                $elem = jQuery(elem);
            $elem.bind('click', jQuery.event.special.tripleclick.handler);
        },

        teardown: function (namespaces) {
            var elem = this,
                $elem = jQuery(elem);
            $elem.unbind('click', jQuery.event.special.tripleclick.handler);
        },

        handler: function (event) {
            var elem = this,
                $elem = jQuery(elem),
                clicks = $elem.data('clicks') || 0;
            clicks += 1;
            if (clicks === 3) {
                clicks = 0;

                // set event type to "tripleclick"
                event.type = "tripleclick";

                // let jQuery handle the triggering of "tripleclick" event handlers
                jQuery.event.dispatch.apply(this, arguments);
            }
            $elem.data('clicks', clicks);
        }
    };

    var methods = {
        init: function (options) {

            var settings = $.extend({
                'selector': '.highlighter-container',
                'minWords': 0,
                'complete': function () { }
            }, options);
            var numClicks = 0;
            var isDown = false;
            var $target = $();

            var selText;

            var show = function () {
                $(settings.selector).addClass("active");
            };

            var hide = function () {
                $(settings.selector).removeClass("active").css("left", "-9999px");
            };

            return this.each(function () {

                var move = function (position, scrollTop) {
                    if (position.bottom - scrollTop + 100 > $(window).height()) {
                        $(settings.selector).css("top", position.top - $(settings.selector).height() - 40 + "px").addClass("position-top");
                    }
                    else {
                        $(settings.selector).css("top", position.bottom + "px").removeClass("position-top");
                    }
                };

                /*
                 * Insert an html <span> after a user selects text.
                 * We then use the X-Y coordinates of that span
                 * to place our tooltip.
                 * Thanks to http://stackoverflow.com/a/3599599 for
                 * some inspiration.
                 */
                function insertSpanAfterSelection(clicks) {
                    var html = "<span class='dummy'><span>";
                    if (numClicks !== clicks) return;
                    var isIE = (navigator.appName === "Microsoft Internet Explorer");
                    var sel, range, expandedSelRange, node;
                    var position;
                    var scrollTop = $(window).scrollTop();

                    if (window.getSelection) {
                        sel = window.getSelection();
                        selText = sel.toString();

                        if ($.trim(selText) === '' || selText.split(' ').length < settings.minWords) {
                            return;
                        }

                        if (sel.getRangeAt && sel.rangeCount) {
                            range = window.getSelection().getRangeAt(0);

                            var bounding = range.getBoundingClientRect();
                            var offset = $target.offsetParent().offset();

                            position = {
                                top: bounding.top + scrollTop,
                                bottom: bounding.bottom + scrollTop,
                                left: (bounding.left + bounding.right) / 2
                            };

                            if (numClicks !== clicks) return;
                            hide();
                        }
                    } else if (document.selection && document.selection.createRange) {
                        range = document.selection.createRange();
                        expandedSelRange = range.duplicate();

                        selText = expandedSelRange.text;
                        if ($.trim(selText) === '' || selText.split(' ').length < settings.minWords) return;

                        range.collapse(false);
                        range.pasteHTML(html);

                        expandedSelRange.setEndPoint("EndToEnd", range);
                        expandedSelRange.select();
                        position = $(".dummy").offset();
                        $(".dummy").remove();
                    }

                    move(position, scrollTop);

                    $(settings.selector).css("left", position.left + "px");
                    show();
                    settings.complete({
                        selection: selText,
                        $element: $(window.getSelection ? window.getSelection().anchorNode.parentElement : "")
                    });
                }
                hide();
                $(settings.selector).css("position", "absolute");
                $(document).bind('mouseup.highlighter', function (e) {
                    if (isDown) {
                        numClicks = 1;
                        clicks = 0;
                        setTimeout(function () {
                            insertSpanAfterSelection(1);
                        }, 300);
                        isDown = false;
                    }
                });
                $(this).bind('mouseup.highlighter', function (e) {
                    numClicks = 1;
                    clicks = 0;
                    setTimeout(function () {
                        insertSpanAfterSelection(1);
                    }, 300);
                });
                $(this).bind('tripleclick.highlighter', function (e) {
                    numClicks = 3;
                    setTimeout(function () {
                        insertSpanAfterSelection(3);
                    }, 200);
                });

                $(this).bind('dblclick.highlighter', function (e) {
                    numClicks = 2;
                    setTimeout(function () {
                        insertSpanAfterSelection(2);
                    }, 300);
                });
                $(this).bind('mousedown.highlighter', function (e) {
                    hide();
                    isDown = true;
                    $target = $(e.target);
                });

            });
        },
        destroy: function (content) {
            return this.each(function () {
                $(document).unbind('mouseup.highlighter');
                $(this).unbind('mouseup.highlighter');
                $(this).unbind('tripleclick.highlighter');
                $(this).unbind('dblclick.highlighter');
                $(this).unbind('mousedown.highlighter');
            });
        }
    };

    /*
     * Method calling logic taken from the
     * jQuery article on best practices for
     * plugins.
     *
     * http://docs.jquery.com/Plugins/Authoring
     */
    $.fn.highlighter = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.highlighter');
        }

    };

})(jQuery);