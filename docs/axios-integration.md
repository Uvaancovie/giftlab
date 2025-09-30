Amrod API Variant Product Integration using Node.js and Axios
Overview

This guide demonstrates a Node.js script (using Axios) that authenticates with the Amrod API, retrieves only variant products from the “Get Updated” endpoint, and inserts/updates them into a Supabase table. The script focuses on the required fields – name, code, image, and price – for each variant product. It uses the proper Amrod API endpoints and authentication flow as per official documentation and includes handling for the API’s daily maintenance window (blackout) between 00:00–01:00 GMT+2 when no data is returned
forum.amrod.co.za
.

Implementation Steps

Authenticate with Amrod API (VendorLogin): Use the Amrod identity endpoint to obtain an access token. The endpoint is https://identity.amrod.co.za/VendorLogin and expects a JSON payload with your Amrod UserName, Password, and CustomerCode (account number)
newapidocs.amrod.co.za
forum.amrod.co.za
. On success, it returns a bearer token that will be used for authorized API calls.

Call “Get Updated” Products Endpoint: Use the token to call the GetUpdated endpoint for products. The base URL for vendor API calls is https://vendorapi.amrod.co.za/api/v1. The relevant endpoint is likely Products/GetUpdated, which returns all product changes since the previous day
newapidocs.amrod.co.za
forum.amrod.co.za
. The token must be included in the request headers as a Bearer token
forum.amrod.co.za
. This returns a JSON response containing product data (including both base products and their variants) that have been added or changed since yesterday.

Filter Variant Products Only: The Amrod catalog distinguishes between base products and variant products. A base product contains general information common to all its variants (e.g. branding info)
newapidocs.amrod.co.za
 and typically is not orderable itself. Variants represent actual purchasable items (e.g. specific color or size options). From the response, extract only the variant entries and exclude any base product records. (Depending on the API response structure, you may need to filter out objects that represent the base product or navigate into a base product’s Variants list.)

Map Required Fields: For each variant, gather the name, code, image URL, and price fields. The API provides image data grouped by variant color, including a flag for the default image per color
forum.amrod.co.za
. For simplicity, this script will use the default image of each variant’s color as the variant’s image. Ensure that the fields are mapped to match your Supabase table structure (e.g., name, code, image, price columns in amrod_products).

Upsert into Supabase: Connect to your Supabase instance using the URL and service API key (or use the Supabase JS client). Insert or upsert the variant records into the amrod_products table. Using an upsert operation is useful to avoid duplicate entries and update existing records.

Handle API Blackout Window: The Amrod Vendor API is unavailable daily from 00:00 to 01:00 (GMT+2) for internal syncing
forum.amrod.co.za
. Calls made during this period return an HTTP 204 No Content. The script should avoid running at this time or handle a 204 response by retrying later. (In a production setup, schedule the script to run outside the blackout window.)

Code Implementation

Below is a fully functional Node.js script following the above steps. It uses axios for HTTP requests and the official @supabase/supabase-js library for database operations. Be sure to replace the placeholder values (Amrod credentials and Supabase URL/key) with your actual credentials. Also, run this server-side (e.g., in a Node environment) as it involves secret keys and should not be exposed on the client side.

// Required dependencies: axios and @supabase/supabase-js
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Amrod API endpoints and credentials (replace with real credentials)
const AMROD_LOGIN_URL = 'https://identity.amrod.co.za/VendorLogin';
const AMROD_API_BASE = 'https://vendorapi.amrod.co.za/api/v1';
const AMROD_USERNAME = process.env.AMROD_USERNAME || 'YOUR_AMROD_USERNAME';
const AMROD_PASSWORD = process.env.AMROD_PASSWORD || 'YOUR_AMROD_PASSWORD';
const AMROD_CUSTOMER_CODE = process.env.AMROD_CUSTOMER_CODE || 'YOUR_AMROD_ACCOUNT_CODE';

// Supabase credentials (replace with your values or use environment variables)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://<your-supabase-project>.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '<YOUR_SUPABASE_SERVICE_KEY>';  // Use service role for insert

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function syncAmrodVariants() {
  try {
    // 1. Authenticate with Amrod API to get a bearer token
    const authPayload = {
      UserName: AMROD_USERNAME,
      Password: AMROD_PASSWORD,
      CustomerCode: AMROD_CUSTOMER_CODE
    };
    const authResponse = await axios.post(AMROD_LOGIN_URL, authPayload);
    const token = authResponse.data?.access_token || authResponse.data?.token || authResponse.data;
    if (!token) {
      throw new Error('Authentication failed: no token returned');
    }
    console.log('Amrod API authentication successful. Token obtained.');

    // 2. Check if current time is within blackout window (00:00–01:00 GMT+2)
    const now = new Date();
    const hourGMTPlus2 = now.getUTCHours() + 2;  // convert current UTC hour to GMT+2
    if (hourGMTPlus2 === 0) {
      console.warn('Amrod API is in daily maintenance window (00:00-01:00 GMT+2). Skipping sync.');
      return;
    }

    // 3. Fetch updated products (since last day) from Amrod API
    const productsUrl = `${AMROD_API_BASE}/Products/GetUpdated`;
    const productsResponse = await axios.get(productsUrl, {
      headers: { Authorization: `Bearer ${token}` }  // send token as Bearer in auth header:contentReference[oaicite:9]{index=9}
    });
    // If the API returns HTTP 204 during blackout, axios would not throw an error but data would be empty
    if (productsResponse.status === 204 || !productsResponse.data) {
      console.warn('No content returned from Amrod API (possibly during blackout hours).');
      return;
    }
    const updatedData = productsResponse.data;
    console.log(`Retrieved updated products from Amrod API at ${new Date().toISOString()}.`);

    // 4. Extract only variant product entries and map required fields
    const variantRecords = [];
    /** 
     * The response structure may contain base products with an array of variants.
     * We iterate through each product entry:
     * - If it has a list of variants (meaning this is a base product record), we take those variants.
     * - If the entry itself is a variant (some APIs might return a flat list with a type indicator), we take it directly.
     */
    for (const product of updatedData.products || updatedData) {
      if (product.variants && product.variants.length) {
        // This is a base product grouping; collect its variant entries
        for (const variant of product.variants) {
          variantRecords.push({
            name: variant.name || product.name,             // variant name (fallback to base name if variant name not separately provided)
            code: variant.code,                             // unique variant code/SKU
            image: getVariantImageUrl(product, variant),    // helper to pick variant’s image URL
            price: variant.price                            // variant price for current tier
          });
        }
      } else if (product.isVariant || product.baseProductCode) {
        // If API returns a flat list, identify variant by a flag or presence of baseProductCode
        variantRecords.push({
          name: product.name,
          code: product.code,
          image: product.image || getVariantImageUrl(product),  // some APIs might directly provide an image field
          price: product.price
        });
      }
    }

    // Helper function to get a variant's image URL (default image for that variant's color)
    function getVariantImageUrl(baseProduct, variant = null) {
      // If the API groups images by colour, find images for this variant's color:
      if (baseProduct.colourImages) {
        const colorKey = variant ? variant.colour || variant.color || variant.colourName : baseProduct.colour;
        const imagesForColor = baseProduct.colourImages[colorKey] || baseProduct.colourImages[variant.code] || [];
        // Find the default image in that color group
        const defaultImgObj = imagesForColor.find(img => img.isDefault) || imagesForColor[0];
        return defaultImgObj ? defaultImgObj.url || defaultImgObj.imageUrl : null;
      }
      // Fallback: if base has a general images list
      if (baseProduct.images) {
        const defaultImgObj = baseProduct.images.find(img => img.isDefault) || baseProduct.images[0];
        return defaultImgObj ? defaultImgObj.url || defaultImgObj.imageUrl : null;
      }
      return null;
    }

    console.log(`Filtered ${variantRecords.length} variant products to sync to Supabase.`);

    // 5. Upsert variant records into Supabase table `amrod_products`
    if (variantRecords.length > 0) {
      const { data, error } = await supabase.from('amrod_products').upsert(variantRecords, {
        onConflict: 'code'  // assume 'code' is unique key to avoid duplicates
      });
      if (error) {
        throw new Error(`Supabase upsert error: ${error.message}`);
      }
      console.log(`Upserted ${variantRecords.length} records into amrod_products table.`);
    } else {
      console.log('No variant records to upsert.');
    }

  } catch (err) {
    console.error('Error during Amrod variant sync:', err.message);
  }
}

// Execute the sync function (you could also schedule this function to run periodically, e.g., via cron)
syncAmrodVariants();


Notes: This script uses upsert so that if a product variant with the same code already exists in the amrod_products table, it will be updated rather than inserted again. The image field is determined by picking the default image for the variant’s color grouping as provided by the API
forum.amrod.co.za
. Also, the script checks the current time against the known blackout window and logs a warning or exits without making the API call during that hour to respect the API availability policy
forum.amrod.co.za
.

Ensure you have appropriate error handling and logging. In a real-world scenario, you might integrate this script into a scheduled job (outside the blackout hour) to keep your product data in sync daily.