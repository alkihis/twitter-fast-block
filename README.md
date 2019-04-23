# Twitter fast block

## Installation

**Requires Node 10+**

You will need a Twitter application. If you don't have one, good luck to create it.

Create a .env file, and put in it 
```
consumer_key=**your consumer key**
consumer_secret=**your consumer secret**
access_token=
access_secret=
```

You could set access_token and access_secret if you dont want to login each time you start the app.
At the first login, tokens will be printed into the console.

## Usage

Two modes exists: Block every RTer of a tweet, and block every follower of a specific user

### Block RTers of a tweet

You can block every rter of a specific tweet, except users that you follow / users that follows you.

Tweet identifier is the number at the end of a tweet url, for example `https://twitter.com/jack/status/20` <-- here

`nofollow` and `nofriends` are optional. 
`nofollow` mean the app will not block users that follows you.
`nofriends` mean the app will not block users you follow.

You **must** specify tweet identifier after `rtersof`, `nofollow` and `nofriends` should be placed only after the identifier.

```bash
node js/main.js rtersof **tweet-identifier** nofollow nofriends
```

#### Example
```bash
node js/main.js rtersof 20 nofriends
```

### Block followers of a user

You can block every follower of a user, except users that you follow / users that follows you.

Screen name is the @username, without the @.

`nofollow` and `nofriends` are optional. 
`nofollow` mean the app will not block users that follows you.
`nofriends` mean the app will not block users you follow.

You **must** specify screen name after `followersof`, `nofollow` and `nofriends` should be placed only after the screen name.

```bash
node js/main.js followersof **screen_name** nofollow nofriends
```

#### Example
```bash
node js/main.js followersof jack nofollow
```
