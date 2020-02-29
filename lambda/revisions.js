import { respond } from './utils/index.js';

const user = {
  email: 'chancerton@nyaruka.com',
  name: 'Chancellor von Frankenbean'
};

const assetList = [
  {
    user: user,
    created_on: new Date(),
    id: 1,
    version: '13.0.0',
    revision: 1
  }
];

const assetContent = {
  1: {
    definition: {
      name: 'Favorites',
      language: 'eng',
      type: 'message',
      spec_version: '13.0.0',
      uuid: 'a4f64f1b-85bc-477e-b706-de313a022979',
      localization: {},
      nodes: [],
      _ui: {
        languages: [{ eng: 'English' }, { spa: 'Spanish' }]
      }
    },
    metadata: {
      issues: []
    }
  }
};

exports.handler = (request, context, callback) => {
  if (request.httpMethod === 'POST') {
    const id = Object.keys(assetContent).length + 1;
    assetContent[id] = request.body;

    const issues = [];
    if (request.body.indexOf('missing_field') > 0) {
      const definition = JSON.parse(request.body);
      for (const node of definition.nodes) {
        for (const action of node.actions) {
          if (JSON.stringify(action).indexOf('missing_field') > -1) {
            issues.push({
              type: 'missing_dependency',
              description: 'missing field dependency',
              node_uuid: node.uuid,
              action_uuid: action.uuid,
              dependency: {
                name: 'Missing Field',
                key: 'missing_field',
                type: 'field'
              }
            });
          }
        }
      }
    }

    const asset = {
      user: user,
      created_on: new Date(),
      id,
      version: '13.0.0',
      revision: id,
      metadata: {
        issues: issues
      }
    };
    assetList.unshift(asset);
    respond(callback, asset);
    return;
  }

  const regex = /.*\/revisions\/(\d+)/;
  const match = regex.exec(request.path);

  if (match && match.length > 1) {
    respond(callback, assetContent[match[1]]);
  } else {
    respond(callback, { results: assetList });
  }
};
