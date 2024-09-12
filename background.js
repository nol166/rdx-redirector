// Function to check if the tab's URL includes 'reddit.com'
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

const handleMainUrl = (redditUrl) => {
  if (redditUrl === 'https://www.reddit.com/') {
    return 'https://rdx.overdevs.com/';
  }
  return null;
};

const handleSubredditUrl = (redditUrl) => {
  const subredditMatch = redditUrl.match(/https:\/\/www\.reddit\.com\/r\/([^/]+)\/?$/);
  if (subredditMatch) {
    return `https://rdx.overdevs.com/subreddit.html?r=${subredditMatch[1]}`;
  }
  return null;
};

const handlePostUrl = (redditUrl) => {
  const postMatch = redditUrl.match(/https:\/\/www\.reddit\.com\/r\/([^/]+)\/comments\/([^/]+)\/([^/]+)\/?$/);
  if (postMatch) {
    return `https://rdx.overdevs.com/comments.html?url=${redditUrl}`;
  }
  return null;
};

// Main redirect function
const redirect = async (requestDetails) => {
  // If already on reddit, do not redirect
  const intentional = await intentionalVisit();
  if (intentional) {
    console.debug('User is intentionally visiting Reddit, not redirecting');
    return;
  }

  const redditUrl = requestDetails.url;

  if (redditUrl.includes('redirected=true')) {
    console.debug('Redirection already occurred, not redirecting again');
    return;
  }

  let rdxUrl = redditUrl;

  const mainUrl = handleMainUrl(redditUrl);
  if (mainUrl) {
    rdxUrl = mainUrl;
  }

  const subredditUrl = handleSubredditUrl(redditUrl);
  if (subredditUrl) {
    rdxUrl = subredditUrl;
  }

  const postUrl = handlePostUrl(redditUrl);
  if (postUrl) {
    rdxUrl = postUrl;
  }

  // Add query param for redirection to prevent infinite loop
  if (!rdxUrl.includes('redirected=true')) {
    rdxUrl += (rdxUrl.includes('?') ? '&' : '?') + 'redirected=true';
  }

  return {
    redirectUrl: rdxUrl,
  };
};

// listener for web requests
browser.webRequest.onBeforeRequest.addListener(
  redirect,
  { urls: ['*://www.reddit.com/*'] },
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