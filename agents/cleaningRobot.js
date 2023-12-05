// In this simple problem the world includes both the environment and the robot
// but in most problems the environment and world would be separate
class World {
  constructor(numFloors, perFloor) {
    this.location = 0;
    this.per_floor = perFloor;
    this.floors = [];
    for (let i = 0; i < numFloors; i++) {
      this.floors.push({ dirty: false });
    }
  }

  markFloorDirty(floorNumber) {
    this.floors[floorNumber].dirty = true;
  }

  simulate(action) {
    const location = this.location;
    const level = location / this.per_floor;
    const length = this.floors.length;
    const is_right = location % this.per_floor;
    const is_floor = level < 1;
    const is_roof =
      level <= (length - 1) / this.per_floor && level >= (length - this.per_floor) / this.per_floor;
    console.log(action, location, is_right, is_floor);
    switch (action) {
      case 'SUCK':
        this.floors[location].dirty = false;
        break;
      case 'LEFT':
        this.location = is_right ? location - 1 : location;
        break;
      case 'RIGHT':
        this.location = is_right ? location : location + 1;
        break;
      case 'DOWN':
        this.location = is_floor ? location : location - 2;
        break;
      case 'UP':
        this.location = is_roof ? location : location + 2;
        break;
    }

    return action;
  }
}

// Rules are defined in data, in a table indexed by [location][dirty]
function tableVacuumAgent(world, table) {
  let location = world.location;
  let dirty = world.floors[location].dirty ? 1 : 0;
  return table[location][dirty];
}
