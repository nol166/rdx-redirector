# rdx redirect

This extension opens Reddit links on the [rdx.overdevs.com](https://rdx.overdevs.com) website. If you don't know what rdx is, you can read more about it [here](https://github.com/avadhesh18/rdx).

## Features
- Redirects the Reddit homepage (`/`) to `https://rdx.overdevs.com/`
- Redirects subreddit pages (`/r/<subreddit>/*`) to `subreddit.html?r=<subreddit>`
- Redirects post/comment threads (`/r/<subreddit>/comments/<postId>/*`) to `comments.html?url=<original>`
- Redirects user profiles (`/user/<username>` or `/u/<username>`) to `user.html?u=<username>`
  
Supports all Reddit subdomains (e.g., `www.`, `old.`, `np.`) over HTTPS.