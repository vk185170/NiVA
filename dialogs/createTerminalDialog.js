const {
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    TextPrompt,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const NAME_PROMPT = 'NAME_PROMPT';

var endDialog;

class CreateTerminalDialog extends ComponentDialog {
    constructor(conversationState, conversationData) {
        super('CreateTerminalDialog');

        this.conversationState = conversationState;
        this.conversationData = conversationData;

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [

            

        this.newTerminal.bind(this),
        this.newTerminalSummaryStep.bind(this)
       // this.terminalCreateSummaryStep.bind(this)
        // this.selectTerminalStep.bind(this),
        // this.confirmEmailStep.bind(this)

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

    async newTerminal(step) {
        step.values.terminal = step._info.options.Terminal_Name;
        console.log(step.values.terminal);
        if(step.values.terminal == undefined){
            return await step.prompt(NAME_PROMPT, 'Please enter the terminal Name.');}
        else{
            return await step.next(step.values.terminal)            
        }
    }

    async newTerminalSummaryStep(step) {
        step.values.name = step.result;
        await step.context.sendActivity('New Terminal has been created');
        await step.context.sendActivity(`Terminal Name: ${ step.result }.`);
        await step.context.sendActivity('IP Address: 192.168.123.1');
        await step.context.sendActivity('Zone: Atlanta');
        endDialog = true;
        return step.endDialog();
    }


    async isDialogComplete(){
        return endDialog;
    }
}

module.exports.CreateTerminalDialog = CreateTerminalDialog;