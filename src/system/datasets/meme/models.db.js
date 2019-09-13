const models = [
  { id: 'mo01', title: 'Fish Sim', groupId: 'gr01', dateCreated: '', dateModified: '', data: '' },
  { id: 'mo02', title: 'Tank Sim', groupId: 'gr05', dateCreated: '', dateModified: '', data: '' },
  { id: 'mo03', title: 'Ammonia', groupId: 'gr01', dateCreated: '', dateModified: '', data: '' },
  { id: 'mo04', title: 'Fish Sim', groupId: 'gr02', dateCreated: '', dateModified: '', data: '' },
  { id: 'mo05', title: 'Tank Sim', groupId: 'gr02', dateCreated: '', dateModified: '', data: '' },
  { id: 'mo06', title: 'Fish Sim', groupId: 'gr04', dateCreated: '', dateModified: '', data: '' },
  { id: 'mo07', title: 'No Sim', groupId: 'gr04', dateCreated: '', dateModified: '', data: '' },
  { id: 'mo08', title: 'Fish Sim', groupId: 'gr04', dateCreated: '', dateModified: '', data: '' },
  { id: 'mo09', title: 'Tank Sim', groupId: 'gr04', dateCreated: '', dateModified: '', data: '' },
  { id: 'mo10', title: 'Fish Sim', groupId: 'gr04', dateCreated: '', dateModified: '', data: '' },
  { id: 'mo11', title: 'No Sim', groupId: 'gr05', dateCreated: '', dateModified: '', data: '' }
];

function getModel(id) {
  return models.find(element => element.id === id);
}

// HARDCODED MODEL LOAD
let model = getModel('mo01');
model.data = require(`./models/mo01.db`);

// HARDCODED MODEL LOAD
model = getModel('mo02');
model.data = require(`./models/mo02.db`);

module.exports = models;
