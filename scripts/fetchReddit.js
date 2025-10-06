
const fetch = require('node-fetch');
const { saveTopics } = require('../lib/db');


const SUBREDDIT = 'technology';
const POST_LIMIT = 25;


async function main() {
  console.log(`Fetching the top ${POST_LIMIT} posts from r/${SUBREDDIT}...`);

  try {
    const response = await fetch(`https://www.reddit.com/r/${SUBREDDIT}/hot.json?limit=${POST_LIMIT}`);
    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.statusText}`);
    }

    const data = await response.json();
    const posts = data.data.children;
    console.log(`Found ${posts.length} posts.`);

    const topics = posts.map(post => ({
      title: post.data.title,
      subreddit: post.data.subreddit,
      score: post.data.score,
      url: `https://reddit.com${post.data.permalink}`,
    
    }));

    
    await saveTopics(topics);

  } catch (error) {
    console.error('An error occurred while fetching and saving Reddit topics:', error);
  }
}

main();
