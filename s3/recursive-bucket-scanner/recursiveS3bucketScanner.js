'use strict';

var AWS = require('aws-sdk');
var _ = require('underscore'); // FIXME lodash-compatible?
 
var s3 = new AWS.S3();
 
// How many keys to retrieve with a single request to the S3 API.
// Larger key sets require paging and multiple calls.
var maxKeys = 1000;

if(process.argv.length > 2) {
	var bucketName = process.argv[2];
	console.log('Scanning ' + bucketName + ' for globally accessible objects ...');
	scanBucket(bucketName);
}
else {
	// TODO improved handling
	console.log('Please pass the name of the bucket to scan as a commandline argument');
}

function scanBucket (bucketName) {
  var params = { bucket: bucketName };
  listKeys(params, function(error, keys) {
    if (error) console.log(error);
    else {
      for (var key in keys) {
        checkObjectAcl(bucketName, keys[key]);
      }
    }
  });
}

function checkObjectAcl(bucketName, objectKey) {
  var params = {
    Bucket: bucketName,
    Key: objectKey
  };
  s3.getObjectAcl(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
      else {
        for (var grant in data.Grants) {
          var grantee = data.Grants[grant].Grantee;
          if(grantee.Type === 'Group') {
            var who = 'Unknown user (verify in console)';
            if(grantee.URI === "http://acs.amazonaws.com/groups/global/AuthenticatedUsers") who = "AuthenticatedUsers";
            else if(grantee.URI === "http://acs.amazonaws.com/groups/global/AllUsers") who = "AllUsers";
            var permission = data.Grants[grant].Permission;
            console.log(bucketName + '/' + objectKey + ' | ' + who + " | " + permission);
          }
        }
    }
  });
}
 
/**
 * List keys from the specified bucket.
 * 
 * If providing a prefix, only keys matching the prefix will be returned.
 *
 * If providing a delimiter, then a set of distinct path segments will be
 * returned from the keys to be listed. This is a way of listing "folders"
 * present given the keys that are there.
 *
 * @param {Object} options
 * @param {String} options.bucket - The bucket name.
 * @param {String} [options.prefix] - If set only return keys beginning with
 *   the prefix value.
 * @param {String} [options.delimiter] - If set return a list of distinct
 *   folders based on splitting keys by the delimiter.
 * @param {Function} callback - Callback of the form function (error, string[]).
 */
function listKeys (options, callback) {
  var keys = [];
 
  /**
   * Recursively list keys.
   *
   * @param {String|undefined} marker - A value provided by the S3 API
   *   to enable paging of large lists of keys. The result set requested
   *   starts from the marker. If not provided, then the list starts
   *   from the first key.
   */
  function listKeysRecusively (marker) {
    options.marker = marker;
 
    listKeyPage(
      options,
      function (error, nextMarker, keyset) {
        if (error) {
          return callback(error, keys);
        }
 
        keys = keys.concat(keyset);
 
        if (nextMarker) {
          listKeysRecusively(nextMarker);
        } else {
          callback(null, keys);
        }
      }
    );
  }
 
  // Start the recursive listing at the beginning, with no marker.
  listKeysRecusively();
}
 
/**
 * List one page of a set of keys from the specified bucket.
 * 
 * If providing a prefix, only keys matching the prefix will be returned.
 *
 * If providing a delimiter, then a set of distinct path segments will be
 * returned from the keys to be listed. This is a way of listing "folders"
 * present given the keys that are there.
 *
 * If providing a marker, list a page of keys starting from the marker
 * position. Otherwise return the first page of keys.
 *
 * @param {Object} options
 * @param {String} options.bucket - The bucket name.
 * @param {String} [options.prefix] - If set only return keys beginning with
 *   the prefix value.
 * @param {String} [options.delimiter] - If set return a list of distinct
 *   folders based on splitting keys by the delimiter.
 * @param {String} [options.marker] - If set the list only a paged set of keys
 *   starting from the marker.
 * @param {Function} callback - Callback of the form 
    function (error, nextMarker, keys).
 */
function listKeyPage (options, callback) {
  var params = {
    Bucket : options.bucket,
    Delimiter: options.delimiter,
    Marker : options.marker,
    MaxKeys : maxKeys,
    Prefix : options.prefix
  };
 
  s3.listObjects(params, function (error, response) {
    if (error) {
      return callback(error);
    } else if (response.err) {
      return callback(new Error(response.err));
    }
 
    // Convert the results into an array of key strings, or
    // common prefixes if we're using a delimiter.
    var keys;
    if (options.delimiter) {
      // Note that if you set MaxKeys to 1 you can see some interesting
      // behavior in which the first response has no response.CommonPrefix
      // values, and so we have to skip over that and move on to the 
      // next page.
      keys = _.map(response.CommonPrefixes, function (item) {
        return item.Prefix;
      });
    } else {
      keys = _.map(response.Contents, function (item) {
        return item.Key;
      });
    }
 
    // Check to see if there are yet more keys to be obtained, and if so
    // return the marker for use in the next request.
    var nextMarker;
    if (response.IsTruncated) {
      if (options.delimiter) {
        // If specifying a delimiter, the response.NextMarker field exists.
        nextMarker = response.NextMarker;
      } else {
        // For normal listing, there is no response.NextMarker
        // and we must use the last key instead.
        nextMarker = keys[keys.length - 1];
      }
    }
 
    callback(null, nextMarker, keys);
  });
}
