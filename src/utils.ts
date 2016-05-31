import Promise = require('bluebird');

export function RecurseUntilRejected(doWork: () => Promise<any>): Promise<void> {
    return doWork()
        .then(() => {
            return RecurseUntilRejected(doWork)
        });
}

/* /**
 * Returned promise is resolved when all of passed promises are either resolved or rejected.
 */
export function SettleAll(promises: Promise<any>[]) {
    return Promise.all(promises.map(function (promise) {
        return promise.reflect();
    }));
}

export function ReplaceAllStrings(target: string, search: string, replacement: string) {
    return target.replace(new RegExp(search, 'g'), replacement);
};

export function Age(date: string) {
    var today = new Date();
    var birthDate = new Date(date);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}