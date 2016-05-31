import path = require('path');
import webdriver = require('selenium-webdriver');
import Promise = require("bluebird");

export class FacebookManager {

    public static getAccessTokenAndIdAsync(fbUserEmail: string, fbUserPassword: string) {

        var seleniumDriverPath = path.resolve("./selenium");
        if ((<string>process.env.PATH).indexOf(seleniumDriverPath) < 0) {
            process.env.PATH += ';' + seleniumDriverPath;
        }
        
        var By = webdriver.By,
            until = webdriver.until;

        var driver: chrome.Driver = new webdriver.Builder()
            .forBrowser('chrome')
            .build();

        const facebookAccessTokenUrl = 'https://www.facebook.com/dialog/oauth?client_id=464891386855067&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=basic_info,email,public_profile,user_about_me,user_activities,user_birthday,user_education_history,user_friends,user_interests,user_likes,user_location,user_photos,user_relationship_details&response_type=token';

        driver.get(facebookAccessTokenUrl);
        driver.findElement(By.name('email')).sendKeys(fbUserEmail);
        driver.findElement(By.name('pass')).sendKeys(fbUserPassword);
        driver.findElement(By.name('login')).click();

        var fbTokenAcquired = new webdriver.promise.Deferred();
        driver.getCurrentUrl().then(function (url) {
            var accessToken = /#access_token=(.*)&expires_in/.exec(url)[1];
            fbTokenAcquired.fulfill(accessToken);
        });


        var fbIdAcquired = new webdriver.promise.Deferred();
        driver.get('https://www.facebook.com/');
        driver.findElement(By.className('fbxWelcomeBoxName')).then(function (element) {
            element.getAttribute('href').then(function (href) {
                var fbId = /id=(.*)&/.exec(href)[1];
                fbIdAcquired.fulfill(fbId);
            });
        });

        return Promise.all([fbTokenAcquired, fbIdAcquired]).then((results)=>{
            driver.quit();
            return results;
        });

    }
}
