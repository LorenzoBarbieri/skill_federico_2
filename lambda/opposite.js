const words1 = ["hot", "dark", "strong", "tall", "big", "slow", "white", "expansive", "rare", "good", "narrow", "dirty","near", "external", "first", "extrovert"];
const words2 = ["cold", "bright", "weak", "short", "small",  "fast", "black", "cheap", "common", "bad", "wide", "clean", "far", "internal", "last", "shy"];
const question_opposite = ['This is the first word. Say the opposite of:  ', 
                  'This is the second word. Say the opposite of:  ',
                  'This is the third word. Say the opposte of:  '];
const words = ["dog","boy","bee"];

 function confronto(slot, value)
 
 {
    if (slot.value !== undefined)
         if (slot.value.toString().toLowerCase() === value.toString().toLowerCase())
           return true;
 }
 
function check(handlerInput,word_opp) {
    const {attributesManager, requestEnvelope} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
        const isCorrect = confronto(word_opp, words2[sessionAttributes.indice])
        if (isCorrect)  {  sessionAttributes.score_opposite +=1;  }
        sessionAttributes.count_opposite +=1;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
}
                  
function newGame (handlerInput) {
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes()|| {};
    let speakOutput, speakOutput1 = " ",speakOutput2 ="", reprompt;
        if (sessionAttributes.count_opposite>2) {
            sessionAttributes.game_state = "LANGUAGE";
            speakOutput = sessionAttributes.score_opposite + ". " +`<amazon:emotion name="excited" intensity="medium">The opposite game is finished!<break time="1s"/> </amazon:emotion>`;
            speakOutput1 =' <break time="1s"/>The next part is about language. ';
            let index = 0;
            sessionAttributes.score_language = 0;
            sessionAttributes.index = 0;
            sessionAttributes.language_word = words[sessionAttributes.index];
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            speakOutput2 = 'I will say a word! <break time="1s"/> Try to spell this word: ' + words[index];
            reprompt = speakOutput2;
    
        }
        else {
            const old_indice = sessionAttributes.indice;
            sessionAttributes.indice = [Math.floor(Math.random()*words1.length)];
            for (let i = 0; i<3; i++) {
            if (sessionAttributes.indice === old_indice) {
                sessionAttributes.indice = [Math.floor(Math.random()*words1.length)];
            }
            }
            const randomword = words1[sessionAttributes.indice];
            sessionAttributes.opposite_word = randomword;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            speakOutput = sessionAttributes.score_opposite + ". " + question_opposite[sessionAttributes.count_opposite]+ " " + randomword;
            reprompt = speakOutput;
        }
        return {speakOutput, speakOutput1, speakOutput2, reprompt};
}


module.exports = {check, newGame}