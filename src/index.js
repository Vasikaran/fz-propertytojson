var fs = require('fs');
var path = require('path');
function isComment(str) {
  return str.startsWith('#');
}
function stringToJson(str) {
  var lines = str.split('\n');
  var json = {};
  lines.forEach(line => {
    if (!isComment(line) && !(line == '')) {
      var indexOfEqual = line.indexOf('=');
      var key = line.substring(0, indexOfEqual);
      var value = line.substring(indexOfEqual + 1);
      if (!json[key]) {
        json[key] = value;
      }
    }
  });
  return json;
}
function jsonToString(json, context) {
  var str = 'var ' + context.trim() + 'I18n={';
  var keys = Object.keys(json);
  keys.forEach((key, i) => {
    var value = json[key];
    str +=
      '"' +
      key +
      '":"' +
      value
        .replace(/.?\"/g, function(match) {
          if (match[0] == '\\') {
            return match;
          } else if (match.length == 2) {
            return match[0] + '\\' + match[1];
          } else {
            return '\\' + match;
          }
        })
        .replace(/(\r\n|\n|\r)/g, '') +
      '"';
    if (i != keys.length - 1) str += ',';
  });
  str += '}';
  return str;
}
export default function folderIterate(
  propertyFolder,
  i18nFolder,
  baseProperty,
  jsProperty,
  context = 'i18n'
) {
  var basePropertyStr = fs.readFileSync(baseProperty).toString();
  var basePropertyJson = stringToJson(basePropertyStr);
  var jsPropertyStr = fs.readFileSync(jsProperty).toString();
  try {
    var jsPropertyJson = JSON.parse(jsPropertyStr);
  } catch (e) {
    var jsPropertyJson = stringToJson(jsPropertyStr);
  }

  fs.readdir(propertyFolder, function(err, files) {
    files.forEach(function(file) {
      var location = path.join(propertyFolder, file);
      if (fs.statSync(location).isDirectory()) {
        console.log('dir' + file);
      } else {
        if (
          location != jsProperty &&
          location != baseProperty &&
          file.endsWith('.properties')
        ) {
          var str = fs.readFileSync(location).toString();
          var json = stringToJson(str);
          var outputJson = Object.keys(jsPropertyJson).reduce(function(
            result,
            key
          ) {
            result[key] =
              json[key] || basePropertyJson[key] || jsPropertyJson[key];
            return result;
          }, {});
          var underScoreIndex = file.indexOf('_');
          var outputFileName = 'en_US.js';
          if (underScoreIndex != -1) {
            outputFileName = file.substring(
              underScoreIndex + 1,
              file.indexOf('.')
            );
            outputFileName += '.js';
          }
          console.log(file);
          if (!fs.existsSync(i18nFolder)) {
            fs.mkdir(i18nFolder);
          }
          fs.writeFileSync(
            path.join(i18nFolder, outputFileName),
            jsonToString(outputJson, context)
          );
        }
      }
    });
  });
}

/*var propertyFolder = process.argv[2];
var i18nFolder = process.argv[3];
var baseProperty = process.argv[4];
var jsProperty = process.argv[5];
folderIterate(propertyFolder,i18nFolder, baseProperty, jsProperty);
*/
