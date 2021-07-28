const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

var endDialog;

class FeedbackDialog extends ComponentDialog {
    constructor(conversationState, conversationData) {
        super('IMSupportDialog');

        this.conversationState = conversationState;
        this.conversationData = conversationData;

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [

            

        this.productCategoryStep.bind(this),
        this.selectTerminalStep.bind(this),
        this.confirmationStepForTerminalHelp.bind(this),
        this.connectToSupportCall.bind(this),
        this.confirmEmailStep.bind(this)

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

    async productCategoryStep(step) {
        endDialog = false;
        step.values.product = step._info.options.product;
        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please select the product category',
            choices: ChoiceFactory.toChoices(['Active Enterprise', 'Vision', 'MESH', 'EPSS', 'UA'])
        });
    }

    async selectTerminalStep(step) {
        step.values.product = step.result.value;

            await step.context.sendActivity("I see that this Terminal has d<Issue Code/Status coe> and Need <Action> based on <Action code> ");
            return await step.prompt(CHOICE_PROMPT, {
                prompt: 'Do you want me to help you how to fix it?.',
                choices: ChoiceFactory.toChoices(['yes', 'no'])
            });
        }
    
        async terminalHelpStep(step) {
            step.values.terminalSelfFixConfirmation = step.result.value;
            if (step.values.terminalSelfFixConfirmation === true) {
                await step.context.sendActivity("Here is the Manual for Replenishing the Activate Terminal");
                return await step.prompt(CHOICE_PROMPT, {
                    prompt: 'Let me know if it helps..',
                    choices: ChoiceFactory.toChoices(['yes', 'no'])
                });
            }
            else {
                endDialog = true;
                return await step.context.sendActivity('Okay, Is there anything you want me help?');
            }
        }
    
        async getSupportStep(step) {
            step.values.connectToSupport = step.result.value;
            if (step.values.connectToSupport === true) {
                await step.context.sendActivity('All support executives are busy right now..');
                await step.context.sendActivity('I have created an Support Request for you - #REQ1232445');
                return await step.prompt(CHOICE_PROMPT, {
                    prompt: 'Do you want to send an email?',
                    choices: ChoiceFactory.toChoices(['yes', 'no'])
                });
            }
            else {
                return await step.context.sendActivity('Thanks for contacting, Have a great day ahead!')
            }
        }
    
        async confirmEmailStep(step) {
            step.values.email = step.result.value;
            if (step.values.email) {
                await step.context.sendActivity('Email sent!')
                await step.context.sendActivity('Ok, I understand, you want to fix yourself. I just want to remind you that the SLA for this incident is ___ hrs. and should be resolved by HH:MM:SS');
                endDialog = true;
                return await step.endDialog();
            }
            else {
                await step.context.sendActivity('Thanks for contacting, Have a great day ahead!');
                endDialog = true;
                return await step.endDialog();
            }
        }

    async isDialogComplete(){
        return endDialog;
    }
}

module.exports.FeedbackDialog = FeedbackDialog;