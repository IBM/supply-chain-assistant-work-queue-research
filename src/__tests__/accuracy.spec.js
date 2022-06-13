// Test the skill accuracy, send test utterances and measure how accurately
// the skill dialog recognizes the request expressed by the test utterance
// and returns the expected widget layout

/* eslint-disable max-len */
const console = require('console');
const client = require('./client.js');
const _ = require('lodash');
const metrics = require('./metrics.js');
const sterling = require('./sterling.js');

// Configure the assistant URL, API key and UIHub jwt
const { ASSISTANT, KEY, INFOHUB_TENANT } = process.env;

// Test data, a set of test text utterances and the expected label predictions
// i.e. the expected UIHub widget layout ids
const labels = [
  'RESEARCH',
  'NOT_UNDERSTOOD',
  'INTERNAL_ERROR'
];

const XData = [
  {
    label: 'RESEARCH',
    text: [
      'show me research for work items related to inventory above upper threshold',
      'research on work items for inventory above upper threshold',
      'help me research for work items in work queue inventoryAboveUpperThreshold',
      'show me research for work items for work queue in inventory above upper threshold',
      'give research for work items for inventory above upper threshold',
      'provide research for work items in work queue inventoryAboveUpperThreshold',
      'provide research for work items on inventoryAboveUpperThreshold',
      'help me find research for work items in work queue inventory above upper threshold',
      'find research for work items for inventoryAboveUpperThreshold',
      'research regarding work items for the work queue inventory above upper threshold',
      'what are the research items for work queue inventoryAboveUpperThreshold',
      'show me research for work queue inventory above upper threshold',
      'research for work queue inventoryAboveUpperThreshold'
    ]
  },
  {
    label: 'NOT_UNDERSTOOD',
    text: [
      'is it going to rain today',
      'what items need work today',
      'show me inventory below stock for Pharma',
      'what are my late shipments for Pharma',
      'get expiring inventory for Pharma',
      'show incoming sales orders'
    ]
  }
];

// Unique user id for the tests
const userId = 'quickstart_testuser';

// Create a Watson Assistant session to run the tests and delete it when done
let sessionId, jwt;

beforeAll(async () => {
  sessionId = await client.createSession(ASSISTANT, KEY);
  jwt = await sterling.authenticate();
});

afterAll(async () => {
  await client.deleteSession(sessionId, ASSISTANT, KEY);
});

// Measure the skill's accuracy
describe('Skill dialog', () => {

  test('should return widget layouts with an accuracy >= 0.75', async () => {

    // Send the test utterances to the assistant, and record the expected
    // "true" result vs the result from the skill
    const yTrue = [];
    const yPred = [];
    for (const x of XData)
      for (const text of x.text) {
        yTrue.push(x.label);

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

        const status = intent === 'get_research' ? 'RESEARCH' : 'NOT_UNDERSTOOD';
        yPred.push(status);
      }

    console.log('Accuracy test results');
    console.log('  yTrue', yTrue);
    console.log('  yPred', yPred);

    // Build a confusion metrics and report accuracy metrics
    const C = metrics.confusion(yTrue, yPred, labels);
    console.log('Confusion matrix');
    console.table(C);

    const report = metrics.report(C, labels);
    console.log('Accuracy', report.accuracy);

    console.log('Detailed report');
    console.table(report.details);

    // Check that the accuracy score is >= 0.75
    expect(report.accuracy).toBeGreaterThanOrEqual(0.75);
  }, 30000);
});

