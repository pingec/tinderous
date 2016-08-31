import {FacebookManager} from "./facebookManagerAsync"
import {TinderBot} from "./tinderBotAsync";
import {JsonFileManager} from './jsonFileManagerAsync';
import Promise = require("bluebird");
import path = require('path');

Promise.config({
    warnings: true,
    longStackTraces: true,
    cancellation: false,
    monitoring: false
});

// process.on("unhandledRejection", function (reason, promise) {
//     debugger;
//     // Todo: unhandled scenario
// });

const configPath = path.resolve('./config.json');


JsonFileManager.LoadTinderConfigAsync(configPath).then((config)=>{
    Startup.main(config);
});


class Startup {
    public static main(config : TinderConfiguration[]): number {

        if (!config || !config.length) {
            throw new Error('config.json is invalid or empty');
        }

        var workers = [];
        Promise.resolve(config).each((section: TinderConfiguration) => {
            var runBotInstance = (section : TinderConfiguration) => {
                var bot = new TinderBot(section);
                var worker = bot.Run()
                    .then(() => {
                        // Never ever supposed to happen (even on errors), reject it. The global handler will catch this.
                        debugger;
                        return Promise.reject(new Error('The infinite loop somehow ended without producing an error, unexpected behavior'));
                    })
                    .catch((err) => {
                        // When out of likes / server timeouts / api or connection error
                        setTimeout(() => {
                            console.log(bot.Configuration.user);
                            runBotInstance(bot.Configuration);
                        }, section.cooldownPeriodAfterError);
                    });
                workers.push(worker);
            };
            runBotInstance(section);
            return Promise.delay(5000); // Start bot instances sequentially with a delay to not trigger rate limiter
        });

        Promise.all(workers);

        return 0;
    }
}

