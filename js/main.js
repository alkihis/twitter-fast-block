"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const twitter_1 = __importDefault(require("twitter"));
const open_1 = __importDefault(require("open"));
// @ts-ignore
const TwitterAuth = require("node-twitter-api");
const readline_1 = __importDefault(require("readline"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const readline = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
const consumer_key = process.env.consumer_key, consumer_secret = process.env.consumer_secret;
// Get access token from oob
const auth = new TwitterAuth({
    consumerKey: consumer_key, consumerSecret: consumer_secret, callback: 'oob'
});
(async () => {
    let access_token = process.env.access_token, access_secret = process.env.access_secret;
    if (!access_token || !access_secret) {
        console.log("Getting request token");
        const [request, r_secret] = await new Promise((resolve, reject) => {
            auth.getRequestToken((error, requestToken, requestSecret, results) => {
                if (error)
                    reject(error);
                resolve([requestToken, requestSecret]);
            });
        });
        // Open navigator and wait for code
        open_1.default('https://api.twitter.com/oauth/authorize?oauth_token=' + request);
        const code = await new Promise(resolve => {
            readline.question(`Please enter Twitter's code, then tap Enter: `, (name) => {
                resolve(name);
                readline.close();
            });
        });
        console.log("Getting access token");
        [access_token, access_secret] = await new Promise((resolve, reject) => {
            auth.getAccessToken(request, r_secret, code, function (error, accessToken, accessTokenSecret, results) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve([accessToken, accessTokenSecret]);
                }
            });
        });
        console.log("Your access tokens are:", access_token, access_secret);
    }
    const twitter = new twitter_1.default({
        consumer_key,
        consumer_secret,
        access_token_key: access_token,
        access_token_secret: access_secret
    });
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    let my_user_id = "";
    async function* getRters(id, dont_block_my_followings = true, dont_block_my_followers = false) {
        if (!id) {
            throw new Error("Cant get rt of null ID");
        }
        const my_followers = dont_block_my_followers ? await getMyFollowers() : new Set;
        const my_followings = dont_block_my_followings ? await getMyFollowings() : new Set;
        const obj_params = {
            id,
            stringify_ids: true,
            cursor: "-1"
        };
        do {
            // Jusqu'à 7500 personnes ayant retweeté
            try {
                console.log("Request with cursor " + obj_params.cursor);
                const resp = await twitter.get("statuses/retweeters/ids.json", obj_params);
                obj_params.cursor = resp.next_cursor_str;
                console.log(resp);
                const filtered = resp.ids.filter(e => {
                    if (dont_block_my_followers && my_followers.has(e)) {
                        return false;
                    }
                    else if (dont_block_my_followings && my_followings.has(e)) {
                        return false;
                    }
                    return true;
                });
                console.log(String(filtered.length) + " id(s) to block");
                yield* filtered; // Envoi tous les identifiants
            }
            catch (e) {
                console.warn('Error', e);
                if (typeof e === 'object' && e[0] && e[0].code === 88) {
                    console.warn("Rate limit exceeded. Waiting...");
                    await sleep(1000 * 1 * 60); // Attends 1 minute si on est en timeout
                }
            }
        } while (obj_params.cursor !== "0");
    }
    async function getMyFollowers() {
        if (!my_user_id) {
            console.log("Getting credentials");
            const resp = await twitter.get('account/verify_credentials.json');
            my_user_id = resp.id_str;
        }
        // Get all followers
        const obj_params = {
            user_id: my_user_id,
            stringify_ids: true,
            cursor: "-1",
            count: 5000
        };
        console.log("Getting your followers");
        let followers = [];
        do {
            // Jusqu'à 7500 personnes ayant retweeté
            try {
                const resp = await twitter.get("followers/ids.json", obj_params);
                obj_params.cursor = resp.next_cursor_str;
                followers = [...followers, ...resp.ids];
            }
            catch (e) {
                console.warn('Error', e);
                if (typeof e === 'object' && e[0] && e[0].code === 88) {
                    console.warn("Rate limit exceeded. Waiting...");
                    await sleep(1000 * 1 * 60); // Attends 1 minute si on est en timeout
                }
            }
        } while (obj_params.cursor !== "0");
        return new Set(followers);
    }
    async function getMyFollowings() {
        if (!my_user_id) {
            console.log("Getting credentials");
            const resp = await twitter.get('account/verify_credentials.json');
            my_user_id = resp.id_str;
        }
        // Get all followers
        const obj_params = {
            user_id: my_user_id,
            stringify_ids: true,
            cursor: "-1",
            count: 5000
        };
        let followers = [];
        console.log("Getting your followings");
        do {
            // Jusqu'à 7500 personnes ayant retweeté
            try {
                const resp = await twitter.get("friends/ids.json", obj_params);
                obj_params.cursor = resp.next_cursor_str;
                followers = [...followers, ...resp.ids];
            }
            catch (e) {
                console.warn('Error', e);
                if (typeof e === 'object' && e[0] && e[0].code === 88) {
                    console.warn("Rate limit exceeded. Waiting...");
                    await sleep(1000 * 1 * 60); // Attends 1 minute si on est en timeout
                }
            }
        } while (obj_params.cursor !== "0");
        return new Set(followers);
    }
    async function* getFollowersAndTweeter(screen_name, dont_block_my_followings = true, dont_block_my_followers = false) {
        if (!screen_name) {
            throw new Error("Cant get user of null screen_name");
        }
        console.log("Will block every follower of " + screen_name + " and " + screen_name + " himself");
        const my_followers = dont_block_my_followers ? await getMyFollowers() : new Set;
        const my_followings = dont_block_my_followings ? await getMyFollowings() : new Set;
        // Get all followers
        const obj_params = {
            screen_name,
            stringify_ids: true,
            cursor: "-1",
            count: 5000
        };
        do {
            try {
                const resp = await twitter.get("followers/ids.json", obj_params);
                obj_params.cursor = resp.next_cursor_str;
                // Filtrage
                const filtered = resp.ids.filter(e => {
                    if (dont_block_my_followers && my_followers.has(e)) {
                        return false;
                    }
                    else if (dont_block_my_followings && my_followings.has(e)) {
                        return false;
                    }
                    return true;
                });
                console.log(filtered.length, "accounts ids to block");
                yield* filtered;
            }
            catch (e) {
                console.warn('Error', e);
                if (typeof e === 'object' && e[0] && e[0].code === 88) {
                    console.warn("Rate limit exceeded. Waiting...");
                    await sleep(1000 * 1 * 60); // Attends 1 minute si on est en timeout
                }
            }
        } while (obj_params.cursor !== "0");
        yield (await twitter.get('users/show.json', { screen_name })).user.id_str;
    }
    async function blockFromGenerator(generator) {
        console.log("Getting data and blocks");
        // Block every RTer
        for await (const rter of generator) {
            try {
                await twitter.post('blocks/create.json', {
                    user_id: rter,
                    include_entities: false,
                    skip_status: true
                });
                console.log("Blocked user " + rter);
            }
            catch (e) {
                // Vérifie si on est en timeout
                if (typeof e === 'object' && e[0] && e[0].code === 88) {
                    console.warn("Rate limit exceeded. Waiting...");
                    await sleep(1000 * 1 * 60); // Attends 1 minute si on est en timeout
                }
                console.error('Block error', e);
            }
        }
    }
    let no_follow = false, no_friends = false;
    if (process.argv[4] === "nofollow" || process.argv[5] === "nofollow") {
        no_follow = true;
        console.log("User that follows you will not be blocked");
    }
    if (process.argv[4] === "nofriends" || process.argv[5] === "nofriends") {
        no_friends = true;
        console.log("Users you follo will not be blocked");
    }
    if (process.argv[2] === "rtersof") {
        await blockFromGenerator(getRters(process.argv[3], no_friends, no_follow));
    }
    else if (process.argv[2] === "followersof") {
        await blockFromGenerator(getFollowersAndTweeter(process.argv[3], no_friends, no_follow));
    }
    else {
        console.log("Error: Invalid command");
    }
    process.exit(0);
})();
