/*jslint browser: true, unparam: true */
/*global jQuery, ui, rulesEngine, defaultOptions, zxcvbn, console */

/*
* jQuery Password Strength plugin for Zurb Foundation
*
* Copyright (c) 2008-2013 Tane Piper
* Copyright (c) 2013 Alejandro Blanco
* Dual licensed under the MIT and GPL licenses.
*/

var methods = {};

(function ($, methods) {
    "use strict";
    var onKeyUp, applyToAll;

    onKeyUp = function (event) {
        var $el = $(event.target),
            options = $el.data("pwstrength-foundation"),
            word = $el.val(),
            userInputs,
            verdictText,
            verdictLevel,
            score;

        if (options === undefined) { return; }

        options.instances.errors = [];
        if (word.length === 0) {
            score = 0;
        } else {
            if (options.common.zxcvbn) {
                userInputs = [];
                $.each(options.common.userInputs, function (idx, selector) {
                    userInputs.push($(selector).val());
                });
                userInputs.push($(options.common.usernameField).val());
                if (options.ui.showErrors) {
                    rulesEngine.executeRules(options, word);
                }
                score = zxcvbn(word, userInputs).entropy;
            } else {
                score = rulesEngine.executeRules(options, word);
            }
        }
        ui.updateUI(options, $el, score);
        verdictText = ui.getVerdictAndCssClass(options, score);
        verdictLevel = verdictText[2];
        verdictText = verdictText[0];

        if (options.common.debug) { console.log(score + ' - ' + verdictText); }

        if ($.isFunction(options.common.onKeyUp)) {
            options.common.onKeyUp(event, {
                score: score,
                verdictText: verdictText,
                verdictLevel: verdictLevel
            });
        }
    };

    methods.init = function (settings) {
        this.each(function (idx, el) {
            // Make it deep extend (first param) so it extends too the
            // rules and other inside objects
            var clonedDefaults = $.extend(true, {}, defaultOptions),
                localOptions = $.extend(true, clonedDefaults, settings),
                $el = $(el);

            localOptions.instances = {};
            $el.data("pwstrength-foundation", localOptions);
            $el.on("keyup", onKeyUp);
            $el.on("change", onKeyUp);
            $el.on("onpaste", onKeyUp);

            ui.initUI(localOptions, $el);
            if ($.trim($el.val())) { // Not empty, calculate the strength
                $el.trigger("keyup");
            }

            if ($.isFunction(localOptions.common.onLoad)) {
                localOptions.common.onLoad();
            }
        });

        return this;
    };

    methods.destroy = function () {
        this.each(function (idx, el) {
            var $el = $(el),
                options = $el.data("pwstrength-foundation"),
                elements = ui.getUIElements(options, $el);
            elements.$progressbar.remove();
            elements.$verdict.remove();
            elements.$errors.remove();
            $el.removeData("pwstrength-foundation");
        });
    };

    methods.forceUpdate = function () {
        this.each(function (idx, el) {
            var event = { target: el };
            onKeyUp(event);
        });
    };

    methods.addRule = function (name, method, score, active) {
        this.each(function (idx, el) {
            var options = $(el).data("pwstrength-foundation");

            options.rules.activated[name] = active;
            options.rules.scores[name] = score;
            options.rules.extra[name] = method;
        });
    };

    applyToAll = function (rule, prop, value) {
        this.each(function (idx, el) {
            $(el).data("pwstrength-foundation").rules[prop][rule] = value;
        });
    };

    methods.changeScore = function (rule, score) {
        applyToAll.call(this, rule, "scores", score);
    };

    methods.ruleActive = function (rule, active) {
        applyToAll.call(this, rule, "activated", active);
    };

    $.fn.pwstrength = function (method) {
        var result;

        if (methods[method]) {
            result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === "object" || !method) {
            result = methods.init.apply(this, arguments);
        } else {
            $.error("Method " +  method + " does not exist on jQuery.pwstrength-foundation");
        }

        return result;
    };
}(jQuery, methods));
