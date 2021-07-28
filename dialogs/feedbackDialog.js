const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const FEEDBACK_PROMPT = 'FEEDBACK_PROMPT';

var endDialog;

class FeedbackDialog extends ComponentDialog {
    constructor(conversationState, conversationData) {
        super('FeedbackDialog');

        this.conversationState = conversationState;
        this.conversationData = conversationData;
        this.addDialog(new TextPrompt(FEEDBACK_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [

            this.feedbackStep.bind(this),
            this.confirmFeedbackStep.bind(this)
     

        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     * @param {*} entities
     */
    async run(turnContext, accessor, entities) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id, entities);
        }
    }

    async feedbackStep(step) {
        return await step.prompt(FEEDBACK_PROMPT, 'Please enter your feedback/suggestion.');
    }

    async confirmFeedbackStep(step) {
        step.values.feedbackStep = step.result;
        console.log("feedback recieved");
        endDialog = true;
        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        await step.context.sendActivity('Thanks for your amazing and valuable suggestion!');
        await step.context.sendActivity('We\'ve sent it over our hotline to the concerned teams and after required vetting it will get added to the to-do-list of our Engineering and Product teams.')
        return await step.endDialog();
    }

    async isDialogComplete(){
        return endDialog;
    }
}

module.exports.FeedbackDialog = FeedbackDialog;