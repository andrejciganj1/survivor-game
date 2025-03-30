// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to match window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Reset player position to center when resizing
    if (typeof player !== 'undefined' && player) {
        player.x = canvas.width / 2;
        player.y = canvas.height / 2;
    }
}

// Add resize event listener
window.addEventListener('resize', resizeCanvas);

// Initial canvas sizing without player repositioning
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Fullscreen functionality
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) { // Safari
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { // IE11
            document.documentElement.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE11
            document.msExitFullscreen();
        }
    }
}

// Game States
const GAME_STATE = {
    RUNNING: 0,
    PAUSED: 1,
    LEVEL_UP: 2,
    GAME_OVER: 3
};

// Game Variables
let gameState = {
    current: GAME_STATE.RUNNING
};
let lastTimestamp = 0;
let elapsedGameTime = 0;

// Make GAME_STATE accessible from other modules
window.GAME_STATE = GAME_STATE;

// Create player using the player module
let player = playerModule.createPlayer(canvas);

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

// Setup control event listeners
function setupControlEventListeners() {
    // Clean up any existing event listeners first
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    
    // Add new event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    console.log('Control event listeners set up');
}

// Key down handler
function handleKeyDown(e) {
    if (e.key in keys) {
        keys[e.key] = true;
    }
    
    // Debug: Give 100 XP when pressing 'e'
    if (e.key === 'e' && gameState.current === GAME_STATE.RUNNING) {
        player.xp += 100;
        playerModule.checkLevelUp(player, gameState, GAME_STATE);
        updateUI(player);
    }
    
    // Toggle pause when space is pressed
    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault(); // Prevent page scrolling
        
        console.log('Space pressed, current game state:', gameState.current);
        
        if (gameState.current === GAME_STATE.RUNNING) {
            // Pause the game
            gameState.current = GAME_STATE.PAUSED;
            console.log('Game paused, new state:', gameState.current);
            
            // Add blur and darken effect
            canvas.style.filter = 'blur(2px) brightness(0.7)';
        } else if (gameState.current === GAME_STATE.PAUSED) {
            // Unpause the game
            gameState.current = GAME_STATE.RUNNING;
            console.log('Game unpaused, new state:', gameState.current);
            
            // Remove effects
            canvas.style.filter = 'none';
        }
    }
}

// Key up handler
function handleKeyUp(e) {
    if (e.key in keys) {
        keys[e.key] = false;
    }
}

// Setup UI event listeners
function setupUIEventListeners() {
    // Restart game when restart button is clicked
    document.getElementById('restart').addEventListener('click', () => {
        document.getElementById('gameOver').style.display = 'none';
        init();
    });
    
    console.log('UI event listeners set up');
}

// Initialize game
function init() {
    // Reset game state
    gameState.current = GAME_STATE.RUNNING;
    elapsedGameTime = 0;
    
    // Reset player using the player module
    player = playerModule.resetPlayer(player, canvas);
    
    // Add starter weapon (chain lightning)
    playerModule.addWeapon(player, playerModule.WEAPON_TYPES.KNIFE);
    
    // Clear arrays
    enemies.length = 0;
    projectiles.length = 0;
    xpOrbs.length = 0;
    
    // Reset spawn rate
    enemySpawnRate = 1000;
    
    // Setup control event listeners
    setupControlEventListeners();
    
    // Update UI
    updateUI(player);
    
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

// Update projectiles
function updateProjectiles(deltaTime) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.elapsed += deltaTime;
        
        // Initialize hitEnemies array if it doesn't exist (for all projectile types)
        if (!proj.hitEnemies) {
            proj.hitEnemies = [];
        }
        
        // Remove expired projectiles
        if (proj.elapsed >= proj.duration) {
            // Handle deorbit enhancement for orbit weapons
            if (proj.type === 'orbit' && proj.enhancements && proj.enhancements.deorbit) {
                // Calculate the current angle of the orb's position relative to the player
                const angle = proj.baseAngle + proj.orbitSpeed * (proj.elapsed / 1000);
                
                // Calculate direction perpendicular to the orbit radius
                // For a circular orbit, the tangent direction is perpendicular to the radius
                // The radius direction is (cos(angle), sin(angle))
                // So the perpendicular direction is (-sin(angle), cos(angle))
                const dirX = -Math.sin(angle);
                const dirY = Math.cos(angle);
                
                projectiles.push({
                    x: proj.x,
                    y: proj.y,
                    dirX: dirX,
                    dirY: dirY,
                    speed: 300,
                    size: proj.size,
                    damage: proj.damage,
                    duration: 1000,
                    elapsed: 0,
                    color: proj.color,
                    type: 'orbit_projectile', // New type for deorbited orbs
                    weaponRef: proj.weaponRef,
                    enhancements: { isDeorbited: true }, // Mark as deorbited
                    hitEnemies: [] // Initialize empty hit enemies array
                });
            }
            
            projectiles.splice(i, 1);
            continue;
        }
        
        // Update position based on projectile type
        switch (proj.type) {
            case 'knife':
                proj.x += proj.dirX * proj.speed * (deltaTime / 1000);
                proj.y += proj.dirY * proj.speed * (deltaTime / 1000);
                break;
            case 'orbit_projectile': // Add new case for deorbited orbit projectiles
                proj.x += proj.dirX * proj.speed * (deltaTime / 1000);
                proj.y += proj.dirY * proj.speed * (deltaTime / 1000);
                break;
            case 'orbit':
                const angle = proj.baseAngle + proj.orbitSpeed * (proj.elapsed / 1000);
                proj.x = player.x + Math.cos(angle) * proj.orbitRadius;
                proj.y = player.y + Math.sin(angle) * proj.orbitRadius;
                break;
            case 'moon':
                // First update the parent orb's position
                if (proj.parentOrb) {
                    proj.moonAngle += proj.moonOrbitSpeed * (deltaTime / 1000);
                    proj.x = proj.parentOrb.x + Math.cos(proj.moonAngle) * proj.moonOrbitRadius;
                    proj.y = proj.parentOrb.y + Math.sin(proj.moonAngle) * proj.moonOrbitRadius;
                } else {
                    // If parent is gone, remove this moon
                    projectiles.splice(i, 1);
                }
                break;
            case 'explosion':
                // Explosion stays in place, just changes size
                const progress = proj.elapsed / proj.duration;
                const sizeMultiplier = Math.sin(progress * Math.PI); // Grow then shrink
                proj.currentSize = proj.size * sizeMultiplier;
                
                // Create aftershock when the primary explosion is almost done
                if (proj.enhancements && proj.enhancements.aftershock && 
                    proj.elapsed > proj.duration * 0.9 && !proj.aftershockSpawned) {
                    proj.aftershockSpawned = true;
                    
                    // Schedule the aftershock explosion after a delay
                    setTimeout(() => {
                        if (gameState.current === GAME_STATE.RUNNING) {
                            projectiles.push({
                                x: proj.x,
                                y: proj.y,
                                size: proj.size * 0.7,
                                damage: proj.damage * 0.5,
                                duration: proj.duration,
                                elapsed: 0,
                                color: '#f77', // Slightly different color
                                type: 'explosion',
                                weaponRef: proj.weaponRef,
                                enhancements: proj.enhancements && proj.enhancements.freeze ? { freeze: true } : {} // Safely initialize enhancements
                            });
                        }
                    }, 500);
                }
                break;
            case 'chainLightning':
                // Move lightning toward the target enemy
                if (proj.targetEnemy) {
                    // Calculate direction to target enemy
                    const dx = proj.targetEnemy.x - proj.x;
                    const dy = proj.targetEnemy.y - proj.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Check if we've hit the target enemy
                    if (distance < proj.size / 2 + proj.targetEnemy.width / 2) {
                        // We've hit the target!
                        
                        // Apply damage
                        proj.targetEnemy.health -= proj.damage;
                        
                        // Apply ionize enhancement if applicable
                        if (proj.enhancements && proj.enhancements.ionize) {
                            proj.targetEnemy.ionized = true;
                            proj.targetEnemy.ionizedDamageMultiplier = 1.5;
                            
                            // Clear ionized state after 3 seconds
                            setTimeout(() => {
                                if (enemies.includes(proj.targetEnemy)) {
                                    proj.targetEnemy.ionized = false;
                                    proj.targetEnemy.ionizedDamageMultiplier = 1;
                                }
                            }, 3000);
                        }
                        
                        // Add enemy to hit list
                        if (!proj.hitEnemies) {
                            proj.hitEnemies = [];
                        }
                        proj.hitEnemies.push(proj.targetEnemy);
                        
                        // Check if enemy died
                        if (proj.targetEnemy.health <= 0) {
                            // Increment kill count
                            player.kills++;
                            
                            // Drop XP orb
                            xpOrbs.push({
                                x: proj.targetEnemy.x,
                                y: proj.targetEnemy.y,
                                value: proj.targetEnemy.xpValue,
                                size: 10,
                                color: '#5ff'
                            });
                            
                            // Remove enemy
                            const index = enemies.indexOf(proj.targetEnemy);
                            if (index !== -1) {
                                enemies.splice(index, 1);
                            }
                            
                            // Update UI
                            updateUI(player);
                        }
                        
                        // Check if we have jumps left
                        if (proj.jumpsLeft > 0) {
                            // Find next target within range
                            let nearestEnemy = null;
                            let nearestDistance = proj.jumpRange; // Only consider enemies within jump range
                            
                            enemies.forEach(enemy => {
                                // Don't jump to enemies we've already hit
                                if (!proj.hitEnemies.includes(enemy)) {
                                    // Calculate distance from current hit enemy to next potential target
                                    // (not from projectile position)
                                    const jumpDx = enemy.x - proj.targetEnemy.x;
                                    const jumpDy = enemy.y - proj.targetEnemy.y;
                                    const jumpDistance = Math.sqrt(jumpDx * jumpDx + jumpDy * jumpDy);
                                    
                                    if (jumpDistance < nearestDistance) {
                                        nearestDistance = jumpDistance;
                                        nearestEnemy = enemy;
                                    }
                                }
                            });
                            
                            if (nearestEnemy) {
                                // Create a lightning "jump" projectile
                                const newProj = {
                                    // Start position is the current hit enemy, not the projectile position
                                    x: proj.targetEnemy.x,
                                    y: proj.targetEnemy.y,
                                    dirX: 0, // Will be set when tracking the enemy
                                    dirY: 0,
                                    targetEnemy: nearestEnemy,
                                    speed: proj.speed,
                                    size: proj.size,
                                    damage: proj.damage * proj.damageDecay, // Reduced damage for jumps
                                    jumpsLeft: proj.jumpsLeft - 1,
                                    jumpRange: proj.jumpRange,
                                    damageDecay: proj.damageDecay,
                                    duration: proj.duration,
                                    elapsed: 0,
                                    color: proj.color,
                                    type: 'chainLightning',
                                    weaponRef: proj.weaponRef,
                                    enhancements: { ...proj.enhancements },
                                    hitEnemies: [...proj.hitEnemies] // Copy hit enemies list
                                };
                                
                                // If we have fork enhancement, create a second branch if possible
                                if (proj.enhancements && proj.enhancements.fork) {
                                    // Find second nearest enemy within range
                                    let secondEnemy = null;
                                    let secondDistance = proj.jumpRange;
                                    
                                    enemies.forEach(enemy => {
                                        // Don't jump to enemies we've already hit or the first nearest
                                        if (!proj.hitEnemies.includes(enemy) && enemy !== nearestEnemy) {
                                            // Calculate distance from current hit enemy to potential fork target
                                            const jumpDx = enemy.x - proj.targetEnemy.x;
                                            const jumpDy = enemy.y - proj.targetEnemy.y;
                                            const jumpDistance = Math.sqrt(jumpDx * jumpDx + jumpDy * jumpDy);
                                            
                                            if (jumpDistance < secondDistance) {
                                                secondDistance = jumpDistance;
                                                secondEnemy = enemy;
                                            }
                                        }
                                    });
                                    
                                    if (secondEnemy) {
                                        // Create a second lightning fork projectile
                                        const forkProj = {
                                            // Start position is the current hit enemy, not the projectile position
                                            x: proj.targetEnemy.x,
                                            y: proj.targetEnemy.y,
                                            dirX: 0, // Will be set when tracking the enemy
                                            dirY: 0,
                                            targetEnemy: secondEnemy,
                                            speed: proj.speed,
                                            size: proj.size,
                                            damage: proj.damage * proj.damageDecay, // Reduced damage for jumps
                                            jumpsLeft: proj.jumpsLeft - 1,
                                            jumpRange: proj.jumpRange,
                                            damageDecay: proj.damageDecay,
                                            duration: proj.duration,
                                            elapsed: 0,
                                            color: proj.color,
                                            type: 'chainLightning',
                                            weaponRef: proj.weaponRef,
                                            enhancements: { ...proj.enhancements },
                                            hitEnemies: [...proj.hitEnemies] // Copy hit enemies list
                                        };
                                        
                                        projectiles.push(forkProj);
                                    }
                                }
                                
                                projectiles.push(newProj);
                            }
                        }
                        
                        // Remove the current lightning projectile
                        projectiles.splice(i, 1);
                    } else {
                        // Move toward target
                        const moveDist = Math.min(distance, proj.speed * (deltaTime / 1000));
                        const moveX = (dx / distance) * moveDist;
                        const moveY = (dy / distance) * moveDist;
                        
                        proj.x += moveX;
                        proj.y += moveY;
                    }
                } else {
                    // Target is gone, remove projectile
                    projectiles.splice(i, 1);
                }
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
            
            // Check level up using the player module
            playerModule.checkLevelUp(player, gameState, GAME_STATE);
            
            // Update XP UI
            updateUI(player);
            
            // Remove orb
            xpOrbs.splice(i, 1);
        }
    }
}

// Check collisions between projectiles and enemies
function checkProjectileEnemyCollisions() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        let projRemoved = false;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            // Skip frozen enemies for certain projectiles
            if (enemy.frozen && (proj.type === 'knife' || proj.type === 'orbit' || proj.type === 'moon')) {
                continue;
            }
            
            // Skip enemies already hit by this projectile (for any projectile type except explosion)
            if (proj.type !== 'explosion' && proj.hitEnemies && proj.hitEnemies.includes(enemy)) {
                continue;
            }
            
            let hitDetected = false;
            
            switch (proj.type) {
                case 'knife':
                case 'orbit_projectile':
                case 'orbit':
                case 'moon':
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
                // Add this enemy to the hit enemies list BEFORE enhancement effects
                if (!proj.hitEnemies) {
                    proj.hitEnemies = [];
                }
                
                // Don't add the enemy multiple times to the list
                if (!proj.hitEnemies.includes(enemy)) {
                    proj.hitEnemies.push(enemy);
                }
                
                // Calculate damage to apply
                let damageToApply = proj.damage;
                
                // Check for Overcharge enhancement for Chain Lightning
                if (proj.type === 'chainLightning' && proj.enhancements && proj.enhancements.overcharge) {
                    // 25% chance to do double damage
                    if (Math.random() < 0.25) {
                        damageToApply *= 2;
                        
                        // Visual indication of a critical hit
                        const critText = document.createElement('div');
                        critText.textContent = 'CRIT!';
                        critText.style.position = 'absolute';
                        critText.style.left = `${enemy.x}px`;
                        critText.style.top = `${enemy.y - 30}px`;
                        critText.style.color = '#ff0';
                        critText.style.fontWeight = 'bold';
                        critText.style.fontSize = '16px';
                        critText.style.textShadow = '0 0 5px #f00';
                        critText.style.pointerEvents = 'none';
                        document.body.appendChild(critText);
                        
                        // Animate and remove
                        let opacity = 1;
                        const fadeout = setInterval(() => {
                            opacity -= 0.05;
                            critText.style.opacity = opacity;
                            critText.style.top = `${parseFloat(critText.style.top) - 1}px`;
                            
                            if (opacity <= 0) {
                                clearInterval(fadeout);
                                document.body.removeChild(critText);
                            }
                        }, 30);
                    }
                }
                
                // Apply ionized damage multiplier if applicable
                if (enemy.ionized) {
                    damageToApply *= enemy.ionizedDamageMultiplier;
                }
                
                // Damage enemy
                enemy.health -= damageToApply;
                
                // Apply enhancement effects
                if (proj.enhancements) {
                    // Life steal (knife)
                    if (proj.enhancements.lifeSteal && proj.weaponRef) {
                        const healAmount = proj.damage * 0.2;
                        player.health = Math.min(player.maxHealth, player.health + healAmount);
                    }
                    
                    // Freeze enemies (explosion)
                    if (proj.enhancements.freeze && proj.type === 'explosion') {
                        if (enemy.health > 0) {  // Only freeze if they survive
                            enemy.frozen = true;
                            enemy.originalSpeed = enemy.speed;
                            enemy.speed = 0;
                            
                            // Unfreeze after 1 second
                            setTimeout(() => {
                                if (enemies.includes(enemy)) {
                                    enemy.frozen = false;
                                    enemy.speed = enemy.originalSpeed;
                                }
                            }, 1000);
                        }
                    }
                    
                    // Multiply (knife) - Create two more knives going in different directions
                    if (proj.enhancements.multiply && proj.type === 'knife' && !projRemoved) {
                        const angles = [Math.PI/4, -Math.PI/4];
                        
                        angles.forEach(offsetAngle => {
                            const angle = Math.atan2(proj.dirY, proj.dirX) + offsetAngle;
                            const newDirX = Math.cos(angle);
                            const newDirY = Math.sin(angle);
                            
                            projectiles.push({
                                x: proj.x,
                                y: proj.y,
                                dirX: newDirX,
                                dirY: newDirY,
                                speed: proj.speed * 0.8,
                                size: proj.size * 0.7,
                                damage: proj.damage * 0.5,
                                duration: proj.duration * 0.5,
                                elapsed: 0,
                                color: proj.color,
                                type: 'knife',
                                weaponRef: proj.weaponRef,
                                enhancements: { isMultiplied: true },
                                hitEnemies: [...proj.hitEnemies], // Copy the updated hitEnemies list including the current enemy
                                isMultiplied: true  // Mark as multiplied to prevent infinite multiplication
                            });
                        });
                    }
                }
                
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
                    updateUI(player);
                }
                
                // Remove projectile if it's a knife (without pierce) or moon
                if ((proj.type === 'knife' && proj.enhancements && !proj.enhancements.pierce) || proj.type === 'moon') {
                    if (!projRemoved) {
                        projectiles.splice(i, 1);
                        projRemoved = true;
                        break; // Break out of enemy loop since projectile is gone
                    }
                }
                // For knives with pierce, track hits and remove after hitting 3 enemies
                else if (proj.type === 'knife' && proj.enhancements && proj.enhancements.pierce) {
                    // Don't need to add the enemy again since we already did it at the start
                    
                    // Track total hit count
                    proj.hitCount = (proj.hitCount || 0) + 1;
                    if (proj.hitCount >= 3) {
                        projectiles.splice(i, 1);
                        projRemoved = true;
                        break;
                    }
                }
                // For orbit, orbit_projectile, and moon projectiles, don't need to track hit enemies again
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
                updateUI(player);
                
                // Check if player died
                playerModule.handlePlayerDeath(player, gameState, GAME_STATE);
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

// Update UI elements
function updateUI(player) {
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
        } else if (weapon.type.name === 'Chain Lightning') {
            // Add fallback values in case they're undefined
            const jumps = weapon.jumps !== undefined ? weapon.jumps : weapon.type.jumps;
            const jumpRange = weapon.jumpRange !== undefined ? weapon.jumpRange : weapon.type.jumpRange;
            const damageDecay = weapon.damageDecay !== undefined ? weapon.damageDecay : weapon.type.damageDecay;
            
            weaponDiv.innerHTML += `, Jumps ${jumps}, Range ${jumpRange}, SPD ${weapon.speed}`;
        }
        
        // Add enhancement information if any
        if (weapon.enhancementLevels && weapon.enhancementLevels.length > 0) {
            const enhancementsDiv = document.createElement('div');
            enhancementsDiv.style.paddingLeft = '15px';
            enhancementsDiv.style.fontSize = '0.9em';
            enhancementsDiv.style.color = '#aaf';
            enhancementsDiv.textContent = `Enhancements: ${weapon.enhancementLevels.join(', ')}`;
            weaponDiv.appendChild(enhancementsDiv);
        }
        
        weaponInfoDiv.appendChild(weaponDiv);
    });
}

// Make updateUI accessible from other modules
window.updateUI = updateUI;

// Main game loop
function gameLoop(timestamp) {
    // Calculate delta time
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // If game is paused for level up, only render and wait
    if (gameState.current === GAME_STATE.LEVEL_UP) {
        drawGame();
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // If game is paused, only draw and display a pause indicator
    if (gameState.current === GAME_STATE.PAUSED) {
        drawGame();
        
        // Draw pause indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '18px Arial';
        ctx.fillText('Press SPACE to resume', canvas.width / 2, canvas.height / 2 + 20);
        
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // If game is over, don't update
    if (gameState.current === GAME_STATE.GAME_OVER) {
        drawGame();
        return;
    }
    
    // Update game
    elapsedGameTime += deltaTime;
    playerModule.updatePlayerPosition(player, keys, deltaTime, canvas);
    updateEnemies(deltaTime);
    playerModule.fireWeapons(player, deltaTime, projectiles, enemies);
    updateProjectiles(deltaTime);
    updateXPOrbs(deltaTime);
    spawnEnemies(deltaTime);
    
    // Check collisions
    checkProjectileEnemyCollisions();
    checkPlayerEnemyCollisions(deltaTime);
    
    // Update UI each frame for real-time info
    updateUI(player);
    
    // Draw everything
    drawGame();
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Draw everything
function drawGame() {
    // Draw player
    playerModule.drawPlayer(player, ctx);
    
    // Draw enemies
    enemies.forEach(enemy => {
        // Draw enemy (with frozen overlay if frozen)
        if (enemy.frozen) {
            ctx.fillStyle = '#adf'; // Ice blue for frozen enemies
        } else {
            ctx.fillStyle = enemy.type.color;
        }
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
            case 'orbit_projectile': // Add drawing for deorbited orbs
                // Draw as a circle - same as orbit
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, proj.size / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'orbit':
                // Draw as a circle
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, proj.size / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'moon':
                // Draw as a smaller circle
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
            case 'chainLightning':
                // Draw lightning bolt - zigzag line to target
                if (proj.targetEnemy) {
                    ctx.save();
                    
                    // Start at current position
                    ctx.beginPath();
                    ctx.moveTo(proj.x, proj.y);
                    
                    // Calculate direction to target
                    const dx = proj.targetEnemy.x - proj.x;
                    const dy = proj.targetEnemy.y - proj.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Draw zigzag path with 4 segments
                    const segments = 4;
                    for (let i = 1; i <= segments; i++) {
                        // Calculate point along path
                        const t = i / segments;
                        const pointX = proj.x + dx * t;
                        const pointY = proj.y + dy * t;
                        
                        // Add randomness for zigzag effect, reducing as we get closer to the target
                        const zakFactor = 10 * (1 - t);
                        const offsetX = (Math.random() * 2 - 1) * zakFactor;
                        const offsetY = (Math.random() * 2 - 1) * zakFactor;
                        
                        // Don't offset the final point
                        if (i === segments) {
                            ctx.lineTo(pointX, pointY);
                        } else {
                            ctx.lineTo(pointX + offsetX, pointY + offsetY);
                        }
                    }
                    
                    // Set line style
                    ctx.strokeStyle = proj.color;
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    
                    // Draw glow effect
                    ctx.shadowColor = proj.color;
                    ctx.shadowBlur = 15;
                    
                    // Draw the lightning
                    ctx.stroke();
                    
                    // Draw a small circle at starting point
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                }
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
}

// Start the game when window loads
window.onload = function() {
    resizeCanvas(); // Ensure canvas is properly sized
    
    // Setup UI event listeners
    setupUIEventListeners();
    
    // Setup fullscreen button
    document.getElementById('fullscreenButton').addEventListener('click', toggleFullscreen);
    
    // Setup F key for fullscreen toggle
    window.addEventListener('keydown', function(e) {
        if (e.key === 'f' || e.key === 'F') {
            toggleFullscreen();
        }
    });
    
    // Listen for fullscreen change events (for when user exits with Escape key)
    document.addEventListener('fullscreenchange', resizeCanvas);
    document.addEventListener('webkitfullscreenchange', resizeCanvas); // Safari
    document.addEventListener('mozfullscreenchange', resizeCanvas); // Firefox
    document.addEventListener('MSFullscreenChange', resizeCanvas); // IE11
    
    init();
}; 