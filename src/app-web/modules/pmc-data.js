import { Graph, alg as GraphAlg, json as GraphJSON } from '@dagrejs/graphlib';
import { cssinfo, cssreset, cssdata } from './console-styles';
import DEFAULTS from './defaults';
import UR from '../../system/ursys';

const { CoerceToPathId, CoerceToEdgeObj } = DEFAULTS;

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @module PMCData
 * @desc
 * A centralized data manager for graph data consisting of MEME properties and
 * mechanisms. Also provides derived structures used for building view models
 * for the user interface.
 *
 * NOTE: `nodeId` (used by graphlib natively) corresponds to a PMC Property
 * `propId` and visual prop `vpropId`. They all map to the same value
 * NODE: `edgeObj` (used by graphlib natively) contains two nodeIds that
 * collectively refer to a particular PMC Mechanism `mechId`. See below for
 * more info about the data structure.
 *
 * The model, viewmodel, and view data elements all use the same kinds of id.
 * For properties and components, a string `nodeId` is used. For mechanisms
 * connecting properties, a string `pathId` consisting of the form
 * `sourcetNodeId:targetNodeId` is used internally. However, mechanism-related
 * API methods also accept dagres/graphlib's native `edgeObj` and `w,v`
 * syntax as well.
 *
 * ADDITIONAL NOTES FROM BEN (WIP):
 *
 * resourceItems -- resourceItems refer to the information resources, such as
 * simulations and reports, that students use as evidence for their models.
 * They are considered "facts" rather than "interpretations", so they are not
 * in themselves considered evidence until some connection is made to a model.
 * The interpreation is embodied by the evidence link.
 * `referenceLabel` is the human-readable footnote-like reference number for the
 * resource.  e.g. this way you can refer to "resource 1".
 *
 * evidenceLink -- evidenceLinks are core objects that connect components or
 * properties or mechanisms to resources.  There may be multiple connections
 * between any component/property/mechanism and any resourceItem.  The
 * structure is:
 *  `{ evId: 'ev1', propId: 'a', mechId: 'a', rsrcId: 'rs1', note: 'fish need food' })`
 * where `evId` is the evidenceLink id
 *       `propId` is the property id
 *       `mechId` is the mechanism id, e.g. 'ammonia:fish'
 *       `rsrcId` is the resourceItem id
 *       `note` is a general text field for the student to enter an explanation
 * Since an evidence link can be connected either a prop or a mechanism, the
 * one not used just remains undefined.
 *
 * @example TO USE MODULE
 * import PMCData from `../modules/pmc-data`;
 * console.log(PMCData.Graph())
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PMCData = {};

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// MODEL /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_graph; // dagresjs/graphlib instance
let a_props = []; // all properties (strings)
let a_mechs = []; // all mechanisms (pathId strings)
//
let a_components = []; // top-level props with no parents
let h_children = new Map(); // children hash of each prop by id
let h_outedges = new Map(); // outedges hash of each prop by id
//
let a_resource = [];  /*/ all resource objects to be displayed in InformationList
                          a_resource = [
                            {
                              rsrcId: '1',
                              label: 'Food Rot Simulation',
                              notes: ['water quality', 'food rotting'],
                              type: 'simulation',
                              url: '../static/dlc/FishSpawn_Sim_5_SEEDS_v7.html',
                              links: 0
                            }
                          ]
                      /*/
let a_evidence = []; /*/ An array of prop-related evidence links.
                          This is the master list of evidence links.

                          [ evidenceLink,... ]
                          [ {eid, propId, rsrcId, note},... ]

                          a_evidence.push({ eid: '1', propId: 'a', rsrcId: '1', note: 'fish need food' });

                      /*/
let h_evidenceByProp = new Map(); /*/
                          Hash table of an array of evidence links related
                          to a property id, and grouped by property id.

                          Used by class-vprop when displaying
                          the list of evidenceLink badges for each prop.

                          {propId: [{evId, propId, rsrcId, note},
                                    {evId, propId, rsrcId, note},
                                ...],
                          ...}
                      /*/
let h_evlinkByResource = new Map();  /*/
                          Used by EvidenceList to look up all evidence related to a resource
                      /*/
let h_evidenceByMech = new Map(); // links to evidence by mechanism id
let h_propByResource = new Map(); /*/
                          Hash table to look up an array of property IDs related to
                          a specific resource.

                          Used by InformationList to show props related to each resource.

                          {rsrcId: [propId1, propId2,...],... }
                      /*/
let h_mechByResource = new Map(); // calculated links to mechanisms by evidence id

/// VIEWMODEL /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const map_vprops = new Map(); // our property viewmodel data stored by id
const map_vmechs = new Map(); // our mechanism viewmodel data stored by pathid
const map_vbadges = new Map(); // our evidence badge viewmodel data stored by evId
const selected_vprops = new Set();
const selected_vmechs = new Set();

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: DATASTORE:
 * Returns the raw object database, which is an instance of Graphlib
 * @returns {Graph} - GraphlibJS object
 * @example
 * const model = PMCData.Graph();
 * const edges = model.edges();
 * console.log(`there are ${edges.length} edges in the graph!`);
 */
PMCData.Graph = () => {
  return m_graph;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.DATASTORE:
 * Loads GraphLib data into data store (currently hardcoded)
 * @param {string} uri - (unimplemented) URI pointing to browser-accessible JSON-formatted data file
 */
PMCData.LoadGraph = uri => {
  const g = new Graph({ directed: true, compound: true, multigraph: true });

  // /// g.setNode('a', { name: 'a node' });
  // g.setNode('a', { name: 'a node' });
  // g.setNode('b', { name: 'b node' });
  // g.setNode('c', { name: 'c node' });
  // g.setNode('d', { name: 'd node' });
  // g.setNode('e', { name: 'e node' });
  // g.setNode('f', { name: 'f node' });
  // g.setNode('g', { name: 'g node' });
  // g.setNode('x', { name: 'x node' });
  // g.setNode('y', { name: 'y node' });
  // g.setNode('z', { name: 'z node' });
  // /// g.setParent('a','b')
  // g.setParent('a', 'b');
  // g.setParent('c', 'd');
  // g.setParent('e', 'd');
  // g.setParent('f', 'd');
  // g.setParent('g', 'a');
  // g.setParent('y', 'd');
  // /// g.setEdge('a', 'b', { name: 'a-b' });
  // g.setEdge('z', 'x', { name: 'zexxxxy!' });
  // g.setEdge('g', 'd', { name: 'alpha>' });
  // g.setEdge('y', 'z', { name: 'datum' });
  // g.setEdge('a', 'g', { name: 'atog' });

  // // define evidence mapping: propID => evIDArray
  // a_evidence.push({ evId: '1', propId: 'a', rsrcId: '1', note: 'fish need food' });
  // a_evidence.push({ evId: '2', propId: 'b', rsrcId: '2', note: 'fish cant live in dirty water' });
  // a_evidence.push({ evId: '3', propId: 'b', rsrcId: '3', note: 'fish heads' });
  // a_evidence.push({ evId: '4', propId: 'g', rsrcId: '2', note: 'fish fish fish' });
  // a_evidence.push({ evId: '5', propId: 'g', rsrcId: '5', note: 'fishy fishy fishy' });
  // a_evidence.push({ evId: '6', propId: 'g', rsrcId: '1', note: 'fish cant live in dirty water' });
  // a_evidence.push({ evId: '7', propId: 'y', rsrcId: '1', note: 'fish poop in water' });
  // a_evidence.push({ evId: '8', propId: 'z', rsrcId: '1', note: 'fish food rots' });

  /**
   *    Student Examples
   *
   *    These are four examples of student work based on student sketches.
   *    To use them, first comment out the nodes above that you're not interested in,
   *    then uncomment the section below that you ARE interested in and save to reload.
   *
   */

  // Tutoring Study Pilot
  // Very Simple Graph for Testing Evidence Links
  g.setNode('title', { name: 'What do fish need to live in a tank?' });

  g.setNode('tank', { name: 'tank' });
  g.setNode('fish', { name: 'fish' });
  g.setNode('food', { name: 'food' });
  g.setNode('ammonia', { name: 'Ammonia' });
  g.setNode('clean-water', { name: 'clean water' });
  g.setNode('dirty-water-waste', { name: 'waste' });

  g.setParent('dirty-water-waste', 'tank');
  g.setParent('clean-water', 'tank');

  g.setEdge('fish', 'tank', { name: 'live in' });
  g.setEdge('fish', 'food', { name: 'eat' });
  g.setEdge('fish', 'dirty-water-waste', { name: 'produce' });

  // define evidence mapping: propID => evIDArray
  a_evidence.push({ evId: 'ev1', propId: "fish", mechId: undefined, rsrcId: 'rs1', note: 'fish need food' });
  a_evidence.push({ evId: 'ev2', propId: undefined, mechId: 'fish:food', rsrcId: 'rs1', note: 'fish need food' });

  // // 3.5.19 sample model for group 3.pdf
  // // Sample for Group 3
  // g.setNode('title', { name: 'Sample for Group 3' });
  // g.setNode('foxes', { name: 'Fox' });
  // g.setNode('foxes-amount', { name: 'amount' });
  // g.setNode('rabbit', { name: 'Rabbit' });
  // g.setNode('rabbit-furcolor', { name: 'fur color' });
  // g.setNode('rabbit-amount', { name: 'amount' });
  // g.setNode('rabbits', { name: 'Rabbits' });
  // g.setNode('rabbits-furcolor', { name: 'fur color' });
  // g.setNode('plants', { name: 'Thicket' });
  // g.setNode('bacteria', { name: 'Bacteria?' });
  // g.setNode('oldage', { name: 'Old age?' });
  // g.setNode('properties', { name: 'Make sure to talk properties' });
  // g.setParent('foxes-amount', 'foxes');
  // g.setParent('rabbit-furcolor', 'rabbit');
  // g.setParent('rabbit-amount', 'rabbit');
  // g.setParent('rabbits-furcolor', 'rabbits');
  // g.setEdge('foxes', 'rabbit', { name: 'eat' });
  // g.setEdge('rabbit', 'rabbits', { name: 'tries to hide' });
  // g.setEdge('rabbits', 'plants', { name: 'hiding' });

  // 3.5.19 Day 1 Group 4 sample model.pdf
  // // Sample for Group 4
  // g.setNode('title', { name: 'Sample for Group 4' });
  // g.setNode('foxes', { name: 'Foxes' });
  // g.setNode('foxes-amount', { name: 'amount: 2' });
  // g.setNode('rabbits', { name: 'Rabbits' });
  // g.setNode('rabbits-amount', { name: 'amount: 20' });
  // g.setNode('plants', { name: 'Plants' });
  // g.setNode('forest', { name: 'Forest' });
  // g.setParent('foxes-amount', 'foxes');
  // g.setParent('rabbits-amount', 'rabbits');
  // g.setEdge('foxes', 'rabbits', { name: 'eat' });
  // g.setEdge('rabbits', 'plants', { name: 'eat' });
  // g.setEdge('forest', 'foxes', { name: 'live in' });
  // g.setEdge('forest', 'rabbits', { name: 'live in' });

  // day2_group4_model_02.JPG
  // Sample for Group 3
  // g.setNode('title', { name: 'Day 2 Group 4 Model 2: "Food Water Cleaning System' });
  // g.setNode('ammonia', { name: 'Ammonia' });
  // g.setNode('dirty-water', { name: 'dirty water' });
  // g.setNode('dirty-water-waste', { name: 'waste' });
  // g.setNode('dirty-water-algee', { name: 'algee' });
  // g.setNode('tank', { name: 'big enough fish tank' });
  // g.setNode('fish', { name: 'fish' });
  // g.setNode('food', { name: 'food' });
  // g.setNode('rotting-food', { name: 'rotting food' });
  // g.setNode('cleaning', { name: 'cleaning system?' });
  // g.setNode('clean-water', { name: 'clean water' });

  // g.setParent('dirty-water-waste', 'dirty-water');
  // g.setParent('dirty-water-algee', 'dirty-water');

  // g.setEdge('ammonia', 'fish', { name: 'death' });
  // g.setEdge('fish', 'ammonia', { name: 'makes' });
  // g.setEdge('fish', 'dirty-water', { name: 'waste' });
  // g.setEdge('dirty-water', 'fish', { name: 'death' });
  // g.setEdge('tank', 'fish', { name: 'live in' });
  // g.setEdge('fish', 'food', { name: 'eat' });
  // g.setEdge('food', 'rotting-food', { name: '' });
  // g.setEdge('cleaning', 'clean-water', { name: 'clean' });
  // g.setEdge('clean-water', 'fish', { name: 'live in' });
  // g.setEdge('rotting-food', 'clean-water', { name: 'if rots can also make dirty' });
  // // define evidence mapping: propID => evIDArray
  // a_evidence.push({ evId: 'ev1', propId: 'food', rsrcId: 'rs1', note: 'fish need food' });
  // a_evidence.push({ evId: 'ev7', propId: 'food', rsrcId: 'rs2', note: 'fish die without food' });
  // a_evidence.push({ evId: 'ev2', propId: 'clean-water', rsrcId: 'rs2', note: 'fish cant live in dirty water' });
  // a_evidence.push({ evId: 'ev3', propId: 'rotting-food', rsrcId: 'rs1', note: 'fish food rots' });
  // a_evidence.push({ evId: 'ev4', propId: 'ammonia', rsrcId: 'rs1', note: 'ammonia causes fish to die' });
  // a_evidence.push({
  //   evId: 'ev5',
  //   propId: undefined,
  //   mechId: 'ammonia:fish',
  //   rsrcId: 'rs1',
  //   note:
  //     'ammonia causes fish to die. This is a really long explanation so that we can test how the text wraps.'
  // });
  // a_evidence.push({ evId: 'ev6', propId: undefined, mechId: 'ammonia:fish', rsrcId: 'rs2', note: 'ammonia causes fish to die' });

  // // 3.5.19 Day 1 Group 3 Brainstomring list and Final Model.pdf
  // g.setNode('title', { name: 'Day 1 Group 3 Brainstorming List' });
  // g.setNode('fish', { name: 'Fish' });
  // g.setNode('fish-how-many', { name: 'how many' });
  // g.setNode('fish-how-big', { name: 'how big' });
  // g.setNode('fish-camo', { name: 'camo' });
  // g.setNode('fish-how-healthy', { name: 'how healthy' });
  // g.setNode('food', { name: 'food' });
  // g.setNode('aquarium', { name: 'aquarium' });
  // g.setNode('water-type', { name: 'water type' });
  // g.setNode('water-how-clean', { name: 'how clean water is' });
  // g.setNode('aquarium-setup', { name: 'setup' });
  // g.setNode('aquarium-space', { name: 'space in aquarium' });
  // /**
  //  * Comment out the setParents to show graph as students originally drew it
  //  * The setParents reworks the items as propoerties of fish and aquarium
  //  *  */
  // // g.setParent('fish-how-big', 'fish');
  // // g.setParent('fish-how-many', 'fish');
  // // g.setParent('fish-camo', 'fish');
  // // g.setParent('fish-how-healthy', 'fish');
  // // g.setParent('water-type', 'aquarium');
  // // g.setParent('aquarium-setup', 'aquarium');
  // // g.setParent('aquarium-space', 'aquarium');
  // // g.setParent('water-how-clean', 'water-type');
  // g.setEdge('fish', 'fish-how-big', { name: '' });
  // g.setEdge('fish', 'fish-how-many', { name: '' });
  // g.setEdge('fish', 'fish-camo', { name: 'what type' });
  // g.setEdge('fish', 'fish-how-healthy', { name: '' });
  // g.setEdge('fish', 'food', { name: '' });
  // g.setEdge('fish', 'aquarium', { name: 'Live in it' });
  // g.setEdge('fish-how-big', 'aquarium-space', { name: '' });
  // g.setEdge('fish-how-healthy', 'fish-how-many', { name: '' });
  // g.setEdge('fish-how-healthy', 'food', { name: '' });
  // g.setEdge('fish-how-healthy', 'water-how-clean', { name: '' });
  // g.setEdge('fish-how-healthy', 'aquarium-setup', { name: '' });
  // g.setEdge('fish-how-healthy', 'aquarium-space', { name: '' });
  // g.setEdge('food', 'water-type', { name: 'stays at top or rot' });
  // g.setEdge('water-how-clean', 'fish', { name: 'how long they live could depend on this' });
  // g.setEdge('aquarium', 'water-type', { name: 'water in aquarium' });
  // g.setEdge('aquarium', 'aquarium-setup', { name: '' });
  // g.setEdge('aquarium', 'aquarium-space', { name: '' });
  // g.setEdge('water-type', 'water-how-clean', { name: '' });
  // g.setEdge('water-type', 'aquarium-space', { name: 'more or less water purifier' });
  // g.setEdge('aquarium-setup', 'aquarium-space', { name: 'more or less decoration depends on size' });


  /***************************************************************************/

  /**
   *    Resources
   *
   *    Currently resources use a placeholder screenshot as the default image.
   *    (Screenshot-creation and saving have not been implemented yet).
   *
   */
  a_resource = [
    {
      rsrcId: 'rs1',
      referenceLabel: '1',
      label: 'Fish in a Tank Simulation',
      notes: 'water quality and fish deaths over time',
      type: 'simulation',
      url: '../static/dlc/FishinaTank.html',
      links: 0
    },
    {
      rsrcId: 'rs2',
      referenceLabel: '2',
      label: 'Raj\'s forum post.',
      notes: 'Forum post about fish deaths',
      type: 'report',
      url: '../static/dlc/RajForumPost.pdf',
      links: 0
    },
    {
      rsrcId: 'rs3',
      referenceLabel: '3',
      label: 'Autopsy Report',
      notes: 'Fighting?',
      type: 'report',
      url: '../static/dlc/VetReport.pdf',
      links: 0
    },
    {
      rsrcId: 'rs4',
      referenceLabel: '4',
      label: 'Fish Starving Simulation',
      notes: 'food and fish population',
      type: 'simulation',
      url: '../static/dlc/FishStarving.html',
      links: 0
    },
    {
      rsrcId: 'rs5',
      referenceLabel: '5',
      label: 'Ammonia Testing',
      notes: 'Ammonia Testing and Water Quality',
      type: 'report',
      url: '../static/dlc/AmmoniaTesting.pdf',
      links: 0
    },
    {
      rsrcId: 'rs6',
      referenceLabel: '6',
      label: 'Fish Fighting Simulation',
      notes: 'fighting, fish death',
      type: 'simulation',
      url: '../static/dlc/FishFighting.html',
      links: 0
    },
    {
      rsrcId: 'rs7',
      referenceLabel: '7',
      label: 'Food Rot Simulation',
      notes: 'rotting, waste, fish death',
      type: 'simulation',
      url: '../static/dlc/FoodRot.html',
      links: 0
    },
    {
      rsrcId: 'rs8',
      referenceLabel: '8',
      label: 'Ammonia in Tanks Report',
      notes: 'Ammonia, Research',
      type: 'report',
      url: '../static/dlc/AmmoniaInTanks.pdf',
      links: 0
    },
    {
      rsrcId: 'rs9',
      referenceLabel: '9',
      label: 'Fish Simulation With All Variables',
      notes: 'ammonia, waste, death, food, rotting, aggression, filter',
      type: 'simulation',
      url: '../static/dlc/FishAllVariables.html',
      links: 0
    }
  ];

  /***************************************************************************/
  // test serial write out, then serial read back in
  const cleanGraphObj = GraphJSON.write(g);
  const json = JSON.stringify(cleanGraphObj);
  m_graph = GraphJSON.read(JSON.parse(json));
  PMCData.BuildModel();
}; // LoadGraph()

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Builds the PROPS, MECHS, COMPONENTS, CHILDREN, and OUTEDGES lists
 *  from the raw GraphLibJS data store.
 */
PMCData.BuildModel = () => {
  // test graphlib
  a_props = m_graph.nodes(); // returns node ids
  a_mechs = m_graph.edges(); // returns edgeObjects {v,w}
  a_components = [];
  h_children = new Map(); // property children
  h_outedges = new Map(); // outedges for each prop
  /*/
   *  a_components is an array of ids of top-level props
   *  h_children maps prop ids to arrays of ids of child props,
   *  including children of children
   *  h_outedges maps all the outgoing edges for a node
  /*/
  a_props.forEach(n => {
    const p = m_graph.parent(n);
    if (!p) {
      a_components.push(n);
    }
    //
    const children = m_graph.children(n);
    let arr = h_children.get(n);
    if (arr) arr.push.apply(children);
    else h_children.set(n, children);
    //
    const outedges = m_graph.outEdges(n); // an array of edge objects {v,w,name}
    arr = h_outedges.get(n) || [];
    outedges.forEach(key => {
      arr.push(key.w);
    });
    h_outedges.set(n, arr);
  });

  /*/
   *  Update h_evidenceByProp table
  /*/
  h_evidenceByProp = new Map();
  a_evidence.forEach(ev => {
    if (ev.propId === undefined) return; // Not a prop ev link
    let evidenceLinkArray = h_evidenceByProp.get(ev.propId);
    if (evidenceLinkArray === undefined) evidenceLinkArray = [];
    if (!evidenceLinkArray.includes(ev.propId)) evidenceLinkArray.push(ev);
    h_evidenceByProp.set(ev.propId, evidenceLinkArray);
  });

  /*/
   *  Update h_evidenceByMech table
  /*/
  h_evidenceByMech = new Map();
  a_evidence.forEach(ev => {
    let mechId = ev.mechId;
    if (mechId === undefined) return; // not a mech ev link
    let evidenceLinkArray = h_evidenceByMech.get(mechId); // any existing?
    if (evidenceLinkArray === undefined) evidenceLinkArray = []; // new
    if (!evidenceLinkArray.includes(mechId)) evidenceLinkArray.push(ev);
    h_evidenceByMech.set(mechId, evidenceLinkArray);
  });

  /*/
   *  Update h_propByResource lookup table to
   *  look up props that are linked to a particular piece of evidence
  /*/
  h_propByResource = new Map();
  h_evidenceByProp.forEach((evArr, propId) => {
    if (evArr) {
      evArr.forEach(ev => {
        let propIds = h_propByResource.get(ev.rsrcId);
        if (propIds === undefined) propIds = [];
        if (!propIds.includes(propId)) propIds.push(propId);
        h_propByResource.set(ev.rsrcId, propIds);
      });
    }
  });

  /*/
   *  Update h_propByResource lookup table to
   *  look up props that are linked to a particular piece of evidence
  /*/
  h_mechByResource = new Map();
  h_evidenceByMech.forEach((evArr, mechId) => {
    if (evArr) {
      evArr.forEach(ev => {
        let mechIds = h_mechByResource.get(ev.rsrcId);
        if (mechIds === undefined) mechIds = [];
        if (!mechIds.includes(mechId)) mechIds.push(mechId);
        h_mechByResource.set(ev.rsrcId, mechIds);
      });
    }
  });

  /*/
   *  Used by EvidenceList to look up all evidence related to a resource
  /*/
  h_evlinkByResource = new Map();
  a_resource.forEach(resource => {
    let evlinkArray = a_evidence.filter(evlink => evlink.rsrcId === resource.rsrcId);
    if (evlinkArray === undefined) evlinkArray = [];
    h_evlinkByResource.set(resource.rsrcId, evlinkArray);
  });


  /*/
   *  Now update all evidence link counts
  /*/
  a_resource.forEach(resource => {
    let props = h_propByResource.get(resource.rsrcId);
    if (props) {
      resource.links = props.length;
    } else {
      resource.links = 0;
    }
    let mechs = h_mechByResource.get(resource.rsrcId);
    if (mechs) {
      resource.links += mechs.length;
    }
  });

  UR.Publish('DATA_UPDATED');

  if (!DBG) return;
  console.groupCollapsed('%cBuildModel()%c Nodes and Edges', cssinfo, cssreset);
  console.log(`arry a_components`, a_components);
  console.log(`hash h_children`, h_children);
  console.log(`hash h_outedges`, h_outedges);
  console.groupEnd();
};

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Return array of all the properties of the PMC model. Note that a PMC
 *  component is just a property that isn't a child of any other property.
 *  @returns {array} - array of nodeId strings
 */
PMCData.AllProps = () => {
  return a_props;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Return array of all the mechanisms of the PMC model.
 *  @returns {array} - array of pathId strings "sourceid:targetid"
 */
PMCData.AllMechs = () => {
  return a_mechs;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Return array of all the components of the PMC model. Note that a PMC
 *  component is just a property (node) that isn't a child of another property.
 *  @returns {array} - array of nodeId strings
 */
PMCData.Components = () => {
  return a_components;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Return array of all the children.
 *  @param {string} nodeId - the nodeId that might have children
 *  @returns {array} - an array of nodeId strings, or empty array
 */
PMCData.Children = nodeId => {
  return h_children.get(nodeId) || [];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Returns TRUE if the passed nodeId exists in the graph data store
 *  @param {string} nodeId - the nodeId to test
 *  @returns {boolean} - true if the nodeId exists
 */
PMCData.HasProp = nodeId => {
  return m_graph.hasNode(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Returns TRUE if the passed edge exists. This function can accept one of
 *  three formats: an edgeObject, a pathId, or a source/target pair of nodeId strings
 *  @param {object|string} evo - edgeObj {w,v}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop
 *  @returns {boolean} - true if the the edge exists
 */
PMCData.HasMech = (evo, ew) => {
  const eobj = CoerceToEdgeObj(evo, ew);
  return m_graph.hasEdge(eobj);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed nodeId string, returns the requested property object.
 *  This object is not a copy, so changing its properties will change the
 *  underlying data. If it the requested nodeId doesn't exist, an error is
 *  thrown.
 *  @param {string} nodeId - the nodeId you want
 *  @returns {object} - the property object
 */
PMCData.Prop = nodeId => {
  const prop = m_graph.node(nodeId);
  if (prop) return prop;
  throw Error(`no prop with id '${nodeId}' exists`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed edge selector, returns the requested mechanism object.
 *  This object is not a copy, so changing it will change the
 *  underlying data. If it the requested edge doesn't exist, an error is
 *  thrown.
 *
 *  This function can accept one of three formats: an edgeObject, a pathId,
 *  or a source/target pair of nodeId strings.
 *  @param {object|string} evo - edgeObj {w,v}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop
 */
PMCData.Mech = (evo, ew) => {
  const eobj = CoerceToEdgeObj(evo, ew);
  return m_graph.edge(eobj);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns an object containing added, updated, removed arrays
 *  containing nodeId strings
 *  @return {object} - object { added, updated, removed }
 */
PMCData.VM_GetVPropChanges = () => {
  // remember that a_props is an array of string ids, not objects
  // therefore the returned arrays have values, not references! yay!
  const added = [];
  const updated = [];
  const removed = [];
  // find what matches and what is new
  a_props.forEach(id => {
    if (map_vprops.has(id)) updated.push(id);
    else added.push(id);
  });
  // removed ids exist in viewmodelPropMap but not in updated props
  map_vprops.forEach((val, id) => {
    if (!updated.includes(id)) removed.push(id);
  });
  return { added, removed, updated };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns TRUE if a VProp corresponding to nodeId exists
 *  @param {string} nodeId - the property with nodeId to test
 *  @return {boolean} - true if the nodeId exists
 */
PMCData.VM_VPropExists = nodeId => {
  return map_vprops.has(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns the VProp corresponding to nodeId if it exists
 *  @param {string} nodeId - the property with nodeId to retrieve
 *  @return {VProp} - VProp instance, if it exists
 */
PMCData.VM_VProp = nodeId => {
  return map_vprops.get(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  deletes the VProp corresponding to nodeId if it exists
 *  @param {string} nodeId - the property with nodeId to delete
 */
PMCData.VM_VPropDelete = nodeId => {
  map_vprops.delete(nodeId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  sets the VProp corresponding to nodeId
 *  @param {string} nodeId - the property with nodeId to add to viewmodel
 *  @param {VProp} vprop - the property with nodeId to add to viewmodel
 */
PMCData.VM_VPropSet = (nodeId, vprop) => {
  map_vprops.set(nodeId, vprop);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns an object containing added, updated, removed string arrays
 *  containing pathIds.
 */
PMCData.VM_GetVMechChanges = () => {
  // remember that a_mechs is an array of { v, w } edgeObjects.
  const added = [];
  const updated = [];
  const removed = [];
  // find what matches and what is new by pathid
  a_mechs.forEach(edgeObj => {
    const pathId = CoerceToPathId(edgeObj);
    if (map_vmechs.has(pathId)) {
      updated.push(pathId);
      if (DBG) console.log('updated', pathId);
    } else {
      added.push(pathId);
      if (DBG) console.log('added', pathId);
    }
  });
  // removed
  map_vmechs.forEach((val_vmech, key_pathId) => {
    if (!updated.includes(key_pathId)) {
      removed.push(key_pathId);
      if (DBG) console.log('removed', key_pathId);
    }
  });
  return { added, removed, updated };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns TRUE if the designated edge exists.
 *
 *  This function can accept one of three formats: an edgeObject, a pathId,
 *  or a source/target pair of nodeId strings.
 *  @param {object|string} evo - edgeObj {w,v}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop */
PMCData.VM_VMechExists = (evo, ew) => {
  const pathId = CoerceToPathId(evo, ew);
  return map_vmechs.has(pathId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns the VMech corresponding to the designated edge if it exists
 *
 *  This function can accept one of three formats: an edgeObject, a pathId,
 *  or a source/target pair of nodeId strings.
 *  @param {object|string} evo - edgeObj {w,v}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop
 */
PMCData.VM_VMech = (evo, ew) => {
  const pathId = CoerceToPathId(evo, ew);
  return map_vmechs.get(pathId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  deletes the VMech corresponding to designated edge if it exists
 *
 *  This function can accept one of three formats: an edgeObject, a pathId,
 *  or a source/target pair of nodeId strings.
 *  @param {object|string} evo - edgeObj {w,v}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop
 */
PMCData.VM_VMechDelete = (evo, ew) => {
  const pathId = CoerceToPathId(evo, ew);
  map_vmechs.delete(pathId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  sets the VMech corresponding to the designated edge
 *
 *  This function can accept one of three formats: an edgeObject, a pathId,
 *  or a source/target pair of nodeId strings.
 *  @param {VMech} vmech - the VMech instance
 *  @param {object|string} evo - edgeObj {w,v}, pathId, or nodeId string of source
 *  @param {string|undefined} ew - if defined, nodeId string of the target prop
 */
PMCData.VM_VMechSet = (vmech, evo, ew) => {
  const pathId = CoerceToPathId(evo, ew);
  map_vmechs.set(pathId, vmech);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns an object containing added, updated, removed string arrays
 *  containing evIds.
 */
PMCData.VM_GetVBadgeChanges = () => {
  /*\
    is there something wrong with this detecting code?

    * map_vbadges maps evId to vbadge
    * a_evidence contains { evId, propId: undefined, rsrcId, note }
    * resources and pmc elements are linked by evidence
    * any change in a piece of evidence potentially changes the vbadge
    * vbadges are associated with a vprop currently, holding a reference to its id

    vbadge update: this is a rating change or a vpropid change
    evidence deleted: vbadge should be removed
    evidence added: vbadge should be added
  \*/
  const added = [];
  const updated = [];
  const removed = [];
  // removed
  map_vbadges.forEach((val_badge, key_evId) => {

    // if both propId and mechId are undefined, then this evidenceLink
    // is not linking to any prop or mech, so delete the badge.
    if (val_badge.evlink.propId === undefined && val_badge.evlink.mechId === undefined) {
      removed.push(key_evId);
      if (DBG) console.log('removed', key_evId);
    }
  });
  // find what matches and what is new by pathid
  a_evidence.forEach(evLink => {
    const evId = evLink.evId;
    if (map_vbadges.has(evId)) {
      updated.push(evId);
      if (DBG) console.log('updated', evId);
    } else {
      added.push(evId);
      if (DBG) console.log('added', evId);
    }
  });
  return { added, removed, updated };
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  returns the VBadge corresponding to evId if it exists
 *  @param {string} evId - the property with evId to retrieve
 *  @return {VBadge} - VBadge instance, if it exists
 */
PMCData.VM_VBadge = evId => {
  return map_vbadges.get(evId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  deletes the VBadge corresponding to evId if it exists
 *  @param {string} evId - the property with evId to delete
 */
PMCData.VM_VBadgeDelete = evId => {
  map_vbadges.delete(evId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  Marks the VBadge for deletion with the next update loop.
 *  We mark it by setting the propId and mechId to undefined,
 *  since that is the link from the EvidenceLink object to the
 *  prop/mech object.  In VM_GetVBadgeChanges, if it finds
 *  both propId and mechId are undefined, it marks the badge
 *  for removal.
 *  The actual deletion happens with class_vprop / class_vmech
 *  @param {string} evId - the property/mech with evId to delete
 */
PMCData.VM_MarkBadgeForDeletion = evId => {
  let badge = PMCData.VM_VBadge(evId);
  if (badge) {
    badge.propId = undefined;
    badge.mechId = undefined;
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 *  sets the vobj (either a vprop or a vmech) corresponding to the designated
 *  evidenceLink id
 *
 *  Unlike vmech and vprop, evidence badges are drawn directly on the source
 *
 *  map_vbadges
 *      key: evId
 *      value: vbadge
 *
 *  @param {string} evId - the property with evId to add to viewmodel
 *  @param {VBadge} vbadge - the VBadge instance
 */
PMCData.VM_VBadgeSet = (evId, vbadge) => {
  map_vbadges.set(evId, vbadge);
};

/// SELECTION MANAGER TEMPORARY HOME //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * add the vprop to the selection set. The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property.
 */
PMCData.VM_SelectProp = vprop => {
  // set appropriate vprop flags
  vprop.visualState.Select();
  vprop.Draw();
  // update viewmodel
  selected_vprops.add(vprop.id);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Remove the passed vprop from the selection set, if set. The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property
 */
PMCData.VM_DeselectProp = vprop => {
  // set appropriate vprop flags
  vprop.visualState.Deselect();
  vprop.Draw();
  // update viewmodel
  selected_vprops.delete(vprop.id);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Select or deselect the passed vprop.  The vprop will be
 * updated in its appearance to reflect its new state.
 * @param {object} vprop - VProp instance with id property
 */
PMCData.VM_ToggleProp = vprop => {
  // set appropriate vprop flags
  vprop.visualState.ToggleSelect();
  // update viewmodel
  if (vprop.visualState.IsSelected()) {
    selected_vprops.add(vprop.id);
    if (selected_vprops.size === 1) {
      vprop.visualState.Select('first');
    }
    vprop.Draw();
  } else {
    selected_vprops.delete(vprop.id);
    vprop.Draw();
  }
  if (DBG) console.log(`vprop selection`, selected_vprops);
  UR.Publish('SELECTION_CHANGED');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * erase the selected properties set. Also calls affected vprops to
 * handle deselection update
 */
PMCData.VM_DeselectAllProps = () => {
  // tell all vprops to clear themselves
  selected_vprops.forEach(vpid => {
    const vprop = PMCData.VM_VProp(vpid);
    vprop.visualState.Deselect();
    vprop.Draw();
  });
  // clear selection viewmodel
  selected_vprops.clear();
  if (DBG) console.log(`global selection`, selected_vprops);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Deselect all vmechs. The vmechs will be updated in its
 * appearance to reflect its new state
 */
PMCData.VM_DeselectAllMechs = () => {
  // tell all vprops to clear themselves
  selected_vmechs.forEach(vmid => {
    const vmech = PMCData.VM_VMech(vmid);
    vmech.visualState.Deselect();
    vmech.Draw();
  });
  // clear selection viewmodel
  selected_vmechs.clear();
  if (DBG) console.log(`global selection`, selected_vmechs);
};
PMCData.VM_DeselectAll = () => {
  PMCData.VM_DeselectAllProps();
  PMCData.VM_DeselectAllMechs();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Select a single mechanism, clearing the existing selection.
 */
PMCData.VM_SelectOneMech = vmech => {
  // set appropriate vprop flags
  PMCData.VM_DeselectAllMechs();
  vmech.visualState.Select();
  vmech.Draw();
  // update viewmodel
  selected_vmechs.add(vmech.id);
  UR.Publish('SELECTION_CHANGED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 * Select/deselect the passed vmech. The vmech will be updated in its
 * appearance to reflect its new state
 */
PMCData.VM_ToggleMech = vmech => {
  // set appropriate vprop flags
  vmech.visualState.ToggleSelect();
  // update viewmodel
  if (vmech.visualState.IsSelected()) {
    selected_vmechs.add(vmech.id);
    vmech.Draw();
  } else {
    selected_vmechs.delete(vmech.id);
    vmech.Draw();
  }
  if (DBG) console.log(`vmech selection`, selected_vmechs);
  UR.Publish('SELECTION_CHANGED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 return array of all string ids that are currently selected PROPERTIES
 in order of insertion.
 Use VProp.visualState.IsSelected('first') to determine what the first
 selection is
 @returns {string[]} propIds - array of string ids of properties
 */
PMCData.VM_SelectedProps = () => {
  return Array.from(selected_vprops.values());
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 return array of all string ids that are currently selected MECHANISMS
 in order of insertion. Unlike the Props version of this call, the selection
 is not tagged with any other meta data (e.g. 'first')
 @returns {string[]} mechIds - array of string ids of properties
 */
PMCData.VM_SelectedMechs = () => {
  return Array.from(selected_vmechs.values());
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_AddProp = (node = "a") => {
  m_graph.setNode(node, { name: `${node}` });
  PMCData.BuildModel();
  return `added node ${node}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_AddPropParent = (node = 'a', parent = 'b') => {
  m_graph.setParent(node, parent);
  PMCData.BuildModel();
  return `added parent ${parent} to node ${node}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_PropDelete = (node = "a") => {
  // Deselect the prop first, otherwise the deleted prop will remain selected
  PMCData.VM_DeselectAll();
  // Unlink any evidence
  const evlinks = PMCData.PropEvidence(node);
  evlinks.forEach(evlink => {
    PMCData.VM_MarkBadgeForDeletion(evlink.evId);
    PMCData.SetEvidenceLinkPropId(evlink.evId, undefined);
  });
  // Delete any children nodes
  const children = PMCData.Children(node);
  children.forEach(cid => {
    PMCData.PMC_PropDelete(cid);
  });
  // Then remove node
  m_graph.removeNode(node);
  PMCData.BuildModel();
  return `deleted node ${node}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_AddMech = (sourceId, targetId, label) => {
  m_graph.setEdge(sourceId, targetId, { name: label });
  PMCData.BuildModel();
  return `added edge ${sourceId} ${targetId} ${label}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_MechDelete = (mechId = "v:w") => {
  // Deselect the mech first, otherwise the deleted mech will remain selected
  PMCData.VM_DeselectAll();
  // Unlink any evidence
  const evlinks = PMCData.MechEvidence(mechId);
  evlinks.forEach(evlink => {
    PMCData.VM_MarkBadgeForDeletion(evlink.evId);
    PMCData.SetEvidenceLinkMechId(evlink.evId, undefined);
  });
  // Then remove mech
  // FIXME / REVIEW : Do we need to use `name` to distinguish between
  // multiple edges between the same source target?
  // FIXME / REVIEW: Do we need add a definition for splitting a
  // pathId to v / w ?
  let vw = mechId.split(':');
  m_graph.removeEdge(vw[0], vw[1]);
  PMCData.BuildModel();
  return `deleted edge ${mechId}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_AddEvidenceLink = (rsrcId, note = '') => {
  // HACK!  FIXME!  Need to properly generate a unique ID.
  let evId = `ev${Math.trunc(Math.random() * 10000)}`;
  a_evidence.push({ evId, propId: undefined, rsrcId, note });
  PMCData.BuildModel();
  return evId;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.PMC_DeleteEvidenceLink = evId => {
  // Delete badges first
  PMCData.VM_MarkBadgeForDeletion(evId);
  // Then delete the link(s)
  let i = a_evidence.findIndex(e => {
    return e.evId === evId;
  });
  a_evidence.splice(i, 1);
  PMCData.BuildModel();
  return evId;
};

if (window.may1 === undefined) window.may1 = {};
window.may1.PCM_Mech = PMCData.Mech;
window.may1.PMC_AddProp = PMCData.PMC_AddProp;
window.may1.PMC_AddMech = PMCData.PMC_AddMech;
window.may1.PMC_AddEvidenceLink = PMCData.PMC_AddEvidenceLink;
window.may1.VM_GetVEvLinkChanges = PMCData.VM_GetVEvLinkChanges;
window.may1.BuildModel = PMCData.BuildModel;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Returns all of the evidence objects.
 */
PMCData.AllResources = () => {
  return a_resource;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Returns the resource object matching the evId.
 */
PMCData.Resource = rsrcId => {
  return a_resource.find((item) => { return item.rsrcId === rsrcId });
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed nodeID (prop object), returns evidence linked to the prop object.
 *  e.g. { evidenceId: '1', note: 'fish food fish food' }
 *  @param {string|undefined} nodeId - if defined, nodeId string of the prop (aka `propId`)
 */
PMCData.PropEvidence = (nodeId) => {
  return h_evidenceByProp.get(nodeId);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed evidence ID, returns the EvidenceLink object.
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 */
PMCData.EvidenceLinkByEvidenceId = (evId) => {
  const evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  return evlink;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Set propId to `undefined` to unlink
PMCData.SetEvidenceLinkPropId = (evId, propId) => {
  let evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  evlink.propId = propId;
  // Call BuildModel to rebuild hash tables since we've added a new propId
  PMCData.BuildModel(); // DATA_UPDATED called by BuildModel()
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkMechId = (evId, mechId) => {
  let evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  evlink.mechId = mechId;
  // Call BuildModel to rebuild hash tables since we've added a new mechId
  PMCData.BuildModel(); // DATA_UPDATED called by BuildModel()
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkNote = (evId, note) => {
  let evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  evlink.note = note;
  UR.Publish('DATA_UPDATED');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.SetEvidenceLinkRating = (evId, rating) => {
  let evlink = a_evidence.find(item => {
    return item.evId === evId;
  });
  if (evlink) {
    evlink.rating = rating;
    UR.Publish('DATA_UPDATED');
    return;
  }
  throw Error(`no evidence link with evId '${evId}' exists`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed resource ID, returns array of prop ids linked to the resource object.
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 */
PMCData.GetPropIdsByResourceId = (rsrcId) => {
  return h_propByResource.get(rsrcId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed resource ID, returns array of prop ids linked to the resource object.
 *  @param {string|undefined} rsrcId - if defined, id string of the resource object
 */
PMCData.GetEvLinkByResourceId = (rsrcId) => {
  return h_evlinkByResource.get(rsrcId);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.MODEL:
 *  Given the passed mechId (mech object), returns evidence linked to the mech object.
 *  e.g. { evidenceId: '1', note: 'fish food fish food' }
 *  @param {string|undefined} mechId - if defined, mechId string of the prop (aka `propId`)
 */
PMCData.MechEvidence = (mechId) => {
  return h_evidenceByMech.get(mechId);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API.VIEWMODEL:
 */
/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PMCData.VM = { map_vprops, map_vmechs };
export default PMCData;
