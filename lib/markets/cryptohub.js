var request = require('request');

var base_url = 'https://cryptohub.online/api/market';

function get_summary(coin, exchange, cb) {
  var summary = {};
  var pair = exchange + '_' + coin;
  var req_url = base_url + '/ticker/' + coin;
  request({
    uri: req_url,
    json: true
  }, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else if (body != undefined) {
      summary.bid = parseFloat(body[pair].highestBid).toFixed(8);
      summary.ask = parseFloat(body[pair].lowestAsk).toFixed(8);
      summary.volume = body[pair].baseVolume;
      summary.high = parseFloat(body[pair].high24hr).toFixed(8);
      summary.low = parseFloat(body[pair].low24hr).toFixed(8);
      summary.last = parseFloat(body[pair].last).toFixed(8);
      summary.change = body[pair].percentChange;
      return cb(null, summary);
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/tradinghist/' + exchange + '_' + coin;
  request({
    uri: req_url,
    json: true
  }, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else if (body != undefined) {
      var tTrades = body;
      var trades = [];
      for (var i = 0; i < tTrades.length; i++) {
        var Trade = {
          ordertype: tTrades[i].type,
          amount: parseFloat(tTrades[i].amount).toFixed(8),
          price: parseFloat(tTrades[i].rate).toFixed(8),
          total: parseFloat(tTrades[i].total).toFixed(8),
          datetime: tTrades[i].date,
          timestamp: tTrades[i].datetime,
          backrate: tTrades[i].rate
        };
        trades.push(Trade);
      }
      return cb(null, trades);
    } else {
      return cb(body.message, null);
    }
  });
}
/*
function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/orderbook/' + exchange + '_' + coin;
  request({
    uri: req_url,
    json: true
  }, function (error, response, body) {
    if (body) {
      var obj = body;
      return cb(null, obj.bids, obj.asks);
    } else {
      return cb('Pair not found ' + coin + '-' + exchange, [], []);
    }
  });
}
*/
function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/orderbook/' + exchange + '_' + coin;
  request({
    uri: req_url,
    json: true
  }, function (error, response, body) {
    if (body) {
      var orders = body;
      var buys = [];
      var sells = [];
      if (orders['bids'].length > 0) {
        for (var i = 0; i < orders['bids'].length; i++) {
          var order = {
            amount: parseFloat(orders.bids[i][1]).toFixed(8),
            price: parseFloat(orders.bids[i][0]).toFixed(8),
            //  total: parseFloat(orders.BuyOrders[i].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
            total: (parseFloat(orders.bids[i][1]).toFixed(8) * parseFloat(orders.bids[i][0])).toFixed(8)
          }
          buys.push(order);
        }
      } else {}
      if (orders['asks'].length > 0) {
        for (var x = 0; x < orders['asks'].length; x++) {
          var order = {
            amount: parseFloat(orders.asks[x][1]).toFixed(8),
            price: parseFloat(orders.asks[x][0]).toFixed(8),
            //    total: parseFloat(orders.SellOrders[x].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
            total: (parseFloat(orders.asks[x][1]).toFixed(8) * parseFloat(orders.asks[x][0])).toFixed(8)
          }
          sells.push(order);
        }
      } else {}
      return cb(null, buys, sells);
    } else {
      return cb(body, [], [])
    }
  });
}

module.exports = {
  get_data: function (coin, exchange, cb) {
    var error = null;
    get_orders(coin, exchange, function (err, buys, sells) {
      if (err) {
        error = err;
      }
      get_trades(coin, exchange, function (err, trades) {
        if (err) {
          error = err;
        }
        get_summary(coin, exchange, function (err, stats) {
          if (err) {
            error = err;
          }
          return cb(error, {
            buys: buys,
            sells: sells,
            chartdata: [],
            trades: trades,
            stats: stats
          });
        });
      });
    });
  }
};