const checkCurrentTab = async () => {
  try {
    const [currentTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!currentTab || !currentTab.url) {
      return false;
    }

    const { url } = currentTab;
    return url.includes('reddit.com');
  } catch (error) {
    console.error('Error checking current tab:', error);
    return false;
  }
};

// Check if user is intentionally visiting Reddit as to not redirect
const intentionalVisit = async () => {
  const isReddit = await checkCurrentTab();
  return isReddit ? true : false;
};

/**
 * Handle the main Reddit homepage URL
 * @param {string} redditUrl
 * @returns {string|null} redirect URL
 */
const handleMainUrl = (redditUrl) => {
  try {
    const url = new URL(redditUrl);
    if (url.hostname.endsWith('reddit.com') && (url.pathname === '/' || url.pathname === '')) {
      return 'https://rdx.overdevs.com/';
    }
  } catch (error) {
    console.error('Error parsing main URL:', error);
  }
  return null;
};

/**
 * Handle subreddit listing URLs, including optional sort/pagination paths
 * @param {string} redditUrl
 * @returns {string|null} redirect URL
 */
const handleSubredditUrl = (redditUrl) => {
  try {
    const url = new URL(redditUrl);
    if (!url.hostname.endsWith('reddit.com')) {
      return null;
    }
    const parts = url.pathname.split('/').filter(Boolean);
    // e.g. ["r", "subreddit", ...]
    if (parts[0] === 'r' && parts[1]) {
      // ignore post pages
      if (parts[2] === 'comments') {
        return null;
      }
      const subreddit = parts[1];
      return `https://rdx.overdevs.com/subreddit.html?r=${encodeURIComponent(subreddit)}`;
    }
  } catch (error) {
    console.error('Error parsing subreddit URL:', error);
  }
  return null;
};

/**
 * Handle post/comment thread URLs
 * @param {string} redditUrl
 * @returns {string|null} redirect URL
 */
const handlePostUrl = (redditUrl) => {
  try {
    const url = new URL(redditUrl);
    if (!url.hostname.endsWith('reddit.com')) {
      return null;
    }
    const parts = url.pathname.split('/').filter(Boolean);
    // e.g. ["r", "subreddit", "comments", "postId", …]
    if (parts[0] === 'r' && parts[2] === 'comments' && parts[1] && parts[3]) {
      return `https://rdx.overdevs.com/comments.html?url=${encodeURIComponent(redditUrl)}`;
    }
  } catch (error) {
    console.error('Error parsing post URL:', error);
  }
  return null;
};
/**
 * Handle user profile URLs (/user/username or /u/username)
 * @param {string} redditUrl
 * @returns {string|null} redirect URL
 */
const handleUserProfileUrl = (redditUrl) => {
  try {
    const url = new URL(redditUrl);
    if (!url.hostname.endsWith('reddit.com')) {
      return null;
    }
    const parts = url.pathname.split('/').filter(Boolean);
    // e.g. ["user"|"u", "username"]
    if ((parts[0] === 'user' || parts[0] === 'u') && parts[1]) {
      const username = parts[1];
      return `https://rdx.overdevs.com/user.html?u=${encodeURIComponent(username)}`;
    }
  } catch (error) {
    console.error('Error parsing user profile URL:', error);
  }
  return null;
};

// Main redirect function
const redirect = async (requestDetails) => {
  // If user is currently on a Reddit page, assume intentional visit
  const intentional = await intentionalVisit();
  if (intentional) {
    console.debug('User is intentionally visiting Reddit, not redirecting');
    return;
  }

  const redditUrl = requestDetails.url;
  // Prevent loops: skip if already redirected or targeting rdx site
  if (redditUrl.includes('redirected=true') || redditUrl.includes('rdx.overdevs.com')) {
    console.debug('Redirection already occurred or targeting rdx, not redirecting');
    return;
  }

  // Determine the appropriate rdx redirect based on URL patterns
  let rdxUrl = null;
  rdxUrl = handleMainUrl(redditUrl)
    || handlePostUrl(redditUrl)
    || handleSubredditUrl(redditUrl)
    || handleUserProfileUrl(redditUrl);
  if (!rdxUrl) {
    // No matching pattern; do not redirect
    return;
  }

  // Append redirect flag to avoid infinite loops
  rdxUrl += (rdxUrl.includes('?') ? '&' : '?') + 'redirected=true';
  return { redirectUrl: rdxUrl };
};

// listener for web requests
// Listen to requests on any reddit.com subdomain
browser.webRequest.onBeforeRequest.addListener(
  redirect,
  { urls: ['*://*.reddit.com/*'] },
  ['blocking']
);

// tab updates
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.includes('reddit.com')) {
    const requestDetails = { url: changeInfo.url };
    const redirection = await redirect(requestDetails);
    if (redirection && redirection.redirectUrl) {
      browser.tabs.update(tabId, { url: redirection.redirectUrl });
    }
  }
});
