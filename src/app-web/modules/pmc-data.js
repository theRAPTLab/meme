/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  prototype model based on dagresjs/graphlib

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { Graph, alg as GraphAlg, json as GraphJSON } from '@dagrejs/graphlib';
import { cssinfo, cssreset, cssdata } from './console-styles';

/// INITIALIZATION ////////////////////////////////////////////////////////////

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_graph; // dagresjs/graphlib instance
let arr_props = []; // all properties
let arr_components = []; // top-level props with no parents
let map_children = new Map(); // children array of each prop by id
let map_outedges = new Map(); // outedges array of each prop by id

const DBG = false;
const DATA = {};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DATA.Graph = () => {
  return m_graph;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DATA.LoadGraph = () => {
  const g = new Graph({ directed: true, compound: true, multigraph: true });
  g.setNode('a', { name: 'a node', data: { j: 1, k: 11, l: 111 } });
  g.setNode('b', { name: 'b node', data: { j: 2, k: 22, l: 222 } });
  g.setNode('c', { name: 'c node', data: { j: 3, k: 33, l: 333 } });
  g.setNode('d', { name: 'd node', data: { j: 4, k: 44, l: 444 } });
  g.setNode('e', { name: 'e node', data: { j: 5, k: 55, l: 555 } });
  g.setNode('f', { name: 'f node', data: { j: 6, k: 66, l: 667 } });
  g.setParent('c', 'a');
  g.setParent('d', 'c');
  g.setParent('f', 'a');
  g.setEdge('b', 'a', { name: 'b to a' });
  g.setEdge('b', 'd', { name: 'b to d' });
  g.setEdge('c', 'e', { name: 'c to e' });
  g.setEdge('e', 'b', { name: 'e to b' });
  // test serial write out, then serial read back in
  const cleanGraphObj = GraphJSON.write(g);
  const json = JSON.stringify(cleanGraphObj);
  m_graph = GraphJSON.read(JSON.parse(json));
  DATA.BuildModel();
}; // LoadGraph()

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DATA.BuildModel = () => {
  // test graphlib
  arr_props = m_graph.nodes(); // returns ids of nodes
  arr_components = [];
  map_children = new Map(); // property children
  map_outedges = new Map(); // outedges for each prop
  /*\
     * arr_components is an array of ids of top-level props
     * map_children maps prop ids to arrays of ids of child props,
     * including children of children
     * map_outedges maps all the outgoing edges for a node
    \*/
  arr_props.forEach(n => {
    const p = m_graph.parent(n);
    if (!p) {
      arr_components.push(n);
    }
    //
    const children = m_graph.children(n);
    let arr = map_children.get(n);
    if (arr) arr.push.apply(children);
    else map_children.set(n, children);
    //
    const outedges = m_graph.outEdges(n); // an array of edge objects {v,w,name}
    arr = map_outedges.get(n) || [];
    outedges.forEach(key => {
      arr.push(key.w);
    });
    map_outedges.set(n, arr);
  });

  if (!DBG) return;
  console.group('%cBuildModel()%c Nodes and Edges', cssinfo, cssreset);
  console.log(`arr_components`, arr_components);
  console.log(`map_children`, map_children);
  console.log(`map_outedges`, map_outedges);
  console.groupEnd();
};

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DATA.Components = () => {
  return arr_components;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DATA.Children = id => {
  return map_children.get(id) || [];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DATA.HasProp = id => {
  return m_graph.hasNode(id);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DATA.Prop = id => {
  return m_graph.node(id);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
called by PMCViewGraph to figure out what is new in the datagraph
compared to what it already has, so it can add/remove/update its
visual components from the data
/*/
DATA.CompareProps = viewmodelPropMap => {
  // remember that arr_props is an array of string ids, not objects
  // therefore the returned arrays have values, not references! yay!
  const added = [];
  const updated = [];
  const removed = [];
  // find what matches and what is new
  arr_props.forEach(id => {
    if (viewmodelPropMap.has(id)) updated.push(id);
    else added.push(id);
  });
  // removed ids exist in viewmodelPropMap but not in updated props
  viewmodelPropMap.forEach((val, id) => {
    if (!updated.includes(id)) removed.push(id);
  });
  return { added, removed, updated };
};

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default DATA;