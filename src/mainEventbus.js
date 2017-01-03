'use strict';

import TyphonEvents  from './TyphonEvents.js';

/**
 * Exports an instance of `TyphonEvents` which adds asynchronous capabilities to `Backbone.Events` which is used as a
 * main eventbus. Note that an instance of `TyphonEvents` is exported and is also associated to a mapped path,
 * `mainEventbus` in the SystemJS extra configuration data loaded by all TyphonJS repos in
 * `./config/config-app-paths.js`. By using a mapped path any other module may import the main eventbus via:
 * `import eventbus from 'mainEventbus';`
 */
export default new TyphonEvents("mainEventbus");
