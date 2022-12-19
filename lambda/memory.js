
function check (handlerInput, memory_vector, mem_words_user) {
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    let score_memory = 0;
            for (let word of memory_vector) {   
            word = word.replace(" ","");
            for (let user_word of mem_words_user) {
            if (word === user_word) {score_memory = score_memory + 2;}
            }     
        }
        sessionAttributes.score_memory = score_memory;
        attributesManager.setSessionAttributes(sessionAttributes);
}

function training(handlerInput) {
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    let speakOutput, speakOutput1, speakOutput2, speakOutput3 = "",reprompt ="";
    sessionAttributes.score_memory_training = sessionAttributes.score_memory;
            sessionAttributes.game_state = "FINISHED";
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
             speakOutput = `<amazon:emotion name="excited" intensity="medium"> Thank you. <break time="1s"/>  Your score is. ${sessionAttributes.score_memory}. </amazon:emotion> `;
             speakOutput1 = 'You have just complete the training.<break time="1s"/> <amazon:emotion name="excited" intensity="high"> Very Good!. </amazon:emotion>';
             speakOutput2 = " Say STOP to close the skill. The skill will automatically stop after 8 second. See you tomorrow!. ";
    return {speakOutput, speakOutput1, speakOutput2, speakOutput3};
}

function classification(handlerInput) {
    const {attributesManager, requestEnvelope} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    let speakOutput, speakOutput1, speakOutput2, speakOutput3 = "",reprompt ="";
    sessionAttributes.score_memory_classification = sessionAttributes.score_memory;
            sessionAttributes.classification_state = "FINISHED";
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            speakOutput = `<amazon:emotion name="excited" intensity="high">Thank you. Your score in memory part is. ${sessionAttributes.score_memory_classification}.</amazon:emotion> `;
            speakOutput1 = 'You have just complete the classification. <amazon:emotion name="excited" intensity="high"> Very Good!.<break time="1s"/>  Next time you open the skill we will start with the training. </amazon:emotion>';
            speakOutput2 = 'I suggest you to come back tomorrow. <break time="1s"/> Now take a rest? ';
            speakOutput3 = ' Say STOP to close the skill. The skill will automatically stop after 8 second. <break time="2s"/>Goodbye!. ';
    return {speakOutput, speakOutput1, speakOutput2, speakOutput3};
}

module.exports = {check, training, classification}