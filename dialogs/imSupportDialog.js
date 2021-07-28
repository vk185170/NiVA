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

class IMSupportDialog extends ComponentDialog {
    constructor(conversationState, conversationData) {
        super('IMSupportDialog');

        this.conversationState = conversationState;
        this.conversationData = conversationData;
        this.addDialog(new TextPrompt(FEEDBACK_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [

            

        this.productCategoryStep.bind(this),
        this.HelpWithProductCategoryStep.bind(this),
        this.confirmProductCategoryStep.bind(this),
        this.queryStep.bind(this),
        this.suggestionStep.bind(this)

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

    async HelpWithProductCategoryStep(step) {
        step.values.product = step.result.value;
        if(step.values.product === 'Vision'){
            return await step.prompt(CHOICE_PROMPT, {
                prompt: 'I am happy to help you with Vision, Please let us know which version of Vision you are using?',
                choices: ChoiceFactory.toChoices(['Vision 2x', 'Vision 3x','Vision 4x'])
            });
        }
        else if(step.values.product==='Active Enterprise'||step.values.product==='MESH'||step.values.product==='EPSS'||step.values.product==='UA'){
            await step.context.sendActivity('Currently we are brewing up our AI capabilites to support this area. Please revisit after sometime or key in your email ID so we can keep you posted. ')
            endDialog = true
            return await step.endDialog();
        }
    }
        async confirmProductCategoryStep(step){
            step.values.version = step.result.value;
            if(step.values.version[0]==='V'){
                if(step.values.version === 'Vision 2x' || step.values.version === 'Vision 3x'){
                    await step.context.sendActivity('Oh! Have you ever thought of upgrading to Vision 4.x. I am sure a lot of such issues wont be there.')
                    endDialog = true
                    return await step.endDialog();
                }
                else{
                    return await step.prompt(CHOICE_PROMPT, {
                        prompt: 'Sorry to hear that you are facing issue with Vision 4.x. Kindly choose among the below areas where you are facing issue',
                        choices: ChoiceFactory.toChoices(['IM', 'EJ','SD','UA','MS'])
                    });

                }
            }
            else{
                await step.context.sendActivity('Thank you for contacting us');
                return await step.endDialog();
            }
        }
        async queryStep(step) {
            step.values.product =  step.result.value;
            return await step.prompt(FEEDBACK_PROMPT, `Please share the details of the issue you are facing with ${step.values.product}`);
        }
        async suggestionStep(step){
            step.values.query = step.result.value;
            await step.context.sendActivity('We have sent it over our hotline to the concerned team');
            endDialog = true;
            return await step.endDialog();
        }
        

    async isDialogComplete(){
        return endDialog; //
    }
}

module.exports.IMSupportDialog = IMSupportDialog;