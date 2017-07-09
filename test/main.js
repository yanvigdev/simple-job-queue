const should = require('should');

let SimpleJobQueue = require('../simple-job-queue');


describe('SimpleJobQueue', function () {
    describe('si ça n\'est pas une function qui est passé à addTask', function () {
        it('retourne une erreur "it\'s not a function"', function () {
            (function () {
                let jobQueue = new SimpleJobQueue();
                jobQueue.addJob('test');
            }).should.throw('it\'s not a function');
        });
    });
    describe('test l\'enchainement des task', function () {
        it('apres trois task le valeur s\'est correctement itérée', function (done) {
            let value = 0,
                jobQueue = new SimpleJobQueue();
            jobQueue.addJob(function (nextJob) {
                value++;
                nextJob();
            }, 5);
            jobQueue.addJob(function (nextJob) {
                value++;
                nextJob();
            }, 4);
            jobQueue.addJob(function (nextJob) {
                value.should.be.eql(2);
                nextJob();
                done();
            }, 2);


        });
    });
    describe('test l\'ordre d\'execution des taches avec des traitement en parallèle', function () {
        it('chaque tache ajout une lettre à la chaine de caractère en respectant une ordre particulier', function (done) {
            let jobQueue = new SimpleJobQueue();
            let abc = '';
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    abc = abc + 'd';
                    nextJob();
                }, 400);

            }, 3);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    abc = abc + 'a';
                    nextJob();
                }, 100);

            }, 2);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    abc = abc + 'b';
                    nextJob();
                }, 100);

            }, 1);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    abc = abc + 'c';
                    nextJob();
                }, 200);

            }, 1);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    abc = abc + 'f';
                    should(abc).be.equal('abcdef');
                    nextJob();
                    done();
                }, 300);

            }, 2);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    abc = abc + 'e';
                    nextJob();
                }, 200);

            }, 2);

        });
    });
    describe('test les events', function () {
        it('emet une event queue.finished et task.finished', function (done) {
            let value = 0,
                jobQueue = new SimpleJobQueue();
            jobQueue.on(SimpleJobQueue.EVENT.queue.finished, function () {
                //console.log('value',value)
                value.should.be.eql(3);
                done();
            });
            jobQueue.on(SimpleJobQueue.EVENT.task.finished, function () {

                value++;
            });

            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    //console.log('task1')
                    nextJob();
                }, 400);

            }, 3);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    //console.log('task2')
                    nextJob();
                }, 400);
            }, 3);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    //console.log('task3')
                    nextJob();
                }, 400);
            }, 3);


        });
    });
    describe('test de la fonction pause', function () {
        it('emet une event queue.paused et stop bien la file d\'attente', function (done) {
            let value = 0,
                jobQueue = new SimpleJobQueue();
            jobQueue.on(SimpleJobQueue.EVENT.queue.paused, function () {
                //console.log('value',value)
                value.should.be.eql(2);
                done();
            });
            jobQueue.on(SimpleJobQueue.EVENT.task.finished, function () {

                value++;
            });

            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    //console.log('task1')
                    nextJob();
                }, 10);

            }, 3);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    //console.log('task2')
                    nextJob();
                    jobQueue.pause();
                }, 10);
            }, 3);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    //console.log('task3')
                    nextJob();
                }, 10);
            }, 3);


        });
    });
    describe('test de la fonction stop', function () {
        it('emet une event queue.stopped et stop bien la file d\'attente', function (done) {
            let value = 0,
                jobQueue = new SimpleJobQueue();
            jobQueue.on(SimpleJobQueue.EVENT.queue.stopped, function () {
                //console.log('value',value)
                value.should.be.eql(2);
                done();
            });
            jobQueue.on(SimpleJobQueue.EVENT.task.finished, function () {

                value++;
            });

            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    //console.log('task1')
                    nextJob();
                }, 10);

            }, 3);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    //console.log('task2')
                    nextJob();
                    jobQueue.stop();
                }, 10);
            }, 3);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    //console.log('task3')
                    nextJob();
                }, 10);
            }, 3);


        });
    });

    describe('test de la fonction resumed', function () {
        it('emet une event queue.resumed et stop bien la file d\'attente', function (done) {
            let value = 0,
                jobQueue = new SimpleJobQueue();
            jobQueue.on(SimpleJobQueue.EVENT.queue.paused, function () {
                //console.log('value',value)
                value.should.be.eql(1);
            });
            jobQueue.on(SimpleJobQueue.EVENT.queue.finished, function () {
                //console.log('value',value)
                value.should.be.eql(4);
                done();
            });
            jobQueue.on(SimpleJobQueue.EVENT.queue.resumed, function () {
                //console.log('value',value)
                value.should.be.eql(2);
                value++;
            });
            jobQueue.on(SimpleJobQueue.EVENT.task.finished, function () {

                value++;
            });

            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    //console.log('task1')
                    nextJob();
                }, 10);

            }, 3);
            jobQueue.addJob(function (nextJob) {
                jobQueue.pause();
                setTimeout(function () {
                    //console.log('task2')
                    nextJob();
                    jobQueue.resume();
                }, 100);
            }, 3);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    //console.log('task3')
                    nextJob();
                }, 10);
            }, 3);


        });
    });


    describe('test la fonction isBusy', function () {
        it('isBusy retour le bon etat de la fil d\'attente', function (done) {
            let jobQueue = new SimpleJobQueue();
            should(jobQueue.isBusy()).be.equal(false);
            jobQueue.on(SimpleJobQueue.EVENT.queue.finished, function () {
                //console.log('value',value)

                done();
            });

            jobQueue.addJob(function (nextJob) {
                should(jobQueue.isBusy()).be.equal(true);
                setTimeout(function () {
                    //console.log('task1')
                    nextJob();
                }, 10);

            }, 3);
            jobQueue.addJob(function (nextJob) {
                should(jobQueue.isBusy()).be.equal(true);
                jobQueue.pause();
                setTimeout(function () {
                    //console.log('task2')
                    nextJob();
                    should(jobQueue.isBusy()).be.equal(false);
                    jobQueue.resume();
                    should(jobQueue.isBusy()).be.equal(true);
                }, 100);
            }, 3);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    should(jobQueue.isBusy()).be.equal(true);
                    //console.log('task3')
                    nextJob();
                }, 10);
            }, 3);


        });
    });

    describe('test la fonction getTasks', function () {
        it('getTasks retour les jobs de la fil d\'attente', function (done) {
            let jobQueue = new SimpleJobQueue();

            jobQueue.on(SimpleJobQueue.EVENT.queue.finished, function () {
                //console.log('value',value)

                done();
            });

            jobQueue.addJob(function (nextJob) {
                should(jobQueue.isBusy()).be.equal(true);
                setTimeout(function () {
                    //console.log('task1')
                    nextJob();
                }, 10);

            }, 3);
            jobQueue.addJob(function (nextJob) {
                should(jobQueue.isBusy()).be.equal(true);
                jobQueue.pause();
                setTimeout(function () {
                    //console.log('task2')
                    nextJob();
                    should(jobQueue.isBusy()).be.equal(false);
                    jobQueue.resume();
                    should(jobQueue.isBusy()).be.equal(true);
                }, 100);
            }, 3);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    should(jobQueue.isBusy()).be.equal(true);
                    //console.log('task3')
                    nextJob();
                }, 10);
            }, 3);


        });
    });

    describe('test l\'ordre d\'excution de la file d\'attente', function () {
        it('l\'ordre d\'excution est respecté', function (done) {
            let value = '',
                jobQueue = new SimpleJobQueue();
            jobQueue.on(SimpleJobQueue.EVENT.queue.finished, function () {
                done();
            });
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    value = value + 'a';
                    should(value).be.equal('a');
                    nextJob();
                }, 100);
            }, 3);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    value = value + 'c';
                    should(value).be.equal('abc');
                    nextJob();
                }, 100);
            }, 3);
            jobQueue.addJob(function (nextJob) {
                setTimeout(function () {
                    value = value + 'b';
                    should(value).be.equal('ab');
                    nextJob();
                }, 100);
            }, 1);


        });
    });
});