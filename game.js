// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game States
const GAME_STATE = {
    RUNNING: 0,
    PAUSED: 1,
    LEVEL_UP: 2,
    GAME_OVER: 3
};

// Game Variables
let gameState = GAME_STATE.RUNNING;
let lastTimestamp = 0;
let elapsedGameTime = 0;

// Player Variables
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
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

// Weapon Types
const WEAPON_TYPES = {
    KNIFE: {
        name: 'Knife',
        damage: 10,
        cooldown: 500,
        speed: 400,
        count: 1,
        duration: 1000,
        size: 15,
        color: '#ccc',
        description: 'Throws a knife in the direction of the nearest enemy',
        upgrade: function(weapon) {
            if (weapon.level < 5) {
                weapon.level++;
                weapon.damage += 5;
                weapon.cooldown *= 0.9;
                return `Knife Level ${weapon.level}: +5 damage, -10% cooldown`;
            }
            return null;
        }
    },
    ORBIT: {
        name: 'Orbit',
        damage: 5,
        cooldown: 3000,
        speed: 0,
        count: 3,
        duration: 2000,
        size: 20,
        color: '#ff5',
        description: 'Creates orbs that orbit around you damaging enemies',
        upgrade: function(weapon) {
            if (weapon.level < 5) {
                weapon.level++;
                weapon.count++;
                weapon.damage += 3;
                return `Orbit Level ${weapon.level}: +1 orb, +3 damage`;
            }
            return null;
        }
    },
    EXPLOSION: {
        name: 'Explosion',
        damage: 20,
        cooldown: 2000,
        speed: 0,
        count: 1,
        duration: 500,
        size: 80,
        color: '#f55',
        description: 'Creates an explosion around you damaging all nearby enemies',
        upgrade: function(weapon) {
            if (weapon.level < 5) {
                weapon.level++;
                weapon.damage += 10;
                weapon.size += 20;
                return `Explosion Level ${weapon.level}: +10 damage, +20 size`;
            }
            return null;
        }
    }
};

// Character Stats
const CHARACTER_STATS = {
    MAX_HEALTH: {
        name: 'Max Health',
        description: 'Increases your maximum health by 20',
        upgrade: function() {
            player.maxHealth += 20;
            player.health += 20;
            return 'Max Health +20';
        }
    },
    MOVEMENT_SPEED: {
        name: 'Movement Speed',
        description: 'Increases your movement speed by 20',
        upgrade: function() {
            player.speed += 20;
            return 'Movement Speed +20';
        }
    },
    RECOVERY: {
        name: 'Recovery',
        description: 'Recovers 30 health',
        upgrade: function() {
            player.health = Math.min(player.maxHealth, player.health + 30);
            return 'Recovered 30 health';
        }
    }
};

// Enemy Variables
const enemies = [];
const enemyTypes = [
    { 
        name: 'Zombie', 
        speed: 60, 
        health: 30, 
        damage: 5, 
        size: 25, 
        color: '#3d3', 
        xpValue: 5 
    },
    { 
        name: 'Ghost', 
        speed: 100, 
        health: 15, 
        damage: 10, 
        size: 20, 
        color: '#ddf', 
        xpValue: 8 
    },
    { 
        name: 'Demon', 
        speed: 40, 
        health: 60, 
        damage: 15, 
        size: 35, 
        color: '#f55', 
        xpValue: 12 
    }
];

// Projectiles
const projectiles = [];

// Input handling
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false
};

// XP Orbs
const xpOrbs = [];

// Track game time for enemy spawning
let lastEnemySpawn = 0;
let enemySpawnRate = 1000; // milliseconds

// Initialize game
function init() {
    // Reset game state
    gameState = GAME_STATE.RUNNING;
    elapsedGameTime = 0;
    
    // Reset player
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = player.maxHealth;
    player.level = 1;
    player.xp = 0;
    player.xpToNextLevel = 50;
    player.kills = 0;
    player.weapons = [];
    
    // Add starter weapon (knife)
    addWeapon(WEAPON_TYPES.KNIFE);
    
    // Clear arrays
    enemies.length = 0;
    projectiles.length = 0;
    xpOrbs.length = 0;
    
    // Reset spawn rate
    enemySpawnRate = 1000;
    
    // Update UI
    updateUI();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Get random position outside the screen, but not too far
function getRandomSpawnPosition() {
    const padding = 100;
    const spawnSide = Math.floor(Math.random() * 4);
    
    switch (spawnSide) {
        case 0: // Top
            return {
                x: Math.random() * (canvas.width + 2 * padding) - padding,
                y: -padding
            };
        case 1: // Right
            return {
                x: canvas.width + padding,
                y: Math.random() * (canvas.height + 2 * padding) - padding
            };
        case 2: // Bottom
            return {
                x: Math.random() * (canvas.width + 2 * padding) - padding,
                y: canvas.height + padding
            };
        case 3: // Left
            return {
                x: -padding,
                y: Math.random() * (canvas.height + 2 * padding) - padding
            };
    }
}

// Spawn enemies
function spawnEnemies(deltaTime) {
    lastEnemySpawn += deltaTime;
    
    // Gradually decrease spawn time (increase difficulty)
    enemySpawnRate = Math.max(200, 1000 - Math.floor(elapsedGameTime / 10000) * 100);
    
    if (lastEnemySpawn >= enemySpawnRate) {
        lastEnemySpawn = 0;
        
        // Choose enemy type weighted toward stronger enemies as time progresses
        const timeWeight = Math.min(elapsedGameTime / 120000, 1);
        let enemyTypeIndex;
        
        if (Math.random() < timeWeight * 0.7) {
            enemyTypeIndex = Math.floor(Math.random() * enemyTypes.length);
        } else {
            enemyTypeIndex = 0; // Default to basic zombie
        }
        
        const enemyType = enemyTypes[enemyTypeIndex];
        const spawnPos = getRandomSpawnPosition();
        
        // Create enemy
        enemies.push({
            x: spawnPos.x,
            y: spawnPos.y,
            type: enemyType,
            health: enemyType.health,
            width: enemyType.size,
            height: enemyType.size,
            speed: enemyType.speed,
            damage: enemyType.damage,
            lastAttack: 0,
            attackCooldown: 1000, // Attack once per second
            xpValue: enemyType.xpValue
        });
    }
}

// Add a weapon to the player
function addWeapon(weaponType) {
    player.weapons.push({
        type: weaponType,
        lastFired: 0,
        level: 1,
        damage: weaponType.damage,
        cooldown: weaponType.cooldown,
        speed: weaponType.speed,
        count: weaponType.count,
        duration: weaponType.duration,
        size: weaponType.size
    });
}

// Fire weapons based on their cooldown
function fireWeapons(deltaTime) {
    player.weapons.forEach(weapon => {
        weapon.lastFired += deltaTime;
        
        if (weapon.lastFired >= weapon.cooldown) {
            weapon.lastFired = 0;
            
            switch(weapon.type.name) {
                case 'Knife':
                    fireKnife(weapon);
                    break;
                case 'Orbit':
                    createOrbitals(weapon);
                    break;
                case 'Explosion':
                    createExplosion(weapon);
                    break;
            }
        }
    });
}

// Fire a knife projectile toward the nearest enemy
function fireKnife(weapon) {
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
            type: 'knife'
        });
    }
}

// Create orbital projectiles that rotate around the player
function createOrbitals(weapon) {
    const baseAngle = Date.now() / 1000;
    
    for (let i = 0; i < weapon.count; i++) {
        const angle = baseAngle + (i * (2 * Math.PI / weapon.count));
        
        projectiles.push({
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
            type: 'orbit'
        });
    }
}

// Create an explosion around the player
function createExplosion(weapon) {
    projectiles.push({
        x: player.x,
        y: player.y,
        size: weapon.size,
        damage: weapon.damage,
        duration: weapon.duration,
        elapsed: 0,
        color: weapon.type.color,
        type: 'explosion'
    });
}

// Update projectiles
function updateProjectiles(deltaTime) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.elapsed += deltaTime;
        
        // Remove expired projectiles
        if (proj.elapsed >= proj.duration) {
            projectiles.splice(i, 1);
            continue;
        }
        
        // Update position based on projectile type
        switch (proj.type) {
            case 'knife':
                proj.x += proj.dirX * proj.speed * (deltaTime / 1000);
                proj.y += proj.dirY * proj.speed * (deltaTime / 1000);
                break;
            case 'orbit':
                const angle = proj.baseAngle + proj.orbitSpeed * (proj.elapsed / 1000);
                proj.x = player.x + Math.cos(angle) * proj.orbitRadius;
                proj.y = player.y + Math.sin(angle) * proj.orbitRadius;
                break;
            case 'explosion':
                // Explosion stays in place, just changes size
                const progress = proj.elapsed / proj.duration;
                const sizeMultiplier = Math.sin(progress * Math.PI); // Grow then shrink
                proj.currentSize = proj.size * sizeMultiplier;
                break;
        }
    }
}

// Update XP orbs and check collection
function updateXPOrbs(deltaTime) {
    const magnetRadius = 100; // Distance at which XP orbs get attracted to player
    
    for (let i = xpOrbs.length - 1; i >= 0; i--) {
        const orb = xpOrbs[i];
        
        // Calculate distance to player
        const dx = player.x - orb.x;
        const dy = player.y - orb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If close to player, move toward player
        if (distance < magnetRadius) {
            const moveSpeed = Math.max(100, 400 * (1 - distance / magnetRadius));
            
            // Normalize direction and move
            orb.x += (dx / distance) * moveSpeed * (deltaTime / 1000);
            orb.y += (dy / distance) * moveSpeed * (deltaTime / 1000);
        }
        
        // Check if collected
        if (distance < player.width / 2 + orb.size / 2) {
            player.xp += orb.value;
            
            // Check level up
            if (player.xp >= player.xpToNextLevel) {
                levelUp();
            }
            
            // Update XP UI
            updateUI();
            
            // Remove orb
            xpOrbs.splice(i, 1);
        }
    }
}

// Check collisions between projectiles and enemies
function checkProjectileEnemyCollisions() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            let hitDetected = false;
            
            switch (proj.type) {
                case 'knife':
                case 'orbit':
                    // Circle collision detection
                    const dx = proj.x - enemy.x;
                    const dy = proj.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < proj.size / 2 + enemy.width / 2) {
                        hitDetected = true;
                    }
                    break;
                case 'explosion':
                    // Check if enemy is within explosion radius
                    const exDx = proj.x - enemy.x;
                    const exDy = proj.y - enemy.y;
                    const exDistance = Math.sqrt(exDx * exDx + exDy * exDy);
                    
                    if (exDistance < proj.currentSize / 2 + enemy.width / 2) {
                        hitDetected = true;
                    }
                    break;
            }
            
            if (hitDetected) {
                // Damage enemy
                enemy.health -= proj.damage;
                
                // Check if enemy died
                if (enemy.health <= 0) {
                    // Increment kill count
                    player.kills++;
                    
                    // Drop XP orb
                    xpOrbs.push({
                        x: enemy.x,
                        y: enemy.y,
                        value: enemy.xpValue,
                        size: 10,
                        color: '#5ff'
                    });
                    
                    // Remove enemy
                    enemies.splice(j, 1);
                    
                    // Update UI
                    document.getElementById('kills').textContent = `Kills: ${player.kills}`;
                }
                
                // Remove projectile if it's a knife (others persist)
                if (proj.type === 'knife') {
                    projectiles.splice(i, 1);
                    break; // Break out of enemy loop since projectile is gone
                }
            }
        }
    }
}

// Check collisions between player and enemies
function checkPlayerEnemyCollisions(deltaTime) {
    enemies.forEach(enemy => {
        // Update enemy attack cooldown
        enemy.lastAttack += deltaTime;
        
        // Check collision
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.width / 2 + enemy.width / 2) {
            // Enemy deals damage to player after cooldown
            if (enemy.lastAttack >= enemy.attackCooldown) {
                player.health -= enemy.damage;
                enemy.lastAttack = 0;
                
                // Update health UI
                updateUI();
                
                // Check if player died
                if (player.health <= 0) {
                    gameOver();
                }
            }
        }
    });
}

// Update enemies
function updateEnemies(deltaTime) {
    enemies.forEach(enemy => {
        // Calculate direction toward player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Move enemy toward player
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed * (deltaTime / 1000);
            enemy.y += (dy / distance) * enemy.speed * (deltaTime / 1000);
        }
    });
}

// Update player position based on input
function updatePlayer(deltaTime) {
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
}

// Level up
function levelUp() {
    player.level++;
    player.xp -= player.xpToNextLevel;
    player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.2);
    
    // Pause the game for upgrades
    gameState = GAME_STATE.LEVEL_UP;
    
    // Show level up UI
    showLevelUpOptions();
}

// Show level up options
function showLevelUpOptions() {
    const upgradeOptions = document.getElementById('upgradeOptions');
    upgradeOptions.innerHTML = '';
    
    // Get all possible upgrades
    const possibleUpgrades = [];
    
    // Weapon upgrades
    player.weapons.forEach(weapon => {
        // Check if weapon can be upgraded (level < 5)
        if (weapon.level < 5) {
            // Create upgrade text without applying the upgrade yet
            let upgradeText = '';
            
            switch(weapon.type.name) {
                case 'Knife':
                    upgradeText = `Knife Level ${weapon.level + 1}: +5 damage, -10% cooldown`;
                    break;
                case 'Orbit':
                    upgradeText = `Orbit Level ${weapon.level + 1}: +1 orb, +3 damage`;
                    break;
                case 'Explosion':
                    upgradeText = `Explosion Level ${weapon.level + 1}: +10 damage, +20 size`;
                    break;
            }
            
            possibleUpgrades.push({
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
                            weapon.damage += 10;
                            weapon.size += 20;
                            break;
                    }
                    
                    return upgradeText;
                }
            });
        }
    });
    
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
                addWeapon(newWeapon);
                return `Acquired ${newWeapon.name}`;
            }
        });
    }
    
    // Character stats
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
            gameState = GAME_STATE.RUNNING;
            document.getElementById('levelUp').style.display = 'none';
            
            // Update UI
            updateUI();
        });
        upgradeOptions.appendChild(button);
    });
    
    // Show the level up screen
    document.getElementById('levelUp').style.display = 'block';
}

// Game over
function gameOver() {
    gameState = GAME_STATE.GAME_OVER;
    document.getElementById('finalScore').textContent = `Kills: ${player.kills}`;
    document.getElementById('gameOver').style.display = 'block';
}

// Update UI elements
function updateUI() {
    document.getElementById('level').textContent = `Level: ${player.level}`;
    document.getElementById('xp').textContent = `XP: ${player.xp} / ${player.xpToNextLevel}`;
    document.getElementById('health').textContent = `Health: ${Math.max(0, Math.floor(player.health))}`;
    document.getElementById('movementSpeed').textContent = `Movement Speed: ${player.speed}`;
    document.getElementById('kills').textContent = `Kills: ${player.kills}`;
    
    // Format time as MM:SS
    const minutes = Math.floor(elapsedGameTime / 60000);
    const seconds = Math.floor((elapsedGameTime % 60000) / 1000);
    document.getElementById('time').textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update enemy information
    document.getElementById('enemyCount').textContent = `Enemies: ${enemies.length}`;
    
    // Calculate average enemy health and speed
    if (enemies.length > 0) {
        const totalHealth = enemies.reduce((sum, enemy) => sum + enemy.health, 0);
        const avgHealth = Math.floor(totalHealth / enemies.length);
        document.getElementById('enemyHealth').textContent = `Average Health: ${avgHealth}`;
        
        const totalSpeed = enemies.reduce((sum, enemy) => sum + enemy.speed, 0);
        const avgSpeed = Math.floor(totalSpeed / enemies.length);
        document.getElementById('enemySpeed').textContent = `Average Speed: ${avgSpeed}`;
    } else {
        document.getElementById('enemyHealth').textContent = `Average Health: 0`;
        document.getElementById('enemySpeed').textContent = `Average Speed: 0`;
    }
    
    // Update weapon information
    const weaponInfoDiv = document.getElementById('weaponInfo');
    // Clear previous weapon info
    weaponInfoDiv.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.style.fontWeight = 'bold';
    header.textContent = 'Weapon Info:';
    weaponInfoDiv.appendChild(header);
    
    // Add each weapon's info
    player.weapons.forEach(weapon => {
        const weaponDiv = document.createElement('div');
        weaponDiv.style.marginBottom = '2px';
        
        // Create base info with color matching weapon
        weaponDiv.innerHTML = `<span style="color:${weapon.type.color}">${weapon.type.name}</span> (Lvl ${weapon.level}): DMG ${weapon.damage}, CD ${Math.round(weapon.cooldown)}ms`;
        
        // Add weapon-specific stats
        if (weapon.type.name === 'Knife') {
            weaponDiv.innerHTML += `, SPD ${weapon.speed}, Count ${weapon.count}, DUR ${weapon.duration}ms`;
        } else if (weapon.type.name === 'Orbit') {
            weaponDiv.innerHTML += `, Orbs ${weapon.count}, Size ${weapon.size}, DUR ${weapon.duration}ms`;
        } else if (weapon.type.name === 'Explosion') {
            weaponDiv.innerHTML += `, Size ${weapon.size}, DUR ${weapon.duration}ms`;
        }
        
        weaponInfoDiv.appendChild(weaponDiv);
    });
}

// Main game loop
function gameLoop(timestamp) {
    // Calculate delta time
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // If game is paused for level up, only render and wait
    if (gameState === GAME_STATE.LEVEL_UP) {
        drawGame();
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // If game is over, don't update
    if (gameState === GAME_STATE.GAME_OVER) {
        drawGame();
        return;
    }
    
    // Update game
    elapsedGameTime += deltaTime;
    updatePlayer(deltaTime);
    updateEnemies(deltaTime);
    fireWeapons(deltaTime);
    updateProjectiles(deltaTime);
    updateXPOrbs(deltaTime);
    spawnEnemies(deltaTime);
    
    // Check collisions
    checkProjectileEnemyCollisions();
    checkPlayerEnemyCollisions(deltaTime);
    
    // Update UI each frame for real-time info
    updateUI();
    
    // Draw everything
    drawGame();
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Draw everything
function drawGame() {
    // Draw player
    ctx.fillStyle = '#5af';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw enemies
    enemies.forEach(enemy => {
        // Draw enemy
        ctx.fillStyle = enemy.type.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw enemy health bar
        const healthBarWidth = enemy.width;
        const healthBarHeight = 3;
        const healthPercent = enemy.health / enemy.type.health;
        
        // Background of health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.height / 2 - 8, healthBarWidth, healthBarHeight);
        
        // Health bar
        ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00';
        ctx.fillRect(
            enemy.x - healthBarWidth / 2,
            enemy.y - enemy.height / 2 - 8,
            healthBarWidth * healthPercent,
            healthBarHeight
        );
        
        // Enemy health text
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            Math.floor(enemy.health),
            enemy.x,
            enemy.y - enemy.height / 2 - 12
        );
    });
    
    // Draw projectiles
    projectiles.forEach(proj => {
        ctx.fillStyle = proj.color;
        
        switch (proj.type) {
            case 'knife':
                // Draw as a small rectangle
                ctx.save();
                
                // Calculate rotation angle
                const angle = Math.atan2(proj.dirY, proj.dirX);
                
                // Translate to position and rotate
                ctx.translate(proj.x, proj.y);
                ctx.rotate(angle);
                
                // Draw rectangle
                ctx.fillRect(-proj.size / 2, -proj.size / 4, proj.size, proj.size / 2);
                
                ctx.restore();
                break;
            case 'orbit':
                // Draw as a circle
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, proj.size / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'explosion':
                // Draw as expanding/contracting circle with transparency
                ctx.globalAlpha = 1 - (proj.elapsed / proj.duration);
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, proj.currentSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                break;
        }
    });
    
    // Draw XP orbs
    xpOrbs.forEach(orb => {
        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size / 2, 0, Math.PI * 2);
        ctx.fill();
    });
    
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

// Event Listeners
window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});

// Restart game when restart button is clicked
document.getElementById('restart').addEventListener('click', () => {
    document.getElementById('gameOver').style.display = 'none';
    init();
});

// Start the game when window loads
window.onload = init; 