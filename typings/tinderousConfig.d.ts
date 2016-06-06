//without "declare" to make ti a global, we would need 
//a "import {TinderConfiguration} from '../typings/tinderousConfig.d.ts';" in each file that references it

declare interface ConfigurationState { 
    configPath : string,
    config : TinderConfiguration[]
}

declare interface TinderConfiguration {
    debug: boolean,
    user: string,
    password: string,
    fbUserId: string,
    fbUserAccessToken: string,
    swipeRightProbability: number,
    filterBioByKeywords: {
        whitelist: string[],
        blacklist: string[]
    },
    skipNoBio:boolean,
    skipNoPhoto:boolean,
    sendMessageDelayMs: number,
    swipeRightDelayMs: number,
    cooldownPeriodAfterError: number,
    messageNewMatches: boolean,
    messageOldMatches: boolean,
    messageContent: {
        strategy: string,
        messages: string[]
    }
}



