
//console test text
console.log("=================================");
console.log("RAINY TOWN DELIVERY JS HAS LOADED");
console.log("=================================");

window.floodTownGame = (() => {

    //game consts
    const GAME_DURATION = 60;

    const TOWN_PLAYER_SPEED = 900;
    const TOWN_PLAYER_ACCELERATION = 600;
    const TOWN_PLAYER_DRAG = 0.95;

    const MAX_BATTERY = 100;
    const ENERGY_CONSUMPTION = 8;

    const DELIVERY_SCORE = 100;

    //rain puddles//
    const PUDDLE_COUNT = 12;

    // Lower number = slower vehicle
    const PUDDLE_SLOW_FACTOR = 0.45;

    const RAIN_COUNT = 120;

    //game state//
    let timeRemaining = GAME_DURATION;
    let gameState = "playing";

    let deliveries = 0;
    let score = 0;

    let teleportMessage = "";
    let teleportMessageTimer = 0;

    //buildings//
    const buildings = [

        // TOP ROW

        {
            x: 40,
            y: 65,
            width: 170,
            height: 100,
            recharge: false
        },

        {
            x: 255,
            y: 65,
            width: 170,
            height: 100,
            recharge: false
        },

        {
            x: 470,
            y: 65,
            width: 170,
            height: 100,
            recharge: false
        },

        {
            x: 685,
            y: 65,
            width: 170,
            height: 100,
            recharge: false
        },

        // BOTTOM ROW

        {
            x: 40,
            y: 300,
            width: 170,
            height: 100,
            recharge: false
        },

        {
            x: 255,
            y: 300,
            width: 170,
            height: 100,
            recharge: false
        },

        {
            x: 470,
            y: 300,
            width: 170,
            height: 100,
            recharge: false
        },

        // RECHARGE BUILDING

        {
            x: 685,
            y: 300,
            width: 170,
            height: 100,
            recharge: true
        }
    ];

    //roads//
    const roads = [

        // Horizontal roads

        {
            x: 0,
            y: 0,
            width: 900,
            height: 40
        },

        {
            x: 0,
            y: 205,
            width: 900,
            height: 60
        },

        {
            x: 0,
            y: 440,
            width: 900,
            height: 60
        },

        // Vertical roads

        {
            x: 0,
            y: 0,
            width: 25,
            height: 500
        },

        {
            x: 210,
            y: 0,
            width: 45,
            height: 500
        },

        {
            x: 425,
            y: 0,
            width: 45,
            height: 500
        },

        {
            x: 640,
            y: 0,
            width: 45,
            height: 500
        },

        {
            x: 855,
            y: 0,
            width: 45,
            height: 500
        }
    ];

    //collision//
    function isTownColliding(a, b) {

        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    //puddles
    const puddles = [];
    //create puddles//
    function generatePuddles() {

        puddles.length = 0;

        let attempts = 0;

        while (
            puddles.length < PUDDLE_COUNT &&
            attempts < 500
        ) {

            attempts++;

            const road =
                roads[
                Math.floor(
                    Math.random() * roads.length
                )
                ];

            const width =
                35 + Math.random() * 35;

            const height =
                15 + Math.random() * 20;

            const x =
                road.x +
                Math.random() *
                Math.max(
                    1,
                    road.width - width
                );

            const y =
                road.y +
                Math.random() *
                Math.max(
                    1,
                    road.height - height
                );

            const puddle = {
                x: x,
                y: y,
                width: width,
                height: height
            };

            // Make sure puddle is not inside a building

            let insideBuilding = false;

            for (const building of buildings) {

                if (
                    isTownColliding(
                        puddle,
                        building
                    )
                ) {

                    insideBuilding = true;
                    break;
                }
            }

            if (insideBuilding) {
                continue;
            }

            // Make sure puddles don't overlap each other too much

            let overlappingPuddle = false;

            for (const existing of puddles) {

                if (
                    isTownColliding(
                        puddle,
                        existing
                    )
                ) {

                    overlappingPuddle = true;
                    break;
                }
            }

            if (overlappingPuddle) {
                continue;
            }

            puddles.push(puddle);
        }
    }

    //check puddle//
    function getPuddlesUnderPlayer() {
        return puddles.filter((puddle) =>
            isTownColliding(townPlayer, puddle)
        );
    }

    function isPlayerInPuddle() {

        for (const puddle of puddles) {

            if (
                isTownColliding(
                    townPlayer,
                    puddle
                )
            ) {

                return true;
            }
        }

        return false;
    }

    //rain particles//
    const rainParticles = [];

    //create rain///
    function createRainParticles() {

        rainParticles.length = 0;

        for (
            let i = 0;
            i < RAIN_COUNT;
            i++
        ) {

            rainParticles.push({

                x:
                    Math.random() * 900,

                y:
                    Math.random() * 500,

                length:
                    8 + Math.random() * 12,

                speed:
                    350 + Math.random() * 300,

                opacity:
                    0.25 + Math.random() * 0.45
            });
        }
    }

    //update rain//
    function updateRain(deltaTime) {

        for (const rain of rainParticles) {

            rain.y +=
                rain.speed *
                deltaTime;

            // Slight diagonal rain movement

            rain.x +=
                30 *
                deltaTime;

            // Reset particle after leaving screen

            if (
                rain.y > 500
            ) {

                rain.y =
                    -rain.length;

                rain.x =
                    Math.random() * 900;
            }

            if (
                rain.x > 900
            ) {

                rain.x = 0;
            }
        }
    }

    //draw rain
    function drawRain(context) {

        context.save();

        context.lineWidth = 1;

        for (const rain of rainParticles) {

            context.strokeStyle =
                `rgba(210, 230, 255, ${rain.opacity})`;

            context.beginPath();

            context.moveTo(
                rain.x,
                rain.y
            );

            context.lineTo(
                rain.x - 3,
                rain.y + rain.length
            );

            context.stroke();
        }

        context.restore();
    }

    //player vehilcle
    class PlayerVehicle {

        constructor(x, y) {

            this.x = x;
            this.y = y;

            this.width = 32;
            this.height = 24;

            this.vx = 0;
            this.vy = 0;

            this.angle = 0;

            this.acceleration =
                TOWN_PLAYER_ACCELERATION;

            this.maxSpeed =
                TOWN_PLAYER_SPEED;

            this.drag =
                TOWN_PLAYER_DRAG;

            this.battery =
                MAX_BATTERY;

            this.maxBattery =
                MAX_BATTERY;

            this.energyConsumption =
                ENERGY_CONSUMPTION;

            this.carryingPackage =
                false;

            //for music and sound effects//
            this.carryingPackage = false;

            this.currentPuddle = null;
        }





        //input
        getInputDirection() {

            let dx = 0;
            let dy = 0;

            // WASD

            if (keys.has("w")) dy -= 1;
            if (keys.has("s")) dy += 1;
            if (keys.has("a")) dx -= 1;
            if (keys.has("d")) dx += 1;

            // Arrow keys

            if (keys.has("arrowup")) dy -= 1;
            if (keys.has("arrowdown")) dy += 1;
            if (keys.has("arrowleft")) dx -= 1;
            if (keys.has("arrowright")) dx += 1;

            // Normalize diagonal movement

            const length =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (length > 0) {

                dx /= length;
                dy /= length;
            }

            return {
                x: dx,
                y: dy
            };
        }

        //update//
        update(deltaTime) {

            const input =
                this.getInputDirection();

            const moving =
                input.x !== 0 ||
                input.y !== 0;

            // Check if vehicle is currently
            // driving through a puddle

            const puddlesUnderPlayer =
                getPuddlesUnderPlayer();
            const inPuddle =
                puddlesUnderPlayer.length > 0;

            if (inPuddle) {
                const stillInSamePuddle =
                    puddlesUnderPlayer.includes(
                        this.currentPuddle
                    );

                if (!stillInSamePuddle) {
                    this.currentPuddle =
                        puddlesUnderPlayer[0];
                    gameAudio.play("splash");
                }
            } else {
                this.currentPuddle = null;
            }

            // Apply puddle slowdown

            const currentAcceleration =
                inPuddle
                    ? this.acceleration *
                    PUDDLE_SLOW_FACTOR
                    : this.acceleration;

            const currentMaxSpeed =
                inPuddle
                    ? this.maxSpeed *
                    PUDDLE_SLOW_FACTOR
                    : this.maxSpeed;

            if (moving) {

                // Direction angle using atan2

                this.angle =
                    Math.atan2(
                        input.y,
                        input.x
                    );

                // Trigonometric movement

                const directionX =
                    Math.cos(this.angle);

                const directionY =
                    Math.sin(this.angle);

                // Acceleration

                this.vx +=
                    directionX *
                    currentAcceleration *
                    deltaTime;

                this.vy +=
                    directionY *
                    currentAcceleration *
                    deltaTime;

                // Limit velocity

                const speed =
                    Math.sqrt(
                        this.vx * this.vx +
                        this.vy * this.vy
                    );

                if (
                    speed >
                    currentMaxSpeed
                ) {

                    const scale =
                        currentMaxSpeed /
                        speed;

                    this.vx *= scale;
                    this.vy *= scale;
                }
            }

            //move
            this.moveWithCollision(
                this.vx * deltaTime,
                this.vy * deltaTime
            );

            //friction
            this.vx *= Math.pow(
                this.drag,
                deltaTime * 60
            );

            this.vy *= Math.pow(
                this.drag,
                deltaTime * 60
            );

            // Additional puddle resistance

            if (inPuddle) {

                this.vx *=
                    Math.pow(
                        0.92,
                        deltaTime * 60
                    );

                this.vy *=
                    Math.pow(
                        0.92,
                        deltaTime * 60
                    );
            }

            //battery
            if (
                moving &&
                this.battery > 0
            ) {

                this.battery -=
                    this.energyConsumption *
                    deltaTime;

                if (
                    this.battery <= 0
                ) {

                    this.battery = 0;

                    teleportMessage =
                        "Battery Reserve empty! Returning to Microgrid...";

                    teleportMessageTimer = 3;

                    this.returnToChargingZone();
                }
            }

            //canvas boundaries//
            this.x = Math.max(
                0,
                Math.min(
                    900 - this.width,
                    this.x
                )
            );

            this.y = Math.max(
                0,
                Math.min(
                    500 - this.height,
                    this.y
                )
            );
        }

        //collision movement//
        moveWithCollision(dx, dy) {

            // Horizontal movement

            const nextX = {

                x: this.x + dx,
                y: this.y,
                width: this.width,
                height: this.height
            };

            if (
                !this.collidesWithBuilding(
                    nextX
                )
            ) {

                this.x += dx;

            } else {

                this.vx = 0;
            }

            // Vertical movement

            const nextY = {

                x: this.x,
                y: this.y + dy,
                width: this.width,
                height: this.height
            };

            if (
                !this.collidesWithBuilding(
                    nextY
                )
            ) {

                this.y += dy;

            } else {

                this.vy = 0;
            }
        }

        //building collision
        collidesWithBuilding(rect) {

            for (
                const building of buildings
            ) {

                if (
                    !isTownColliding(
                        rect,
                        building
                    )
                ) {

                    continue;
                }

                // Recharge building has opening

                if (
                    building.recharge
                ) {

                    const door = {

                        x:
                            building.x +
                            building.width / 2 -
                            25,

                        y:
                            building.y +
                            building.height -
                            10,

                        width: 50,
                        height: 20
                    };

                    // Allow vehicle through door

                    if (
                        isTownColliding(
                            rect,
                            door
                        )
                    ) {

                        continue;
                    }
                }

                return true;
            }

            return false;
        }

        //teleport
        returnToChargingZone() {

            gameAudio.play("battery");

            const zone =
                getRechargeZone();

            this.x =
                zone.x +
                zone.width / 2 -
                this.width / 2;

            this.y =
                zone.y +
                zone.height / 2 -
                this.height / 2;

            this.vx = 0;
            this.vy = 0;

            this.battery =
                this.maxBattery;

            this.angle = 0;

            teleportMessage =
                "Solar Reserve empty! Recharged at the Microgrid.";

            teleportMessageTimer = 3;
        }

        //reset
        reset(x, y) {

            this.x = x;
            this.y = y;

            this.vx = 0;
            this.vy = 0;

            this.angle = 0;

            this.battery =
                this.maxBattery;

            this.carryingPackage =
                false;

            this.currentPuddle = null;
        }

        //draw
        draw(context) {

            context.save();

            context.translate(
                this.x +
                this.width / 2,

                this.y +
                this.height / 2
            );

            context.rotate(
                this.angle
            );

            // Vehicle body

            context.fillStyle =
                this.carryingPackage
                    ? "#e91e63"
                    : "#2196f3";

            context.fillRect(
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );

            // Front indicator

            context.fillStyle =
                "white";

            context.fillRect(
                this.width / 2 - 4,
                -5,
                4,
                10
            );

            context.restore();
        }
    }

    //player
    const townPlayer =
        new PlayerVehicle(
            120,
            220
        );
    //delivery points
    const deliveryPoints = [];

    for (
        const building of buildings
    ) {

        if (
            !building.recharge
        ) {

            deliveryPoints.push({

                x:
                    building.x +
                    building.width / 2 -
                    20,

                y:
                    building.y +
                    building.height +
                    10,

                width: 40,
                height: 25,

                building: building
            });
        }
    }

    //package
    const packageItem = {

        x: 200,
        y: 300,

        width: 18,
        height: 18,

        collected: false,

        destination: null
    };

    //valid spawn place
    function isValidPackagePosition(x, y) {

        const test = {

            x: x,
            y: y,

            width:
                packageItem.width,

            height:
                packageItem.height
        };

        // Cannot spawn inside buildings

        for (
            const building of buildings
        ) {

            if (
                isTownColliding(
                    test,
                    building
                )
            ) {

                return false;
            }
        }

        // Must be on a road

        let onRoad = false;

        for (
            const road of roads
        ) {

            if (
                isTownColliding(
                    test,
                    road
                )
            ) {

                onRoad = true;
                break;
            }
        }

        return onRoad;
    }

    //respawn package//
    function respawnPackage() {

        let attempts = 0;

        while (
            attempts < 100
        ) {

            const road =
                roads[
                Math.floor(
                    Math.random() *
                    roads.length
                )
                ];

            const x =
                road.x +
                Math.random() *
                Math.max(
                    1,
                    road.width -
                    packageItem.width
                );

            const y =
                road.y +
                Math.random() *
                Math.max(
                    1,
                    road.height -
                    packageItem.height
                );

            if (
                isValidPackagePosition(
                    x,
                    y
                )
            ) {

                packageItem.x = x;
                packageItem.y = y;

                packageItem.collected =
                    false;

                packageItem.destination =
                    null;

                return;
            }

            attempts++;
        }

        // Safe fallback

        packageItem.x = 200;
        packageItem.y = 220;

        packageItem.collected =
            false;

        packageItem.destination =
            null;
    }

    //recharge zone//
    function getRechargeZone() {

        const building =
            buildings.find(
                b => b.recharge
            );

        return {

            x:
                building.x +
                building.width / 2 -
                40,

            y:
                building.y +
                building.height +
                5,

            width: 80,
            height: 35
        };
    }

    //package pickup
    function checkPackagePickup() {

        if (
            packageItem.collected
        ) {

            return;
        }

        if (
            isTownColliding(
                townPlayer,
                packageItem
            )
        ) {

            packageItem.collected =
                true;

            townPlayer.carryingPackage =
                true;

            gameAudio.play("pickup");

            const available =
                deliveryPoints.filter(
                    point =>
                        point !==
                        packageItem.destination
                );

            if (
                available.length > 0
            ) {

                packageItem.destination =
                    available[
                    Math.floor(
                        Math.random() *
                        available.length
                    )
                    ];
            }
        }
    }

    //delivery
    function checkDelivery() {

        if (
            !packageItem.collected ||
            !packageItem.destination
        ) {

            return;
        }

        if (
            isTownColliding(
                townPlayer,
                packageItem.destination
            )
        ) {

            deliveries++;

            score +=
                DELIVERY_SCORE;

            gameAudio.play("deliver");

            packageItem.collected =
                false;

            packageItem.destination =
                null;

            townPlayer.carryingPackage =
                false;

            respawnPackage();
        }
    }

    //recharging//
    function checkRecharge(
        deltaTime
    ) {

        const zone =
            getRechargeZone();

        if (
            isTownColliding(
                townPlayer,
                zone
            )
        ) {

            townPlayer.battery =
                Math.min(
                    townPlayer.maxBattery,

                    townPlayer.battery +
                    30 *
                    deltaTime
                );
        }
    }

    //update//
    function update(deltaTime) {

        if (
            gameState !== "playing"
        ) {

            return;
        }

        // Timer

        timeRemaining -=
            deltaTime;

        if (
            timeRemaining <= 0
        ) {

            timeRemaining = 0;

            gameState =
                "timesUp";
            gameAudio.stopAll();
            gameAudio.play("timesUp");

            return;
        }

        // Player

        townPlayer.update(
            deltaTime
        );

        // Rain

        updateRain(
            deltaTime
        );

        // Interactions

        checkPackagePickup();

        checkDelivery();

        checkRecharge(
            deltaTime
        );

        // Message timer

        if (
            teleportMessageTimer > 0
        ) {

            teleportMessageTimer -=
                deltaTime;

            if (
                teleportMessageTimer <= 0
            ) {

                teleportMessage = "";
            }
        }
    }

    //background
    function drawTownBackground(
        context
    ) {

        // Grass

        context.fillStyle =
            "#7fb069";

        context.fillRect(
            0,
            0,
            900,
            500
        );

        // Roads

        context.fillStyle =
            "#555";

        for (
            const road of roads
        ) {

            context.fillRect(
                road.x,
                road.y,
                road.width,
                road.height
            );
        }

        // Road markings

        context.strokeStyle =
            "#d9d9d9";

        context.lineWidth = 2;

        context.setLineDash([
            15,
            15
        ]);

        for (
            const road of roads
        ) {

            if (
                road.width >
                road.height
            ) {

                context.beginPath();

                context.moveTo(
                    road.x,
                    road.y +
                    road.height / 2
                );

                context.lineTo(
                    road.x +
                    road.width,

                    road.y +
                    road.height / 2
                );

                context.stroke();
            }
        }

        context.setLineDash([]);
    }

    //puddles
    function drawPuddles(context) {

        for (
            const puddle of puddles
        ) {

            context.save();

            // Dark blue outer puddle

            context.fillStyle =
                "rgba(45, 85, 120, 0.65)";

            context.beginPath();

            context.ellipse(

                puddle.x +
                puddle.width / 2,

                puddle.y +
                puddle.height / 2,

                puddle.width / 2,

                puddle.height / 2,

                0,
                0,
                Math.PI * 2
            );

            context.fill();

            // Water reflection

            context.strokeStyle =
                "rgba(180, 220, 255, 0.75)";

            context.lineWidth = 2;

            context.beginPath();

            context.moveTo(
                puddle.x + 8,
                puddle.y +
                puddle.height / 2
            );

            context.lineTo(
                puddle.x +
                puddle.width -
                8,

                puddle.y +
                puddle.height / 2
            );

            context.stroke();

            context.restore();
        }
    }

    //buildings
    function drawBuildings(
        context
    ) {

        for (
            const building of buildings
        ) {

            // Building body

            context.fillStyle =
                building.recharge
                    ? "#4a90e2"
                    : "#b87333";

            context.fillRect(
                building.x,
                building.y,
                building.width,
                building.height
            );

            // Roof

            context.fillStyle =
                building.recharge
                    ? "#2768a5"
                    : "#8b4513";

            context.fillRect(
                building.x,
                building.y,
                building.width,
                25
            );

            // Windows

            context.fillStyle =
                "#d9f0ff";

            const windowY =
                building.y + 40;

            for (
                let i = 0;
                i < 3;
                i++
            ) {

                context.fillRect(

                    building.x +
                    20 +
                    i * 50,

                    windowY,

                    30,
                    25
                );
            }

            // Door

            context.fillStyle =
                "#4b2e1f";

            context.fillRect(

                building.x +
                building.width / 2 -
                20,

                building.y +
                building.height -
                45,

                40,
                45
            );

            // Recharge label

            if (
                building.recharge
            ) {

                context.fillStyle =
                    "white";

                context.font =
                    "bold 16px Arial";

                context.textAlign =
                    "center";

                context.fillText(

                    "SOLAR MICROGRID",

                    building.x +
                    building.width / 2,

                    building.y + 20
                );
            }
        }
    }

    //delivery points
    function drawDeliveryPoints(
        context
    ) {

        for (
            const point of deliveryPoints
        ) {

            const isTarget =
                packageItem.collected &&
                packageItem.destination ===
                point;

            if (
                isTarget
            ) {

                const pulse =
                    (
                        Math.sin(
                            performance.now() /
                            150
                        ) + 1
                    ) / 2;

                context.save();

                context.shadowBlur =
                    10 + pulse * 15;

                context.shadowColor =
                    "#fff200";

                context.fillStyle =
                    pulse > 0.5
                        ? "#fff200"
                        : "#ffb300";

                context.fillRect(

                    point.x,
                    point.y,

                    point.width,
                    point.height
                );

                context.restore();

                context.fillStyle =
                    "#222";

                context.font =
                    "bold 12px Arial";

                context.textAlign =
                    "center";

                context.fillText(

                    "DELIVER HERE",

                    point.x +
                    point.width / 2,

                    point.y + 17
                );

            } else {

                context.fillStyle =
                    "#ffd700";

                context.fillRect(

                    point.x,
                    point.y,

                    point.width,
                    point.height
                );

                context.strokeStyle =
                    "#8b6508";

                context.strokeRect(

                    point.x,
                    point.y,

                    point.width,
                    point.height
                );

                context.fillStyle =
                    "#333";

                context.font =
                    "bold 12px Arial";

                context.textAlign =
                    "center";

                context.fillText(

                    "DELIVER",

                    point.x +
                    point.width / 2,

                    point.y + 17
                );
            }
        }
    }

    //psckage
    function drawPackage(
        context
    ) {

        if (
            packageItem.collected
        ) {

            return;
        }

        context.fillStyle =
            "#f4c542";

        context.fillRect(

            packageItem.x,
            packageItem.y,

            packageItem.width,
            packageItem.height
        );

        context.strokeStyle =
            "#7a5c00";

        context.strokeRect(

            packageItem.x,
            packageItem.y,

            packageItem.width,
            packageItem.height
        );
    }

    //player
    function drawTownPlayer(
        context
    ) {

        townPlayer.draw(
            context
        );
    }

    //overlay
    function drawWeatherOverlay(
        context
    ) {

        // Slight bluish tint

        context.fillStyle =
            "rgba(5, 35, 146, 0.33)";

        context.fillRect(
            0,
            0,
            900,
            500
        );
    }

    //spotlight
    function drawWeatherSpotlights(context) {

        // -------------------------------------------------
        // PLAYER SPOTLIGHT
        // -------------------------------------------------

        const playerCenterX =
            townPlayer.x +
            townPlayer.width / 2;

        const playerCenterY =
            townPlayer.y +
            townPlayer.height / 2;

        const playerGradient =
            context.createRadialGradient(
                playerCenterX,
                playerCenterY,
                5,

                playerCenterX,
                playerCenterY,
                75
            );

        playerGradient.addColorStop(
            0,
            "rgba(255, 255, 255, 0.30)"
        );

        playerGradient.addColorStop(
            0.35,
            "rgba(210, 230, 255, 0.16)"
        );

        playerGradient.addColorStop(
            1,
            "rgba(100, 150, 200, 0)"
        );

        context.fillStyle =
            playerGradient;

        context.beginPath();

        context.arc(
            playerCenterX,
            playerCenterY,
            75,
            0,
            Math.PI * 2
        );

        context.fill();


        // -------------------------------------------------
        // PACKAGE SPOTLIGHT
        // -------------------------------------------------

        if (!packageItem.collected) {

            const packageCenterX =
                packageItem.x +
                packageItem.width / 2;

            const packageCenterY =
                packageItem.y +
                packageItem.height / 2;

            const packageGradient =
                context.createRadialGradient(
                    packageCenterX,
                    packageCenterY,
                    2,

                    packageCenterX,
                    packageCenterY,
                    45
                );

            packageGradient.addColorStop(
                0,
                "rgba(255, 245, 180, 0.45)"
            );

            packageGradient.addColorStop(
                0.35,
                "rgba(255, 230, 130, 0.20)"
            );

            packageGradient.addColorStop(
                1,
                "rgba(255, 220, 100, 0)"
            );

            context.fillStyle =
                packageGradient;

            context.beginPath();

            context.arc(
                packageCenterX,
                packageCenterY,
                45,
                0,
                Math.PI * 2
            );

            context.fill();
        }
    }

    //HUD
    function drawHUD(
        context
    ) {

        context.fillStyle =
            "rgba(0, 0, 0, 0.75)";

        context.fillRect(
            10,
            10,
            250,
            75
        );

        context.fillStyle =
            "white";

        context.font =
            "bold 18px Arial";

        context.textAlign =
            "left";

        context.fillText(
            `TIME: ${Math.ceil(timeRemaining)}`,
            20,
            35
        );

        context.fillText(
            `DELIVERIES: ${deliveries}`,
            20,
            58
        );

        context.fillText(
            `SCORE: ${score}`,
            20,
            81
        );

        // Battery

        const batteryX = 280;
        const batteryY = 20;

        const batteryWidth = 180;
        const batteryHeight = 20;

        context.fillStyle =
            "rgba(0, 0, 0, 0.75)";

        context.fillRect(

            batteryX,
            batteryY,

            batteryWidth,
            batteryHeight
        );

        const batteryPercent =
            townPlayer.battery /
            townPlayer.maxBattery;

        context.fillStyle =
            batteryPercent > 0.5
                ? "#4caf50"
                : batteryPercent > 0.2
                    ? "#ffc107"
                    : "#f44336";

        context.fillRect(

            batteryX,
            batteryY,

            batteryWidth *
            batteryPercent,

            batteryHeight
        );

        context.strokeStyle =
            "white";

        context.strokeRect(

            batteryX,
            batteryY,

            batteryWidth,
            batteryHeight
        );

        context.fillStyle =
            "white";

        context.font =
            "bold 14px Arial";

        context.fillText(

            `SOLAR RESERVE: ${Math.ceil(townPlayer.battery)}%`,

            batteryX,

            batteryY + 40
        );

        // Puddle warning

        if (
            isPlayerInPuddle()
        ) {

            context.fillStyle =
                "#9ed8ff";

            context.font =
                "bold 14px Arial";

            context.fillText(
                "WET ROAD - SPEED REDUCED",
                480,
                35
            );
        }
    }

    //teleport message//
    function drawTeleportMessage(
        context
    ) {

        if (
            !teleportMessage
        ) {

            return;
        }

        context.fillStyle =
            "rgba(0, 0, 0, 0.8)";

        context.fillRect(

            250,
            430,

            400,
            45
        );

        context.fillStyle =
            "white";

        context.font =
            "bold 16px Arial";

        context.textAlign =
            "center";

        context.fillText(

            teleportMessage,

            450,
            458
        );
    }

    //time up screen
    function drawTimesUpScreen(
        context
    ) {

        context.fillStyle =
            "rgba(0, 0, 0, 0.75)";

        context.fillRect(
            0,
            0,
            900,
            500
        );

        context.fillStyle =
            "white";

        context.textAlign =
            "center";

        context.font =
            "bold 48px Arial";

        context.fillText(
            "TIME'S UP!",
            450,
            180
        );

        context.font =
            "24px Arial";

        context.fillText(
            `Deliveries: ${deliveries}`,
            450,
            240
        );

        context.fillText(
            `Score: ${score}`,
            450,
            280
        );

        context.font =
            "18px Arial";

        context.fillText(
            "Press ENTER to see your results",
            450,
            350
        );
    }
    //results//
    function drawResultsScreen(
        context
    ) {

        context.save();

        context.fillStyle =
            "rgba(0, 0, 0, 0.75)";

        context.fillRect(
            0,
            0,
            900,
            500
        );

        context.fillStyle =
            "#ffffff";

        context.fillRect(
            250,
            100,
            400,
            300
        );

        context.strokeStyle =
            "#333";

        context.lineWidth = 4;

        context.strokeRect(
            250,
            100,
            400,
            300
        );

        context.fillStyle =
            "#222";

        context.font =
            "bold 32px Arial";

        context.textAlign =
            "center";

        context.fillText(
            "DELIVERY RESULTS",
            450,
            150
        );

        context.font =
            "bold 22px Arial";

        context.fillText(
            "Deliveries: " +
            deliveries,
            450,
            205
        );

        context.fillText(
            "Final Score: " +
            score,
            450,
            245
        );

        // Retry button

        context.fillStyle =
            "#4CAF50";

        context.fillRect(
            320,
            275,
            260,
            50
        );

        context.strokeStyle =
            "#2e7d32";

        context.lineWidth = 2;

        context.strokeRect(
            320,
            275,
            260,
            50
        );

        context.fillStyle =
            "white";

        context.font =
            "bold 18px Arial";

        context.fillText(
            "R - RETRY TOWN DELIVERY",
            450,
            307
        );

        // Return button

        context.fillStyle =
            "#555";

        context.fillRect(
            320,
            340,
            260,
            40
        );

        context.strokeStyle =
            "#333";

        context.strokeRect(
            320,
            340,
            260,
            40
        );

        context.fillStyle =
            "white";

        context.font =
            "bold 16px Arial";

        context.fillText(
            "H - RETURN TO HUB",
            450,
            366
        );

        context.restore();
    }

    //draw
    function draw(context) {

        // Town

        drawTownBackground(
            context
        );

        // Buildings

        drawBuildings(
            context
        );

        // Puddles

        drawPuddles(
            context
        );

        // Delivery points

        drawDeliveryPoints(
            context
        );

        // Package

        drawPackage(
            context
        );

        // Player

        drawTownPlayer(
            context
        );

        // Blue weather tint

        drawWeatherOverlay(
            context
        );

        // Rain

        drawRain(
            context
        );

        drawWeatherSpotlights(
            context
        );

        // HUD

        drawHUD(
            context
        );

        // Teleport message

        drawTeleportMessage(
            context
        );

        if (
            gameState === "timesUp"
        ) {

            drawTimesUpScreen(
                context
            );
        }

        if (
            gameState === "results"
        ) {

            drawResultsScreen(
                context
            );
        }
    }

    //start restartt
    function restart() {

        timeRemaining =
            GAME_DURATION;

        gameState =
            "playing";

        deliveries = 0;

        score = 0;

        teleportMessage =
            "";

        teleportMessageTimer =
            0;

        townPlayer.reset(
            120,
            220
        );

        // Generate new puddles

        generatePuddles();

        // Generate rain

        createRainParticles();

        // Spawn package

        respawnPackage();

        gameAudio.playMusic("flood");
        gameAudio.startAmbient("rain");
    }

    //results
    function showResults() {

        if (
            gameState === "timesUp"
        ) {

            gameState =
                "results";
        }
    }

    return {

        start: restart,

        update: update,

        draw: draw,

        showResults:
            showResults,

        getState:
            function () {

                return gameState;
            },

        getResults:
            function () {

                return {

                    deliveries:
                        deliveries,

                    score:
                        score
                };
            }
    };

})();

