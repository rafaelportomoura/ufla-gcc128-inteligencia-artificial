/* The general structure is to put the AI code in xyz.js and the visualization
   code in c_xyz.js. Create a diagram object that contains all the information
   needed to draw the diagram, including references to the environment&agents.
   Then use a draw function to update the visualization to match the data in
   the environment & agent objects. Use a separate function if possible for 
   controlling the visualization (whether through interaction or animation). 
   Chapter 2 has minimal AI and is mostly animations. */

const SIZE = 100;
const STEP_TIME_MS = 3000;
const PER_FLOOR = 2;

const colors = {
  perceptBackground: 'hsl(240,10%,85%)',
  perceptHighlight: 'hsl(60,100%,90%)',
  actionBackground: 'hsl(0,0%,100%)',
  actionHighlight: 'hsl(150,50%,80%)',
};

const yPosition = (floorNumber) => (floorNumber > 1 ? SIZE * 1.5 : SIZE * 3.5);
const yRobotPosition = (floorNumber) => yPosition(floorNumber) - SIZE * 1.1;
const xPosition = (floorNumber) => 150 + ((floorNumber % 2) * 600) / PER_FLOOR;
/* Create a diagram object that includes the world (model) and the svg
      elements (view) */
function makeDiagram(selector) {
  let diagram = {},
    world = new World(4, PER_FLOOR);
  diagram.world = world;
  diagram.root = d3.select(selector);

  const robot_X = xPosition(world.location);
  const robot_Y = yPosition(world.location);

  console.log(world.location, robot_Y);
  diagram.robot = diagram.root
    .append('g')
    .attr('class', 'robot')
    .style('transform', `translate(${robot_X}px,${robot_Y}px)`);
  diagram.robot
    .append('rect')
    .attr('width', SIZE)
    .attr('height', SIZE)
    .attr('fill', 'hsl(120,25%,50%)');
  diagram.perceptText = diagram.robot
    .append('text')
    .attr('x', SIZE / 2)
    .attr('y', -25)
    .attr('text-anchor', 'middle');
  diagram.actionText = diagram.robot
    .append('text')
    .attr('x', SIZE / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle');

  diagram.floors = [];
  for (let floorNumber = 0; floorNumber < world.floors.length; floorNumber++) {
    diagram.floors[floorNumber] = diagram.root
      .append('rect')
      .attr('class', 'clean floor') // for css
      .attr('x', xPosition(floorNumber))
      .attr('y', yPosition(floorNumber))
      .attr('width', SIZE)
      .attr('height', SIZE / 4)
      .attr('stroke', 'black')
      .on('click', function () {
        world.markFloorDirty(floorNumber);
        diagram.floors[floorNumber].attr('class', 'dirty floor');
      });
  }
  return diagram;
}

/* Rendering functions read from the state of the world (diagram.world) 
      and write to the state of the diagram (diagram.*). For most diagrams
      we only need one render function. For the vacuum cleaner example, to
      support the different styles (reader driven, agent driven) and the
      animation (agent perceives world, then pauses, then agent acts) I've
      broken up the render function into several. */

function renderWorld(diagram) {
  for (let floorNumber = 0; floorNumber < diagram.world.floors.length; floorNumber++) {
    diagram.floors[floorNumber].attr(
      'class',
      diagram.world.floors[floorNumber].dirty ? 'dirty floor' : 'clean floor'
    );
  }
  diagram.robot.style(
    'transform',
    `translate(${xPosition(diagram.world.location)}px,${yRobotPosition(diagram.world.location)}px)`
  );
}

function renderAgentPercept(diagram, dirty) {
  let perceptLabel = { false: "It's clean", true: "It's dirty" }[dirty];
  diagram.perceptText.text(perceptLabel);
}

function renderAgentAction(diagram, action) {
  let actionLabel = {
    null: 'Waiting',
    SUCK: 'Vacuuming',
    LEFT: 'Going left',
    RIGHT: 'Going right',
    UP: 'Going up',
    DOWN: 'Going down',
    ERROR: 'ERROR',
  }[action];
  diagram.actionText.text(actionLabel);
}

/* Control the diagram by letting the reader choose the rules that
      the AI agent should follow. The animation flow is similar to the
      first agent controlled diagram but there is an additional table
      UI that lets the reader view the percepts and actions being followed
      as well as change the rules followed by the agent. */
function makeTableControlledDiagram() {
  let diagram = makeDiagram('#table-controlled-diagram svg');

  function update() {
    let table = getRulesFromPage();
    let location = diagram.world.location;
    let percept = diagram.world.floors[location].dirty;
    let action = tableVacuumAgent(diagram.world, table);
    diagram.world.simulate(action);
    renderWorld(diagram);
    renderAgentPercept(diagram, percept);
    renderAgentAction(diagram, action);
    showPerceptAndAction(location, percept, action);
  }
  update();
  setInterval(update, STEP_TIME_MS);

  function getRulesFromPage() {
    let table = d3.select('#table-controlled-diagram table');

    const rules = [];

    for (let i = 0; i < diagram.world.floors.length; i++) {
      rules.push([
        table.select(`[data-action="${i}-clean"] select`).node().value,
        table.select(`[data-action="${i}-dirty"] select`).node().value,
      ]);
    }

    return rules;
  }

  function showPerceptAndAction(location, percept, action) {
    let locationMarker = String(location);
    let perceptMarker = percept ? 'dirty' : 'clean';

    d3.selectAll('#table-controlled-diagram th')
      .filter(function () {
        let marker = d3.select(this).attr('data-input');
        return marker === perceptMarker || marker === locationMarker;
      })
      .style('background-color', (d) => colors.perceptHighlight);

    d3.selectAll('#table-controlled-diagram td')
      .style('padding', '5px')
      .filter(function () {
        let marker = d3.select(this).attr('data-action');
        return marker === locationMarker + '-' + perceptMarker;
      })
      .transition()
      .duration(0.05 * STEP_TIME_MS)
      .style('background-color', colors.actionHighlight)
      .transition()
      .duration(0.9 * STEP_TIME_MS)
      .style('background-color', colors.actionBackground);
  }
}

makeTableControlledDiagram();
