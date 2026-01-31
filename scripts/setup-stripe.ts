/**
 * Stripe Products & Prices Setup Script
 *
 * Run this once to create the subscription products and prices in Stripe.
 * The script will output the env variables to add to your .env file.
 *
 * Usage: npx ts-node scripts/setup-stripe.ts
 */

import Stripe from "stripe";
import * as dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

async function setupStripe() {
  console.log("🔧 Setting up Stripe products and prices...\n");

  try {
    // Check existing products
    const existingProducts = await stripe.products.list({ limit: 10 });
    const buyerProduct = existingProducts.data.find(
      (p) => p.name === "DevSwap Buyer",
    );
    const vendorProduct = existingProducts.data.find(
      (p) => p.name === "DevSwap Vendor",
    );

    // Create or get Buyer product
    let buyerProductId: string;
    if (buyerProduct) {
      console.log("✅ Buyer product already exists");
      buyerProductId = buyerProduct.id;
    } else {
      const product = await stripe.products.create({
        name: "DevSwap Buyer",
        description:
          "For companies hiring talent - unlimited developer requests, priority matching",
      });
      buyerProductId = product.id;
      console.log("✅ Created Buyer product:", buyerProductId);
    }

    // Create or get Vendor product
    let vendorProductId: string;
    if (vendorProduct) {
      console.log("✅ Vendor product already exists");
      vendorProductId = vendorProduct.id;
    } else {
      const product = await stripe.products.create({
        name: "DevSwap Vendor",
        description:
          "For companies selling talent - list unlimited developers, featured listings",
      });
      vendorProductId = product.id;
      console.log("✅ Created Vendor product:", vendorProductId);
    }

    // Get existing prices
    const buyerPrices = await stripe.prices.list({
      product: buyerProductId,
      active: true,
    });
    const vendorPrices = await stripe.prices.list({
      product: vendorProductId,
      active: true,
    });

    // Create Buyer prices
    let buyerMonthlyId = buyerPrices.data.find(
      (p) => p.recurring?.interval === "month",
    )?.id;
    let buyerYearlyId = buyerPrices.data.find(
      (p) => p.recurring?.interval === "year",
    )?.id;

    if (!buyerMonthlyId) {
      const price = await stripe.prices.create({
        product: buyerProductId,
        unit_amount: 9900, // $99.00
        currency: "usd",
        recurring: { interval: "month" },
      });
      buyerMonthlyId = price.id;
      console.log("✅ Created Buyer monthly price:", buyerMonthlyId);
    } else {
      console.log("✅ Buyer monthly price exists");
    }

    if (!buyerYearlyId) {
      const price = await stripe.prices.create({
        product: buyerProductId,
        unit_amount: 99000, // $990.00
        currency: "usd",
        recurring: { interval: "year" },
      });
      buyerYearlyId = price.id;
      console.log("✅ Created Buyer yearly price:", buyerYearlyId);
    } else {
      console.log("✅ Buyer yearly price exists");
    }

    // Create Vendor prices
    let vendorMonthlyId = vendorPrices.data.find(
      (p) => p.recurring?.interval === "month",
    )?.id;
    let vendorYearlyId = vendorPrices.data.find(
      (p) => p.recurring?.interval === "year",
    )?.id;

    if (!vendorMonthlyId) {
      const price = await stripe.prices.create({
        product: vendorProductId,
        unit_amount: 19900, // $199.00
        currency: "usd",
        recurring: { interval: "month" },
      });
      vendorMonthlyId = price.id;
      console.log("✅ Created Vendor monthly price:", vendorMonthlyId);
    } else {
      console.log("✅ Vendor monthly price exists");
    }

    if (!vendorYearlyId) {
      const price = await stripe.prices.create({
        product: vendorProductId,
        unit_amount: 199000, // $1990.00
        currency: "usd",
        recurring: { interval: "year" },
      });
      vendorYearlyId = price.id;
      console.log("✅ Created Vendor yearly price:", vendorYearlyId);
    } else {
      console.log("✅ Vendor yearly price exists");
    }

    console.log("\n" + "=".repeat(60));
    console.log("📋 Add these to your .env file:\n");
    console.log(`# Stripe Price IDs`);
    console.log(`STRIPE_PRICE_BUYER_MONTHLY=${buyerMonthlyId}`);
    console.log(`STRIPE_PRICE_BUYER_YEARLY=${buyerYearlyId}`);
    console.log(`STRIPE_PRICE_VENDOR_MONTHLY=${vendorMonthlyId}`);
    console.log(`STRIPE_PRICE_VENDOR_YEARLY=${vendorYearlyId}`);
    console.log("\n" + "=".repeat(60));
    console.log(
      "\n✅ Stripe setup complete! Add the above env vars and restart your server.",
    );
  } catch (error) {
    console.error("❌ Error setting up Stripe:", error);
    process.exit(1);
  }
}

setupStripe();
