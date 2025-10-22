// Load environment variables from .env file
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// --- CONFIGURATION ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// --- NOTIFICATION LOGIC ---

// Create a reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Sends an email notification about a new draft.
 * @param {object} draft - The newly created draft object from Prisma.
 */
async function sendNotificationEmail(draft) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log('Email credentials not set, skipping email notification.');
    return;
  }

  const mailOptions = {
    from: `"Automation Blog Bot" <${EMAIL_USER}>`,
    to: EMAIL_USER, // Sending the notification to yourself
    subject: `✅ New Draft Ready for Review: "${draft.title}"`,
    html: `
      <h1>New Draft Generated!</h1>
      <p>A new draft has been created and is ready for your review.</p>
      <ul>
        <li><b>ID:</b> ${draft.id}</li>
        <li><b>Title:</b> ${draft.title}</li>
      </ul>
      <p>You can review and approve it here (link will work on Day 8):</p>
      <a href="http://localhost:3000/admin/drafts/${draft.id}">Review Draft</a>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📬 Notification email sent successfully.');
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
}


/**
 * The main function to generate a draft article from a topic label.
 */
async function main() {
  if (!GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY is not set in your .env file.');
    return;
  }

  console.log('Starting draft generation process...');
  try {
    // 1. Get the most recent topic label to write about
    const candidateTopic = await prisma.topicLabel.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!candidateTopic) {
      console.log('No candidate topics found in the database. Run selectTopics.js first.');
      return;
    }

    // 2. Get recent posts to provide context
    const samplePosts = await prisma.topic.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    
    if (samplePosts.length === 0) {
      console.log('No sample posts found to provide context for the draft.');
      return;
    }

    console.log(`Generating draft for topic: "${candidateTopic.label}"`);
    const sampleTitles = samplePosts.map(p => `- ${p.title}`).join('\n');
    
    // 3. Create the prompt for the AI
    const prompt = `
      You are an expert content creator and tech journalist. Your task is to generate a draft for a blog post based on a main topic and a list of related, recent headlines. The tone should be informative, engaging, and neutral.

      Main Topic: "${candidateTopic.label}"

      Sample Headlines for Context:
      ${sampleTitles}

      Generate the content for the following fields:
      - title: A compelling, SEO-friendly blog post title.
      - summary: A concise, one-paragraph summary of the article (2-4 sentences).
      - body: The full article content, written in clear paragraphs. It should be around 300-500 words.
      - imagePrompt: A short, simple list of 2-4 keywords for searching a stock photo library like Unsplash. The keywords should be concrete and visually descriptive. For example: "data technology global network", "abstract blue gold", or "futuristic circuit board".
    `;

    // 4. Call the Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              "title": { "type": "STRING" },
              "summary": { "type": "STRING" },
              "body": { "type": "STRING" },
              "imagePrompt": { "type": "STRING" }
            },
            required: ["title", "summary", "body", "imagePrompt"]
          }
        }
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API request failed: ${response.statusText} - ${errorBody}`);
    }

    const aiResult = await response.json();
    const content = aiResult.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
        throw new Error("AI response did not contain valid content.");
    }
    
    const draftData = JSON.parse(content);

    // 5. Save the new draft to the database
    const newDraft = await prisma.draft.create({
      data: {
        title: draftData.title,
        summary: draftData.summary,
        body: draftData.body,
        imagePrompt: draftData.imagePrompt,
        status: 'pending',
        topicId: samplePosts[0].id, 
      },
    });

    console.log('✅ Success! A new draft has been created and saved to the database.');
    console.log(`Draft ID: ${newDraft.id}, Title: "${newDraft.title}"`);
    
    // --- SEND NOTIFICATION ---
    await sendNotificationEmail(newDraft);


  } catch (error) {
    console.error('An error occurred during draft generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

