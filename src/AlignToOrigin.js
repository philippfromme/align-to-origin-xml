import align from './align';

import {
  assign,
  isNumber
} from 'min-dash';

var DEFAULT_OPTIONS = {
  offset: {
    x: 150,
    y: 75
  },
  tolerance: 50,
  alignOnSave: true
};

var HIGHER_PRIORITY = 1250;


/**
 * Moves diagram contents to the origin + offset,
 * optionally upon diagram save.
 *
 * @param {Object} config
 * @param {didi.Injector} injector
 * @param {EventBus} eventBus
 * @param {CommandStack} commandStack
 * @param {Canvas} canvas
 * @param {Modeling} modeling
 */
export default function AlignToOrigin(config, injector, eventBus, commandStack, canvas, modeling) {

  /**
   * Return actual config with defaults applied.
   */
  function applyDefaults(config) {

    var c = assign({}, DEFAULT_OPTIONS, config || {});

    if (isNumber(c.offset)) {
      c.offset = {
        x: c.offset,
        y: c.offset
      };
    }

    return c;
  }

  config = applyDefaults(config);

  /**
   * Setup align on save functionality
   */
  function bindOnSave() {
    eventBus.on('saveXML.serialized', HIGHER_PRIORITY, function(event) {
      var xml = event.xml;

      var gridSnapping = injector.get('gridSnapping', false);

      return align(xml, gridSnapping && gridSnapping.getGridSpacing());
    });
  }

  // setup

  if (config.alignOnSave) {
    bindOnSave();
  }

  // API

  this.align = align;

  // internal debugging purposes
  this._config = config;
}

AlignToOrigin.$inject = [
  'config.alignToOrigin',
  'injector',
  'eventBus',
  'commandStack',
  'canvas',
  'modeling'
];