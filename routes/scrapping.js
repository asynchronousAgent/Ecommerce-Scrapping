const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");
const ntc = require("@yatiac/name-that-color");

const router = express.Router();

router.get("/flipkart/mobile", async (req, res) => {
  try {
    const siteUrl =
      "https://www.flipkart.com/search?q=mobiles&sid=tyy%2C4io&as=on&as-show=on&otracker=AS_QueryStore_OrganicAutoSuggest_1_6_na_na_na&otracker1=AS_QueryStore_OrganicAutoSuggest_1_6_na_na_na&as-pos=1&as-type=HISTORY&suggestionId=mobiles%7CMobiles&requestId=8a959190-1780-4a43-adca-aab69b623a16";
    const response = await axios.get(siteUrl);
    const $ = cheerio.load(response.data);
    const products = [];
    let sub_specs = [];
    $("._2kHMtA").each((i, el) => {
      const obj = {};
      obj.mobile_name = $(el).find("._4rR01T").text();
      obj.price = $(el).find("._3tbKJL ._1_WHN1").text();
      obj.starRating = $(el).find("._3LWZlK").text();
      $(el)
        .find(".fMghEO ._1xgFaf")
        .each((i, el) => {
          sub_specs = [];
          $(el)
            .children(".rgWa7D")
            .each((i, el) => {
              const item = $(el).text();
              sub_specs.push(item);
            });
        });
      obj.specification = sub_specs;
      const rating_n_reviews = $(el)
        .find(".gUuXy- ._2_R_DZ")
        .text()
        .match(/\d+,?\d*/g);
      obj.ratings = rating_n_reviews[0];
      obj.reviews = rating_n_reviews[1];
      products.push(obj);
    });
    res.status(200).json({
      success: 1,
      message: "Products fetched successfully",
      data: products,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: 0, message: "Server Error,products could not fetched" });
  }
});

router.get("/snapdeal/t-shirt", async (req, res) => {
  try {
    const siteUrl =
      "https://www.snapdeal.com/products/mens-tshirts-polos?sort=plrty";
    const response = await axios.get(siteUrl);
    const $ = cheerio.load(response.data);
    const products = [];
    $(".product-tuple-description").each((i, el) => {
      const obj = {};
      const item_name = $(el).find(".product-title").text();
      const item_actual_price = $(el).find(".product-desc-price").text();
      const item_price = $(el)
        .find(".product-price")
        .text()
        .split(" ")
        .join("");
      const item_discount = $(el)
        .find(".product-discount span")
        .text()
        .split(" ")[0];
      let reviews = $(el).find(".product-rating-count").text().slice(1, -1);
      if (reviews == 0) {
        reviews = "No reviews yet";
      }
      const size_available = [];
      $(el)
        .find(".tuple-subattribute")
        .each((i, el) => {
          const item = $(el).find(".sub-attr-value").text().split(" ");
          for (let itm of item) {
            if (itm.trim() != "") size_available.push(itm.trim());
          }
        });
      let color_codes = [];
      $(el)
        .find(".product-tuple-attribute .color-attr")
        .each((i, el) => {
          const item = $(el).css("background");
          if (item != undefined) color_codes.push(ntc(item).colorName);
        });
      if (color_codes.length === 0)
        color_codes = "No alternative color found for this product";
      let starRate = $(el).find(".filled-stars").css("width");
      if (starRate !== undefined) starRate = (starRate.slice(0, -1) * 5) / 100;
      if (starRate === undefined) starRate = "No ratings yet";

      obj.name = item_name;
      obj.actual_price = item_actual_price;
      obj.discounted_price = item_price;
      obj.discount = item_discount;
      obj.reviews = reviews;
      obj.ratings = starRate;
      obj.available_sizes = size_available;
      obj.color_available = color_codes;
      products.push(obj);
    });
    res.status(200).json({
      success: 1,
      message: "T-shirts have been fetched successfully",
      data: products,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: 0, message: "Server Error,products could not fetched" });
  }
});

router.get("/flipkart/mobile/full", async (req, res) => {
  try {
    const siteUrl =
      "https://www.flipkart.com/mobiles/pr?sid=tyy%2C4io&otracker=categorytree";
    const response = await axios.get(siteUrl);
    const $root = cheerio.load(response.data);
    const products = [];
    $root("._2kHMtA ._1fQZEK").each(async (i, el) => {
      const prodUrl = $root(el).attr("href");
      try {
        const prodResponse = await axios.get(
          "https://www.flipkart.com" + prodUrl
        );
        const obj = {};
        const $child = cheerio.load(prodResponse.data);
        const name = $child(".yhB1nd .B_NuCI").text();
        const rating = $child("._3_L3jD ._3LWZlK").text();
        const no_of_ratings_n_reviews = $child("._2_R_DZ span span")
          .text()
          .split("&");
        const actual_price = $child("._2p6lqe").text();
        const discounted_price = $child("._16Jk6d").text();
        const discount = $child("._31Dcoz").text().split(" ")[0];
        const available_offers = [];
        $child("._16eBzU").each((i, el) => {
          const offer = $child(el).children("span:nth-child(2)").text();
          if (offer) available_offers.push(offer);
        });
        let warrenty = $child("._352bdz").text();
        if (warrenty.slice(-9) == "Know More")
          warrenty = warrenty.replace("Know More", "");
        let available_colors = [];
        $child("._1q8vHb").each((i, el) => {
          const color = $child(el).find("._2KarXJ").text();
          if (i || color[0].match(/\d/g) !== null) return false;
          if (color[0].match(/\d/g)) return false;
          let separate_color = "";
          for (let index = 0; index < color.length; index++) {
            if (
              color[index] != " " &&
              color[index + 1] != " " &&
              color[index + 1] != undefined &&
              color[index] == color[index].toLowerCase() &&
              color[index + 1] == color[index + 1].toUpperCase()
            ) {
              separate_color += color[index];
              available_colors.push(separate_color);
              separate_color = "";
            } else {
              separate_color += color[index];
            }
          }
          available_colors.push(separate_color);
        });
        if (available_colors.length < 1)
          available_colors = "No other colors available for this model";
        const highlights = [];
        $child("._2418kt ul").each((i, el) => {
          $child(el)
            .children("._21Ahn-")
            .each((i, el) => {
              const item = $child(el).text();
              highlights.push(item);
            });
        });
        const payment_options = [];
        $child("._3vDXYV ._250Jnj ul").each((i, el) => {
          $child(el)
            .children("._1Ma4bX")
            .each((i, el) => {
              const options = $child(el).text();
              payment_options.push(options);
            });
        });
        const sellerName = $child("#sellerName > span > span").text();
        const description = $child(".RmoJUa").text();
        const product_individual_specs_rating = {};
        $child("._2a78PX").each((i, el) => {
          const rate = $child(el).find(".HTdwVj ._2Ix0io").text();
          const rate_name = $child(el).find("._3npa3F").text();
          product_individual_specs_rating[rate_name] = rate;
        });
        const individual_star_rating_given = {};
        const starRated = [];
        const ratedBy = [];
        $child("._13sFCC").each((i, el) => {
          $child(el)
            .find(".omG9iE ._26f_zl")
            .each((i, el) => {
              const star = $child(el).text();
              starRated.push(star);
            });
          $child(el)
            .find("._1uJVNT")
            .each((i, el) => {
              const value = $child(el).text();
              ratedBy.push(value);
            });
        });
        for (let index = 0; index < starRated.length; index++) {
          individual_star_rating_given[starRated[index] + " star"] =
            ratedBy[index] + " people";
        }

        const user_reviews = [];
        $child("._1AtVbE > div > a").each(async (i, el) => {
          const reviewUrl = $child(el).attr("href");
          try {
            const prod_review_Response = await axios.get(
              "https://www.flipkart.com" + reviewUrl
            );
            const $reviewChild = cheerio.load(prod_review_Response.data);
            $reviewChild("._2wzgFH").each((i, el) => {
              const review_obj = {};
              const rate_given_by_user = $reviewChild(el)
                .find("._1BLPMq")
                .text();
              const feedback_title = $reviewChild(el).find("._2-N8zT").text();
              const feedback_description = $reviewChild(el)
                .find(".t-ZTKy div div")
                .text();
              const reviewer_details = [];
              const reviewer_name = $reviewChild(el).find("._2V5EHH").text();
              const reviewer_city = $reviewChild(el).find("._2mcZGG").text();
              const review_when = $reviewChild(el)
                .find("._2sc7ZR")
                .text()
                .match(/\d+\s\w+\s\w+/g)
                .toString();
              reviewer_details.push(reviewer_name, reviewer_city, review_when);
              review_obj.rate_given_by_user = rate_given_by_user;
              review_obj.feedback_title = feedback_title;
              review_obj.feedback_description = feedback_description;
              review_obj.reviewer_details = reviewer_details.join(" | ");
              user_reviews.push(review_obj);
            });
          } catch (err) {
            console.log(err);
          }
        });
        obj.name = name;
        obj.rating = rating;
        obj.no_of_ratings = no_of_ratings_n_reviews[0].split(" ")[0];
        obj.no_of_reviews = no_of_ratings_n_reviews[1].split(" ")[0];
        obj.actual_price = actual_price;
        obj.discounted_price = discounted_price;
        obj.discount = discount;
        obj.available_offers = available_offers;
        obj.warrenty = warrenty;
        obj.available_colors = available_colors;
        obj.highlights = highlights;
        obj.easy_payment_options = payment_options;
        obj.sellerName = sellerName;
        obj.product_description = description;
        obj.product_individual_specs_rating = product_individual_specs_rating;
        obj.product_individual_star_rating = individual_star_rating_given;
        obj.user_reviews = user_reviews;
        products.push(obj);
        if (products.length === 24)
          res.status(200).json({
            success: 1,
            message: "Products fetced successfully",
            data: products,
          });
      } catch (err) {
        res.status(500).json({
          success: 0,
          message: "Server Error,products could not fetched",
        });
      }
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: 0, message: "Server Error,products could not fetched" });
  }
});

module.exports = router;
