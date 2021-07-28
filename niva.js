const { ActivityHandler, ActionTypes, CardFactory } = require('botbuilder');
const { FixFaultTerminalsDialog } = require('./dialogs/fixFaultTerminalsDialog');
const { IMSupportDialog } = require('./dialogs/imSupportDialog');
const { FeedbackDialog } = require('./dialogs/feedbackDialog');
const { CreateTerminalDialog } = require('./dialogs/createTerminalDialog');
const { CreateIncidentDialog } = require('./dialogs/createIncidentDialog');
const { LuisRecognizer, QnAMaker } = require('botbuilder-ai');

class NiVA extends ActivityHandler {
    constructor(conversationState, userState) {
        super();

        // Initializing states
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty("dialogState");

        // Configuring dialogs
        this.fixFaultTerminalsDialog = new FixFaultTerminalsDialog(this.conversationState, this.userState);
        this.imSupportDialog = new IMSupportDialog(this.conversationState, this.userState);
        this.feebackDialog = new FeedbackDialog(this.conversationState, this.userState);
        this.createTerminalDialog = new CreateTerminalDialog(this.conversationState, this.userState);
        this.createIncidentDialog = new CreateIncidentDialog(this.conversationState, this.userState);

        this.previousIntent = this.conversationState.createProperty("previousIntent");
        this.conversationData = this.conversationState.createProperty("conversationData");

        // Configuring LUIS
        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: process.env.LuisAPIHostName
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

        // Configuring QnA Maker
        const qnaMaker = new QnAMaker({
            knowledgeBaseId: process.env.QnAKnowledgebaseId,
            endpointKey: process.env.QnAEndpointKey,
            host: process.env.QnAEndpointHostName
        });

        this.qnaMaker = qnaMaker;

        this.onMessage(async (context, next) => {
            const luisResult = await dispatchRecognizer.recognize(context);
            console.log(luisResult);
            const intent = LuisRecognizer.topIntent(luisResult);
            const entities = luisResult.entities;
            await this.dispatchToIntentAsync(context, intent, entities);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context);
            await next();
        });

        this.onDialog(async (context, next) => {
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });
    }

    async sendWelcomeMessage(context) {
        const { activity } = context;
        for (const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== context.activity.recipient.id) {
                const welcomeText = 'Hello!👋 Welcome to NiVA(NCR\'s interactive Virtual Assistant)';
                await context.sendActivity(welcomeText);
                await this.sendSuggestedActions(context);
            }
        }
    }

    async sendIntroCard(context) {
        const card = CardFactory.heroCard(
            'How may I enlighten your day with?',
            [],
            [{
                type: ActionTypes.ImBack,
                title: 'Create Incident',
                value: 'Create Incident'
            },
            {
                type: ActionTypes.ImBack,
                title: 'Fix Terminal Faults',
                value: 'Fix Terminal Faults'
            },
            {
                type: ActionTypes.ImBack,
                title: 'Create a new Terminal',
                value: 'Create a new Terminal'
            },
            {
                type: ActionTypes.ImBack,
                title: 'Incident Management Support',
                value: 'Incident Management Support'
            },
            {
                type: ActionTypes.ImBack,
                title: 'I have some Questions',
                value: 'I have some Questions'
            },
            {
                type: ActionTypes.ImBack,
                title: 'I have some Feedback',
                value: 'I have some Feedback'
            }

            ]
        );

        await context.sendActivity({ attachments: [card] });
    }

    async sendSuggestedActions(context) {
        context.sendActivity('Is there anything I can help?');
        const card = CardFactory.heroCard(
            'Try these..',
            [],
            [{
                type: ActionTypes.ImBack,
                title: 'Create Incident',
                value: 'Create Incident'
            },
            {
                type: ActionTypes.ImBack,
                title: 'Fix Terminal Faults',
                value: 'Fix Terminal Faults'
            },
            {
                type: ActionTypes.ImBack,
                title: 'Create a new Terminal',
                value: 'Create a new Terminal'
            },
            {
                type: ActionTypes.ImBack,
                title: 'Incident Management Support',
                value: 'Incident Management Support'
            },
            {
                type: ActionTypes.ImBack,
                title: 'I have some Questions',
                value: 'I have some Questions'
            },
            {
                type: ActionTypes.ImBack,
                title: 'I have some Feedback',
                value: 'I have some Feedback'
            }

            ]
        );

        await context.sendActivity({ attachments: [card] });
    }


    async dispatchToIntentAsync(context, intent, entities) {
        var currentIntent = '';
        const previousIntent = await this.previousIntent.get(context, {});
        const conversationData = await this.conversationData.get(context, {});
        if (previousIntent.intentName && !conversationData.endDialog) {
            currentIntent = previousIntent.intentName;
        } else if (previousIntent.intentName && conversationData.endDialog) {
            currentIntent = intent;
        } else if (intent == 'None' && !previousIntent.intentName) {
            await this.processFromKnowledgeBase(context);
        } else {
            currentIntent = intent;
            await this.previousIntent.set(context, { intentName: intent });
        }
        console.log(currentIntent);
        switch (currentIntent) {
            case 'Fix_Fault_Terminal':
                console.log("Inside <Fix Fault Terminals> intent");
                await this.conversationData.set(context, { endDialog: false });
                await this.fixFaultTerminalsDialog.run(context, this.dialogState, entities);
                this.conversationState.endDialog = await this.fixFaultTerminalsDialog.isDialogComplete();
                if (this.conversationState.endDialog) {
                    await this.previousIntent.set(context, { intentName: null });
                    await this.sendSuggestedActions(context);
                }
                break;
            case 'Incident_Management_Support':
                console.log("Inside <Incident Management Support> intent");
                await this.conversationData.set(context, { endDialog: false });
                await this.imSupportDialog.run(context, this.dialogState, entities);
                this.conversationState.endDialog = await this.imSupportDialog.isDialogComplete();
                if (this.conversationState.endDialog) {
                    await this.previousIntent.set(context, { intentName: null });
                    await this.sendSuggestedActions(context);
                }
                break;
            case 'Feedback':
                console.log("Inside <Feedback> intent");
                // TODO
                await this.conversationData.set(context, { endDialog: false });
                await this.feebackDialog.run(context, this.dialogState, entities);
                this.conversationState.endDialog = await this.feebackDialog.isDialogComplete();
                if (this.conversationState.endDialog) {
                    await this.previousIntent.set(context, { intentName: null });
                    await this.sendSuggestedActions(context);
                }
                break;
            case 'Create_Terminal':
                console.log("Inside <Create Terminal> intent");
                await this.conversationData.set(context, { endDialog: false });
                await this.createTerminalDialog.run(context, this.dialogState, entities);
                this.conversationState.endDialog = await this.createTerminalDialog.isDialogComplete();
                if (this.conversationState.endDialog) {
                    await this.previousIntent.set(context, { intentName: null });
                    await this.sendSuggestedActions(context);
                }
                break;
            case 'Create_Incident':

                console.log("Inside <Create incident> intent");

                // TODO

                await this.conversationData.set(context, { endDialog: false });

                await this.createIncidentDialog.run(context, this.dialogState, entities);

                this.conversationState.endDialog = await this.createIncidentDialog.isDialogComplete();

                if (this.conversationState.endDialog) {

                    await this.previousIntent.set(context, { intentName: null });

                    await this.sendSuggestedActions(context);

                }

                break;
            case 'Find_Terminal':
                console.log("Inside <Find Terminal> intent");
                // console.log(entities.Terminal[0][0]);
                var terminalType;
                if (entities.Terminal) {
                    terminalType = entities.Terminal[0][0];
                } else {
                    terminalType = null;
                }
                // var terminalType = entities.Terminal[0][0] ? entities.Terminal[0][0] : null;
                console.log(terminalType);
                if (terminalType == 'Out of Service') {
                    await context.sendActivity('Fetching all Out of Service terminal details..');
                    await context.sendActivity({ attachments: [this.getOutOfServiceTerminals()] });
                } else if (terminalType == 'In service') {
                    await context.sendActivity('Fetching all In-Service terminal details..');
                    await context.sendActivity({ attachments: [this.getInserviceTerminals()] });
                } else if (terminalType == 'Needs Attention') {
                    await context.sendActivity('Fetching all Needs Attention terminal details..');
                    await context.sendActivity({ attachments: [this.getNeedsAttentionTerminals()] });
                } else if (terminalType == 'Lost Communication') {
                    await context.sendActivity('Fetching all Lost Communication details..');
                    await context.sendActivity({ attachments: [this.getLostCommunicationTerminals()] });
                } else {
                    await context.sendActivity('Fetching all terminal details..');
                    await context.sendActivity({ attachments: [this.getAllTerminals()] });
                }
                await this.previousIntent.set(context, { intentName: null });
                await this.sendSuggestedActions(context);
                break;
            case 'Find_Incident':
                console.log("Inside <Find Incident> intent");
                await context.sendActivity('Fetching all the open incidents..');
                await context.sendActivity({ attachments: [this.getAllOpenTickets()] });
                await this.previousIntent.set(context, { intentName: null });
                await this.sendSuggestedActions(context);
                break;
            case 'Question':
                console.log("Inside <Question> intent");
                await context.sendActivity('Please type your question.');
                await this.previousIntent.set(context, { intentName: null });
                break;
        }
    }

    async processFromKnowledgeBase(context) {
        console.log('Proccessing from QnA Maker');
        const results = await this.qnaMaker.getAnswers(context);

        if (results.length > 0) {
            await context.sendActivity(`${results[0].answer}`);
        } else {
            await context.sendActivity('That may be beyond my abilities at the moment.');
        }
    }


    getLostCommunicationTerminals() {
        return CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "ColumnSet",
                    "columns": [
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Terminal Name"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2671"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2412"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2222"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL4212"
                                }
                            ]
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Location"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "London"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Paris"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Dundee"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Halifax"
                                }
                            ]
                        }
                    ]
                }
            ]
        });

    }


    getInserviceTerminals() {
        return CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "ColumnSet",
                    "columns": [
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Terminal Name"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2671"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2412"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2222"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL4212"
                                }
                            ]
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Location"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "London"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Paris"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Dundee"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Halifax"
                                }
                            ]
                        }
                    ]
                }
            ]
        });

    }

    getOutOfServiceTerminals() {
        return CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "ColumnSet",
                    "columns": [
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Terminal Name"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2671"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2412"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2222"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL4212"
                                }
                            ]
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Status"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Out of Service"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Out of Service"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Out of Service"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Out of Service"
                                }
                            ]
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Description"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Low Cash Unit"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Loss Comm"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Paper Jammed"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Open Device Fault"
                                }
                            ]
                        }
                    ]
                }
            ]
        });

    }

    getNeedsAttentionTerminals() {
        return CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "ColumnSet",
                    "columns": [
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Terminal Name"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2671"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2412"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2222"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL4212"
                                }
                            ]
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Description"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Low Cash Unit"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Paper Jammed"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Paper Jammed"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Low Cash"
                                }
                            ]
                        }
                    ]
                }
            ]
        });

    }

    getAllTerminals() {
        return CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "ColumnSet",
                    "columns": [
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Terminal Name"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2671"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2412"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2222"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL4212"
                                }
                            ]
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Status"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "In Service"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Needs Attention"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Out of Service"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Lost Communication"
                                }
                            ]
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Description"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "NA"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Cash Low"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Power Failed"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Connection issue"
                                }
                            ]
                        }
                    ]
                }
            ]
        });

    }

    getAllOpenTickets() {
        return CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "ColumnSet",
                    "columns": [
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Incident ID"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "INC123234"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "INC123452"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "INC122222"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "INC152322"
                                }
                            ]
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Description"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Low Cash Unit"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Loss Comm"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Paper Jammed"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "Open Device Fault"
                                }
                            ]
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "weight": "bolder",
                                    "text": "Terminal Name"
                                },
                                {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2671"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2412"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL2222"
                                }, {
                                    "type": "TextBlock",
                                    "separator": true,
                                    "text": "TERMINAL4212"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        );
    }
}

module.exports.NiVA = NiVA;