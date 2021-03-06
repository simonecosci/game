var Config = {
    respawn: 5000,
    cheats: true,
    shotCD: 200,
    healCD: 200,
    me: {
        img: {
            stop: "imgs/dami.gif",
            walk: "imgs/dami.gif",
            shot: "imgs/speedy-bullet-th.png"
        },
        speed: 300,
        shotSpeed: 400,
        shotManaCost: 3,
        minDamage: 10,
        maxDamage: 200,
        minRange: 0,
        maxRange: 600,
        healManaCost: 20,
        minHeal: 30,
        maxHeal: 800,
        health: 1000,
        mana: 100,
        healthRegen: 50,
        manaRegen: 5,
        itemWidth: 100,
        itemHeight: 100,
        immortal: true,
        endlessmana: true
    },
    mana: {
        itemWidth: 50,
        itemHeight: 50,
        img: {
            stop: "imgs/magic_triangle_flask-256.png"
        },
        respawn: 20000,
        value: 50
    },
    health: {
        itemWidth: 50,
        itemHeight: 50,
        img: {
            stop: "imgs/magic_square_flask-256.png"
        },
        respawn: 20000,
        value: 50
    },
    team: {
        maxSpawn: 1,
        img: {
            stop: "imgs/dami.gif",
            walk: "imgs/dami.gif",
            shot: "imgs/speedy-bullet-th.png"
        },
        speed: 200,
        shotSpeed: 400,
        shotManaCost: 10,
        minDamage: 20,
        maxDamage: 120,
        minRange: 0,
        maxRange: 300,
        healManaCost: 10,
        minHeal: 30,
        maxHeal: 80,
        health: 1000,
        mana: 100,
        timeout: 1000,
        healthRegen: 5,
        manaRegen: 10,
        itemWidth: 100,
        itemHeight: 100,
        immortal: false,
        endlessmana: false
    },
    mobs: {
        maxSpawn: 2,
        img: {
            stop: "imgs/boss1.gif",
            walk: "imgs/boss1.gif",
            shot: "imgs/banana.png"
        },
        speed: 200,
        shotSpeed: 200,
        shotManaCost: 10,
        minDamage: 20,
        maxDamage: 120,
        minRange: 0,
        maxRange: 600,
        healManaCost: 10,
        minHeal: 30,
        maxHeal: 80,
        health: 1000,
        mana: 100,
        timeout: 1000,
        healthRegen: 5,
        manaRegen: 10,
        itemWidth: 150,
        itemHeight: 150,
        immortal: false,
        endlessmana: false
    }
};

var Game = function () {

    var self = this;
    var me = {};
    var mobs = {};
    var team = {};
    var objs = {};
    var toasts = {};
    var KEYS = {
        FIRE: 49,
        HEAL: 50,
        TARGET: 9
    };

    var notify = function (obj, message) {
        var id = "toast_" + $.now();
        if (toasts[id])
            return;
        var toast = $("<div/>");
        toast.html(message);

        if (obj !== null) {
            toast.addClass("notificationInside");
            toast.prependTo(obj);
        } else {
            toast.addClass("notificationBottom");
            toast.prependTo("body");
        }
        toast.attr("id", id);

        toasts[id] = toast;
        toast.fadeIn("fast", function () {
            setTimeout(function () {
                $("#" + id).fadeOut("slow", function () {
                    $("#" + id).remove();
                    delete toasts[id];
                });
            }, 2000);
        });
    };

    var overlaps = (function () {
        function getPositions(elem) {
            var pos, width, height;
            pos = $(elem).position();
            width = $(elem).width();
            height = $(elem).height();
            return [[pos.left, pos.left + width], [pos.top, pos.top + height]];
        }

        function comparePositions(p1, p2) {
            var r1, r2;
            r1 = p1[0] < p2[0] ? p1 : p2;
            r2 = p1[0] < p2[0] ? p2 : p1;
            return r1[1] > r2[0] || r1[0] === r2[0];
        }

        return function (a, b) {
            var pos1 = getPositions(a),
                    pos2 = getPositions(b);
            return comparePositions(pos1[0], pos2[0]) && comparePositions(pos1[1], pos2[1]);
        };
    })();

    var getTimeNeeded = function (p1, p2, obj) {
        var speed = obj.speed;
        var distance = getDistance(p1, p2);
        return distance / speed * 1000;
    };

    var getDistance = function (p1, p2) {
        var a = p1.left - p2.left;
        var b = p1.top - p2.top;
        var d = parseInt(Math.abs(Math.sqrt(a * a + b * b)));
        return d;
    };

    var calculateDamage = function (myShot, target) {
        var d = randomInt(myShot.min, myShot.max);
        return d;
    };

    var calculateHeal = function (healer) {
        var d = randomInt(healer.minHeal, healer.maxHeal);
        return d;
    };

    var randomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    var inRange = function (p1, p2, min, max) {
        var distance = getDistance(p1, p2);
        if (distance > max) {
            return false;
        }
        if (distance < min) {
            return false;
        }
        return true;
    };

    var createObject = function (o, type) {
        var $i = $("<img/>");
        $i.attr("src", o.img.stop);
        $i.css({
            width: self.options[type].itemWidth,
            height: self.options[type].itemHeight
        });
        $i.on('dragstart', function (event) {
            event.preventDefault();
        });

        var health = $("<div/>");
        health.css({
            height: "10px"
        });
        health.addClass("healthbar");

        var mana = $("<div/>");
        mana.css({
            height: "10px"
        });
        mana.addClass("manabar");

        var $e = $("<div/>");
        $e.attr("id", o.id);
        $e.css({
            width: self.options[type].itemWidth,
            height: self.options[type].itemHeight,
            position: "absolute",
            boxSizing: "border-box",
            top: randomInt(0, $(window).height()),
            left: randomInt(0, $(window).height())
        });

        var $t = $('<span/>');
        $t.addClass('cdtext');

        $e.append($i);
        $e.append($t);
        $e.append(health);
        $e.append(mana);
        stage.append($e);

        return $e;
    };

    var attachDespawn = function (obj, time) {
        obj.attr('despawntime', time);
        obj.despanwn = setInterval(function () {
            if (parseInt(obj.attr('despawntime')) < 1000) {
                clearInterval(obj.despanwn);
                obj.remove();
                delete objs[obj.id];
                return;
            }
            obj.attr('despawntime', parseInt(obj.attr('despawntime')) - 1000);
            obj.find('span').html(parseInt(parseInt(obj.attr('despawntime')) / 1000)).css('color', '#fff');
        }, 1000);
    };

    var createMana = function (o) {
        var mana = createObject(o, "mana");
        mana.attr('val', 50).addClass('consumable');
        attachDespawn(mana, 5000);
        return mana;
    };
    var createHealth = function (o) {
        var health = createObject(o, "health");
        health.attr('val', 50).addClass('consumable');
        attachDespawn(health, 5000);
        return health;
    };

    var createPlayer = function (o) {
        var type;
        if (o.id === "me")
            type = "me";
        if (o.id.indexOf("mobs") === 0)
            type = "mobs";
        if (o.id.indexOf("team") === 0)
            type = "team";

        var player = createObject(o, type);
        if (player.attr(type, true))
            ;

        var h = self.options[type].health;
        var m = self.options[type].mana;

        player.addClass("player");
        player.find(".healthbar").progressbar({
            max: h,
            value: h,
            classes: {
                "ui-progressbar": "health"
            }
        });
        player.find(".manabar").progressbar({
            max: m,
            value: m,
            classes: {
                "ui-progressbar": "mana"
            }
        });
        player.getClosest = function (what) {
            var closest = null;
            for (var i in what) {
                what[i].distanceFrom = getDistance(player.position(), what[i].position());
                if (closest === null || closest.distanceFrom > what[i].distanceFrom) {
                    closest = what[i];
                }
            }
            return closest;
        };
        player.setTarget = function (target) {
            player.target = target;
            if (player.is("[me]")) {
                $(".player").removeClass("selected");
                target.addClass("selected");
            }
        };
        player.cooldowns = {
            shot: $.now(),
            heal: $.now()
        };
        player.shot = function () {
            var t = $.now();
            if (player.cooldowns.shot + self.options.shotCD < t) {
                _shot(player);
                player.cooldowns.shot = t;
            }
        };
        player.heal = function () {
            var t = $.now();
            if (player.cooldowns.heal + self.options.healCD < t) {
                _heal(player);
                player.cooldowns.heal = t;
            }
        };
        player.on("click", function (e) {
            e.stopPropagation();
            me.setTarget($(this).data("player"));
        });
        player.setMana = function (mana) {
            if (mana > player.find(".manabar").progressbar("option", "max"))
                mana = player.find(".manabar").progressbar("option", "max");
            player.find(".manabar").progressbar("value", mana);
        };
        player.getMana = function () {
            return player.find(".manabar").progressbar("value");
        };
        player.setHealth = function (health) {
            if (health > player.find(".healthbar").progressbar("option", "max"))
                health = player.find(".healthbar").progressbar("option", "max");

            player.find(".healthbar").progressbar("value", health);
        };
        player.getHealth = function () {
            return player.find(".healthbar").progressbar("value");
        };
        player.kill = function () {
            player.dead = true;
            clearInterval(player.regeneration);
            player.regeneration = null;
            if (player.tick) {
                clearInterval(player.tick);
                player.tick = null;
            }
        };

        player.regeneration = null;
        player.start = function () {
            player.regeneration = setInterval(function () {

                if (player.dead) {
                    clearInterval(player.regeneration);
                    player.regeneration = null;
                    return;
                }
                var health = player.getHealth() + player.healthRegen;
                var mana = player.getMana() + player.manaRegen;

                player.setHealth(health);
                player.setMana(mana);

            }, 2000);

            if (!player.is("[me]")) {
                var mob = player;
                mob.tick = setInterval(function () {

                    try {

                        mob.stop();

                        // divide mana and health
                        // mobs and team can use it
                        var items = {
                            mana: {},
                            health: {}
                        };

                        var playerPos = mob.position();

                        for (var i in objs) {
                            var objId = objs[i].attr("id");
                            if (objId.indexOf("mana") === 0) {
                                items.mana[objId] = objs[i];
                            }
                            if (objId.indexOf("health") === 0) {
                                items.health[objId] = objs[i];
                            }
                            if (overlaps(mob, objs[i])) {
                                if (objId.indexOf("mana") === 0) {
                                    mob.setMana(mob.getMana() + objs[i].attr('val'));
                                }
                                if (objId.indexOf("health") === 0) {
                                    mob.setHealth(mob.getHealth() + objs[i].attr('val'));
                                }
                                objs[i].remove();
                                delete objs[i];
                            }
                        }

                        // se la salute va sotto il 30% prova a curarsi
                        // ma se la mana non basta cerca la piu vicina pozza di salute
                        // e se nemmeno questa c'e' prova a cercarne una di mana se questa e' sotto il 30%
                        if (mob.getHealth() < self.options[type].health / 3) {

                            if (mob.getMana() >= self.options[type].healManaCost) {
                                var currentTarget = mob.target;
                                mob.setTarget(mob);
                                mob.heal();
                                mob.setTarget(currentTarget);
                                return;
                            }

                            var dest = mob.getClosest(items.health);
                            if (dest) {
                                var duration = getTimeNeeded(playerPos, dest, mob);
                                mob.animate(dest, {
                                    duration: duration,
                                    queue: false,
                                    easing: "linear",
                                    start: function () {
                                        mob.find("img").attr("src", self.options[type].img.walk);
                                    },
                                    always: function () {
                                        mob.find("img").attr("src", self.options[type].img.stop);
                                    }
                                });
                                return;
                            }
                        }

                        if (mob.getMana() < self.options[type].mana / 3) {
                            var dest = mob.getClosest(items.mana);
                            if (dest) {
                                var duration = getTimeNeeded(playerPos, dest, mob);
                                mob.animate(dest, {
                                    duration: duration,
                                    queue: false,
                                    easing: "linear",
                                    start: function () {
                                        mob.find("img").attr("src", self.options[type].img.walk);
                                    },
                                    always: function () {
                                        mob.find("img").attr("src", self.options[type].img.stop);
                                    }
                                });
                            }
                            return;
                        }

                        // se non ha target prova a cercare il piu' vicino
                        if (!mob.target) {

                            if (mob.is("[mobs]")) {
                                if (randomInt(0, 1) === 0 && Object.keys(team).length > 0) {
                                    var closest = mob.getClosest(team);
                                    mob.setTarget(closest);
                                } else {
                                    //todo: rimuove il target da se stesso ogni volta che spawna un mob
                                    mob.setTarget(me);
                                }
                            }
                            if (mob.is("[team]")) {
                                if (Object.keys(mobs).length > 0) {
                                    var closest = mob.getClosest(mobs);
                                    mob.setTarget(closest);
                                }
                            }
                        }
                        var myPos = mob.target.position();
                        var distance = getDistance(playerPos, myPos);
                        var dest = myPos;
                        if (distance >= mob.minRange && distance <= mob.maxRange) {
                            mob.shot();
                            return;
                        }
                        if (distance <= mob.minRange) {
                            if (dest.left > mob.left) {
                                dest.left = 0;
                            }
                            if (dest.left < mob.left) {
                                dest.left = $(window).whith();
                            }
                            if (dest.top > mob.top) {
                                dest.top = 0;
                            }
                            if (dest.top < mob.top) {
                                dest.top = $(window).height();
                            }
                        }
                        var duration = getTimeNeeded(playerPos, dest, mob);
                        mob.animate(dest, {
                            duration: duration,
                            queue: false,
                            easing: "linear",
                            start: function () {
                                mob.find("img").attr("src", self.options[type].img.walk);
                            },
                            always: function () {
                                mob.find("img").attr("src", self.options[type].img.stop);
                            }
                        });
                        mob.shot();

                    } catch (e) {
                        console.log(e);
                    }


                }, mob.timeout);
            }
            return player;
        };
        player.data("player", player);
        return player;
    };

    var shot = $("#shot");
    shot.css({
        position: "absolute",
        width: 20,
        height: 20,
        display: "none"
    });
    shot.addClass("ui-corner-all");

    var stage = $("#stage");
    stage.height($(window).height());

    var spawn = function (options) {
        var id = "mobs_" + $.now();
        mobs[id] = createPlayer({
            id: id,
            img: options.img
        });
        if (options)
            mobs[id] = $.extend(true, mobs[id], options);
        return mobs[id];
    };

    var spawnTeam = function (options) {
        var id = "team_" + $.now();
        team[id] = createPlayer({
            id: id,
            img: options.img
        });
        if (options)
            team[id] = $.extend(true, team[id], options);
        return team[id];
    };

    var manaSpawn = function (options) {
        if (Object.keys(objs).length >= self.options.mana.maxSpawn)
            return;
        var id = "mana_" + $.now();
        objs[id] = createMana({
            id: id,
            img: options.img
        });
        if (options)
            objs[id] = $.extend(true, objs[id], options);
        return objs[id];
    };
    var healthSpawn = function (options) {
        if (Object.keys(objs).length >= self.options.health.maxSpawn)
            return;
        var id = "health_" + $.now();
        objs[id] = createHealth({
            id: id,
            img: options.img
        });
        if (options)
            objs[id] = $.extend(true, objs[id], options);
        return objs[id];
    };

    var tabIndex = 0;

    $(document).on("keydown", function (e) {
        var k = parseInt(e.keyCode || e.which);
        switch (k) {
            case KEYS.TARGET:
                e.preventDefault();
                var keys = Object.keys(mobs);
                if (keys.length === 0)
                    return;

                var closest = me.getClosest(mobs);
                me.setTarget(closest);
                tabIndex++;
                break;

            case KEYS.FIRE:
                e.preventDefault();
                me.shot();
                break;

            case KEYS.HEAL:
                e.preventDefault();
                me.heal();
                break;

            default:

                break;
        }
    });

    stage.on("click", function (e) {
        var pos = $(this).position();
        var oldPos = {
            left: me.position().left + parseInt(me.width() / 2),
            top: me.position().top + parseInt(me.height() / 2)
        };
        var newPos = {
            left: e.pageX - (pos.left + parseInt(me.width() / 2)),
            top: e.pageY - (pos.top + parseInt(me.height() / 2))
        };
        var duration = getTimeNeeded(oldPos, newPos, me);
        me.stop();
        var options = {
            duration: duration,
            easing: "linear",
            queue: false,
            start: function () {
                me.find("img").attr("src", self.options.me.img.walk);
            },
            always: function () {
                me.find("img").attr("src", self.options.me.img.stop);
            },
            step: function () {
                //dodo: dove trovo le armi?
                /*if (inRange(me, me.target, 0, 600)) {
                 console.log('in range');
                 //CAMBIARE COLORE AL BOTTONE
                 } else {
                 console.log('not in range');
                 }*/

                for (var i in objs) {
                    if (overlaps(me, objs[i])) {
                        if (objs[i].attr("id").indexOf("mana") === 0) {
                            me.setMana(me.getMana() + objs[i].attr('val'));
                        }
                        if (objs[i].attr("id").indexOf("health") === 0) {
                            me.setHealth(me.getHealth() + objs[i].attr('val'));
                        }
                        objs[i].remove();
                        delete objs[i];
                    }
                }
            }
        };
        me.animate({
            left: newPos.left,
            top: newPos.top
        }, options);

    });

    var _heal = function (healer) {
        if (!healer.target)
            healer.target = healer;
        if (healer.is("[me]") && healer.target.is("[mobs]"))
            return;
        if (healer.is("[mobs]") && !healer.target.is("[mobs]"))
            return;
        var health = healer.target.getHealth();
        var mana = healer.getMana();
        var heal = calculateHeal(healer);
        health += heal;
        healer.target.setHealth(health);
        mana -= healer.healManaCost;
        healer.setMana(mana);
    };

    var _shot = function (shooter) {
        if (!shooter.target) {
            notify(shooter, "Missing target");
            return;
        }
        if (shooter.is("[me]") && (shooter.target.is("[team]") || shooter.target.is("[me]")))
            return;
        if (shooter.is("[mobs]") && shooter.target.is("[mobs]"))
            return;

        var manaCost = shooter.shotManaCost;
        var minDamage = shooter.minDamage;
        var maxDamage = shooter.maxDamage;

        var myPos = shooter.position();
        myPos.top += parseInt(shooter.height() / 2);
        myPos.left += parseInt(shooter.width() / 2);

        var toPos = shooter.target.position();
        toPos.top += parseInt(shooter.target.height() / 2);
        toPos.left += parseInt(shooter.target.width() / 2);

        var distance = getDistance(myPos, toPos);
        if (distance > shooter.maxRange) {
            if (shooter === me)
                notify(shooter, "Too far away");
            return;
        }
        if (distance < shooter.mimRange) {
            if (shooter === me)
                notify(shooter, "Too close");
            return;
        }
        var tn = getTimeNeeded(myPos, toPos, {speed: shooter.shotSpeed});

        if (!self.options.cheats || (self.options.cheats && !shooter.endlessmana)) {
            var mana = shooter.getMana();
            mana -= manaCost;
            if (mana < 0) {
                notify(shooter, "Not enough mana");
                return;
            }
            shooter.setMana(mana);
        }

        var myShot = shot.clone();

        var img = $("<img/>");
        img.addClass("shot");
        if (shooter.is("[me]"))
            img.attr("src", self.options.me.img.shot);
        if (shooter.is("[mobs]"))
            img.attr("src", self.options.mobs.img.shot);
        if (shooter.is("[team]"))
            img.attr("src", self.options.team.img.shot);

        myShot.append(img);

        myShot.min = minDamage;
        myShot.max = maxDamage;
        myShot.cost = manaCost;
        myShot.shooter = shooter;
        myShot.target = shooter.target;
        myShot.valid = true;
        stage.append(myShot);
        myShot.css(myPos);
        myShot.show();
        myShot.hits = function () {
            if (myShot.shooter === me || myShot.shooter.is("[team]")) {
                for (var i in mobs) {
                    if (overlaps(myShot, mobs[i])) {
                        return mobs[i];
                    }
                }
            }
            if (myShot.shooter.is("[mobs]")) {
                for (var i in team) {
                    if (overlaps(myShot, team[i])) {
                        return team[i];
                    }
                }
                if (overlaps(myShot, me))
                    return me;
            }
            var o = overlaps(myShot, myShot.target);
            if (o)
                return myShot.target;
        };
        var options = {
            duration: tn,
            easing: "linear",
            always: function () {
                myShot.fadeOut("fast", function () {
                    myShot.remove();
                });
            },
            step: function () {
                var hitted = myShot.hits();
                if (!hitted)
                    return;

                myShot.target = hitted;

                if (!hitted.is("[me]"))
                    hitted.setTarget(myShot.shooter);

                if (myShot.target.dead || !myShot.valid) {
                    myShot.shooter.target = null;
                    return;
                }
                myShot.stop();
                myShot.valid = false;
                options.always();
                try {
                    var health = myShot.target.getHealth();
                    var damage = calculateDamage(myShot, myShot.target);
                    if (!self.options.cheats || (self.options.cheats && !myShot.target.immortal)) {
                        health -= damage;
                        myShot.target.setHealth(health);
                    }

                    var dId = "dmg_" + $.now() + "_from_" + myShot.shooter.attr("id") + "_to_" + myShot.target.attr("id");
                    var damages = $("<span id='" + dId + "'>" + damage + "</span>");
                    damages.addClass("damage");
                    damages.css({
                        left: myShot.target.position().left,
                        top: myShot.target.position().top
                    });
                    stage.append(damages);
                    var d = damages.animate({
                        opacity: 0.1,
                        fontSize: "500%"
                    }, {
                        duration: 1500,
                        done: function () {
                            $("#" + dId).remove();
                        }
                    });

                    if (health <= 0) {
                        health = 0;
                        var id = myShot.target.attr("id");
                        myShot.target.fadeOut(function () {
                            if (id === "me") {
                                alert("You loose");
                                window.location.reload(-1);
                            }
                            myShot.shooter.stop();
                            myShot.target.remove();

                        });
                        if (myShot.target.is("[mobs]")) {
                            if (mobs[id] && !mobs[id].dead) {
                                mobs[id].kill();
                                delete mobs[id];
                                me.score += 1;
                                $("#score").text(me.score);
                            }
                        }
                        if (myShot.target.is("[team]")) {
                            if (team[id] && !team[id].dead) {
                                team[id].kill();
                                delete team[id];
                            }
                        }
                    }
                } catch (e) {
                }
            }
        };
        myShot.animate(toPos, options);
    };

    this.start = function (options) {
        this.options = $.extend(true, Config, options || {});
        me = createPlayer({
            id: "me",
            img: this.options.me.img
        });
        if (this.options && this.options.me) {
            me = $.extend(true, me, this.options.me);
        }
        me.score = 0;
        $("#score").text("0").css("display", "inline-block");
        me.start();
        this.player = me;
        this.notify = notify;
        this.spawn = spawn;
        var self = this;
        setInterval(function () {
            if (Object.keys(mobs).length >= self.options.mobs.maxSpawn)
                return;
            spawn(self.options.mobs).start();
        }, this.options.respawn);
        spawn(this.options.mobs).start();

        setInterval(function () {
            if (Object.keys(team).length >= self.options.team.maxSpawn)
                return;
            spawnTeam(self.options.team).start();
        }, this.options.respawn);
        spawnTeam(self.options.team).start();

        this.manaSpawn = manaSpawn;
        setInterval(function () {
            manaSpawn(self.options.mana);
        }, this.options.mana.respawn);
        manaSpawn(this.options.mana);

        this.healthSpawn = healthSpawn;
        setInterval(function () {
            healthSpawn(self.options.health);
        }, this.options.health.respawn);
        healthSpawn(this.options.health);


    };
};