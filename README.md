# Tinderizer

A tinder bot/automation utility for social experimentation.

Supports mass-liking and mass-messaging together with some additional convenience features - see config file description below.

Facebook User Id and Facebook Access Token retrieval is automated via Selenium Chrome driver (included is only the windows version, tested as working on Windows 8.1 and Chrome 50.0.2661.102 m)

Built on top of https://www.npmjs.com/package/tinder (https://github.com/tinderjs/tinderjs).

TODO: 
- implement a statistics and reports generator, cache all recommendations :)
- crossplatform access token retrieval (currently only tested with windows & chrome, to make it crossplatform, other Selenium Chrome drivers should be included)


## Run instructions

0. `npm install tinderizer && move node_modules/tinderizer . && move node_modules tinderizer/ && cd tinderizer`

0. Create config.json (copy/paste example below) inside tinderizer directory. 
    
    Most options can be left default. "fbUserId" and "fbUserAccessToken" must be specified or "user" and "password" must be specified in order to automatically retrieve the first two.
        
    Facebook access token can be acquired via https://www.facebook.com/dialog/oauth?client_id=464891386855067&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=basic_info,email,public_profile,user_about_me,user_activities,user_birthday,user_education_history,user_friends,user_interests,user_likes,user_location,user_photos,user_relationship_details&response_type=token

0. Run `npm start`

# Dependencies
- Facebook User Id and Facebook Access Token retrieval requires Chrome to be installed, if they are provided by the user, this step is skipped

# Structure
Typescript source files are in /src. Entry point is /src/start.ts, main logic is in /src/tinderBotAsync.ts

Runtime .js files are output to /bin when compiled. Startup point is /bin/start.js

For more info see tsconfig.json and package.json

## config.json
```
[
    {
        "debug": false,
        "user": "",
        "password": "",
        "fbUserId": "",
        "fbUserAccessToken": ""
        "_comment": "you can get the access token via https://www.facebook.com/dialog/oauth?client_id=464891386855067&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=basic_info,email,public_profile,user_about_me,user_activities,user_birthday,user_education_history,user_friends,user_interests,user_likes,user_location,user_photos,user_relationship_details&response_type=token",
        "swipeRightProbability": 1,
        "filterBioByKeywords": {
            "whitelist": [],
            "blacklist": []
        },
        "skipNoBio": false,
        "skipNoPhoto": true,
        "sendMessageDelayMs": 5000,
        "swipeRightDelayMs": 2000,
        "cooldownPeriodAfterError": 3600000,
        "messageNewMatches": true,
        "messageOldMatches": false,
        "messageContent": {
            "_comment": {
                "full": "Each match gets all of the messages in order of appearance",
                "one-random": "Each match gets one message picked at random from the message pool"
            },
            "strategy": "full",
            "messages": [
                "Hey $name, you look younger than $age.",
                "Hey there, this is a second message.",
                "Hey there, this is a third message."
            ]
        },
    }
]
```

**Full config structure is required, there are no defaults.** If some options not needed, disable them by setting a proper value, do not delete the properties themselves.

- *debug* - enables some debugging features, mostly dumps json responses to disk
- *user* - email used to login into facebook
- *password* - password used to login into facebook
- *fbUserId* - facebook user id
- *fbUserAccessToken* - facebok access token
- *swipeRightProbability* - how often to swipe right (between 0 and 1)
- *filterBioByKeywords.whitelist* - ignore any person who does not have a whitelisted word in the bio (disabled if unpopulated, precendece over blacklist)
- *filterBioByKeywords.blacklist* - ignore any person who has a blacklisted word in the bio (disabled if unpopulated)
- *skipNoBio* - ignore persons without a bio
- *skipNoPhoto* - ignore persons without a photo
- *sendMessageDelayMs* - delay between messages when messaging old matches or when sending multiple messages to one match
- *swipeRightDelayMs* - delay between right-swipes
- *cooldownPeriodAfterError* - if there are no more matches, the number of daily likes allowed is reached, if there is a timeout or a connection/api error, cool off for this amount of milliseconds before restarting the bot
- *messageNewMatches* - if true will auto-message any new matches since the bot has started
TODO: ne ve msgjat, samo tiste brez zgodovine!! messageOldMatches - if true will auto-message any matches that have never been messaged before
- *messageContent.strategy* - full will message every match with all messages specified in the config, one-random will pick only one random message from the pool and send it to the match
- *messageContent.messages* - message pool, variables $name and $age can be used and will be resolved at runtime



# Editing source (for developers)

`git clone https://github.com/pingec/tinderizer.git` 

Edit files in /src then do `npm run compile` to compile to /bin and then `npm start` to run /bin/start.js

For more info see package.json and tsconfig.json

