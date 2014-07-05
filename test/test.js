var jsdom = require("jsdom");
var chai = require("chai");
var assert = chai.assert;

global.window = jsdom.jsdom().parentWindow;
global.jQuery = require("jquery");

global.ko = require("knockout");

global.ejs = require("../node_modules/js-http-client/scripts/js-http-client");

console.debug = function( a, b ) {
  console.log( a, b );
};

require("../scripts/jquery.elasticSearch");

var body = window.document.createElement('body');

jQuery(body).elasticSearch({
  debug:false,
  endpoint:'http://127.0.0.1:9200/',
  headers: {
    'x-access-key': 'some-key'
  }
});

/**
 * ElasticSearch
 * @returns {undefined}
 */
describe('ElasticSearch', function() {

  /**
   * ViewModel tests
   * @returns {undefined}
   */
  describe('#ViewModel', function(){
    it('should have _suggester_model as a Funtion', function(){
      assert.typeOf(window.elasticSearchVM._suggester_model, 'function');
    });
    it('should have _filter_model as a Funtion', function(){
      assert.typeOf(window.elasticSearchVM._filter_model, 'function');
    });
  });

  /**
   * Test FilterModel
   * @type window.elasticSearchVM._filter_model
   */
  var fm = new window.elasticSearchVM._filter_model( 'test_scope' );
  describe('#FilterModel', function(){

    it('should contain "scope" property equal to "test_scope"', function(){
      assert.propertyVal(fm, 'scope', 'test_scope');
    });

    it('should contain "documents" property typeof function and equal to []', function(){
      assert.property(fm, 'documents');
      assert.typeOf(fm.documents, 'function');
      assert.deepEqual(fm.documents(), []);
    });

    it('should contain "total" property typeof function and equal to 0', function(){
      assert.property(fm, 'total');
      assert.typeOf(fm.total, 'function');
      assert.equal(fm.total(), 0);
    });

    it('should contain "facets" property typeof function and equal to []', function(){
      assert.property(fm, 'facets');
      assert.typeOf(fm.facets, 'function');
      assert.deepEqual(fm.facets(), []);
    });

    it('should contain "moreCount" property typeof function and equal to 0', function(){
      assert.property(fm, 'moreCount');
      assert.typeOf(fm.moreCount, 'function');
      assert.equal(fm.moreCount(), 0);
    });

    it('should contain "facetLabels" property typeof function and equal to {}', function(){
      assert.property(fm, 'facetLabels');
      assert.typeOf(fm.facetLabels, 'function');
      assert.deepEqual(fm.facetLabels(), {});
    });

    it('should contain "has_more_documents" property typeof function and be TRUE for (total > count)', function(){
      assert.property(fm, 'has_more_documents');
      assert.typeOf(fm.has_more_documents, 'function');
      fm.total(2);
      fm.documents([1]);
      assert.isTrue(fm.has_more_documents());
      fm.total(2);
      fm.documents([1,2,3]);
      assert.isFalse(fm.has_more_documents());
    });

    it('should contain "count" property typeof function and equal to actual count of documents', function(){
      assert.property(fm, 'count');
      assert.typeOf(fm.count, 'function');
      fm.documents([]);
      assert.equal(fm.count(), 0);
      fm.documents([1,2,3]);
      assert.equal(fm.count(), 3);
    });
  });

  /**
   * Test FilterModel
   * @type window.elasticSearchVM._filter_model
   */
  var sm = new window.elasticSearchVM._suggester_model( 'test_scope' );
  describe('#SuggesterModel', function(){

    it('should contain scope property equal to "test_scope"', function(){
      assert.property(sm, 'scope');
      assert.equal(sm.scope, 'test_scope');
    });

    it('should contain documents property typeof function', function(){
      assert.property(sm, 'documents');
      assert.typeOf(sm.documents, 'function');
    });
  });


});

/** WIP */