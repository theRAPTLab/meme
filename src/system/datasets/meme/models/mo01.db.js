module.exports = {
  // components is a 'component' or a 'property' (if it has a parent)
  properties: [
    { id: 'fertilizer', name: 'fertilizer' },
    { id: 'nutrients', name: 'nutrients', parent: 'fertilizer' },
    { id: 'algae', name: 'algae' },
    { id: 'deadstuff', name: 'dead stuff' },
    { id: 'decomposers', name: 'decomposers' },
    { id: 'oxygen', name: 'oxygen' },
    { id: 'fish', name: 'fish' },
    { id: 'population', name: 'population', parent: 'fish' }
  ],
  mechanisms: [
    { source: 'fertilizer', target: 'nutrients', name: 'increase' },
    { source: 'nutrients', target: 'algae', name: 'increase' },
    { source: 'algae', target: 'deadstuff', name: 'die (incrase)' },
    { source: 'decomposers', target: 'deadstuff', name: 'eat' },
    { source: 'decomposers', target: 'oxygen', name: 'breath (decrease)' },
    { source: 'oxygen', target: 'population', name: 'if too low, decreases' },
    { source: 'fish', target: 'deadstuff', name: 'die (increase)' }
  ],
  evidence: [
    {
      evId: 'ev1',
      propId: 'fish',
      mechId: undefined,
      rsrcId: 1,
      number: '1a',
      rating: 3,
      note: 'ghoti ghoti gothi need food'
    },
    {
      evId: 'ev3',
      propId: undefined,
      mechId: 'decomposers:deadstuff',
      rsrcId: 2,
      number: '2a',
      rating: 2,
      note: 'fish need food'
    },
    {
      evId: 'ev2',
      propId: 'fish',
      mechId: undefined,
      rsrcId: 1,
      number: '1b',
      rating: -3,
      note: 'fish need food'
    },
    {
      evId: 'ev4',
      propId: 'nutrients',
      mechId: undefined,
      rsrcId: 2,
      number: '2d',
      rating: 1,
      note: 'ammonia is bad'
    }
  ],
  commentThreads: [
    {
      id: 'ev3',
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
      id: 'decomposers',
      comments: [
        {
          id: 0,
          time: 0,
          author: 'Bob',
          date: new Date(),
          text: 'Tank you',
          criteriaId: 1,
          readBy: ['Bob', 'Bill']
        },
        {
          id: 1,
          time: 10,
          author: 'Bill',
          date: new Date(),
          text: 'This tanks!',
          criteriaId: 2,
          readBy: []
        }
      ]
    },
    {
      id: 'algae',
      comments: [
        {
          id: 0,
          time: 0,
          author: 'Bob',
          date: new Date(),
          text: 'I like this fish',
          criteriaId: 1,
          readBy: ['Bob', 'Bill']
        },
        {
          id: 1,
          time: 10,
          author: 'Bill',
          date: new Date(),
          text: 'I DONT like this fish',
          criteriaId: 2,
          readBy: []
        },
        {
          id: 2,
          time: 11,
          author: 'Mary',
          date: new Date(),
          text: 'This is not my fish!',
          criteriaId: 2,
          readBy: []
        }
      ]
    },
    {
      id: 'fish',
      comments: [
        {
          id: 0,
          time: 0,
          author: 'Bill',
          date: new Date(),
          text: 'Fish food fish food',
          criteriaId: 1,
          readBy: ['Bob', 'Bill']
        },
        {
          id: 1,
          time: 10,
          author: 'Bill',
          date: new Date(),
          text: 'Food fish food fish',
          criteriaId: 2,
          readBy: []
        }
      ]
    }
  ]
};
