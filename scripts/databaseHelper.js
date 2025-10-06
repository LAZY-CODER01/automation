const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Saves an array of topic objects to the database.
 * Uses `createMany` for efficient bulk insertion.
 * @param {Array<Object>} topics - The topic objects to save.
 */
async function saveTopics(topics) {
  if (!topics || topics.length === 0) {
    console.log('No topics provided to save.');
    return;
  }

  try {
   
    const result = await prisma.topic.createMany({
      data: topics,
      skipDuplicates: true,
    });
    console.log(`Successfully saved ${result.count} new topics to the database.`);
  } catch (error) {
    console.error('Error saving topics to the database:', error);
  } finally {
   
    await prisma.$disconnect();
  }
}

module.exports = { saveTopics };
