const events = require('events'),
    uuid = require('uuid'),
    Verbose = require('./verbose');

let _job = Symbol(),
    _threadQty = Symbol(),
    _eventEmitter = Symbol(),
    _verbose = Symbol(),
    _finalizer = Symbol(),
    _uuid = Symbol();

module.exports = class Job {

    /**
     *
     * @param {function} job
     * @param {number} threadQty
     * @param {string} title
     * @param {function} cb
     * @param {boolean} verbose
     */
    constructor(job, threadQty = 3, title, cb, verbose = false) {
        this[_eventEmitter] = new events.EventEmitter();
        this.setJob(job);
        this.threadQty = threadQty;
        this[_uuid] = uuid.v4();
        this.cb = cb;
        this[_verbose] = new Verbose(verbose, `Job (threadQty : ${this.threadQty}) ${this.title}`);
        this._title = title;
    }


    setJob(newJob) {
        if (typeof newJob !== 'function') {
            throw new Error('Ce job doit être une function.');
        }
        this[_job] = newJob;
    }

    set threadQty(threadQty) {
        if (typeof threadQty !== 'number') {
            throw new Error('threadQty doit être un Number.');
        }
        this[_threadQty] = threadQty;
    }

    [_finalizer]() {
        let self = this;
        return () => {
            self[_verbose].log('job.finished');
            if (typeof self.cb === 'function') {
                self.cb(self);
            }
            self[_eventEmitter].emit('job.finished', self);
        };
    }


    get threadQty() {
        return this[_threadQty];
    }


    exec() {
        let self = this;
        try {
            this[_job](self[_finalizer]());
        } catch (e) {
            console.error(`Job ${self.title}`, e);
        }
    }


    on(event, cb) {
        this[_eventEmitter].on(event, cb);
    }


    get title() {
        return (this._title || this[_uuid]);
    }
};