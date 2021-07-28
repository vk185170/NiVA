const { ActivityHandler, MessageFactory } = require('botbuilder');
const { FixFaultTerminalsDialog } = require('./dialogs/fixFaultTerminalsDialog');
const { IMSupportDialog } = require('./dialogs/imSupportDialog');
const { FeedbackDialog } = require('./dialogs/feedbackDialog');
const { CreateTerminalDialog } = require('./dialogs/createTerminalDialog');
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
        this.CreateTerminalDialog = new CreateTerminalDialog(this.conversationState, this.userState);

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
                const welcomeText = 'Hello and welcome to NiVA!';
                await context.sendActivity(welcomeText);
                await this.sendSuggestedActions(context);
            }
        }
    }

    async sendSuggestedActions(context) {
        var suggestions = MessageFactory.suggestedActions(['Incident Management Support', 'Fix Terminal Faults', 'Create a new Terminal', 'I have some Questions', 'I have some Feedback'], 'How may I enlighten your day with?');
        await context.sendActivity(suggestions);
    }

    async dispatchToIntentAsync(context, intent, entities) {
        var currentIntent = '';
        const previousIntent = await this.previousIntent.get(context, {});
        const conversationData = await this.conversationData.get(context, {});
        if (previousIntent.intentName && !conversationData.endDialog) {
            currentIntent = previousIntent.intentName;
        } else if (previousIntent.intentName && conversationData.endDialog) {
            currentIntent = intent;
        } else if(intent == 'None' && !previousIntent.intentName) {
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
                    // TODO
                    await this.conversationData.set(context, { endDialog: false });
                    await this.CreateTerminalDialog.run(context, this.dialogState, entities);
                    this.conversationState.endDialog = await this.CreateTerminalDialog.isDialogComplete();
                    if (this.conversationState.endDialog) {
                        await this.previousIntent.set(context, { intentName: null });
                        await this.sendSuggestedActions(context);
                    }
                    break;
                case 'Question':
                    console.log("Inside <Question> intent");
                    // TODO
                    await context.sendActivity('Please type your question.');
                    await this.previousIntent.set(context, { intentName: null });
                    break;
        }
    }

    async processFromKnowledgeBase(context) {
        console.log('Proccessing from QnA Maker');
        const results = await this.qnaMaker.getAnswers(context);

        if (results.length > 0) {
            await context.sendActivity(`${ results[0].answer }`);
        } else {
            await context.sendActivity('That may be beyond my abilities at the moment.');
        }
    }
}

module.exports.NiVA = NiVA;