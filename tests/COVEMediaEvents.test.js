var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var chaiSpies = require('chai-spies');

chai.use(chaiAsPromised);
chai.use(chaiSpies);

var COVEMessageAPI = require('./../src/COVEMediaEvents');

var expect = chai.expect;
