// Main scripts
var jsdom = require("jsdom");
var chai = require("chai");
var assert = chai.assert;

// do jQuery
global.window = jsdom.jsdom().parentWindow;
global.jQuery = require("jquery");

// Require KO
global.ko = require("knockout");

// Init HTTP Client
global.ejs = require("../node_modules/js-http-client/scripts/js-http-client");

/**
 * Emulate debug function
 * @param {type} a
 * @param {type} b
 * @returns {undefined}
 */
console.debug = function(a, b) {
  console.log(a, b);
};

// Include plugin
require("../scripts/jquery.elasticSearch");

// Create body
var body = window.document.createElement('body');

/**
 * Initialize with dummy data
 * @param {type} param
 */
jQuery(body).elasticSearch({
  debug: false,
  endpoint: 'http://127.0.0.1:9200/',
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
   * Models
   * @returns {undefined}
   */
  describe('#Models', function() {

    /**
     * ViewModel tests
     * @returns {undefined}
     */
    describe('#ViewModel', function() {
      it('should have _suggester_model as a Funtion', function() {
        assert.typeOf(window.elasticSearchVM._suggester_model, 'function');
      });
      it('should have _filter_model as a Funtion', function() {
        assert.typeOf(window.elasticSearchVM._filter_model, 'function');
      });
    });

    /**
     * Test FilterModel
     * @type window.elasticSearchVM._filter_model
     */
    var fm = new window.elasticSearchVM._filter_model('test_scope');
    describe('#FilterModel', function() {

      it('should contain "scope" property equal to "test_scope"', function() {
        assert.propertyVal(fm, 'scope', 'test_scope');
      });

      it('should contain "documents" property typeof function and equal to []', function() {
        assert.property(fm, 'documents');
        assert.typeOf(fm.documents, 'function');
        assert.deepEqual(fm.documents(), []);
      });

      it('should contain "total" property typeof function and equal to 0', function() {
        assert.property(fm, 'total');
        assert.typeOf(fm.total, 'function');
        assert.equal(fm.total(), 0);
      });

      it('should contain "facets" property typeof function and equal to []', function() {
        assert.property(fm, 'facets');
        assert.typeOf(fm.facets, 'function');
        assert.deepEqual(fm.facets(), []);
      });

      it('should contain "moreCount" property typeof function and equal to 0', function() {
        assert.property(fm, 'moreCount');
        assert.typeOf(fm.moreCount, 'function');
        assert.equal(fm.moreCount(), 0);
      });

      it('should contain "facetLabels" property typeof function and equal to {}', function() {
        assert.property(fm, 'facetLabels');
        assert.typeOf(fm.facetLabels, 'function');
        assert.deepEqual(fm.facetLabels(), {});
      });

      it('should contain "has_more_documents" property typeof function and be TRUE for (total > count)', function() {
        assert.property(fm, 'has_more_documents');
        assert.typeOf(fm.has_more_documents, 'function');
        fm.total(2);
        fm.documents([1]);
        assert.isTrue(fm.has_more_documents());
        fm.total(2);
        fm.documents([1, 2, 3]);
        assert.isFalse(fm.has_more_documents());
      });

      it('should contain "count" property typeof function and equal to actual count of documents', function() {
        assert.property(fm, 'count');
        assert.typeOf(fm.count, 'function');
        fm.documents([]);
        assert.equal(fm.count(), 0);
        fm.documents([1, 2, 3]);
        assert.equal(fm.count(), 3);
      });
    });

    /**
     * Test FilterModel
     * @type window.elasticSearchVM._filter_model
     */
    var sm = new window.elasticSearchVM._suggester_model('test_scope');
    describe('#SuggesterModel', function() {

      it('should contain "scope" property equal to "test_scope"', function() {
        assert.property(sm, 'scope');
        assert.equal(sm.scope, 'test_scope');
      });

      it('should contain "_notify" property', function() {
        assert.property(sm, '_notify');
      });

      it('should contain "documents" property typeof function and equal to []', function() {
        assert.property(sm, 'documents');
        assert.typeOf(sm.documents, 'function');
        assert.deepEqual(sm.documents(), []);
      });

      it('should contain "types" property typeof function and equal to {}', function() {
        assert.property(sm, 'types');
        assert.typeOf(sm.types, 'function');
        assert.deepEqual(sm.types(), {});
      });

      it('should contain "loading" property equal to false', function() {
        assert.property(sm, 'loading');
        assert.isFalse(sm.loading());
      });

      it('should contain "count" property typeof function and equal to actual count of documents', function() {
        assert.property(sm, 'count');
        assert.typeOf(sm.count, 'function');
        sm.documents([]);
        assert.equal(sm.count(), 0);
        sm.documents([1, 2, 3]);
        assert.equal(sm.count(), 3);
      });

      it('should contain "has_text" property equal to false', function() {
        assert.property(sm, 'has_text');
        assert.isFalse(sm.has_text());
      });

      it('should contain "visible" property equal to false', function() {
        assert.property(sm, 'visible');
        assert.isFalse(sm.visible());
      });

      it('should contain "clear" property typeof function', function() {
        assert.property(sm, 'clear');
        assert.typeOf(sm.clear, 'function');
      });

    });
  });

  /**
   *
   * @returns {undefined}
   */
  var esb = window.elasticSearchBindings;
  describe('#KO Bindings', function() {

    it('should contain "elasticSuggest" property typeof object', function() {
      assert.property(esb, 'elasticSuggest');
      assert.typeOf(esb.elasticSuggest, 'object');
    });

    it('should contain "elasticFilter" property typeof object', function() {
      assert.property(esb, 'elasticFilter');
      assert.typeOf(esb.elasticFilter, 'object');
    });

    it('should contain "elasticSortControl" property typeof object', function() {
      assert.property(esb, 'elasticSortControl');
      assert.typeOf(esb.elasticSortControl, 'object');
    });

    it('should contain "elasticTimeControl" property typeof object', function() {
      assert.property(esb, 'elasticTimeControl');
      assert.typeOf(esb.elasticTimeControl, 'object');
    });

    it('should contain "filterShowMoreControl" property typeof object', function() {
      assert.property(esb, 'filterShowMoreControl');
      assert.typeOf(esb.filterShowMoreControl, 'object');
    });

    it('should contain "foreachprop" property typeof object', function() {
      assert.property(esb, 'foreachprop');
      assert.typeOf(esb.foreachprop, 'object');
    });

    /**
     * Test elastic suggest
     * @returns {undefined}
     */
    describe('#elasticSuggest', function() {

      it('init - OK', function() {
        assert.property(esb.elasticSuggest, 'init');
        assert.typeOf(esb.elasticSuggest.init, 'function');
      });

      it('settings - OK', function() {
        assert.property(esb.elasticSuggest, 'settings');
        assert.typeOf(esb.elasticSuggest.settings, 'function');
      });

      it('query builder - OK', function() {
        assert.property(esb.elasticSuggest, 'buildQuery');
        assert.typeOf(esb.elasticSuggest.buildQuery, 'function');
      });

      it('submit - OK', function() {
        assert.property(esb.elasticSuggest, 'submit');
        assert.typeOf(esb.elasticSuggest.submit, 'function');
      });

      /**
       * Test buildQuery function
       * @returns {undefined}
       */
      describe('#buildQuery', function() {

        it('should return correct object', function() {

          esb.elasticSuggest['test_scope'] = new esb.elasticSuggest.settings();
          assert.equal(esb.elasticSuggest.buildQuery('test string', 'test_scope')
                  .query
                  .filtered
                  .query
                  .match
                  ._all
                  .query, 'test string');

        });

      });

    });

    /**
     * Test elastic filter
     * @returns {undefined}
     */
    describe('#elasticFilter', function() {

      it('init - OK', function() {
        assert.property(esb.elasticFilter, 'init');
        assert.typeOf(esb.elasticFilter.init, 'function');
      });

      it('settings - OK', function() {
        assert.property(esb.elasticFilter, 'settings');
        assert.typeOf(esb.elasticFilter.settings, 'function');
      });

      it('flush settings - OK', function() {
        assert.property(esb.elasticFilter, 'flushSettings');
        assert.typeOf(esb.elasticFilter.flushSettings, 'function');
      });

      it('query builder - OK', function() {
        assert.property(esb.elasticFilter, 'buildQuery');
        assert.typeOf(esb.elasticFilter.buildQuery, 'function');
      });

      it('submit - OK', function() {
        assert.property(esb.elasticFilter, 'submit');
        assert.typeOf(esb.elasticFilter.submit, 'function');
      });

      /**
       * Test buildQuery function
       * @returns {undefined}
       */
      describe('#buildQuery', function() {

        it('should return correct object', function() {

          esb.elasticFilter['test_scope'] = new esb.elasticFilter.settings();
          assert.deepEqual(esb.elasticFilter.buildQuery('test_scope'), {
            "facets": {},
            "fields": null,
            "from": 0,
            "query": {
              "filtered": {
                "filter": {
                  "bool": {
                    "must": [
                      {
                        "range": {
                          "date": {
                            "gte": "now"
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            "size": 20,
            "sort": [
              {
                "date": {
                  "order": "asc"
                }
              }
            ]
          });

        });

      });

    });

  });

  /**
   * Test Helpers
   * @returns {undefined}
   */
  describe('#Helpers', function(){

    /**
     * Test form serializer
     * @returns {undefined}
     */
    describe('#serializeObject', function(){

      it('should correctly convert form data to JavaScript Object', function(){
        assert.deepEqual(
          jQuery(body)
            .append('<form><input name="test[bar]" value="bar" /><input name="test[foo]" value="foo" /><input name="test[bar][foo]" value="bar_foo" /></form>')
            .find('form')
            .serializeObject(),
          {
            test: {
              bar: {
                foo: 'bar_foo'
              },
              foo: 'foo'
            }
          }
        );
      });

    });

    /**
     * Test object cleaner
     * @returns {undefined}
     */
    describe('#cleanObject', function(){

      it('should clean objects from empty values', function(){
        assert.deepEqual( jQuery().cleanObject(
          {
            foo: {},
            bar: {
              foo: {},
              bar: {
                foo: 10,
                bar: 0,
                tee: {}
              }
            }
          }
        ), { bar: { bar: { foo: 10, bar: 0 } } } );
      });

    });

  });

});

/** WIP */