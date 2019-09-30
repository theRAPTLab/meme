module.exports = {
  // components is a 'component' or a 'property' (if it has a parent)
  properties: [
    { id: 10, node: 'fertilizer', name: 'fertilizer' },
    { id: 11, node: 'nutrients', name: 'nutrients', parent: 10 },
    { id: 12, node: 'algae', name: 'algae' },
    { id: 13, node: 'deadstuff', name: 'dead stuff' },
    { id: 14, node: 'decomposers', name: 'decomposers' },
    { id: 15, node: 'oxygen', name: 'oxygen' },
    { id: 16, node: 'fish', name: 'fish' },
    { id: 17, node: 'population', name: 'population', parent: 16 }
  ],
  mechanisms: [
// these ids are wrong, they should be strings like "10:15"
    { id: 20, edge: 'fertilizer:nutrients', source: 10, target: 11, name: 'increase' },
    { id: 21, edge: 'nutrients:algae', source: 11, target: 12, name: 'increase' },
    { id: 22, edge: 'algae:deadstuff', source: 12, target: 13, name: 'die (incrase)' },
    { id: 23, edge: 'decomposers:deadstuff', source: 14, target: 13, name: 'eat' },
    { id: 24, edge: 'decomposers:oxygen', source: 14, target: 15, name: 'breath (decrease)' },
    { id: 25, edge: 'oxygen:population', source: 15, target: 17, name: 'if too low, decreases' },
    { id: 26, edge: 'fish:deadstuff', source: 16, target: 13, name: 'die (increase)' }
  ],
  evidence: [
    {
      id: 31,
      propId: 16,
      mechId: undefined,
      rsrcId: 1,
      number: '1a',
      rating: 3,
      note: 'ghoti ghoti gothi need food'
    },
    {
      id: 33,
      propId: undefined,
      mechId: '14:13',
      rsrcId: 2,
      number: '2a',
      rating: 2,
      note: 'fish need food'
    },
    {
      id: 32,
      propId: 16,
      mechId: undefined,
      rsrcId: 1,
      number: '1b',
      rating: -3,
      note: 'fish need food'
    },
    {
      id: 34,
      propId: 11,
      mechId: undefined,
      rsrcId: 2,
      number: '2d',
      rating: 1,
      note: 'ammonia is bad'
    }
  ],
  commentThreads: [
    {
      id: 51,
      refId: 33,
      comments: [
        {
          id: 0,
          time: 0,
          author: 'Bob',
          date: new Date(),
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
          date: new Date(),
          text: 'Decomposers decompose',
          criteriaId: 1,
          readBy: ['Bob', 'Bill']
        },
        {
          id: 1,
          time: 10,
          author: 'Bill',
          date: new Date(),
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
          date: new Date(),
          text: 'Algae green',
          criteriaId: 1,
          readBy: ['Bob', 'Bill']
        },
        {
          id: 1,
          time: 10,
          author: 'Bill',
          date: new Date(),
          text: 'Algae seein you',
          criteriaId: 2,
          readBy: []
        },
        {
          id: 2,
          time: 11,
          author: 'Mary',
          date: new Date(),
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
          date: new Date(),
          text: 'Fish need O2',
          criteriaId: 1,
          readBy: ['Bob', 'Bill']
        },
        {
          id: 1,
          time: 10,
          author: 'Bill',
          date: new Date(),
          text: 'Fish pop pop',
          criteriaId: 2,
          readBy: []
        }
      ]
    }
  ]
};
