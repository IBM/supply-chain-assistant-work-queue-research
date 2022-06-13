// Tests skill intent recognition, dialog logic and
// checks some of the skill configuration settings

/* eslint-disable max-len */
const client = require('./client.js');
const sterling = require('./sterling.js');
const _ = require('lodash');

// Configure the assistant URL, API key, skill URL and UIHub jwt
const { ASSISTANT, KEY, SKILL, INFOHUB_TENANT } = process.env;

// Unique user id for the tests
const userId = 'workqueue_research_sample_user';

// Create a Watson Assistant session to run the tests and delete it when done
let sessionId, jwt;

beforeAll(async () => {
  sessionId = await client.createSession(ASSISTANT, KEY);
  jwt = await sterling.authenticate();
});

afterAll(async () => {
  await client.deleteSession(sessionId, ASSISTANT, KEY);
});

// Test the skill intent model
describe('Skill intent model', () => {

  test('should recognize #get_research with WQ logical name', async () => {
    const text = 'give me research on work items for work queue inventoryAboveUpperThreshold';
    const res = await client.sendText(text, sessionId, userId, {
      url: ASSISTANT,
      key: KEY,
      tenantId: INFOHUB_TENANT,
      jwt: jwt
    });

    const intent = _.chain(res)
      .get('output.intents', [])
      .filter(({ confidence }) => confidence >= 0.40)
      .get('[0].intent')
      .value();

    expect(intent).toEqual('get_research');
  });

  test('should recognize #get_research with WQ display name', async () => {
    const text = 'get research for work items on work queue inventory above upper threshold';
    const res = await client.sendText(text, sessionId, userId, {
      url: ASSISTANT,
      key: KEY,
      tenantId: INFOHUB_TENANT,
      jwt: jwt
    });

    const intent = _.chain(res)
      .get('output.intents', [])
      .filter(({ confidence }) => confidence >= 0.40)
      .get('[0].intent')
      .value();

    expect(intent).toEqual('get_research');
  });

});

// Test the skill dialog
describe('Skill dialog', () => {

  test('should use automatic slot-filling when automation is enabled', async () => {
    const text = 'give me research on work items for work queue inventoryAboveUpperThreshold';
    const auth = { url: ASSISTANT, key: KEY, tenantId: INFOHUB_TENANT, jwt: jwt };

    // supports automatic slot filling by setting this flag
    const ctx = { supportsAutomaticSlotFilling: true };
    const res = await client.sendText(text, sessionId, userId, auth, ctx);

    // Check the skill's response
    expect(res.output.generic[0]).toEqual({
      user_defined: {
        name: 'slot_filling_prompt',
        slots: [
          'location.locationName',
          'product.name'
        ]
      },
      response_type: 'user_defined'
    });
  });

  test('should use manual slot-filling when automation is not enabled', async () => {
    const text = 'give me research on work items for work queue inventoryAboveUpperThreshold';
    const auth = { url: ASSISTANT, key: KEY, tenantId: INFOHUB_TENANT, jwt: jwt };
    
    // no automatic slot filling is enabled in this invocation
    const ctx = { supportsAutomaticSlotFilling: null };
    const res = await client.sendText(text, sessionId, userId, auth, ctx);

    // Check the skill's response
    expect(res.output.generic[0]).toEqual({
      response_type: 'text',
      text: 'I\'ll need more information to search. For which location name do you want to search?'
    });
  });

  test('should return bookmarks when bookmarks are supported', async () => {
    const text = 'give me research on work items for work queue inventoryAboveUpperThreshold';
    const auth = { url: ASSISTANT, key: KEY, tenantId: INFOHUB_TENANT, jwt: jwt };

    // supports automatic slot filling by setting this flag
    const ctx = { supportsAutomaticSlotFilling: true, supportsBookmarks:  true };
    const res = await client.sendText(text, sessionId, userId, auth, ctx);

    // Check the skill's response
    expect(res.output.generic[0]).toEqual({
      user_defined: {
        name: 'slot_filling_prompt',
        slots: [
          'location.locationName',
          'product.name'
        ]
      },
      response_type: 'user_defined'
    });

    const text2 = 'location.locationName LightTree Plant 2 Tuscaloosa product.name Alliance Traffic Signal Pole';
    const res2 = await client.sendText(text2, sessionId, userId, auth, ctx);

    expect(res2.output.generic[1]).toEqual({
      user_defined: {
        sterling_bookmark_response: {
          name: 'bookmarks',
          title: '',
          status: 'OK',
          bookmarks: [
            {
              label: 'Check inventory approaching out of stock',
              value: {
                input: {
                  text: 'show inventory approaching out of stock for product Alliance Traffic Signal Pole'
                }
              }
            },
            {
              label: 'Check unscheduled sales orders',
              value: {
                input: {
                  text: 'show me sales orders that are unscheduled'
                }
              }
            }
          ]
        }
      },
      response_type: 'user_defined'
    });
  });

  test('should return options when bookmarks are not supported', async () => {
    const text = 'give me research on work items for work queue inventoryAboveUpperThreshold';
    const auth = { url: ASSISTANT, key: KEY, tenantId: INFOHUB_TENANT, jwt: jwt };

    // automatic slot filling and bookmarks are not supported
    const res = await client.sendText(text, sessionId, userId, auth);

    // prompt for location name first
    expect(res.output.generic[0]).toEqual({
      response_type: 'text',
      text: 'I\'ll need more information to search. For which location name do you want to search?'
    });

    const text2 = 'LightTree Plant 2 Tuscaloosa';
    const res2 = await client.sendText(text2, sessionId, userId, auth);

    expect(res2.output.generic[0]).toEqual({
      response_type: 'text',
      text: 'I\'ll need more information to search. For which product name do you want to search?'
    });

    const text3 = 'Alliance Traffic Signal Pole';
    const res3 = await client.sendText(text3, sessionId, userId, auth);

    expect(res3.output.generic[1]).toEqual({
      title: '',
      options: [
        {
          label: 'Check inventory approaching out of stock',
          value: {
            input: {
              text: 'show inventory approaching out of stock for product Alliance Traffic Signal Pole'
            }
          }
        },
        {
          label: 'Check unscheduled sales orders',
          value: {
            input: {
              text: 'show me sales orders that are unscheduled'
            }
          }
        }
      ],
      response_type: 'option'
    });
  });

  test('should support custom greeting when enabled', async () => {
    const text = 'give me research on work items for work queue inventoryAboveUpperThreshold';
    const auth = { url: ASSISTANT, key: KEY, tenantId: INFOHUB_TENANT, jwt: jwt };

    // supports automatic slot filling by setting this flag
    const ctx = { 
      supportsAutomaticSlotFilling: true,
      supportsBookmarks:  true,
      supportsCustomGreeting: true
    };
    const res = await client.sendText(text, sessionId, userId, auth, ctx);

    // Check the skill's response
    expect(res.output.generic[0]).toEqual({
      user_defined: {
        name: 'slot_filling_prompt',
        slots: [
          'location.locationName',
          'product.name'
        ]
      },
      response_type: 'user_defined'
    });

    const text2 = 'location.locationName LightTree Plant 2 Tuscaloosa product.name Alliance Traffic Signal Pole';
    const res2 = await client.sendText(text2, sessionId, userId, auth, ctx);

    expect(res2.output.generic[0]).toEqual({
      text: 'Hi. Review the details in each research topic to select a suitable resolution for this work item.<br/>Need help? Ask me a question.',
      response_type: 'text'
    });
  });

  test('should support custom greeting with user name when enabled', async () => {
    const text = 'give me research on work items for work queue inventoryAboveUpperThreshold';
    const auth = { url: ASSISTANT, key: KEY, tenantId: INFOHUB_TENANT, jwt: jwt };

    // supports automatic slot filling by setting this flag
    const ctx = { 
      supportsAutomaticSlotFilling: true,
      supportsBookmarks:  true,
      supportsCustomGreeting: true,
      user_name: 'Sterling'
    };
    const res = await client.sendText(text, sessionId, userId, auth, ctx);

    // Check the skill's response
    expect(res.output.generic[0]).toEqual({
      user_defined: {
        name: 'slot_filling_prompt',
        slots: [
          'location.locationName',
          'product.name'
        ]
      },
      response_type: 'user_defined'
    });

    const text2 = 'location.locationName LightTree Plant 2 Tuscaloosa product.name Alliance Traffic Signal Pole';
    const res2 = await client.sendText(text2, sessionId, userId, auth, ctx);

    expect(res2.output.generic[0]).toEqual({
      text: 'Hi, Sterling. Review the details in each research topic to select a suitable resolution for this work item.<br/>Need help? Ask me a question.',
      response_type: 'text'
    });
  });

  test('should not support custom greeting when not specified', async () => {
    const text = 'give me research on work items for work queue inventoryAboveUpperThreshold';
    const auth = { url: ASSISTANT, key: KEY, tenantId: INFOHUB_TENANT, jwt: jwt };

    // supports automatic slot filling by setting this flag
    const ctx = { supportsAutomaticSlotFilling: true, supportsBookmarks:  true };
    const res = await client.sendText(text, sessionId, userId, auth, ctx);

    // Check the skill's response
    expect(res.output.generic[0]).toEqual({
      user_defined: {
        name: 'slot_filling_prompt',
        slots: [
          'location.locationName',
          'product.name'
        ]
      },
      response_type: 'user_defined'
    });

    const text2 = 'location.locationName LightTree Plant 2 Tuscaloosa product.name Alliance Traffic Signal Pole';
    const res2 = await client.sendText(text2, sessionId, userId, auth, ctx);

    expect(res2.output.generic[0]).toEqual({
      text: 'Review the details in each research topic to select a suitable resolution for this work item.<br/>Need help? Ask me a question.',
      response_type: 'text'
    });
  });

});

describe('Skill settings', () => {
  test('should use recommended dialog settings', async () => {
    // Download the skill.json configuration
    const config = await client.download(SKILL, KEY);

    // If your skill utilizes Watson Assistant features such as
    // off topic and spelling auto correct, it's a good practice to
    // retest those flags at each update to avoid accidental changes
    expect(config.system_settings.off_topic.enabled).toBe(true);
    expect(config.system_settings.spelling_auto_correct).toBe(true);

    // sample skill has only one intent, disambiguation not applicable
    expect(config.system_settings.disambiguation.enabled).toBe(false);
    expect(config.learning_opt_out).toBe(false);

    // Check that the dialog contains the expected node names for the
    // morning and evening status
    const names = config.dialog_nodes.map((node) => node.title);
    expect(names).toContain('research for inventory above upper threshold');
  });
});
