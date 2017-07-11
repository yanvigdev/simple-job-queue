# Simple-job-queue


## Description

Le module simple-job-queue est un gestionnaire de file d'attente (**queue**) d'exécution de fonction (**job**) javascript. Il permet d'affiner l'ordre d’exécution des fonctions afin de contrôler leur dépendance, l’une envers l’autre. Par exemple si entre deux script JS plusieurs de leur fonction (**job**) respectif doivent s’exécuter dans un ordre précis sans être obliger de passé par un lourd système de callback qui rend parfois la lecture du code pénible. 
Grace à un système de thread vous pouvez gérer un niveau parallélisation qui vous permettra d’exécuter des fonctions (**jobs**) non dépendante entre elles en parallèle des autres fonction (**job**) de votre fil d’attente (**queue**).

Veuillez noter que par convention et pour une meilleur compréhension de la documentation suivante :

* Chaque fonction JS ajouter à la file d'attente seront nommés **job**.
* La file d'attente sera nommée **queue**

## Installation

```
npm install simple-job-queue
```

### Si vous voulez l'ajouter à vos dépendances
```
npm install simple-job-queue --save
```

## Utilisation

### Création d'une **queue**

#### Par défaut

```javascript
let SimpleJobQueue = require('../simple-job-queue');
let jobQueue = new SimpleJobQueue();
```

#### Avec une configuration de nombre de thread alloué à la **queue**

*Par défaut le nombre de thread est de 5*

```javascript
let SimpleJobQueue = require('../simple-job-queue');
let jobQueue = new SimpleJobQueue(6);
```

#### Avec une configuration de nombre de thread alloué à la file d'attend et le mode verbose activé

*Par défaut le mode verbose est à false*

```javascript
let SimpleJobQueue = require('../simple-job-queue');
let jobQueue = new SimpleJobQueue(6, true);
```

### Contrôle de la **queue**

#### Mise en  pause de la **queue**

*Elle n'arrête pas un **job** en cour d’exécution mais n'enchainera pas sur la suivante*

```javascript
jobQueue.pause();
```

#### Reprise de la **queue**

*reprend au **job** suivante*

```javascript
jobQueue.resume();
```

#### Arrête de la **queue** et effacement des fonctions qu'elle contient

```javascript
jobQueue.stop();
```

### Evénement sur la **queue**

*Chaque événement est fait partie de la propriété statique EVENT de la classe SimpleJobQueue*

#### Ecouteur sur l’exécution complète de la **queue**

*La **queue** est vide*

```javascript
jobQueue.on(SimpleJobQueue.EVENT.queue.finished, function () {
    // do some thing
});
```
#### Ecouteur sur la mise en pause de la **queue**

```javascript
jobQueue.on(SimpleJobQueue.EVENT.queue.paused, function () {
    // do some thing
});
```
#### Ecouteur sur l'arrêt de la **queue**

```javascript
jobQueue.on(SimpleJobQueue.EVENT.queue.stopped, function () {
    // do some thing
});
```
#### Ecouteur la reprise de la **queue**

```javascript
jobQueue.on(SimpleJobQueue.EVENT.queue.resumed, function () {
    // do some thing
});
```

### Ajout d'un **job** à la **queue** 

*Une fonction de finalisation doit **obligatoirement** être exécutée à la toute fin de votre **job** afin d'informer la **queue** qu'elle peut passer au **job** suivant.*
*Le second argument (optionnel) est le nombre thread qui seront nécessaire pour que ce **job** exécute.*
*Le troisieme argument (optionnel) est le titre du **job**.*


```javascript
jobQueue.addJob(function (nextJob) {
    // do some thing
    nextJob();
}, 3, 'test');

```

## Les theads

Chaque **job** sera exécuté par défaut dans l'ordre de leur ajout à la **queue**. A l'Instanciation d'une queue une quantité de thread lui est passé en configuration par défaut 5.
Chaque **job** a un nombre de thread qui lui sont attribué à sa création. Ce nombre de thead doit toujours être inférieur ou égale à la quantité de thread alloué à la **queue**. Par défaut il lui sera attribué le nombre de thread de la **queue** divisé par 2 et arrondi à l'entier supérieur.

### Exemple de thread par defaut sur un **job**

* Si la queue à 5 threads alors le job en a 3.
* Si la queue à 9 threads alors le job en a 5.
* Si la queue à 4 threads alors le job en a 2.

La **queue** exécutera toujours le ou les **jobs** de sa liste par rapport à sa quantité de thread qui a été alloué. 

### Exemple d’exécution de job

Donc si une **queue** à qui on a alloué 5 threads a 3 **jobs**, le premier de 3 threads le second de 3 threads et le dernier de 1 thread. Le premier job et le dernier seront exécuté en même temps alors que le second ne le sera qu’après que le premier est fini.

```javascript
let value = '',
jobQueue = new SimpleJobQueue();
jobQueue.on(SimpleJobQueue.EVENT.queue.finished, function () {
    console.log(value); //value est égale à abc
});
jobQueue.addJob(function (nextJob) {
    setTimeout(function () {
        value = value + 'a';
        nextJob();
    }, 100);
}, 3);
jobQueue.addJob(function (nextJob) {
    setTimeout(function () {
        value = value + 'c';
        nextJob();
    }, 100);
}, 3);
jobQueue.addJob(function (nextJob) {
    setTimeout(function () {
        value = value + 'b';
        //ici value est égale à "ab"
        nextJob();
    }, 100);
}, 1);
```

## LICENCE

ISC, 2017 Yann Vignolet