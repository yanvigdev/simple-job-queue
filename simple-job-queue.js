const events = require('events'),
    Job = require('./lib/job'),
    Verbose = require('./lib/verbose'),
    _ = require('underscore'),
    _event = {
        queue: {
            finished: 'queue.finished',
            paused: 'queue.paused',
            resumed: 'queue.resumed',
            stopped: 'queue.stopped'
        },
        task: {
            added: 'queue.task.added',
            exec: 'queue.task.exec',
            finished: 'queue.task.finished'
        }
    };

let _verb = Symbol(),
    _task = Symbol(),
    _eventEmitter = Symbol(),
    _taskStorage = Symbol(),
    _threadTotalCapacity = Symbol(),
    _threadQtyBusy = Symbol(),
    _pause = Symbol(),
    _execTask = Symbol(),
    _threadsManager = Symbol(),
    _addThread = Symbol(),
    _removeThread = Symbol();

module.exports = class SimpleJobQueue {
    /**
     *
     * @param {number} threadTotalCapacity
     * @param {boolean} verbose
     */
    constructor(threadTotalCapacity = 5, verbose = false) {
        if (typeof threadTotalCapacity !== 'number' || !Number.isInteger(threadTotalCapacity)) {
            throw new Error('threadTotalCapacity should be a integer number');
        }
        if (threadTotalCapacity < 2) {
            throw new Error('threadTotalCapacity should be > 2');
        }
        /**
         *
         * @type {Verbose}
         */
        this[_verb] = new Verbose(verbose, 'SimpleJobQueue');
        /**
         *
         * @type {number}
         */
        this[_task] = 0;
        /**
         *
         * @type {EventEmitter}
         */
        this[_eventEmitter] = new events.EventEmitter();
        /**
         *
         * @type {Array}
         */
        this[_taskStorage] = [];
        /**
         *
         * @type {number}
         */
        this[_threadTotalCapacity] = threadTotalCapacity;
        /**
         *
         * @type {number}
         */
        this[_threadQtyBusy] = 0;
        /**
         *
         * @type {boolean}
         */
        this[_pause] = false;


    }

    /**
     * Cette methode execute le job qui lui est passé en argument et ajout son nombre de thread au _threadQtyBusy et envoi un event d'execution
     * @param {Job} nextJob
     * @private
     */
    [_execTask](nextJob) {
        this[_addThread](nextJob.threadQty);
        this[_verb].log(`${_event.task.exec} ${nextJob.title}`);
        this[_eventEmitter].emit(_event.task.exec, nextJob.title);
        nextJob.exec();
    }

    /**
     * cette methode à pour fonction de trouver le prochain job de la queue qui sera executé.
     * @private
     */
    [_threadsManager]() {
        let self = this,
            nextJob;
        //verifie que la queue n'est pas vide et pas en pause
        if (this[_taskStorage].length && !this[_pause]) {
            //parcours tous les job de la queue en y extrayant le prochain job executable.
            this[_taskStorage] = _.reject(this[_taskStorage], job => {
                let isValid = false;
                //verifie que le nombre de thread du job est compatible inferieur ou egal au nombre de thread
                // disponible de la queue et qu'il n'y a deja le future job a executé trouvé
                if ((this[_threadQtyBusy] + job.threadQty) <= self[_threadTotalCapacity] && typeof nextJob === 'undefined') {
                    nextJob = job;
                    isValid = true;
                }
                return isValid;
            });
            //execute le job trouvé
            if (typeof nextJob !== 'undefined') {
                this[_execTask](nextJob);
            }
        }

    }

    /**
     * Additionne à la quantité de thread occupé de la queue le chiffre passé en argument
     * @param {number} threadQtyOccupied
     * @private
     */
    [_addThread](threadQtyOccupied) {
        this[_threadQtyBusy] = this[_threadQtyBusy] + threadQtyOccupied;
        this[_verb].log(`_addThread +${threadQtyOccupied}`);
        this[_threadsManager]();
    }

    /**
     * Soustrait à la quantité de thread occupé de la queue le chiffre passé en argument
     * @param {number} threadQtyReleased
     * @private
     */
    [_removeThread](threadQtyReleased) {
        this[_threadQtyBusy] = this[_threadQtyBusy] - threadQtyReleased;
        this[_verb].log(`_removeThread -${threadQtyReleased}`);
        this[_threadsManager]();
        if (!(--this[_task])) {
            this[_verb].log(_event.queue.finished);
            this[_eventEmitter].emit(_event.queue.finished);
        }
    }

    /**
     * ajout un tache et sa priorité à la queue
     * @param {function} job function Tache à ajouter
     * @param {number} [threadQtyOccupied]  capacité de la tache à être traité en parallèle d'autre tache de  la queue (1 peut être traité en parallèle d'autres taches et 5 ne peut pas être traité en parallèle d'autres taches)
     * @param {string} [title]
     */
    addJob(job, threadQtyOccupied, title) {
        if (typeof job !== 'function') {
            throw new Error('it\'s not a function');
        }
        let self = this,
            _threadQtyOccupied = (threadQtyOccupied || Math.ceil(this[_threadTotalCapacity] / 2));
        if (_threadQtyOccupied <= 0 && _threadQtyOccupied > this[_threadTotalCapacity]) {
            throw new Error(`threadQtyOccupied should be 1 to ${this[_threadTotalCapacity]}`);
        }
        this[_task]++;
        this[_taskStorage].push(new Job(job, _threadQtyOccupied, title, _this => {
            self[_eventEmitter].emit(_event.task.finished, _this.title);
            self[_removeThread](_this.threadQty);
        }, this[_verb].isEnable));
        this[_verb].log(_event.task.added, title);
        this[_eventEmitter].emit(_event.task.added, title);
        this[_threadsManager]();
    }

    /**
     * Y'a t'il un job dans le queue?
     * @returns {boolean}
     */
    isBusy() {
        return this[_task] > 0 && this[_threadQtyBusy] > 0;
    }

    /**
     * Place un écouteur
     * @param {string} event
     * @param {function} cb
     */
    on(event, cb) {
        this[_eventEmitter].on(event, cb);
    }
    /**
     * Mets en pause la queue
     * @public
     */
    pause() {
        this[_pause] = true;
        this[_eventEmitter].emit(_event.queue.paused);
    }

    /**
     * Stopper la queue et efface ses job
     * @public
     */
    stop() {
        this[_task] = 0;
        this[_threadQtyBusy] = 0;
        this[_taskStorage] = [];
        this[_eventEmitter].emit(_event.queue.stopped);
    }

    /**
     * Relance la queue si precedement en pause
     * @public
     */
    resume() {
        this[_pause] = false;
        this[_threadsManager]();
        this[_eventEmitter].emit(_event.queue.resumed);
    }

    /**
     * Donne un objet d'event de la classe
     * @returns {{queue: {finished: string, paused: string, resumed: string, stopped: string}, task: {added: string, exec: string, finished: string}}}
     * @constructor
     * @public
     */
    static get EVENT(){
        return _event;
    }
};
