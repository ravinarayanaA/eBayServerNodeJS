var express = require('express');
var router = express.Router();
var url = require('url');

/* GET users listing. */
router.get('/', function (req, res, next) {

    function parseJsonFun(json_data, keyword) {
        response_json = json_data;
        response_dict_client = {'items': []};
        try {
            pagination_output = response_json['findItemsAdvancedResponse'][0]['paginationOutput'][0]
        } catch (TypeError) {
            return response_dict_client
        }
        search_results = response_json['findItemsAdvancedResponse'][0]['searchResult'][0]
        response_dict_client['total_results_found'] = pagination_output['totalEntries'][0]
        response_dict_client['keyword'] = keyword
        if (search_results['item'] != undefined)
            for (count_array in search_results['item']) {
                item = search_results['item'][count_array]
                add_flag = "true";
                item_dict = {}
                try {
                    item_dict["item_image_url"] = item['galleryURL'][0];
                    if (item_dict["item_image_url"] == 'https://thumbs1.ebaystatic.com/pict/04040_0.jpg' || item_dict["item_image_url"] == '') {
                        item_dict["item_image_url"] = '/assets/images/ebayDefault.png'
                    }
                } catch (e) {
                    item_dict["item_image_url"] = '/assets/images/ebayDefault.png'
                }
                if (item['title'] == undefined) {
                    add_flag = "false";
                } else {
                    item_dict["item_title"] = item['title'][0];
                }
                item_dict["item_id"] = item['itemId'][0];
                try {
                    item_dict["item_ebay_link"] = item['viewItemURL'][0];
                } catch (TypeError) {
                    item_dict["item_ebay_link"] = "https://www.ebay.com";
                }
                try {
                    item_dict["item_condition"] = item['condition'][0]['conditionDisplayName'][0];
                } catch (TypeError) {

                }

                if (item['topRatedListing'][0] == 'true')
                    item_dict["item_top_rated_image"] = "true";

                try {
                    if (item['sellingStatus'][0]['currentPrice'][0]['@currencyId'] == 'USD')
                        currency = '$';
                    else {
                        currency = item['sellingStatus'][0]['currentPrice'][0]['@currencyId'];
                    }
                    item_dict["item_price"] = currency + item['sellingStatus'][0]['currentPrice'][0]['__value__'];
                } catch (TypeError) {
                    add_flag = "false";
                }
                item_dict["shipping_cost"] = null;
                try {
                    if (item['shippingInfo'][0]['shippingServiceCost'] != undefined) {
                        if (item['shippingInfo'][0]['shippingServiceCost'][0]['@currencyId'] == 'USD')
                            currency = '$';
                        else {
                            currency = item['shippingInfo'][0]['shippingServiceCost'][0]['@currencyId'];
                        }
                        item_dict["shipping_cost"] = item['shippingInfo'][0]['shippingServiceCost'][0]['__value__'];
                    } else {
                        add_flag = "false";
                    }
                } catch (TypeError) {
                    add_flag = "false";
                }
                try {
                    if (item['shippingInfo'][0]['shippingServiceCost'] != undefined) {
                        if (parseFloat(item['shippingInfo'][0]['shippingServiceCost'][0]['__value__']) == 0.0)
                            item_dict["free_shipping"] = "true";
                    } else {
                        add_flag = "false";
                    }
                } catch (TypeError) {
                    add_flag = "false";
                }
                try {
                    item_dict["shippingInfo"] = item['shippingInfo'];
                } catch (e) {
                    add_flag = "false";
                }
                if (add_flag == 'true') {
                    response_dict_client['items'].push(item_dict)
                }

            }
        console.log(response_dict_client.items.length);
        return response_dict_client
    }


    const https = require('https');
    const queryObject = url.parse(req.url, true).query;
    condition_dict = {'New': '1000', 'Used': '3000', 'Very good': '4000', 'Good': '5000', 'Acceptable': '6000','Unspecified':'Unspecified'};
    sort_dict = {
        'Best Match': 'BestMatch', 'Price: highest first': 'CurrentPriceHighest',
        'Price + Shipping: highest first': 'PricePlusShippingHighest',
        'Price + Shipping: lowest first': 'PricePlusShippingLowest'
    };
    APP_ID = 'XXXXXXXXXXXXXXXXXXXX';
    KEYWORDS = queryObject['keyword'];
    SORT_ORDER = sort_dict[queryObject['sortorder']];
    counter = 0;
    if (queryObject["price_lower"] != 'null' && queryObject["price_lower"] != '') {
        MIN_FILTER = '&itemFilter(' + counter + ').name=MinPrice&itemFilter(' +
            counter + ').value=' + queryObject["price_lower"] + '&itemFilter(' +
            counter + ').paramName=Currency&itemFilter(' + counter + ').paramValue=USD';
        counter += 1;
    } else {
        MIN_FILTER = '';
    }
    if (queryObject["price_upper"] != 'null' && queryObject["price_upper"] != '') {
        MAX_FILTER = '&itemFilter(' + counter + ').name=MaxPrice&itemFilter(' +
            counter + ').value=' + queryObject["price_upper"] + '&itemFilter(' +
            counter + ').paramName=Currency&itemFilter(' + counter + ').paramValue=USD';
        counter += 1;
    } else {
        MAX_FILTER = '';
    }
    if (queryObject['seller'].split(',').includes("Return accepted")) {
        RETURN_FILTER = '&itemFilter(' + counter + ').name=ReturnsAcceptedOnly&itemFilter(' +
            counter + ').value=true';
        counter += 1;
    } else {
        RETURN_FILTER = '';
    }
    if (queryObject['shipping'].split(',').includes("Expedited")) {
        EXPEDITED_FILTER = '&itemFilter(' + counter + ').name=ExpeditedShippingType&itemFilter(' +
            counter + ').value=Expedited';
        counter += 1;
    } else {
        EXPEDITED_FILTER = '';
    }
    if (queryObject['shipping'].split(',').includes("Free")) {
        FREE_FILTER = '&itemFilter(' + counter + ').name=FreeShippingOnly&itemFilter(' +
            counter + ').value=true';
        counter += 1;
    } else {
        FREE_FILTER = '';
    }
    cond_flag = false;
    cond_filter_str = '&itemFilter(' + counter + ').name=Condition';
    inside_count = 0;
    client_conditions = queryObject['condition'].split(',');
    for (counter_array in client_conditions) {
        if (condition_dict[client_conditions[counter_array]] != undefined) {
            cond_flag = true;
            cond_filter_str += '&itemFilter(' + counter + ').value(' + inside_count + ')=' + condition_dict[
                client_conditions[counter_array]];
            inside_count += 1;
        }
    }
    if (!cond_flag)
        cond_filter_str = '';

    constructed_url = '/services/search/FindingService/v1?\
OPERATION-NAME=findItemsAdvanced&SERVICE-VERSION=1.0.0&\
SECURITY-APPNAME=' + APP_ID + '&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&\
keywords=' + encodeURI(KEYWORDS) + '&paginationInput.entriesPerPage=200&sortOrder=' + SORT_ORDER + MIN_FILTER + MAX_FILTER + RETURN_FILTER + EXPEDITED_FILTER + FREE_FILTER + cond_filter_str;
    console.log('https://svcs.ebay.com' + constructed_url);


    let output = '';
    const options = {
        host: 'svcs.ebay.com',
        port: 443,
        path: constructed_url,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const request = https.request(options, (result) => {
        console.log(`${options.host} : ${result.statusCode}`);

        result.setEncoding('utf8');

        result.on('data', (chunk) => {
            output += chunk;
        });

        result.on('end', () => {
            final_output = parseJsonFun(JSON.parse(output), queryObject['keyword']);
            res.json(final_output);
        });
    });

    request.on('error', (err) => {
        // res.send('error: ' + err.message);
    });
    request.end();

});
router.get('/product', function (req, res, next) {

    const https = require('https');
    const queryObject = url.parse(req.url, true).query;
    APP_ID = 'Ravinara-csci571-PRD-72eb49443-c47bcb9f';
    product_id = queryObject['product_id'];
    constructed_url = '/shopping?callname=GetSingleItem&responseencoding=JSON&appid=' + APP_ID + '&siteid=0&version=967&ItemID=' + product_id + '&IncludeSelector=Description,Details,ItemSpecifics';
    console.log('https://open.api.ebay.com' + constructed_url);
    let output = '';
    const options = {
        host: 'open.api.ebay.com',
        port: 443,
        path: constructed_url,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const request = https.request(options, (result) => {
        console.log(`${options.host} : ${result.statusCode}`);

        result.setEncoding('utf8');

        result.on('data', (chunk) => {
            output += chunk;
        });

        result.on('end', () => {
            res.json(JSON.parse(output));
        });
    });

    request.on('error', (err) => {
        // res.send('error: ' + err.message);
    });
    request.end();

});
module.exports = router;
