var jsdom = require("jsdom");
var assert = require("assert");
global.window = jsdom.jsdom().parentWindow;
global.jQuery = require("jquery");

global.ko = require("knockout");

global.ejs = require("../node_modules/js-http-client/scripts/js-http-client");

console.debug = function( a, b ) {
  console.log( a, b );
};

require("../scripts/jquery.elasticSearch");

jQuery(window.document.createElement('body')).elasticSearch({
  debug:false,
  endpoint:'http://127.0.0.1:9200/',
  headers: {
    'x-access-key': 'some-key'
  }
});

/**
 * ElasticSearch ViewModel
 * @returns {undefined}
 */
describe('ElasticSearch', function() {
  describe('#ViewModel', function(){
    it('should have _suggester_model as a Funtion', function(){
      assert.equal('function', typeof window.elasticSearchVM._suggester_model);
    });
  });
});

describe('ElasticSearch', function() {
  describe('#ViewModel', function(){
    it('should have _filter_model as a Funtion', function(){
      assert.equal('function', typeof window.elasticSearchVM._filter_model);
    });
  });
});

/** WIP */