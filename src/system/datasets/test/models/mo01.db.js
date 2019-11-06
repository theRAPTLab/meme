module.exports = {
  // pmcdata id
  id: 1,
  // entities
  entities: [
    // props
    { id: 10, type:'prop', name: 'fertilizer', description: 'Runoff from farms' },
    { id: 11, type:'prop', name: 'nutrients', parent: 10 },
    { id: 12, type:'prop', name: 'algae' },
    { id: 13, type:'prop', name: 'dead stuff' },
    { id: 14, type:'prop', name: 'decomposers' },
    { id: 15, type:'prop', name: 'oxygen' },
    { id: 16, type:'prop', name: 'fish' },
    { id: 17, type:'prop', name: 'population', parent: 16 },
    // mechs
    { id: 20, type:'mech', source: 10, target: 11, name: 'increase', description: 'An increase is good' },
    { id: 21, type:'mech', source: 11, target: 12, name: 'increase' },
    { id: 22, type:'mech', source: 12, target: 13, name: 'die (increase)', description: 'Fish die with an increase' },
    { id: 23, type:'mech', source: 14, target: 13, name: 'eat' },
    { id: 24, type:'mech', source: 14, target: 15, name: 'breath (decrease)' },
    { id: 25, type:'mech', source: 15, target: 17, name: 'if too low, decreases' },
    { id: 26, type:'mech', source: 16, target: 13, name: 'die (increase)' },
    // evidence
    {
      id: 31,
      type: 'evidence',
      propId: 16,
      mechId: undefined,
      rsrcId: 1,
      numberLabel: '1a',
      rating: 3,
      note: 'fish need food'
    },
    {
      id: 33,
      type: 'evidence',
      propId: undefined,
      mechId: '14:13',
      rsrcId: 2,
      numberLabel: '2a',
      rating: 2,
      note: 'fish need food'
    },
    {
      id: 32,
      type: 'evidence',
      propId: 16,
      mechId: undefined,
      rsrcId: 1,
      numberLabel: '1b',
      rating: -3,
      note: 'fish need food'
    },
    {
      id: 34,
      type: 'evidence',
      propId: 11,
      mechId: undefined,
      rsrcId: 2,
      numberLabel: '2d',
      rating: 1,
      note: 'ammonia is bad'
    }
  ],
  // visuals do not share ids
  visuals: [
    { id: 10, type:'vprop', pos:{x:0,y:0}, state:{} }
  ],
  // locks are model-specific lockout objects { name, id, lockedBy }
  locks: [],
  // commentTreads do not share ids since they are not referenceable by other elements
  comments: [

  ],
  markread: [

  ]
};
