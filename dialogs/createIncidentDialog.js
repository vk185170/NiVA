const {
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
const TEXT_PROMPT = 'TEXT_PROMPT';
const delay = ms => new Promise(res => setTimeout(res, ms));

var endDialog;

class CreateIncidentDialog extends ComponentDialog {
    constructor(conversationState, conversationData) {
        super('CreateIncidentDialog');

        this.conversationState = conversationState;
        this.conversationData = conversationData;

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [



            this.promptforterminalstep.bind(this),
            this.promptforfaulttypestep.bind(this),
            this.createincidentstep.bind(this)

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
        // console.log(entities);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id, entities);
        }
    }

    async promptforterminalstep(step) {
        endDialog=false;
        step.values.terminalName = step._info.options.Terminal_Name;
        console.log("Terminal name " +step.values.terminalName);
        if (step.values.terminalName==undefined) {
            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
            // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
            return await step.prompt(TEXT_PROMPT, 'Please enter terminal on which we need to create incident');
             
        } else{
            return await step.next(step.values.terminalName)            
        }
    }

    async promptforfaulttypestep(step) {
        endDialog=false;
        step.values.faultType = step._info.options.Fault_Type;
        if(step.values.faultType==undefined)  {
            return await step.prompt(TEXT_PROMPT, 'Please enter status code for which we need create an incident');   
        } else{
            return await step.next(step.values.faultType)            
        }
    }

    async createincidentstep(step) {
            endDialog=true;
            await step.context.sendActivity(`INC2000318 created sucessfully!`)
            return await step.endDialog();
     
    }

    
    async isDialogComplete() {
        return endDialog;
    }
}

module.exports.CreateIncidentDialog = CreateIncidentDialog;