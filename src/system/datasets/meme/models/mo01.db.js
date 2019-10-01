module.exports = {
  // entities
  entities: [
    // props
    { id: 10, type:'prop', node: 'fertilizer', name: 'fertilizer' },
    { id: 11, type:'prop', node: 'nutrients', name: 'nutrients', parent: 10 },
    { id: 12, type:'prop', node: 'algae', name: 'algae' },
    { id: 13, type:'prop', node: 'deadstuff', name: 'dead stuff' },
    { id: 14, type:'prop', node: 'decomposers', name: 'decomposers' },
    { id: 15, type:'prop', node: 'oxygen', name: 'oxygen' },
    { id: 16, type:'prop', node: 'fish', name: 'fish' },
    { id: 17, type:'prop', node: 'population', name: 'population', parent: 16 },
    // mechs
    { id: 20, type:'mech', edge: 'fertilizer:nutrients', source: 10, target: 11, name: 'increase' },
    { id: 21, type:'mech', edge: 'nutrients:algae', source: 11, target: 12, name: 'increase' },
    { id: 22, type:'mech', edge: 'algae:deadstuff', source: 12, target: 13, name: 'die (incrase)' },
    { id: 23, type:'mech', edge: 'decomposers:deadstuff', source: 14, target: 13, name: 'eat' },
    { id: 24, type:'mech', edge: 'decomposers:oxygen', source: 14, target: 15, name: 'breath (decrease)' },
    { id: 25, type:'mech', edge: 'oxygen:population', source: 15, target: 17, name: 'if too low, decreases' },
    { id: 26, type:'mech', edge: 'fish:deadstuff', source: 16, target: 13, name: 'die (increase)' },
    // evidence
    {
      id: 31,
      type: 'ev',
      propId: 16,
      mechId: undefined,
      rsrcId: 1,
      number: '1a',
      rating: 3,
      note: 'ghoti ghoti gothi need food'
    },
    {
      id: 33,
      type: 'ev',
      propId: undefined,
      mechId: '14:13',
      rsrcId: 2,
      number: '2a',
      rating: 2,
      note: 'fish need food'
    },
    {
      id: 32,
      type: 'ev',
      propId: 16,
      mechId: undefined,
      rsrcId: 1,
      number: '1b',
      rating: -3,
      note: 'fish need food'
    },
    {
      id: 34,
      type: 'ev',
      propId: 11,
      mechId: undefined,
      rsrcId: 2,
      number: '2d',
      rating: 1,
      note: 'ammonia is bad'
    }
  ],
  // commentTreads do not share ids since they are not referenceable by other elements
  commentThreads: [
    {
      id: 51,
      refId: 33,
      comments: [
        {
          id: 0,
          time: 0,
          author: 'Bob',
          date: 'DateStringHere',
          text: 'Comment on "fish need food"',
          criteriaId: 1,
          readBy: ['Bob', 'Bill']
        }
      ]
    },
    {
      id: 52,
      refId: 14,
      comments: [
        {
          id: 0,
          time: 0,
          author: 'Bob',
          date: 'DateStringHere',
          text: 'Decomposers decompose',
          criteriaId: 1,
          readBy: ['Bob', 'Bill']
        },
        {
          id: 1,
          time: 10,
          author: 'Bill',
          date: 'DateStringHere',
          text: 'Suppose decompose',
          criteriaId: 2,
          readBy: []
        }
      ]
    },
    {
      id: 53,
      refId: 12,
      comments: [
        {
          id: 0,
          time: 0,
          author: 'Bob',
          date: 'DateStringHere',
          text: 'Algae green',
          criteriaId: 1,
          readBy: ['Bob', 'Bill']
        },
        {
          id: 1,
          time: 10,
          author: 'Bill',
          date: 'DateStringHere',
          text: 'Algae seein you',
          criteriaId: 2,
          readBy: []
        },
        {
          id: 2,
          time: 11,
          author: 'Mary',
          date: 'DateStringHere',
          text: 'You can call me Algae',
          criteriaId: 2,
          readBy: []
        }
      ]
    },
    {
      id: 54,
      refId: "15:17",
      comments: [
        {
          id: 0,
          time: 0,
          author: 'Bill',
          date: 'DateStringHere',
          text: 'Fish need O2',
          criteriaId: 1,
          readBy: ['Bob', 'Bill']
        },
        {
          id: 1,
          time: 10,
          author: 'Bill',
          date: 'DateStringHere',
          text: 'Fish pop pop',
          criteriaId: 2,
          readBy: []
        }
      ]
    }
  ]
};
