
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

async function main() {
  if (!UNSPLASH_ACCESS_KEY) {
    console.error('Error: UNSPLASH_ACCESS_KEY is not set in your .env file.');
    return;
  }

  console.log('Starting image search process...');
  
  try {
   
    const draft = await prisma.draft.findFirst({
      where: {
        status: 'pending',
        images: {
          isEmpty: true, 
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!draft) {
      console.log('No pending drafts found that need an image. All drafts are up to date.');
      return;
    }

    if (!draft.imagePrompt) {
        console.log(`Draft ID ${draft.id} has no image prompt to use as a search query. Skipping.`);
        return;
    }

    console.log(`Found draft ID ${draft.id}. Searching for an image with prompt: "${draft.imagePrompt}"`);

    console.log('Calling Unsplash API to search for an image...');
    const query = encodeURIComponent(draft.imagePrompt);
    const apiUrl = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`;
    
    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Unsplash API request failed: ${response.statusText} - ${errorBody}`);
    }

    const result = await response.json();
    const imageUrl = result.results?.[0]?.urls?.regular;

    if (!imageUrl) {
        throw new Error(`No images found on Unsplash for the query: "${draft.imagePrompt}"`);
    }

    console.log(`Found image. URL: ${imageUrl}`);

    const updatedDraft = await prisma.draft.update({
      where: { id: draft.id },
      data: {
        images: {
          push: imageUrl, 
        },
      },
    });

    console.log('✅ Success! Draft updated with new image URL from Unsplash.');

  } catch (error) {
    console.error('An error occurred during the image search process:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

