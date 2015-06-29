/*!
 * Merchant e-Solutions Javascript Tokenization API
 * http://www.merchante-solutions.com
 *
 * V1.1 11/13/2013
 * Copyright 2012 Merchant e-Solutions
 */
var Mes = {
    mod10: function (e) {
        var t, n, r, i, s, o;
        r = !0, i = 0, n = (e + "").split("").reverse();
        for (s = 0, o = n.length; s < o; s++) {
            t = n[s], t = parseInt(t, 10);
            if (r = !r) t *= 2;
            t > 9 && (t -= 9), i += t
        }
        return i % 10 === 0
    },
    tokenize: function(cc, exp, cb) {
        var cors = Mes.getCORS(cb);
        
        // Validate CORS compatibility
        if (!cors)
            Mes.complete({'code': 1, 'text': 'Unsupported Browser' }, cb);
        // Validate Card num with LUHN
        else if(!Mes.valCc(cc))
            Mes.complete({'code': 2, 'text': 'Invalid Card Number' }, cb);
        // Validate expiry date
        else if(!Mes.valExpiry(exp))
            Mes.complete({'code': 3, 'text': 'Invalid Expiry Date' }, cb);
        else {
            // CORS Error Handler
            cors.onerror = function() {
                Mes.complete({'code': 6, 'text': 'Transmission Error' }, cb);
            };
            // CORS Finish Handler
            cors.onload = function() {
                // Validate HTTP Status code (only works with XMLHttpRequest, XDomainRequest goes straight to the error handler when status isn't 200)
                if(typeof cors.status != "undefined" && cors.status !== 200)
                    Mes.complete({'code': 5, 'text': 'Http code '+cors.status+' recieved' }, cb)
                else {
                    var json = Mes.parseJSON(cors.responseText);
                    // Validate for gateway errors
                    if(json['error_code'] != "000")
                        Mes.complete({'code': 4, 'text': 'Gateway Error', 'gateway_text': json['auth_response_text'], 'gateway_error': json['error_code'] }, cb);
                    else
                        Mes.complete({'code': 0, 'text': 'Success', 'token': json['transaction_id'], 'card_number': json['card_number_truncated'], 'hash': json['resp_hash'] }, cb);
                }
            };
            // Send request
            cors.send("transaction_type=T&card_number="+cc+"&card_exp_date="+exp+"&resp_encoding=json&rctl_card_number_truncated=Y&rctl_resp_hash=Y");
        }
    },
    valCc: function(cc) {
        return Mes.mod10(cc) && cc.length != 0;
    },
    valExpiry: function(exp) {
        return exp.length == 4;
    },
    parseJSON: function(json) {
        var result;
        // Last resort for browsers which don't support the JSON object.
        if(typeof JSON !== 'object')
            result = eval("(function(){return "+json+";})()");
        // Prefer in-browser parse, or jQuery, if present.
        else 
            result = JSON && JSON.parse(json) || $.parseJSON(json);
        return result;
    },
    getCORS: function(cb) {
        // CORS not supported by default.
        var cors = null, url = "https://api.merchante-solutions.com/mes-api/tridentApi";
        //url = "http://10.1.71.25:8081/mes-api/tridentApi";
        
        // IE6 reports XmlHttpRequest as undefined, IE7 unfortunatly reports as an object.
        if(typeof XMLHttpRequest != "undefined") {
            cors = new XMLHttpRequest();
            
            // Prefer XMLHttpRequest (Chrome/Firefox/Opera/Safari/IE10).
            if ("withCredentials" in cors) {
                cors.open("POST", url, true);
                cors.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                cors.setRequestHeader("x-requested-with", "XMLHttpRequest");
            }
            // Fallback; attempt XDomainRequest (for IE8,9).
            else if (typeof XDomainRequest != "undefined") {
                cors = new XDomainRequest();
                cors.onprogress = function() { };
                cors.ontimeout = function() { };
                
                // Handle the exception XDomainRequest will throw when opening a request across scheme (SSL to non-SSL or vice versa).
                try {
                    cors.open("POST", url);
                }
                catch(e) {
                    Mes.complete({'code': 7, 'text': e.message }, cb)
                    throw e; // Rethrow to terminate execution
                }
            }
            // CORS Unsupported (IE7).
            else
                cors = null;
        }
        return cors;
    },
    complete: function(rsp, cb) {
        return typeof cb == "function" ? cb(rsp) : void 0;
    }
}