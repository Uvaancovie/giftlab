Amrod's Client Vendors 2.0.9
This documentation provides Amrod's customers with detailed information on the API endpoints that are available for use to integrate into our solutions and our data.

To gain access to these API's please complete the following form https://marketing.amrod.co.za/landing/NewAPIAccessRequest.

If you have any further access issues once your credentials are provided, please email api.support@amrod.co.za.

Important URLS
Authentication URL

https://identity.amrod.co.za

Authentication Get Token URL

https://identity.amrod.co.za/VendorLogin

Vendor API URL

https://vendorapi.amrod.co.za

"The API is not working in my browser"
You cannot access the vendor API by visiting the url in a web browser
The API does not allow you to access the information by visiting it in a browser. It needs to be connected via a IDE, backend code or postman. Please see https://forum.amrod.co.za/topic/37/can-i-get-a-token-by-visiting-the-url-in-my-browser for more info.

Ver 2.0.9 - Summary
Deployment Date: 2025-09
Category endpoint has been updated to include Unique ID that identifies each Nested Category. This ID is also added in the product endpoints so that you can easily link the product to the correct category.

There are changes within the Product Module and Category Module. Please view those sections for more information.

Ver 2.0.8 - Summary
Deployment Date: 2025-02
Inclusive Branding Specials have been upgraded to include a position to which that special applies to.

Ver 2.0.7 - Summary
Deployment Date: 2024-10
Colour Swatch endpoint has been added to allow one to view the actual colour # / HEX(s) for all our products.

Ver 2.0.6 - Summary
Deployment Date: 2024-08
!!! Important API Availabily Time Change

The API's will not be available between the times of 00:00 and 01:00

These times are GMT+2

Any calls made to the API including products, pricing and stock will return a 204 HTTP Response

This means it will return a success but with no content returned
This has been implemented to ensure that all content is sync, manipulated and prepared to be correct for all users to consume

Ver 2.0.5 - Summary
Deployment Date: 2024-02
Includes additional insights for Authentication challenges

Includes 3 new return values if login not successful

Includes common mistakes in inputting the values

Included information on Inclusive Branding

Outlined the 4 different Branding Flags
Ver 2.0.4 - Summary
Deployment Date: 2023-10
Includes additional info for promotional flags on Products

Single Sign-on and API and Website Access

Determine if a record is NEW, UPDATED or to be DELETED in Get Updated End Point

Ver 2.0.3 - Summary
Deployed Date: 2023-06-20
Includes minor updates based on internal review + further elaboration on unclear areas.

Ver 2.0.2 - Summary
Deployed Date: 2023-06-09
Documentation review and updates.

Ver 2.0.1 - Summary
Deployed Date: 2023-06-01
All modules / endpoints are provided with 2 distinct options:

Get All

Get Changes

Get All
The Get All endpoints can be found in each module and returns the full dataset of all the information within that specific module. Data found in the Get All endpoints are updated once a day therefore if you have called this endpoint already there would be no need to call it within the next 24hrs as information you will receive would be the same as the prior call.

Get Changes
The Get Changes endpoints can be found in each module and returns only the last changes that have been made within the last 24hrs for a specific module. Data found in the Get Changes endpoints are updated once a day and only contain the changes that have been made within the last 24hr period therefore if you have called this endpoint already there would be no need to call it within the next 24hrs as information you will receive would be the same as the prior call. As these endpoints only return changes for this period it means that changes older than 24hrs (2 days) are not available.

If you do not utilise this endpoint to keep your data updated daily OR miss a day you would need to call the Get All endpoint to get the latest copy of all data.

Product Structure
Each product is made up of 2 elements

Variant

Base

Variant
The variant is the actual item that is sold. It generally comes in a colour or a size and each variant is a combination of the 2 e.g. If a t-shirt is sold in 3 colours with each having 4 sizes, then there are 12 variants (4 x 3).

Base
The Base is the default information about a product. It contains important information such as branding information that is common to all variants.

It isn't something that one can buy e.g. If a t-shirt is sold in 3 colours with each having 4 sizes, one cannot order a t-shirt by itself as it is not a sellable product, you would have to define the size and colour first.

Codes (SKU)
We have 2 types of codes in our system.

Simple

Full

Simple
The simple code is the code of the "Base" item as defined above. It is used for information common to all of the products in that set and does not include any size or colour information.

Full
The full code is the code of the "Variant" item as defined above. It is used to define the exact size and or colour of the item you are looking to order.

Branding Options
The Product Module is split into 2 distinct endpoints:

With Branding

Without Branding

The purpose is to allow each customer the option of what information they require for use within their business and systems whilst keeping the information optimized and easy to use.

Branding Positions
Positions are included in the product schema. They are provided at the a Base level and applies to each variant. Each Position includes 1 or many branding methods available for that position. As not all methods are available for all colours, each method (within a position) includes a field for the "excluded" colours e.g. Sublimation is only offered on white items and therefore this method would include the remaining colours in the "Excluded" field. This list of excluded values is a comma separated list of colour codes and means that any of the variants of that colour will all be unable to brand that method in that position.

Branding Pricing
Each Branding Code has a few pricing options.

All products with the same Branding Codes will have the same pricing structure and within that Branding Code you would use a combination of the Branding Code, QTY ordered and the colour options selected to get the correct pricing for a specific order.

Note: Because of the above we recommend using this as a "look up" table to be synced daily only once in order to get all main values up to date. Your logic on check out / order placement would then select the appropriate matching pricing.

Inclusive Branding
Most products contain an Inclusive Branding Method/Option which has a combination of offerings from free branding of a branding code to multiple positions etc.

Unlike Branding Pricing, each Inclusive Branding is per product and at the Branding Position level. These Inclusive Branding Method/Options are in addition to the standard Branding Positions and methods outlined above. E.g. If a product has Embroidery on Position A as well as a Free Embroidery on Position A it would have 2 options for a user to choose from. This is because you have multiple positions so Embroidery can be on Position A and B but only free on Position A.

Inclusive Branding is not only specific to a product and its method but also specific to a position. This is because, in some instances, we have multiple positions that may have the same method however only the specific position is included as a special.

The structure of this is provided the same as the previous Feed / XML / API.

Inclusive Brandings

This module is used to get Inclusive Branding information.
inclusive Branding Prices

This module is used to get Inclusive Branding Pricing information. Inclusive Brandings include a replacement code which indicates that if Inclusive Branding is used then the branding code needs to be replaced with a new one.
Branding Pricing

This module is used to get all Branding Prices per Branding Code.
Note: All Branding related endpoints have been moved to a folder called "Branding". These endpoints are only required if you intend to utilise branding pricing and Inclusive Branding on your solution. These are master lookups and do not include differentials.

GET
Get Full Branding Price List Updated
https://vendorapi.amrod.co.za/api/v1/BrandingPrices/GetUpdated
The purpose of this endpoint is to return only the Updated Branding Prices.

The purpose of this endpoint is to return the list of all branding prices to be used as lookups when calculating prices / quotes based on specific branding methods.

These endpoints return the unique branding codes as well as the different price and quantity breaks (e.g. 1-99 Price X, 100-199 Price Y).

This endpoint includes the list of items based on number of colours and the setup and unit cost per price break and per number of colours.

This would be used should you wish to offer a full branding service whereby you can calculate the cost of the branding based on quantity, position and method.

An "Action" field is returned for each record only returned on these endpoints.

The field is called "ActionType" and it denotes the type of change. It is an INT field that correlates to the following types / status / actions:

0
This means it has been created
1
This means that record has changed or been updated
2
This means this record has been removed
It is provided to advise you on what changes they include and what actions to implement.

NOTE: This Get Updated endpoint returns only the information changed since the previous day. If you miss a day or would like to get all information in order to keep all info in sync please use the All endpoint.

When this should be used
It is recommended it is called Daily for these 2 requirements
This is based on the assumption that the Get All endpoint has been called and information saved locally
After this endpoint has been run, then the Get Changed is run daily to check if any changes have been made
When this should not be used
This endpoint should not be used in the following scenarios

This endpoint is not required if you do not offer branding in your order flow or website
Missing a day
The Get Updated endpoint only shows changes from the previous day
If a day was missed you may have missed information therefore the data may be out of sync
If this occurs, we recommend running the Get All endpoint to make sure you have the latest information
Called multiple times within the day
As above, items are not changed within a day, therefore it is not needed to be called multiple times within a day
AUTHORIZATION
Bearer Token
This request is using Bearer Token from folderCatalogue Vendor API
Example Request
Get Full Branding Price List Updated
View More
nodejs
var https = require('follow-redirects').https;
var fs = require('fs');

var options = {
  'method': 'GET',
  'hostname': 'vendorapi.amrod.co.za',
  'path': '/api/v1/BrandingPrices/GetUpdated',
  'headers': {
  },
  'maxRedirects': 20
};

var req = https.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function (chunk) {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
  });

  res.on("error", function (error) {
    console.error(error);
  });
});

req.end();
Example Response
Body
Headers (0)
No response body
This request doesn't return any response body
Colour Swatches
This module is used to get a list of the colour swatches and their HEX values.

This can be used if you would like to show the correct colour swatch or block or use within your website or system.

Update Frequency
As our colour swatches don't change often this is only updated when we launch a new colour.

Access
You are required to have a valid token as well as authorization to call the endpoints in this module.

Should you require assistance with access please contact your Account Manager.

Name
We provide a friendly name of the colour for you to use if you require and need a descriptor for the colour.

Code
Each colour has a code. This is unique and used to define only 1 specific colour.

HEX
All colours include their HEX value. This may include a single value or an array of comma separate # values. This would, for example, when there are 2 colours such as Camouflage ("#8C9458","#D9D189","#4C5B44","#1E2E21") or if the item has a triwm colour such as Black Cyan ("#000000","#00B2E2").

AUTHORIZATION
Bearer Token
This folder is using Bearer Token from folderCatalogue Vendor API
GET
Get Colour Swatches
https://vendorapi.amrod.co.za/api/v1/ColourSwatches/
The purpose of this endpoint is to return the list of all our different product colours and their HEX value.

This endpoint returns all colours and doesn't have "get updated" as the colours don't change daily such as the other endpoints.

When this should be used
It is recommended it is only called for these requirements

If you wish to display colour swatches on your website

If you wish to align your colours with the same colour HEX values used on Amrod's website

It changes very infrequently so it can be called once a month OR when you notice a new colour is loaded and you don't have a colour for it.

When this should not be used
This endpoint should not be used in the following scenarios

Called multiple times within the day or multiple times a week

The information changes very infrequently therefore there is no need to call it multiple times within a week
We recommend it is called manually and as and when needed instead of scheduled to be called often

AUTHORIZATION
Bearer Token