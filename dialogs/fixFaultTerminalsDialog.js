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
const delay = ms => new Promise(res => setTimeout(res, ms));

var endDialog;

class FixFaultTerminalsDialog extends ComponentDialog {
    constructor(conversationState, conversationData) {
        super('FixFaultTerminalsDialog');

        this.conversationState = conversationState;
        this.conversationData = conversationData;

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [



            this.listAllFaultTerminalsStep.bind(this),
            this.selectTerminalStep.bind(this),
            this.terminalHelpStep.bind(this),
            this.getSupportStep.bind(this),
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
        console.log(entities);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id, entities);
        }
    }

    async listAllFaultTerminalsStep(step) {
        endDialog = false;
        step.values.terminal = step._info.options.Terminal_Name;
        if (step.values.terminal==undefined) {
            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
            // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
            await step.context.sendActivity('I see that you are from PNC,Paris,Central Zone');
            return await step.prompt(CHOICE_PROMPT, {
                prompt: 'Here are some of your ATMs',
                choices: ChoiceFactory.toChoices(['Terminal 2613', 'Terminal 2231', 'Terminal 3234', 'Terminal 4234'])
            });
        } else {
            return await step.context.sendActivity(`I see an issue with your ${step.values.terminal}`)
        }
    }

    async selectTerminalStep(step) {
        step.values.terminal = step.result.value;
        await step.context.sendActivity(`Here is how you can fix ${step.values.terminal}`);
        await step.context.sendActivity('Please go through this article');
        var link = 'https://study.com/articles/ATM_Repair_Course_and_Training_Information.html';
        await step.context.sendActivity(link)
        return await step.prompt(CONFIRM_PROMPT, 'Let me know if the above article helped.', ['Yes', 'No']);
    }

    async terminalHelpStep(step) {
        if (!step.result) {
            // await step.context.sendActivity("Do you want to connecto to our support team")
            return step.prompt(CONFIRM_PROMPT, 'Do you want to connect to our support team? ', ['Yes', 'No']);
        }
        else {
            endDialog = true;
            await step.context.sendActivity('Thanks for contacting, Have a great day ahead');
            return await step.endDialog();
        }
    }

    async getSupportStep(step) {
        if (step.result) {
            await step.context.sendActivity('Connecting to the live agent..');
            await delay(500);
            await step.context.sendActivity('All support executives are busy at the moment!');
            await step.context.sendActivity('I have created an Support Request for you - #REQ1232445');
            return await step.prompt(CONFIRM_PROMPT, 'Do you want to send an email?', ['yes', 'no']);
        }
        else {
            endDialog = true;
            await step.context.sendActivity('Thanks for contacting, Have a great day ahead!');
            return await step.endDialog();
        }
    }

    async confirmEmailStep(step) {
        if ((step.result)) {
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

    async isDialogComplete() {
        return endDialog;
    }
}

module.exports.FixFaultTerminalsDialog = FixFaultTerminalsDialog;