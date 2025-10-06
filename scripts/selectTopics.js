// Load environment variables from .env file
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * The main function to fetch topics, generate labels via AI, and save them.
 */
async function main() {
  if (!GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY is not set in your .env file.');
    return;
  }

  console.log('Fetching recent topics from the database...');
  try {
    const recentTopics = await prisma.topic.findMany({
      take: 3,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentTopics.length === 0) {
      console.log('No topics found in the database to analyze. Run fetchReddit.js first.');
      return;
    }

    console.log(`Found ${recentTopics.length} topics to analyze.`);
    const topicTitles = recentTopics.map(t => t.title).join('\n');

    console.log('Sending topic titles to AI for summarization...');
    const prompt = `Based on the following list of article titles, generate 3-5 concise and distinct topic labels that summarize the key themes. Each label should be 3-5 words long.\n\nTitles:\n${topicTitles}`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    
    // MODIFIED: Added retry logic for API calls
    let response;
    const maxRetries = 3;
    let attempt = 0;
    let delay = 2000; // Start with a 2-second delay

    while (attempt < maxRetries) {
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  "labels": {
                    "type": "ARRAY",
                    "items": { "type": "STRING" }
                  }
                }
              }
            }
          }),
        });

        if (response.ok) {
          break; // Success, exit the loop
        } else if (response.status === 503 && attempt < maxRetries - 1) {
          console.log(`Model is overloaded (503). Retrying in ${delay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Double the delay for the next attempt
          attempt++;
        } else {
          // For other errors or last retry attempt
          const errorBody = await response.text();
          throw new Error(`Gemini API request failed: ${response.statusText} - ${errorBody}`);
        }
      } catch (error) {
        if (attempt < maxRetries - 1) {
          console.log(`An error occurred. Retrying in ${delay / 1000} seconds...`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          attempt++;
        } else {
          throw error; // Throw error after last attempt
        }
      }
    }


    if (!response || !response.ok) {
        console.error("Failed to get a successful response from the API after several retries.");
        return;
    }

    const aiResult = await response.json();
    const content = aiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("Could not find valid content in the AI response:", JSON.stringify(aiResult, null, 2));
      return;
    }

    let labelsToSave;
    try {
      const parsedContent = JSON.parse(content);
      labelsToSave = parsedContent.labels || [];
      if (!Array.isArray(labelsToSave) || labelsToSave.some(l => typeof l !== 'string')) {
         throw new Error("AI response was not a simple array of strings inside a 'labels' key.");
      }
    } catch (e) {
      console.error("Could not parse JSON from AI response:", content);
      console.error("Parse error:", e.message);
      return;
    }

    if (labelsToSave.length > 0) {
      console.log('AI generated labels:', labelsToSave);
      const dataToInsert = labelsToSave.map(label => ({ label }));
      const result = await prisma.topicLabel.createMany({
        data: dataToInsert,
        skipDuplicates: true,
      });
      console.log(`Successfully saved ${result.count} new topic labels.`);
    } else {
      console.log('AI did not return any labels to save.');
    }

  } catch (error) {
    console.error('An error occurred during the topic selection process:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

