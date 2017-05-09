var Config = {
    maxSpawn: 10,
    respawn: 60000,
    me: {
        img: {
            stop: "imgs/stop.jpg",
            walk: "imgs/run.gif",
            shot: "imgs/cocco.png"
        },
        speed: 300,
        shotSpeed: 300,
        shotManaCost: 3,
        minDamage: 20,
        maxDamage: 100,
        minRange: 0,
        maxRange: 600,
        healManaCost: 10,
        minHeal: 30,
        maxHeal: 80,
        health: 100,
        mana: 100,
        healthRegen: 5,
        manaRegen: 10,
        itemWidth: 100,
        itemHeight: 100
    },
    mobs: {
        img: {
            stop: "imgs/donkey-stop.png",
            walk: "imgs/donkey.gif",
            shot: "imgs/banana.png"
        },
        speed: 100,
        shotSpeed: 300,
        shotManaCost: 3,
        minDamage: 2,
        maxDamage: 10,
        minRange: 0,
        maxRange: 600,
        healManaCost: 10,
        minHeal: 30,
        maxHeal: 80,
        health: 100,
        mana: 100,
        healthRegen: 5,
        manaRegen: 10,
        timeout: 3000,
        itemWidth: 100,
        itemHeight: 100
    }
};

var Game = function () {

    var self = this;
    var me = {};
    var mobs = {};
    var objs = {};
    var toasts = {};
    var KEYS = {
        FIRE: 49,
        HEAL: 50,
        TARGET: 9
    };

    var notify = function (message) {
        var id = "toast_" + $.now();
        if (toasts[id])
            return;
        var toast = $("<div/>");
        toast.html(message);
        toast.addClass("notification");
        toast.attr("id", id);
        toast.prependTo("body");
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

        var e = $("<div/>");
        e.attr("id", o.id);
        e.css({
            width: self.options[type].itemWidth,
            height: self.options[type].itemHeight,
            position: "absolute",
            boxSizing: "border-box",
            top: randomInt(0, $(window).height()),
            left: randomInt(0, $(window).height())
        });

        e.append($i);
        e.append(health);
        e.append(mana);
        stage.append(e);

        return e;
    };

    var createMana = function (o) {
        var type = (o.id === "me") ? "me" : "mobs";

        var mana = createObject(o, type);
        mana.attr('val', 50);
        mana.find('img').css('width', '50px').css('height', '50px');
        return mana;
    };

    var createPlayer = function (o) {
        var type = (o.id === "me") ? "me" : "mobs";

        var player = createObject(o, type);

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

        player.setTarget = function (target) {
            $(".player").removeClass("selected");
            me.target = target;
            target.addClass("selected");
        };

        player.shot = function (target) {
            _shot(player, target);
        };
        player.heal = function () {
            _heal(player, player.target);
        };
        player.on("click", function (e) {
            e.stopPropagation();
            me.setTarget($(this));
        });
        player.setMana = function (val) {
            var mana = player.find(".manabar").progressbar("value");
            mana += val;
            if (mana > player.find(".manabar").progressbar("option", "max"))
                mana = player.find(".manabar").progressbar("option", "max");

            player.find(".manabar").progressbar("value", mana);
        };
        player.setHealth = function (val) {
            var health = player.find(".healthbar").progressbar("value");
            health += val;
            if (health > player.find(".healthbar").progressbar("option", "max"))
                health = player.find(".healthbar").progressbar("option", "max");

            player.find(".manabar").progressbar("value", health);
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
                var hBar = player.find(".healthbar");
                var mBar = player.find(".manabar");
                var health = hBar.progressbar("value");
                var mana = mBar.progressbar("value");

                health += player.healthRegen;
                if (health > hBar.progressbar("option", "max"))
                    health = hBar.progressbar("option", "max");

                mana += player.manaRegen;
                if (mana > mBar.progressbar("option", "max"))
                    mana = mBar.progressbar("option", "max");

                hBar.progressbar("value", health);
                mBar.progressbar("value", mana);


            }, 2000);
            if (type !== "me") {
                var mob = player;
                mob.tick = setInterval(function () {
                    mob.stop();
                    var myPos = me.position();
                    var playerPos = mob.position();
                    var distance = getDistance(playerPos, myPos);
                    var dest = myPos;
                    if (distance >= mob.minRange && distance <= mob.maxRange) {
                        mob.shot(me);
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
                            mob.find("img").attr("src", self.options.mobs.img.walk);
                        },
                        always: function () {
                            mob.find("img").attr("src", self.options.mobs.img.stop);
                        }
                    });
                    mob.shot(me);
                }, mob.timeout);
            }
            return player;
        };
        return player;
    };

    var shot = $("#shot");
    shot.css({
        position: "absolute",
        backgroundColor: "#ccc",
        width: 20,
        height: 20,
        display: "none"
    });
    shot.addClass("ui-corner-all");

    var stage = $("#stage");
    stage.height($(window).height());

    var spawn = function (options) {
        if (Object.keys(mobs).length >= self.options.maxSpawn)
            return;
        var id = "enemy_" + $.now();
        mobs[id] = createPlayer({
            id: id,
            img: options.img
        });
        if (options)
            mobs[id] = $.extend(true, mobs[id], options);
        return mobs[id];
    };

    var manaSpawn = function (options) {
        if (Object.keys(objs).length >= self.options.maxSpawn)
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

    var tabIndex = 0;

    $(document).on("keyup", function (e) {
        var k = parseInt(e.keyCode || e.which);
        //switch (String.fromCharCode(k)) {
        switch (k) {
            case KEYS.TARGET:
                var keys = Object.keys(mobs);
                if (keys.length === 0)
                    return;
                if (tabIndex >= keys.length)
                    tabIndex = 0;
                var mob = keys[tabIndex];
                me.setTarget(mobs[mob]);
                tabIndex++;
                break;

            case KEYS.FIRE:
                if (me.target && me.target.attr("id") === me.attr("id"))
                    return;
                me.shot(me.target);
                break;

            case KEYS.HEAL:
                //if (me.target && me.target.attr("id") !== me.attr("id")) return;
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
                for (var i in objs) {
                    if (overlaps(me, objs[i])) {
                        console.log('mana', objs[i].attr('val'));
                        me.setMana(objs[i].attr('val'));
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

    var _heal = function (healer, target) {
        var health = target.find(".healthbar").progressbar("value");
        var mana = healer.find(".manabar").progressbar("value");
        var heal = calculateHeal(healer);
        health += heal;
        if (health > target.find(".healthbar").progressbar("option", "max"))
            health = target.find(".healthbar").progressbar("option", "max");

        mana -= healer.healManaCost;
        if (mana > healer.find(".manabar").progressbar("option", "max"))
            mana = healer.find(".manabar").progressbar("option", "max");

        target.find(".healthbar").progressbar("value", health);
        healer.find(".manabar").progressbar("value", mana);

    };

    var _shot = function (shooter, target) {
        if (!target) {
            notify("No one target");
            return;
        }

        var manaCost = shooter.shotManaCost;
        var minDamage = shooter.minDamage;
        var maxDamage = shooter.maxDamage;

        var myPos = shooter.position();
        myPos.top += parseInt(shooter.height() / 2);
        myPos.left += parseInt(shooter.width() / 2);

        var toPos = target.position();
        toPos.top += parseInt(target.height() / 2);
        toPos.left += parseInt(target.width() / 2);

        var distance = getDistance(myPos, toPos);
        if (distance > shooter.maxRange) {
            if (shooter === me)
                notify("Too far away");
            return;
        }
        if (distance < shooter.mimRange) {
            if (shooter === me)
                notify("Too close");
            return;
        }
        var tn = getTimeNeeded(myPos, toPos, {speed: shooter.shotSpeed});
        var mana = shooter.find(".manabar").progressbar("value");
        mana -= manaCost;
        if (mana < 0) {
            notify("not enough mana");
            return;
        }
        shooter.find(".manabar").progressbar("value", mana);
        var myShot = shot.clone();

        var img = $("<img/>");
        img.addClass("shot");
        img.attr("src", shooter.attr("id") === "me" ? self.options.me.img.shot : self.options.mobs.img.shot);
        myShot.append(img);

        myShot.min = minDamage;
        myShot.max = maxDamage;
        myShot.cost = manaCost;
        myShot.shooter = shooter;
        myShot.target = target;
        stage.append(myShot);
        myShot.css(myPos);
        myShot.show();
        myShot.hits = function () {
            if (myShot.target.dead)
                return false;
            if (myShot.shooter === me) {
                for (var mId in mobs) {
                    if (overlaps(myShot, mobs[mId])) {
                        return mobs[mId];
                    }
                }
            }
            return overlaps(myShot, myShot.target);
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
                if (hitted && hitted !== true)
                    target = hitted;
                if (hitted && !target.dead) {
                    myShot.stop();
                    options.always();
                    try {
                        var health = target.find(".healthbar").progressbar("value");
                        var damage = calculateDamage(myShot, target);
                        health -= damage;
                        target.find(".healthbar").progressbar("value", health);
                        var damages = $("<span>" + damage + "</span>");
                        damages.addClass("damage");
                        damages.css({
                            left: target.position().left,
                            top: target.position().top,
                        });
                        stage.append(damages);
                        damages.animate({
                            opacity: 0,
                            fontSize: "500%",
                            done: function () {
                                damages.remove();
                            }
                        }, {duration: 1500});

                        if (health <= 0) {
                            health = 0;
                            var id = target.attr("id");
                            target.fadeOut(function () {
                                if (id === "me") {
                                    alert("You loose");
                                    window.location.reload(-1);
                                }
                                target.remove();
                                delete mobs[id];
                            });
                            if (mobs[id] && !mobs[id].dead) {
                                mobs[id].kill();
                                me.score += 1;
                                $("#score").text(me.score);
                            }
                        }
                    } catch (e) {
                    }
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
            spawn(self.options.mobs).start();
        }, this.options.respawn);
        spawn(this.options.mobs).start();

        this.manaSpawn = manaSpawn;
        setInterval(function () {
            manaSpawn(self.options.mana);
        }, this.options.mana.respawn);
        manaSpawn(this.options.mana);


    };
};
