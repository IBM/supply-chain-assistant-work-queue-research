# supply-chain-assistant-work-queue-research

A sample work queue research assistant for IBM Supply Chain Intelligence Suite (SCIS).

## Introduction

A team of supply chain analysts need to review and work on issues with
their supply chain. Those issues are surfaced as work items
in a given work queue, e.g. inventory above upper threshold.

This sample is designed to help users research their respective 
work items within SCIS by faciliating a set of _bookmarked_
research questions which are relevant to the business use case
surrounding a given work queue.

The project illustrates how to create a Watson Assistant skill, train it
with example utterances, and have it return a set of bookmarks that will
guide the user as they research how to best resolve their work items.

Documentation of how to design, build and deploy Watson Assistant skills for
the Sterling AI assistant can be found in the
[Sterling Knowledge Center](https://www.ibm.com/docs/en/scis?topic=skills-adding-supply-chain-business-assistant).

## Uploading the skill to Watson Assistant

Before testing the skill you need to upload it to Watson Assistant.

Please do the following:

* Create a Watson Assistant service resource in an IBM cloud account.

* In the Watson Assistant tool, select *Create assistant* and create
an assistant named **Work Queue Research Sample**, which will be necessary
to host the skill.

* Write down the *assistant URL* and *API key* for the
**Work Queue Research Sample** assistant, found on that assistant's *Settings*
page.

* In the Watson Assistant tool, select *Create skill*, choose *Dialog Skill*,
then select *Upload skill* to upload `src/skill.json`
into the new skill.

* Write down the *Legacy v1 workspace URL* for the **Work Queue Research Sample**
skill, found on the skill's *API details* page.

* Open the **Work Queue Research Sample** assistant again, select
*Add dialog skill* to add the **Work Queue Research Sample** skill to the
assistant.

## Building the project

The project contains a set of Node.js sample test programs which can be used
to test the skill.

To build the test programs, make sure you have **Node.js** and **yarn**
installed, then run the following command:

```
yarn build
```

## Testing the skill

The sample test programs illustrate how to test that the skill functions as
expected, with good language recognition accuracy.

Configure the following environment variables related to Watson Assistant:

```
export ASSISTANT="the assistant URL for the Work Queue Research Sample assistant"
export KEY="the API key for the Work Queue Research Sample assistant"
export SKILL="the legacy v1 workspace URL for the Work Queue Research Sample skill"
```
The *assistant URL* and *API key* can be found on the *Settings* page of the
**Work Queue Research Sample** assistant.

The skill's *Legacy v1 workspace URL* can be found on the *API details* page
of the **Work Queue Research Sample** skill.

Since this sample uses the [Named Entity Recognition API](https://developer.ibm.com/apis/catalog/scintellsuite--supply-chain-intelligence-suite/api/API--scintellsuite--named-entities-recognition-service#post998085110),
you will need to authenticate using a JSON Web Token which can be obtained from the 
[Saascore Authentication API](https://developer.ibm.com/apis/catalog/scintellsuite--supply-chain-intelligence-suite/api/API--scintellsuite--platform-authentication-retrieve/#get44848312).

Configure the following environment variables related to authentication:

```
export SCIS_ORGANIZATION="the ID for your SCIS organization"
export INFOHUB_TENANT="the Infohub tenant ID associated with your SCIS organization"
export SAASCORE_BASIC_USERNAME="the username (IBMID) of the authenticating user"
export SAASCORE_BASIC_PASSWORD="the corresponding password of the authenticating user"
```

Run the following command:

```
yarn test
```

## Registering the skill with the Sterling Assistant

To register the sample skill with the Sterling AI Assistant, follow the steps
described in
[Registering your skills with the Sterling Assistant](https://www.ibm.com/docs/en/scis?topic=assistant-registering-your-skills-supply-chain-business).
