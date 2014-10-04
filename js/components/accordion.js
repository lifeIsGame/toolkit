define([
    'jquery',
    './component',
    '../extensions/bound',
    '../extensions/shown-selector'
], function($, Toolkit) {

Toolkit.Accordion = Toolkit.Component.extend({
    name: 'Accordion',
    version: '1.4.0',

    /** Collection of header elements. */
    headers: [],

    /* Last opened section index. */
    index: 0,

    /** Collection of section elements. */
    sections: [],

    /**
     * Initialize the accordion.
     *
     * @param {jQuery} element
     * @param {Object} [options]
     */
    constructor: function(element, options) {
        var self = this;

        this.element = element = $(element).attr('role', 'tablist');
        this.options = options = this.setOptions(options, element);

        // Find headers and cache the index of each header and set ARIA attributes
        this.headers = element.find('[data-accordion-header]').each(function(index) {
            $(this)
                .data('accordion-index', index)
                .attr({
                    role: 'tab',
                    id: self.id('header', index)
                })
                .aria({
                    controls: self.id('section', index),
                    selected: false,
                    expanded: false
                });
        });

        // Find sections and cache the height so we can use for sliding and set ARIA attributes
        this.sections = element.find('[data-accordion-section]').each(function(index) {
            $(this)
                .attr({
                    role: 'tabpanel',
                    id: self.id('section', index)
                })
                .aria('labelledby', self.id('header', index))
                .conceal();
        });

        // Set events
        this.events = {
            '{mode} element [data-accordion-header]': 'onShow'
        };

        // Initialize
        this.initialize();

        // Jump to the index on page load
        this.calculate();
        this.jump(options.defaultIndex);
    },

    /**
     * Reveal all sections before destroying.
     */
    destructor: function() {
        this.headers.parent().removeClass('is-active');
        this.sections.attr('style', '').reveal();
    },

    /**
     * Loop through each section and calculate/cache it's current height.
     * An optional callback can be defined that will be used for height calculation.
     *
     * @param {Function} [callback]
     */
    calculate: function(callback) {
        if (typeof callback !== 'function') {
            callback = function(section) {
                return section.outerHeight();
            };
        }

        this.sections.each(function() {
            var self = $(this),
                className = self.hasClass('hide') ? 'hide' : 'show',
                maxHeight = self.css('max-height');

            // Make section visible
            self.addClass('no-transition').removeClass(className).css('max-height', '');

            // Get the height
            var height = callback.call(this, self);

            // Set section back to previous state
            self.addClass(className).css('max-height', maxHeight).removeClass('no-transition');

            // Set the height
            self.data('accordion-height', height);

            if (self.hasClass('show')) {
                self.css('max-height', height);
            }
        });
    },

    /**
     * Go to the section indicated by the index number.
     * If the index is too large, jump to the beginning.
     * If the index is too small, jump to the end.
     *
     * @param {Number} index
     */
    jump: function(index) {
        this.show(this.headers[$.bound(index, this.headers.length)]);
    },

    /**
     * Toggle the section display of a row via the header click/hover event.
     * Take into account the multiple and collapsible options.
     *
     * @param {jQuery} header
     */
    show: function(header) {
        header = $(header);

        var options = this.options,
            parent = header.parent(), // li
            section = header.next(), // section
            index = header.data('accordion-index'),
            height = parseInt(section.data('accordion-height'), 10),
            isNode = (this.node && this.node.is(header));

        this.fireEvent('showing', [section, header, this.index]);

        // Allow simultaneous open and closed sections
        // Or allow the same section to collapse
        if (options.mode === 'click' && (options.multiple || options.collapsible && isNode)) {
            if (section.is(':shown') && this.node) {
                section.css('max-height', 0).conceal(true);
                parent.removeClass('is-active');
                header.aria('toggled', false);

            } else {
                section.css('max-height', height).reveal(true);
                parent.addClass('is-active');
                header.aria('toggled', true);
            }

        // Only one open at a time
        } else {

            // Exit early so we don't mess with animations
            if (isNode) {
                return;
            }

            this.sections.css('max-height', 0).conceal(true);
            section.css('max-height', height).reveal(true);

            this.headers.aria('toggled', false);
            header.aria('toggled', true);

            this.element.children('li').removeClass('is-active');
            parent.addClass('is-active');
        }

        this.index = index;
        this.node = header;

        this.fireEvent('shown', [section, header, index]);
    }

}, {
    mode: 'click',
    defaultIndex: 0,
    multiple: false,
    collapsible: false
});

Toolkit.create('accordion', function(options) {
    return new Toolkit.Accordion(this, options);
});

return Toolkit;
});