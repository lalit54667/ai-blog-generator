const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SHOP_DOMAIN = process.env.SHOP_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_BLOG_ID = process.env.SHOPIFY_BLOG_ID;

app.post("/generate-blog", async (req, res) => {
  const topic = req.body.topic;

  try {
    const aiRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `
You are a professional Shopify blog writer for a snowboarding gear store.
Write a well-structured, engaging, and SEO-optimized blog in clean HTML using:
- <h2> for main sections
- <h3> for subheadings
- <p> for paragraphs
- <ul>/<li> for lists
- <strong> for highlighting
- Emojis to make the content lively

Do NOT use inline CSS. Make it mobile-friendly and visually clean.

👉 Include exactly 3 working backlinks **inside natural paragraphs**:
1. Link to the Shopify product: <a href="https://ai-blog-demo.myshopify.com/products/the-multi-location-snowboard" target="_blank">The Multi-Location Snowboard</a>
2. Link to a Shopify SEO guide: <a href="https://www.shopify.com/blog/ecommerce-seo" target="_blank">Shopify SEO Tips</a>
3. Link to a helpful snowboarding guide: <a href="https://snowboardingprofiles.com" target="_blank">Beginner’s Guide to Snowboarding</a>
            `.trim()
          },
          {
            role: "user",
            content: `Write a detailed Shopify blog on the topic: ${topic}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const blogContent = aiRes.data.choices[0].message.content;

    const shopifyRes = await axios.post(
      `https://${SHOP_DOMAIN}/admin/api/2024-04/blogs/${SHOPIFY_BLOG_ID}/articles.json`,
      {
        article: {
          title: topic,
          body_html: blogContent
        }
      },
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ success: true, articleId: shopifyRes.data.article.id });
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
    res.json({ success: false, error: err.message });
  }
});

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
