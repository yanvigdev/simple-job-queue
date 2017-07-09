let _isEnable = Symbol();
module.exports = class Verbose {
    constructor(isEnable = false, prefix = '') {
        this[_isEnable] = isEnable;
        this._prefix = prefix;
    }

    log(message) {
        if (this[_isEnable]) {
            console.log(this._prefix + message+'\n');
        }
    }

    get prefix() {
        return this._prefix;
    }

    set prefix(value) {
        this._prefix = value;
    }

    get isEnable() {
        return this[_isEnable];
    }
}