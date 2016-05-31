import tinder = require('tinder');
import fs = require('fs');
import webdriver = require('selenium-webdriver');
import {FacebookManager} from "./facebookManagerAsync";
import {JsonFileManager} from "./jsonFileManagerAsync";
import Promise = require("bluebird");
import * as utils from "./utils";
import path = require("path");

export class TinderBot {

    configuration: TinderConfiguration;
    client: tinder.TinderClient;

    constructor(configuration: TinderConfiguration) {
        this.configuration = configuration;
        this.client = new tinder.TinderClient();
    }

    get Configuration() { return this.configuration; }

    private ProcessHistory(client: tinder.TinderClient, config: TinderConfiguration): Promise<any> {
        if (config.messageOldMatches) {
            console.log('fetching history');
            let getHistory = Promise.promisify(client.getHistory);
            return getHistory().then((history) => {
                console.log('You have ' + history.matches.length + ' matches');
                if (config.debug) {
                    JsonFileManager.SaveJsonAsync(history, 'history' + new Date().getTime() + '.json');
                }
                return Promise.resolve(history.matches).each<tinder.TinderMatch, any>((match) => {
                    // Only send message if we have never talked to current match
                    if (!match.messages || match.messages.length === 0) {
                        return Promise.delay(config.sendMessageDelayMs).then(() => {
                            return this.SendMessageAsync(match.person, client, config);
                        });
                    }
                    return Promise.resolve();
                });
            });
        }
        return Promise.resolve();
    }

    public Run() {
        return this.AuthorizeTinderAsync(this.configuration).then((config) => {
            return this.ProcessHistory(this.client, config)
                .then(() => {
                    return utils.RecurseUntilRejected(() => {
                        return this.ProcessRecommendationsAsync(this.client, config)
                    })
                    // .catch(
                    //     (err) => {
                    //     }
                    //     );
                });
        });
    }

    private PreprocessMessageBody(msg: string, person: { _id: string, name: string, birth_date: string }) {
        msg = utils.ReplaceAllStrings(msg, '$name', person.name);
        msg = utils.ReplaceAllStrings(msg, '$age', utils.Age(person.birth_date).toString());
        return msg;
    }

    private SendMessageAsync(person: { _id: string; name: string; birth_date: string; }, client: tinder.TinderClient, config: TinderConfiguration) {
        if (config.messageContent
            && config.messageContent.messages
            && config.messageContent.messages.length) {

            let sendMessage = Promise.promisify<any, string, string>(client.sendMessage);

            if (config.messageContent.strategy === 'full') {
                // Each match gets all of the messages in order of appearance
                return Promise.resolve(config.messageContent.messages).each<string, any>((msg: string) => {
                    msg = this.PreprocessMessageBody(msg, person);
                    return sendMessage(person._id, msg);
                });
            }
            else if (config.messageContent.strategy === 'one-random') {
                // Each match gets one message picked at random from the message pool
                var rndIdx = Math.floor(Math.random() * config.messageContent.messages.length);
                let msg = this.PreprocessMessageBody(config.messageContent.messages[rndIdx], person);
                return sendMessage(person._id, msg);
            }

        }
        return Promise.resolve();
    }

    private FilterRecommendations(recs: tinder.TinderRecommendation[], config: TinderConfiguration) {
        if (config.filterBioByKeywords && config.filterBioByKeywords.whitelist && config.filterBioByKeywords.whitelist.length) {
            recs = recs.filter((res) => {
                return config.filterBioByKeywords.whitelist.some((keyword) => {
                    return res.bio.toUpperCase().indexOf(keyword.toUpperCase()) > -1;
                });
            });
        }
        if (config.filterBioByKeywords && config.filterBioByKeywords.blacklist && config.filterBioByKeywords.blacklist.length) {
            recs = recs.filter((res) => {
                return config.filterBioByKeywords.blacklist.some((keyword) => {
                    return res.bio.toUpperCase().indexOf(keyword.toUpperCase()) < 0;
                });
            });
        }
        return recs;
    }

    private ShouldSkipRecommendation(rec: tinder.TinderRecommendation, config: TinderConfiguration) {
        var skip = false;
        if (config.swipeRightProbability && (Math.random() > config.swipeRightProbability)) {
            skip = true;
        }
        if (config.skipNoBio && !rec.bio) {
            skip = true;
        }
        if (config.skipNoPhoto && !rec.photos && !rec.photos.length) {
            skip = true;
        }
        return skip;
    }

    private ProcessRecommendationsAsync(client: tinder.TinderClient, config: TinderConfiguration) {

        if (!client.isAuthorized()) {
            return Promise.reject(new Error('Tinder not authorized while trying to process recommendations'));
        }

        var getRecommendations = Promise.promisify<tinder.TinderRecommendationsResult, Number>(client.getRecommendations);
        return getRecommendations(10).then((recs) => {

            // recs.message seems to be defined only when a limit kicks or something goes wrong on tinder side?
            if (recs && recs.message && recs.message == "recs exhausted") {
                // Ran out of recommendations 
                debugger;
                return Promise.reject(new Error(recs.message));
            }
            else if (recs && recs.message && recs.message == "recs timeout") {
                debugger;
                return Promise.reject(new Error(recs.message));
            }
            else if (recs && recs.message) {
                debugger;
                return Promise.reject(new Error(recs.message));
            }
            else {
                if (config.debug) {
                    JsonFileManager.SaveJsonAsync(recs, 'recommendations' + new Date().getTime() + '.json'); //debug only
                }
                console.log('Retrieved ' + recs.results ? recs.results.length : 0 + ' recommendations.');


                var filteredResults = this.FilterRecommendations(recs.results, config);
                return Promise.resolve(filteredResults).each<tinder.TinderRecommendation, any>((rec) => {
                    var id = rec._id;
                    if (this.ShouldSkipRecommendation(rec, config)) {
                        console.log('Skipping rec id ' + id);
                        return Promise.reject(new Error('Skipping current rec'));
                    }

                    return Promise.delay(config.swipeRightDelayMs).then(() => {
                        console.log('Liking rec id ' + id);
                        var like = Promise.promisify<any, string>(client.like);
                        return like(id).then((data) => { // todo: type definitions for data
                            console.log('Likes remaining: ' + (data.likes_remaining ? data.likes_remaining : 0));
                            if (data.matched && config.messageNewMatches) {
                                if (config.debug) {
                                    JsonFileManager.SaveJsonAsync(data, 'client.insta.match.on.like' + new Date().getTime() + '.json');
                                }
                                console.log('Like id ' + id + ' matched, sending message.');
                                this.SendMessageAsync(rec, client, config);
                            }
                            if (!data.likes_remaining) {
                                //probably out of likes, stop looping
                                //in this case data looks like:
                                // likes_remaining:0
                                // match:false
                                // rate_limited_until:1464312608442
                                return Promise.reject(new Error('No more likes available.'));
                            }
                            else {
                                console.log('Liked rec id ' + id);
                            }
                            return data;
                        });
                    });
                });
            }
        });
    }


    private AuthorizeTinderAsync(config: TinderConfiguration, recurse = true): Promise<TinderConfiguration> {

        return this.EnsureFBAuthDataAsync(config).then((configWithToken) => {
            var authorize = Promise.promisify<TinderConfiguration, string, string>(this.client.authorize);
            return authorize(configWithToken.fbUserAccessToken, configWithToken.fbUserId)
                .then((res) => {
                    // Success!
                    return configWithToken;
                })
                .catch((err) => {
                    // Failure!
                    console.log('Tinder authorization failed, deleting fb access token in config, it might have expired.');
                    delete configWithToken.fbUserAccessToken;
                    JsonFileManager.UpdateTinderConfigAsync(configWithToken, path.resolve('./config.json'));

                    if (recurse) {
                        // Try again
                        return this.AuthorizeTinderAsync(configWithToken, false)
                    }
                    else {
                        // Give up
                        return Promise.reject(new Error('Tinder authorization failed, unrecoverable authorization failure.')); // or throw exception, same effect
                    }
                });
        });
    }



    private EnsureFBAuthDataAsync(config: TinderConfiguration): Promise<TinderConfiguration> {
        if (!config.fbUserAccessToken || !config.fbUserId) {
            if (!config.user || !config.password) {
                return Promise.reject(new Error('Config section contains too litle information.'));
            }
            return FacebookManager.getAccessTokenAndIdAsync(config.user, config.password).then((results: any) => {
                config.fbUserAccessToken = results[0];
                config.fbUserId = results[1];
                var foo = JsonFileManager.UpdateTinderConfigAsync(config, path.resolve('./config.json'))
                    .thenReturn(config);
                return foo;
            });

        }
        else {
            return Promise.resolve(config);
        }
    }


}