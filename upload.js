var Q = require('q'),
	AWS = require('aws-sdk'),
	uuid = require('node-uuid'),
	express = require('express'),
  bodyParser = require('body-parser'),
  httpRequest = require('request'),
  app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// hook for CORS
app.use(function(req, res, next) {
  var oneof = false;
  if (req.headers.origin) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    oneof = true;
  }
  if (req.headers['access-control-request-method']) {
    res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
    oneof = true;
  }
  if (req.headers['access-control-request-headers']) {
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
    oneof = true;
  }
  if (oneof) {
    res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
  }
  res.header("Access-Control-Expose-Headers", "Content-Length, x-items-count");
  res.header("Access-Control-Allow-Credentials", "true");

  // intercept OPTIONS method
  if (oneof && req.method == 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
});

// handle OPTIONS requests from the browser
app.options("*", function(req,res,next){res.send(200);});


var aws_config = {
  "accessKeyId": "KEY",
  "secretAccessKey": "SECRET",
  "region": "REGION",
  "bucket": "BUCKET"
}

AWS.config.update({accessKeyId: aws_config.accessKeyId, secretAccessKey: aws_config.secretAccessKey});

var s3 = new AWS.S3({region: aws_config.region});

app.get('/signedUrl',function(req, res, next){

  var options = req.query;
  fileName = (options.skipUniqueId!="" && options.skipUniqueId!=undefined)?uuid.v4() + '-' + options.name:options.name;
  fileName = (options.appendName!="" && options.appendName!=undefined)?options.appendName + fileName:fileName;
  fileName = (options.folderStructure!="" && options.folderStructure!=undefined)?options.folderStructure+'/'+fileName:fileName;
	console.log(fileName);
  var s3_params = {
    Bucket: aws_config.bucket,
    Key: fileName,
    ACL: 'public-read',
    Expires: 600,
    ContentType: options.type
  };

  s3.getSignedUrl('putObject', s3_params, function(err, data){
		var data = {
      signedUrl: data,
      url: 'https://s3-'+aws_config.region + '.amazonaws.com/' + aws_config.bucket + '/' + fileName,
      key : fileName
    };
    if(err){
			res.send({success: false, data: err});
    }else{
			res.send({success: true, data: data});
		}
	});
})
app.listen(3005, function () {
  console.log('Example app listening on port 3005!')
})

