import { world, system, Player } from "@minecraft/server";

// Track players currently undergoing the sleep sequence
// Map<PlayerName, { startTick: number, bedLocation: {x,y,z} }>
const activeSleepers = new Map();

// Sleep duration: 8 in-game hours (~7 minutes real time)
// 1 in-game hour = 1000 ticks. 8 in-game hours = 8000 ticks = 400 seconds.
const SLEEP_DURATION_TICKS = 8000;

// Initialize world settings
system.run(() => {
    try {
        // Prevent instant vanilla sleep skip so players must experience real-time night
        world.gameRules.playersSleepingPercentage = 101;
    } catch (e) {
        console.warn("Could not set playersSleepingPercentage: " + e);
    }
});

/**
 * Checks if a block identifier is a bed.
 */
function isBedBlock(typeId) {
    return typeId && typeId.includes("bed");
}

/**
 * Handle player interaction with blocks (detect clicking on a bed).
 */
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const player = event.player;
    const block = event.block;

    if (isBedBlock(block.typeId)) {
        const timeOfDay = world.getTimeOfDay();
        // Bed can only be used at night (12541 - 23458 ticks) or during thunderstorms
        const isNight = timeOfDay >= 12541 && timeOfDay <= 23458;

        if (!isNight) {
            return;
        }

        if (activeSleepers.has(player.name)) {
            event.cancel = true;
            return;
        }

        system.run(() => {
            startSleepCutscene(player, block.location);
        });
    }
});

/**
 * Starts the unskippable real-time sleep cutscene for a player.
 */
function startSleepCutscene(player, bedLocation) {
    if (!player || !player.isValid()) return;

    const bedX = bedLocation.x + 0.5;
    const bedY = bedLocation.y + 0.6;
    const bedZ = bedLocation.z + 0.5;

    activeSleepers.set(player.name, {
        startTick: system.currentTick,
        bedLocation: { x: bedX, y: bedY, z: bedZ },
        lastBedPos: { x: player.location.x, y: player.location.y, z: player.location.z }
    });

    player.sendMessage("§8[Sleep] §7You lie awake on your bed, watching the ceiling in total silence...");

    // Set camera using exact Bedrock Script API 'location' property (pitch -90 = facing ceiling)
    player.camera.setCamera("minecraft:free", {
        location: { x: bedX, y: bedY, z: bedZ },
        rotation: { x: -90, y: 0 }
    });

    // Apply darkness/blindness effect transition
    player.addEffect("blindness", 40, { amplifier: 1, showParticles: false });
}

/**
 * Tick loop to enforce camera lock, advance real time / world time smoothly, and release player at sunrise.
 */
system.runInterval(() => {
    const currentTick = system.currentTick;

    for (const [playerName, sleeper] of activeSleepers.entries()) {
        const player = world.getAllPlayers().find(p => p.name === playerName);

        if (!player || !player.isValid()) {
            activeSleepers.delete(playerName);
            continue;
        }

        // Check if player moved far away from bed (bed destroyed or player teleported/respawned)
        const dx = player.location.x - sleeper.bedLocation.x;
        const dy = player.location.y - sleeper.bedLocation.y;
        const dz = player.location.z - sleeper.bedLocation.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq > 16) {
            // Player moved away from bed, release camera lock
            wakeUpPlayer(player, false);
            continue;
        }

        const elapsedTicks = currentTick - sleeper.startTick;

        if (elapsedTicks >= SLEEP_DURATION_TICKS) {
            wakeUpPlayer(player, true);
        } else {
            // Re-apply free camera facing straight up at ceiling with correct 'location' API property
            player.camera.setCamera("minecraft:free", {
                location: sleeper.bedLocation,
                rotation: { x: -90, y: 0 }
            });

            // Smoothly advance time of day towards sunrise
            if (elapsedTicks % 20 === 0) {
                const currentTime = world.getTimeOfDay();
                world.setTimeOfDay((currentTime + 1) % 24000);
            }

            // Display actionbar countdown and progress
            const remainingSecs = Math.ceil((SLEEP_DURATION_TICKS - elapsedTicks) / 20);
            const minutes = Math.floor(remainingSecs / 60);
            const seconds = remainingSecs % 60;
            const timeStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            player.onScreenDisplay.setActionBar(`§8Lying awake watching ceiling... Sun rises in ${timeStr} (${Math.round((elapsedTicks / SLEEP_DURATION_TICKS) * 100)}%)`);
        }
    }
}, 1);

/**
 * Wakes up the player and restores full control & standard camera.
 */
function wakeUpPlayer(player, completed) {
    if (!activeSleepers.has(player.name)) return;

    activeSleepers.delete(player.name);

    // Reset camera back to standard gameplay perspective
    player.camera.clear();

    if (completed) {
        player.onScreenDisplay.setActionBar("§aThe sun has fully risen. You step out of bed.");
        player.sendMessage("§eMorning arrives. You can now move and check your inventory.");
    } else {
        player.onScreenDisplay.setActionBar("§cSleep cutscene ended.");
    }
}

// Clean up sleepers on player leave or die
world.afterEvents.playerLeave.subscribe((event) => {
    if (activeSleepers.has(event.playerName)) {
        activeSleepers.delete(event.playerName);
    }
});

world.afterEvents.entityDie.subscribe((event) => {
    const entity = event.deadEntity;
    if (entity instanceof Player && activeSleepers.has(entity.name)) {
        wakeUpPlayer(entity, false);
    }
});
