// Function to handle subreddit URLs
const handleSubredditUrl = (redditUrl) => {
  const subredditMatch = redditUrl.match(
    /https:\/\/www\.reddit\.com\/r\/([^/]+)\/?$/
  );
  if (subredditMatch) {
    console.info('Subreddit URL detected');
    const subreddit = subredditMatch[1];
    return `https://rdx.overdevs.com/subreddit.html?r=${subreddit}`;
  }
  return null;
};

// Function to handle post URLs
const handlePostUrl = (redditUrl) => {
  const postMatch = redditUrl.match(
    /https:\/\/www\.reddit\.com\/r\/([^/]+)\/comments\/([^/]+)\/([^/]+)\/?$/
  );
  if (postMatch) {
    console.info('Post URL detected');
    return `https://rdx.overdevs.com/comments.html?url=${redditUrl}`;
  }
  return null;
};

// Main redirect function
const redirect = (requestDetails) => {
  const redditUrl = requestDetails.url;
  let rdxUrl = redditUrl;

  // Check for subreddit URL
  const subredditUrl = handleSubredditUrl(redditUrl);
  if (subredditUrl) {
    rdxUrl = subredditUrl;
  }

  // Check for post URL
  const postUrl = handlePostUrl(redditUrl);
  if (postUrl) {
    rdxUrl = postUrl;
  }

  return {
    redirectUrl: rdxUrl,
  };
};

// Add listener for web requests
browser.webRequest.onBeforeRequest.addListener(
  redirect,
  { urls: ['*://www.reddit.com/r/*'] },
  ['blocking']
);
