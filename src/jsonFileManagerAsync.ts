import Promise = require("bluebird");
import fs = require('fs');


export class JsonFileManager {


    static SaveTinderConfigAsync(configData: TinderConfiguration[], path: string) {
        return JsonFileManager.SaveJsonAsync(configData, path);
    }

    static SaveJsonAsync(object, path: string) {
        var writeFile = Promise.promisify<void, string, string>(fs.writeFile);
        return writeFile(path, JSON.stringify(object, null, 4))
            .then(() => {
                console.log("JSON written to " + path);
            });
    }

    static LoadTinderConfigAsync(path: string) {
        return JsonFileManager.LoadJsonAsync<TinderConfiguration[]>(path);
    }

    static UpdateTinderConfigAsync(updatedConfSection: TinderConfiguration, path) {
        return JsonFileManager.LoadTinderConfigAsync(path)
            .then((config) => {
                config.forEach((oldSection, idx) => {
                    if (oldSection.user === updatedConfSection.user) {
                        config[idx] = updatedConfSection;
                    }
                });
                return JsonFileManager.SaveTinderConfigAsync(config, path);
            });
    }

    static LoadJsonAsync<T>(path: string) {
        var readFile = Promise.promisify<string, string, string>(require("fs").readFile);
        return readFile(path, 'utf8').then(function (contents) {
            return <T>JSON.parse(contents);
        });
    }


}