const models = [
  { id: 1, title: 'Fish Sim', groupId: 1, dateCreated: '', dateModified: '', data: '' },
  { id: 2, title: 'Tank Sim', groupId: 5, dateCreated: '', dateModified: '', data: '' },
  { id: 3, title: 'Ammonia', groupId: 1, dateCreated: '', dateModified: '', data: '' },
  { id: 4, title: 'Fish Sim', groupId: 2, dateCreated: '', dateModified: '', data: '' },
  { id: 5, title: 'Tank Sim', groupId: 2, dateCreated: '', dateModified: '', data: '' },
  { id: 6, title: 'Fish Sim', groupId: 4, dateCreated: '', dateModified: '', data: '' },
  { id: 7, title: 'No Sim', groupId: 4, dateCreated: '', dateModified: '', data: '' },
  { id: 8, title: 'Fish Sim', groupId: 4, dateCreated: '', dateModified: '', data: '' },
  { id: 9, title: 'Tank Sim', groupId: 4, dateCreated: '', dateModified: '', data: '' },
  { id: 10, title: 'Fish Sim', groupId: 4, dateCreated: '', dateModified: '', data: '' },
  { id: 11, title: 'No Sim', groupId: 5, dateCreated: '', dateModified: '', data: '' }
];

function getModel(id) {
  return models.find(element => element.id === id);
}

// HARDCODED MODEL LOAD (GROUP 1)
let model = getModel(1);
model.data = require(`./models/mo01.db`);

// HARDCODED MODEL LOAD (GROUP 1)
model = getModel(3);
model.data = require(`./models/mo02.db`);

module.exports = models;
