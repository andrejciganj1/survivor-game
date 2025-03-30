// Player Module

// Weapon Types
const WEAPON_TYPES = {
    KNIFE: {
        name: 'Knife',
        damage: 10,
        cooldown: 500,
        speed: 400,
        count: 1,
        duration: 2000,
        size: 15,
        color: '#ccc',
        description: 'Throws a knife in the direction of the nearest enemy'
    },
    ORBIT: {
        name: 'Orbit',
        damage: 10,
        cooldown: 3000,
        speed: 0,
        count: 1,
        duration: 2000,
        size: 20,
        color: '#ff5',
        description: 'Creates orbs that orbit around you damaging enemies'
    },
    EXPLOSION: {
        name: 'Explosion',
        damage: 10,
        cooldown: 2000,
        speed: 0,
        count: 1,
        duration: 500,
        size: 120,
        color: '#f55',
        description: 'Creates an explosion around you damaging all nearby enemies'
    },
    CHAIN_LIGHTNING: {
        name: 'Chain Lightning',
        damage: 6,
        cooldown: 1500,
        speed: 450,
        count: 1,
        duration: 400,
        size: 15,
        jumps: 1,    // Starts with 1 jump (hits 2 enemies total)
        jumpRange: 200, // Max distance to jump to next enemy
        damageDecay: 0.8, // Each jump does 80% of the previous damage
        color: '#4af',
        description: 'Strikes the nearest enemy with lightning that jumps to additional enemies'
    }
};

// Weapon Enhancements
const WEAPON_ENHANCEMENTS = {
    KNIFE: {
        LIFE_STEAL: {
            name: 'Life Steal',
            description: 'Heals you for 10% of damage dealt',
            apply: (weapon) => {
                weapon.enhancements.lifeSteal = true;
                return `Knife gained Life Steal enhancement`;
            }
        },
        MULTIPLY: {
            name: 'Multiply',
            description: 'Each knife splits into 2 knives on hit',
            apply: (weapon) => {
                weapon.enhancements.multiply = true;
                return `Knife gained Multiply enhancement`;
            }
        },
        PIERCE: {
            name: 'Pierce',
            description: 'Knives pass through enemies',
            apply: (weapon) => {
                weapon.enhancements.pierce = true;
                return `Knife gained Pierce enhancement`;
            }
        }
    },
    ORBIT: {
        MOONS: {
            name: 'Moons',
            description: 'Each orb gets two smaller orbiting moons',
            apply: (weapon) => {
                weapon.enhancements.moons = true;
                return `Orbit gained Moons enhancement`;
            }
        },
        DEORBIT: {
            name: 'Deorbit',
            description: 'On expiry, orbs continue in a straight line',
            apply: (weapon) => {
                weapon.enhancements.deorbit = true;
                return `Orbit gained Deorbit enhancement`;
            }
        },
        CONTINUOUS: {
            name: 'Continuous',
            description: 'Extends orb duration by 1 second',
            apply: (weapon) => {
                weapon.enhancements.continuous = true;
                weapon.duration += 1000; // Add 1 second
                return `Orbit gained Continuous enhancement`;
            }
        }
    },
    EXPLOSION: {
        FREEZE: {
            name: 'Freeze',
            description: 'Stops enemies hit by explosion for 1 second',
            apply: (weapon) => {
                weapon.enhancements.freeze = true;
                return `Explosion gained Freeze enhancement`;
            }
        },
        EXTEND: {
            name: 'Extend',
            description: 'Doubles explosion duration',
            apply: (weapon) => {
                weapon.enhancements.extend = true;
                weapon.duration *= 2;
                return `Explosion gained Extend enhancement`;
            }
        },
        AFTERSHOCK: {
            name: 'Aftershock',
            description: 'Creates a second explosion 0.5 seconds later',
            apply: (weapon) => {
                weapon.enhancements.aftershock = true;
                return `Explosion gained Aftershock enhancement`;
            }
        }
    },
    CHAIN_LIGHTNING: {
        FORK: {
            name: 'Fork',
            description: 'Lightning can jump to 2 enemies at each jump',
            apply: (weapon) => {
                weapon.enhancements.fork = true;
                return `Chain Lightning gained Fork enhancement`;
            }
        },
        IONIZE: {
            name: 'Ionize',
            description: 'Enemies hit by lightning take 50% more damage for 3 seconds',
            apply: (weapon) => {
                weapon.enhancements.ionize = true;
                return `Chain Lightning gained Ionize enhancement`;
            }
        },
        OVERCHARGE: {
            name: 'Overcharge',
            description: 'Lightning has 25% chance to do double damage',
            apply: (weapon) => {
                weapon.enhancements.overcharge = true;
                return `Chain Lightning gained Overcharge enhancement`;
            }
        }
    }
};

// Export WEAPON_TYPES to make it accessible from other modules
window.WEAPON_TYPES = WEAPON_TYPES;

// Player object with default values
const playerDefaults = {
    width: 30,
    height: 30,
    speed: 200,
    health: 100,
    maxHealth: 100,
    level: 1,
    xp: 0,
    xpToNextLevel: 50,
    kills: 0,
    weapons: []
};

// Initialize player object at the canvas center
function createPlayer(canvas) {
    return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: playerDefaults.width,
        height: playerDefaults.height,
        speed: playerDefaults.speed,
        health: playerDefaults.health,
        maxHealth: playerDefaults.maxHealth,
        level: playerDefaults.level,
        xp: playerDefaults.xp,
        xpToNextLevel: playerDefaults.xpToNextLevel,
        kills: playerDefaults.kills,
        weapons: []
    };
}

// Reset player to starting values
function resetPlayer(player, canvas) {
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = playerDefaults.maxHealth;
    player.maxHealth = playerDefaults.maxHealth;
    player.level = playerDefaults.level;
    player.xp = playerDefaults.xp;
    player.xpToNextLevel = playerDefaults.xpToNextLevel;
    player.kills = playerDefaults.kills;
    player.weapons = [];
    player.speed = playerDefaults.speed;
    
    return player;
}

// Update player position based on input
function updatePlayerPosition(player, keys, deltaTime, canvas) {
    // Calculate direction
    let dirX = 0;
    let dirY = 0;
    
    if (keys.ArrowUp || keys.w) dirY -= 1;
    if (keys.ArrowDown || keys.s) dirY += 1;
    if (keys.ArrowLeft || keys.a) dirX -= 1;
    if (keys.ArrowRight || keys.d) dirX += 1;
    
    // Normalize diagonal movement
    if (dirX !== 0 && dirY !== 0) {
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        dirX /= length;
        dirY /= length;
    }
    
    // Move player
    player.x += dirX * player.speed * (deltaTime / 1000);
    player.y += dirY * player.speed * (deltaTime / 1000);
    
    // Keep player within canvas bounds with margin
    const margin = 20;
    player.x = Math.max(margin, Math.min(canvas.width - margin, player.x));
    player.y = Math.max(margin, Math.min(canvas.height - margin, player.y));
    
    return player;
}

// Add a weapon to the player
function addWeapon(player, weaponType) {
    const weaponObj = {
        type: weaponType,
        lastFired: 0,
        level: 1,
        damage: weaponType.damage,
        cooldown: weaponType.cooldown,
        speed: weaponType.speed,
        count: weaponType.count,
        duration: weaponType.duration,
        size: weaponType.size,
        enhancements: {},
        enhancementLevels: []
    };
    
    // Add special properties based on weapon type
    if (weaponType.name === 'Chain Lightning') {
        weaponObj.jumps = weaponType.jumps;
        weaponObj.jumpRange = weaponType.jumpRange;
        weaponObj.damageDecay = weaponType.damageDecay;
    }
    
    player.weapons.push(weaponObj);
    
    return player;
}

// Fire weapons based on their cooldown
function fireWeapons(player, deltaTime, projectiles, enemies) {
    player.weapons.forEach(weapon => {
        weapon.lastFired += deltaTime;
        
        if (weapon.lastFired >= weapon.cooldown) {
            weapon.lastFired = 0;
            
            switch(weapon.type.name) {
                case 'Knife':
                    fireKnife(player, weapon, projectiles, enemies);
                    break;
                case 'Orbit':
                    createOrbitals(player, weapon, projectiles);
                    break;
                case 'Explosion':
                    createExplosion(player, weapon, projectiles);
                    break;
                case 'Chain Lightning':
                    fireChainLightning(player, weapon, projectiles, enemies);
                    break;
            }
        }
    });
}

// Fire a knife projectile toward the nearest enemy
function fireKnife(player, weapon, projectiles, enemies) {
    // Find the nearest enemy
    let nearestEnemy = null;
    let minDistance = Number.MAX_VALUE;
    
    enemies.forEach(enemy => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestEnemy = enemy;
        }
    });
    
    // If no enemies, fire in a random direction
    let dirX = Math.random() * 2 - 1;
    let dirY = Math.random() * 2 - 1;
    
    if (nearestEnemy) {
        dirX = nearestEnemy.x - player.x;
        dirY = nearestEnemy.y - player.y;
        
        // Normalize
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        dirX /= length;
        dirY /= length;
    }
    
    // Fire the projectile
    for (let i = 0; i < weapon.count; i++) {
        // Add slight spread for multiple knives
        let angle = 0;
        if (weapon.count > 1) {
            angle = (i / (weapon.count - 1) - 0.5) * Math.PI / 4;
        }
        
        const rotatedDirX = dirX * Math.cos(angle) - dirY * Math.sin(angle);
        const rotatedDirY = dirX * Math.sin(angle) + dirY * Math.cos(angle);
        
        projectiles.push({
            x: player.x,
            y: player.y,
            dirX: rotatedDirX,
            dirY: rotatedDirY,
            speed: weapon.speed,
            size: weapon.size,
            damage: weapon.damage,
            duration: weapon.duration,
            elapsed: 0,
            color: weapon.type.color,
            type: 'knife',
            weaponRef: weapon,
            enhancements: { ...weapon.enhancements },
            hitEnemies: []
        });
    }
}

// Create orbital projectiles that rotate around the player
function createOrbitals(player, weapon, projectiles) {
    const baseAngle = Date.now() / 1000;
    
    for (let i = 0; i < weapon.count; i++) {
        const angle = baseAngle + (i * (2 * Math.PI / weapon.count));
        
        const orb = {
            x: player.x + Math.cos(angle) * 60,
            y: player.y + Math.sin(angle) * 60,
            baseAngle: angle,
            orbitRadius: 60,
            orbitSpeed: 3,
            size: weapon.size,
            damage: weapon.damage,
            duration: weapon.duration,
            elapsed: 0,
            color: weapon.type.color,
            type: 'orbit',
            weaponRef: weapon,
            enhancements: { ...weapon.enhancements },
            hitEnemies: []
        };
        
        projectiles.push(orb);
        
        // If the weapon has the moons enhancement, add two smaller orbiting moons
        if (weapon.enhancements.moons) {
            // First moon
            projectiles.push({
                x: orb.x,
                y: orb.y,
                parentOrb: orb,
                moonAngle: 0,
                moonOrbitSpeed: 8,
                moonOrbitRadius: orb.size * 1.2,
                size: orb.size * 0.5,
                damage: orb.damage * 0.5,
                duration: orb.duration,
                elapsed: 0,
                color: '#ffa',  // Slightly different color for moons
                type: 'moon',
                weaponRef: weapon,
                hitEnemies: []
            });
            
            // Second moon
            projectiles.push({
                x: orb.x,
                y: orb.y,
                parentOrb: orb,
                moonAngle: Math.PI,
                moonOrbitSpeed: 8,
                moonOrbitRadius: orb.size * 1.2,
                size: orb.size * 0.5,
                damage: orb.damage * 0.5,
                duration: orb.duration,
                elapsed: 0,
                color: '#ffa',
                type: 'moon',
                weaponRef: weapon,
                hitEnemies: []
            });
        }
    }
}

// Create an explosion around the player
function createExplosion(player, weapon, projectiles) {
    projectiles.push({
        x: player.x,
        y: player.y,
        size: weapon.size,
        damage: weapon.damage,
        duration: weapon.duration,
        elapsed: 0,
        color: weapon.type.color,
        type: 'explosion',
        weaponRef: weapon,
        enhancements: { ...weapon.enhancements },
        hitEnemies: []
    });
}

// Fire chain lightning toward the nearest enemy
function fireChainLightning(player, weapon, projectiles, enemies) {
    // Only shoot if there are enemies
    if (enemies.length === 0) return;

    // Find the nearest enemy
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    
    enemies.forEach(enemy => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestEnemy = enemy;
        }
    });
    
    if (nearestEnemy) {
        // Calculate direction to the nearest enemy
        const dx = nearestEnemy.x - player.x;
        const dy = nearestEnemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Use weapon properties with fallbacks to weapon type properties
        const jumps = weapon.jumps !== undefined ? weapon.jumps : weapon.type.jumps;
        const jumpRange = weapon.jumpRange !== undefined ? weapon.jumpRange : weapon.type.jumpRange;
        const damageDecay = weapon.damageDecay !== undefined ? weapon.damageDecay : weapon.type.damageDecay;
        
        // Add Chain Lightning projectile
        projectiles.push({
            x: player.x,
            y: player.y,
            dirX: dirX,
            dirY: dirY,
            targetEnemy: nearestEnemy,
            speed: weapon.speed,
            size: weapon.size,
            damage: weapon.damage,
            jumpsLeft: jumps,
            jumpRange: jumpRange,
            damageDecay: damageDecay,
            duration: weapon.duration,
            elapsed: 0,
            color: weapon.type.color,
            type: 'chainLightning',
            weaponRef: weapon,
            enhancements: { ...weapon.enhancements },
            hitEnemies: []
        });
    }
}

// Draw the player on the canvas
function drawPlayer(player, ctx) {
    // Draw player
    ctx.fillStyle = '#5af';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw health bar
    const healthBarWidth = 40;
    const healthBarHeight = 4;
    const healthPercent = player.health / player.maxHealth;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x - healthBarWidth / 2, player.y - 25, healthBarWidth, healthBarHeight);
    
    ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00';
    ctx.fillRect(
        player.x - healthBarWidth / 2,
        player.y - 25,
        healthBarWidth * healthPercent,
        healthBarHeight
    );
}

// Handle player death
function handlePlayerDeath(player, gameState, GAME_STATE) {
    if (player.health <= 0) {
        gameOver(player, gameState, GAME_STATE);
        return true;
    }
    return false;
}

// Game over
function gameOver(player, gameState, GAME_STATE) {
    gameState.current = GAME_STATE.GAME_OVER;
    document.getElementById('finalScore').textContent = `Kills: ${player.kills}`;
    document.getElementById('gameOver').style.display = 'block';
}

// Level up the player
function levelUp(player, gameState, GAME_STATE) {
    player.level++;
    player.xp -= player.xpToNextLevel;
    player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.2);
    
    // Pause the game for upgrades
    gameState.current = GAME_STATE.LEVEL_UP;
    
    // Show level up UI
    showLevelUpOptions(player, gameState, GAME_STATE);
    
    return gameState;
}

// Show level up options
function showLevelUpOptions(player, gameState, GAME_STATE) {
    const upgradeOptions = document.getElementById('upgradeOptions');
    upgradeOptions.innerHTML = '';
    
    // Get all possible upgrades
    const possibleUpgrades = [];
    
    // Weapon upgrades
    player.weapons.forEach(weapon => {
        // Check if weapon can be upgraded (level < 9)
        if (weapon.level < 9) {
            // Check if next level is an enhancement level (3, 6, 9)
            const nextLevel = weapon.level + 1;
            const isEnhancementLevel = nextLevel % 3 === 0;
            
            if (isEnhancementLevel) {
                // Get available enhancements for this weapon
                const weaponType = weapon.type.name.toUpperCase().replace(' ', '_');
                
                console.log('Looking for enhancements for:', weaponType);
                console.log('Available enhancement types:', Object.keys(WEAPON_ENHANCEMENTS));
                
                // Check if enhancements exist for this weapon type
                if (!WEAPON_ENHANCEMENTS[weaponType]) {
                    console.warn(`No enhancements found for weapon type: ${weaponType}`);
                    // No enhancements defined for this weapon type, offer regular upgrade
                    addRegularUpgrade(weapon, possibleUpgrades);
                } else {
                    const availableEnhancements = Object.values(WEAPON_ENHANCEMENTS[weaponType])
                        .filter(enhancement => !weapon.enhancementLevels.includes(enhancement.name));
                    
                    // If no more enhancements available, offer regular upgrade
                    if (availableEnhancements.length === 0) {
                        addRegularUpgrade(weapon, possibleUpgrades);
                    } else {
                        // Choose a random enhancement
                        const enhancement = availableEnhancements[Math.floor(Math.random() * availableEnhancements.length)];
                        
                        possibleUpgrades.push({
                            text: `${weapon.type.name} Enhancement (Level ${nextLevel}): ${enhancement.name} - ${enhancement.description}`,
                            apply: () => {
                                weapon.level++;
                                const result = enhancement.apply(weapon);
                                weapon.enhancementLevels.push(enhancement.name);
                                return result;
                            }
                        });
                    }
                }
            } else {
                // Regular upgrade
                addRegularUpgrade(weapon, possibleUpgrades);
            }
        }
    });
    
    // Helper function to add regular weapon upgrade options
    function addRegularUpgrade(weapon, upgrades) {
        let upgradeText = '';
        
        switch(weapon.type.name) {
            case 'Knife':
                upgradeText = `Knife Level ${weapon.level + 1}: +5 damage, -10% cooldown`;
                break;
            case 'Orbit':
                upgradeText = `Orbit Level ${weapon.level + 1}: +1 orb, +3 damage`;
                break;
            case 'Explosion':
                upgradeText = `Explosion Level ${weapon.level + 1}: +4 damage, +40 size`;
                break;
            case 'Chain Lightning':
                upgradeText = `Chain Lightning Level ${weapon.level + 1}: +3 damage, +1 jump`;
                break;
        }
        
        upgrades.push({
            text: upgradeText,
            apply: () => {
                // Apply the upgrade when selected
                weapon.level++;
                
                switch(weapon.type.name) {
                    case 'Knife':
                        weapon.damage += 5;
                        weapon.cooldown *= 0.9;
                        break;
                    case 'Orbit':
                        weapon.count++;
                        weapon.damage += 3;
                        break;
                    case 'Explosion':
                        weapon.damage += 4;
                        weapon.size += 40;
                        break;
                    case 'Chain Lightning':
                        weapon.damage += 3;
                        weapon.jumps += 1;
                        break;
                }
                
                return upgradeText;
            }
        });
    }
    
    // New weapons (if not already have all)
    const allWeaponTypes = Object.values(WEAPON_TYPES);
    const availableWeapons = allWeaponTypes.filter(
        weaponType => !player.weapons.some(w => w.type.name === weaponType.name)
    );
    
    if (availableWeapons.length > 0) {
        const newWeapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
        possibleUpgrades.push({
            text: `New Weapon: ${newWeapon.name} - ${newWeapon.description}`,
            apply: () => {
                addWeapon(player, newWeapon);
                return `Acquired ${newWeapon.name}`;
            }
        });
    }
    
    // Character stats
    const CHARACTER_STATS = {
        MAX_HEALTH: {
            name: 'Max Health',
            description: 'Increases your maximum health by 20',
            upgrade: () => {
                player.maxHealth += 20;
                player.health += 20;
                return 'Max Health +20';
            }
        },
        MOVEMENT_SPEED: {
            name: 'Movement Speed',
            description: 'Increases your movement speed by 20',
            upgrade: () => {
                player.speed += 20;
                return 'Movement Speed +20';
            }
        },
        RECOVERY: {
            name: 'Recovery',
            description: 'Recovers 30 health',
            upgrade: () => {
                player.health = Math.min(player.maxHealth, player.health + 30);
                return 'Recovered 30 health';
            }
        }
    };
    
    Object.values(CHARACTER_STATS).forEach(stat => {
        possibleUpgrades.push({
            text: `${stat.name} - ${stat.description}`,
            apply: stat.upgrade
        });
    });
    
    // Choose 3 random upgrades
    const numOptions = Math.min(3, possibleUpgrades.length);
    const selectedUpgrades = [];
    
    while (selectedUpgrades.length < numOptions && possibleUpgrades.length > 0) {
        const index = Math.floor(Math.random() * possibleUpgrades.length);
        selectedUpgrades.push(possibleUpgrades[index]);
        possibleUpgrades.splice(index, 1);
    }
    
    // Create buttons for each upgrade
    selectedUpgrades.forEach(upgrade => {
        const button = document.createElement('div');
        button.className = 'upgrade';
        button.textContent = upgrade.text;
        button.addEventListener('click', () => {
            // Apply the upgrade
            const result = upgrade.apply();
            
            // Resume the game
            gameState.current = GAME_STATE.RUNNING;
            document.getElementById('levelUp').style.display = 'none';
            
            // Update UI
            window.updateUI(player);
        });
        upgradeOptions.appendChild(button);
    });
    
    // Show the level up screen
    document.getElementById('levelUp').style.display = 'block';
}

// Check if player should level up and handle it
function checkLevelUp(player, gameState, GAME_STATE) {
    if (player.xp >= player.xpToNextLevel) {
        levelUp(player, gameState, GAME_STATE);
        return true;
    }
    return false;
}

// Export player module
window.playerModule = {
    createPlayer,
    resetPlayer,
    updatePlayerPosition,
    addWeapon,
    drawPlayer,
    handlePlayerDeath,
    gameOver,
    fireWeapons,
    WEAPON_TYPES,
    levelUp,
    checkLevelUp
}; 